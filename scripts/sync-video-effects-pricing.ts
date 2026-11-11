import fs from "node:fs/promises";
import path from "node:path";

import { PricingConfigs } from "@/config/pricing-config";
import { VIDEO_EFFECT_BASE_ITEMS } from "@/shared/lib/video-effect-data";
import {
  CreditCostsConfigData,
  getCreditCostsConfigFromDB,
  getPricingConfigFromDB,
  saveCreditCostsConfigToDB,
  savePricingConfigToDB,
} from "@/shared/models/pricing-config";

const MODELS_URL = "https://wavespeed.ai/models?typeList=video-effects";
const PROVIDER_KEY_CANDIDATES = ["wavespeed-new", "wavespeed"];
const TARGET_MARGIN = 0.5;
const EN_TITLES_PATH = path.resolve(
  process.cwd(),
  "src/config/locale/messages/en/landing/video-effects.json",
);
const WAVESPEED_PRODUCTS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/wavespeed-model-products.json",
);

type CollectionProduct = {
  slug: string;
  title: string;
  modelPath: string;
  costPrice: number;
  rawBasePrice: number;
};

type LocaleTitleFile = {
  titles?: Record<string, string>;
};

type WavespeedModelProductsFile = {
  items?: Array<{
    model_uuid?: string;
    base_price?: number;
    type?: string;
  }>;
};

async function loadEnglishTitles() {
  const raw = await fs.readFile(EN_TITLES_PATH, "utf8");
  const data = JSON.parse(raw) as LocaleTitleFile;
  return data.titles ?? {};
}

async function fetchProducts(
  titleMap: Record<string, string>,
): Promise<CollectionProduct[]> {
  const raw = await fs.readFile(WAVESPEED_PRODUCTS_PATH, "utf8");
  const data = JSON.parse(raw) as WavespeedModelProductsFile;
  const supportedItems = new Map(
    VIDEO_EFFECT_BASE_ITEMS.map((item) => [item.modelPath, item]),
  );
  const products = new Map<string, CollectionProduct>();

  for (const item of data.items || []) {
    if (item.type !== "video-effects" || !item.model_uuid) {
      continue;
    }

    const modelPath = item.model_uuid;
    const matchedItem = supportedItems.get(modelPath);
    if (!matchedItem) {
      continue;
    }

    const rawBasePrice = Number(item.base_price);
    if (!Number.isFinite(rawBasePrice)) {
      continue;
    }

    products.set(modelPath, {
      slug: matchedItem.slug,
      title: titleMap[matchedItem.slug] || matchedItem.defaultTitle,
      modelPath: matchedItem.modelPath,
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
  return `${title} video effect`;
}

function buildCreditDescription(title: string) {
  return `${title} 视频特效`;
}

function buildSceneKey(slug: string) {
  return `video-effect-${slug}`;
}

function calculateCredits(costPrice: number, margin: number, unitPrice: number) {
  if (costPrice <= 0) {
    return 0;
  }

  return Math.ceil(costPrice / (1 - margin) / unitPrice);
}

async function syncPricing() {
  const [pricingConfig, creditCostsConfig, titleMap] = await Promise.all([
    getPricingConfigFromDB(),
    getCreditCostsConfigFromDB(),
    loadEnglishTitles(),
  ]);

  if (!pricingConfig) {
    throw new Error("未找到 pricing_config，请先初始化基础配置");
  }

  if (!creditCostsConfig) {
    throw new Error("未找到 credit_costs_config，请先初始化基础配置");
  }

  const products = await fetchProducts(titleMap);

  if (products.length === 0) {
    throw new Error("未从本地 WaveSpeed 模型快照解析到任何 video effect 价格");
  }

  const providerKey = resolveProviderKey(pricingConfig);
  const provider = pricingConfig.providers[providerKey];
  const scenarioDefaults = ensureScenarioDefaults(pricingConfig);
  const unitPrice = pricingConfig.pricing.creditUnitPrice;

  for (const product of products) {
    delete provider.scenarios[product.slug];
    delete creditCostsConfig.costs[product.slug];
    delete scenarioDefaults[product.slug];
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
      apiEndpoint: `/api/v3/${product.modelPath}`,
      meta: {
        source: MODELS_URL,
        rawBasePrice: product.rawBasePrice,
        effectSlug: product.slug,
        modelPath: product.modelPath,
      },
    };
    scenarioDefaults[sceneKey] = provider.name;
    pricingUpdated += 1;

    creditCostsConfig.costs[sceneKey] = {
      type: "fixed",
      credits,
      description: buildCreditDescription(product.title),
      saveTaskToDb: true,
      mediaType: "video",
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
