import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const COLLECTION_URL = "https://wavespeed.ai/collections/image-effects";
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

type WavespeedCollectionProduct = {
  model_uuid: string;
  model_name: string;
  base_price: number;
  cover_url?: string;
  poster?: string;
  input?: string;
  type?: string;
  visits?: number;
  sort_order?: number;
  description?: string;
};

type ImageEffectSampleRecord = {
  title: string;
  sourceUrl: string;
  coverUrl: string;
  posterUrl?: string;
  inputImageUrl?: string;
  examples: Array<{
    inputImageUrl?: string;
    outputImageUrl?: string;
  }>;
  basePrice: number;
  visits: number;
  sortOrder: number;
  description?: string;
};

type ExampleMapping = {
  inputImageUrl?: string;
  outputImageUrl?: string;
};

type DetailExampleData = {
  exampleImages: string[];
  examples: ExampleMapping[];
};

type WavespeedDetailExample = {
  model_id?: string;
  inputs?: {
    image?: string;
  };
  outputs?: {
    outputs?: string[] | string;
  };
};

const DETAIL_PAGE_CONCURRENCY = 4;
const execFileAsync = promisify(execFile);

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadCollectionHtml() {
  const fromFile = getArgValue("from-file");

  if (fromFile) {
    return fs.readFile(path.resolve(process.cwd(), fromFile), "utf8");
  }

  const response = await fetch(COLLECTION_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai image effect sync)",
    },
  });

  if (!response.ok) {
    throw new Error(`抓取官方集合页失败: HTTP ${response.status}`);
  }

  return response.text();
}

