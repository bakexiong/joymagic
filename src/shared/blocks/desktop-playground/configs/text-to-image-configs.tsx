import type { PlaygroundConfig } from "../types/playground-config";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import { executeGeneration } from "./execute-generation";

const aspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "4:5", value: "4:5" },
  { label: "5:4", value: "5:4" },
  { label: "9:16", value: "9:16" },
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

const outputFormatOptions = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
];

const resolutionOptions = [
  { label: "1k", value: "1k" },
  { label: "2k", value: "2k" },
  { label: "4k", value: "4k" },
];

const seedreamAspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "21:9", value: "21:9" },
];

const yogaV1AspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "9:16", value: "9:16" },
];

const seedreamAspectRatioSizeMap: Record<string, string> = {
  "1:1": "2048x2048",
  "16:9": "2848x1600",
  "9:16": "1600x2848",
  "4:3": "2304x1728",
  "3:4": "1728x2304",
  "3:2": "2496x1664",
  "2:3": "1664x2496",
  "21:9": "3136x1344",
};

function getUploadedMediaUrls(
  values: Record<string, any>,
  fieldKey: string,
): string[] {
  const items = Array.isArray(values[fieldKey])
    ? (values[fieldKey] as ImageUploaderValue[])
    : [];

  return items
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

async function runGeneration(
  values: Record<string, any>,
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

export const flux2KleinTextToImageConfig: PlaygroundConfig = {
  model: {
    id: "flux-2-klein",
    name: "Flux 2 Klein",
  },
  scenarioType: "text-to-image",
  schema: {
    prompt: {
      type: "textarea",
      label: "Prompt",
      description: "Describe the image you want to generate",
      placeholder:
        "ancient monumental Teotihuacan pyramids illuminated by red lights, in the sky a giant Saturn suspended in the sky, sculptural and non-astronomical, with rings of liquid metal, futuristic yet archaic, evoking a sacred portal rather than a planet, little light fog, cinematic depth and atmospheric perspective, minimal composition with large clean negative space for typography",
      defaultValue: "",
      required: true,
    },
    width: {
      type: "slider",
      label: "Width",
      description: "Image width in pixels (256-1536, must be multiple of 64)",
      defaultValue: 1024,
      min: 256,
      max: 1536,
      step: 64,
      required: true,
    },
    height: {
      type: "slider",
      label: "Height",
      description: "Image height in pixels (256-1536, must be multiple of 64)",
      defaultValue: 1024,
      min: 256,
      max: 1536,
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
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/flux-2-klein-text-to-image/generate",
      scenario: "flux-2-klein-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        size: `${values.width}*${values.height}`,
        seed: values.seed === -1 ? -1 : values.seed,
      },
    }),
};

export const nanoBanana2TextToImageConfig: PlaygroundConfig = {
  model: { id: "nano-banana-2", name: "Nano Banana 2" },
  scenarioType: "text-to-image",
  creditScenario: "nano-banana-2-text-to-image",
  estimateParams: (values) => ({
    resolution: values.resolution,
  }),
  schema: {
    prompt: {
      type: "textarea",
      label: "Prompt",
      placeholder: "Describe the image you want to generate",
      defaultValue: "",
      required: true,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: aspectRatioOptions,
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "2k",
      options: resolutionOptions,
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "png",
      options: outputFormatOptions,
    },
  },
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/nano-banana-2-text-to-image/generate",
      scenario: "nano-banana-2-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        output_format: values.outputFormat,
        aspect_ratio: values.aspectRatio,
        resolution: values.resolution,
      },
    }),
};

export const nanoBananaProTextToImageConfig: PlaygroundConfig = {
  model: { id: "nano-banana-pro", name: "Nano Banana Pro" },
  scenarioType: "text-to-image",
  creditScenario: "nano-banana-pro-text-to-image",
  estimateParams: (values) => ({
    resolution: values.resolution,
  }),
  schema: nanoBanana2TextToImageConfig.schema,
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/nano-banana-pro-text-to-image/generate",
      scenario: "nano-banana-pro-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        output_format: values.outputFormat,
        aspect_ratio: values.aspectRatio,
        resolution: values.resolution,
      },
    }),
};

