import type { PlaygroundConfig } from "../types/playground-config";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import { executeGeneration } from "./execute-generation";
import { getLongcatAvatarBilledDuration } from "@/shared/lib/billing/longcat-avatar";

const textToVideoPromptField = {
  type: "textarea" as const,
  label: "Prompt",
  placeholder: "Describe the video you want to generate",
  defaultValue: "",
  required: true,
};

const imageToVideoPromptField = {
  type: "textarea" as const,
  label: "Prompt",
  placeholder: "Describe how the uploaded image should move",
  defaultValue: "",
  required: true,
};

const negativePromptField = {
  type: "textarea" as const,
  label: "Negative Prompt",
  placeholder: "Describe what you want to avoid",
  defaultValue: "",
};

const aspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "21:9", value: "21:9" },
];

const pixverseAspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "9:16", value: "9:16" },
];

const imageToVideoAspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

const seedanceAspectRatioOptions = [
  { label: "21:9", value: "21:9" },
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "9:16", value: "9:16" },
];

const seedance20SizeOptions = [
  { label: "21:9", value: "21:9" },
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "9:16", value: "9:16" },
];

const videoResolutionOptions = [
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
];

const wan27TextToVideoAspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
];

const seedance20ResolutionOptions = [
  { label: "720p", value: "720p" },
  { label: "480p", value: "480p" },
];

const seedanceResolutionOptions = [
  { label: "Fast 720p", value: "fast 720p" },
  { label: "Fast 1080p", value: "fast 1080p" },
  { label: "720p", value: "720p" },
  { label: "480p", value: "480p" },
];

const pixverseResolutionOptions = [
  { label: "360p", value: "360p" },
  { label: "540p", value: "540p" },
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
];

const viduResolutionOptions = [
  { label: "540p", value: "540p" },
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
];

const wanSizeOptions = [
  { label: "1280×720", value: "1280*720" },
  { label: "1920×1080", value: "1920*1080" },
  { label: "720×1280", value: "720*1280" },
  { label: "1080×1920", value: "1080*1920" },
];

const wanDurationOptions = [
  { label: "5s", value: "5" },
  { label: "10s", value: "10" },
  { label: "15s", value: "15" },
];

const veoDurationOptions = [
  { label: "4s", value: "4" },
  { label: "6s", value: "6" },
  { label: "8s", value: "8" },
];

const pixverseDurationOptions = [
  { label: "5s", value: "5" },
  { label: "8s", value: "8" },
  { label: "10s", value: "10" },
];

const pixverse1080pDurationOptions = [
  { label: "5s", value: "5" },
  { label: "8s", value: "8" },
];

const ltxDurationOptions = [6, 8, 10, 12, 14, 16, 18, 20].map((value) => ({
  label: `${value}s`,
  value: String(value),
}));

const seedanceDurationOptions = Array.from({ length: 8 }, (_, index) => {
  const value = index + 5;
  return { label: `${value}s`, value: String(value) };
});

const seedance20DurationOptions = Array.from({ length: 12 }, (_, index) => {
  const value = index + 4;
  return { label: `${value}s`, value: String(value) };
});

const viduDurationOptions = [4, 8].map((value) => ({
  label: `${value}s`,
  value: String(value),
}));

const referenceToVideoKlingDurationOptions = [3, 5, 10, 15].map((value) => ({
  label: `${value}s`,
  value: String(value),
}));

const referenceToVideoWanDurationOptions = [5, 10, 15].map((value) => ({
  label: `${value}s`,
  value: String(value),
}));

const referenceToVideoGrokDurationOptions = [6, 10].map((value) => ({
  label: `${value}s`,
  value: String(value),
}));

const referenceToVideoKlingO1DurationOptions = Array.from(
  { length: 8 },
  (_, index) => {
    const value = index + 3;
    return { label: `${value}s`, value: String(value) };
  },
);

const referenceToVideoAspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
];

const happyhorseDurationOptions = Array.from({ length: 13 }, (_, index) => {
  const value = index + 3;
  return { label: `${value}s`, value: String(value) };
});

const happyhorseTextToVideoAspectRatioOptions = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
];

const happyhorseResolutionOptions = [
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
];

const wanVideoExtendDurationOptions = Array.from({ length: 11 }, (_, index) => {
  const value = index + 5;
  return { label: `${value}s`, value };
});

const shotTypeOptions = [
  { label: "Single Shot", value: "single" },
  { label: "Multiple Shots", value: "multiple" },
];

const klingReferenceToVideoShotTypeOptions = [
  { label: "Intelligent", value: "intelligent" },
  { label: "Customize", value: "customize" },
];

const thinkingTypeOptions = [
  { label: "Auto", value: "auto" },
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
];

const movementAmplitudeOptions = [
  { label: "Auto", value: "auto" },
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const midjourneyResolutionOptions = [
  { label: "480p", value: "480p" },
  { label: "720p", value: "720p" },
];

const midjourneyAspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "2:3", value: "2:3" },
  { label: "16:9", value: "16:9" },
  { label: "1:2", value: "1:2" },
];

const midjourneyMotionOptions = [
  { label: "Low", value: "low" },
  { label: "High", value: "high" },
];

const midjourneyQualityOptions = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
];

const midjourneyRangeOptions = [0, 25, 50, 75, 100].map((value) => ({
  label: String(value),
  value: String(value),
}));

const motionControlDurationTiers = [5, 10, 15, 30];

function createUploadField(config: {
  label: string;
  description: string;
  accept: string;
  required?: boolean;
  uploadUrl?: string;
  previewType?: "image" | "video" | "audio" | "auto";
  maxSizeMB?: number;
  maxFiles?: number;
}) {
  const maxFiles = config.maxFiles ?? 1;

  return {
    type: "upload" as const,
    label: config.label,
    description: config.description,
    defaultValue: [],
    required: config.required ?? true,
    accept: config.accept,
    multiple: maxFiles > 1,
    maxFiles,
    uploadUrl: config.uploadUrl,
    previewType: config.previewType,
    maxSizeMB: config.maxSizeMB,
  };
}

function createReferenceImagesField(maxFiles = 1) {
  return createUploadField({
    label: maxFiles > 1 ? "Reference Images" : "Reference Image",
    description:
      maxFiles > 1
        ? `Upload up to ${maxFiles} images`
        : "Upload an image to animate",
    accept: "image/*",
    required: false,
    previewType: "image",
    maxFiles,
  });
}

