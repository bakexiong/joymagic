import { createHash } from "node:crypto";

import dotenv from "dotenv";

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

type AssetKind = "image" | "video";
type AssetItem = {
  id: string;
  kind: AssetKind;
  sourceUrl: string;
};

const ASSETS: AssetItem[] = [
  {
    id: "hero-image",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/ai-jiggle-video.jpg",
  },
  {
    id: "feature-1",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/animate-boobs-with-ai.jpg",
  },
  {
    id: "feature-2",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/boobs-bouncing-animation.jpg",
  },
  {
    id: "step-3",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/download-or-share-online.jpg",
  },
  {
    id: "step-2",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/generate-jiggle-video.jpg",
  },
  {
    id: "feature-3",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/shake-your-breasts.jpg",
  },
  {
    id: "step-1",
    kind: "image",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/ai-jiggle/upload-your-photo.jpg",
  },
  {
    id: "hero-video",
    kind: "video",
    sourceUrl:
      "https://online.mangoanimate.com/mango_ai/home/create-jiggle-dance-videos-with-ai.mp4",
  },
];

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

function getContentType(kind: AssetKind, extension: string) {
  if (kind === "video") {
    return "video/mp4";
  }

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
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai mango ai jiggle migrator)",
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
    { sourceUrl: string; uploadedUrl: string; key: string; kind: AssetKind }
  > = {};

  for (const asset of ASSETS) {
    const ext = getExtension(
      asset.sourceUrl,
      asset.kind === "video" ? ".mp4" : ".jpg",
    );
    const hash = createHash("md5").update(asset.sourceUrl).digest("hex");
    const key = `video-effects/product-assets/video-effects/jiggle-up/mango-ai/${asset.id}-${hash}${ext}`;
    const body = await download(asset.sourceUrl);
    const upload = await ossProvider.uploadFile({
      body,
      key,
      contentType: getContentType(asset.kind, ext),
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(upload.error || `Failed to upload ${asset.id}`);
    }

    results[asset.id] = {
      sourceUrl: asset.sourceUrl,
      uploadedUrl: upload.url,
      key,
      kind: asset.kind,
    };

    console.log(`${asset.id} -> ${upload.url}`);
  }

  console.log("\nJSON_RESULT_START");
  console.log(JSON.stringify(results, null, 2));
  console.log("JSON_RESULT_END");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
