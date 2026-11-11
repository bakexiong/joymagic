import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";

import { createOSSProvider } from "../src/extensions/storage/oss";

type WavespeedModelProduct = {
  model_uuid?: string;
  model_name?: string;
  type?: string;
  cover_url?: string;
  poster?: string;
  [key: string]: unknown;
};

type WavespeedModelProductsFile = {
  fetchedAt?: string;
  total?: number;
  pageSize?: number;
  items?: WavespeedModelProduct[];
};

const INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/wavespeed-model-products.json",
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

function sanitizeExt(url: string, fallbackExt: string) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || fallbackExt;
  } catch {
    return fallbackExt;
  }
}

function getContentType(url: string, kind: "image" | "video") {
  const ext = sanitizeExt(url, kind === "image" ? ".jpg" : ".mp4").toLowerCase();

  if (kind === "image") {
    const imageTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
    };
    return imageTypes[ext] || "image/jpeg";
  }

  const videoTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".m4v": "video/x-m4v",
  };
  return videoTypes[ext] || "video/mp4";
}

function buildOSSKey(
  modelPath: string,
  field: "cover_url" | "poster",
  url: string,
  kind: "image" | "video",
) {
  const hash = createHash("md5").update(url).digest("hex");
  const ext = sanitizeExt(url, kind === "image" ? ".jpg" : ".mp4");
  return `video-effects/product-assets/${modelPath}/${field}-${hash}${ext}`;
}

async function downloadFile(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai video-effects product migrator)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when downloading ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadUrl(
  modelPath: string,
  field: "cover_url" | "poster",
  url: string,
  kind: "image" | "video",
) {
  if (!url) return url;
  if (isOSSUrl(url)) return normalizeOSSUrl(url);

  const cached = uploadCache.get(url);
  if (cached) return cached;

  const buffer = await downloadFile(url);
  const key = buildOSSKey(modelPath, field, url, kind);
  const contentType = getContentType(url, kind);
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
}

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const data = JSON.parse(raw) as WavespeedModelProductsFile;
  const items = data.items || [];

  let updated = 0;
  let coverUploaded = 0;
  let posterUploaded = 0;

  for (const item of items) {
    if (item.type !== "video-effects") {
      continue;
    }

    const modelPath = item.model_uuid || item.model_name || "";
    if (!modelPath) {
      continue;
    }

    let itemUpdated = false;

    if (item.cover_url && !isOSSUrl(item.cover_url)) {
      item.cover_url = await uploadUrl(
        modelPath,
        "cover_url",
        item.cover_url,
        "video",
      );
      coverUploaded += 1;
      itemUpdated = true;
    }

    if (item.poster && !isOSSUrl(item.poster)) {
      item.poster = await uploadUrl(modelPath, "poster", item.poster, "image");
      posterUploaded += 1;
      itemUpdated = true;
    }

    if (itemUpdated) {
      updated += 1;
      console.log(`[${modelPath}] migrated`);
    }
  }

  await fs.writeFile(INPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        updated,
        coverUploaded,
        posterUploaded,
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