function createReferenceVideosField(config?: {
  required?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  description?: string;
}) {
  const maxFiles = config?.maxFiles ?? 1;

  return createUploadField({
    label: maxFiles > 1 ? "Reference Videos" : "Reference Video",
    description:
      config?.description ||
      (maxFiles > 1
        ? `Upload up to ${maxFiles} reference videos`
        : "Upload a reference video"),
    accept: "video/mp4,video/webm,video/quicktime",
    required: config?.required,
    uploadUrl: "/api/storage/upload-video",
    previewType: "video",
    maxFiles,
    maxSizeMB: config?.maxSizeMB ?? 200,
  });
}

function getUploadedMediaItems(values: Record<string, any>, fieldKey: string) {
  const items = Array.isArray(values[fieldKey])
    ? (values[fieldKey] as ImageUploaderValue[])
    : [];

  return items;
}

function getUploadedMediaUrls(
  values: Record<string, any>,
  fieldKey = "referenceImages",
) {
  return getUploadedMediaItems(values, fieldKey)
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

function validateUploadedMediaDuration(
  values: Record<string, any>,
  fieldKey: string,
  maxDurationSeconds: number,
  label: string,
) {
  const exceeded = getUploadedMediaItems(values, fieldKey).find((item) => {
    if (typeof item.duration !== "number" || !Number.isFinite(item.duration)) {
      return false;
    }
    return item.duration > maxDurationSeconds;
  });

  if (exceeded) {
    throw new Error(`${label} duration must be <= ${maxDurationSeconds}s`);
  }
}

function getMotionControlBilledDuration(duration?: number) {
  if (!duration || duration <= 0) {
    return undefined;
  }

  return (
    motionControlDurationTiers.find((tier) => duration <= tier) ||
    motionControlDurationTiers[motionControlDurationTiers.length - 1]
  );
}

async function runVideoGeneration(
  context: Parameters<PlaygroundConfig["onGenerate"]>[1],
  config: {
    apiEndpoint: string;
    scenario: string;
    requestBody: Record<string, any>;
    maxPollingAttempts?: number;
    pollingInterval?: number;
  },
) {
  const { callbacks, t, requiredCredits, remainingCredits } = context;

  const result = await executeGeneration(
    {
      apiEndpoint: config.apiEndpoint,
      scenario: config.scenario,
      requestBody: config.requestBody,
      requiredCredits,
      remainingCredits,
      maxPollingAttempts: config.maxPollingAttempts,
      pollingInterval: config.pollingInterval,
    },
    callbacks,
    t,
  );

  if (!result.success) {
    const isKnownNonFailure =
      result.error === "Authentication required" ||
      result.error === "Insufficient credits";

    if (!isKnownNonFailure && result.error) {
      throw new Error(result.error);
    }

    return { videoUrl: "" };
  }

  if (!result.url) {
    if (result.requestId) {
      return {
        requestId: result.requestId,
        taskId: result.requestId,
        scenario: config.scenario,
        outputs: result.outputs,
      };
    }
    throw new Error("Failed to generate video");
  }

  return {
    videoUrl: result.url,
    outputs: result.outputs,
    requestId: result.requestId,
    taskId: result.requestId,
    scenario: config.scenario,
  };
}

export const wan26TextToVideoConfig: PlaygroundConfig = {
  model: { id: "wan-2-6-text-to-video", name: "Wan 2.6" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-wan-2-6",
  estimateParams: (values) => ({
    size: values.size,
    duration: Number.parseInt(String(values.duration), 10) || 10,
  }),
  schema: {
    prompt: textToVideoPromptField,
    negativePrompt: negativePromptField,
    size: {
      type: "select",
      label: "Size",
      defaultValue: "1280*720",
      options: wanSizeOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: wanDurationOptions,
    },
    shotType: {
      type: "select",
      label: "Shot Type",
      defaultValue: "intelligent",
      options: klingReferenceToVideoShotTypeOptions,
    },
    enablePromptExpansion: {
      type: "toggle",
      label: "Prompt Expansion",
      description: "Let the model expand short prompts automatically.",
      defaultValue: true,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) =>
    runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-wan-2-6/generate",
      scenario: "text-to-video-wan-2-6",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        size: values.size,
        duration: Number.parseInt(String(values.duration), 10) || 10,
        shot_type: values.shotType,
        enable_prompt_expansion: Boolean(values.enablePromptExpansion),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    }),
};

export const wan27TextToVideoConfig: PlaygroundConfig = {
  model: { id: "wan-2-7-text-to-video", name: "Wan 2.7" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-wan-2-7",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "1080p",
    aspect_ratio: String(values.aspectRatio || "").trim() || "16:9",
    duration: Number.parseInt(String(values.duration), 10) || 15,
  }),
  schema: {
    prompt: textToVideoPromptField,
    negativePrompt: negativePromptField,
    audio: createUploadField({
      label: "Audio",
      description: "WAV, MP3 (optional, max 20MB)",
      accept: "audio/wav,audio/mpeg,audio/mp3,audio/x-wav",
      required: false,
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxFiles: 1,
      maxSizeMB: 20,
    }),
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: videoResolutionOptions,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: wan27TextToVideoAspectRatioOptions,
    },
    duration: {
      type: "slider",
      label: "Duration",
      defaultValue: 15,
      min: 5,
      max: 15,
      step: 1,
      options: wanVideoExtendDurationOptions,
    },
    enablePromptExpansion: {
      type: "toggle",
      label: "Prompt Expansion",
      description: "Let the model expand short prompts automatically.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const audio = getUploadedMediaUrls(values, "audio")[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-wan-2-7/generate",
      scenario: "text-to-video-wan-2-7",
      requestBody: {
        mediaType: "video",
        audio: audio || undefined,
        prompt: values.prompt.trim(),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        resolution: values.resolution,
        aspect_ratio: values.aspectRatio,
        duration: Number.parseInt(String(values.duration), 10) || 15,
        enable_prompt_expansion: Boolean(values.enablePromptExpansion),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    });
  },
};

export const veo31TextToVideoConfig: PlaygroundConfig = {
  model: { id: "veo-3-1-text-to-video", name: "Veo 3.1" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-veo-3-1",
  estimateParams: (values) => ({
    duration: Number.parseInt(String(values.duration), 10) || 8,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    prompt: textToVideoPromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: imageToVideoAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: videoResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: veoDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Generate synced audio with the video.",
      defaultValue: false,
    },
  },
  onGenerate: async (values, context) =>
    runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-veo-3-1/generate",
      scenario: "text-to-video-veo-3-1",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        aspect_ratio: values.aspectRatio,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 8,
        generate_audio: Boolean(values.generateAudio),
      },
    }),
};

