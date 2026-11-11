import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";

import { createOSSProvider } from "../src/extensions/storage/oss";

type WorkbenchTemplateSamples = Record<string, Array<Record<string, unknown>>>;

const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples.json",
);
const FAILURES_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples-oss-failures.json",
);

const ossConfig = {
  region: process.env.OSS_REGION || "",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "",
  endpoint: process.env.OSS_ENDPOINT || "",
  publicDomain: process.env.OSS_PUBLIC_DOMAIN || "https://ocdn.10b.ai",
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

const OSS_DOMAINS = [
  publicDomainHost,
  bucketOriginHost,
  endpointHost,
].filter(Boolean);

const uploadCache = new Map<string, string>();

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
  ".avif",
]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".m4v"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

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
    if (
      parsed.hostname !== bucketOriginHost &&
      parsed.hostname !== endpointHost &&
      parsed.hostname !== publicDomainHost
    ) {
      return url;
    }

    return `${ossConfig.publicDomain.replace(/\/$/, "")}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function getExtension(url: string) {
  try {
    return path.extname(new URL(url).pathname).toLowerCase();
  } catch {
    return "";
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function detectMediaKind(url: string, pathHint: string[]) {
  const ext = getExtension(url);
  if (VIDEO_EXTENSIONS.has(ext)) return "video" as const;
  if (AUDIO_EXTENSIONS.has(ext)) return "audio" as const;
  if (IMAGE_EXTENSIONS.has(ext)) return "image" as const;

  const joined = pathHint.join(".").toLowerCase();
  if (joined.includes("video")) return "video" as const;
  if (joined.includes("audio")) return "audio" as const;
  return "image" as const;
}

function shouldUploadUrl(url: string) {
  if (!isHttpUrl(url)) return false;
  const ext = getExtension(url);
  return (
    IMAGE_EXTENSIONS.has(ext) ||
    VIDEO_EXTENSIONS.has(ext) ||
    AUDIO_EXTENSIONS.has(ext)
  );
}

function getContentType(url: string, kind: "image" | "video" | "audio") {
  const ext = getExtension(url);

  if (kind === "image") {
    const imageTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
      ".avif": "image/avif",
    };
    return imageTypes[ext] || "image/jpeg";
  }

  if (kind === "audio") {
    const audioTypes: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".ogg": "audio/ogg",
    };
    return audioTypes[ext] || "audio/mpeg";
  }

  const videoTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".m4v": "video/x-m4v",
  };
  return videoTypes[ext] || "video/mp4";
}

function buildOSSKey(url: string, kind: "image" | "video" | "audio") {
  const hash = createHash("md5").update(url).digest("hex");
  const ext = getExtension(url) || (
    kind === "video" ? ".mp4" : kind === "audio" ? ".mp3" : ".jpg"
  );
  return `workbench-template-samples/${kind}s/${hash}${ext}`;
}

async function downloadFile(url: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; 10b.ai workbench oss migrator)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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

async function uploadUrl(
  url: string,
  pathHint: string[],
  stats: { uploaded: number; skipped: number },
) {
  if (!shouldUploadUrl(url)) {
    stats.skipped += 1;
    return url;
  }

  if (isOSSUrl(url)) {
    return normalizeOSSUrl(url);
  }

  const cached = uploadCache.get(url);
  if (cached) return cached;

  const kind = detectMediaKind(url, pathHint);
  const buffer = await downloadFile(url);
  const key = buildOSSKey(url, kind);
  const contentType = getContentType(url, kind);

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
      stats.uploaded += 1;
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

async function walkAndUpload(
  value: unknown,
  pathHint: string[],
  stats: { uploaded: number; skipped: number; failed: number },
): Promise<unknown> {
  if (typeof value === "string") {
    return uploadUrl(value, pathHint, stats);
  }

  if (Array.isArray(value)) {
    const nextItems = [];
    for (let index = 0; index < value.length; index += 1) {
      nextItems.push(
        await walkAndUpload(value[index], [...pathHint, String(index)], stats),
      );
    }
    return nextItems;
  }

  if (value && typeof value === "object") {
    const nextEntries = await Promise.all(
      Object.entries(value).map(async ([key, nestedValue]) => [
        key,
        await walkAndUpload(nestedValue, [...pathHint, key], stats),
      ]),
    );
    return Object.fromEntries(nextEntries);
  }

  return value;
}

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const samples = JSON.parse(raw) as WorkbenchTemplateSamples;
  const modelUrls = Object.keys(samples);
  const stats = { uploaded: 0, skipped: 0, failed: 0 };
  const failures: Array<{
    modelUrl: string;
    index: number;
    error: string;
  }> = [];

  console.log(`Processing ${modelUrls.length} workbench template groups...`);

  for (const modelUrl of modelUrls) {
    const items = samples[modelUrl];
    if (!Array.isArray(items) || items.length === 0) continue;

    console.log(`\n[${modelUrl}] start (${items.length})`);

    for (let index = 0; index < items.length; index += 1) {
      try {
        items[index] = (await walkAndUpload(
          items[index],
          [modelUrl, String(index)],
          stats,
        )) as Record<string, unknown>;
      } catch (error) {
        stats.failed += 1;
        const message =
          error instanceof Error ? error.message : String(error);
        failures.push({
          modelUrl,
          index,
          error: message,
        });
        console.warn(`[${modelUrl}#${index}] skipped after failure: ${message}`);
      }
    }

    await fs.writeFile(INPUT_PATH, `${JSON.stringify(samples, null, 2)}\n`, "utf8");
    await fs.writeFile(
      FAILURES_PATH,
      `${JSON.stringify(failures, null, 2)}\n`,
      "utf8",
    );
    console.log(
      `[${modelUrl}] done, cumulative uploaded=${stats.uploaded}, skipped=${stats.skipped}, failed=${stats.failed}`,
    );
  }

  console.log(
    `\nAll workbench template sample assets uploaded to OSS. uploaded=${stats.uploaded}, skipped=${stats.skipped}, failed=${stats.failed}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
