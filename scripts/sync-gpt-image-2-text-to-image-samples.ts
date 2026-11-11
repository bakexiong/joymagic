import fs from "node:fs/promises";
import path from "node:path";

import { writeWorkbenchTemplateShards } from "../src/shared/lib/server/workbench-template-shards";

const MODEL_URL = "/text-to-image/gpt-image-2";
const BASE_PAGE_URL = "https://youmind.com/gpt-image-2-prompts";
const SITE_ORIGIN = "https://youmind.com";
const CATEGORY_SLUGS = [
  "profile-avatar",
  "social-media-post",
  "infographic-edu-visual",
  "youtube-thumbnail",
  "comic-storyboard",
  "poster-flyer",
  "app-web-design",
] as const;
const SAMPLES_PER_CATEGORY = 10;
const AGGREGATE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples.json",
);

type SampleRecord = {
  prompt: string;
  params: {
    prompt: string;
    aspectRatio: string;
  };
  previewUrl: string;
  thumbnailUrl: string;
};

function normalizePrompt(prompt: string) {
  return prompt
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAspectRatio(prompt: string) {
  const normalized = prompt.toLowerCase();
  const candidates = ["9:16", "21:9", "16:9", "3:4", "4:3", "2:3", "3:2", "1:1"];

  for (const candidate of candidates) {
    if (normalized.includes(candidate)) {
      return candidate;
    }
  }

  return "1:1";
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai template sync)",
    },
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`请求失败 ${url}: HTTP ${response.status}`);
  }

  return response.text();
}

function extractCardBlocks(html: string) {
  return html
    .split('<div class="group relative flex flex-col mt-4" data-id="')
    .slice(1)
    .map((part) => part.split('<div class="group relative flex flex-col mt-4" data-id="')[0])
    .map((part) => part.split('<div class="mb-4 md:mb-6">')[0]);
}

function htmlDecode(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseSamplesFromHtml(html: string) {
  const cardBlocks = extractCardBlocks(html);
  const samples: SampleRecord[] = [];

  for (const block of cardBlocks) {
    const imageMatch = block.match(/<img[^>]+src="([^"]+)"/);
    const promptMatch = block.match(
      /<div class="px-4 pb-4 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">([\s\S]*?)<\/div>/,
    );

    if (!imageMatch || !promptMatch) {
      continue;
    }

    const prompt = normalizePrompt(htmlDecode(promptMatch[1]));
    if (!prompt) {
      continue;
    }

    const rawImageUrl = imageMatch[1];
    const previewUrl = rawImageUrl.startsWith("http")
      ? rawImageUrl
      : `${SITE_ORIGIN}${rawImageUrl}`;

    samples.push({
      prompt,
      params: {
        prompt,
        aspectRatio: extractAspectRatio(prompt),
      },
      previewUrl,
      thumbnailUrl: previewUrl,
    });
  }

  return samples;
}

async function buildSamples() {
  const allSamples: SampleRecord[] = [];

  for (const categorySlug of CATEGORY_SLUGS) {
    const url = `${BASE_PAGE_URL}?categories=${categorySlug}`;
    const html = await fetchHtml(url);
    const samples = parseSamplesFromHtml(html).slice(0, SAMPLES_PER_CATEGORY);

    if (samples.length < SAMPLES_PER_CATEGORY) {
      throw new Error(
        `分类 ${categorySlug} 仅解析到 ${samples.length} 条，少于 ${SAMPLES_PER_CATEGORY} 条`,
      );
    }

    allSamples.push(...samples);
  }

  return allSamples;
}

async function writeAggregateJson(samples: SampleRecord[]) {
  const raw = await fs.readFile(AGGREGATE_PATH, "utf8");
  const payload = JSON.parse(raw) as Record<string, unknown[]>;
  payload[MODEL_URL] = samples;
  await fs.writeFile(AGGREGATE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const samples = await buildSamples();

  await writeWorkbenchTemplateShards({
    [MODEL_URL]: samples,
  });
  await writeAggregateJson(samples);

  console.log(
    `[${MODEL_URL}] synced ${samples.length} samples from YouMind (${CATEGORY_SLUGS.length} categories x ${SAMPLES_PER_CATEGORY})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