export const seedance15ProTextToVideoConfig: PlaygroundConfig = {
  model: { id: "seedance-1-5-pro-text-to-video", name: "Seedance 1.5 Pro" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-seedance-1-5-pro",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "fast 720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
    generate_audio: Boolean(values.generateAudio),
    camera_fixed: Boolean(values.cameraFixed),
  }),
  schema: {
    prompt: textToVideoPromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: seedanceAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "fast 720p",
      options: seedanceResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: seedanceDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Create native synced audio in the output video.",
      defaultValue: false,
    },
    cameraFixed: {
      type: "toggle",
      label: "Fixed Camera",
      description: "Keep the camera more stable during generation.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) =>
    runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-seedance-1-5-pro/generate",
      scenario: "text-to-video/seedance-1-5-pro",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        aspect_ratio: values.aspectRatio,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        resolution: values.resolution,
        generate_audio: Boolean(values.generateAudio),
        camera_fixed: Boolean(values.cameraFixed),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    }),
};

export const seedance20TextToVideoConfig: PlaygroundConfig = {
  model: { id: "seedance-2-0-text-to-video", name: "Seedance 2.0" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-seedance-2-0",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    size: String(values.size || "").trim() || "16:9",
    duration: Number.parseInt(String(values.duration), 10) || 5,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImagesExtra: createUploadField({
      label: "Reference Images",
      description: "Upload up to 5 images",
      accept: "image/*",
      required: false,
      previewType: "image",
      maxFiles: 5,
    }),
    referenceVideos: createUploadField({
      label: "Reference Videos",
      description: "MP4, WebM, MOV (max 50MB, up to 3 videos, duration ≤ 15s)",
      accept: "video/mp4,video/webm,video/quicktime",
      required: false,
      uploadUrl: "/api/storage/upload-video",
      previewType: "video",
      maxFiles: 3,
      maxSizeMB: 50,
    }),
    referenceAudios: createUploadField({
      label: "Reference Audio",
      description: "WAV, MP3 (max 20MB, up to 3 audios, duration ≤ 15s)",
      accept: "audio/wav,audio/mpeg,audio/mp3,audio/x-wav",
      required: false,
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxFiles: 3,
      maxSizeMB: 20,
    }),
    prompt: textToVideoPromptField,
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: seedance20ResolutionOptions,
    },
    size: {
      type: "select",
      label: "Size",
      defaultValue: "16:9",
      options: seedance20SizeOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: seedance20DurationOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use an integer seed",
      defaultValue: "42",
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Generate synced audio in the output video.",
      defaultValue: true,
    },
  },
  onGenerate: async (values, context) => {
    validateUploadedMediaDuration(
      values,
      "referenceVideos",
      15,
      "Reference video",
    );
    validateUploadedMediaDuration(
      values,
      "referenceAudios",
      15,
      "Reference audio",
    );

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-seedance-2-0/generate",
      scenario: "text-to-video-seedance-2-0",
      maxPollingAttempts: 360,
      requestBody: {
        mediaType: "video",
        model: "doubao-seedance-2.0",
        prompt: values.prompt.trim(),
        resolution: values.resolution,
        size: values.size,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        seed: Number.parseInt(String(values.seed), 10) || 42,
        generate_audio: Boolean(values.generateAudio),
        ...(getUploadedMediaUrls(values, "referenceImagesExtra").length > 0
          ? {
              reference_images: getUploadedMediaUrls(
                values,
                "referenceImagesExtra",
              ),
            }
          : {}),
        ...(getUploadedMediaUrls(values, "referenceVideos").length > 0
          ? {
              reference_videos: getUploadedMediaUrls(values, "referenceVideos"),
            }
          : {}),
        ...(getUploadedMediaUrls(values, "referenceAudios").length > 0
          ? {
              reference_audios: getUploadedMediaUrls(values, "referenceAudios"),
            }
          : {}),
      },
    });
  },
};

export const pixverse56TextToVideoConfig: PlaygroundConfig = {
  model: { id: "pixverse-5-6-text-to-video", name: "PixVerse v5.6" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-pixverse-5-6",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "360p",
    duration: Number.parseInt(String(values.duration), 10) || 10,
    generate_audio_switch: Boolean(values.generateAudio),
  }),
  schema: {
    prompt: textToVideoPromptField,
    negativePrompt: negativePromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: pixverseAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "360p",
      options: pixverseResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: pixverseDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Include model-generated audio in the result.",
      defaultValue: false,
    },
    thinkingType: {
      type: "select",
      label: "Thinking Type",
      defaultValue: "auto",
      options: thinkingTypeOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty or use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const trimmedSeed = String(values.seed || "").trim();
    const parsedSeed = Number.parseInt(trimmedSeed, 10);
    const normalizedSeed =
      !trimmedSeed || trimmedSeed === "-1" || Number.isNaN(parsedSeed)
        ? undefined
        : Math.max(0, parsedSeed);

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-pixverse-5-6/generate",
      scenario: "text-to-video/text-to-video-pixverse-5-6",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        duration: Number.parseInt(String(values.duration), 10) || 10,
        generate_audio_switch: Boolean(values.generateAudio),
        resolution: values.resolution,
        resolution_ratio: values.aspectRatio,
        thinking_type: values.thinkingType,
        seed: normalizedSeed,
      },
    });
  },
};

export const ltx2FastTextToVideoConfig: PlaygroundConfig = {
  model: { id: "ltx-2-fast-text-to-video", name: "LTX-2 Fast" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-ltx-2-fast",
  estimateParams: (values) => ({
    duration: Number.parseInt(String(values.duration), 10) || 8,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    prompt: textToVideoPromptField,
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: ltxDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Create synced audio with the video output.",
      defaultValue: true,
    },
  },
  onGenerate: async (values, context) =>
    runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-ltx-2-fast/generate",
      scenario: "text-to-video-ltx-2-fast",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        duration: Number.parseInt(String(values.duration), 10) || 8,
        generate_audio: Boolean(values.generateAudio),
      },
    }),
};

