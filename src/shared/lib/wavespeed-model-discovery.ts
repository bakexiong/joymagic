import { REGISTRY_KEY_BY_URL } from "@/shared/blocks/desktop-playground/playground-config-registry";
import {
  WAVESPEED_MODEL_MAPPING_BY_CURRENT_URL,
  type WavespeedModelMapping,
} from "@/shared/lib/wavespeed-model-mapping";

export type WavespeedModelProduct = {
  model_id: number;
  model_uuid: string;
  model_name: string;
  type?: string;
  tags?: string[];
  visits?: number;
};

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_.:/]+/g, " ")
    .replace(/\b(text|image|video|generator|lite|turbo|edit|pro|max)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCandidate(
  currentModelUrl: string,
  product: WavespeedModelProduct,
) {
  const currentSlug = currentModelUrl.split("/").filter(Boolean).pop() || "";
  const slugTokens = normalizeToken(currentSlug).split(" ").filter(Boolean);
  const productText = normalizeToken(
    `${product.model_uuid} ${product.model_name} ${(product.tags || []).join(" ")}`,
  );

  let score = 0;

  for (const token of slugTokens) {
    if (productText.includes(token)) {
      score += token.length >= 4 ? 4 : 2;
    }
  }

  if (
    currentModelUrl.includes("/text-to-image") &&
    product.type === "text-to-image"
  ) {
    score += 8;
  }
  if (
    currentModelUrl.includes("/image-to-image") &&
    product.type === "image-to-image"
  ) {
    score += 8;
  }
  if (
    currentModelUrl.includes("/text-to-video") &&
    product.type === "text-to-video"
  ) {
    score += 8;
  }
  if (
    currentModelUrl.includes("/image-to-video") &&
    product.type === "image-to-video"
  ) {
    score += 8;
  }
  if (
    currentModelUrl.includes("/reference-to-video") &&
    product.type === "image-to-video"
  ) {
    score += 8;
  }

  if (product.visits) {
    score += Math.min(5, Math.round(product.visits / 2000));
  }

  return score;
}

export function buildWavespeedMappingCandidates(
  products: WavespeedModelProduct[],
) {
  return Object.keys(REGISTRY_KEY_BY_URL).map((currentModelUrl) => {
    const existing = WAVESPEED_MODEL_MAPPING_BY_CURRENT_URL[currentModelUrl];
    const candidates = products
      .map((product) => ({
        product,
        score: scoreCandidate(currentModelUrl, product),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);

    return {
      currentModelUrl,
      existing,
      candidates,
    };
  });
}

export function toMappingSuggestion(
  currentModelUrl: string,
  product: WavespeedModelProduct,
): WavespeedModelMapping {
  return {
    currentModelUrl,
    currentModelLabel:
      currentModelUrl.split("/").filter(Boolean).pop() || currentModelUrl,
    mediaType: product.type?.includes("video") ? "video" : "image",
    wavespeedExamplePath: product.model_uuid,
    wavespeedModelId: product.model_uuid,
    wavespeedExampleCandidates: [product.model_uuid],
  };
}
