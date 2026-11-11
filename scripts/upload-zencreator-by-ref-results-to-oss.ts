import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const jsonPath = path.resolve(
  process.cwd(),
  "docs/zencreator-generator-by-ref.templates.variants.json",
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

function buildOSSKey(templateId: string, templateName: string, sourceUrl: string) {
  const slug =
    templateName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "template";
  const digest = createHash("md5")
    .update(`${templateId}:result:${sourceUrl}`)
    .digest("hex")
    .slice(0, 16);
  return `zencreator/generator-by-ref/${slug}-result-${digest}.png`;
}

async function main() {
  const raw = await fs.readFile(jsonPath, "utf8");
  const data = JSON.parse(raw) as {
    templates: Array<{
      templateId: string;
      TemplateName: string;
      resultImageUrl?: string;
    }>;
  };
  const ossProvider = createOSSProvider(ossConfig);

  const targets = data.templates.filter(
    (item) =>
      typeof item.resultImageUrl === "string" &&
      item.resultImageUrl.includes("upload.apimart.ai"),
  );

  for (const item of targets) {
    const sourceUrl = item.resultImageUrl as string;
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; upload-zencreator-by-ref-results-to-oss)",
      },
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${item.TemplateName} ${response.status}`);
    }

    const body = Buffer.from(await response.arrayBuffer());
    const key = buildOSSKey(item.templateId, item.TemplateName, sourceUrl);
    const upload = await ossProvider.uploadFile({
      body,
      key,
      contentType: "image/png",
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(`上传失败: ${item.TemplateName} ${upload.error || ""}`);
    }

    item.resultImageUrl = upload.url;
    console.log(`${item.TemplateName} -> ${upload.url}`);
  }

  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + "\n");
  console.log(JSON.stringify({ uploaded: targets.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
