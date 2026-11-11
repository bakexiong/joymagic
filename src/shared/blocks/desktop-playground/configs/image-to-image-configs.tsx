import type { PlaygroundConfig } from "../types/playground-config";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import {
  SOUL_DEFAULT_QUALITY,
  SOUL_DEFAULT_SIZE,
  SOUL_DEFAULT_STRENGTH,
  SOUL_DEFAULT_STYLE,
  SOUL_SIZE_OPTIONS,
  SOUL_STYLE_OPTIONS,
} from "@/shared/blocks/soul-image-to-image/constants";
import {
  Z_IMAGE_TURBO_DEFAULT_OUTPUT_FORMAT,
  Z_IMAGE_TURBO_DEFAULT_SIZE,
  Z_IMAGE_TURBO_DEFAULT_STRENGTH,
  Z_IMAGE_TURBO_OUTPUT_FORMAT_OPTIONS,
  Z_IMAGE_TURBO_SIZE_OPTIONS,
} from "@/shared/blocks/z-image-turbo-image-to-image/constants";
import { executeGeneration } from "./execute-generation";

const promptField = {
  type: "textarea" as const,
  label: "Prompt",
  placeholder: "Describe how the uploaded image should be transformed",
  defaultValue: "",
  required: true,
};

const aspectRatioOptions = [
  { label: "Auto", value: "auto" },
  { label: "1:1", value: "1:1" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "4:5", value: "4:5" },
  { label: "5:4", value: "5:4" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
  { label: "21:9", value: "21:9" },
];

const gptImage2AspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "5:4", value: "5:4" },
  { label: "4:5", value: "4:5" },
  { label: "2:1", value: "2:1" },
  { label: "1:2", value: "1:2" },
  { label: "21:9", value: "21:9" },
  { label: "9:21", value: "9:21" },
];

const resolutionOptions = [
  { label: "1k", value: "1k" },
  { label: "2k", value: "2k" },
  { label: "4k", value: "4k" },
];

const ultraResolutionOptions = [
  { label: "4k", value: "4k" },
  { label: "8k", value: "8k" },
];

const wan27AspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
];

function getUploadedImageUrls(values: Record<string, any>) {
  const images = Array.isArray(values.referenceImages)
    ? (values.referenceImages as ImageUploaderValue[])
    : [];

  return images
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

function getUploadedFieldUrls(values: Record<string, any>, fieldKey: string) {
  const images = Array.isArray(values[fieldKey])
    ? (values[fieldKey] as ImageUploaderValue[])
    : [];

  return images
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

async function uploadSourceImage(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to read uploaded image");
  }

  const blob = await response.blob();
  const file = new File([blob], "source-image.png", {
    type: blob.type || "image/png",
  });
  const formData = new FormData();
  formData.append("files", file);

  const uploadResponse = await fetch("/api/storage/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload source image");
  }

  const uploadResult = await uploadResponse.json();
  if (uploadResult.code !== 0 || !uploadResult.data?.urls?.length) {
    throw new Error(uploadResult.message || "Failed to upload source image");
  }

  return uploadResult.data.urls[0] as string;
}

function createUploadField(
  label: string,
  description: string,
  maxFiles = 1,
  required = false,
  multiple = false,
) {
  return {
    type: "upload" as const,
    label,
    description,
    defaultValue: [],
    required,
    accept: "image/*",
    multiple,
    maxFiles,
  };
}

function roundStrength(value: number) {
  return Math.round(value * 100) / 100;
}

async function runGeneration(
  context: Parameters<PlaygroundConfig["onGenerate"]>[1],
  config: {
    apiEndpoint: string;
    scenario: string;
    requestBody: Record<string, any>;
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

    return { imageUrl: "" };
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
    throw new Error("Failed to generate image");
  }

  return {
    imageUrl: result.url,
    outputs: result.outputs,
    requestId: result.requestId,
    taskId: result.requestId,
    scenario: config.scenario,
  };
}

