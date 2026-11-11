import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";

type JsonRecord = Record<string, any>;

type MapParamsOptions = {
  config: PlaygroundConfig;
  inputs?: JsonRecord | null;
};

const FIELD_ALIASES: Record<string, string[]> = {
  prompt: ["prompt"],
  negativePrompt: ["negative_prompt", "negativePrompt"],
  aspectRatio: ["aspect_ratio", "resolution_ratio", "aspectRatio", "size"],
  size: ["size", "aspect_ratio", "resolution_ratio"],
  resolution: ["resolution"],
  duration: ["duration"],
  outputFormat: ["output_format", "outputFormat"],
  seed: ["seed"],
  quality: ["quality"],
  stylize: ["stylize"],
  chaos: ["chaos"],
  weird: ["weird"],
  version: ["version"],
  niji: ["niji"],
  motion: ["motion"],
  thinkingType: ["thinking_type", "thinkingType"],
  movementAmplitude: ["movement_amplitude", "movementAmplitude"],
  shotType: ["shot_type", "shotType"],
  generateAudio: ["generate_audio", "generate_audio_switch", "generateAudio"],
  bgm: ["bgm"],
  enablePromptExpansion: [
    "enable_prompt_expansion",
    "enablePromptExpansion",
  ],
  strength: ["strength"],
  targetResolution: ["target_resolution", "targetResolution", "resolution"],
  keepOriginalSound: ["keep_original_sound", "keepOriginalSound"],
  permissionConfirmed: ["permission_confirmed"],
  legalConfirmed: ["legal_confirmed"],
  syntheticConfirmed: ["synthetic_confirmed"],
  referenceImages: ["images", "image", "reference_images", "image_urls"],
  referenceImage: ["image", "images", "reference_images"],
  firstFrameImage: ["image", "first_frame_image", "first_frame"],
  lastFrameImage: ["last_frame_image", "last_frame"],
  maskImage: ["mask_image", "maskImage"],
  referenceVideo: ["video", "reference_video", "referenceVideo"],
  referenceVideos: ["reference_videos", "videos", "referenceVideos"],
  referenceAudios: ["reference_audios", "audios", "referenceAudios"],
  audioTrack: ["audio", "audio_track", "audioTrack"],
};

function normalizeValue(value: string | number) {
  return String(value).trim().toLowerCase().replace(/[x*×]/g, "*");
}

function isImageUploaderValue(value: unknown): value is ImageUploaderValue {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in (value as Record<string, unknown>) &&
    "preview" in (value as Record<string, unknown>)
  );
}

function toUploadItems(value: unknown, prefix: string) {
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  return urls
    .map((item, index) => {
      if (isImageUploaderValue(item)) {
        return item;
      }

      if (typeof item === "string" && item.trim()) {
        return {
          id: `${prefix}-${index}`,
          preview: item,
          url: item,
          status: "uploaded" as const,
        };
      }

      if (
        item &&
        typeof item === "object" &&
        typeof (item as { url?: unknown }).url === "string"
      ) {
        const url = String((item as { url: string }).url);
        return {
          id: `${prefix}-${index}`,
          preview: url,
          url,
          status: "uploaded" as const,
        };
      }

      return null;
    })
    .filter(Boolean);
}

