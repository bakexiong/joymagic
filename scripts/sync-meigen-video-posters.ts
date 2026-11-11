import fs from "node:fs/promises";
import path from "node:path";

import { getVideoPosterUrl } from "../src/shared/lib/oss-video-thumbnail";

type MeigenVideoItem = {
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

function buildPosterUrl(videoUrl?: string) {
  if (!videoUrl) return undefined;
  return getVideoPosterUrl(videoUrl, {
    width: 960,
    height: 0,
    snapshotTime: 1000,
    quality: 80,
  });
}

async function syncMeigenSourceData() {
  const raw = await fs.readFile(MEIGEN_INPUT_PATH, "utf8");
  const payload = JSON.parse(raw) as MeigenVideoPayload;
  const items = Array.isArray(payload.items) ? payload.items : [];

  let updated = 0;

  for (const item of items) {
    const videoUrl = typeof item.video_url === "string" ? item.video_url : "";
    const posterUrl = buildPosterUrl(videoUrl);
    if (!posterUrl) continue;
    item.poster_url = posterUrl;
    updated += 1;
  }

  await fs.writeFile(MEIGEN_INPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  return { total: items.length, updated };
}

async function syncWorkbenchLibraryData() {
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

    const posterUrl = buildPosterUrl(videoUrl);
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
  const sourceResult = await syncMeigenSourceData();
  const workbenchResult = await syncWorkbenchLibraryData();

  console.log(
    JSON.stringify(
      {
        meigenSource: sourceResult,
        workbenchLibrary: workbenchResult,
      },
      null,
      2,
    ),
  );
}

void main();