function normalizeCollectionHtml(source: string) {
  return source.replace(/\\"/g, "\"").replace(/\\\//g, "/");
}

function getExampleImageSortKey(url: string) {
  const exampleMatch = url.match(
    /https:\/\/static\.wavespeed\.ai\/examples\/([^/]+)\/([^/?#]+)/i,
  );

  if (!exampleMatch) {
    if (url.includes("/models/image-effects/")) {
      return { bucket: 0, group: "cover", rank: 0, url };
    }

    return { bucket: 1, group: "misc", rank: 0, url };
  }

  const [, group, filename] = exampleMatch;
  const isGenerated = /^1\.(jpg|jpeg|png|webp)$/i.test(filename);

  return {
    bucket: 2,
    group,
    rank: isGenerated ? 1 : 0,
    url,
  };
}

function getExampleGroupId(url?: string) {
  if (!url) {
    return undefined;
  }

  return url.match(/https:\/\/static\.wavespeed\.ai\/examples\/([^/]+)\//i)?.[1];
}

function sortExampleImages(urls: string[]) {
  return [...urls].sort((left, right) => {
    const leftKey = getExampleImageSortKey(left);
    const rightKey = getExampleImageSortKey(right);

    if (leftKey.bucket !== rightKey.bucket) {
      return leftKey.bucket - rightKey.bucket;
    }

    if (leftKey.group !== rightKey.group) {
      return leftKey.group.localeCompare(rightKey.group);
    }

    if (leftKey.rank !== rightKey.rank) {
      return leftKey.rank - rightKey.rank;
    }

    return leftKey.url.localeCompare(rightKey.url);
  });
}

function buildExampleMappings(urls: string[]) {
  const groups = new Map<
    string,
    {
      inputImageUrl?: string;
      outputImageUrl?: string;
    }
  >();

  for (const url of urls) {
    const match = url.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/([^/]+)\/([^/?#]+)/i,
    );

    if (!match) {
      continue;
    }

    const [, groupId, filename] = match;
    const entry = groups.get(groupId) || {};
    const isGenerated = /^1\.(jpg|jpeg|png|webp)$/i.test(filename);

    if (isGenerated) {
      entry.outputImageUrl = url;
    } else if (!entry.inputImageUrl) {
      entry.inputImageUrl = url;
    }

    groups.set(groupId, entry);
  }

  return [...groups.entries()]
    .map(([groupId, value]) => ({
      groupId,
      ...value,
    }))
    .sort((left, right) => left.groupId.localeCompare(right.groupId))
    .map(({ groupId: _groupId, ...value }) => value)
    .filter((value) => value.inputImageUrl || value.outputImageUrl);
}

function dedupeExampleMappings(examples: ExampleMapping[]) {
  const seen = new Set<string>();
  const deduped: ExampleMapping[] = [];

  for (const example of examples) {
    const inputGroupId = getExampleGroupId(example.inputImageUrl);
    const outputGroupId = getExampleGroupId(example.outputImageUrl);

    if (
      inputGroupId &&
      outputGroupId &&
      inputGroupId !== outputGroupId
    ) {
      continue;
    }

    const key = `${example.inputImageUrl || ""}::${example.outputImageUrl || ""}`;

    if (
      seen.has(key) ||
      (!example.inputImageUrl && !example.outputImageUrl)
    ) {
      continue;
    }

    seen.add(key);
    deduped.push(example);
  }

  return deduped;
}

function extractExampleMappingsFromDetailHtml(
  normalizedHtml: string,
  slug: string,
) {
  const examplesKeyIndex = normalizedHtml.indexOf("\"examples\":");

  if (examplesKeyIndex < 0) {
    return [];
  }

  const arrayStart = normalizedHtml.indexOf("[", examplesKeyIndex);

  if (arrayStart < 0) {
    return [];
  }

  const arrayJson = extractJsonArrayFromIndex(normalizedHtml, arrayStart);

  if (!arrayJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(arrayJson) as WavespeedDetailExample[];

    return dedupeExampleMappings(
      parsed
        .filter((example) => example.model_id === `image-effects/${slug}`)
        .map((example) => {
          const outputValue = example.outputs?.outputs;
          const outputImageUrl = Array.isArray(outputValue)
            ? outputValue[0]
            : undefined;

          return {
            inputImageUrl: example.inputs?.image || undefined,
            outputImageUrl,
          };
        }),
    );
  } catch {
    return [];
  }
}

function extractJsonArrayFromIndex(source: string, arrayStart: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(arrayStart, index + 1);
      }
    }
  }

  return null;
}

function extractBestProductsArray(source: string, key: string) {
  const arrays: WavespeedCollectionProduct[][] = [];
  let searchFrom = 0;

  while (searchFrom < source.length) {
    const keyIndex = source.indexOf(key, searchFrom);

    if (keyIndex < 0) {
      break;
    }

    const arrayStart = source.indexOf("[", keyIndex);

    if (arrayStart < 0) {
      break;
    }

    const arrayJson = extractJsonArrayFromIndex(source, arrayStart);

    if (arrayJson) {
      try {
        const parsed = JSON.parse(arrayJson) as WavespeedCollectionProduct[];
        arrays.push(parsed);
      } catch {
        // ignore invalid arrays and keep scanning
      }
    }

    searchFrom = keyIndex + key.length;
  }

  if (arrays.length === 0) {
    throw new Error(`未找到集合页中的 ${key} 数组`);
  }

  const best = arrays
    .map((products) => ({
      products,
      imageEffectCount: products.filter(
        (product) => product.type === "image-effects",
      ).length,
    }))
    .sort((a, b) => b.imageEffectCount - a.imageEffectCount)[0];

  return best.products;
}

async function fetchDetailExampleData(slug: string): Promise<DetailExampleData> {
  const detailUrl = `https://wavespeed.ai/models/image-effects/${slug}`;

  try {
    const { stdout: html } = await execFileAsync("curl", ["-L", detailUrl], {
      maxBuffer: 20 * 1024 * 1024,
    });
    const normalizedHtml = normalizeCollectionHtml(html);

    const exampleUrls = normalizedHtml.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s<]+\.(?:jpg|jpeg|png|webp)/gi,
    ) || [];

    return {
      exampleImages: sortExampleImages(Array.from(new Set(exampleUrls))),
      examples: extractExampleMappingsFromDetailHtml(normalizedHtml, slug),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error || "Unknown error");
    console.warn(`[${slug}] detail crawl failed: ${message}`);
    return {
      exampleImages: [],
      examples: [],
    };
  }
}

