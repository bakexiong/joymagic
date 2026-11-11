import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import {
  getVideoEffectItems,
  type VideoEffectItem,
} from "../src/shared/lib/video-effect-data";
import { getWavespeedProviderRuntimeConfig } from "../src/shared/lib/wavespeed-provider-config";

type PredictionResponse = {
  code: number;
  message: string;
  data: {
    id: string;
    status: "pending" | "created" | "processing" | "completed" | "failed";
    outputs?: string[];
    error?: string;
    urls?: {
      get?: string;
    };
  };
};

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/video-effect-samples.json",
);

let cachedWavespeedConfig: Awaited<
  ReturnType<typeof getWavespeedProviderRuntimeConfig>
> | null = null;

async function getWavespeedConfig() {
  if (!cachedWavespeedConfig) {
    cachedWavespeedConfig = await getWavespeedProviderRuntimeConfig();
  }
  return cachedWavespeedConfig;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitTask(slug: string, image: string) {
  const { apiKey, baseUrl } = await getWavespeedConfig();
  const item = (await getVideoEffectItems()).find(
    (entry) => entry.slug === slug,
  );
  const modelPath = item?.modelPath || `video-effects/${slug}`;
  const apiBase = `${baseUrl}/api/v3`;
  const response = await fetch(`${apiBase}/${modelPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image }),
  });

  if (!response.ok) {
    throw new Error(`Submit failed for ${slug}: HTTP ${response.status}`);
  }

  const json = (await response.json()) as PredictionResponse;
  if (!json.data?.id) {
    throw new Error(`Submit failed for ${slug}: missing task id`);
  }

  return {
    taskId: json.data.id,
    resultUrl:
      json.data.urls?.get || `${apiBase}/predictions/${json.data.id}/result`,
  };
}

type ExampleCandidate = {
  image: string;
  exampleVideo?: string;
  exemplar?: boolean;
};

type VideoEffectSampleRecord = {
  sourceImageUrl?: string;
  sampleTaskId?: string;
  sampleVideoUrl?: string;
  sampleGeneratedAt?: string;
  examples?: Array<{
    inputImageUrl?: string;
    outputVideoUrl?: string;
  }>;
  error?: string;
  failedAt?: string;
};

type ScoredExampleCandidate = {
  candidate: ExampleCandidate;
  metadata: { width: number; height: number } | null;
  score: number;
};

async function fetchImageMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; 10b.ai sample generator)",
      },
    });
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const metadata = await sharp(Buffer.from(arrayBuffer)).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch {
    return null;
  }
}

function scoreCandidate(
  candidate: ExampleCandidate,
  metadata: { width: number; height: number } | null,
) {
  let score = 0;

  if (candidate.exampleVideo) {
    score += 40;
  }

  if (candidate.exemplar) {
    score += 12;
  }

  if (metadata && metadata.width > 0 && metadata.height > 0) {
    const ratio = metadata.width / metadata.height;
    const portraitTarget = 9 / 16;
    const portraitDistance = Math.abs(ratio - portraitTarget);

    if (ratio < 1) {
      score += 28;
    }

    score += Math.max(0, 20 - portraitDistance * 40);
    score += Math.min(12, (metadata.width * metadata.height) / 250000);
  }

  if (/\.(jpg|jpeg|png)(\?|$)/i.test(candidate.image)) {
    score += 4;
  }

  return score;
}

async function fetchOfficialExampleCandidates(
  slug: string,
): Promise<ScoredExampleCandidate[]> {
  const item = (await getVideoEffectItems()).find(
    (entry) => entry.slug === slug,
  );
  const modelPath = item?.modelPath || `video-effects/${slug}`;
  const pageUrl = `https://wavespeed.ai/models/${modelPath}`;
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai sample generator)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch model page for ${slug}: HTTP ${response.status}`,
    );
  }

  const html = await response.text();
  const candidates = new Map<string, ExampleCandidate>();
  const imageMatches =
    html.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s]+\.(?:jpg|jpeg|png)/gi,
    ) || [];

  const videoMatches =
    html.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s]+\/1\.mp4/gi,
    ) || [];

  const normalizedVideos = new Set(
    videoMatches.map((url) => url.toLowerCase()),
  );

  for (const image of imageMatches) {
    const parentPath = image.replace(/\/[^/]+\.(?:jpg|jpeg|png)$/i, "");
    const exampleVideo = `${parentPath}/1.mp4`;

    candidates.set(image, {
      image,
      exampleVideo: normalizedVideos.has(exampleVideo.toLowerCase())
        ? exampleVideo
        : undefined,
      exemplar:
        html.includes(`"image":"${image}"`) && html.includes('"exemplar":true'),
    });
  }

  const candidateList = [...candidates.values()];
  if (candidateList.length === 0) {
    throw new Error(`Official example images not found for ${slug}`);
  }

  const scored = await Promise.all(
    candidateList.map(async (candidate) => {
      const metadata = await fetchImageMetadata(candidate.image);
      return {
        candidate,
        metadata,
        score: scoreCandidate(candidate, metadata),
      };
    }),
  );

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

async function pollResult(resultUrl: string, slug: string) {
  const { apiKey } = await getWavespeedConfig();
  const startedAt = Date.now();

  while (Date.now() - startedAt < 1000 * 60 * 8) {
    const response = await fetch(resultUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Poll failed for ${slug}: HTTP ${response.status}`);
    }

    const json = (await response.json()) as PredictionResponse;
    const data = json.data;

    if (data.status === "completed") {
      const output = data.outputs?.[0];
      if (!output) {
        throw new Error(`No output returned for ${slug}`);
      }
      return output;
    }

    if (data.status === "failed") {
      throw new Error(data.error || `Generation failed for ${slug}`);
    }

    await sleep(2500);
  }

  throw new Error(`Timed out waiting for ${slug}`);
}

