import type {
  FieldOption,
  FieldSchema,
  PlaygroundConfig,
} from "@/shared/blocks/desktop-playground";

type Translate = (key: string, values?: Record<string, string | number>) => string;

const FIELD_KEY_MAP: Record<string, string> = {
  prompt: "fields.prompt",
  negativePrompt: "fields.negativePrompt",
  referenceImages: "fields.referenceImages",
  referenceImagesExtra: "fields.referenceImages",
  firstFrameImage: "fields.firstFrame",
  lastFrameImage: "fields.lastFrame",
  video: "fields.referenceVideo",
  audio: "fields.referenceAudio",
  referenceVideo: "fields.referenceVideo",
  referenceVideos: "fields.referenceVideo",
  referenceAudio: "fields.referenceAudio",
  referenceAudios: "fields.referenceAudio",
  audioTrack: "fields.audioTrack",
  maskImage: "fields.maskImage",
  aspectRatio: "fields.aspectRatio",
  resolution: "fields.resolution",
  outputFormat: "fields.outputFormat",
  seed: "fields.seed",
  width: "fields.width",
  height: "fields.height",
  size: "fields.size",
  duration: "fields.duration",
  shotType: "fields.shotType",
  enablePromptExpansion: "fields.promptExpansion",
  generateAudio: "fields.generateAudio",
  fixedCamera: "fields.fixedCamera",
  thinking_mode: "fields.thinkingMode",
  thinkingType: "fields.thinkingType",
  movementAmplitude: "fields.movementAmplitude",
  numLayers: "fields.numberOfLayers",
  quality: "fields.quality",
  stylize: "fields.stylize",
  chaos: "fields.chaos",
  weird: "fields.weird",
  version: "fields.version",
  niji: "fields.niji",
  strength: "fields.strength",
  style: "fields.style",
  targetResolution: "fields.targetResolution",
};

const RAW_LABEL_KEY_MAP: Record<string, string> = {
  Prompt: "fields.prompt",
  "Negative Prompt": "fields.negativePrompt",
  "Reference Image": "fields.referenceImage",
  "Reference Images": "fields.referenceImages",
  "Reference Videos": "fields.referenceVideo",
  "First Frame": "fields.firstFrame",
  "Last Frame (Optional)": "fields.lastFrame",
  Video: "fields.referenceVideo",
  Audio: "fields.referenceAudio",
  "Reference Video": "fields.referenceVideo",
  "Reference Audio": "fields.referenceAudio",
  "Audio Track": "fields.audioTrack",
  "Mask Image": "fields.maskImage",
  "Aspect Ratio": "fields.aspectRatio",
  Resolution: "fields.resolution",
  "Output Format": "fields.outputFormat",
  Seed: "fields.seed",
  Width: "fields.width",
  Height: "fields.height",
  Size: "fields.size",
  Duration: "fields.duration",
  "Shot Type": "fields.shotType",
  "Prompt Expansion": "fields.promptExpansion",
  "Generate Audio": "fields.generateAudio",
  "Fixed Camera": "fields.fixedCamera",
  "Thinking Mode": "fields.thinkingMode",
  "Thinking Type": "fields.thinkingType",
  "Movement Amplitude": "fields.movementAmplitude",
  "Number of Layers": "fields.numberOfLayers",
  Quality: "fields.quality",
  Stylize: "fields.stylize",
  Chaos: "fields.chaos",
  Weird: "fields.weird",
  Version: "fields.version",
  Niji: "fields.niji",
  Strength: "fields.strength",
  Style: "fields.style",
  "Target Resolution": "fields.targetResolution",
};

const OPTION_KEY_MAP: Record<string, string> = {
  Auto: "options.auto",
  Enabled: "options.enabled",
  Disabled: "options.disabled",
  Low: "options.low",
  Medium: "options.medium",
  High: "options.high",
  Small: "options.small",
  Large: "options.large",
  "Single Shot": "options.singleShot",
  "Multiple Shots": "options.multipleShots",
  None: "options.none",
  Close: "options.close",
};

const PLACEHOLDER_KEY_MAP: Record<string, string> = {
  "Describe the image you want to generate": "placeholders.describeImage",
  "Describe how the uploaded image should be transformed":
    "placeholders.transformImage",
  "Describe the video you want to generate": "placeholders.describeVideo",
  "Describe how the uploaded image should move": "placeholders.animateImage",
  "Describe what you want to avoid": "placeholders.negativePrompt",
  "Use -1 for random seed": "placeholders.randomSeed",
  "Leave empty or use -1 for random seed": "placeholders.randomSeedOrEmpty",
  "Describe what should fill the erased area": "placeholders.fillErasedArea",
};

