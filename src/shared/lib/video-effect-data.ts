import videoEffectSamples from "@/shared/lib/video-effect-samples.json";
import wavespeedModelProducts from "@/shared/lib/wavespeed-model-products.json";
import {
  isBlockedVideoEffectSlugInCreemReviewMode,
  isCreemReviewMode,
} from "@/shared/lib/creem-review";

export type VideoEffectItem = {
  id: string;
  slug: string;
  title: string;
  aspectRatio: string;
  modelPath?: string;
  docUrl: string;
  coverUrl?: string;
  sourceImageUrl?: string;
  examples?: Array<{
    inputImageUrl?: string;
    outputVideoUrl?: string;
    outputPreviewClipUrl?: string;
  }>;
  sampleVideoUrl?: string;
  samplePreviewClipUrl?: string;
  sampleTaskId?: string;
  sampleGeneratedAt?: string;
  badge?: string;
  likes?: string;
  hubSlug?: string;
  styleItems?: VideoEffectItem[];
};

type VideoEffectSampleRecord = Record<
  string,
  {
    sampleVideoUrl?: string;
    samplePreviewClipUrl?: string;
    sampleTaskId?: string;
    sampleGeneratedAt?: string;
    sourceImageUrl?: string;
    examples?: Array<{
      inputImageUrl?: string;
      outputVideoUrl?: string;
      outputPreviewClipUrl?: string;
    }>;
  }
>;

type WavespeedModelProductRecord = {
  model_uuid?: string;
  model_name?: string;
  type?: string;
  tags?: string[];
  cover_url?: string;
  poster?: string;
};

type VideoEffectBaseItem = {
  slug: string;
  defaultTitle: string;
  modelPath: string;
};

export const AI_KISSING_HUB_SLUG = "ai-kissing";
export const AI_TWERK_SLUG = "ai-twerk";
export const AI_BIKINI_SLUG = "ai-bikini";
export const AI_FLYING_SLUG = "flying";
export const AI_JIGGLE_SLUG = "jiggle-up";
export const VIDEO_KISS_STYLE_SLUGS = [
  "ai-kissing",
  "blow-kiss",
  "french-kiss",
  "kissing-pro",
  "rain-kiss",
] as const;