async function readCurrentSamples() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, "utf8");
    return JSON.parse(raw) as Record<string, VideoEffectSampleRecord>;
  } catch {
    return {};
  }
}

async function writeSamples(samples: Record<string, VideoEffectSampleRecord>) {
  const latestSamples = await readCurrentSamples();
  const mergedSamples = {
    ...latestSamples,
    ...samples,
  };
  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(mergedSamples, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const force = args.has("--force");
  const syncExamplesOnly = args.has("--sync-examples-only");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const slugArg = process.argv.find((arg) => arg.startsWith("--slug="));
  const slug = slugArg ? slugArg.split("=")[1] : undefined;
  const imageArg = process.argv.find((arg) => arg.startsWith("--image="));
  const overrideImage = imageArg
    ? imageArg.slice("--image=".length)
    : undefined;

  const currentSamples = await readCurrentSamples();
  const allItems = await getVideoEffectItems();
  const targetItems = slug
    ? allItems.filter((item: VideoEffectItem) => item.slug === slug)
    : allItems;

  if (slug && targetItems.length === 0) {
    throw new Error(`Unknown video effect slug: ${slug}`);
  }

  const items = targetItems
    .filter((item) =>
      syncExamplesOnly || force || slug
        ? true
        : !currentSamples[item.slug]?.sampleVideoUrl,
    )
    .slice(0, limit || targetItems.length);

  console.log(
    `${syncExamplesOnly ? "Syncing official example images" : "Generating"} ${items.length} video effect samples...`,
  );

  for (const item of items) {
    try {
      let candidates: ScoredExampleCandidate[] | null = null;
      let sourceImageUrl: string;

      if (overrideImage) {
        sourceImageUrl = overrideImage;
        console.log(`\n[${item.slug}] use override image: ${sourceImageUrl}`);
      } else {
        console.log(`\n[${item.slug}] fetch official example images`);
        candidates = await fetchOfficialExampleCandidates(item.slug);
        const best = candidates[0];
        sourceImageUrl = best.candidate.image;
        console.log(
          `[${item.slug}] picked source image: ${sourceImageUrl} (score=${best.score.toFixed(
            2,
          )}, candidates=${candidates.length})`,
        );
      }

      const previousSampleVideoUrl = currentSamples[item.slug]?.sampleVideoUrl;
      const examples = overrideImage
        ? [
            {
              inputImageUrl: overrideImage,
              outputVideoUrl: previousSampleVideoUrl,
            },
          ]
        : (candidates || [])
            .map(({ candidate }) => ({
              inputImageUrl: candidate.image,
              outputVideoUrl: candidate.exampleVideo,
            }))
            .filter(
              (
                example,
              ): example is {
                inputImageUrl: string;
                outputVideoUrl: string;
              } => Boolean(example.inputImageUrl && example.outputVideoUrl),
            );

      currentSamples[item.slug] = {
        ...(currentSamples[item.slug] || {}),
        examples,
      };

      if (syncExamplesOnly) {
        await writeSamples(currentSamples);
        await sleep(300);
        continue;
      }

      console.log(`[${item.slug}] submit`);
      const { taskId, resultUrl } = await submitTask(item.slug, sourceImageUrl);
      console.log(`[${item.slug}] task id: ${taskId}`);

      const sampleVideoUrl = await pollResult(resultUrl, item.slug);
      console.log(`[${item.slug}] done: ${sampleVideoUrl}`);

      currentSamples[item.slug] = {
        ...(currentSamples[item.slug] || {}),
        examples: examples.map((example) => ({
          ...example,
          outputVideoUrl: sampleVideoUrl,
        })),
        sourceImageUrl,
        sampleTaskId: taskId,
        sampleVideoUrl,
        sampleGeneratedAt: new Date().toISOString(),
        error: undefined,
      };
    } catch (error: any) {
      const message =
        error instanceof Error
          ? error.message
          : String(error || "Unknown error");
      console.error(`[${item.slug}] failed: ${message}`);
      currentSamples[item.slug] = {
        ...(currentSamples[item.slug] || {}),
        error: message,
        failedAt: new Date().toISOString(),
      };
    }

    await writeSamples(currentSamples);
    await sleep(1200);
  }

  console.log("\nAll requested samples generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