const DESCRIPTION_KEY_MAP: Record<string, string> = {
  "Describe the image you want to generate": "descriptions.describeImage",
  "Image width in pixels (256-1536, must be multiple of 64)":
    "descriptions.widthPixels",
  "Image height in pixels (256-1536, must be multiple of 64)":
    "descriptions.heightPixels",
  "Set a seed value for reproducible results. Use -1 for random seed.":
    "descriptions.seedHelp",
  "Upload an optional reference image to influence style.":
    "descriptions.optionalReferenceImage",
  "Choose how many semantic layers to split from the source image.":
    "descriptions.numberOfLayers",
  "Let the model expand short prompts automatically.":
    "descriptions.promptExpansion",
  "Generate synced audio with the video.": "descriptions.generateAudioSynced",
  "Create native synced audio in the output video.":
    "descriptions.generateAudioNative",
  "Keep the camera more stable during generation.":
    "descriptions.fixedCamera",
  "Enable thinking mode for enhanced reasoning and better image quality. Increases generation time.":
    "descriptions.thinkingMode",
  "Include model-generated audio in the result.":
    "descriptions.generateAudioIncluded",
  "Create synced audio with the video output.":
    "descriptions.generateAudioOutput",
  "Upload a video to transfer its motion pattern.":
    "descriptions.referenceVideoMotion",
  "Upload an audio track up to 120 seconds.":
    "descriptions.audioTrackLimit",
  "Upload the face image you want to swap into the video.":
    "descriptions.faceImage",
  "Upload the target video for face swap.":
    "descriptions.targetVideo",
  "Optional. Upload a mask image to control what gets erased.":
    "descriptions.maskImage",
  "Upload the first frame image": "descriptions.uploadFirstFrameImage",
  "Optional. Upload a last frame image to enable transition from first to last frame.":
    "descriptions.uploadLastFrameImageOptional",
  "MP4, WebM, MOV (max 50MB, up to 3 videos, duration ≤ 15s)":
    "descriptions.referenceVideoLimit",
  "WAV, MP3 (max 20MB, up to 3 audios, duration ≤ 15s)":
    "descriptions.referenceAudioLimit",
};

function localizeLabel(fieldKey: string, label: string, t: Translate) {
  const key = FIELD_KEY_MAP[fieldKey] || RAW_LABEL_KEY_MAP[label];
  return key ? t(key) : label;
}

function localizeOption(option: FieldOption, t: Translate): FieldOption {
  const key = OPTION_KEY_MAP[option.label];
  return key ? { ...option, label: t(key) } : option;
}

function localizeDescription(
  description: string | undefined,
  t: Translate,
): string | undefined {
  if (!description) return description;

  const uploadMatch = description.match(/^Upload up to (\d+) images$/);
  if (uploadMatch) {
    return t("descriptions.uploadUpToImages", {
      count: Number(uploadMatch[1]),
    });
  }

  if (description === "Upload an image to animate") {
    return t("descriptions.uploadImageToAnimate");
  }

  const key = DESCRIPTION_KEY_MAP[description];
  return key ? t(key) : description;
}

function localizePlaceholder(
  fieldKey: string,
  placeholder: string | undefined,
  scenarioType: PlaygroundConfig["scenarioType"],
  t: Translate,
): string | undefined {
  if (!placeholder) return placeholder;

  const key = PLACEHOLDER_KEY_MAP[placeholder];
  if (key) return t(key);

  if (fieldKey === "prompt") {
    if (scenarioType === "text-to-image") return t("placeholders.describeImage");
    if (scenarioType === "image-to-image") return t("placeholders.transformImage");
    if (scenarioType === "text-to-video") return t("placeholders.describeVideo");
    if (scenarioType === "image-to-video") return t("placeholders.animateImage");
  }

  return placeholder;
}

export function localizeFieldSchema(
  fieldKey: string,
  field: FieldSchema,
  scenarioType: PlaygroundConfig["scenarioType"],
  t: Translate,
): FieldSchema {
  return {
    ...field,
    label: localizeLabel(fieldKey, field.label, t),
    description: localizeDescription(field.description, t),
    placeholder: localizePlaceholder(
      fieldKey,
      field.placeholder,
      scenarioType,
      t,
    ),
    options: field.options?.map((option) => localizeOption(option, t)),
  };
}
