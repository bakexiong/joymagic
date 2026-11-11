import fs from "node:fs/promises";
import path from "node:path";

import {
  buildMangoPhotoEffectsNanoPrompt,
  MANGO_PHOTO_EFFECTS_CATALOG,
  MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
  MANGO_PHOTO_EFFECTS_SOURCE_URL,
} from "../src/shared/lib/mango-photo-effects-catalog";

const IMAGE_EFFECT_SAMPLES_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);
const GENERATED_EFFECTS_PATH = path.resolve(
  process.cwd(),
  "docs/mango-photo-effects.generated.json",
);

type ImageEffectSampleRecord = {
  title: string;
  sourceUrl: string;
  coverUrl: string;
  posterUrl?: string;
  inputImageUrl?: string;
  inputImageUrls?: string[];
  examples?: Array<{
    inputImageUrl?: string;
    inputImageUrls?: string[];
    outputImageUrl?: string;
  }>;
  previewExample?: {
    inputImageUrl?: string;
    inputImageUrls?: string[];
    outputImageUrl?: string;
  };
  nanoBananaPrompt?: string;
  requiredInputCount?: number;
  baseImagePrompts?: string[];
  basePrice?: number;
  visits?: number;
  sortOrder?: number;
  description?: string;
};

type ImageEffectSampleMap = Record<string, ImageEffectSampleRecord>;

type GeneratedEffectRecord = {
  slug: string;
  generatedRemoteUrl?: string | null;
  uploadedOssUrl?: string | null;
  status: "pending" | "success" | "failed";
};

function getArgFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const raw = await fs.readFile(IMAGE_EFFECT_SAMPLES_PATH, "utf8");
  const records = JSON.parse(raw) as ImageEffectSampleMap;
  const requireGenerated = getArgFlag("require-generated");
  const generatedEffects = await fs
    .readFile(GENERATED_EFFECTS_PATH, "utf8")
    .then((content) => JSON.parse(content) as GeneratedEffectRecord[])
    .catch(() => []);
  const generatedEffectMap = new Map(
    generatedEffects.map((item) => [item.slug, item]),
  );

  for (const effect of MANGO_PHOTO_EFFECTS_CATALOG) {
    const generatedAsset = generatedEffectMap.get(effect.slug);
    const generatedPreviewUrl =
      generatedAsset?.uploadedOssUrl || generatedAsset?.generatedRemoteUrl || "";

    if (requireGenerated && generatedAsset?.status !== "success") {
      throw new Error(
        `缺少 ${effect.slug} 的 gpt-image-2 成功生成结果，请先运行 scripts/generate-mango-photo-effect-samples.ts。`,
      );
    }

    const previewUrl = generatedPreviewUrl || effect.previewUrl;

    records[effect.slug] = {
      ...records[effect.slug],
      title: effect.title,
      sourceUrl: MANGO_PHOTO_EFFECTS_SOURCE_URL,
      coverUrl: previewUrl,
      posterUrl: previewUrl,
      inputImageUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
      examples: [
        {
          inputImageUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
          outputImageUrl: previewUrl,
        },
      ],
      previewExample: {
        inputImageUrl: MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL,
        outputImageUrl: previewUrl,
      },
      nanoBananaPrompt: buildMangoPhotoEffectsNanoPrompt(
        effect.nanoBananaPrompt,
        effect.slug,
      ),
      requiredInputCount: 1,
      baseImagePrompts: [effect.gptImage2Prompt],
      basePrice: records[effect.slug]?.basePrice ?? 20000,
      visits: records[effect.slug]?.visits ?? 0,
      sortOrder: effect.sortOrder,
      description: effect.description,
    };
  }

  await fs.writeFile(
    IMAGE_EFFECT_SAMPLES_PATH,
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Synced ${MANGO_PHOTO_EFFECTS_CATALOG.length} Mango photo effects into ${path.relative(process.cwd(), IMAGE_EFFECT_SAMPLES_PATH)}`,
  );
}

main().catch((error) => {
  console.error("[sync-mango-photo-effects] failed:", error);
  process.exit(1);
});