export const wan27ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "wan-2-7-image-to-video", name: "Wan 2.7" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-wan-2-7",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
  }),
  schema: {
    prompt: imageToVideoPromptField,
    image: createUploadField({
      label: "Image",
      description: "Upload the start frame image to animate",
      accept: "image/*",
      previewType: "image",
      maxFiles: 1,
    }),
    lastImage: createUploadField({
      label: "Last Image",
      description: "Upload an optional end frame image",
      accept: "image/*",
      required: false,
      previewType: "image",
      maxFiles: 1,
    }),
    audio: createUploadField({
      label: "Audio",
      description: "WAV, MP3 (optional, max 20MB)",
      accept: "audio/wav,audio/mpeg,audio/mp3,audio/x-wav",
      required: false,
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxFiles: 1,
      maxSizeMB: 20,
    }),
    negativePrompt: negativePromptField,
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: videoResolutionOptions,
    },
    duration: {
      type: "slider",
      label: "Duration",
      defaultValue: 5,
      min: 5,
      max: 15,
      step: 1,
      options: wanVideoExtendDurationOptions,
    },
    enablePromptExpansion: {
      type: "toggle",
      label: "Prompt Expansion",
      description: "Let the model expand short prompts automatically.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values, "image")[0];
    const lastImage = getUploadedMediaUrls(values, "lastImage")[0];
    const audio = getUploadedMediaUrls(values, "audio")[0];

    if (!image) {
      throw new Error("Please upload an image");
    }

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-wan-2-7/generate",
      scenario: "image-to-video-wan-2-7",
      requestBody: {
        mediaType: "video",
        image,
        last_image: lastImage || undefined,
        audio: audio || undefined,
        prompt: values.prompt.trim(),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        enable_prompt_expansion: Boolean(values.enablePromptExpansion),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    });
  },
};

export const happyhorse10TextToVideoConfig: PlaygroundConfig = {
  model: { id: "happyhorse-1-0-text-to-video", name: "HappyHorse 1.0" },
  scenarioType: "text-to-video",
  creditScenario: "text-to-video-happyhorse-1-0",
  estimateParams: (values) => ({
    aspect_ratio: String(values.aspectRatio || "").trim() || "16:9",
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
  }),
  schema: {
    prompt: textToVideoPromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: happyhorseTextToVideoAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: happyhorseResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: happyhorseDurationOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const trimmedSeed = String(values.seed || "").trim();
    const parsedSeed = Number.parseInt(trimmedSeed, 10);

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/text-to-video-happyhorse-1-0/generate",
      scenario: "text-to-video-happyhorse-1-0",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        aspect_ratio: values.aspectRatio,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        resolution: values.resolution,
        ...(trimmedSeed && !Number.isNaN(parsedSeed)
          ? { seed: parsedSeed }
          : {}),
      },
    });
  },
};

export const veo31ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "veo-3-1-image-to-video", name: "Veo 3.1" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-veo-3-1",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "1080p",
    duration: Number.parseInt(String(values.duration), 10) || 8,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: imageToVideoAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: videoResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: veoDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Generate synced audio with the video.",
      defaultValue: true,
    },
    negativePrompt: negativePromptField,
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-veo-3-1/generate",
      scenario: "image-to-video-veo-3-1",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        aspect_ratio: values.aspectRatio,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 8,
        generate_audio: Boolean(values.generateAudio),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        seed: String(values.seed || "").trim() || undefined,
      },
    });
  },
};

export const seedance15ProImageToVideoConfig: PlaygroundConfig = {
  model: { id: "seedance-1-5-pro-image-to-video", name: "Seedance 1.5 Pro" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-seedance-1-5-pro",
  // 积分估算需要使用真实业务参数（与后端计价配置匹配）
  // 注意：这里的字段命名要与 pricing 配置中的 paramCombinations key 对齐（如 generate_audio）
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "fast 720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "Auto", value: "auto" },
        ...seedanceAspectRatioOptions,
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "fast 720p",
      options: seedanceResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: seedanceDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Create native synced audio in the output video.",
      defaultValue: false,
    },
    cameraFixed: {
      type: "toggle",
      label: "Fixed Camera",
      description: "Keep the camera more stable during generation.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-seedance-1-5-pro/generate",
      scenario: "image-to-video-seedance-1-5-pro",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        aspect_ratio:
          values.aspectRatio && values.aspectRatio !== "auto"
            ? values.aspectRatio
            : undefined,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        generate_audio: Boolean(values.generateAudio),
        camera_fixed: Boolean(values.cameraFixed),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    });
  },
};

export const seedance20ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "seedance-2-0-image-to-video", name: "Seedance 2.0" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-seedance-2-0",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
    has_last_frame: Boolean(getUploadedMediaUrls(values, "lastFrameImage")[0]),
  }),
  schema: {
    firstFrameImage: createUploadField({
      label: "First Frame",
      description: "Upload the first frame image",
      accept: "image/*",
      previewType: "image",
      maxFiles: 1,
    }),
    lastFrameImage: createUploadField({
      label: "Last Frame (Optional)",
      description:
        "Optional. Upload a last frame image to enable transition from first to last frame.",
      accept: "image/*",
      required: false,
      previewType: "image",
      maxFiles: 1,
    }),
    prompt: imageToVideoPromptField,
    referenceVideos: createUploadField({
      label: "Reference Videos",
      description: "MP4, WebM, MOV (max 50MB, up to 3 videos, duration ≤ 15s)",
      accept: "video/mp4,video/webm,video/quicktime",
      required: false,
      uploadUrl: "/api/storage/upload-video",
      previewType: "video",
      maxFiles: 3,
      maxSizeMB: 50,
    }),
    referenceAudios: createUploadField({
      label: "Reference Audio",
      description: "WAV, MP3 (max 20MB, up to 3 audios, duration ≤ 15s)",
      accept: "audio/wav,audio/mpeg,audio/mp3,audio/x-wav",
      required: false,
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxFiles: 3,
      maxSizeMB: 20,
    }),
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: seedance20ResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: seedance20DurationOptions,
    },
  },
  onGenerate: async (values, context) => {
    const prompt = String(values.prompt || "").trim();
    const duration = Number.parseInt(String(values.duration), 10) || 5;
    const firstFrameUrl = getUploadedMediaUrls(values, "firstFrameImage")[0];
    const lastFrameUrl = getUploadedMediaUrls(values, "lastFrameImage")[0];
    const referenceVideos = getUploadedMediaUrls(values, "referenceVideos");
    const referenceAudios = getUploadedMediaUrls(values, "referenceAudios");

    if (!firstFrameUrl) {
      throw new Error("Please upload a first frame image");
    }
    validateUploadedMediaDuration(
      values,
      "referenceVideos",
      15,
      "Reference video",
    );
    validateUploadedMediaDuration(
      values,
      "referenceAudios",
      15,
      "Reference audio",
    );

    const requestBody: Record<string, any> = {
      mediaType: "video",
      model: "doubao-seedance-2.0",
      prompt,
      resolution: String(values.resolution || "").trim() || "720p",
      duration,
    };

    requestBody.image_with_roles = [
      { url: firstFrameUrl, role: "first_frame" },
      ...(lastFrameUrl ? [{ url: lastFrameUrl, role: "last_frame" }] : []),
    ];

    if (referenceVideos.length > 0) {
      requestBody.reference_videos = referenceVideos;
    }
    if (referenceAudios.length > 0) {
      requestBody.reference_audios = referenceAudios;
    }

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-seedance-2-0/generate",
      scenario: "image-to-video-seedance-2-0",
      maxPollingAttempts: 360,
      requestBody,
    });
  },
};

