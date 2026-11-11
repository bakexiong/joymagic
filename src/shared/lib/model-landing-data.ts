import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground/types/playground-config";
import {
  getPlaygroundConfigByUrl,
  REGISTRY_KEY_BY_URL,
} from "@/shared/blocks/desktop-playground/playground-config-registry";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { getModelLandingNarrativeConfig } from "@/shared/lib/model-landing-narrative-config";
import {
  getGeneratedModelLandingTemplateCopy,
  type ModelLandingTemplateCopy,
} from "@/shared/lib/model-landing-template-copy";
import {
  filterWorkbenchTemplateSamplesByPolicy,
  getWorkbenchTemplateSamplesForModel,
} from "@/shared/lib/workbench-template-catalog";

type LandingStat = {
  label: string;
  value: string;
};

type LandingGalleryItem = {
  title: string;
  caption: string;
  prompt: string;
  accentClassName: string;
  imageUrl?: string;
};

type LandingFaqItem = {
  question: string;
  answer: string;
};

type LandingScenePreset = {
  sceneId: string;
  modelKey: string;
  modelUrl: string;
  modeLabel: string;
  title: string;
  description: string;
  spotlight: string;
  useCases: string[];
  starterPrompt: string;
};

type ModelLandingPreset = {
  slug: string;
  aliases: string[];
  primarySceneId: string;
  primaryModelKey: string;
  scenes: LandingScenePreset[];
};

export type ModelLandingScene = LandingScenePreset & {
  controls: string[];
  vendorLogoUrl?: string;
};

export type ModelLandingPageData = Omit<ModelLandingPreset, "scenes"> & {
  title: string;
  provider: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  stats: LandingStat[];
  differentiators: string[];
  gallery: LandingGalleryItem[];
  faqs: LandingFaqItem[];
  scenes: ModelLandingScene[];
  templateCopy: ModelLandingTemplateCopy;
};

type ModelPagesTranslator = {
  (key: string, ...args: any[]): string;
  raw(key: string): any;
};

type ModelLandingPresetWithMeta = ModelLandingPreset & {
  title: string;
  provider: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  stats: LandingStat[];
  differentiators: string[];
  faqs: LandingFaqItem[];
  galleryBase?: LandingGalleryItem[];
};

type LocaleFlavor = "zh" | "zh-hant" | "en";

type GenericSceneKind =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "video-extend"
  | "motion-control"
  | "layered-edit"
  | "image-eraser"
  | "image-background-remover"
  | "image-upscaler"
  | "avatar-video"
  | "video-face-swap";

type DiscoveredModelScene = {
  url: string;
  sceneId: string;
  modelKey: string;
  modelName: string;
  scenarioType?: PlaygroundConfig["scenarioType"];
  sceneKind: GenericSceneKind;
  starterPrompt: string;
};

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toKebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLocaleFlavor(locale: string): LocaleFlavor {
  if (locale === "zh") {
    return "zh";
  }

  if (locale.startsWith("zh-")) {
    return "zh-hant";
  }

  return "en";
}

function safeRaw<T>(t: ModelPagesTranslator, key: string): T | undefined {
  try {
    return t.raw(key) as T;
  } catch {
    return undefined;
  }
}

function safeTranslate(t: ModelPagesTranslator, key: string) {
  try {
    return t(key);
  } catch {
    return undefined;
  }
}

function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSchemaControlLabels(
  config: Awaited<ReturnType<typeof getPlaygroundConfigByUrl>>,
  copy: ModelLandingTemplateCopy["controls"],
) {
  if (!config?.schema) {
    return [copy.promptWorkflow, copy.creatorSync];
  }

  const controls: string[] = [];
  const { schema } = config;

  if (schema.referenceImages) {
    const maxFiles = schema.referenceImages.maxFiles;
    controls.push(
      maxFiles
        ? copy.uploadUpToRefs.replace("{count}", String(maxFiles))
        : copy.referenceUploads,
    );
  }

  if (schema.aspectRatio?.options?.length) {
    controls.push(
      copy.aspectRatios.replace(
        "{count}",
        String(schema.aspectRatio.options.length),
      ),
    );
  }

  if (schema.resolution?.options?.length) {
    controls.push(
      copy.resolutionPresets.replace(
        "{count}",
        String(schema.resolution.options.length),
      ),
    );
  }

  if (schema.outputFormat?.options?.length) {
    controls.push(
      schema.outputFormat.options
        .slice(0, 3)
        .map((item) => String(item.label || item.value).toUpperCase())
        .join(" / "),
    );
  }

  Object.entries(schema).forEach(([key, field]) => {
    if (!field) return;
    if (
      key === "prompt" ||
      key === "referenceImages" ||
      key === "aspectRatio" ||
      key === "resolution" ||
      key === "outputFormat"
    ) {
      return;
    }

    if (controls.length >= 4) return;

    if (field.type === "select" && field.options?.length) {
      controls.push(toTitleLabel(key));
    }
  });

  return controls.slice(0, 4);
}

function getTemplateSampleImageUrl(
  sample?: Awaited<
    ReturnType<typeof getWorkbenchTemplateSamplesForModel>
  >[number],
) {
  if (!sample) {
    return undefined;
  }

  if (typeof sample.generatedUrl === "string" && sample.generatedUrl) {
    return sample.generatedUrl;
  }

  if (Array.isArray(sample.generatedUrls) && sample.generatedUrls[0]) {
    return sample.generatedUrls[0];
  }

  if (typeof sample.thumbnailUrl === "string" && sample.thumbnailUrl) {
    return sample.thumbnailUrl;
  }

  return sample.previewUrl;
}

function toGalleryFallbackTitle(
  copy: ModelLandingTemplateCopy,
  prompt?: string,
  index?: number,
) {
  const cleaned = String(prompt || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return `${copy.fallbackSampleTitle} ${String((index || 0) + 1).padStart(2, "0")}`;
  }

  const firstChunk = cleaned.split(/[,.!?]/)[0]?.trim() || cleaned;
  const title = firstChunk
    .split(" ")
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    title ||
    `${copy.fallbackSampleTitle} ${String((index || 0) + 1).padStart(2, "0")}`
  );
}

function toGalleryFallbackCaption(
  copy: ModelLandingTemplateCopy,
  prompt?: string,
) {
  const cleaned = String(prompt || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return copy.fallbackSampleCaption;
  }

  return `${cleaned.slice(0, 110).trim()}${cleaned.length > 110 ? "..." : ""}`;
}

