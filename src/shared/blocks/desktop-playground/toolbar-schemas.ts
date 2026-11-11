/**
 * 首页工具栏参数 Schema 静态数据
 *
 * 仅含 select/number 类型字段的 options、label、默认值，
 * 不含任何 JSX、异步函数或 UI 组件——与 ~2733 行的 desktop-playground
 * 配置完全解耦，供首页首屏同步加载。
 *
 * 格式与 @/shared/blocks/desktop-playground/types/playground-config.ts
 * 中 FieldSchema 的子集保持一致。
 */

export type StaticFieldOption = { label: string; value: string };
export type StaticSelectField = {
  type: "select";
  label: string;
  defaultValue: string;
  options: StaticFieldOption[];
};
export type StaticNumberField = {
  type: "number";
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
};
export type StaticFieldSchema = StaticSelectField | StaticNumberField;
export type StaticSchema = Partial<Record<string, StaticFieldSchema>>;

// ── 共享选项常量（零导入） ────────────────────────────────────────────────────

const ASPECT_RATIO_OPTIONS: StaticFieldOption[] = [
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

const SEEDREAM_ASPECT_RATIO_OPTIONS: StaticFieldOption[] = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "21:9", value: "21:9" },
];

const YOGA_ASPECT_RATIO_OPTIONS: StaticFieldOption[] = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
  { label: "9:16", value: "9:16" },
];

const OUTPUT_FORMAT_OPTIONS: StaticFieldOption[] = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
];

const RESOLUTION_OPTIONS: StaticFieldOption[] = [
  { label: "1k", value: "1k" },
  { label: "2k", value: "2k" },
  { label: "4k", value: "4k" },
];