export const pixverse56ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "pixverse-5-6-image-to-video", name: "PixVerse v5.6" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-pixverse-5-6",
  // PixVerse 的计价参数与生成接口字段一致（例如 generate_audio_switch）
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "360p",
    duration: Number.parseInt(String(values.duration), 10) || 10,
    generate_audio_switch: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    negativePrompt: negativePromptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: pixverseAspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "360p",
      options: pixverseResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: pixverseDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Include model-generated audio in the result.",
      defaultValue: false,
    },
    thinkingType: {
      type: "select",
      label: "Thinking Type",
      defaultValue: "auto",
      options: thinkingTypeOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty or use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];
    const trimmedSeed = String(values.seed || "").trim();
    const parsedSeed = Number.parseInt(trimmedSeed, 10);
    const normalizedSeed =
      !trimmedSeed || trimmedSeed === "-1" || Number.isNaN(parsedSeed)
        ? undefined
        : Math.max(0, parsedSeed);

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-pixverse-5-6/generate",
      scenario: "image-to-video-pixverse-5-6",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        negative_prompt: values.negativePrompt?.trim() || undefined,
        duration: Number.parseInt(String(values.duration), 10) || 10,
        generate_audio_switch: Boolean(values.generateAudio),
        resolution: values.resolution,
        resolution_ratio: values.aspectRatio,
        thinking_type: values.thinkingType,
        seed: normalizedSeed,
      },
    });
  },
};

export const ltx2FastImageToVideoConfig: PlaygroundConfig = {
  model: { id: "ltx-2-fast-image-to-video", name: "LTX-2 Fast" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-ltx-2-fast",
  estimateParams: (values) => ({
    duration: Number.parseInt(String(values.duration), 10) || 8,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: ltxDurationOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Create synced audio with the video output.",
      defaultValue: true,
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-ltx-2-fast/generate",
      scenario: "image-to-video-ltx-2-fast",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        duration: Number.parseInt(String(values.duration), 10) || 8,
        generate_audio: Boolean(values.generateAudio),
      },
    });
  },
};

export const viduQ3ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "vidu-q3-image-to-video", name: "Vidu Q3" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-vidu-q3",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "1080p",
    duration: Number.parseInt(String(values.duration), 10) || 8,
    generate_audio: Boolean(values.generateAudio),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: viduResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: viduDurationOptions,
    },
    movementAmplitude: {
      type: "select",
      label: "Movement Amplitude",
      defaultValue: "auto",
      options: movementAmplitudeOptions,
    },
    generateAudio: {
      type: "toggle",
      label: "Generate Audio",
      description: "Generate synced audio for the output video.",
      defaultValue: false,
    },
    bgm: {
      type: "toggle",
      label: "Background Music",
      description: "Include background music in the result.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-vidu-q3/generate",
      scenario: "image-to-video-vidu-q3",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 8,
        movement_amplitude: values.movementAmplitude,
        generate_audio: Boolean(values.generateAudio),
        bgm: Boolean(values.bgm),
        seed: String(values.seed || "").trim() || undefined,
      },
    });
  },
};

export const midjourneyImageToVideoConfig: PlaygroundConfig = {
  model: { id: "midjourney-image-to-video", name: "Midjourney" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-midjourney",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "480p",
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: imageToVideoPromptField,
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "480p",
      options: midjourneyResolutionOptions,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: midjourneyAspectRatioOptions,
    },
    motion: {
      type: "select",
      label: "Motion",
      defaultValue: "low",
      options: midjourneyMotionOptions,
    },
    quality: {
      type: "select",
      label: "Quality",
      defaultValue: "1",
      options: midjourneyQualityOptions,
    },
    stylize: {
      type: "select",
      label: "Stylize",
      defaultValue: "0",
      options: midjourneyRangeOptions,
    },
    chaos: {
      type: "select",
      label: "Chaos",
      defaultValue: "0",
      options: midjourneyRangeOptions,
    },
    weird: {
      type: "select",
      label: "Weird",
      defaultValue: "0",
      options: midjourneyRangeOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-midjourney/generate",
      scenario: "image-to-video-midjourney",
      requestBody: {
        mediaType: "video",
        prompt: values.prompt.trim(),
        image,
        resolution: values.resolution,
        aspect_ratio: values.aspectRatio,
        motion: values.motion,
        quality: Number.parseFloat(String(values.quality)) || 1,
        stylize: Number.parseInt(String(values.stylize), 10) || 0,
        chaos: Number.parseInt(String(values.chaos), 10) || 0,
        weird: Number.parseInt(String(values.weird), 10) || 0,
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10),
        enable_base64_output: false,
      },
    });
  },
};

function buildReferenceToVideoResult(
  context: Parameters<PlaygroundConfig["onGenerate"]>[1],
  config: {
    apiEndpoint: string;
    scenario: string;
    requestBody: Record<string, any>;
    maxPollingAttempts?: number;
  },
) {
  return runVideoGeneration(context, {
    apiEndpoint: config.apiEndpoint,
    scenario: config.scenario,
    requestBody: {
      mediaType: "video",
      ...config.requestBody,
    },
    maxPollingAttempts: config.maxPollingAttempts,
  });
}

function getReferenceToVideoSeed(seed: unknown) {
  const trimmedSeed = String(seed ?? "").trim();
  if (!trimmedSeed || trimmedSeed === "-1") {
    return undefined;
  }

  const parsedSeed = Number.parseInt(trimmedSeed, 10);
  return Number.isNaN(parsedSeed) ? undefined : parsedSeed;
}