function inferProviderName(modelName: string, modelUrl: string, locale: string) {
  const normalized = `${modelName} ${modelUrl}`.toLowerCase();
  const flavor = getLocaleFlavor(locale);

  const providers =
    flavor === "zh"
      ? {
          internal: "Barko Bear",
          google: "Google",
          alibaba: "阿里",
          bytedance: "字节跳动",
          openai: "OpenAI",
          xai: "xAI",
          bfl: "Black Forest Labs",
          lightricks: "Lightricks",
          vidu: "生数科技",
          pixverse: "PixVerse",
          midjourney: "Midjourney",
          higgsfield: "Higgsfield",
          kuaishou: "快手",
        }
      : flavor === "zh-hant"
        ? {
            internal: "Barko Bear",
            google: "Google",
            alibaba: "阿里",
            bytedance: "字節跳動",
            openai: "OpenAI",
            xai: "xAI",
            bfl: "Black Forest Labs",
            lightricks: "Lightricks",
            vidu: "生數科技",
            pixverse: "PixVerse",
            midjourney: "Midjourney",
            higgsfield: "Higgsfield",
            kuaishou: "快手",
          }
        : {
            internal: "Barko Bear",
            google: "Google",
            alibaba: "Alibaba",
            bytedance: "ByteDance",
            openai: "OpenAI",
            xai: "xAI",
            bfl: "Black Forest Labs",
            lightricks: "Lightricks",
            vidu: "Shengshu",
            pixverse: "PixVerse",
            midjourney: "Midjourney",
            higgsfield: "Higgsfield",
            kuaishou: "Kuaishou",
          };

  if (normalized.includes("nano-banana") || normalized.includes("veo")) {
    return providers.google;
  }

  if (normalized.includes("seedream") || normalized.includes("seedance")) {
    return providers.bytedance;
  }

  if (
    normalized.includes("qwen") ||
    normalized.includes("wan") ||
    normalized.includes("happyhorse") ||
    normalized.includes("yoga-v1")
  ) {
    return providers.alibaba;
  }

  if (normalized.includes("gpt-image-1") || normalized.includes("gpt-image-2")) {
    return providers.openai;
  }

  if (normalized.includes("grok")) {
    return providers.xai;
  }

  if (normalized.includes("flux")) {
    return providers.bfl;
  }

  if (normalized.includes("ltx")) {
    return providers.lightricks;
  }

  if (normalized.includes("midjourney")) {
    return providers.midjourney;
  }

  if (normalized.includes("vidu")) {
    return providers.vidu;
  }

  if (normalized.includes("pixverse")) {
    return providers.pixverse;
  }

  if (normalized.includes("soul")) {
    return providers.higgsfield;
  }

  if (normalized.includes("kling")) {
    return providers.kuaishou;
  }

  return providers.internal;
}

function inferSceneKind(
  modelUrl: string,
  config?: PlaygroundConfig,
): GenericSceneKind {
  if (modelUrl === "/qwen-image-layered") return "layered-edit";
  if (modelUrl === "/image-eraser") return "image-eraser";
  if (modelUrl === "/image-background-remover") return "image-background-remover";
  if (modelUrl === "/image-upscaler") return "image-upscaler";
  if (modelUrl === "/longcat-avatar") return "avatar-video";
  if (modelUrl === "/video-face-swap") return "video-face-swap";
  if (modelUrl.startsWith("/video-extend/")) return "video-extend";
  if (modelUrl.startsWith("/motion-control/")) return "motion-control";
  if (modelUrl.startsWith("/text-to-image/")) return "text-to-image";
  if (modelUrl.startsWith("/image-to-image/")) return "image-to-image";
  if (modelUrl.startsWith("/text-to-video/")) return "text-to-video";
  if (modelUrl.startsWith("/image-to-video/")) return "image-to-video";

  if (config?.scenarioType) {
    return config.scenarioType;
  }

  return "image-to-image";
}

function getSceneIdFromModelUrl(modelUrl: string) {
  if (!modelUrl.startsWith("/")) {
    return modelUrl;
  }

  const parts = modelUrl.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return modelUrl;
  }

  return `/${parts.slice(0, parts.length - 1).join("/")}`;
}

function getModelKeyFromModelUrl(modelUrl: string) {
  const parts = modelUrl.split("/").filter(Boolean);
  return parts[parts.length - 1] || modelUrl;
}

function getScenePriority(sceneKind: GenericSceneKind) {
  switch (sceneKind) {
    case "text-to-image":
      return 0;
    case "image-to-image":
      return 1;
    case "text-to-video":
      return 2;
    case "image-to-video":
      return 3;
    case "video-extend":
      return 4;
    case "motion-control":
      return 5;
    case "layered-edit":
      return 6;
    case "image-eraser":
      return 7;
    case "image-background-remover":
      return 8;
    case "image-upscaler":
      return 9;
    case "avatar-video":
      return 10;
    case "video-face-swap":
      return 11;
    default:
      return 99;
  }
}

function getDefaultScenePriority(sceneKind: GenericSceneKind) {
  switch (sceneKind) {
    case "text-to-image":
      return 0;
    case "text-to-video":
      return 1;
    default:
      return getScenePriority(sceneKind) + 10;
  }
}

function getPreferredDefaultScene<
  T extends { sceneId: string; modelKey: string; modelUrl?: string },
>(scenes: T[]) {
  if (scenes.length === 0) {
    return null;
  }

  return (
    [...scenes]
      .map((scene, index) => ({
        scene,
        index,
        sceneKind: inferSceneKind(scene.modelUrl || scene.sceneId),
      }))
      .sort((left, right) => {
        const priorityDelta =
          getDefaultScenePriority(left.sceneKind) -
          getDefaultScenePriority(right.sceneKind);

        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return left.index - right.index;
      })[0]?.scene || null
  );
}

function getGeneratedPrompt(config?: PlaygroundConfig) {
  const defaultValue = config?.schema?.prompt?.defaultValue;
  if (typeof defaultValue === "string" && defaultValue.trim()) {
    return defaultValue.trim();
  }

  const placeholder = config?.schema?.prompt?.placeholder;
  if (typeof placeholder === "string" && placeholder.trim()) {
    return placeholder.trim();
  }

  return "";
}