export const nanoBananaTextToImageConfig: PlaygroundConfig = {
  model: { id: "nano-banana", name: "Nano Banana" },
  scenarioType: "text-to-image",
  creditScenario: "nano-banana-text-to-image",
  estimateParams: (values) => ({
    // 与 requestBody 对齐：该模型不包含 resolution 字段，仅按基础参数计费
    aspect_ratio: values.aspectRatio,
  }),
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    aspectRatio: nanoBanana2TextToImageConfig.schema.aspectRatio,
    outputFormat: nanoBanana2TextToImageConfig.schema.outputFormat,
  },
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/nano-banana-text-to-image/generate",
      scenario: "nano-banana-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        output_format: values.outputFormat,
        aspect_ratio: values.aspectRatio,
      },
    }),
};

export const yogaV1TextToImageConfig: PlaygroundConfig = {
  model: { id: "yoga-v1", name: "Yoga V1", badge: "Free" },
  scenarioType: "text-to-image",
  creditScenario: "z-image-turbo-text-to-image",
  estimateParams: (values) => {
    const aspectRatioSizeMap: Record<string, string> = {
      "1:1": "1024*1024",
      "16:9": "1536*864",
      "3:2": "1536*1024",
      "2:3": "1024*1536",
      "3:4": "1152*1536",
      "4:3": "1536*1152",
      "9:16": "864*1536",
    };

    return {
      size: aspectRatioSizeMap[values.aspectRatio] || aspectRatioSizeMap["1:1"],
    };
  },
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: yogaV1AspectRatioOptions,
    },
    seed: {
      type: "number",
      label: "Seed",
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      step: 1,
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
    const aspectRatioSizeMap: Record<string, string> = {
      "1:1": "1024*1024",
      "16:9": "1536*864",
      "3:2": "1536*1024",
      "2:3": "1024*1536",
      "3:4": "1152*1536",
      "4:3": "1536*1152",
      "9:16": "864*1536",
    };

    return runGeneration(values, context, {
      apiEndpoint: "/api/ai/z-image-turbo-text-to-image/generate",
      scenario: "z-image-turbo-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        size:
          aspectRatioSizeMap[values.aspectRatio] || aspectRatioSizeMap["1:1"],
        seed:
          typeof values.seed === "number" ? values.seed : Number(values.seed),
        output_format: values.outputFormat,
        enable_base64_output: false,
      },
    });
  },
};

export const zImageTurboTextToImageConfig: PlaygroundConfig = {
  ...yogaV1TextToImageConfig,
  model: {
    id: "z-image-turbo-text-to-image",
    name: "Z Image Turbo",
    badge: "Free",
  },
};

export const gptImage1TextToImageConfig: PlaygroundConfig = {
  model: { id: "gpt-image-1", name: "GPT-Image-1" },
  scenarioType: "text-to-image",
  creditScenario: "gpt-image-1-text-to-image",
  estimateParams: (values) => ({
    size: values.size,
    quality: values.quality,
  }),
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    size: {
      type: "select",
      label: "Size",
      defaultValue: "1024*1536",
      options: [
        { label: "1024×1024", value: "1024*1024" },
        { label: "1024×1536", value: "1024*1536" },
        { label: "1536×1024", value: "1536*1024" },
      ],
    },
    quality: {
      type: "select",
      label: "Quality",
      defaultValue: "medium",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ],
    },
  },
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/gpt-image-1-text-to-image/generate",
      scenario: "gpt-image-1-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        quality: values.quality,
        size: values.size,
      },
    }),
};

export const gptImage2TextToImageConfig: PlaygroundConfig = {
  model: { id: "gpt-image-2", name: "GPT-Image 2" },
  scenarioType: "text-to-image",
  creditScenario: "gpt-image-2-text-to-image",
  estimateParams: (values) => ({
    aspect_ratio: values.aspectRatio,
  }),
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: gptImage2AspectRatioOptions,
    },
  },
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/gpt-image-2-text-to-image/generate",
      scenario: "gpt-image-2-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        aspect_ratio: values.aspectRatio,
      },
    }),
};