function createReferenceImagesField(maxFiles: number, multiple = true) {
  return {
    type: "upload" as const,
    label: multiple ? "Reference Images" : "Reference Image",
    description: `Upload up to ${maxFiles} image${maxFiles > 1 ? "s" : ""}`,
    defaultValue: [],
    required: false,
    accept: "image/*",
    multiple,
    maxFiles,
  };
}

export const flux2KleinImageToImageConfig: PlaygroundConfig = {
  model: { id: "flux-2-klein-image-to-image", name: "Flux 2 Klein" },
  scenarioType: "image-to-image",
  creditScenario: "flux-2-klein-image-to-image",
  estimateParams: (values) => ({
    // 以图片数量参与估算（部分模型/价格配置可能按张数分层）
    num_images: (Array.isArray(values.referenceImages) ? values.referenceImages.length : 0) || 1,
  }),
  schema: {
    referenceImages: createReferenceImagesField(4),
    prompt: promptField,
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/flux-2-klein-image-to-image/generate",
      scenario: "flux-2-klein-image-to-image",
      requestBody: {
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        seed: -1,
      },
    });
  },
};

export const imageToImageConfig: PlaygroundConfig = {
  model: { id: "image-to-image", name: "General" },
  scenarioType: "image-to-image",
  creditScenario: "image-to-image",
  estimateParams: (values) => ({
    output_format: "jpeg",
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: promptField,
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    const sourceImage = imageUrls[0];

    if (!sourceImage) {
      throw new Error("Source image is required");
    }

    return runGeneration(context, {
      apiEndpoint: "/api/ai/image-to-image/generate",
      scenario: "image-to-image",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        image: sourceImage,
        prompt: values.prompt.trim(),
        output_format: "jpeg",
        seed: -1,
      },
    });
  },
};

export const qwenImageMaxImageToImageConfig: PlaygroundConfig = {
  model: { id: "qwen-image-max-image-to-image", name: "Qwen Image Max" },
  scenarioType: "image-to-image",
  creditScenario: "qwen-image-max-image-to-image",
  schema: {
    referenceImages: createReferenceImagesField(6),
    prompt: promptField,
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/qwen-image-max-image-to-image/generate",
      scenario: "qwen-image-max-image-to-image",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        seed: -1,
      },
    });
  },
};

export const gptImage2ImageToImageConfig: PlaygroundConfig = {
  model: { id: "gpt-image-2-image-to-image", name: "GPT-Image 2" },
  scenarioType: "image-to-image",
  creditScenario: "gpt-image-2-image-to-image",
  estimateParams: (values) => ({
    aspect_ratio: values.aspectRatio,
    num_images:
      (Array.isArray(values.referenceImages)
        ? values.referenceImages.length
        : 0) || 1,
  }),
  schema: {
    referenceImages: {
      type: "upload",
      label: "Images",
      description: "Upload up to 4 images",
      defaultValue: [],
      required: true,
      accept: "image/*",
      multiple: true,
      maxFiles: 4,
    },
    prompt: promptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: gptImage2AspectRatioOptions,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/gpt-image-2-image-to-image/generate",
      scenario: "gpt-image-2-image-to-image",
      requestBody: {
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        aspect_ratio: values.aspectRatio,
      },
    });
  },
};