function getLocalizedStaticCopy(locale: string) {
  const flavor = getLocaleFlavor(locale);

  if (flavor === "zh") {
    return {
      eyebrow: "按模型组织的落地页",
      stats: {
        primaryMode: "主打模式",
        sceneCount: "可用工作流",
        creator: "工作台",
        creatorValue: "与 Creator 同步",
      },
      faq: {
        whyQuestion: (model: string) => `为什么 ${model} 值得有单独的模型页？`,
        whyAnswer: (model: string) =>
          `${model} 的页面会把这个模型支持的工作流集中到一个入口里，方便用户先理解模型，再直接进入最合适的 Creator 流程。`,
        workflowsQuestion: (model: string) => `${model} 支持哪些工作流？`,
        workflowsAnswer: (modes: string) =>
          `当前页面会把 ${modes} 等已注册工作流聚合到同一个模型入口里，便于在同一套上下文里切换。`,
        creatorQuestion: "这里的工作台和 Creator 是同一套吗？",
        creatorAnswer:
          "是。模型页直接复用 Creator 工作台和右侧结果面板，所以切换到正式创作时不需要重新适应另一套交互。",
      },
      differentiators: {
        registry: (count: number) =>
          `把同一模型下的 ${count} 个已注册场景聚合到一个入口里，减少用户在工具页之间来回跳转。`,
        creator: "直接复用 Creator 的真实表单与右侧结果面板，避免模型页出现第二套割裂的生成体验。",
        discover: (provider: string) =>
          `围绕 ${provider} 生态里的该模型建立更清晰的理解入口，让 SEO / 导航流量先认识模型，再进入具体工作流。`,
      },
    };
  }

  if (flavor === "zh-hant") {
    return {
      eyebrow: "按模型組織的落地頁",
      stats: {
        primaryMode: "主打模式",
        sceneCount: "可用工作流",
        creator: "工作台",
        creatorValue: "與 Creator 同步",
      },
      faq: {
        whyQuestion: (model: string) => `為什麼 ${model} 值得有單獨的模型頁？`,
        whyAnswer: (model: string) =>
          `${model} 的頁面會把這個模型支援的工作流集中到同一個入口裡，方便使用者先理解模型，再直接進入最合適的 Creator 流程。`,
        workflowsQuestion: (model: string) => `${model} 支援哪些工作流？`,
        workflowsAnswer: (modes: string) =>
          `目前頁面會把 ${modes} 等已註冊工作流聚合到同一個模型入口裡，方便在同一套上下文裡切換。`,
        creatorQuestion: "這裡的工作台和 Creator 是同一套嗎？",
        creatorAnswer:
          "是。模型頁直接複用 Creator 工作台與右側結果面板，所以切換到正式創作時不需要重新適應另一套互動。",
      },
      differentiators: {
        registry: (count: number) =>
          `把同一模型下的 ${count} 個已註冊場景聚合到一個入口裡，減少使用者在工具頁之間來回跳轉。`,
        creator: "直接複用 Creator 的真實表單與右側結果面板，避免模型頁出現第二套割裂的生成體驗。",
        discover: (provider: string) =>
          `圍繞 ${provider} 生態中的這個模型建立更清晰的理解入口，讓 SEO / 導航流量先認識模型，再進入具體工作流。`,
      },
    };
  }

  return {
    eyebrow: "Model-organized landing page",
    stats: {
      primaryMode: "Primary Mode",
      sceneCount: "Workflows",
      creator: "Workbench",
      creatorValue: "Synced with Creator",
    },
    faq: {
      whyQuestion: (model: string) => `Why does ${model} need its own model page?`,
      whyAnswer: (model: string) =>
        `${model} gets a dedicated page so users can understand the model first, then jump straight into the most relevant Creator workflow without hunting across tool pages.`,
      workflowsQuestion: (model: string) => `What workflows does ${model} support?`,
      workflowsAnswer: (modes: string) =>
        `This page groups ${modes} and other registered workflows for the same model into one focused entry point.`,
      creatorQuestion: "Is this the same workbench as Creator?",
      creatorAnswer:
        "Yes. The model page reuses the same Creator workbench and result panel, so the transition from discovery into production stays consistent.",
    },
    differentiators: {
      registry: (count: number) =>
        `Group ${count} registered workflows for the same model into one focused landing page instead of scattering users across tool routes.`,
      creator:
        "Reuse the real Creator form and result panel so the model page does not drift into a second, inconsistent generation experience.",
      discover: (provider: string) =>
        `Give ${provider} model traffic a cleaner model-first entry point before the user commits to a specific workflow.`,
    },
  };
}

