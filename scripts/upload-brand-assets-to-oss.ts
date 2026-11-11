import { readFile } from "node:fs/promises";

import { OSSProvider } from "../src/extensions/storage/oss";

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

const provider = new OSSProvider(ossConfig);

const uploads = [
  {
    localPath: "public/brand/joymagic-logo.png",
    key: "icon/joymagic-logo.png",
  },
  {
    localPath: "public/brand/joymagic-wordmark.png",
    key: "icon/joymagic-wordmark.png",
  },
  {
    localPath: "public/brand/joymagic-icon-512.png",
    key: "icon/joymagic-icon-512.png",
  },
];

async function main() {
  for (const item of uploads) {
    const body = await readFile(item.localPath);
    const result = await provider.uploadFile({
      body,
      key: item.key,
      contentType: "image/png",
      disposition: "inline",
    });

    if (!result.success || !result.url) {
      throw new Error(
        `${item.localPath} upload failed: ${result.error || "unknown error"}`,
      );
    }

    console.log(`${item.localPath} => ${result.url}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