function readInputValue(inputs: JsonRecord, fieldKey: string) {
  const candidates = FIELD_ALIASES[fieldKey] || [fieldKey];

  for (const key of candidates) {
    const value = inputs[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  if (
    fieldKey === "firstFrameImage" &&
    Array.isArray(inputs.image_with_roles) &&
    inputs.image_with_roles.length > 0
  ) {
    const item = inputs.image_with_roles.find(
      (entry: { role?: string }) => entry.role === "first_frame",
    );
    return item?.url;
  }

  if (
    fieldKey === "lastFrameImage" &&
    Array.isArray(inputs.image_with_roles) &&
    inputs.image_with_roles.length > 0
  ) {
    const item = inputs.image_with_roles.find(
      (entry: { role?: string }) => entry.role === "last_frame",
    );
    return item?.url;
  }

  return undefined;
}

function toAspectRatio(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const normalized = String(value).trim().replace(/[x*×]/g, ":");
  const parts = normalized.split(":").map((part) => Number(part.trim()));

  if (
    parts.length === 2 &&
    Number.isFinite(parts[0]) &&
    Number.isFinite(parts[1]) &&
    parts[0] > 0 &&
    parts[1] > 0
  ) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(parts[0], parts[1]);
    return `${parts[0] / divisor}:${parts[1] / divisor}`;
  }

  return undefined;
}

function readAspectRatioCandidate(inputs?: JsonRecord | null) {
  if (!inputs) {
    return undefined;
  }

  return (
    inputs.aspect_ratio ??
    inputs.resolution_ratio ??
    inputs.aspectRatio ??
    inputs.size ??
    (inputs.width && inputs.height ? `${inputs.width}:${inputs.height}` : undefined)
  );
}

function toSize(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  return String(value).trim().replace(/[x×]/gi, "*");
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return Boolean(value);
}

function normalizeOptionValue(value: unknown, fieldKey: string) {
  if (fieldKey === "aspectRatio") {
    return toAspectRatio(value);
  }

  if (fieldKey === "size") {
    return toSize(value);
  }

  if (fieldKey === "duration" && value !== undefined && value !== null) {
    return String(value).trim();
  }

  if (fieldKey === "outputFormat" && value !== undefined && value !== null) {
    return String(value).trim().toLowerCase();
  }

  if (fieldKey === "seed" && value !== undefined && value !== null) {
    return String(value).trim();
  }

  if (fieldKey === "targetResolution" && value !== undefined && value !== null) {
    return String(value).trim().toLowerCase();
  }

  return value !== undefined && value !== null ? String(value).trim() : undefined;
}

function mapFieldValue(
  fieldKey: string,
  field: PlaygroundConfig["schema"][string],
  rawValue: unknown,
) {
  if (!field || rawValue === undefined || rawValue === null) {
    return undefined;
  }

  if (
    fieldKey === "referenceImages" ||
    fieldKey === "referenceImage" ||
    fieldKey === "firstFrameImage" ||
    fieldKey === "lastFrameImage" ||
    fieldKey === "maskImage" ||
    fieldKey === "referenceVideo" ||
    fieldKey === "referenceVideos" ||
    fieldKey === "referenceAudios" ||
    fieldKey === "audioTrack"
  ) {
    return toUploadItems(rawValue, fieldKey);
  }

  if (field.type === "toggle") {
    return toBoolean(rawValue);
  }

  if (field.type === "number" || field.type === "slider") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (field.type === "select" && field.options?.length) {
    const target = normalizeOptionValue(rawValue, fieldKey);
    if (target === undefined) {
      return undefined;
    }

    const matched = field.options.find(
      (option) =>
        normalizeValue(option.value) === normalizeValue(String(target)),
    );

    if (matched) {
      return matched.value;
    }

    if (
      fieldKey === "aspectRatio" &&
      typeof target === "string" &&
      target &&
      field.options.some(
        (option) => normalizeValue(option.value).includes(normalizeValue(target)),
      )
    ) {
      return field.options.find((option) =>
        normalizeValue(option.value).includes(normalizeValue(target)),
      )?.value;
    }

    return undefined;
  }

  return String(rawValue);
}

function getSchemaDefaults(config: PlaygroundConfig) {
  const defaults: Record<string, any> = {};

  for (const [key, field] of Object.entries(config.schema)) {
    if (field) {
      defaults[key] = field.defaultValue;
    }
  }

  return defaults;
}

export function mapWavespeedExampleParamsToWorkbench({
  config,
  inputs,
}: MapParamsOptions) {
  const params = getSchemaDefaults(config);

  if (!inputs) {
    return params;
  }

  for (const [fieldKey, field] of Object.entries(config.schema)) {
    const rawValue = readInputValue(inputs, fieldKey);
    const mappedValue = mapFieldValue(fieldKey, field, rawValue);

    if (mappedValue !== undefined) {
      params[fieldKey] = mappedValue;
    }
  }

  return params;
}

export function inferWavespeedAspectRatio(inputs?: JsonRecord | null) {
  return toAspectRatio(readAspectRatioCandidate(inputs));
}