function getSceneCopy(
  sceneKind: GenericSceneKind,
  modelName: string,
  locale: string,
) {
  const flavor = getLocaleFlavor(locale);

  if (flavor === "zh") {
    switch (sceneKind) {
      case "text-to-image":
        return {
          modeLabel: "文生图",
          title: `场景 · ${modelName} 文生图`,
          description: `用 ${modelName} 直接从提示词生成图像，适合概念探索、广告主视觉草稿和新风格方向验证。`,
          spotlight: "适合先用一句 prompt 快速起方向，再进入后续精修流程。",
          useCases: ["概念海报和广告草稿", "品牌视觉方向探索", "社媒封面与宣传素材"],
        };
      case "image-to-image":
        return {
          modeLabel: modelName.toLowerCase().includes("pro")
            ? "高级图像编辑"
            : "图像编辑",
          title: `场景 · ${modelName} 图像编辑`,
          description: `把 ${modelName} 用作现有图片的编辑工作面，适合风格迁移、商业精修和基于参考图的连续改图。`,
          spotlight: "适合已有素材但仍需更高完成度、更强控制或更快二次加工的场景。",
          useCases: ["商品图优化与重塑", "角色一致性的连续改图", "品牌素材二次创作"],
        };
      case "text-to-video":
        return {
          modeLabel: "文生视频",
          title: `场景 · ${modelName} 文生视频`,
          description: `通过 ${modelName} 从文本直接生成动态片段，适合把抽象创意快速转成可观看的视频概念。`,
          spotlight: "适合先验证镜头语言、运动节奏和整体叙事氛围。",
          useCases: ["广告概念片与分镜草稿", "短视频视觉提案", "品牌情绪片预演"],
        };
      case "image-to-video":
        return {
          modeLabel: "图生视频",
          title: `场景 · ${modelName} 图生视频`,
          description: `让 ${modelName} 在保留关键画面设定的前提下，为静态图像补充运动、镜头和连续性。`,
          spotlight: "适合基于已通过的关键帧，把静态视觉延展成视频。 ",
          useCases: ["海报动效化", "KV 转短视频", "静态人像转电影感镜头"],
        };
      case "video-extend":
        return {
          modeLabel: "视频延展",
          title: `场景 · ${modelName} 视频延展`,
          description: `在已有视频基础上继续延长镜头，让 ${modelName} 维持同一段叙事的运动语言和画面连续性。`,
          spotlight: "适合已验证片段还需要多一个节拍或更长时长的场景。",
          useCases: ["延长广告镜头", "补齐情绪片结尾", "扩展循环视频时长"],
        };
      case "motion-control":
        return {
          modeLabel: "运动控制",
          title: `场景 · ${modelName} 运动控制`,
          description: `用 ${modelName} 对镜头运动进行更明确的控制，让生成视频更贴近预设镜头语言。`,
          spotlight: "适合对推拉摇移、景别变化和镜头意图有明确要求的场景。",
          useCases: ["镜头运动预演", "产品动态展示", "更可控的视频提案"],
        };
      case "layered-edit":
        return {
          modeLabel: "分层编辑",
          title: `场景 · ${modelName} 分层编辑`,
          description: `通过 ${modelName} 对图像的局部层级进行更细的重绘和编辑，适合复杂元素拆分与定向调整。`,
          spotlight: "适合要改局部而不想整体重做的复杂改图场景。",
          useCases: ["局部重绘与替换", "多区域风格细修", "保留主体的结构化编辑"],
        };
      case "image-eraser":
        return {
          modeLabel: "AI 擦除",
          title: `场景 · ${modelName} 去除干扰元素`,
          description: `让 ${modelName} 快速移除照片中的路人、杂物或多余元素，保持主画面更干净。`,
          spotlight: "适合清理现有素材中的视觉噪音。",
          useCases: ["商品图清洁", "旅游照片修复", "演示素材快速整理"],
        };
      case "image-background-remover":
        return {
          modeLabel: "背景移除",
          title: `场景 · ${modelName} 背景移除`,
          description: `使用 ${modelName} 对主体进行精准抠图，快速把图片切到透明背景或纯色背景。`,
          spotlight: "适合电商、海报拼贴和需要透明素材的流程。",
          useCases: ["电商抠图", "透明 PNG 素材准备", "产品图换底"],
        };
      case "image-upscaler":
        return {
          modeLabel: "图像放大",
          title: `场景 · ${modelName} 图像放大`,
          description: `通过 ${modelName} 提升图片分辨率与细节表现，适合把小图转成更可用的交付资产。`,
          spotlight: "适合需要更高清输出但不想重做生成的场景。",
          useCases: ["广告图放大", "旧素材提清晰度", "社媒图转打印尺寸"],
        };
      case "avatar-video":
        return {
          modeLabel: "头像视频",
          title: `场景 · ${modelName} 头像视频`,
          description: `借助 ${modelName} 把单张头像图转成带有口播或动效的短视频角色素材。`,
          spotlight: "适合虚拟角色介绍、短口播和轻量人格化视频。",
          useCases: ["数字人头像视频", "角色介绍短片", "社媒口播素材"],
        };
      case "video-face-swap":
        return {
          modeLabel: "视频换脸",
          title: `场景 · ${modelName} 视频换脸`,
          description: `使用 ${modelName} 在目标视频中完成更直接的人脸替换流程，适合快速做角色替身和预演素材。`,
          spotlight: "适合需要快速验证角色替换效果的视频场景。",
          useCases: ["角色替身预演", "创意短片试拍", "视觉效果概念验证"],
        };
    }
  }

  if (flavor === "zh-hant") {
    switch (sceneKind) {
      case "text-to-image":
        return {
          modeLabel: "文生圖",
          title: `場景 · ${modelName} 文生圖`,
          description: `用 ${modelName} 直接從提示詞生成圖像，適合概念探索、廣告主視覺草稿和新風格方向驗證。`,
          spotlight: "適合先用一句 prompt 快速起方向，再進入後續精修流程。",
          useCases: ["概念海報與廣告草稿", "品牌視覺方向探索", "社群封面與宣傳素材"],
        };
      case "image-to-image":
        return {
          modeLabel: modelName.toLowerCase().includes("pro")
            ? "高級圖像編輯"
            : "圖像編輯",
          title: `場景 · ${modelName} 圖像編輯`,
          description: `把 ${modelName} 用作現有圖片的編輯工作面，適合風格遷移、商業精修和基於參考圖的連續改圖。`,
          spotlight: "適合已有素材但仍需更高完成度、更強控制或更快二次加工的場景。",
          useCases: ["商品圖優化與重塑", "角色一致性的連續改圖", "品牌素材二次創作"],
        };
      case "text-to-video":
        return {
          modeLabel: "文生影片",
          title: `場景 · ${modelName} 文生影片`,
          description: `透過 ${modelName} 從文本直接生成動態片段，適合把抽象創意快速轉成可觀看的影片概念。`,
          spotlight: "適合先驗證鏡頭語言、運動節奏和整體敘事氛圍。",
          useCases: ["廣告概念片與分鏡草稿", "短影片視覺提案", "品牌情緒片預演"],
        };
      case "image-to-video":
        return {
          modeLabel: "圖生影片",
          title: `場景 · ${modelName} 圖生影片`,
          description: `讓 ${modelName} 在保留關鍵畫面設定的前提下，為靜態圖像補充運動、鏡頭與連續性。`,
          spotlight: "適合基於已通過的關鍵幀，把靜態視覺延展成影片。",
          useCases: ["海報動效化", "KV 轉短影片", "靜態人像轉電影感鏡頭"],
        };
      case "video-extend":
        return {
          modeLabel: "影片延展",
          title: `場景 · ${modelName} 影片延展`,
          description: `在既有影片基礎上繼續延長鏡頭，讓 ${modelName} 維持同一段敘事的運動語言和畫面連續性。`,
          spotlight: "適合已驗證片段還需要多一個節拍或更長時長的場景。",
          useCases: ["延長廣告鏡頭", "補齊情緒片結尾", "擴展循環影片時長"],
        };
      case "motion-control":
        return {
          modeLabel: "運動控制",
          title: `場景 · ${modelName} 運動控制`,
          description: `用 ${modelName} 對鏡頭運動進行更明確的控制，讓生成影片更貼近預設鏡頭語言。`,
          spotlight: "適合對推拉搖移、景別變化和鏡頭意圖有明確要求的場景。",
          useCases: ["鏡頭運動預演", "產品動態展示", "更可控的影片提案"],
        };
      case "layered-edit":
        return {
          modeLabel: "分層編輯",
          title: `場景 · ${modelName} 分層編輯`,
          description: `透過 ${modelName} 對圖像的局部層級進行更細的重繪與編輯，適合複雜元素拆分與定向調整。`,
          spotlight: "適合要改局部而不想整體重做的複雜改圖場景。",
          useCases: ["局部重繪與替換", "多區域風格細修", "保留主體的結構化編輯"],
        };
      case "image-eraser":
        return {
          modeLabel: "AI 擦除",
          title: `場景 · ${modelName} 去除干擾元素`,
          description: `讓 ${modelName} 快速移除照片中的路人、雜物或多餘元素，保持主畫面更乾淨。`,
          spotlight: "適合清理既有素材中的視覺噪音。",
          useCases: ["商品圖清潔", "旅遊照片修復", "示範素材快速整理"],
        };
      case "image-background-remover":
        return {
          modeLabel: "背景移除",
          title: `場景 · ${modelName} 背景移除`,
          description: `使用 ${modelName} 對主體進行精準去背，快速把圖片切到透明背景或純色背景。`,
          spotlight: "適合電商、海報拼貼和需要透明素材的流程。",
          useCases: ["電商去背", "透明 PNG 素材準備", "產品圖換底"],
        };
      case "image-upscaler":
        return {
          modeLabel: "圖像放大",
          title: `場景 · ${modelName} 圖像放大`,
          description: `透過 ${modelName} 提升圖片解析度與細節表現，適合把小圖轉成更可用的交付資產。`,
          spotlight: "適合需要更高清輸出但不想重做生成的場景。",
          useCases: ["廣告圖放大", "舊素材提清晰度", "社群圖轉列印尺寸"],
        };
      case "avatar-video":
        return {
          modeLabel: "頭像影片",
          title: `場景 · ${modelName} 頭像影片`,
          description: `藉助 ${modelName} 把單張頭像圖轉成帶有口播或動效的短影片角色素材。`,
          spotlight: "適合虛擬角色介紹、短口播與輕量人格化影片。",
          useCases: ["數位人頭像影片", "角色介紹短片", "社群口播素材"],
        };
      case "video-face-swap":
        return {
          modeLabel: "影片換臉",
          title: `場景 · ${modelName} 影片換臉`,
          description: `使用 ${modelName} 在目標影片中完成更直接的人臉替換流程，適合快速做角色替身和預演素材。`,
          spotlight: "適合需要快速驗證角色替換效果的影片場景。",
          useCases: ["角色替身預演", "創意短片試拍", "視覺效果概念驗證"],
        };
    }
  }

  switch (sceneKind) {
    case "text-to-image":
      return {
        modeLabel: "Text to Image",
        title: `Scene · ${modelName} text-to-image`,
        description: `Use ${modelName} for prompt-led image generation when you need concept exploration, campaign drafts, or new visual directions from scratch.`,
        spotlight:
          "Best for turning an idea into a first visual direction before moving into heavier refinement.",
        useCases: [
          "Campaign concept frames",
          "Poster and social draft generation",
          "Brand look-and-feel exploration",
        ],
      };
    case "image-to-image":
      return {
        modeLabel: modelName.toLowerCase().includes("pro")
          ? "Image Edit Pro"
          : "Image Edit",
        title: `Scene · ${modelName} image editing`,
        description: `Use ${modelName} to restyle, refine, or control existing images with stronger continuity across references and edits.`,
        spotlight:
          "Best for assets that already exist but still need a cleaner, more directed second pass.",
        useCases: [
          "Product image refinement",
          "Reference-led creative edits",
          "Identity-preserving visual changes",
        ],
      };
    case "text-to-video":
      return {
        modeLabel: "Text to Video",
        title: `Scene · ${modelName} text-to-video`,
        description: `Use ${modelName} to turn prompts into short motion concepts when the idea needs camera movement and a clearer story beat.`,
        spotlight:
          "Best for validating motion language, pacing, and atmosphere before deeper production.",
        useCases: [
          "Motion concept drafts",
          "Short ad-film proposals",
          "Storyboard-to-video exploration",
        ],
      };
    case "image-to-video":
      return {
        modeLabel: "Image to Video",
        title: `Scene · ${modelName} still-to-motion`,
        description: `Use ${modelName} to animate an approved still while preserving the core composition and visual identity.`,
        spotlight:
          "Best for extending a strong key visual into motion without restarting from scratch.",
        useCases: [
          "Poster-to-motion clips",
          "KV animation tests",
          "Portrait motion concepts",
        ],
      };
    case "video-extend":
      return {
        modeLabel: "Video Extend",
        title: `Scene · ${modelName} clip extension`,
        description: `Use ${modelName} to continue an existing clip while preserving tone, movement, and scene continuity.`,
        spotlight:
          "Best for approved clips that need a longer runtime or one more narrative beat.",
        useCases: [
          "Extend approved motion clips",
          "Add a closing beat to short edits",
          "Build longer loops from existing sequences",
        ],
      };
    case "motion-control":
      return {
        modeLabel: "Motion Control",
        title: `Scene · ${modelName} guided camera motion`,
        description: `Use ${modelName} when the shot needs more explicit camera direction and stronger control over how motion plays out.`,
        spotlight:
          "Best for concepts that depend on specific pans, pushes, rotations, or track shots.",
        useCases: [
          "Camera movement previs",
          "Controlled product motion demos",
          "Director-led shot concepts",
        ],
      };
    case "layered-edit":
      return {
        modeLabel: "Layered Edit",
        title: `Scene · ${modelName} layered editing`,
        description: `Use ${modelName} for more directed local edits and layered image changes when a full redraw would be too destructive.`,
        spotlight:
          "Best for complex edits that need local control instead of whole-frame regeneration.",
        useCases: [
          "Local redraws and replacement",
          "Multi-region cleanup",
          "Structured art-direction passes",
        ],
      };
    case "image-eraser":
      return {
        modeLabel: "Image Eraser",
        title: `Scene · ${modelName} cleanup workflow`,
        description: `Use ${modelName} to remove distractions, clutter, and unwanted objects from existing images with minimal setup.`,
        spotlight:
          "Best for fast cleanup work before an asset moves into polish or layout.",
        useCases: [
          "Remove passersby or clutter",
          "Clean marketplace product shots",
          "Fix presentation visuals quickly",
        ],
      };
    case "image-background-remover":
      return {
        modeLabel: "Background Removal",
        title: `Scene · ${modelName} cutout workflow`,
        description: `Use ${modelName} to isolate the subject and prepare clean cutouts for commerce, design, or compositing.`,
        spotlight:
          "Best for workflows that need transparent assets or fast background swaps.",
        useCases: [
          "Commerce cutouts",
          "Transparent PNG prep",
          "Fast background swaps",
        ],
      };
    case "image-upscaler":
      return {
        modeLabel: "Image Upscaler",
        title: `Scene · ${modelName} upscale workflow`,
        description: `Use ${modelName} to raise resolution and recover detail when a small image needs to become more production-ready.`,
        spotlight:
          "Best for polishing a promising output without regenerating the image.",
        useCases: [
          "Upscale ad assets",
          "Rescue smaller source files",
          "Prepare visuals for larger surfaces",
        ],
      };
    case "avatar-video":
      return {
        modeLabel: "Avatar Video",
        title: `Scene · ${modelName} avatar motion`,
        description: `Use ${modelName} to turn a single avatar image into a lightweight talking or animated video asset.`,
        spotlight:
          "Best for lightweight character intros, social explainers, and persona-driven clips.",
        useCases: [
          "Avatar explainers",
          "Digital character intros",
          "Short social talking-head clips",
        ],
      };
    case "video-face-swap":
      return {
        modeLabel: "Video Face Swap",
        title: `Scene · ${modelName} face swap`,
        description: `Use ${modelName} for direct face replacement workflows inside a target video when you need a faster concept pass.`,
        spotlight:
          "Best for quickly testing cast swaps, stand-ins, or VFX-style concepts.",
        useCases: [
          "Cast swap previs",
          "Creative short-form experiments",
          "Face replacement concept tests",
        ],
      };
  }
}