const GPT_IMAGE_2_ASPECT_RATIO_OPTIONS: StaticFieldOption[] = [
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

// ── 文本生图模型 ──────────────────────────────────────────────────────────────

const nanoBananaAspectResolution: StaticSchema = {
  aspectRatio: {
    type: "select",
    label: "Aspect Ratio",
    defaultValue: "1:1",
    options: ASPECT_RATIO_OPTIONS,
  },
  resolution: {
    type: "select",
    label: "Resolution",
    defaultValue: "2k",
    options: RESOLUTION_OPTIONS,
  },
  outputFormat: {
    type: "select",
    label: "Output Format",
    defaultValue: "png",
    options: OUTPUT_FORMAT_OPTIONS,
  },
};

const nanoBananaNoResolution: StaticSchema = {
  aspectRatio: {
    type: "select",
    label: "Aspect Ratio",
    defaultValue: "1:1",
    options: ASPECT_RATIO_OPTIONS,
  },
  outputFormat: {
    type: "select",
    label: "Output Format",
    defaultValue: "png",
    options: OUTPUT_FORMAT_OPTIONS,
  },
};

// ── 视频生图模型（仅 aspectRatio/duration/resolution） ───────────────────────

const videoAspectDuration: StaticSchema = {
  aspectRatio: {
    type: "select",
    label: "Aspect Ratio",
    defaultValue: "16:9",
    options: [
      { label: "16:9", value: "16:9" },
      { label: "9:16", value: "9:16" },
      { label: "1:1", value: "1:1" },
    ],
  },
  duration: {
    type: "select",
    label: "Duration",
    defaultValue: "5",
    options: [
      { label: "5s", value: "5" },
      { label: "10s", value: "10" },
    ],
  },
};

const videoAspectDurationQuality: StaticSchema = {
  ...videoAspectDuration,
  quality: {
    type: "select",
    label: "Quality",
    defaultValue: "standard",
    options: [
      { label: "Standard", value: "standard" },
      { label: "High", value: "high" },
    ],
  },
};

// ── 完整 Schema 映射（url → schema） ─────────────────────────────────────────

/**
 * 首页工具栏展示的参数 schema。
 * 严格只含首页需要渲染的参数（select/number），不含 prompt、upload 等交互字段。
 * 对应 playground-config-registry 中的 PlaygroundConfig.schema 子集。
 */
export const TOOLBAR_SCHEMAS: Record<string, StaticSchema> = {
  "/text-to-image/z-image-turbo": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: YOGA_ASPECT_RATIO_OPTIONS,
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: OUTPUT_FORMAT_OPTIONS,
    },
  },
  "/text-to-image/yoga-v1": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: YOGA_ASPECT_RATIO_OPTIONS,
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: OUTPUT_FORMAT_OPTIONS,
    },
  },
  "/text-to-image/nano-banana": nanoBananaNoResolution,
  "/text-to-image/nano-banana-pro": nanoBananaAspectResolution,
  "/text-to-image/nano-banana-2": nanoBananaAspectResolution,
  "/text-to-image/seedream-4-5": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: SEEDREAM_ASPECT_RATIO_OPTIONS,
    },
  },
  "/text-to-image/seedream-5-0-lite": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: SEEDREAM_ASPECT_RATIO_OPTIONS,
    },
  },
  "/text-to-image/flux-2-klein": {
    width: { type: "number", label: "Width", defaultValue: 1024, min: 256, max: 1536, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 1024, min: 256, max: 1536, step: 64 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/text-to-image/gpt-image-1": {
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
  "/text-to-image/gpt-image-2": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: GPT_IMAGE_2_ASPECT_RATIO_OPTIONS,
    },
  },
  "/text-to-image/qwen-image-202512": {
    width: { type: "number", label: "Width", defaultValue: 1536, min: 512, max: 1536, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 1536, min: 512, max: 1536, step: 64 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "jpeg",
      options: OUTPUT_FORMAT_OPTIONS,
    },
  },
  "/text-to-image/wan-2-7": {
    width: { type: "number", label: "Width", defaultValue: 2048, min: 512, max: 4096, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 2048, min: 512, max: 4096, step: 64 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/text-to-image/midjourney": {
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
    stylize: { type: "number", label: "Stylize", defaultValue: 100, min: 0, max: 1000, step: 1 },
    chaos: { type: "number", label: "Chaos", defaultValue: 0, min: 0, max: 100, step: 1 },
    weird: { type: "number", label: "Weird", defaultValue: 0, min: 0, max: 3000, step: 1 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-image": nanoBananaAspectResolution,
  "/image-to-image/flux-2-klein": {
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-image/soul": nanoBananaNoResolution,
  "/image-to-image/z-image-turbo": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: ASPECT_RATIO_OPTIONS,
    },
    outputFormat: {
      type: "select",
      label: "Output Format",
      defaultValue: "png",
      options: OUTPUT_FORMAT_OPTIONS,
    },
  },
  "/image-to-image/grok-imagine-image": nanoBananaNoResolution,
  "/image-to-image/seedream-5-0-lite": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: SEEDREAM_ASPECT_RATIO_OPTIONS,
    },
  },
  "/image-to-image/qwen-image-max": {
    width: { type: "number", label: "Width", defaultValue: 1536, min: 512, max: 1536, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 1536, min: 512, max: 1536, step: 64 },
  },
  "/image-to-image/gpt-image-2": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: GPT_IMAGE_2_ASPECT_RATIO_OPTIONS,
    },
  },
  "/image-to-image/wan-2-7": {
    width: { type: "number", label: "Width", defaultValue: 512, min: 512, max: 4096, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 512, min: 512, max: 4096, step: 64 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-image/wan-2-7-image-edit-pro": {
    width: { type: "number", label: "Width", defaultValue: 512, min: 512, max: 4096, step: 64 },
    height: { type: "number", label: "Height", defaultValue: 512, min: 512, max: 4096, step: 64 },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-image/nano-banana": nanoBananaNoResolution,
  "/image-to-image/nano-banana-2": nanoBananaAspectResolution,
  "/image-to-image/nano-banana-pro-edit-ultra": nanoBananaAspectResolution,
  "/qwen-image-layered": {
    numLayers: {
      type: "number",
      label: "Number of Layers",
      defaultValue: 8,
      min: 2,
      max: 8,
      step: 1,
    },
  },
  "/image-eraser": {},
  "/image-background-remover": {},
  "/image-upscaler": {
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
  },
  "/text-to-video/wan-2-6": {
    size: {
      type: "select",
      label: "Size",
      defaultValue: "1280*720",
      options: [
        { label: "1280×720", value: "1280*720" },
        { label: "1920×1080", value: "1920*1080" },
        { label: "720×1280", value: "720*1280" },
        { label: "1080×1920", value: "1080*1920" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: [
        { label: "5s", value: "5" },
        { label: "10s", value: "10" },
        { label: "15s", value: "15" },
      ],
    },
    shotType: {
      type: "select",
      label: "Shot Type",
      defaultValue: "single",
      options: [
        { label: "Single Shot", value: "single" },
        { label: "Multiple Shots", value: "multiple" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    enablePromptExpansion: {
      type: "select",
      label: "Prompt Expansion",
      defaultValue: "true",
      options: [
        { label: "On", value: "true" },
        { label: "Off", value: "false" },
      ],
    },
  },
  "/text-to-video/wan-2-7": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "9:16", value: "9:16" },
        { label: "1:1", value: "1:1" },
        { label: "4:3", value: "4:3" },
        { label: "3:4", value: "3:4" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "15",
      options: [
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    enablePromptExpansion: {
      type: "select",
      label: "Prompt Expansion",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/text-to-video/veo-3-1": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: [
        { label: "4s", value: "4" },
        { label: "6s", value: "6" },
        { label: "8s", value: "8" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/text-to-video/seedance-1-5-pro": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "21:9", value: "21:9" },
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "fast 720p",
      options: [
        { label: "Fast 720p", value: "fast 720p" },
        { label: "Fast 1080p", value: "fast 1080p" },
        { label: "720p", value: "720p" },
        { label: "480p", value: "480p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    cameraFixed: {
      type: "select",
      label: "Fixed Camera",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/text-to-video/seedance-2-0": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "480p", value: "480p" },
      ],
    },
    size: {
      type: "select",
      label: "Size",
      defaultValue: "16:9",
      options: [
        { label: "21:9", value: "21:9" },
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
        { label: "3:4", value: "3:4" },
        { label: "9:16", value: "9:16" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "4s", value: "4" },
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "true",
      options: [
        { label: "On", value: "true" },
        { label: "Off", value: "false" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: 42, min: 0, max: 2147483647, step: 1 },
  },
  "/text-to-video/pixverse-5-6": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
        { label: "3:4", value: "3:4" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "360p",
      options: [
        { label: "360p", value: "360p" },
        { label: "540p", value: "540p" },
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: [
        { label: "5s", value: "5" },
        { label: "8s", value: "8" },
        { label: "10s", value: "10" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    thinkingType: {
      type: "select",
      label: "Thinking Type",
      defaultValue: "auto",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/text-to-video/ltx2-fast": {
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: [
        { label: "6s", value: "6" },
        { label: "8s", value: "8" },
        { label: "10s", value: "10" },
        { label: "12s", value: "12" },
        { label: "14s", value: "14" },
        { label: "16s", value: "16" },
        { label: "18s", value: "18" },
        { label: "20s", value: "20" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "true",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/text-to-video/happyhorse-1-0": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "9:16", value: "9:16" },
        { label: "1:1", value: "1:1" },
        { label: "4:3", value: "4:3" },
        { label: "3:4", value: "3:4" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "3s", value: "3" },
        { label: "4s", value: "4" },
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-video/wan-2-7": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
    enablePromptExpansion: {
      type: "select",
      label: "Prompt Expansion",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/image-to-video/vidu-q3": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: [
        { label: "540p", value: "540p" },
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: [
        { label: "4s", value: "4" },
        { label: "8s", value: "8" },
      ],
    },
    movementAmplitude: {
      type: "select",
      label: "Movement Amplitude",
      defaultValue: "auto",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    bgm: {
      type: "select",
      label: "Background Music",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/image-to-video/veo-3-1": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "1080p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: [
        { label: "4s", value: "4" },
        { label: "6s", value: "6" },
        { label: "8s", value: "8" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/image-to-video/seedance-1-5-pro": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "16:9",
      options: [
        { label: "Auto", value: "auto" },
        { label: "21:9", value: "21:9" },
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "fast 720p",
      options: [
        { label: "Fast 720p", value: "fast 720p" },
        { label: "Fast 1080p", value: "fast 1080p" },
        { label: "720p", value: "720p" },
        { label: "480p", value: "480p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    cameraFixed: {
      type: "select",
      label: "Fixed Camera",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-video/seedance-2-0": {
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "4s", value: "4" },
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
  },
  "/image-to-video/pixverse-5-6": {
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: [
        { label: "16:9", value: "16:9" },
        { label: "4:3", value: "4:3" },
        { label: "1:1", value: "1:1" },
        { label: "3:4", value: "3:4" },
        { label: "9:16", value: "9:16" },
      ],
    },
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "360p",
      options: [
        { label: "360p", value: "360p" },
        { label: "540p", value: "540p" },
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "10",
      options: [
        { label: "5s", value: "5" },
        { label: "8s", value: "8" },
        { label: "10s", value: "10" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
    thinkingType: {
      type: "select",
      label: "Thinking Type",
      defaultValue: "auto",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Enabled", value: "enabled" },
        { label: "Disabled", value: "disabled" },
      ],
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/image-to-video/ltx2-fast": {
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "8",
      options: [
        { label: "6s", value: "6" },
        { label: "8s", value: "8" },
        { label: "10s", value: "10" },
        { label: "12s", value: "12" },
        { label: "14s", value: "14" },
        { label: "16s", value: "16" },
        { label: "18s", value: "18" },
        { label: "20s", value: "20" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "true",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/image-to-video/happyhorse-1-0": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "3s", value: "3" },
        { label: "4s", value: "4" },
        { label: "5s", value: "5" },
        { label: "6s", value: "6" },
        { label: "7s", value: "7" },
        { label: "8s", value: "8" },
        { label: "9s", value: "9" },
        { label: "10s", value: "10" },
        { label: "11s", value: "11" },
        { label: "12s", value: "12" },
        { label: "13s", value: "13" },
        { label: "14s", value: "14" },
        { label: "15s", value: "15" },
      ],
    },
  },
  "/image-to-video/midjourney": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "480p",
      options: [
        { label: "480p", value: "480p" },
        { label: "720p", value: "720p" },
      ],
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: [
        { label: "1:1", value: "1:1" },
        { label: "4:3", value: "4:3" },
        { label: "3:4", value: "3:4" },
        { label: "2:3", value: "2:3" },
        { label: "16:9", value: "16:9" },
        { label: "1:2", value: "1:2" },
      ],
    },
    motion: {
      type: "select",
      label: "Motion",
      defaultValue: "low",
      options: [
        { label: "Low", value: "low" },
        { label: "High", value: "high" },
      ],
    },
    quality: {
      type: "number",
      label: "Quality",
      defaultValue: 1,
      min: 0.25,
      max: 2,
      step: 0.25,
    },
    stylize: {
      type: "number",
      label: "Stylize",
      defaultValue: 0,
      min: 0,
      max: 1000,
      step: 10,
    },
    chaos: {
      type: "number",
      label: "Chaos",
      defaultValue: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    weird: {
      type: "number",
      label: "Weird",
      defaultValue: 0,
      min: 0,
      max: 3000,
      step: 10,
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/video-extend/wan-2-7": {
    resolution: {
      type: "select",
      label: "Resolution",
      defaultValue: "720p",
      options: [
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
    duration: {
      type: "number",
      label: "Duration",
      defaultValue: 5,
      min: 5,
      max: 15,
      step: 1,
    },
    seed: { type: "number", label: "Seed", defaultValue: -1, min: -1, max: 2147483647, step: 1 },
  },
  "/motion-control/kling-2-6-pro": {
    duration: {
      type: "select",
      label: "Duration",
      defaultValue: "5",
      options: [
        { label: "5s", value: "5" },
        { label: "10s", value: "10" },
      ],
    },
    generateAudio: {
      type: "select",
      label: "Generate Audio",
      defaultValue: "false",
      options: [
        { label: "Off", value: "false" },
        { label: "On", value: "true" },
      ],
    },
  },
  "/longcat-avatar": {},
  "/video-face-swap": {},
};
