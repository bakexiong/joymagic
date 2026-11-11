import fs from "node:fs/promises";
import path from "node:path";
import { createHash, createHmac } from "node:crypto";

import dotenv from "dotenv";

import {
  buildFacePrompt,
  type FaceLibraryItem,
} from "../src/shared/lib/face-generator";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const DEFAULT_BASE_URL = "https://10b.ai";
const GENERATE_SCENE = "gpt-image-2-text-to-image";
const GENERATE_PATH = `/api/ai/${GENERATE_SCENE}/generate`;
const STATUS_PATH = "/api/ai/status";
const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/face-generator-library.json",
);
const OUTPUT_PREFIX = "face-generator/library";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;

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

function buildOSSKey(item: FaceLibraryItem) {
  const slug = sanitizeSlug(item.id || item.title || "face-generator");
  const hash = createHash("md5")
    .update(JSON.stringify(item.params || {}))
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-${hash}.png`;
}

function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function uploadBufferToOSS(buffer: Buffer, key: string) {
  const endpoint =
    ossConfig.endpoint ||
    `https://${ossConfig.bucket}.${ossConfig.region}.aliyuncs.com`;
  const url = `${endpoint.replace(/\/$/, "")}/${key}`;
  const date = new Date().toUTCString();
  const contentType = getMimeType(key);
  const canonicalizedResource = `/${ossConfig.bucket}/${key}`;
  const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedResource}`;
  const signature = createHmac("sha1", ossConfig.accessKeySecret)
    .update(stringToSign)
    .digest("base64");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      Date: date,
      Authorization: `OSS ${ossConfig.accessKeyId}:${signature}`,
      "Content-Disposition": "inline",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    throw new Error(
      `OSS upload failed: HTTP ${response.status} ${await response.text()}`,
    );
  }

  return ossConfig.publicDomain
    ? `${ossConfig.publicDomain.replace(/\/$/, "")}/${key}`
    : url;
}

function buildHeaders() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";

  if (!cookieHeader) {
    throw new Error(
      "缺少 TENB_COOKIE / REQUEST_COOKIE_HEADER / COOKIE，无法调用 https://10b.ai。",
    );
  }

  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent":
      "Mozilla/5.0 (compatible; 10b.ai face-generator library sync)",
  };
}

async function submitTask(baseUrl: string, item: FaceLibraryItem) {
  const prompt = buildFacePrompt({
    ...item.params,
    imageCount: 1,
  });
  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      mediaType: "image",
      prompt,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      aspect_ratio: item.params.aspectRatio || "1:1",
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || `生成请求失败: HTTP ${response.status}`);
  }

  const requestId = result?.data?.requestId || result?.data?.taskId;
  if (!requestId) {
    throw new Error(`生成接口未返回 requestId: ${item.id}`);
  }

  return {
    prompt,
    requestId: String(requestId),
  };
}

async function pollTask(baseUrl: string, requestId: string) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(GENERATE_SCENE)}`,
      {
        headers: {
          Cookie:
            process.env.TENB_COOKIE ||
            process.env.REQUEST_COOKIE_HEADER ||
            process.env.COOKIE ||
            "",
          "User-Agent":
            "Mozilla/5.0 (compatible; 10b.ai face-generator library sync)",
        },
      },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.code !== 0) {
      throw new Error(
        result.message || `状态查询失败: HTTP ${response.status}`,
      );
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
      throw new Error(`任务完成但未返回图片: ${requestId}`);
    }

    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.message || `任务失败: ${requestId}`);
    }
  }

  throw new Error(`任务超时: ${requestId}`);
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; 10b.ai face-generator library sync)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function saveOutput(items: FaceLibraryItem[]) {
  await fs.writeFile(INPUT_PATH, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

async function main() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";

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

  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const onlyIds = new Set(
    (getArgValue("ids") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || String(Number.MAX_SAFE_INTEGER));
  const items = JSON.parse(
    await fs.readFile(INPUT_PATH, "utf8"),
  ) as FaceLibraryItem[];
  if (!dryRun && !cookieHeader) {
    throw new Error(
      "缺少 10b.ai 登录态。请先设置 TENB_COOKIE、REQUEST_COOKIE_HEADER 或 COOKIE。",
    );
  }

  let processed = 0;
  let skipped = 0;

  for (const [index, item] of items.entries()) {
    const position = index + 1;
    const matchesIdFilter = onlyIds.size === 0 || onlyIds.has(item.id);
    const key = buildOSSKey(item);
    const hasGeneratedImage = item.generatedUrl.includes(key);

    if (position < start || position > end || !matchesIdFilter) {
      skipped += 1;
      continue;
    }

    if (hasGeneratedImage && !force) {
      console.log(`[${position}/${items.length}] 跳过 ${item.id}`);
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run ${position}/${items.length}] ${item.id} -> ${buildFacePrompt({
          ...item.params,
          imageCount: 1,
        })}`,
      );
      processed += 1;
      continue;
    }

    console.log(`[${position}/${items.length}] 生成 ${item.id}`);
    const { prompt, requestId } = await submitTask(baseUrl, item);
    const remoteUrl = await pollTask(baseUrl, requestId);
    const imageBuffer = await downloadImage(remoteUrl);
    const uploadUrl = await uploadBufferToOSS(imageBuffer, key);

    item.previewUrl = uploadUrl;
    item.thumbnailUrl = uploadUrl;
    item.generatedUrl = uploadUrl;
    await saveOutput(items);

    console.log(
      `[${position}/${items.length}] 完成 ${item.id} -> ${uploadUrl} | ${prompt}`,
    );
    processed += 1;
  }

  console.log(
    JSON.stringify(
      {
        input: INPUT_PATH,
        total: items.length,
        processed,
        skipped,
        baseUrl,
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