function buildGenericDescription(
  modelName: string,
  modeLabels: string[],
  locale: string,
) {
  const flavor = getLocaleFlavor(locale);
  const modes = modeLabels.join(flavor === "en" ? ", " : "、");

  if (flavor === "zh") {
    return `从 ${modelName} 出发，在一个页面里展开 ${modes} 等工作流，并直接复用 Creator 工作台完成生成、比较和继续创作。`;
  }

  if (flavor === "zh-hant") {
    return `從 ${modelName} 出發，在一個頁面裡展開 ${modes} 等工作流，並直接複用 Creator 工作台完成生成、比較與繼續創作。`;
  }

  return `Explore ${modelName} through ${modes} workflows in one page, then move directly into the shared Creator workbench to generate, compare, and continue production.`;
}

function buildGenericSeoTitle(
  modelName: string,
  modeLabels: string[],
  locale: string,
) {
  const separator = getLocaleFlavor(locale) === "en" ? " + " : " + ";
  const suffix = getLocaleFlavor(locale) === "en" ? "Model Page" : "模型页";
  const pageLabel = `${modelName} ${suffix}`;
  return `${pageLabel} | ${modeLabels.join(separator)} | Barko Bear`;
}

function buildGenericSeoDescription(
  modelName: string,
  modeLabels: string[],
  locale: string,
) {
  const flavor = getLocaleFlavor(locale);
  const modes = modeLabels.join(flavor === "en" ? ", " : "、");

  if (flavor === "zh") {
    return `按模型维度浏览 ${modelName}。支持 ${modes} 等已注册工作流，并直接复用 Creator 工作台。`;
  }

  if (flavor === "zh-hant") {
    return `按模型維度瀏覽 ${modelName}。支援 ${modes} 等已註冊工作流，並直接複用 Creator 工作台。`;
  }

  return `Explore ${modelName} by model, with registered ${modes} workflows and the same Creator workbench experience.`;
}

function buildGenericStats(
  scenes: LandingScenePreset[],
  locale: string,
): LandingStat[] {
  const copy = getLocalizedStaticCopy(locale);
  const primaryMode = scenes[0]?.modeLabel || "";
  const flavor = getLocaleFlavor(locale);

  return [
    {
      label: copy.stats.primaryMode,
      value: primaryMode,
    },
    {
      label: copy.stats.sceneCount,
      value:
        flavor === "en"
          ? `${scenes.length} registered workflows`
          : `${scenes.length} 个可用工作流`,
    },
    {
      label: copy.stats.creator,
      value: copy.stats.creatorValue,
    },
  ];
}

function buildGenericFaqs(
  modelName: string,
  scenes: LandingScenePreset[],
  locale: string,
): LandingFaqItem[] {
  const copy = getLocalizedStaticCopy(locale).faq;
  const modes = scenes.map((scene) => scene.modeLabel).join(", ");

  return [
    {
      question: copy.whyQuestion(modelName),
      answer: copy.whyAnswer(modelName),
    },
    {
      question: copy.workflowsQuestion(modelName),
      answer: copy.workflowsAnswer(modes),
    },
    {
      question: copy.creatorQuestion,
      answer: copy.creatorAnswer,
    },
  ];
}

