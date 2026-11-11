import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

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
  "docs/zencreator-generator-by-prompt.templates.gpt-image-2-images.json",
);

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const GENERATE_PATH = "/api/ai/gpt-image-2-text-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "gpt-image-2-text-to-image";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;
const OUTPUT_PREFIX = "zencreator/generator-by-prompt";

type TemplateRecord = {
  TemplateName: string;
  prompt: string;
  requestId?: string;
  sourceImageUrl?: string;
  imageUrl?: string;
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

function buildDiversityPrompt(prompt: string, index: number) {
  const faceShapes = [
    "oval face shape",
    "heart-shaped face",
    "soft square jawline",
    "long elegant face",
    "round youthful face",
    "defined diamond face shape",
  ];
  const eyeStyles = [
    "almond-shaped eyes",
    "wide-set bright eyes",
    "deep-set expressive eyes",
    "soft hooded eyes",
    "sharp cat-eye gaze",
    "gentle rounded eyes",
  ];
  const noseStyles = [
    "small straight nose",
    "refined narrow nose bridge",
    "soft rounded nose tip",
    "delicate lifted nose",
    "strong elegant nose profile",
    "short natural nose",
  ];
  const lipStyles = [
    "soft full lips",
    "defined cupid-bow lips",
    "natural medium lips",
    "plush lower lip",
    "subtle glossy lips",
    "balanced sculpted lips",
  ];
  const hairLooks = [
    "short sleek bob",
    "long loose waves",
    "high ponytail",
    "shoulder-length layered cut",
    "straight waist-length hair",
    "messy textured bun",
  ];
  const identityHints = [
    "East Asian features",
    "Mediterranean features",
    "Northern European features",
    "Latina features",
    "Middle Eastern features",
    "mixed-race features",
  ];

  const detailLine = [
    faceShapes[index % faceShapes.length],
    eyeStyles[index % eyeStyles.length],
    noseStyles[index % noseStyles.length],
    lipStyles[index % lipStyles.length],
    hairLooks[index % hairLooks.length],
    identityHints[index % identityHints.length],
  ].join(", ");

  return `${prompt}\n\nImportant variation guidance: generate a clearly distinct person identity with unique facial structure and non-repetitive features. Use ${detailLine}. Avoid repeating the same face used in previous generations.`;
}

async function saveOutput(file: TemplateFile) {
  file.total_templates = file.templates.length;
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

function buildHeaders(cookieHeader: string) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; 10b.ai batch script)",
  };
}

async function submitTask(
  baseUrl: string,
  cookieHeader: string,
  prompt: string,
  index: number,
) {
  const variedPrompt = buildDiversityPrompt(prompt, index);
  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
    method: "POST",
    headers: buildHeaders(cookieHeader),
    body: JSON.stringify({
      mediaType: "image",
      prompt: variedPrompt,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      aspect_ratio: "9:16",
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `生成请求失败: HTTP ${response.status}`);
  }

  if (result.code !== 0) {
    throw new Error(result.message || "生成请求失败");
  }

  const requestId = result?.data?.requestId || result?.data?.taskId;
  if (!requestId) {
    throw new Error("生成接口未返回 requestId");
  }

  return requestId as string;
}

async function pollTask(
  baseUrl: string,
  cookieHeader: string,
  requestId: string,
) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; 10b.ai batch script)",
        },
      },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `状态查询失败: HTTP ${response.status}`);
    }

    if (result.code !== 0) {
      throw new Error(result.message || "状态查询失败");
    }

    const data = result.data || {};
    const status = String(data.status || "").toLowerCase();

    if (status === "completed" || status === "success") {
      if (typeof data.output === "string" && data.output) {
        return data.output;
      }

      if (Array.isArray(data.outputs) && typeof data.outputs[0] === "string") {
        return data.outputs[0];
      }

      throw new Error("任务完成，但未返回图片地址");
    }

    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.message || "任务失败");
    }
  }

  throw new Error("任务超时");
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai batch script)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";
  if (!cookieHeader) {
    throw new Error(
      "缺少 TENB_COOKIE/REQUEST_COOKIE_HEADER/COOKIE，无法调用 10b.ai 登录态接口。",
    );
  }

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

  const baseUrl = (getArgValue("base-url") || process.env.TENB_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
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
    generated_by: "10b.ai gpt-image-2 api + oss upload",
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
      console.log(`[${displayIndex}/${output.templates.length}] 跳过: ${current.TemplateName}`);
      skippedCount += 1;
      continue;
    }

    console.log(`[${displayIndex}/${output.templates.length}] 生成中: ${current.TemplateName}`);

    try {
      const requestId = await submitTask(
        baseUrl,
        cookieHeader,
        current.prompt,
        index,
      );
      current.requestId = requestId;
      await saveOutput(output);

      const sourceImageUrl = await pollTask(baseUrl, cookieHeader, requestId);
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
      console.log(`[${displayIndex}/${output.templates.length}] 完成: ${upload.url}`);
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
