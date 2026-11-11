const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function hmacSha1Base64(secret, message) {
  return crypto.createHmac("sha1", secret).update(message).digest("base64");
}

function getMimeType(ext) {
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

async function uploadBufferToOSS(buffer, key, contentType, ossConfig) {
  const bucket = ossConfig.bucket;
  const endpoint =
    ossConfig.endpoint ||
    `https://${bucket}.${ossConfig.region}.aliyuncs.com`;
  const url = `${endpoint.replace(/\/$/, "")}/${key}`;
  const date = new Date().toUTCString();
  const canonicalizedResource = `/${bucket}/${key}`;
  const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedResource}`;
  const signature = await hmacSha1Base64(
    ossConfig.accessKeySecret,
    stringToSign,
  );

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      Date: date,
      Authorization: `OSS ${ossConfig.accessKeyId}:${signature}`,
      "Content-Disposition": "inline",
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`OSS upload failed: HTTP ${response.status} ${await response.text()}`);
  }

  return ossConfig.publicDomain
    ? `${ossConfig.publicDomain.replace(/\/$/, "")}/${key}`
    : url;
}

function buildKey(index, localPath) {
  const ext = path.extname(localPath) || ".png";
  const base = path.basename(localPath, ext);
  return `zencreator/generated-gpt-image-2/${String(index).padStart(3, "0")}-${base}${ext}`;
}

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, ".env.oss"));
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env.development"));

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
    throw new Error("Missing OSS config in env files");
  }

  const inputPath = path.resolve(
    root,
    "zencreator_video_template_refs.generated.deduped-80.json",
  );
  const outputPath = path.resolve(
    root,
    "zencreator_video_template_refs.generated.deduped-80.oss.json",
  );
  const records = fs.existsSync(outputPath)
    ? JSON.parse(await fsp.readFile(outputPath, "utf8"))
    : JSON.parse(await fsp.readFile(inputPath, "utf8"));

  let uploaded = 0;
  let skipped = 0;

  for (const item of records) {
    if (!item.generatedImageLocalPath) {
      item.generatedImageOssUrl = null;
      continue;
    }

    if (item.generatedImageOssUrl) {
      skipped += 1;
      continue;
    }

    const localPath = item.generatedImageLocalPath;
    const buffer = await fsp.readFile(localPath);
    const key = buildKey(item.generationIndex || 0, localPath);
    const contentType = getMimeType(path.extname(localPath));
    const url = await uploadBufferToOSS(buffer, key, contentType, ossConfig);
    item.generatedImageOssUrl = url;
    uploaded += 1;
    console.log(`[${item.generationIndex}/80] uploaded ${path.basename(localPath)}`);
    await fsp.writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }

  await fsp.writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        total: records.length,
        uploaded,
        skipped,
        outputPath,
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
