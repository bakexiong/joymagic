import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";

import { createOSSProvider } from "../src/extensions/storage/oss";

type MeigenVideoItem = {
  author_name?: string;
  handle?: string;
  model?: string;
  prompt?: string;
  source_video_url?: string;
  video_url?: string;
  [key: string]: unknown;
};

type MeigenVideoPayload = {
  source_url: string;
  extracted_at: string;
  notes?: string;
  total_items: number;
  items: MeigenVideoItem[];
};

const INPUT_PATH = path.resolve(process.cwd(), "meigen_videos_prompts.json");

const ossConfig = {
  region: process.env.OSS_REGION || "",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "",
  endpoint: process.env.OSS_ENDPOINT || "",
  publicDomain: process.env.OSS_PUBLIC_DOMAIN || "",
};

if (
  !ossConfig.region ||
  !ossConfig.accessKeyId ||
  !ossConfig.accessKeySecret ||
  !ossConfig.bucket
) {
  throw new Error(
    "Missing OSS config. Please set OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET and OSS_BUCKET.",
  );
}

const ossProvider = createOSSProvider(ossConfig);

const bucketOriginHost = `${ossConfig.bucket}.${ossConfig.region}.aliyuncs.com`;
const endpointHost = ossConfig.endpoint
  ? new URL(ossConfig.endpoint).hostname
  : bucketOriginHost;
const publicDomainHost = ossConfig.publicDomain
  ? new URL(ossConfig.publicDomain).hostname
  : "";

const OSS_DOMAINS = [publicDomainHost, bucketOriginHost, endpointHost].filter(
  Boolean,
);

const uploadCache = new Map<string, string>();

function isOSSUrl(url: string) {
  try {
    const parsed = new URL(url);
    return OSS_DOMAINS.some((domain) => parsed.hostname === domain);
  } catch {
    return false;
  }
}

function normalizeOSSUrl(url: string) {
  if (!url || !ossConfig.publicDomain) return url;

  try {
    const parsed = new URL(url);
    if (!OSS_DOMAINS.includes(parsed.hostname)) {
      return url;
    }

    return `${ossConfig.publicDomain.replace(/\/$/, "")}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function sanitizeExt(url: string, fallbackExt: string) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || fallbackExt;
  } catch {
    return fallbackExt;
  }
}

function getContentType(url: string) {
  const ext = sanitizeExt(url, ".mp4").toLowerCase();
  const videoTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".m4v": "video/x-m4v",
  };
  return videoTypes[ext] || "video/mp4";
}

function buildOSSKey(url: string) {
  const hash = createHash("md5").update(url).digest("hex");
  const ext = sanitizeExt(url, ".mp4");
  return `meigen/videos/${hash}${ext}`;
}

async function downloadFile(url: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; z-image.ai meigen migrator)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} when downloading ${url}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.warn(
          `[retry ${attempt}/3] download failed for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to download ${url}`);
}

async function uploadVideo(url: string) {
  if (!url) return url;
  if (isOSSUrl(url)) return normalizeOSSUrl(url);

  const cached = uploadCache.get(url);
  if (cached) return cached;

  const buffer = await downloadFile(url);
  const key = buildOSSKey(url);
  const contentType = getContentType(url);

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await ossProvider.uploadFile({
        body: buffer,
        key,
        contentType,
        disposition: "inline",
      });

      if (!result.success || !result.url) {
        throw new Error(result.error || `Failed to upload ${url}`);
      }

      const normalized = normalizeOSSUrl(result.url);
      uploadCache.set(url, normalized);
      return normalized;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.warn(
          `[retry ${attempt}/3] upload failed for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to upload ${url}`);
}

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const payload = JSON.parse(raw) as MeigenVideoPayload;
  const items = Array.isArray(payload.items) ? payload.items : [];

  console.log(`Uploading ${items.length} Meigen videos to OSS...`);

  let successCount = 0;

  for (const [index, item] of items.entries()) {
    const currentUrl = typeof item.video_url === "string" ? item.video_url : "";
    if (!currentUrl) {
      console.warn(`[${index + 1}/${items.length}] skipped: missing video_url`);
      continue;
    }

    try {
      const originalUrl =
        typeof item.source_video_url === "string" && item.source_video_url
          ? item.source_video_url
          : currentUrl;

      const uploadedUrl = await uploadVideo(originalUrl);
      item.source_video_url = originalUrl;
      item.video_url = uploadedUrl;
      successCount += 1;

      console.log(
        `[${index + 1}/${items.length}] uploaded ${item.handle || "unknown"}`,
      );
    } catch (error) {
      console.error(
        `[${index + 1}/${items.length}] failed ${item.handle || "unknown"}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  payload.total_items = items.length;
  payload.notes = `${
    payload.notes || ""
  } 已将视频重新上传到 OSS，并保留 source_video_url。`.trim();

  await fs.writeFile(INPUT_PATH, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Done. Uploaded ${successCount}/${items.length} videos.`);
}

void main();
