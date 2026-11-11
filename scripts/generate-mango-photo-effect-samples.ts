import fs from "node:fs/promises";
import path from "node:path";
import { createHash, createHmac } from "node:crypto";

import dotenv from "dotenv";

import {
  buildMangoPhotoEffectsNanoPrompt,
  MANGO_PHOTO_EFFECTS_CATALOG,
  MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
} from "../src/shared/lib/mango-photo-effects-catalog";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const DEFAULT_BASE_URL = "https://10b.ai";
const GENERATE_SCENE = "gpt-image-2-image-to-image";
const GENERATE_PATH = `/api/ai/${GENERATE_SCENE}/generate`;
const STATUS_PATH = "/api/ai/status";
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "docs/mango-photo-effects.generated.json",
);
const OUTPUT_PREFIX = "image-effects/mango-photo-effects";
const OUTPUT_VERSION = "gpt-image-2-image-to-image-v6";
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

type GeneratedEffectRecord = {
  slug: string;
  title: string;
  prompt: string;
  sourceReferenceUrl: string;
  generatedRemoteUrl?: string | null;
  uploadedOssUrl?: string | null;
  requestId?: string | null;
  status: "pending" | "success" | "failed";
  error?: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function buildOSSKey(slug: string, prompt: string) {
  const hash = createHash("md5")
    .update(`${OUTPUT_VERSION}\n${GENERATE_SCENE}\n${slug}\n${prompt}`)
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-${hash}.png`;
}

function buildHeaders(cookieHeader: string) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent":
      "Mozilla/5.0 (compatible; z-image.ai mango-photo-effects batch)",
  };
}

function buildGenerationPrompt(slug: string, prompt: string) {
  return buildMangoPhotoEffectsNanoPrompt(prompt, slug);
}

function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function uploadBufferToOSS(buffer: Buffer, key: string) {
  console.log("[uploadBufferToOSS] start", {
    key,
    size: buffer.length,
  });
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

  console.log("[uploadBufferToOSS] success", {
    key,
    status: response.status,
  });

  return ossConfig.publicDomain
    ? `${ossConfig.publicDomain.replace(/\/$/, "")}/${key}`
    : url;
}

async function submitTask(
  baseUrl: string,
  cookieHeader: string,
  slug: string,
  sourceReferenceUrl: string,
  prompt: string,
) {
  console.log("[submitTask] start", {
    baseUrl,
    sourceReferenceUrl,
    promptPreview: prompt.slice(0, 120),
  });
  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
    method: "POST",
    headers: buildHeaders(cookieHeader),
    body: JSON.stringify({
      mediaType: "image",
      images: [sourceReferenceUrl],
      prompt: buildGenerationPrompt(slug, prompt),
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      aspect_ratio: "4:5",
    }),
  });

  const result = await response.json().catch(() => ({}));
  console.log("[submitTask] response", {
    ok: response.ok,
    status: response.status,
    code: result?.code,
    message: result?.message,
    requestId: result?.data?.requestId || result?.data?.taskId,
  });
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || `生成请求失败: HTTP ${response.status}`);
  }

  const requestId = result?.data?.requestId || result?.data?.taskId;
  if (!requestId) {
    throw new Error("生成接口未返回 requestId");
  }

  return String(requestId);
}

async function pollTask(
  baseUrl: string,
  cookieHeader: string,
  requestId: string,
) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(GENERATE_SCENE)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent":
            "Mozilla/5.0 (compatible; z-image.ai mango-photo-effects batch)",
        },
      },
    );

    const result = await response.json().catch(() => ({}));
    console.log("[pollTask] response", {
      requestId,
      attempt,
      ok: response.ok,
      status: response.status,
      code: result?.code,
      taskStatus: result?.data?.status,
      message: result?.message || result?.data?.message,
      error: result?.data?.error,
    });
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
      throw new Error("任务完成，但未返回图片地址");
    }

    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.message || "任务失败");
    }
  }

  throw new Error("任务超时");
}

async function downloadImage(url: string) {
  console.log("[downloadImage] start", { url });
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; z-image.ai mango-photo-effects batch)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  console.log("[downloadImage] success", {
    url,
    status: response.status,
  });

  return Buffer.from(await response.arrayBuffer());
}

async function saveOutput(records: GeneratedEffectRecord[]) {
  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";

  if (!cookieHeader) {
    throw new Error(
      "缺少 TENB_COOKIE / REQUEST_COOKIE_HEADER / COOKIE，无法调用 https://10b.ai 的 gpt-image-2 接口。",
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

  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const onlyIds = new Set(
    (getArgValue("ids") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const force = process.argv.includes("--force");

  const existing = await fs
    .readFile(OUTPUT_PATH, "utf8")
    .then((content) => JSON.parse(content) as GeneratedEffectRecord[])
    .catch(() => []);

  const bySlug = new Map(existing.map((item) => [item.slug, item]));
  const records: GeneratedEffectRecord[] = [];

  for (const effect of MANGO_PHOTO_EFFECTS_CATALOG) {
    const current =
      bySlug.get(effect.slug) ||
      ({
        slug: effect.slug,
        title: effect.title,
        prompt: effect.gptImage2Prompt,
        sourceReferenceUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
        status: "pending",
      } satisfies GeneratedEffectRecord);

    if (onlyIds.size > 0 && !onlyIds.has(effect.slug)) {
      records.push(current);
      continue;
    }

    if (!force && current.status === "success" && current.uploadedOssUrl) {
      records.push(current);
      continue;
    }

    try {
      console.log("[effect] start", { slug: effect.slug });
      const requestId = await submitTask(
        baseUrl,
        cookieHeader,
        effect.slug,
        MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
        effect.gptImage2Prompt,
      );
      const generatedRemoteUrl = await pollTask(
        baseUrl,
        cookieHeader,
        requestId,
      );
      const buffer = await downloadImage(generatedRemoteUrl);
      const uploadedOssUrl = await uploadBufferToOSS(
        buffer,
        buildOSSKey(effect.slug, effect.gptImage2Prompt),
      );

      const nextRecord: GeneratedEffectRecord = {
        slug: effect.slug,
        title: effect.title,
        prompt: effect.gptImage2Prompt,
        sourceReferenceUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
        requestId,
        generatedRemoteUrl,
        uploadedOssUrl,
        status: "success",
        error: null,
      };
      records.push(nextRecord);
      await saveOutput(records);
      console.log("[effect] success", {
        slug: effect.slug,
        requestId,
        uploadedOssUrl,
      });
    } catch (error) {
      console.error("[effect] failed", {
        slug: effect.slug,
        error: error instanceof Error ? error.message : String(error),
      });
      records.push({
        slug: effect.slug,
        title: effect.title,
        prompt: effect.gptImage2Prompt,
        sourceReferenceUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
        requestId: null,
        generatedRemoteUrl: null,
        uploadedOssUrl: null,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      await saveOutput(records);
    }
  }

  await saveOutput(records);
  console.log(`Generated ${records.length} Mango photo effect records.`);
}

main().catch((error) => {
  console.error("[generate-mango-photo-effect-samples] failed:", error);
  process.exit(1);
});
