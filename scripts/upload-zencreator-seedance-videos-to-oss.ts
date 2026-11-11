import fs from "node:fs/promises";
import path from "node:path";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const inputPath = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.generated.deduped-80.seedance20-i2v.json",
);
const outputPath = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.generated.deduped-80.seedance20-i2v.oss.json",
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
  throw new Error("缺少 OSS 配置");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildOSSKey(index: number, title: string, localPath: string) {
  const ext = path.extname(localPath) || ".mp4";
  const slug = slugify(title) || `video-${index}`;
  return `zencreator/generated-seedance20-i2v/${String(index).padStart(3, "0")}-${slug}${ext}`;
}

async function main() {
  const raw = await fs.readFile(inputPath, "utf8");
  const data = JSON.parse(raw) as Array<Record<string, any>>;
  const ossProvider = createOSSProvider(ossConfig);

  let uploaded = 0;
  let skipped = 0;

  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];

    if (item.seedance20I2VStatus !== "success" || !item.seedance20I2VLocalPath) {
      item.seedance20I2VVideoOssUrl = item.seedance20I2VVideoOssUrl || null;
      continue;
    }

    if (item.seedance20I2VVideoOssUrl) {
      skipped += 1;
      continue;
    }

    const localPath = item.seedance20I2VLocalPath as string;
    const body = await fs.readFile(localPath);
    const key = buildOSSKey(
      index + 1,
      String(item.templateNameSynonym || item.sourceTemplateName || `video-${index + 1}`),
      localPath,
    );

    const upload = await ossProvider.uploadFile({
      body,
      key,
      contentType: "video/mp4",
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(
        `上传失败: ${item.sourceTemplateName || key} ${upload.error || ""}`,
      );
    }

    item.seedance20I2VVideoOssUrl = upload.url;
    uploaded += 1;
    console.log(
      `[${index + 1}/${data.length}] uploaded ${path.basename(localPath)} -> ${upload.url}`,
    );
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2) + "\n");
  }

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2) + "\n");
  console.log(JSON.stringify({ uploaded, skipped, outputPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