export const wan27ReferenceToVideoConfig: PlaygroundConfig = {
  model: { id: "wan-2-7-reference-to-video", name: "Wan 2.7" },
  scenarioType: "image-to-video",
  creditScenario: "reference-to-video-wan-2-7",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
  }),
  schema: {
    referenceVideos: createReferenceVideosField({
      required: true,
      maxFiles: 3,
      maxSizeMB: 200,
      description: "Upload 1-3 reference videos to guide motion and pacing.",
    }),
    referenceImages: createReferenceImagesField(5),
    prompt: {
      ...imageToVideoPromptField,
      placeholder:
        "Describe the target shot while keeping character or scene consistency",
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: videoResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: referenceToVideoWanDurationOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const videos = getUploadedMediaUrls(values, "referenceVideos");
    const referenceImages = getUploadedMediaUrls(values, "referenceImages");

    if (videos.length === 0) {
      throw new Error("Please upload at least one reference video");
    }

    return buildReferenceToVideoResult(context, {
      apiEndpoint: "/api/ai/reference-to-video-wan-2-7/generate",
      scenario: "reference-to-video-wan-2-7",
      requestBody: {
        prompt: values.prompt.trim(),
        videos,
        reference_images:
          referenceImages.length > 0 ? referenceImages : undefined,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        seed: getReferenceToVideoSeed(values.seed),
      },
    });
  },
};

export const happyhorse10ImageToVideoConfig: PlaygroundConfig = {
  model: { id: "happyhorse-1-0-image-to-video", name: "HappyHorse 1.0" },
  scenarioType: "image-to-video",
  creditScenario: "image-to-video-happyhorse-1-0",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
  }),
  schema: {
    referenceImages: createReferenceImagesField(1),
    prompt: {
      ...imageToVideoPromptField,
      required: true,
      placeholder: "Describe how the uploaded image should move",
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: happyhorseResolutionOptions,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: happyhorseDurationOptions,
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/image-to-video-happyhorse-1-0/generate",
      scenario: "image-to-video-happyhorse-1-0",
      requestBody: {
        mediaType: "video",
        image,
        prompt: values.prompt.trim(),
        duration: Number.parseInt(String(values.duration), 10) || 5,
        resolution: values.resolution,
      },
    });
  },
};

