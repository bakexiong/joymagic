import { createHash } from "node:crypto";
import { extname } from "node:path";

import {
  AI_FLYING_SOURCE_ASSETS,
} from "../src/shared/lib/ai-flying-landing-assets";
import { createOSSProvider } from "../src/extensions/storage/oss";

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

function getExt(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    return extname(pathname) || fallback;
  } catch {
    return fallback;
  }
}

function getContentType(url: string) {
  const ext = getExt(url, ".jpg").toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
  };
  return types[ext] || "application/octet-stream";
}

function buildKey(name: string, url: string) {
  const hash = createHash("md5").update(url).digest("hex").slice(0, 10);
  const fallback = url.endsWith(".mp4") ? ".mp4" : ".jpg";
  const ext = getExt(url, fallback);
  return `landing/ai-flying/${name}-${hash}${ext}`;
}

async function download(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; joymagic ai-flying migrator)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

async function main() {
  const entries = Object.entries(AI_FLYING_SOURCE_ASSETS);
  const result: Record<string, string> = {};

  for (const [name, url] of entries) {
    const body = await download(url);
    const upload = await ossProvider.uploadFile({
      body,
      key: buildKey(name, url),
      contentType: getContentType(url),
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(upload.error || `Upload failed for ${name}`);
    }

    result[name] = upload.url;
    console.log(`${name}: ${upload.url}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
