import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";
import { getWavespeedProviderRuntimeConfig } from "../src/shared/lib/wavespeed-provider-config";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const INPUT_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-generator-by-prompt.templates.llm-rewritten.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-generator-by-prompt.templates.llm-rewritten.images.json",
);

const API_URL =
  "https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image";
const DEFAULT_RESOLUTION = "2k";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;
const OUTPUT_PREFIX = "zencreator/generator-by-prompt";

type TemplateRecord = {
  TemplateName: string;
  prompt: string;
  imageUrl?: string;
  sourceImageUrl?: string;
  status?: "success" | "failed";
  error?: string;
};

type TemplateFile = {
  source?: string;
  generated_by?: string;
  generated_at?: string;
  total_templates?: number;
  templates: TemplateRecord[];
};

type SubmitResponse = {
  code?: number;
  message?: string;
  data?: {
    outputs?: string[];
    urls?: {
      get?: string;
    };
    status?: string;
    error?: string;
  };
};

const ossConfig = {
  region: process.env.OSS_REGION || "",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "",
  endpoint: process.env.OSS_ENDPOINT || "",
  publicDomain: process.env.OSS_PUBLIC_DOMAIN || "https://ocdn.10b.ai",
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

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildOSSKey(templateName: string, prompt: string) {
  const slug = sanitizeSlug(templateName || "template");
  const hash = createHash("md5")
    .update(`${templateName}\n${prompt}`)
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-${hash}.png`;
}

async function saveOutput(file: TemplateFile) {
  file.total_templates = file.templates.length;
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
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

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai zencreator batch)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const { apiKey: wavespeedApiKey } = await getWavespeedProviderRuntimeConfig();

  if (
    !ossConfig.region ||
    !ossConfig.accessKeyId ||
    !ossConfig.accessKeySecret ||
    !ossConfig.bucket
  ) {
    throw new Error(
      "缺少 OSS 配置。请设置 OSS_REGION、OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET。",
    );
  }

  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const input = JSON.parse(raw) as TemplateFile;
  const existing = await fs
    .readFile(OUTPUT_PATH, "utf8")
    .then((content) => JSON.parse(content) as TemplateFile)
    .catch(() => null);

  const force = process.argv.includes("--force");
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || String(input.templates.length));

  const output: TemplateFile = existing || {
    source: input.source,
    generated_by: "wavespeed nano-banana-2 + oss upload",
    generated_at: new Date().toISOString(),
    total_templates: input.templates.length,
    templates: input.templates.map((item) => ({ ...item })),
  };

  if (!existing) {
    await saveOutput(output);
  }

  const ossProvider = createOSSProvider(ossConfig);
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let index = 0; index < output.templates.length; index += 1) {
    const displayIndex = index + 1;
    if (displayIndex < start || displayIndex > end) {
      continue;
    }

    const current = output.templates[index];
    const source = input.templates[index];

    current.TemplateName = source.TemplateName;
    current.prompt = source.prompt;

    if (current.imageUrl && !force) {
      console.log(
        `[${displayIndex}/${output.templates.length}] 跳过: ${current.TemplateName}`,
      );
      skippedCount += 1;
      continue;
    }

    console.log(
      `[${displayIndex}/${output.templates.length}] 生成中: ${current.TemplateName}`,
    );

    try {
      const sourceImageUrl = await submitTask(wavespeedApiKey, current.prompt);
      const imageBuffer = await downloadImage(sourceImageUrl);
      const key = buildOSSKey(current.TemplateName, current.prompt);
      const upload = await ossProvider.uploadFile({
        body: imageBuffer,
        key,
        contentType: "image/png",
        disposition: "inline",
      });

      if (!upload.success || !upload.url) {
        throw new Error(upload.error || "上传 OSS 失败");
      }

      current.sourceImageUrl = sourceImageUrl;
      current.imageUrl = upload.url;
      current.status = "success";
      delete current.error;

      successCount += 1;
      await saveOutput(output);
      console.log(
        `[${displayIndex}/${output.templates.length}] 完成: ${upload.url}`,
      );
    } catch (error) {
      current.status = "failed";
      current.error = error instanceof Error ? error.message : String(error);
      failedCount += 1;
      await saveOutput(output);
      console.error(
        `[${displayIndex}/${output.templates.length}] 失败: ${current.TemplateName} - ${current.error}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        output: OUTPUT_PATH,
        total: output.templates.length,
        successCount,
        skippedCount,
        failedCount,
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
