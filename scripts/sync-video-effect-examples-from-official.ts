import fs from "node:fs/promises";
import path from "node:path";

type VideoEffectSampleRecord = Record<
  string,
  {
    sourceImageUrl?: string;
    sampleVideoUrl?: string;
    samplePreviewClipUrl?: string;
    examples?: Array<{
      inputImageUrl?: string;
      outputVideoUrl?: string;
      outputPreviewClipUrl?: string;
    }>;
    [key: string]: unknown;
  }
>;

type BaseItem = {
  slug: string;
  modelPath: string;
};

const SAMPLE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/video-effect-samples.json",
);
const DATA_SOURCE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/video-effect-data.ts",
);

function extractBaseItems(source: string): BaseItem[] {
  const matches = [
    ...source.matchAll(
      /\{\s*slug:\s*"([^"]+)"[\s\S]*?modelPath:\s*"([^"]+)"\s*\}/g,
    ),
  ];

  return matches.map((match) => ({
    slug: match[1],
    modelPath: match[2],
  }));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function getParentDir(url: string) {
  return url.replace(/\/[^/]+$/i, "");
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai video-effect sync)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when fetching ${url}`);
  }

  return response.text();
}

function extractOfficialExamples(html: string) {
  const images = unique(
    html.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s<]+\.(?:jpg|jpeg|png|webp)/gi,
    ) || [],
  );
  const videos = unique(
    html.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s<]+\/1\.mp4/gi,
    ) || [],
  );

  const videoMap = new Map(videos.map((url) => [getParentDir(url), url]));
  const examples = images
    .map((inputImageUrl) => {
      const outputVideoUrl = videoMap.get(getParentDir(inputImageUrl));
      if (!outputVideoUrl) return null;
      return {
        inputImageUrl,
        outputVideoUrl,
        outputPreviewClipUrl: outputVideoUrl,
      };
    })
    .filter(Boolean) as Array<{
    inputImageUrl: string;
    outputVideoUrl: string;
    outputPreviewClipUrl: string;
  }>;

  return examples;
}

async function main() {
  const [sampleRaw, sourceRaw] = await Promise.all([
    fs.readFile(SAMPLE_PATH, "utf8"),
    fs.readFile(DATA_SOURCE_PATH, "utf8"),
  ]);

  const sampleData = JSON.parse(sampleRaw) as VideoEffectSampleRecord;
  const baseItems = extractBaseItems(sourceRaw);

  let updated = 0;
  const missing: string[] = [];

  for (const item of baseItems) {
    const pageUrl = `https://wavespeed.ai/models/${item.modelPath}`;

    try {
      const html = await fetchHtml(pageUrl);
      const examples = extractOfficialExamples(html);

      if (!examples.length) {
        missing.push(item.slug);
        continue;
      }

      sampleData[item.slug] = {
        ...sampleData[item.slug],
        sourceImageUrl: examples[0].inputImageUrl,
        sampleVideoUrl: examples[0].outputVideoUrl,
        samplePreviewClipUrl: examples[0].outputPreviewClipUrl,
        examples,
      };
      updated += 1;
      console.log(`[${item.slug}] synced ${examples.length} examples`);
    } catch (error) {
      missing.push(item.slug);
      console.warn(
        `[${item.slug}] sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  await fs.writeFile(SAMPLE_PATH, `${JSON.stringify(sampleData, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        updated,
        missingCount: missing.length,
        missing,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
