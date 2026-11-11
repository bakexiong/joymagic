import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";

import { createOSSProvider } from "../src/extensions/storage/oss";

type ImageEffectSampleRecord = Record<
  string,
  {
    coverUrl?: string;
    posterUrl?: string;
    inputImageUrl?: string;
    examples?: Array<{
      inputImageUrl?: string;
      outputImageUrl?: string;
    }>;
    [key: string]: unknown;
  }
>;

const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

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

const OSS_DOMAINS = [
  publicDomainHost,
  bucketOriginHost,
  endpointHost,
].filter(Boolean);

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

function sanitizeExt(url: string, fallbackExt = ".jpg") {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || fallbackExt;
  } catch {
    return fallbackExt;
  }
}

function getContentType(url: string) {
  const ext = sanitizeExt(url).toLowerCase();
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

function buildOSSKey(url: string) {
  const hash = createHash("md5").update(url).digest("hex");
  const ext = sanitizeExt(url);
  return `image-effects/images/${hash}${ext}`;
}

async function downloadFile(url: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; 10b.ai oss migrator)",
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

async function uploadImageUrl(url: string) {
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

      uploadCache.set(url, result.url);
      return result.url;
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
  const samples = JSON.parse(raw) as ImageEffectSampleRecord;

  const slugs = Object.keys(samples);
  console.log(`Processing ${slugs.length} image effect sample records...`);

  for (const slug of slugs) {
    const record = samples[slug];
    if (!record) continue;

    console.log(`\n[${slug}] start`);

    if (record.coverUrl) {
      record.coverUrl = await uploadImageUrl(record.coverUrl);
      console.log(`[${slug}] coverUrl uploaded`);
    }

    if (record.posterUrl) {
      record.posterUrl = await uploadImageUrl(record.posterUrl);
      console.log(`[${slug}] posterUrl uploaded`);
    }

    if (record.inputImageUrl) {
      record.inputImageUrl = await uploadImageUrl(record.inputImageUrl);
      console.log(`[${slug}] inputImageUrl uploaded`);
    }

    if (Array.isArray(record.examples) && record.examples.length > 0) {
      const nextExamples = [];
      for (const example of record.examples) {
        nextExamples.push({
          inputImageUrl: example.inputImageUrl
            ? await uploadImageUrl(example.inputImageUrl)
            : example.inputImageUrl,
          outputImageUrl: example.outputImageUrl
            ? await uploadImageUrl(example.outputImageUrl)
            : example.outputImageUrl,
        });
      }
      record.examples = nextExamples;
      console.log(`[${slug}] examples uploaded (${nextExamples.length})`);
    }

    await fs.writeFile(INPUT_PATH, `${JSON.stringify(samples, null, 2)}\n`, "utf8");
  }

  console.log("\nAll image effect sample assets uploaded to OSS.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