export const VIDEO_EFFECT_BASE_ITEMS: VideoEffectBaseItem[] = [
  {
    slug: "ai-kissing",
    defaultTitle: "AI Kissing",
    modelPath: "wavespeed-ai/ai-kissing",
  },
  {
    slug: AI_BIKINI_SLUG,
    defaultTitle: "AI Bikini",
    modelPath: "video-effects/ai-bikini",
  },
  {
    slug: "ai-twerk",
    defaultTitle: "AI Twerk",
    modelPath: "wavespeed-ai/ai-twerk",
  },
  {
    slug: "balloon-flyaway",
    defaultTitle: "Balloon Flyaway",
    modelPath: "video-effects/balloon-flyaway",
  },
  {
    slug: "blow-kiss",
    defaultTitle: "Blow Kiss",
    modelPath: "video-effects/blow-kiss",
  },
  {
    slug: "blueprint-supreme",
    defaultTitle: "Blueprint Supreme",
    modelPath: "video-effects/blueprint-supreme",
  },
  {
    slug: "body-shake",
    defaultTitle: "Body Shake",
    modelPath: "video-effects/body-shake",
  },
  {
    slug: "break-glass",
    defaultTitle: "Break Glass",
    modelPath: "video-effects/break-glass",
  },
  {
    slug: "cap-walk",
    defaultTitle: "Cap Walk",
    modelPath: "video-effects/cap-walk",
  },
  {
    slug: "captain-america",
    defaultTitle: "Captain America",
    modelPath: "video-effects/captain-america",
  },
  {
    slug: "carry-me",
    defaultTitle: "Carry Me",
    modelPath: "video-effects/carry-me",
  },
  {
    slug: "cartoon-doll",
    defaultTitle: "Cartoon Doll",
    modelPath: "video-effects/cartoon-doll",
  },
  {
    slug: "child-memory",
    defaultTitle: "Child Memory",
    modelPath: "video-effects/child-memory",
  },
  {
    slug: "claysho",
    defaultTitle: "Claysho",
    modelPath: "video-effects/claysho",
  },
  {
    slug: "couple-arrival",
    defaultTitle: "Couple Arrival",
    modelPath: "video-effects/couple-arrival",
  },
  {
    slug: "couple-hugging",
    defaultTitle: "Couple Hugging",
    modelPath: "video-effects/couple-hugging",
  },
  {
    slug: "dreamy-wedding",
    defaultTitle: "Dreamy Wedding",
    modelPath: "video-effects/dreamy-wedding",
  },
  {
    slug: "exotic-princess",
    defaultTitle: "Exotic Princess",
    modelPath: "video-effects/exotic-princess",
  },
  {
    slug: "fairy-me",
    defaultTitle: "Fairy Me",
    modelPath: "video-effects/fairy-me",
  },
  {
    slug: "fashion-stride",
    defaultTitle: "Fashion Stride",
    modelPath: "video-effects/fashion-stride",
  },
  {
    slug: "fishermen",
    defaultTitle: "Fishermen",
    modelPath: "video-effects/fishermen",
  },
  {
    slug: "flame-carpet",
    defaultTitle: "Flame Carpet",
    modelPath: "video-effects/flame-carpet",
  },
  {
    slug: "flower-receive",
    defaultTitle: "Flower Receive",
    modelPath: "video-effects/flower-receive",
  },
  {
    slug: "fluffy-plunge",
    defaultTitle: "Fluffy Plunge",
    modelPath: "video-effects/fluffy-plunge",
  },
  {
    slug: AI_FLYING_SLUG,
    defaultTitle: "Flying",
    modelPath: "video-effects/flying",
  },
  {
    slug: "french-kiss",
    defaultTitle: "French Kiss",
    modelPath: "video-effects/french-kiss",
  },
  {
    slug: "gender-swap",
    defaultTitle: "Gender Swap",
    modelPath: "video-effects/gender-swap",
  },
  { slug: "ghibli", defaultTitle: "Ghibli", modelPath: "video-effects/ghibli" },
  {
    slug: "golden-epoch",
    defaultTitle: "Golden Epoch",
    modelPath: "video-effects/golden-epoch",
  },
  {
    slug: "hair-swap",
    defaultTitle: "Hair Swap",
    modelPath: "video-effects/hair-swap",
  },
  {
    slug: "halloween",
    defaultTitle: "Halloween",
    modelPath: "vidu/template/halloween",
  },
  {
    slug: "hugging",
    defaultTitle: "Hugging",
    modelPath: "video-effects/hugging",
  },
  { slug: "hulk", defaultTitle: "Hulk", modelPath: "video-effects/hulk" },
  {
    slug: "hulk-dive",
    defaultTitle: "Hulk Dive",
    modelPath: "video-effects/hulk-dive",
  },
  {
    slug: AI_JIGGLE_SLUG,
    defaultTitle: "Jiggle Up",
    modelPath: "video-effects/jiggle-up",
  },
  {
    slug: "kissing-pro",
    defaultTitle: "Kissing Pro",
    modelPath: "video-effects/kissing-pro",
  },
  {
    slug: "ladudu-me-random",
    defaultTitle: "Ladudu Me Random",
    modelPath: "video-effects/ladudu-me-random",
  },
  {
    slug: "live-memory",
    defaultTitle: "Live Memory",
    modelPath: "video-effects/live-memory",
  },
  {
    slug: "love-drop",
    defaultTitle: "Love Drop",
    modelPath: "video-effects/love-drop",
  },
  {
    slug: "love-story",
    defaultTitle: "Love Story",
    modelPath: "video-effects/love-story",
  },
  {
    slug: "manga-meme",
    defaultTitle: "Manga Meme",
    modelPath: "video-effects/manga-meme",
  },
  { slug: "melt", defaultTitle: "Melt", modelPath: "video-effects/melt" },
  {
    slug: "minecraft",
    defaultTitle: "Minecraft",
    modelPath: "video-effects/minecraft",
  },
  {
    slug: "muscling",
    defaultTitle: "Muscling",
    modelPath: "video-effects/muscling",
  },
  {
    slug: "nap-me-360p",
    defaultTitle: "Nap Me 360p",
    modelPath: "video-effects/nap-me-360p",
  },
  {
    slug: "oscar-gala",
    defaultTitle: "Oscar Gala",
    modelPath: "video-effects/oscar-gala",
  },
  {
    slug: "paperman",
    defaultTitle: "Paperman",
    modelPath: "video-effects/paperman",
  },
  {
    slug: "pet-lovers",
    defaultTitle: "Pet Lovers",
    modelPath: "video-effects/pet-lovers",
  },
  { slug: "pilot", defaultTitle: "Pilot", modelPath: "video-effects/pilot" },
  { slug: "pinch", defaultTitle: "Pinch", modelPath: "video-effects/pinch" },
  {
    slug: "pixel-me",
    defaultTitle: "Pixel Me",
    modelPath: "video-effects/pixel-me",
  },
  {
    slug: "pubg-winner-hit",
    defaultTitle: "PUBG Winner Hit",
    modelPath: "video-effects/pubg-winner-hit",
  },
  {
    slug: "rain-kiss",
    defaultTitle: "Rain Kiss",
    modelPath: "video-effects/rain-kiss",
  },
  {
    slug: "red-or-white",
    defaultTitle: "Red Or White",
    modelPath: "video-effects/red-or-white",
  },
  {
    slug: "romantic-lift",
    defaultTitle: "Romantic Lift",
    modelPath: "video-effects/romantic-lift",
  },
  {
    slug: "sexy-me",
    defaultTitle: "Sexy Me",
    modelPath: "video-effects/sexy-me",
  },
  {
    slug: "shake-dance",
    defaultTitle: "Shake Dance",
    modelPath: "video-effects/shake-dance",
  },
  {
    slug: "slice-therapy",
    defaultTitle: "Slice Therapy",
    modelPath: "video-effects/slice-therapy",
  },
  {
    slug: "soul-depart",
    defaultTitle: "Soul Depart",
    modelPath: "video-effects/soul-depart",
  },
  {
    slug: "split-stance-human",
    defaultTitle: "Split Stance Human",
    modelPath: "video-effects/split-stance-human",
  },
  {
    slug: "squid-game",
    defaultTitle: "Squid Game",
    modelPath: "video-effects/squid-game",
  },
  {
    slug: "star-carpet",
    defaultTitle: "Star Carpet",
    modelPath: "video-effects/star-carpet",
  },
  {
    slug: "subject-3",
    defaultTitle: "Subject 3",
    modelPath: "video-effects/subject-3",
  },
  {
    slug: "sweet-proposal",
    defaultTitle: "Sweet Proposal",
    modelPath: "video-effects/sweet-proposal",
  },
  { slug: "tap-me", defaultTitle: "Tap Me", modelPath: "video-effects/tap-me" },
  { slug: "toy-me", defaultTitle: "Toy Me", modelPath: "video-effects/toy-me" },
  {
    slug: "walk-forward",
    defaultTitle: "Walk Forward",
    modelPath: "video-effects/walk-forward",
  },
  {
    slug: "zoom-in-fast",
    defaultTitle: "Zoom In Fast",
    modelPath: "video-effects/zoom-in-fast",
  },
  {
    slug: "zoom-out",
    defaultTitle: "Zoom Out",
    modelPath: "video-effects/zoom-out",
  },
];

