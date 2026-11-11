import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import { createOSSProvider } from "../src/extensions/storage/oss";
import { getVideoPosterUrl } from "../src/shared/lib/oss-video-thumbnail";

type MeigenVideoItem = {
  handle?: string;
  video_url?: string;
  poster_url?: string;
  [key: string]: unknown;
};

type MeigenVideoPayload = {
  items?: MeigenVideoItem[];
  [key: string]: unknown;
};

type WorkbenchTemplateItem = {
  previewUrl?: string;
  previewClipUrl?: string;
  thumbnailUrl?: string;
  generatedUrl?: string;
  generatedUrls?: string[];
  [key: string]: unknown;
};

const MEIGEN_INPUT_PATH = path.resolve(
  process.cwd(),
  "meigen_videos_prompts.json",
);
const WORKBENCH_INPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples/text-to-video__meigen.json",
);

const ossConfig = {
  region: process.env.OSS_REGION || "",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "",
  endpoint: process.env.OSS_ENDPOINT || "",
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

const ossProvider = createOSSProvider({
  ...ossConfig,
  publicDomain: "https://ocdn.10b.ai",
});

const uploadCache = new Map<string, string>();

function buildPosterSnapshotUrl(videoUrl?: string) {
  if (!videoUrl) return undefined;
  return getVideoPosterUrl(videoUrl, {
    width: 960,
    height: 0,
    snapshotTime: 1000,
    quality: 80,
  });
}

function buildPosterKey(videoUrl: string) {
  const hash = createHash("md5").update(videoUrl).digest("hex");
  return `meigen/posters/${hash}.jpg`;
}

async function downloadBuffer(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai meigen poster sync)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when downloading ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadPosterForVideo(videoUrl?: string) {
  if (!videoUrl) return undefined;

  const cached = uploadCache.get(videoUrl);
  if (cached) return cached;

  const snapshotUrl = buildPosterSnapshotUrl(videoUrl);
  if (!snapshotUrl) return undefined;

  const body = await downloadBuffer(snapshotUrl);
  const key = buildPosterKey(videoUrl);
  const result = await ossProvider.uploadFile({
    body,
    key,
    contentType: "image/jpeg",
    disposition: "inline",
  });

  if (!result.success || !result.url) {
    throw new Error(result.error || `Failed to upload poster for ${videoUrl}`);
  }

  const uploaded = result.url.replace(
    /^https?:\/\/[^/]+/i,
    "https://ocdn.10b.ai",
  );
  uploadCache.set(videoUrl, uploaded);
  return uploaded;
}

async function updateMeigenSource() {
  const raw = await fs.readFile(MEIGEN_INPUT_PATH, "utf8");
  const payload = JSON.parse(raw) as MeigenVideoPayload;
  const items = Array.isArray(payload.items) ? payload.items : [];

  let updated = 0;
  for (const item of items) {
    const videoUrl = typeof item.video_url === "string" ? item.video_url : "";
    const posterUrl = await uploadPosterForVideo(videoUrl);
    if (!posterUrl) continue;
    item.poster_url = posterUrl;
    updated += 1;
  }

  await fs.writeFile(MEIGEN_INPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  return { total: items.length, updated };
}

async function updateWorkbenchLibrary() {
  const raw = await fs.readFile(WORKBENCH_INPUT_PATH, "utf8");
  const items = JSON.parse(raw) as WorkbenchTemplateItem[];

  let updated = 0;
  for (const item of items) {
    const videoUrl =
      (typeof item.previewClipUrl === "string" && item.previewClipUrl) ||
      (typeof item.previewUrl === "string" && item.previewUrl) ||
      (typeof item.generatedUrl === "string" && item.generatedUrl) ||
      (Array.isArray(item.generatedUrls) &&
      typeof item.generatedUrls[0] === "string"
        ? item.generatedUrls[0]
        : "");

    const posterUrl = await uploadPosterForVideo(videoUrl);
    if (!posterUrl) continue;
    item.thumbnailUrl = posterUrl;
    updated += 1;
  }

  await fs.writeFile(
    WORKBENCH_INPUT_PATH,
    `${JSON.stringify(items, null, 2)}\n`,
    "utf8",
  );
  return { total: items.length, updated };
}

async function main() {
  const source = await updateMeigenSource();
  const library = await updateWorkbenchLibrary();
  console.log(JSON.stringify({ source, library }, null, 2));
}

void main();
