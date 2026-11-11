import fs from "node:fs/promises";
import path from "node:path";

import { PricingConfigs } from "@/config/pricing-config";
import {
  CreditCostsConfigData,
  getCreditCostsConfigFromDB,
  getPricingConfigFromDB,
  saveCreditCostsConfigToDB,
  savePricingConfigToDB,
} from "@/shared/models/pricing-config";

const COLLECTION_URL = "https://wavespeed.ai/collections/image-effects";
const PROVIDER_KEY_CANDIDATES = ["wavespeed-new", "wavespeed"];
const TARGET_MARGIN = 0.5;
const IMAGE_EFFECT_SAMPLES_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

type CollectionProduct = {
  slug: string;
  title: string;
  costPrice: number;
  rawBasePrice: number;
};

type ImageEffectSampleRecord = {
  title?: string;
};

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

async function loadTitleMap() {
  const raw = await fs.readFile(IMAGE_EFFECT_SAMPLES_PATH, "utf8");
  const data = JSON.parse(raw) as Record<string, ImageEffectSampleRecord>;

  return Object.fromEntries(
    Object.entries(data).map(([slug, sample]) => [
      slug,
      sample.title || humanizeSlug(slug),
    ]),
  );
}

async function loadCollectionHtml() {
  const fromFile = getArgValue("from-file");

  if (fromFile) {
    return fs.readFile(path.resolve(process.cwd(), fromFile), "utf8");
  }

  const response = await fetch(COLLECTION_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 10b.ai pricing sync)",
    },
  });

  if (!response.ok) {
    throw new Error(`抓取官方集合页失败: HTTP ${response.status}`);
  }

  return response.text();
}

function extractProductsFromHtml(
  html: string,
  titleMap: Record<string, string>,
): CollectionProduct[] {
  const normalizedHtml = html.replace(/\\"/g, '"').replace(/\\\//g, "/");
  const regex =
    /"model_uuid":"image-effects\/([^"]+)","model_name":"image-effects\/[^"]+","base_price":(\d+)/g;
  const products = new Map<string, CollectionProduct>();

  for (const match of normalizedHtml.matchAll(regex)) {
    const slug = match[1];
    const rawBasePrice = Number(match[2]);

    if (!slug || !Number.isFinite(rawBasePrice)) {
      continue;
    }

    products.set(slug, {
      slug,
      title: titleMap[slug] || humanizeSlug(slug),
      rawBasePrice,
      costPrice: rawBasePrice / 1_000_000,
    });
  }

  return [...products.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function resolveProviderKey(pricingConfig: PricingConfigs) {
  for (const key of PROVIDER_KEY_CANDIDATES) {
    if (pricingConfig.providers[key]) {
      return key;
    }
  }

  const providerEntry = Object.entries(pricingConfig.providers).find(
    ([providerKey, provider]) =>
      providerKey === "wavespeed-new" ||
      provider.name === "WavespeedNew" ||
      provider.name === "WaveSpeed" ||
      providerKey === "wavespeed",
  );

  if (!providerEntry) {
    throw new Error("未找到 WaveSpeed provider，请先在 pricing_config 中初始化 provider");
  }

  return providerEntry[0];
}

function ensureScenarioDefaults(pricingConfig: PricingConfigs) {
  if (!pricingConfig.pricing.scenarioDefaultProviders) {
    pricingConfig.pricing.scenarioDefaultProviders = {};
  }

  return pricingConfig.pricing.scenarioDefaultProviders;
}

function buildScenarioDescription(title: string) {
  return `${title} image effect`;
}

function buildCreditDescription(title: string) {
  return `${title} 图片特效`;
}

function buildSceneKey(slug: string) {
  return `image-effect-${slug}`;
}

function calculateCredits(costPrice: number, margin: number, unitPrice: number) {
  if (costPrice <= 0) {
    return 0;
  }

  return Math.ceil(costPrice / (1 - margin) / unitPrice);
}

async function syncPricing() {
  const [pricingConfig, creditCostsConfig, titleMap, html] = await Promise.all([
    getPricingConfigFromDB(),
    getCreditCostsConfigFromDB(),
    loadTitleMap(),
    loadCollectionHtml(),
  ]);

  if (!pricingConfig) {
    throw new Error("未找到 pricing_config，请先初始化基础配置");
  }

  if (!creditCostsConfig) {
    throw new Error("未找到 credit_costs_config，请先初始化基础配置");
  }

  const products = extractProductsFromHtml(html, titleMap);

  if (products.length === 0) {
    throw new Error("未从官方集合页解析到任何 image effect 价格");
  }

  const providerKey = resolveProviderKey(pricingConfig);
  const provider = pricingConfig.providers[providerKey];
  const scenarioDefaults = ensureScenarioDefaults(pricingConfig);
  const unitPrice = pricingConfig.pricing.creditUnitPrice;

  for (const product of products) {
    const sceneKey = buildSceneKey(product.slug);

    delete provider.scenarios[product.slug];
    delete provider.scenarios[sceneKey];
    delete creditCostsConfig.costs[product.slug];
    delete creditCostsConfig.costs[sceneKey];
    delete scenarioDefaults[product.slug];
    delete scenarioDefaults[sceneKey];
  }

  let pricingUpdated = 0;
  let creditUpdated = 0;

  for (const product of products) {
    const sceneKey = buildSceneKey(product.slug);
    const credits = calculateCredits(product.costPrice, TARGET_MARGIN, unitPrice);

    provider.scenarios[sceneKey] = {
      costPrice: product.costPrice,
      profitMargin: TARGET_MARGIN,
      description: buildScenarioDescription(product.title),
      apiEndpoint: `/api/v3/image-effects/${product.slug}`,
      meta: {
        source: COLLECTION_URL,
        rawBasePrice: product.rawBasePrice,
        effectSlug: product.slug,
      },
    };
    scenarioDefaults[sceneKey] = provider.name;
    pricingUpdated += 1;

    creditCostsConfig.costs[sceneKey] = {
      type: "fixed",
      credits,
      description: buildCreditDescription(product.title),
      saveTaskToDb: true,
      mediaType: "image",
    };
    creditUpdated += 1;
  }

  await savePricingConfigToDB(pricingConfig);
  await saveCreditCostsConfigToDB(creditCostsConfig as CreditCostsConfigData);

  console.log(
    JSON.stringify(
      {
        providerKey,
        syncedEffects: products.length,
        pricingUpdated,
        creditUpdated,
        sample: products.slice(0, 5).map((product) => ({
          slug: product.slug,
          sceneKey: buildSceneKey(product.slug),
          costPrice: product.costPrice,
          credits: calculateCredits(
            product.costPrice,
            TARGET_MARGIN,
            unitPrice,
          ),
        })),
      },
      null,
      2,
    ),
  );
}

syncPricing().catch((error) => {
  console.error(error);
  process.exit(1);
});