export const wan27ImageToImageConfig: PlaygroundConfig = {
  model: { id: "image-to-image-wan-2-7", name: "Wan 2.7" },
  scenarioType: "image-to-image",
  creditScenario: "image-to-image-wan-2-7",
  estimateParams: (values) => ({
    num_images:
      (Array.isArray(values.referenceImages)
        ? values.referenceImages.length
        : 0) || 1,
    size: `${values.width}*${values.height}`,
  }),
  schema: {
    referenceImages: {
      type: "upload",
      label: "Images",
      description: "Upload up to 4 images",
      defaultValue: [],
      required: true,
      accept: "image/*",
      multiple: true,
      maxFiles: 4,
    },
    prompt: {
      ...promptField,
      placeholder: "Describe how you want to edit the images",
    },
    width: {
      type: "slider",
      label: "Width",
      defaultValue: 512,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    height: {
      type: "slider",
      label: "Height",
      defaultValue: 512,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    seed: {
      type: "number",
      label: "Seed",
      description:
        "Set a seed value for reproducible results. Use -1 for random seed.",
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      step: 1,
      required: false,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/image-to-image-wan-2-7/generate",
      scenario: "image-to-image-wan-2-7",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        size: `${values.width}*${values.height}`,
        seed:
          typeof values.seed === "number" ? values.seed : Number(values.seed),
      },
    });
  },
};

export const wan27ImageEditProConfig: PlaygroundConfig = {
  model: { id: "wan-2-7-image-edit-pro", name: "Wan 2.7 Image Edit Pro" },
  scenarioType: "image-to-image",
  creditScenario: "image-to-image-wan-2-7-pro",
  estimateParams: (values) => ({
    num_images:
      (Array.isArray(values.referenceImages)
        ? values.referenceImages.length
        : 0) || 1,
    size: `${values.width}*${values.height}`,
  }),
  schema: {
    referenceImages: {
      type: "upload",
      label: "Images",
      description: "Upload up to 9 images",
      defaultValue: [],
      required: true,
      accept: "image/*",
      multiple: true,
      maxFiles: 9,
    },
    prompt: {
      ...promptField,
      placeholder: "Describe how you want to edit the images",
    },
    width: {
      type: "slider",
      label: "Width",
      defaultValue: 512,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    height: {
      type: "slider",
      label: "Height",
      defaultValue: 512,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    seed: {
      type: "number",
      label: "Seed",
      description:
        "Set a seed value for reproducible results. Use -1 for random seed.",
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      step: 1,
      required: false,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/image-to-image-wan-2-7-pro/generate",
      scenario: "image-to-image-wan-2-7-pro",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        size: `${values.width}*${values.height}`,
        seed:
          typeof values.seed === "number" ? values.seed : Number(values.seed),
      },
    });
  },
};

export const qwenImageLayeredConfig: PlaygroundConfig = {
  model: { id: "qwen-image-layered", name: "Qwen Image Layered" },
  scenarioType: "image-to-image",
  creditScenario: "qwen-image-layered",
  estimateParams: (values) => ({
    num_layers: Math.max(2, Number(values.numLayers) || 8),
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: {
      ...promptField,
      required: false,
      visible: false,
    },
    numLayers: {
      type: "slider",
      label: "Number of Layers",
      description:
        "Choose how many semantic layers to split from the source image.",
      defaultValue: 8,
      min: 2,
      max: 8,
      step: 1,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    const sourceImage = imageUrls[0];

    if (!sourceImage) {
      throw new Error("Source image is required");
    }

    const { callbacks, t, requiredCredits, remainingCredits } = context;
    const result = await executeGeneration(
      {
        apiEndpoint: "/api/ai/qwen-image-layered/generate",
        scenario: "qwen-image-layered",
        requestBody: {
          enable_base64_output: false,
          mediaType: "image",
          image: sourceImage,
          num_layers: Math.max(2, Number(values.numLayers) || 8),
        },
        requiredCredits,
        remainingCredits,
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

      return { imageUrls: [] };
    }

    const layeredOutputs =
      result.outputs && result.outputs.length > 0
        ? result.outputs
        : result.url
          ? [result.url]
          : [];

    if (layeredOutputs.length === 0) {
      if (result.requestId) {
        return {
          requestId: result.requestId,
          taskId: result.requestId,
          scenario: "qwen-image-layered",
          outputs: result.outputs,
        };
      }
      throw new Error("Failed to generate layers");
    }

    return {
      imageUrls: layeredOutputs,
      imageUrl: layeredOutputs[0],
      outputs: result.outputs,
      requestId: result.requestId,
      taskId: result.requestId,
      scenario: "qwen-image-layered",
    };
  },
};

export const nanoBananaImageToImageConfig: PlaygroundConfig = {
  model: { id: "nano-banana-image-to-image", name: "Nano Banana" },
  scenarioType: "image-to-image",
  creditScenario: "nano-banana-image-to-image",
  estimateParams: (values) =>
    values.aspectRatio && values.aspectRatio !== "auto"
      ? { aspect_ratio: values.aspectRatio }
      : undefined,
  schema: {
    referenceImages: createReferenceImagesField(10),
    prompt: promptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "auto",
      options: aspectRatioOptions,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/nano-banana-image-to-image/generate",
      scenario: "nano-banana-image-to-image",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        seed: -1,
        ...(values.aspectRatio && values.aspectRatio !== "auto"
          ? { aspect_ratio: values.aspectRatio }
          : {}),
      },
    });
  },
};