function createKlingReferenceToVideoConfig(config: {
  modelId: string;
  modelName: string;
  creditScenario: string;
  apiEndpoint: string;
  scenario: string;
  fixedResolution?: "720p" | "1080p" | "4k";
  durationOptions?: Array<{ label: string; value: string }>;
}) {
  const durationOptions =
    config.durationOptions ?? referenceToVideoKlingDurationOptions;

  const schema: PlaygroundConfig["schema"] = {
    referenceImages: createReferenceImagesField(10),
    referenceVideos: createReferenceVideosField({
      required: false,
      maxFiles: 1,
      maxSizeMB: 200,
      description:
        "Optional. Add one reference video to transfer motion or shot rhythm.",
    }),
    prompt: {
      ...imageToVideoPromptField,
      placeholder:
        "Describe the new shot while preserving identity and reference details",
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: durationOptions[0]?.value || "5",
      options: durationOptions,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: referenceToVideoAspectRatioOptions,
    },
    sound: {
      type: "toggle",
      label: "Generate Audio",
      description:
        "Let the model synthesize native audio for the generated clip.",
      defaultValue: false,
    },
    keepOriginalSound: {
      type: "toggle",
      label: "Keep Original Sound",
      description:
        "Keep the uploaded reference video's original audio when available.",
      defaultValue: false,
    },
    shotType: {
      type: "select",
      label: "Shot Type",
      defaultValue: "single",
      options: shotTypeOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  };

  if (config.fixedResolution) {
    schema.resolution = {
      type: "select",
      label: "Resolution",
      defaultValue: config.fixedResolution,
      options: [
        { label: config.fixedResolution, value: config.fixedResolution },
      ],
    };
  }

  return {
    model: { id: config.modelId, name: config.modelName },
    scenarioType: "image-to-video" as const,
    creditScenario: config.creditScenario,
    estimateParams: (values: Record<string, any>) => {
      const video = getUploadedMediaUrls(values, "referenceVideos")[0];

      return {
        duration:
          Number.parseInt(String(values.duration), 10) ||
          Number.parseInt(durationOptions[0]?.value || "5", 10) ||
          5,
        sound: Boolean(values.sound),
        video: video || "",
      };
    },
    schema,
    onGenerate: async (
      values: Record<string, any>,
      context: Parameters<PlaygroundConfig["onGenerate"]>[1],
    ) => {
      const referenceImages = getUploadedMediaUrls(values, "referenceImages");
      const video = getUploadedMediaUrls(values, "referenceVideos")[0];

      if (referenceImages.length === 0 && !video) {
        throw new Error(
          "Please upload at least one reference image or one reference video",
        );
      }

      if (video && referenceImages.length > 4) {
        throw new Error(
          "When a reference video is uploaded, you can use up to 4 reference images",
        );
      }

      return buildReferenceToVideoResult(context, {
        apiEndpoint: config.apiEndpoint,
        scenario: config.scenario,
        requestBody: {
          prompt: values.prompt.trim(),
          images: referenceImages.length > 0 ? referenceImages : undefined,
          video: video || undefined,
          duration:
            Number.parseInt(String(values.duration), 10) ||
            Number.parseInt(durationOptions[0]?.value || "5", 10) ||
            5,
          aspect_ratio: values.aspectRatio,
          sound: Boolean(values.sound),
          keep_original_sound: video
            ? Boolean(values.keepOriginalSound)
            : undefined,
          shot_type: values.shotType,
          resolution: config.fixedResolution || undefined,
          seed: getReferenceToVideoSeed(values.seed),
        },
        maxPollingAttempts: 300,
      });
    },
  } satisfies PlaygroundConfig;
}

export const klingVideoO34kReferenceToVideoConfig =
  createKlingReferenceToVideoConfig({
    modelId: "kling-video-o3-4k-reference-to-video",
    modelName: "Kling Video O3 4K",
    creditScenario: "reference-to-video-kling-video-o3-4k",
    apiEndpoint: "/api/ai/reference-to-video-kling-video-o3-4k/generate",
    scenario: "reference-to-video-kling-video-o3-4k",
    fixedResolution: "4k",
  });

export const klingVideoO1StdReferenceToVideoConfig = {
  model: {
    id: "kling-video-o1-std-reference-to-video",
    name: "Kling Video O1 Std",
  },
  scenarioType: "image-to-video" as const,
  creditScenario: "reference-to-video-kling-video-o1-std",
  estimateParams: (values: Record<string, any>) => {
    const video = getUploadedMediaUrls(values, "referenceVideos")[0];

    return {
      duration: Number.parseInt(String(values.duration), 10) || 5,
      video: video || "",
    };
  },
  schema: {
    referenceImages: createReferenceImagesField(10),
    referenceVideos: createReferenceVideosField({
      required: false,
      maxFiles: 1,
      maxSizeMB: 200,
      description:
        "Optional. Add one reference video; when present, reference images are limited to 4.",
    }),
    prompt: {
      ...imageToVideoPromptField,
      placeholder:
        "Describe the new shot while keeping subject identity consistent",
    },
    keepOriginalSound: {
      type: "toggle",
      label: "Keep Original Sound",
      description:
        "Keep the uploaded reference video's original audio when available.",
      defaultValue: true,
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: referenceToVideoKlingO1DurationOptions,
    },
  },
  onGenerate: async (
    values: Record<string, any>,
    context: Parameters<PlaygroundConfig["onGenerate"]>[1],
  ) => {
    const referenceImages = getUploadedMediaUrls(values, "referenceImages");
    const video = getUploadedMediaUrls(values, "referenceVideos")[0];

    if (referenceImages.length === 0 && !video) {
      throw new Error(
        "Please upload at least one reference image or one reference video",
      );
    }

    if (video && referenceImages.length > 4) {
      throw new Error(
        "When a reference video is uploaded, you can use up to 4 reference images",
      );
    }

    return buildReferenceToVideoResult(context, {
      apiEndpoint: "/api/ai/reference-to-video-kling-video-o1-std/generate",
      scenario: "reference-to-video-kling-video-o1-std",
      requestBody: {
        prompt: values.prompt.trim(),
        images: referenceImages.length > 0 ? referenceImages : undefined,
        video: video || undefined,
        keep_original_sound: video
          ? Boolean(values.keepOriginalSound)
          : undefined,
        duration: Number.parseInt(String(values.duration), 10) || 5,
      },
      maxPollingAttempts: 300,
    });
  },
} satisfies PlaygroundConfig;

export const klingVideoO3ProReferenceToVideoConfig =
  createKlingReferenceToVideoConfig({
    modelId: "kling-video-o3-pro-reference-to-video",
    modelName: "Kling Video O3 Pro",
    creditScenario: "reference-to-video-kling-video-o3-pro",
    apiEndpoint: "/api/ai/reference-to-video-kling-video-o3-pro/generate",
    scenario: "reference-to-video-kling-video-o3-pro",
  });

export const klingVideoO3StdReferenceToVideoConfig =
  createKlingReferenceToVideoConfig({
    modelId: "kling-video-o3-std-reference-to-video",
    modelName: "Kling Video O3 Std",
    creditScenario: "reference-to-video-kling-video-o3-std",
    apiEndpoint: "/api/ai/reference-to-video-kling-video-o3-std/generate",
    scenario: "reference-to-video-kling-video-o3-std",
  });

export const grokImagineVideoReferenceToVideoConfig: PlaygroundConfig = {
  model: {
    id: "grok-imagine-video-reference-to-video",
    name: "Grok Imagine Video",
  },
  scenarioType: "image-to-video",
  creditScenario: "reference-to-video-grok-imagine-video",
  estimateParams: (values) => ({
    duration: String(values.duration || "6").trim() || "6",
  }),
  schema: {
    referenceImages: createReferenceImagesField(7),
    prompt: {
      ...imageToVideoPromptField,
      placeholder:
        "Describe the video you want while preserving identity and composition",
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "480p", value: "480p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "6",
      options: referenceToVideoGrokDurationOptions,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Leave empty for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const referenceImages = getUploadedMediaUrls(values, "referenceImages");

    if (referenceImages.length === 0) {
      throw new Error("Please upload at least one reference image");
    }

    return buildReferenceToVideoResult(context, {
      apiEndpoint: "/api/ai/reference-to-video-grok-imagine-video/generate",
      scenario: "reference-to-video-grok-imagine-video",
      requestBody: {
        prompt: values.prompt.trim(),
        images: referenceImages,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 6,
        seed: getReferenceToVideoSeed(values.seed),
      },
      maxPollingAttempts: 300,
    });
  },
};
export const wan27VideoExtendConfig: PlaygroundConfig = {
  model: { id: "wan-2-7-video-extend", name: "Wan 2.7" },
  scenarioType: "image-to-video",
  creditScenario: "video-extend-wan-2-7",
  estimateParams: (values) => ({
    resolution: String(values.resolution || "").trim() || "720p",
    duration: Number.parseInt(String(values.duration), 10) || 5,
  }),
  schema: {
    video: createUploadField({
      label: "Video",
      description: "MP4, WebM, MOV (max 50MB)",
      accept: "video/mp4,video/webm,video/quicktime",
      uploadUrl: "/api/storage/upload-video",
      previewType: "video",
      maxFiles: 1,
      maxSizeMB: 50,
    }),
    audio: createUploadField({
      label: "Audio",
      description: "WAV, MP3 (optional, max 20MB)",
      accept: "audio/wav,audio/mpeg,audio/mp3,audio/x-wav",
      required: false,
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxFiles: 1,
      maxSizeMB: 20,
    }),
    prompt: textToVideoPromptField,
    negativePrompt: negativePromptField,
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: videoResolutionOptions,
    },
    duration: {
      type: "slider",
      label: "Duration",
      defaultValue: 5,
      min: 5,
      max: 15,
      step: 1,
      options: wanVideoExtendDurationOptions,
    },
    enablePromptExpansion: {
      type: "toggle",
      label: "Prompt Expansion",
      description: "Let the model expand short prompts automatically.",
      defaultValue: false,
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const video = getUploadedMediaUrls(values, "video")[0];
    const audio = getUploadedMediaUrls(values, "audio")[0];

    if (!video) {
      throw new Error("Please upload a video");
    }

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/video-extend-wan-2-7/generate",
      scenario: "video-extend-wan-2-7",
      requestBody: {
        mediaType: "video",
        video,
        audio: audio || undefined,
        prompt: values.prompt.trim(),
        negative_prompt: values.negativePrompt?.trim() || undefined,
        resolution: values.resolution,
        duration: Number.parseInt(String(values.duration), 10) || 5,
        enable_prompt_expansion: Boolean(values.enablePromptExpansion),
        seed:
          String(values.seed).trim() === "-1"
            ? -1
            : Number.parseInt(String(values.seed), 10) || -1,
      },
    });
  },
};