const ASPECT_POOL = ["9 / 14", "9 / 15", "3 / 5", "4 / 5", "16 / 9"] as const;

const videoEffectSampleMap = videoEffectSamples as VideoEffectSampleRecord;
const VIDEO_EFFECT_SAMPLE_OVERRIDES: Partial<VideoEffectSampleRecord> = {
  [AI_JIGGLE_SLUG]: {
    sourceImageUrl:
      "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-image-e463fab03e57953e6a078ac00bb6b34a.jpg",
    sampleVideoUrl:
      "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-video-640b96e0f9faec4408a04bf1dce0f805.mp4",
    samplePreviewClipUrl:
      "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-video-640b96e0f9faec4408a04bf1dce0f805.mp4",
    examples: [
      {
        inputImageUrl:
          "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-image-e463fab03e57953e6a078ac00bb6b34a.jpg",
        outputVideoUrl:
          "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-video-640b96e0f9faec4408a04bf1dce0f805.mp4",
        outputPreviewClipUrl:
          "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-video-640b96e0f9faec4408a04bf1dce0f805.mp4",
      },
    ],
  },
};
const wavespeedVideoEffectProducts = (
  (wavespeedModelProducts as { items?: WavespeedModelProductRecord[] }).items ||
  []
).filter(
  (item) =>
    item.type === "video-effects" ||
    item.model_uuid?.startsWith("video-effects/") ||
    item.model_name?.startsWith("video-effects/"),
);