export const nanoBanana2ImageToImageConfig: PlaygroundConfig = {
  model: { id: "nano-banana-2-image-to-image", name: "Nano Banana 2" },
  scenarioType: "image-to-image",
  creditScenario: "nano-banana-2-image-to-image",
  estimateParams: (values) => ({
    ...(values.aspectRatio && values.aspectRatio !== "auto"
      ? { aspect_ratio: values.aspectRatio }
      : {}),
    resolution: values.resolution,
  }),
  schema: {
    referenceImages: createReferenceImagesField(14),
    prompt: promptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "auto",
      options: aspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1k",
      options: resolutionOptions,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/nano-banana-2-image-to-image/generate",
      scenario: "nano-banana-2-image-to-image",
      requestBody: {
        enable_base64_output: false,
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        seed: -1,
        resolution: values.resolution,
        ...(values.aspectRatio && values.aspectRatio !== "auto"
          ? { aspect_ratio: values.aspectRatio }
          : {}),
      },
    });
  },
};

export const nanoBananaProEditUltraImageToImageConfig: PlaygroundConfig = {
  model: {
    id: "nano-banana-pro-edit-ultra-image-to-image",
    name: "Nano Banana Pro Edit Ultra",
  },
  scenarioType: "image-to-image",
  creditScenario: "nano-banana-pro-edit-ultra",
  estimateParams: (values) => ({
    ...(values.aspectRatio && values.aspectRatio !== "auto"
      ? { aspect_ratio: values.aspectRatio }
      : {}),
    resolution: values.resolution,
  }),
  schema: {
    referenceImages: createReferenceImagesField(14),
    prompt: promptField,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "auto",
      options: aspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "4k",
      options: ultraResolutionOptions,
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/nano-banana-pro-edit-ultra/generate",
      scenario: "nano-banana-pro-edit-ultra",
      requestBody: {
        mediaType: "image",
        images: imageUrls,
        prompt: values.prompt.trim(),
        seed: -1,
        resolution: values.resolution,
        ...(values.aspectRatio && values.aspectRatio !== "auto"
          ? { aspect_ratio: values.aspectRatio }
          : {}),
      },
    });
  },
};

export const grokImagineImageToImageConfig: PlaygroundConfig = {
  model: { id: "grok-imagine-image-to-image", name: "Grok Imagine" },
  scenarioType: "image-to-image",
  creditScenario: "grok-imagine-image",
  estimateParams: () => ({}),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: promptField,
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/grok-imagine-image/generate",
      scenario: "grok-imagine-image",
      requestBody: {
        mediaType: "image",
        enable_base64_output: false,
        image: imageUrls[0],
        prompt: values.prompt.trim(),
      },
    });
  },
};