async function runSeedreamGeneration(
  values: Record<string, any>,
  context: Parameters<PlaygroundConfig["onGenerate"]>[1],
  config: {
    apiEndpoint: string;
    scenario: string;
  },
) {
  const { callbacks, t, requiredCredits, remainingCredits } = context;
  const result = await executeGeneration(
    {
      apiEndpoint: config.apiEndpoint,
      scenario: config.scenario,
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        size:
          seedreamAspectRatioSizeMap[values.aspectRatio] ||
          seedreamAspectRatioSizeMap["1:1"],
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

    return { imageUrl: "" };
  }

  if (!result.url) {
    throw new Error("Failed to generate image");
  }

  return { imageUrl: result.url };
}

export const seedreamV45TextToImageConfig: PlaygroundConfig = {
  model: { id: "seedream-4-5", name: "Seedream 4.5" },
  scenarioType: "text-to-image",
  creditScenario: "seedream-v4-5-text-to-image",
  estimateParams: (values) => ({
    // Seedream 使用 aspectRatio 映射 size（runSeedreamGeneration 内会做映射）
    aspect_ratio: values.aspectRatio,
  }),
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: seedreamAspectRatioOptions,
    },
  },
  onGenerate: async (values, context) =>
    runSeedreamGeneration(values, context, {
      apiEndpoint: "/api/ai/seedream-v4-5-text-to-image/generate",
      scenario: "seedream-v4-5-text-to-image",
    }),
};

export const seedream50LiteTextToImageConfig: PlaygroundConfig = {
  model: { id: "seedream-5-0-lite", name: "Seedream 5.0 Lite" },
  scenarioType: "text-to-image",
  creditScenario: "seedream-5-0-lite-text-to-image",
  estimateParams: (values) => ({
    aspect_ratio: values.aspectRatio,
  }),
  schema: seedreamV45TextToImageConfig.schema,
  onGenerate: async (values, context) =>
    runSeedreamGeneration(values, context, {
      apiEndpoint: "/api/ai/seedream-5-0-lite-text-to-image/generate",
      scenario: "seedream-5-0-lite-text-to-image",
    }),
};

export const qwen202512TextToImageConfig: PlaygroundConfig = {
  model: { id: "qwen-image-202512", name: "Qwen Image 202512" },
  scenarioType: "text-to-image",
  creditScenario: "qwen-202512-text-to-image",
  estimateParams: (values) => ({
    size: `${values.width}*${values.height}`,
  }),
  schema: {
    prompt: nanoBanana2TextToImageConfig.schema.prompt,
    width: {
      type: "slider",
      label: "Width",
      defaultValue: 1536,
      min: 512,
      max: 1536,
      step: 64,
    },
    height: {
      type: "slider",
      label: "Height",
      defaultValue: 1536,
      min: 512,
      max: 1536,
      step: 64,
    },
    seed: {
      type: "number",
      label: "Seed",
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      step: 1,
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: outputFormatOptions,
    },
  },
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/qwen-202512-text-to-image/generate",
      scenario: "qwen-202512-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        size: `${values.width}*${values.height}`,
        seed: values.seed,
        output_format: values.outputFormat,
      },
    }),
};