async function syncSingleModel(slug: string) {
  const samplesPath = path.resolve(process.cwd(), OUTPUT_PATH);
  let existingSamples: Record<string, ImageEffectSampleRecord> = {};

  try {
    const raw = await fs.readFile(samplesPath, "utf8");
    existingSamples = JSON.parse(raw);
  } catch {
    console.warn(`No existing samples file found, creating new one`);
  }

  const existingRecord = existingSamples[slug];

  if (!existingRecord) {
    console.error(`Model "${slug}" not found in samples file`);
    process.exit(1);
  }

  console.log(`Syncing examples for "${slug}"...`);
  const data = await fetchDetailExampleData(slug);

  const allImages = sortExampleImages([
    ...(data.exampleImages.length > 0 ? data.exampleImages : []),
    existingRecord.coverUrl,
    existingRecord.posterUrl,
    existingRecord.inputImageUrl,
  ].filter((v): v is string => Boolean(v)));

  const examples = data.examples.length > 0
    ? data.examples
    : buildExampleMappings(allImages);

  existingSamples[slug] = {
    ...existingRecord,
    examples: dedupeExampleMappings(examples),
  };

  await fs.writeFile(samplesPath, `${JSON.stringify(existingSamples, null, 2)}\n`, "utf8");

  console.log(`Updated "${slug}": ${existingSamples[slug].examples.length} examples`);
  console.log(JSON.stringify({
    slug,
    title: existingSamples[slug].title,
    examples: existingSamples[slug].examples,
  }, null, 2));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    },
  );

  await Promise.all(runners);
  return results;
}

async function buildRecords(products: WavespeedCollectionProduct[]) {
  const records = new Map<string, ImageEffectSampleRecord>();

  const imageEffects = products
    .filter((product) => product.type === "image-effects")
    .sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));

  const detailExamples = await mapWithConcurrency(
    imageEffects,
    DETAIL_PAGE_CONCURRENCY,
    async (product, index) => {
      const slug = product.model_uuid.replace(/^image-effects\//, "");
      const data = slug
        ? await fetchDetailExampleData(slug)
        : { exampleImages: [], examples: [] };

      if (index > 0) {
        await sleep(120);
      }

      return data;
    },
  );

  for (const [index, product] of imageEffects.entries()) {
    const slug = product.model_uuid.replace(/^image-effects\//, "");

    if (!slug || !product.cover_url) {
      continue;
    }

    const exampleImages = sortExampleImages(
      Array.from(
        new Set(
          [
            product.input,
            product.poster,
            product.cover_url,
            ...detailExamples[index].exampleImages,
          ].filter((value): value is string => Boolean(value)),
        ),
      ),
    );
    const examples = dedupeExampleMappings(
      detailExamples[index].examples.length > 0
        ? detailExamples[index].examples
        : buildExampleMappings(exampleImages),
    );

    records.set(slug, {
      title: humanizeSlug(slug),
      sourceUrl: `https://wavespeed.ai/models/image-effects/${slug}`,
      coverUrl: product.cover_url,
      posterUrl: product.poster || undefined,
      inputImageUrl: product.input || undefined,
      examples,
      basePrice: product.base_price,
      visits: product.visits || 0,
      sortOrder: product.sort_order || 0,
      description: product.description || undefined,
    });
  }

  return Object.fromEntries(records);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const syncMode = args.has("--sync");
  const syncSlug = getArgValue("slug");

  if (syncMode && syncSlug) {
    await syncSingleModel(syncSlug);
    return;
  }

  const html = await loadCollectionHtml();
  const normalizedHtml = normalizeCollectionHtml(html);
  const products = extractBestProductsArray(normalizedHtml, "\"products\":");
  const records = await buildRecords(products);

  const slugs = Object.keys(records);

  if (slugs.length === 0) {
    throw new Error("未从官方集合页解析到任何 image effect 数据");
  }

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        collectionUrl: COLLECTION_URL,
        total: slugs.length,
        outputPath: OUTPUT_PATH,
        sample: slugs.slice(0, 8).map((slug) => ({
          slug,
          title: records[slug].title,
          coverUrl: records[slug].coverUrl,
          examples: records[slug].examples.length,
        })),
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