function buildGenericDifferentiators(
  provider: string,
  scenes: LandingScenePreset[],
  locale: string,
) {
  const copy = getLocalizedStaticCopy(locale).differentiators;

  return [
    copy.registry(scenes.length),
    copy.creator,
    copy.discover(provider),
  ];
}

function buildGenericScene(
  scene: DiscoveredModelScene,
  locale: string,
): LandingScenePreset {
  const copy = getSceneCopy(scene.sceneKind, scene.modelName, locale);

  return {
    sceneId: scene.sceneId,
    modelKey: scene.modelKey,
    modelUrl: scene.url,
    modeLabel: copy.modeLabel,
    title: copy.title,
    description: copy.description,
    spotlight: copy.spotlight,
    useCases: copy.useCases,
    starterPrompt: scene.starterPrompt,
  };
}

const MANUAL_MODEL_LANDING_PRESETS: ModelLandingPreset[] = [
  {
    slug: "nanobana",
    aliases: ["nanobana", "nano-banana", "nanobanana"],
    primarySceneId: "/image-to-image",
    primaryModelKey: "nano-banana",
    scenes: [
      {
        sceneId: "/image-to-image",
        modelKey: "nano-banana",
        modelUrl: "/image-to-image/nano-banana",
        modeLabel: "Image Edit",
        title: "Scene 01 · Guided image editing",
        description:
          "Use Nano Banana as the default editing surface for retouching, style transfer, product refinement, and identity-preserving revisions.",
        spotlight:
          "Best for assets that already exist and need a faster second pass.",
        useCases: [
          "Product image cleanup and premium restyling",
          "UGC frames into ad-ready key visuals",
          "Character or IP-safe styling changes",
        ],
        starterPrompt:
          "Keep the original composition, clean the background, upgrade the lighting to a cinematic studio look, and preserve all brand details.",
      },
      {
        sceneId: "/text-to-image",
        modelKey: "nano-banana",
        modelUrl: "/text-to-image/nano-banana",
        modeLabel: "Text to Image",
        title: "Scene 02 · Prompt-first concept generation",
        description:
          "Branch from the same model into zero-to-one image generation when you need concept drafts, campaign exploration, or new art directions.",
        spotlight:
          "Best for creating new directions before choosing what to edit or upscale later.",
        useCases: [
          "Campaign moodboards and hero concepting",
          "Social graphics and poster drafts",
          "Packaging, signage, and text-heavy compositions",
        ],
        starterPrompt:
          "Create a polished campaign key visual for a summer drink launch, bright afternoon backlight, citrus tones, bold readable headline typography.",
      },
    ],
  },
  {
    slug: "nanobanana-2",
    aliases: [
      "nanobanana-2",
      "nano-banana-2",
      "nanobana-2",
      "nano-banana2",
      "nanobanana2",
    ],
    primarySceneId: "/image-to-image",
    primaryModelKey: "nano-banana-2",
    scenes: [
      {
        sceneId: "/image-to-image",
        modelKey: "nano-banana-2",
        modelUrl: "/image-to-image/nano-banana-2",
        modeLabel: "Image Edit",
        title: "Scene 01 · Multi-image precision editing",
        description:
          "Use Nano Banana 2 for heavier edit workflows that need more references, clearer control over output size, and a more production-oriented setup.",
        spotlight:
          "Best for batches, reference-rich edits, and higher-resolution deliverables.",
        useCases: [
          "Multi-reference product image refinement",
          "Campaign variations with stricter output control",
          "Art direction passes with consistent visual identity",
        ],
        starterPrompt:
          "Use the uploaded references to restyle the product into a premium launch campaign, keep branding intact, add controlled studio reflections, and output a polished commercial visual.",
      },
      {
        sceneId: "/text-to-image",
        modelKey: "nano-banana-2",
        modelUrl: "/text-to-image/nano-banana-2",
        modeLabel: "Text to Image",
        title: "Scene 02 · High-control concept generation",
        description:
          "Move into prompt-led generation when you need stronger camera direction, cleaner text rendering, and outputs that feel closer to production-ready comps.",
        spotlight:
          "Best for premium concepting before handing assets into campaign production.",
        useCases: [
          "Ad concept comps with clearer layout intent",
          "Poster and packaging drafts with readable typography",
          "Brand visuals that need more polished first-pass output",
        ],
        starterPrompt:
          "Create a premium beverage campaign poster with strong camera composition, warm sunset key light, clear headline typography, and a glossy hero-product finish.",
      },
    ],
  },
  {
    slug: "wan-2-7",
    aliases: ["wan-2-7", "wan2-7", "wan2.7", "wan27", "wan-27"],
    primarySceneId: "/text-to-image",
    primaryModelKey: "wan-2-7",
    scenes: [
      {
        sceneId: "/text-to-image",
        modelKey: "wan-2-7",
        modelUrl: "/text-to-image/wan-2-7",
        modeLabel: "Text to Image",
        title: "Scene 01 · Cinematic image generation",
        description:
          "Use Wan 2.7 when you want polished prompt-led visuals with stronger editorial mood, refined character rendering, and more premium first-pass composition.",
        spotlight:
          "Best for beauty editorials, fashion campaigns, and cinematic visual concepts.",
        useCases: [
          "High-end portrait and beauty campaigns",
          "Fashion editorials with stronger atmosphere",
          "Luxury concept frames with richer lighting",
        ],
        starterPrompt:
          "Generate a cinematic beauty editorial portrait in a rain-lit city at blue hour, polished skin detail, premium fashion styling, and refined reflections.",
      },
      {
        sceneId: "/image-to-image",
        modelKey: "wan-2-7",
        modelUrl: "/image-to-image/wan-2-7",
        modeLabel: "Image Edit",
        title: "Scene 02 · Reference-led image editing",
        description:
          "Switch Wan 2.7 into image editing when you need to preserve subject identity, steer composition from references, and push stills toward a more cinematic finish.",
        spotlight:
          "Best for editorial retouching, image restyling, and atmosphere upgrades from existing assets.",
        useCases: [
          "Fashion stills with stronger lighting direction",
          "Beauty edits that preserve subject identity",
          "Reference-based scene and mood refinement",
        ],
        starterPrompt:
          "Keep the original subject and framing, deepen the night-time cinematic mood, improve reflections and skin detail, and elevate the image into a premium editorial still.",
      },
      {
        sceneId: "/image-to-image",
        modelKey: "wan-2-7-image-edit-pro",
        modelUrl: "/image-to-image/wan-2-7-image-edit-pro",
        modeLabel: "Image Edit Pro",
        title: "Scene 03 · High-control image edit",
        description:
          "Use the pro edit path when the job needs tighter visual control, heavier art direction, and more deliberate refinement across multiple reference inputs.",
        spotlight:
          "Best for premium campaign polishing, stricter edit control, and higher-fidelity image refinement.",
        useCases: [
          "Campaign-ready product or portrait refinements",
          "Heavier reference-driven art direction passes",
          "Polished stills for premium launch visuals",
        ],
        starterPrompt:
          "Using the uploaded references, refine the frame into a premium campaign visual with tighter contrast control, richer atmosphere, and a cleaner luxury finish.",
      },
      {
        sceneId: "/text-to-video",
        modelKey: "wan-2-7",
        modelUrl: "/text-to-video/wan-2-7",
        modeLabel: "Text to Video",
        title: "Scene 04 · Motion-first fashion storytelling",
        description:
          "Move into Wan 2.7 video generation when the idea needs camera movement, mood continuity, and a more film-like beauty or fashion narrative.",
        spotlight:
          "Best for short cinematic clips, campaign motion loops, and premium model-focused shots.",
        useCases: [
          "Beauty-film style motion clips",
          "Short fashion campaign sequences",
          "Luxury editorial motion concepts",
        ],
        starterPrompt:
          "Create a short luxury fashion-film clip of a model stepping out of a taxi at night, wet reflections, slow camera push, premium beauty close-up.",
      },
      {
        sceneId: "/image-to-video",
        modelKey: "wan-2-7",
        modelUrl: "/image-to-video/wan-2-7",
        modeLabel: "Image to Video",
        title: "Scene 05 · Still-to-motion continuation",
        description:
          "Turn a strong still frame into motion when you want to preserve the original composition but introduce subtle camera movement, ambient motion, and cinematic continuity.",
        spotlight:
          "Best for animating key visuals, poster frames, and editorial stills into short motion loops.",
        useCases: [
          "Animate poster frames into short promo clips",
          "Bring beauty stills into subtle cinematic motion",
          "Test motion direction from an approved key visual",
        ],
        starterPrompt:
          "Animate the uploaded key visual into a short cinematic clip with subtle wind, reflective light movement, and a slow editorial camera drift.",
      },
      {
        sceneId: "/video-extend",
        modelKey: "wan-2-7",
        modelUrl: "/video-extend/wan-2-7",
        modeLabel: "Video Extend",
        title: "Scene 06 · Sequence extension",
        description:
          "Extend an existing Wan 2.7 clip when the concept is working and you need more runtime, smoother narrative continuation, or an extra beat before the cut.",
        spotlight:
          "Best for extending approved clips, building longer loops, and carrying motion style across a sequence.",
        useCases: [
          "Extend short clips into fuller campaign loops",
          "Add an extra beat to approved fashion-film shots",
          "Preserve motion language across a longer sequence",
        ],
        starterPrompt:
          "Extend the uploaded clip by continuing the same cinematic mood, camera language, and subject motion without breaking continuity.",
      },
    ],
  },
];