function buildVideoEffectItem(
  baseItem: VideoEffectBaseItem,
  index: number,
  titleMap: Record<string, string>,
): VideoEffectItem | null {
  const sample = {
    ...videoEffectSampleMap[baseItem.slug],
    ...VIDEO_EFFECT_SAMPLE_OVERRIDES[baseItem.slug],
  };
  const product = wavespeedVideoEffectProducts.find(
    (item) =>
      item.model_uuid === baseItem.modelPath ||
      item.model_name === baseItem.modelPath,
  );
  const sampleVideoUrl = sample?.sampleVideoUrl || product?.cover_url;
  const samplePreviewClipUrl =
    sample?.samplePreviewClipUrl || sampleVideoUrl || product?.cover_url;
  const fallbackSourceImageUrl = sample?.sourceImageUrl || product?.poster;

  if (!sampleVideoUrl) {
    return null;
  }

  return {
    id: baseItem.slug,
    slug: baseItem.slug,
    title: titleMap[baseItem.slug] || baseItem.defaultTitle,
    aspectRatio: ASPECT_POOL[index % ASPECT_POOL.length],
    modelPath: baseItem.modelPath,
    docUrl: `https://wavespeed.ai/docs/docs-api/video-effects/video-effects-${baseItem.slug}`,
    coverUrl: fallbackSourceImageUrl,
    sourceImageUrl: fallbackSourceImageUrl,
    examples: sample?.examples,
    sampleVideoUrl,
    samplePreviewClipUrl,
    sampleTaskId: sample?.sampleTaskId,
    sampleGeneratedAt: sample?.sampleGeneratedAt,
  };
}

export function getAllVideoEffectItemsSync(
  titleMap: Record<string, string> = {},
): VideoEffectItem[] {
  return VIDEO_EFFECT_BASE_ITEMS.map((baseItem, index) =>
    buildVideoEffectItem(baseItem, index, titleMap),
  ).filter((item): item is VideoEffectItem => Boolean(item));
}

export function getVideoEffectItemsSync(
  titleMap: Record<string, string> = {},
): VideoEffectItem[] {
  const allItems = getAllVideoEffectItemsSync(titleMap);
  const filteredItems =
    isCreemReviewMode() && allItems.length > 0
      ? allItems.filter(
          (item) => !isBlockedVideoEffectSlugInCreemReviewMode(item.slug),
        )
      : allItems;

  const itemMap = new Map(filteredItems.map((item) => [item.slug, item]));
  const kissStyleItems = VIDEO_KISS_STYLE_SLUGS.map((slug) => itemMap.get(slug))
    .filter((item): item is VideoEffectItem => Boolean(item))
    .map((item) => ({
      ...item,
      hubSlug: AI_KISSING_HUB_SLUG,
    }));

  return filteredItems
    .filter(
      (item) =>
        !VIDEO_KISS_STYLE_SLUGS.includes(
          item.slug as (typeof VIDEO_KISS_STYLE_SLUGS)[number],
        ) || item.slug === AI_KISSING_HUB_SLUG,
    )
    .map((item) =>
      item.slug === AI_KISSING_HUB_SLUG
        ? {
            ...item,
            styleItems: kissStyleItems,
          }
        : item,
    );
}

export function getVideoEffectItemBySlugSync(
  slug: string,
  titleMap: Record<string, string> = {},
): VideoEffectItem | null {
  return (
    getAllVideoEffectItemsSync(titleMap).find((item) => item.slug === slug) ||
    null
  );
}

export async function getVideoEffectItems(
  titleMap: Record<string, string> = {},
): Promise<VideoEffectItem[]> {
  return getVideoEffectItemsSync(titleMap);
}