export const seedream50LiteImageToImageConfig: PlaygroundConfig = {
  model: {
    id: "seedream-5-0-lite-image-to-image",
    name: "Seedream 5.0 Lite",
  },
  scenarioType: "image-to-image",
  creditScenario: "seedream-5-0-lite-image-to-image",
  schema: {
    referenceImages: createReferenceImagesField(10),
    prompt: promptField,
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/seedream-5-0-lite-image-to-image/generate",
      scenario: "seedream-5-0-lite-image-to-image",
      requestBody: {
        mediaType: "image",
        enable_base64_output: false,
        images: imageUrls,
        prompt: values.prompt.trim(),
      },
    });
  },
};

export const soulImageToImageConfig: PlaygroundConfig = {
  model: { id: "soul-image-to-image", name: "Soul" },
  scenarioType: "image-to-image",
  creditScenario: "soul-image-to-image",
  estimateParams: (values) => ({
    quality: values.quality,
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: promptField,
    quality: {
      type: "select",
      label: "Quality",
      defaultValue: SOUL_DEFAULT_QUALITY,
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      defaultValue: SOUL_DEFAULT_SIZE,
      options: SOUL_SIZE_OPTIONS.map((value) => ({
        label: value.replace("*", " × "),
        value,
      })),
    },
    strength: {
      type: "slider",
      label: "Strength",
      defaultValue: SOUL_DEFAULT_STRENGTH,
      min: 0,
      max: 1,
      step: 0.01,
    },
    style: {
      type: "select",
      label: "Style",
      defaultValue: SOUL_DEFAULT_STYLE,
      options: SOUL_STYLE_OPTIONS.map((value) => ({
        label: value,
        value,
      })),
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    const style = String(values.style || "").trim();
    return runGeneration(context, {
      apiEndpoint: "/api/ai/soul-image-to-image/generate",
      scenario: "soul-image-to-image",
      requestBody: {
        mediaType: "image",
        enable_base64_output: false,
        image: imageUrls[0],
        prompt: values.prompt.trim(),
        quality: values.quality,
        size: values.size,
        strength: roundStrength(Number(values.strength)),
        ...(style ? { style } : {}),
      },
    });
  },
};

export const zImageTurboImageToImageConfig: PlaygroundConfig = {
  model: {
    id: "z-image-turbo-image-to-image",
    name: "Z Image Turbo",
    badge: "Free",
  },
  scenarioType: "image-to-image",
  creditScenario: "z-image-turbo-image-to-image",
  estimateParams: (values) => ({
    size: values.size,
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: promptField,
    size: {
      type: "select",
      label: "Size",
      defaultValue: Z_IMAGE_TURBO_DEFAULT_SIZE,
      options: Z_IMAGE_TURBO_SIZE_OPTIONS.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    },
    strength: {
      type: "slider",
      label: "Strength",
      defaultValue: Z_IMAGE_TURBO_DEFAULT_STRENGTH,
      min: 0,
      max: 1,
      step: 0.01,
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: Z_IMAGE_TURBO_DEFAULT_OUTPUT_FORMAT,
      options: Z_IMAGE_TURBO_OUTPUT_FORMAT_OPTIONS.map((value) => ({
        label: value.toUpperCase(),
        value,
      })),
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    return runGeneration(context, {
      apiEndpoint: "/api/ai/z-image-turbo-image-to-image/generate",
      scenario: "z-image-turbo-image-to-image",
      requestBody: {
        mediaType: "image",
        enable_base64_output: false,
        image: imageUrls[0],
        prompt: values.prompt.trim(),
        size: values.size,
        strength: roundStrength(Number(values.strength)),
        output_format: values.outputFormat,
        seed: -1,
      },
    });
  },
};

export const imageEraserConfig: PlaygroundConfig = {
  model: { id: "image-eraser", name: "Image Eraser" },
  scenarioType: "image-to-image",
  creditScenario: "image-eraser",
  estimateParams: (values) => ({
    output_format: values.outputFormat,
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    maskImage: createUploadField(
      "Mask Image",
      "Optional. Upload a mask image to control what gets erased.",
    ),
    prompt: {
      type: "textarea",
      label: "Prompt",
      placeholder: "Describe what should fill the erased area",
      defaultValue: "",
      required: false,
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: [
        { label: "JPEG", value: "jpeg" },
        { label: "PNG", value: "png" },
        { label: "WebP", value: "webp" },
      ],
    },
  },
  onGenerate: async (values, context) => {
    const sourceImage = getUploadedImageUrls(values)[0];
    if (!sourceImage) {
      throw new Error("Source image is required");
    }

    const maskImage = getUploadedFieldUrls(values, "maskImage")[0];
    const { callbacks, t, requiredCredits, remainingCredits } = context;
    const result = await executeGeneration(
      {
        apiEndpoint: "/api/ai/image-eraser/generate",
        scenario: "image-eraser",
        requestBody: {
          mediaType: "image",
          enable_base64_output: false,
          image: sourceImage,
          prompt: String(values.prompt || "").trim(),
          output_format: values.outputFormat,
          ...(maskImage ? { mask_image: maskImage } : {}),
        },
        requiredCredits,
        remainingCredits,
      },
      callbacks,
      t,
    );

    if (!result.success || !result.url) {
      if (result.error && result.error !== "Authentication required") {
        throw new Error(result.error);
      }

      return result.requestId
        ? {
            requestId: result.requestId,
            taskId: result.requestId,
            scenario: "image-eraser",
            outputs: result.outputs,
          }
        : { imageUrl: "" };
    }

    return {
      imageUrl: result.url,
      outputs: result.outputs,
      requestId: result.requestId,
      taskId: result.requestId,
      scenario: "image-eraser",
    };
  },
};

export const imageBackgroundRemoverConfig: PlaygroundConfig = {
  model: { id: "image-background-remover", name: "Background Remover" },
  scenarioType: "image-to-image",
  creditScenario: "image-background-remover",
  estimateParams: () => ({}),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: {
      ...promptField,
      required: false,
      visible: false,
    },
  },
  onGenerate: async (values, context) => {
    const sourceImage = getUploadedImageUrls(values)[0];
    if (!sourceImage) {
      throw new Error("Source image is required");
    }

    return runGeneration(context, {
      apiEndpoint: "/api/ai/image-background-remover/generate",
      scenario: "image-background-remover",
      requestBody: {
        mediaType: "image",
        image: sourceImage,
        enable_base64_output: false,
        enable_sync_mode: false,
      },
    });
  },
};

export const imageUpscalerConfig: PlaygroundConfig = {
  model: { id: "image-upscaler", name: "Image Upscaler" },
  scenarioType: "image-to-image",
  creditScenario: "image-upscaler",
  estimateParams: (values) => ({
    target_resolution: values.targetResolution,
    output_format: values.outputFormat,
  }),
  schema: {
    referenceImages: createReferenceImagesField(1, false),
    prompt: {
      ...promptField,
      required: false,
      visible: false,
    },
    targetResolution: {
      type: "select",
      label: "Target Resolution",
      defaultValue: "4k",
      options: [
        { label: "2K", value: "2k" },
        { label: "4K", value: "4k" },
        { label: "8K", value: "8k" },
      ],
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: [
        { label: "JPEG", value: "jpeg" },
        { label: "PNG", value: "png" },
        { label: "WebP", value: "webp" },
      ],
    },
  },
  onGenerate: async (values, context) => {
    const sourceImage = getUploadedImageUrls(values)[0];
    if (!sourceImage) {
      throw new Error("Source image is required");
    }

    return runGeneration(context, {
      apiEndpoint: "/api/ai/image-upscaler/generate",
      scenario: "image-upscaler",
      requestBody: {
        mediaType: "image",
        image: sourceImage,
        enable_base64_output: false,
        enable_sync_mode: false,
        output_format: values.outputFormat,
        target_resolution: values.targetResolution,
      },
    });
  },
};
