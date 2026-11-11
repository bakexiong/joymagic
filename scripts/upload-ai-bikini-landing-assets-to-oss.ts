import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { AI_BIKINI_SOURCE_ASSETS } from "../src/shared/lib/ai-bikini-landing-assets";
import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });

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

function getExtension(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const dotIndex = pathname.lastIndexOf(".");
    if (dotIndex === -1) return fallback;
    return pathname.slice(dotIndex);
  } catch {
    return fallback;
  }
}

function getContentType(extension: string) {
  const typeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  return typeMap[extension.toLowerCase()] || "image/jpeg";
}

async function download(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; joymagic ai-bikini migrator)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const results: Record<
    string,
    { sourceUrl: string; uploadedUrl: string; key: string }
  > = {};

  for (const [id, sourceUrl] of Object.entries(AI_BIKINI_SOURCE_ASSETS)) {
    const ext = getExtension(sourceUrl, ".jpg");
    const hash = createHash("md5").update(sourceUrl).digest("hex");
    const key = `landing/ai-bikini/${id}-${hash}${ext}`;
    const body = await download(sourceUrl);
    const upload = await ossProvider.uploadFile({
      body,
      key,
      contentType: getContentType(ext),
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(upload.error || `Failed to upload ${id}`);
    }

    results[id] = {
      sourceUrl,
      uploadedUrl: upload.url,
      key,
    };

    console.log(`${id} -> ${upload.url}`);
  }

  console.log("\nJSON_RESULT_START");
  console.log(JSON.stringify(results, null, 2));
  console.log("JSON_RESULT_END");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
