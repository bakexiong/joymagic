import fs from "node:fs/promises";
import path from "node:path";
import { getWavespeedProviderRuntimeConfig } from "../src/shared/lib/wavespeed-provider-config";

const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

const API_URL =
  "https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image";
const DEFAULT_RESOLUTION = "2k";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;

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
    baseImagePrompt?: string;
    baseImagePrompts?: string[];
    requiredInputCount?: number;
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

async function submitTask(apiKey: string, prompt: string) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      prompt,
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
  const force = process.argv.includes("--force");

  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const samples = JSON.parse(raw) as ImageEffectSampleRecord;

  const targets = Object.entries(samples).filter(([slug, record]) => {
    if (slugFilter && slug !== slugFilter) return false;
    if (slugPrefix && !slug.startsWith(slugPrefix)) return false;
    return Boolean(record.baseImagePrompt?.trim());
  });

  let total = 0;
  let updated = 0;
  let skipped = 0;

  for (const [slug, record] of targets) {
    total += 1;

    const label = `[${slug}]`;
    const prompts = (
      record.baseImagePrompts?.length
        ? record.baseImagePrompts
        : record.baseImagePrompt
          ? [record.baseImagePrompt]
          : []
    )
      .map((item) => item.trim())
      .filter(Boolean);
    const requiredInputCount = Math.max(
      record.requiredInputCount || 0,
      prompts.length,
      1,
    );

    if (prompts.length === 0) {
      console.warn(`${label} 跳过: 缺少 baseImagePrompt/baseImagePrompts`);
      skipped += 1;
      continue;
    }

    const currentInputs =
      record.examples?.[0]?.inputImageUrls?.filter(Boolean) || [];
    if (currentInputs.length >= requiredInputCount && !force) {
      console.log(`${label} 跳过: 已有 inputImageUrls，如需覆盖请加 --force`);
      skipped += 1;
      continue;
    }

    console.log(`${label} 原图生成中... (${requiredInputCount} 张)`);

    try {
      const generatedUrls: string[] = [];

      for (let index = 0; index < requiredInputCount; index += 1) {
        const prompt = prompts[index] || prompts[prompts.length - 1];
        const itemLabel = `${label} 原图 ${index + 1}/${requiredInputCount}`;
        console.log(`${itemLabel} 提交中...`);
        const inputImageUrl = await submitTask(apiKey, prompt);
        generatedUrls.push(inputImageUrl);
        console.log(`${itemLabel} 完成: ${inputImageUrl}`);
      }

      if (!Array.isArray(record.examples) || record.examples.length === 0) {
        record.examples = [{}];
      }

      record.examples[0].inputImageUrl = generatedUrls[0];
      record.examples[0].inputImageUrls = generatedUrls;
      delete record.examples[0].outputImageUrl;
      record.coverUrl = generatedUrls[0];

      updated += 1;
      await saveSamples(samples);
      console.log(`${label} 原图完成: ${generatedUrls.join(", ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${label} 原图失败: ${message}`);
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
