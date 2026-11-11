import imageEffectSamples from "@/shared/lib/image-effect-samples.json";

export type ImageEffectItem = {
  id: string;
  slug: string;
  title: string;
  sortOrder?: number;
  coverUrl: string;
  aspectRatio: string;
  url: string;
  badge?: string;
  likes?: string;
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
  description?: string;
};

type ImageEffectSampleMap = Record<string, ImageEffectSampleRecord>;

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

const IMAGE_EFFECT_ASPECTS = [
  "4 / 5",
  "9 / 14",
  "3 / 4",
  "16 / 9",
  "9 / 15",
  "4 / 5",
  "3 / 5",
  "4 / 5",
  "16 / 9",
  "4 / 5",
  "3 / 4",
  "9 / 14",
] as const;

const imageEffectSampleMap = imageEffectSamples as ImageEffectSampleMap;

export function getImageEffectRequiredInputCount(
  _value?: number | null,
): number {
  return 1;
}

function selectPreviewExample(sample: ImageEffectSampleRecord) {
  return sample.examples?.find(
    (example) =>
      example.inputImageUrl &&
      example.outputImageUrl &&
      example.inputImageUrl !== example.outputImageUrl,
  );
}

export function getImageEffectItemsSync(
  titleMap: Record<string, string> = {},
): ImageEffectItem[] {
  const baseItems = Object.entries(imageEffectSampleMap)
    .map(([slug, sample]) => ({
      slug,
      defaultTitle: sample.title,
      sample,
    }))
    .sort((left, right) => {
      const leftSortOrder =
        typeof left.sample.sortOrder === "number" ? left.sample.sortOrder : -1;
      const rightSortOrder =
        typeof right.sample.sortOrder === "number" ? right.sample.sortOrder : -1;

      if (leftSortOrder !== rightSortOrder) {
        return rightSortOrder - leftSortOrder;
      }

      const leftTitle = (left.sample.title || left.slug).toLowerCase();
      const rightTitle = (right.sample.title || right.slug).toLowerCase();

      if (leftTitle !== rightTitle) {
        return leftTitle.localeCompare(rightTitle);
      }

      return left.slug.localeCompare(right.slug);
    });

  return baseItems.map(({ slug, defaultTitle, sample }, index) => ({
    id: slug,
    slug,
    title: titleMap[slug] || defaultTitle,
    sortOrder: sample.sortOrder,
    coverUrl: sample.coverUrl,
    aspectRatio: IMAGE_EFFECT_ASPECTS[index % IMAGE_EFFECT_ASPECTS.length],
    url: sample.sourceUrl,
    posterUrl: sample.posterUrl,
    inputImageUrl: sample.inputImageUrl,
    inputImageUrls: sample.inputImageUrls,
    examples: sample.examples,
    previewExample: selectPreviewExample(sample),
    nanoBananaPrompt: sample.nanoBananaPrompt,
    requiredInputCount: getImageEffectRequiredInputCount(
      sample.requiredInputCount,
    ),
    baseImagePrompts: sample.baseImagePrompts,
    basePrice: sample.basePrice,
    visits: sample.visits,
    description: sample.description,
  }));
}

export async function getImageEffectItems(
  titleMap: Record<string, string> = {},
): Promise<ImageEffectItem[]> {
  return getImageEffectItemsSync(titleMap);
}