export const kling26ProMotionControlConfig: PlaygroundConfig = {
  model: { id: "kling-2-6-pro-motion-control", name: "Kling 2.6 Pro" },
  scenarioType: "image-to-video",
  creditScenario: "motion-control-kling-2-6",
  estimateParams: (values) => {
    const duration = getMotionControlBilledDuration(
      getUploadedMediaItems(values, "referenceVideo")[0]?.duration,
    );

    return {
      duration: duration || motionControlDurationTiers[0],
    };
  },
  schema: {
    referenceImages: createReferenceImagesField(1),
    referenceVideo: createUploadField({
      label: "Reference Video",
      description: "Upload a video to transfer its motion pattern.",
      accept: "video/*",
      required: false,
      uploadUrl: "/api/storage/upload-video",
      previewType: "video",
      maxSizeMB: 200,
    }),
    prompt: {
      ...imageToVideoPromptField,
      placeholder: "Describe the motion control effect you want to apply",
      required: false,
    },
    negativePrompt: negativePromptField,
    keepOriginalSound: {
      type: "toggle",
      label: "Keep Original Sound",
      description:
        "Preserve the uploaded video's original audio in the result.",
      defaultValue: true,
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];
    const videoItem = getUploadedMediaItems(values, "referenceVideo")[0];
    const video = videoItem?.url;
    const billedDuration = getMotionControlBilledDuration(videoItem?.duration);

    if (!image) {
      throw new Error("Reference image is required");
    }

    if (!video) {
      throw new Error("Reference video is required");
    }

    if (!billedDuration) {
      throw new Error("Reference video duration is required");
    }

    if (videoItem.duration && videoItem.duration > 30) {
      throw new Error("Reference video duration must be 30 seconds or less");
    }

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/motion-control-kling-2-6/generate",
      scenario: "motion-control-kling-2-6",
      maxPollingAttempts: 300,
      requestBody: {
        mediaType: "video",
        prompt: values.prompt?.trim() || undefined,
        image,
        video,
        negative_prompt: values.negativePrompt?.trim() || undefined,
        character_orientation: "image",
        keep_original_sound: Boolean(values.keepOriginalSound),
        duration: billedDuration,
      },
    });
  },
};

export const longcatAvatarConfig: PlaygroundConfig = {
  model: { id: "longcat-avatar", name: "Longcat Avatar" },
  scenarioType: "image-to-video",
  creditScenario: "longcat-avatar",
  estimateParams: (values) => {
    const audioDuration = getUploadedMediaItems(values, "audioTrack")[0]
      ?.duration;
    if (!audioDuration) return undefined;

    return {
      duration: getLongcatAvatarBilledDuration(audioDuration || 5),
      resolution: values.resolution || "480p",
    };
  },
  schema: {
    referenceImages: createReferenceImagesField(1),
    audioTrack: createUploadField({
      label: "Audio",
      description: "Upload an audio track up to 120 seconds.",
      accept: "audio/*",
      uploadUrl: "/api/storage/upload-audio",
      previewType: "audio",
      maxSizeMB: 50,
    }),
    prompt: {
      type: "textarea",
      label: "Notes",
      placeholder: "Optional production notes for this avatar render",
      defaultValue: "",
      required: false,
      visible: false,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "480p",
      options: [
        { label: "480p", value: "480p" },
        { label: "720p", value: "720p" },
      ],
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "",
    },
  },
  onGenerate: async (values, context) => {
    const image = getUploadedMediaUrls(values)[0];
    const audioItem = getUploadedMediaItems(values, "audioTrack")[0];
    const audio = audioItem?.url;
    const audioDuration = audioItem?.duration;

    if (!image) {
      throw new Error("Reference image is required");
    }

    if (!audio) {
      throw new Error("Audio is required");
    }

    if (!audioDuration || audioDuration < 1 || audioDuration > 120) {
      throw new Error("Audio duration must be between 1 and 120 seconds");
    }

    const billedDuration = getLongcatAvatarBilledDuration(audioDuration);

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/longcat-avatar/generate",
      scenario: "longcat-avatar",
      maxPollingAttempts: 300,
      requestBody: {
        mediaType: "video",
        audio,
        image,
        resolution: values.resolution,
        seed: String(values.seed || "").trim() || -1,
        duration: billedDuration,
      },
    });
  },
};

export const videoFaceSwapConfig: PlaygroundConfig = {
  model: { id: "video-face-swap", name: "Video Face Swap" },
  scenarioType: "image-to-video",
  creditScenario: "video-face-swap",
  estimateParams: (values) => {
    const videoDuration = getUploadedMediaItems(values, "referenceVideo")[0]
      ?.duration;
    return { duration: videoDuration ? Math.ceil(videoDuration) : 5 };
  },
  schema: {
    referenceImages: {
      ...createReferenceImagesField(1),
      label: "Face Image",
      description: "Upload the face image you want to swap into the video.",
    },
    referenceVideo: createUploadField({
      label: "Target Video",
      description: "Upload the target video for face swap.",
      accept: "video/mp4,video/quicktime,video/webm,video/x-m4v",
      uploadUrl: "/api/storage/upload-video",
      previewType: "video",
      maxSizeMB: 200,
    }),
    prompt: {
      type: "textarea",
      label: "Notes",
      placeholder: "Optional notes",
      defaultValue: "",
      required: false,
      visible: false,
    },
    permissionConfirmed: {
      type: "toggle",
      label: "I have permission to use this media",
      defaultValue: false,
      required: true,
    },
    legalConfirmed: {
      type: "toggle",
      label: "I confirm this use complies with applicable laws",
      defaultValue: false,
      required: true,
    },
    syntheticConfirmed: {
      type: "toggle",
      label: "I understand the result may be synthetic media",
      defaultValue: false,
      required: true,
    },
  },
  onGenerate: async (values, context) => {
    const faceImage = getUploadedMediaUrls(values)[0];
    const videoItem = getUploadedMediaItems(values, "referenceVideo")[0];
    const video = videoItem?.url;
    const videoDuration = videoItem?.duration
      ? Math.ceil(videoItem.duration)
      : undefined;

    if (!faceImage) {
      throw new Error("Face image is required");
    }

    if (!video) {
      throw new Error("Target video is required");
    }

    if (
      !values.permissionConfirmed ||
      !values.legalConfirmed ||
      !values.syntheticConfirmed
    ) {
      throw new Error("Please confirm the media usage requirements");
    }

    if (videoDuration && videoDuration > 600) {
      throw new Error("Video duration must be 600 seconds or less");
    }

    return runVideoGeneration(context, {
      apiEndpoint: "/api/ai/video-face-swap/generate",
      scenario: "video-face-swap",
      maxPollingAttempts: 120,
      requestBody: {
        mediaType: "video",
        face_image: faceImage,
        video,
        target_gender: "all",
        target_index: 0,
        video_duration_seconds: videoDuration,
      },
    });
  },
};