export const wan27TextToImageConfig: PlaygroundConfig = {
  model: { id: "wan-2-7", name: "Wan 2.7" },
  scenarioType: "text-to-image",
  creditScenario: "text-to-image-wan-2-7",
  estimateParams: (values) => ({
    size: `${values.width}*${values.height}`,
    thinking_mode: Boolean(values.thinking_mode),
  }),
  schema: {
    prompt: {
      type: "textarea",
      label: "Prompt",
      description: "Describe the image you want to generate",
      placeholder:
        "Close-up portrait of a model whose face is partially covered in flowing liquid metal or an iridescent, second-skin-like substance. She has otherworldly, light purple eyes and stares directly into the camera.",
      defaultValue: "",
      required: true,
    },
    width: {
      type: "slider",
      label: "Width",
      defaultValue: 2048,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    height: {
      type: "slider",
      label: "Height",
      defaultValue: 2048,
      min: 512,
      max: 4096,
      step: 64,
      required: true,
    },
    thinking_mode: {
      type: "toggle",
      label: "Thinking Mode",
      description:
        "Enable thinking mode for enhanced reasoning and better image quality. Increases generation time.",
      defaultValue: true,
      required: false,
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
  onGenerate: async (values, context) =>
    runGeneration(values, context, {
      apiEndpoint: "/api/ai/text-to-image-wan-2-7/generate",
      scenario: "text-to-image-wan-2-7",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        size: `${values.width}*${values.height}`,
        thinking_mode: Boolean(values.thinking_mode),
        seed:
          typeof values.seed === "number" ? values.seed : Number(values.seed),
      },
    }),
};

export const midjourneyTextToImageConfig: PlaygroundConfig = {
  model: { id: "midjourney-text-to-image", name: "Midjourney" },
  scenarioType: "text-to-image",
  creditScenario: "midjourney-text-to-image",
  estimateParams: (values) => ({
    aspect_ratio: values.aspectRatio,
  }),
  schema: {
    prompt: {
      type: "textarea",
      label: "Prompt",
      placeholder: "Describe the image you want to generate",
      defaultValue: "",
      required: true,
    },
    referenceImage: {
      type: "upload",
      label: "Reference Image",
      description: "Upload an optional reference image to influence style.",
      defaultValue: [],
      required: false,
      accept: "image/png,image/jpeg,image/webp,image/jpg",
      multiple: false,
      maxFiles: 1,
      uploadUrl: "/api/storage/upload-image",
      previewType: "image",
      maxSizeMB: 10,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "none",
      options: [
        { label: "Auto", value: "none" },
        { label: "1:1", value: "1:1" },
        { label: "9:16", value: "9:16" },
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "3:4", value: "3:4" },
        { label: "2:3", value: "2:3" },
        { label: "3:2", value: "3:2" },
        { label: "9:21", value: "9:21" },
        { label: "21:9", value: "21:9" },
      ],
    },
    quality: {
      type: "select",
      label: "Quality",
      defaultValue: "1",
      options: [
        { label: "0.25", value: "0.25" },
        { label: "0.5", value: "0.5" },
        { label: "1", value: "1" },
        { label: "2", value: "2" },
      ],
    },
    stylize: {
      type: "slider",
      label: "Stylize",
      defaultValue: 100,
      min: 0,
      max: 1000,
      step: 1,
    },
    chaos: {
      type: "slider",
      label: "Chaos",
      defaultValue: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    weird: {
      type: "slider",
      label: "Weird",
      defaultValue: 0,
      min: 0,
      max: 3000,
      step: 1,
    },
    version: {
      type: "select",
      label: "Version",
      defaultValue: "7",
      options: [
        { label: "V6", value: "6" },
        { label: "V6.1", value: "6.1" },
        { label: "V7", value: "7" },
      ],
    },
    niji: {
      type: "select",
      label: "Niji",
      defaultValue: "none",
      options: [
        { label: "None", value: "none" },
        { label: "Niji 5", value: "5" },
        { label: "Niji 6", value: "6" },
        { label: "Close", value: "close" },
      ],
    },
    seed: {
      type: "text",
      label: "Seed",
      placeholder: "Use -1 for random seed",
      defaultValue: "-1",
    },
  },
  onGenerate: async (values, context) => {
    const sref = getUploadedMediaUrls(values, "referenceImage")[0];

    return runGeneration(values, context, {
      apiEndpoint: "/api/ai/midjourney-text-to-image/generate",
      scenario: "midjourney-text-to-image",
      requestBody: {
        mediaType: "image",
        prompt: values.prompt.trim(),
        quality: Number.parseFloat(String(values.quality)) || 1,
        stylize: Number(values.stylize) || 0,
        chaos: Number(values.chaos) || 0,
        weird: Number(values.weird) || 0,
        version: values.version,
        seed: Number.parseInt(String(values.seed), 10),
        enable_base64_output: false,
        sref: sref || undefined,
        aspect_ratio:
          values.aspectRatio && values.aspectRatio !== "none"
            ? values.aspectRatio
            : undefined,
        niji:
          values.niji && values.niji !== "none" ? values.niji : undefined,
      },
    });
  },
};
