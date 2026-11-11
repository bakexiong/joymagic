import fs from "node:fs/promises";
import path from "node:path";
import { getWavespeedProviderRuntimeConfig } from "../src/shared/lib/wavespeed-provider-config";

const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

const API_URL = "https://api.wavespeed.ai/api/v3/google/nano-banana-2/edit";
const DEFAULT_RESOLUTION = "2k";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;
const MAX_SUBMIT_ATTEMPTS = 3;

type ExampleRecord = {
  inputImageUrl?: string;
  inputImageUrls?: string[];
  outputImageUrl?: string;
};

type ImageEffectSampleRecord = Record<
  string,
  {
    title: string;
    coverUrl?: string;
    nanoBananaPrompt?: string;
    examples?: ExampleRecord[];
  }
>;

type SubmitResponse = {
  code?: number;
  message?: string;
  data?: {
    id?: string;
    outputs?: string[];
    urls?: {
      get?: string;
    };
    status?: string;
    error?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function getHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function submitEditTask(
  apiKey: string,
  imageUrls: string[],
  prompt: string,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(apiKey),
        body: JSON.stringify({
          images: imageUrls,
          prompt,
          mediaType: "image",
          enable_base64_output: false,
          enable_sync_mode: false,
          seed: -1,
          resolution: DEFAULT_RESOLUTION,
          resoluation: DEFAULT_RESOLUTION,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交任务失败: HTTP ${response.status}`);
      }

      const result = (await response.json()) as SubmitResponse;

      if (result.code !== 200 || !result.data) {
        throw new Error(result.message || "提交任务失败: 返回结构异常");
      }

      if (result.data.outputs?.[0]) {
        return result.data.outputs[0];
      }

      if (!result.data.urls?.get) {
        throw new Error("提交任务失败: 未返回结果查询地址");
      }

      return pollResult(apiKey, result.data.urls.get);
    } catch (error) {
      lastError = error;

      if (attempt < MAX_SUBMIT_ATTEMPTS) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("提交任务失败");
}

async function pollResult(apiKey: string, resultUrl: string) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(resultUrl, {
      headers: getHeaders(apiKey),
    });

    if (!response.ok) {
      throw new Error(`查询结果失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as SubmitResponse;
    const data = result.data;

    if (result.code !== 200 || !data) {
      throw new Error(result.message || "查询结果失败: 返回结构异常");
    }

    if (data.outputs?.[0]) {
      return data.outputs[0];
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `任务失败: ${data.status}`);
    }

    if (data.status === "completed") {
      throw new Error("任务已完成，但未返回输出图片");
    }
  }

  throw new Error("任务超时，未在规定时间内完成");
}

async function saveSamples(samples: ImageEffectSampleRecord) {
  await fs.writeFile(
    INPUT_PATH,
    `${JSON.stringify(samples, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const { apiKey } = await getWavespeedProviderRuntimeConfig();

  const slugFilter = getArgValue("slug");
  const slugPrefix = getArgValue("slug-prefix");
  const exampleIndexArg = getArgValue("example-index");
  const exampleIndex = exampleIndexArg ? Number(exampleIndexArg) : undefined;
  const inputUrl = getArgValue("input-url");
  const force = process.argv.includes("--force");

  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const samples = JSON.parse(raw) as ImageEffectSampleRecord;

  if (slugFilter && inputUrl) {
    const record = samples[slugFilter];

    if (!record) {
      throw new Error(`未找到 slug: ${slugFilter}`);
    }

    if (!Array.isArray(record.examples)) {
      record.examples = [];
    }

    const existingIndex = record.examples.findIndex(
      (example) => example.inputImageUrl === inputUrl,
    );

    if (existingIndex >= 0) {
      console.log(
        `[${slugFilter}] 已存在相同 inputImageUrl，复用 example ${
          existingIndex + 1
        }`,
      );
    } else {
      record.examples.push({
        inputImageUrl: inputUrl,
      });
      await saveSamples(samples);
      console.log(`[${slugFilter}] 已新增 example: ${inputUrl}`);
    }
  }

  const targets = Object.entries(samples).filter(([slug, record]) => {
    if (slugFilter && slug !== slugFilter) return false;
    if (slugPrefix && !slug.startsWith(slugPrefix)) return false;
    return Array.isArray(record.examples) && record.examples.length > 0;
  });

  let total = 0;
  let updated = 0;
  let skipped = 0;

  for (const [slug, record] of targets) {
    const prompt = record.nanoBananaPrompt?.trim();

    if (!prompt) {
      console.warn(`[${slug}] 跳过: 缺少 nanoBananaPrompt`);
      skipped += record.examples?.length ?? 0;
      continue;
    }

    const examples = record.examples ?? [];

    for (let index = 0; index < examples.length; index += 1) {
      if (
        typeof exampleIndex === "number" &&
        Number.isFinite(exampleIndex) &&
        index !== exampleIndex
      ) {
        continue;
      }

      total += 1;

      const example = examples[index];
      const label = `[${slug}] example ${index + 1}/${examples.length}`;
      const inputImageUrls = (
        example.inputImageUrls?.length
          ? example.inputImageUrls
          : example.inputImageUrl
            ? [example.inputImageUrl]
            : []
      ).filter(Boolean);

      if (inputImageUrls.length === 0) {
        console.warn(`${label} 跳过: 缺少 inputImageUrl/inputImageUrls`);
        skipped += 1;
        continue;
      }

      if (example.outputImageUrl && !force) {
        console.log(`${label} 跳过: 已有 outputImageUrl，如需覆盖请加 --force`);
        skipped += 1;
        continue;
      }

      console.log(`${label} 生成中...`);

      try {
        const referenceImages = [...inputImageUrls, record.coverUrl].filter(
          (value, valueIndex, array): value is string =>
            Boolean(value) && array.indexOf(value) === valueIndex,
        );

        const outputImageUrl = await submitEditTask(
          apiKey,
          referenceImages,
          prompt,
        );

        example.outputImageUrl = outputImageUrl;
        updated += 1;
        await saveSamples(samples);
        console.log(`${label} 完成: ${outputImageUrl}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${label} 失败: ${message}`);
      }
    }
  }

  console.log(
    `处理完成: total=${total}, updated=${updated}, skipped=${skipped}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