const MANUAL_MODEL_URLS = new Set(
  MANUAL_MODEL_LANDING_PRESETS.flatMap((preset) =>
    preset.scenes.map((scene) => scene.modelUrl),
  ),
);
const MANUAL_MODEL_SLUGS = new Set(
  MANUAL_MODEL_LANDING_PRESETS.map((preset) => preset.slug),
);

const dynamicPresetCache = new Map<string, Promise<ModelLandingPreset[]>>();

async function discoverAutomaticModelLandingPresets(locale: string) {
  const entries = Object.keys(REGISTRY_KEY_BY_URL).filter(
    (url) => !MANUAL_MODEL_URLS.has(url),
  );

  const resolved = await Promise.all(
    entries.map(async (url) => {
      const config = await getPlaygroundConfigByUrl(url);
      if (!config) return null;

      const modelName = config.model?.name?.trim();
      if (!modelName || modelName.toLowerCase() === "general") {
        return null;
      }

      return {
        url,
        config,
        modelName,
      };
    }),
  );

  const grouped = new Map<string, DiscoveredModelScene[]>();

  for (const entry of resolved) {
    if (!entry) continue;

    const sceneKind = inferSceneKind(entry.url, entry.config);
    const groupKey = normalizeSlug(entry.modelName);
    const list = grouped.get(groupKey) || [];

    list.push({
      url: entry.url,
      sceneId: getSceneIdFromModelUrl(entry.url),
      modelKey: getModelKeyFromModelUrl(entry.url),
      modelName: entry.modelName,
      scenarioType: entry.config.scenarioType,
      sceneKind,
      starterPrompt: getGeneratedPrompt(entry.config),
    });

    grouped.set(groupKey, list);
  }

  return Array.from(grouped.values())
    .map((scenes) => {
      const sortedScenes = scenes.sort(
        (left, right) =>
          getScenePriority(left.sceneKind) - getScenePriority(right.sceneKind),
      );
      const modelName = sortedScenes[0]?.modelName || "Model";
      const slug = toKebabCase(modelName);
      const landingScenes = sortedScenes.map((scene) =>
        buildGenericScene(scene, locale),
      );
      const defaultScene = getPreferredDefaultScene(landingScenes);

      return {
        slug,
        aliases: Array.from(
          new Set([slug, modelName, ...sortedScenes.map((scene) => scene.modelKey)]),
        ),
        primarySceneId: defaultScene?.sceneId || "/creator",
        primaryModelKey: defaultScene?.modelKey || slug,
        scenes: landingScenes,
      } satisfies ModelLandingPreset;
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

async function getAutomaticModelLandingPresets(locale: string) {
  if (process.env.NODE_ENV !== "production") {
    return discoverAutomaticModelLandingPresets(locale);
  }

  const cacheKey = getLocaleFlavor(locale);
  const cached = dynamicPresetCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const loading = discoverAutomaticModelLandingPresets(locale);
  dynamicPresetCache.set(cacheKey, loading);
  return loading;
}

async function getAllModelLandingPresets(locale: string) {
  const autoPresets = await getAutomaticModelLandingPresets(locale);
  return [...MANUAL_MODEL_LANDING_PRESETS, ...autoPresets];
}

function toGenericPresetWithMeta(
  preset: ModelLandingPreset,
  locale: string,
): ModelLandingPresetWithMeta {
  const title =
    preset.aliases.find((alias) => /[A-Z\s]/.test(alias)) || preset.slug;
  const provider = inferProviderName(
    title,
    preset.scenes[0]?.modelUrl || preset.slug,
    locale,
  );
  const modeLabels = preset.scenes.map((scene) => scene.modeLabel);

  return {
    ...preset,
    title,
    provider,
    eyebrow: getLocalizedStaticCopy(locale).eyebrow,
    description: buildGenericDescription(title, modeLabels, locale),
    seoTitle: buildGenericSeoTitle(title, modeLabels, locale),
    seoDescription: buildGenericSeoDescription(title, modeLabels, locale),
    stats: buildGenericStats(preset.scenes, locale),
    differentiators: buildGenericDifferentiators(provider, preset.scenes, locale),
    faqs: buildGenericFaqs(title, preset.scenes, locale),
    galleryBase: [],
  };
}

async function buildGallery(
  preset: ModelLandingPreset,
  templateCopy: ModelLandingTemplateCopy,
  galleryBase: LandingGalleryItem[] = [],
) {
  const samplePolicy = preset.slug === "gpt-image-2" ? "ad-safe" : "default";
  const sceneSampleGroups = await Promise.all(
    preset.scenes.map(async (scene) => {
      const samples = await getWorkbenchTemplateSamplesForModel(scene.modelUrl);
      return filterWorkbenchTemplateSamplesByPolicy(samples, samplePolicy);
    }),
  );
  const flattenedSamples = sceneSampleGroups.flat();
  const seededGallery = galleryBase.map((item, index) => ({
    ...item,
    imageUrl:
      item.imageUrl || getTemplateSampleImageUrl(flattenedSamples[index]),
  }));
  const fallbackGallery = flattenedSamples
    .slice(seededGallery.length)
    .map((sample, index) => ({
      title: toGalleryFallbackTitle(
        templateCopy,
        sample.prompt,
        seededGallery.length + index,
      ),
      caption: toGalleryFallbackCaption(templateCopy, sample.prompt),
      prompt: String(sample.prompt || ""),
      accentClassName: "from-[#1b2230] via-[#10151d] to-[#0a0d12] text-white",
      imageUrl: getTemplateSampleImageUrl(sample),
    }))
    .filter((item) => Boolean(item.imageUrl));

  return [...seededGallery, ...fallbackGallery].slice(
    0,
    Math.max(4, seededGallery.length),
  );
}

async function hydrateScenes(
  preset: ModelLandingPreset,
  title: string,
  templateCopy: ModelLandingTemplateCopy,
  t: ModelPagesTranslator,
  i18nKey?: string,
) {
  return Promise.all(
    preset.scenes.map(async (scene, index) => {
      const config = await getPlaygroundConfigByUrl(scene.modelUrl);
      const controls = getSchemaControlLabels(config, templateCopy.controls);
      const vendorLogoUrl = getModelVendorLogo({
        url: scene.modelUrl,
        title,
      }).url;
      const sceneI18nKey = i18nKey ? `${i18nKey}.scenes.${index}` : undefined;
      const translatedUseCases = sceneI18nKey
        ? safeRaw<string[]>(t, `${sceneI18nKey}.useCases`)
        : undefined;

      return {
        ...scene,
        modeLabel:
          (sceneI18nKey && safeTranslate(t, `${sceneI18nKey}.modeLabel`)) ||
          scene.modeLabel,
        title:
          (sceneI18nKey && safeTranslate(t, `${sceneI18nKey}.title`)) ||
          scene.title,
        description:
          (sceneI18nKey && safeTranslate(t, `${sceneI18nKey}.description`)) ||
          scene.description,
        spotlight:
          (sceneI18nKey && safeTranslate(t, `${sceneI18nKey}.spotlight`)) ||
          scene.spotlight,
        starterPrompt:
          (sceneI18nKey &&
            safeTranslate(t, `${sceneI18nKey}.starterPrompt`)) ||
          scene.starterPrompt,
        useCases: translatedUseCases || scene.useCases,
        controls,
        vendorLogoUrl,
      };
    }),
  );
}

function applyManualTranslations(
  preset: ModelLandingPreset,
  t: ModelPagesTranslator,
  locale: string,
): ModelLandingPresetWithMeta | null {
  const i18nKey = preset.slug;
  const rawEntry = safeRaw<Record<string, unknown>>(t, i18nKey);

  if (!isPlainRecord(rawEntry)) {
    return null;
  }

  const title =
    typeof rawEntry.title === "string" ? rawEntry.title : undefined;
  const provider =
    typeof rawEntry.provider === "string" ? rawEntry.provider : undefined;
  const eyebrow =
    typeof rawEntry.eyebrow === "string" ? rawEntry.eyebrow : undefined;
  const description =
    typeof rawEntry.description === "string" ? rawEntry.description : undefined;
  const seoTitle =
    typeof rawEntry.seoTitle === "string" ? rawEntry.seoTitle : undefined;
  const seoDescription =
    typeof rawEntry.seoDescription === "string"
      ? rawEntry.seoDescription
      : undefined;

  if (
    !title ||
    !provider ||
    !eyebrow ||
    !description ||
    !seoTitle ||
    !seoDescription
  ) {
    return null;
  }

  return {
    ...preset,
    title,
    provider,
    eyebrow,
    description,
    seoTitle,
    seoDescription,
    stats: Array.isArray(rawEntry.stats) ? (rawEntry.stats as LandingStat[]) : [],
    differentiators: Array.isArray(rawEntry.differentiators)
      ? (rawEntry.differentiators as string[])
      : [],
    faqs: Array.isArray(rawEntry.faqs) ? (rawEntry.faqs as LandingFaqItem[]) : [],
    galleryBase: Array.isArray(rawEntry.gallery)
      ? (rawEntry.gallery as LandingGalleryItem[])
      : [],
  };
}

function mergeTemplateCopy(
  base: ModelLandingTemplateCopy,
  override?: Partial<ModelLandingTemplateCopy>,
): ModelLandingTemplateCopy {
  return {
    ...base,
    ...override,
    controls: {
      ...base.controls,
      ...(override?.controls || {}),
    },
    howItWorksSteps:
      override?.howItWorksSteps && override.howItWorksSteps.length > 0
        ? override.howItWorksSteps
        : base.howItWorksSteps,
  };
}

export async function getModelLandingSlugs(locale = "en") {
  const presets = await getAllModelLandingPresets(locale);
  return presets.map((item) => item.slug);
}

export async function getModelLandingPageData(
  slug: string,
  locale: string,
  t: ModelPagesTranslator,
): Promise<ModelLandingPageData | null> {
  const normalized = normalizeSlug(slug);
  const presets = await getAllModelLandingPresets(locale);
  const preset = presets.find((item) =>
    item.aliases.some((alias) => normalizeSlug(alias) === normalized),
  );

  if (!preset) {
    return null;
  }

  const allowAutoCopyOverride =
    preset.slug === "gpt-image-2" && locale.toLowerCase().startsWith("en");
  const manualTranslated =
    MANUAL_MODEL_SLUGS.has(preset.slug) || allowAutoCopyOverride
      ? applyManualTranslations(preset, t, locale)
      : null;
  const presetWithMeta =
    manualTranslated || toGenericPresetWithMeta(preset, locale);
  const templateModeLabels = preset.scenes.map(
    (scene, index) =>
      (manualTranslated &&
        safeTranslate(t, `${preset.slug}.scenes.${index}.modeLabel`)) ||
      scene.modeLabel,
  );
  const generatedTemplateCopy = getGeneratedModelLandingTemplateCopy({
    locale,
    modelName: presetWithMeta.title,
    provider: presetWithMeta.provider,
    modeLabels: templateModeLabels,
    narrative: getModelLandingNarrativeConfig(preset.slug),
  });
  const manualTemplateCopy = manualTranslated
    ? (
        safeRaw<{ templateCopy?: Partial<ModelLandingTemplateCopy> }>(
          t,
          preset.slug,
        )?.templateCopy
      )
    : undefined;
  const templateCopy = mergeTemplateCopy(
    generatedTemplateCopy,
    manualTemplateCopy,
  );
  const gallery = await buildGallery(
    preset,
    templateCopy,
    presetWithMeta.galleryBase,
  );
  const scenes = await hydrateScenes(
    preset,
    presetWithMeta.title,
    templateCopy,
    t,
    manualTranslated ? preset.slug : undefined,
  );
  const defaultScene = getPreferredDefaultScene(scenes);

  return {
    slug: preset.slug,
    aliases: preset.aliases,
    primarySceneId: defaultScene?.sceneId || preset.primarySceneId,
    primaryModelKey: defaultScene?.modelKey || preset.primaryModelKey,
    title: presetWithMeta.title,
    provider: presetWithMeta.provider,
    eyebrow: presetWithMeta.eyebrow,
    description: presetWithMeta.description,
    seoTitle: presetWithMeta.seoTitle,
    seoDescription: presetWithMeta.seoDescription,
    stats: presetWithMeta.stats,
    differentiators: presetWithMeta.differentiators,
    gallery,
    faqs: presetWithMeta.faqs,
    scenes,
    templateCopy,
  };
}
