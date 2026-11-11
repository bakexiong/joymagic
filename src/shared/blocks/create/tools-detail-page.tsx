"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  X,
  FolderOpen,
  Image as ImageIcon,
  Images,
  Play,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { useRouter } from "@/core/i18n/navigation";
import { useAppContext } from "@/shared/contexts/app";
import { type ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import { ImageEffectsToolForm } from "@/shared/blocks/create/image-effects-tool-form";
import { MangoPanelMessage } from "@/shared/blocks/create/tools-mango-shell";
import {
  ToolEffectLayout,
  ToolGenericStudio,
  type ToolEffectCarouselItem,
} from "@/shared/blocks/create/tool-effect-layout";
import { VariationsToolForm } from "@/shared/blocks/create/variations-tool-form";
import { variationsPlaygroundConfig } from "@/shared/blocks/create/variations-tool-form";
import { VideoEffectsToolForm } from "@/shared/blocks/create/video-effects-tool-form";
import { PromptToMediaForm } from "@/shared/blocks/desktop-playground/components/prompt-to-media-form";
import { ReferenceImageForm } from "@/shared/blocks/desktop-playground/components/reference-image-form";
import { WorkbenchFormSkeleton } from "@/shared/blocks/common/workbench-form-skeleton";
import { WorkbenchMediaPanel } from "@/shared/blocks/desktop-playground/components/workbench-media-panel";
import { getPlaygroundConfigByUrl } from "@/shared/blocks/desktop-playground/playground-config-registry";
import {
  buildWorkbenchSceneTemplateCatalog,
  type WorkbenchTemplateItem,
} from "@/shared/lib/workbench-template-catalog";
import {
  getImageEffectRequiredInputCount,
  getImageEffectItemsSync,
  type ImageEffectItem,
} from "@/shared/lib/image-effect-data";
import {
  AI_BIKINI_SLUG,
  AI_FLYING_SLUG,
  AI_JIGGLE_SLUG,
  AI_KISSING_HUB_SLUG,
  AI_TWERK_SLUG,
  getVideoEffectItemsSync,
  type VideoEffectItem,
} from "@/shared/lib/video-effect-data";
import { AI_BIKINI_OSS_ASSETS } from "@/shared/lib/ai-bikini-landing-assets";
import { AI_FLYING_OSS_ASSETS } from "@/shared/lib/ai-flying-landing-assets";
import type { GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import type { ToolLibraryOverrideDefinition } from "@/shared/lib/fixed-tools-library";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import {
  DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
  DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
} from "@/shared/lib/video-model-defaults";
import { getVideoPosterUrl } from "@/shared/lib/oss-video-thumbnail";
import {
  DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
  DEFAULT_TEXT_TO_IMAGE_MODEL_URL,
} from "@/shared/services/canvas-agent/canvas-agent-scene-router";
import { withOssImageMaxSide, withOssImageResize } from "@/shared/lib/cdn";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import type { NavItem } from "@/shared/types/blocks/common";

type Translator = ReturnType<typeof useTranslations>;

type ToolsDetailPageProps = {
  navItems: NavItem[];
  initialTool: string;
  imageEffectsReplica?: boolean;
  videoEffectsReplica?: boolean;
  initialTemplateItems?: WorkbenchTemplateItem[];
  initialLibraryResolved?: boolean;
  initialIsMobile?: boolean;
  renderMode?: "page" | "studio";
};

type WorkbenchCreationItem = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  modelUrl?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  url: string;
  createdAt: string;
};

type WorkbenchCollectionItem = {
  id: string;
  name: string;
  coverUrl?: string | null;
  assetCount?: number | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type WorkspaceTab = "creations" | "collections" | "library";
type MobileCreationView = "creations" | "uploads";
type PendingGenerationTask = {
  requestId: string;
  scenario: string;
  createdAt: string;
  params: Record<string, any>;
  aspectRatio: string;
  mediaKind: "image" | "video";
  sceneId?: string;
  modelUrl?: string;
  prompt?: string;
};

const LIBRARY_INITIAL_RENDER_COUNT = 6;
const LIBRARY_RENDER_BATCH_SIZE = 6;
const LIBRARY_MAX_CONCURRENT_PREVIEWS = 2;
const DEFAULT_IMAGE_EFFECT_SLUG = getImageEffectItemsSync()[0]?.slug ?? null;
const DEFAULT_VIDEO_EFFECT_SLUG = getVideoEffectItemsSync()[0]?.slug ?? null;

type PreviewLoadTask = {
  id: string;
  run: () => void;
};

let activeLibraryPreviewLoads = 0;
const pendingLibraryPreviewLoads: PreviewLoadTask[] = [];

type EffectMarketingContent = {
  eyebrow: string;
  title: string;
  intro: string;
  featureTitle: string;
  features: Array<{ title: string; description: string }>;
  stepsTitle: string;
  steps: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  mediaType: "image" | "video";
  mediaUrl?: string;
  posterUrl?: string;
};

type ImageEffectsLandingContent = {
  heroTitle: string;
  heroIntro: string;
  heroHighlights: string[];
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{ title: string; description: string }>;
  stepsTitle: string;
  steps: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
};

type ReplicaHeroContent = {
  title: string;
  intro: string;
};

type GenericMangoLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{ title: string; description: string }>;
  stepsTitle: string;
  steps: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
};

function buildGenericHeroIntro({
  sceneTitle,
  category,
  tDetail,
}: {
  sceneTitle: string;
  category: string;
  tDetail: Translator;
}) {
  if (/image to image/i.test(sceneTitle)) {
    return tDetail("genericHero.imageToImageIntro");
  }

  if (/text to image/i.test(sceneTitle)) {
    return tDetail("genericHero.textToImageIntro");
  }

  if (category === "Video") {
    return tDetail("genericHero.videoIntro", { sceneTitle });
  }

  return tDetail("genericHero.imageIntro", { sceneTitle });
}

function buildGenericHeroTitle(sceneTitle: string, tDetail: Translator) {
  if (/image to image/i.test(sceneTitle)) {
    return tDetail("genericHero.imageToImageTitle");
  }

  return sceneTitle;
}

type AiKissingLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{
    title: string;
    description: string;
    cta: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

type AiTwerkLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{
    title: string;
    description: string;
    cta: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

type AiBikiniLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{
    title: string;
    description: string;
    cta: string;
    imageUrl: string;
    videoUrl?: string;
    posterUrl?: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
    imageUrl: string;
    mediaType?: "image" | "video";
    videoUrl?: string;
    posterUrl?: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

type AiJiggleLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{
    title: string;
    description: string;
    cta: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

const AI_JIGGLE_ASSETS = {
  heroImage:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-image-e463fab03e57953e6a078ac00bb6b34a.jpg",
  heroVideo:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/hero-video-640b96e0f9faec4408a04bf1dce0f805.mp4",
  feature1:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/feature-1-d8f77571a39c494830f5a59b2b4ec071.jpg",
  feature2:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/feature-2-b2b4ea10e4d7e4257ffc7dc4e338f340.jpg",
  feature3:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/feature-3-aa09dda747df299378f45e912dbd43b5.jpg",
  step1:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/step-1-93ed132067e21d2b8278a4187614eec3.jpg",
  step2:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/step-2-f58464d47821922a1c04caa71a797a91.jpg",
  step3:
    "https://ocdn.10b.ai/video-effects/product-assets/video-effects/jiggle-up/mango-ai/step-3-36dad2a5c9c422e7243d6e4d628cc91e.jpg",
} as const;

type AiHugLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  features: Array<{
    title: string;
    description: string;
    cta: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

type AiFlyingLandingContent = {
  sectionTitle: string;
  sectionIntro: string;
  heroVideoUrl: string;
  heroPosterUrl: string;
  features: Array<{
    title: string;
    description: string;
    imageUrl: string;
    videoUrl?: string;
    posterUrl?: string;
    cta: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    description: string;
    imageUrl: string;
  }>;
  faqTitle: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaTitle: string;
  ctaButton: string;
};

function buildImageEffectsLandingContent(
  tDetail: Translator,
): ImageEffectsLandingContent {
  return {
    heroTitle: tDetail("imageEffectsLanding.hero.title"),
    heroIntro: tDetail("imageEffectsLanding.hero.intro"),
    heroHighlights: [
      tDetail("imageEffectsLanding.hero.highlights.upload"),
      tDetail("imageEffectsLanding.hero.highlights.style"),
      tDetail("imageEffectsLanding.hero.highlights.apply"),
    ],
    sectionTitle: tDetail("imageEffectsLanding.story.title"),
    sectionIntro: tDetail("imageEffectsLanding.story.intro"),
    features: [
      {
        title: tDetail("imageEffectsLanding.story.features.styles.title"),
        description: tDetail(
          "imageEffectsLanding.story.features.styles.description",
        ),
      },
      {
        title: tDetail("imageEffectsLanding.story.features.lifelike.title"),
        description: tDetail(
          "imageEffectsLanding.story.features.lifelike.description",
        ),
      },
      {
        title: tDetail("imageEffectsLanding.story.features.trend.title"),
        description: tDetail(
          "imageEffectsLanding.story.features.trend.description",
        ),
      },
      {
        title: tDetail("imageEffectsLanding.story.features.share.title"),
        description: tDetail(
          "imageEffectsLanding.story.features.share.description",
        ),
      },
    ],
    stepsTitle: tDetail("imageEffectsLanding.steps.title"),
    steps: [
      {
        title: tDetail("imageEffectsLanding.steps.items.upload.title"),
        description: tDetail(
          "imageEffectsLanding.steps.items.upload.description",
        ),
      },
      {
        title: tDetail("imageEffectsLanding.steps.items.select.title"),
        description: tDetail(
          "imageEffectsLanding.steps.items.select.description",
        ),
      },
      {
        title: tDetail("imageEffectsLanding.steps.items.apply.title"),
        description: tDetail(
          "imageEffectsLanding.steps.items.apply.description",
        ),
      },
    ],
    faqTitle: tDetail("imageEffectsLanding.faq.title"),
    faqs: [
      {
        question: tDetail("imageEffectsLanding.faq.items.types.question"),
        answer: tDetail("imageEffectsLanding.faq.items.types.answer"),
      },
      {
        question: tDetail("imageEffectsLanding.faq.items.skills.question"),
        answer: tDetail("imageEffectsLanding.faq.items.skills.answer"),
      },
      {
        question: tDetail("imageEffectsLanding.faq.items.photos.question"),
        answer: tDetail("imageEffectsLanding.faq.items.photos.answer"),
      },
      {
        question: tDetail("imageEffectsLanding.faq.items.share.question"),
        answer: tDetail("imageEffectsLanding.faq.items.share.answer"),
      },
      {
        question: tDetail("imageEffectsLanding.faq.items.privacy.question"),
        answer: tDetail("imageEffectsLanding.faq.items.privacy.answer"),
      },
    ],
    ctaTitle: tDetail("imageEffectsLanding.cta.title"),
    ctaDescription: tDetail("imageEffectsLanding.cta.description"),
    ctaButton: tDetail("imageEffectsLanding.cta.button"),
  };
}

function buildVideoEffectsHeroContent(tDetail: Translator): ReplicaHeroContent {
  return {
    title: tDetail("videoEffectsLanding.hero.title"),
    intro: tDetail("videoEffectsLanding.hero.intro"),
  };
}

function buildAiKissingHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "免费 AI 接吻视频生成器",
        intro:
          "把静态照片变成更自然的浪漫亲吻场景、法式热吻动画和情侣接吻短视频。用 AI Kissing 快速生成更真实、更适合分享的亲吻视频。",
      }
    : {
        title: "Free AI Kissing Video Generator Online",
        intro:
          "Transform your static photos into lifelike romantic kiss scenes, French kissing animations, and AI-generated couple kiss videos. Easily create realistic and shareable kiss videos using Mango AI's free AI kissing generator.",
      };
}

function buildAiBikiniHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "AI Bikini 视频生成器",
        intro:
          "上传一张清晰人物照，快速生成 720p、5 秒的 AI Bikini 换装视频。保留人物姿态和镜头氛围，把静态照片转换成更适合夏日主题、海滩风和时尚展示的短视频效果。",
      }
    : {
        title: "AI Bikini Video Generator",
        intro:
          "Upload one clear portrait and turn it into a 720p 5-second AI Bikini outfit-change video. Keep the original pose and scene mood while creating a summer-ready, beach-inspired fashion clip from a single still image.",
      };
}

function buildAiBikiniLandingContent(locale: string): AiBikiniLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        sectionTitle: "用 AI Bikini 把静态照片变成夏日换装短片",
        sectionIntro:
          "从一张清晰人物照出发，快速生成更有海边氛围、度假感和时尚展示感的 bikini 换装视频。页面结构参考 Mango，但文案与交互说明已经按当前项目能力重写，并且实际生成走的是你们现有的 Wan 2.7 image-to-video 工作流。",
        features: [
          {
            title: "更轻松的虚拟 bikini 试穿体验",
            description:
              "上传单张人物照片后，系统会自动围绕夏日换装主题生成动态结果。它适合用来快速验证 beachwear 方向、活动创意或更轻量的社媒视觉草稿。",
            cta: "立即试试 AI Bikini",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureTryOn,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureTryOnVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureTryOn,
          },
          {
            title: "更适合时尚展示的人像结果",
            description:
              "这一页会优先保留人物姿态、构图和镜头气质，让结果看起来像在原始照片基础上完成了一次更自然的泳装风格演绎，而不是完全脱离原图的重做。",
            cta: "立即试试 AI Bikini",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypes,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypesVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypes,
          },
          {
            title: "固定参数，快速出片",
            description:
              "你不需要再额外配置分辨率、时长和复杂提示词。工作台会直接使用内置 prompt、720p 和 5 秒输出，更适合快速做样片、跑版本和对比输入效果。",
            cta: "立即试试 AI Bikini",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureEffortless,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureEffortlessVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureEffortless,
          },
          {
            title: "从单图到动态泳装内容",
            description:
              "相比静态换装图，这个流程更适合做短视频展示。系统会基于单张照片生成一个节奏简洁的动态版本，让画面更适合分享、投放或继续二次剪辑。",
            cta: "立即试试 AI Bikini",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureSwimwear,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureSwimwearVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.stepShare,
          },
        ],
        stepsTitle: "如何使用 AI Bikini 视频生成器",
        steps: [
          {
            title: "1. 上传一张清晰的人物照片",
            description:
              "更推荐使用单人半身或全身图，人物边缘清楚、光线正常、姿态稳定的照片通常会得到更自然的换装和动画结果。",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepUpload,
          },
          {
            title: "2. 一键生成夏日换装视频",
            description:
              "提交后，系统会调用 Wan 2.7 image-to-video，并使用内置的 bikini 换装提示词，输出固定 720p、5 秒的视频结果。",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepGenerate,
          },
          {
            title: "3. 下载或直接继续迭代",
            description:
              "生成完成后可以直接预览和下载，也可以换一张图继续测试不同人物、不同场景下的 summer look 版本。",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepShare,
            mediaType: "video",
            videoUrl: AI_BIKINI_OSS_ASSETS.stepShareVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.stepShare,
          },
        ],
        faqTitle: "AI Bikini 常见问题",
        faqs: [
          {
            question: "AI Bikini 适合做什么内容？",
            answer:
              "它更适合做轻量换装展示、夏日主题短视频草稿、视觉提案素材，或用于测试不同人物照在泳装风格下的动态表现。",
          },
          {
            question: "这个页面背后实际用的是哪套能力？",
            answer:
              "虽然页面风格参考了 Mango 的展示方式，但实际生成使用的是当前项目里的 Wan 2.7 image-to-video，并固定了 720p 与 5 秒输出。",
          },
          {
            question: "我还需要自己写 prompt 吗？",
            answer:
              "不用。这个页面已经把换装方向预置好了，上传图片后就可以直接生成，更适合你说的统一工作台体验。",
          },
          {
            question: "哪类图片更容易生成自然结果？",
            answer:
              "单人、成年人、服装轮廓清晰、背景不过于复杂的照片通常更稳。姿态自然、主体完整的照片也更容易保持人物比例和画面连贯性。",
          },
        ],
        ctaTitle: "开始制作你的 AI Bikini 换装视频",
        ctaButton: "现在生成",
      }
    : {
        sectionTitle: "Turn One Portrait into a Summer Outfit-Change Clip",
        sectionIntro:
          "Start with one clear photo and generate a short bikini-style motion clip with a brighter vacation mood, beachwear direction, and more shareable visual energy. The page structure follows the Mango reference, but the copy is rewritten for this project and the generation itself runs on your existing Wan 2.7 image-to-video workflow.",
        features: [
          {
            title: "A lighter way to preview bikini-style looks",
            description:
              "Upload a single portrait and quickly test a summer outfit-change direction without building a complex workflow. It works well for concept drafts, seasonal content ideas, and fast social-first visuals.",
            cta: "Try AI Bikini Now",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureTryOn,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureTryOnVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureTryOn,
          },
          {
            title: "Results that stay closer to the original portrait",
            description:
              "This setup is designed to preserve the subject pose, framing, and overall mood, so the final motion clip still feels grounded in the source image instead of looking like a full visual replacement.",
            cta: "Try AI Bikini Now",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypes,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypesVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureBodyTypes,
          },
          {
            title: "Preset settings for faster output",
            description:
              "You do not need to tune extra parameters here. The page uses a built-in clothing-change prompt together with a fixed 720p and 5-second output so you can iterate faster.",
            cta: "Try AI Bikini Now",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureEffortless,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureEffortlessVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.featureEffortless,
          },
          {
            title: "Move from a still image to a short swimwear clip",
            description:
              "Compared with a static edit, this workflow gives you a compact motion result that is easier to preview, share, and reuse in short-form content or a wider creative pipeline.",
            cta: "Try AI Bikini Now",
            imageUrl: AI_BIKINI_OSS_ASSETS.featureSwimwear,
            videoUrl: AI_BIKINI_OSS_ASSETS.featureSwimwearVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.stepShare,
          },
        ],
        stepsTitle: "How to Use Our AI Bikini Video Generator",
        steps: [
          {
            title: "1. Upload a clear portrait",
            description:
              "Single-subject half-body or full-body images with stable lighting and visible outfit edges usually lead to cleaner clothing-change and motion results.",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepUpload,
          },
          {
            title: "2. Generate the summer outfit video",
            description:
              "After submission, the page calls Wan 2.7 image-to-video with a built-in bikini outfit prompt and returns a fixed 720p, 5-second clip.",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepGenerate,
          },
          {
            title: "3. Download or keep iterating",
            description:
              "Preview the result, download it immediately, or switch to another input photo and keep testing different subjects, scenes, and vacation-style looks.",
            imageUrl: AI_BIKINI_OSS_ASSETS.stepShare,
            mediaType: "video",
            videoUrl: AI_BIKINI_OSS_ASSETS.stepShareVideo,
            posterUrl: AI_BIKINI_OSS_ASSETS.stepShare,
          },
        ],
        faqTitle: "FAQs About AI Bikini",
        faqs: [
          {
            question: "What is this AI Bikini page best for?",
            answer:
              "It works best for lightweight outfit-change previews, summer-themed motion concepts, and short video drafts built from a single portrait.",
          },
          {
            question: "What model actually powers this page?",
            answer:
              "The visual style references Mango, but the real generation flow here uses the existing Wan 2.7 image-to-video setup in this project with fixed 720p and 5-second output.",
          },
          {
            question: "Do I need to write my own prompt?",
            answer:
              "No. The outfit-change direction is already preset, so you can upload a photo and generate directly without configuring extra prompt text.",
          },
          {
            question: "What kind of image works best?",
            answer:
              "Adult single-person photos with visible outfit boundaries, balanced lighting, and a stable pose usually produce the cleanest and most natural-looking output.",
          },
        ],
        ctaTitle: "Start Your AI Bikini Outfit-Change Video",
        ctaButton: "Generate Now",
      };
}

function buildAiHugHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "免费 AI 拥抱视频生成器",
        intro:
          "上传一张包含两个人的照片，把静态画面变成自然靠近、轻柔相拥的 AI 拥抱视频。适合情侣、朋友、亲子和纪念场景，快速生成更有情绪的短视频结果。",
      }
    : {
        title: "Free AI Hug Video Generator Online",
        intro:
          "Turn one photo of two people into a warm AI hug video with natural approach, gentle body motion, and an emotional result ready to share.",
      };
}

function buildAiKissingLandingContent(locale: string): AiKissingLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        sectionTitle: "用 AI Kissing 让浪漫瞬间更有真实感",
        sectionIntro:
          "把珍藏照片变成更有情绪的亲吻时刻。AI Kissing 会捕捉细微表情、头部倾斜和轻柔动作，把温柔亲吻、法式热吻或情侣互动转成更自然的接吻视频。",
        features: [
          {
            title: "更自然的接吻动画",
            description:
              "我们的 AI 会让每一次亲吻更像真实互动。轻微微笑、柔和头部动作和更连贯的节奏，会一起构成更自然、更有情绪的接吻视频。",
            cta: "立即生成 AI 接吻视频",
          },
          {
            title: "多种亲吻风格可选",
            description:
              "你可以选择更适合当前氛围的亲吻方式。无论是温柔轻吻、法式热吻，还是其他更有戏剧感的 kiss style，都可以在同一个页面里快速切换。",
            cta: "立即生成 AI 接吻视频",
          },
          {
            title: "更灵活的亲吻组合",
            description:
              "不用只局限于情侣合照。你可以尝试双人肖像、角色组合，甚至更有创意的互动设定，做出更适合分享的 AI 接吻视频。",
            cta: "立即生成 AI 接吻视频",
          },
          {
            title: "更重视隐私的生成体验",
            description:
              "上传的照片和生成的视频仅用于当前 AI 接吻生成流程，不会被公开展示，让你在制作浪漫内容时更安心。",
            cta: "立即生成 AI 接吻视频",
          },
        ],
        stepsTitle: "如何使用 AI 接吻视频生成器？",
        steps: [
          {
            title: "1. 选择亲吻风格",
            description:
              "先选择你想要的亲吻类型，例如温柔亲吻、法式热吻，或其他 AI Kissing 风格。每一种风格都会带来不同的动作和情绪表达。",
          },
          {
            title: "2. 上传你的照片",
            description:
              "根据当前风格要求上传图片。尽量使用人物清晰、构图稳定的照片，这样生成出的亲吻动作会更自然。",
          },
          {
            title: "3. 生成并下载接吻视频",
            description:
              "点击生成后，AI 会自动补全表情、头部角度和互动节奏。完成后你可以直接预览、下载，或者继续切换风格比较结果。",
          },
        ],
        faqTitle: "AI Kissing 常见问题",
        faqs: [
          {
            question: "什么是 AI Kissing？",
            answer:
              "AI Kissing 会把静态照片转成接吻动画，通过模拟人物之间的表情、头部动作和亲吻节奏，生成更自然的浪漫视频片段。",
          },
          {
            question: "AI 接吻视频生成器是免费的吗？",
            answer:
              "你可以直接在当前页面体验 AI Kissing，具体是否消耗积分会以工作区里展示的 credits 为准。",
          },
          {
            question: "AI 生成的接吻视频是私密的吗？",
            answer:
              "是的。上传图片和生成视频只用于当前 AI 接吻生成流程，不会默认公开展示。",
          },
          {
            question: "我可以把 AI 接吻视频分享到社交媒体吗？",
            answer:
              "可以。生成完成后你可以下载视频，并按自己的需要分享到社交平台、聊天工具，或仅自己保存。",
          },
          {
            question: "使用 AI Kissing 有什么限制吗？",
            answer:
              "建议使用清晰、适合动画处理的照片，并确保你对上传内容拥有使用权限。更好的素材通常会带来更自然、更稳定的接吻动画结果。",
          },
        ],
        ctaTitle: "把你的照片变成更自然的 AI 接吻视频",
        ctaButton: "立即开始生成",
      }
    : {
        sectionTitle: "Elevate Your Romance with AI Kissing",
        sectionIntro:
          "Turn your cherished photos into moments of affection with AI Kissing. It captures subtle expressions, head tilt, and gentle movement to create a lifelike kiss scene, whether you want a tender kiss, a passionate French kiss, or another romantic variation.",
        features: [
          {
            title: "AI Kissing with lifelike animations",
            description:
              "Every generated kiss feels more natural with gentle smiles, soft head tilts, and motion that better matches the emotional tone of the scene.",
            cta: "Create AI Kissing Video Now",
          },
          {
            title: "Diverse kissing styles",
            description:
              "Choose the type of kiss that fits your idea best, from soft romantic pecks to more expressive French-kiss motion and other stylized kiss directions.",
            cta: "Create AI Kissing Video Now",
          },
          {
            title: "Flexible kissing pair options",
            description:
              "Use couples, portraits, fictional characters, or other playful pairings to explore different romantic video ideas inside one AI Kissing workspace.",
            cta: "Create AI Kissing Video Now",
          },
          {
            title: "Privacy-first AI kiss generator",
            description:
              "Your uploaded photos and generated videos stay private and are used only for creating your AI kissing video experience.",
            cta: "Create AI Kissing Video Now",
          },
        ],
        stepsTitle: "How to Use Our AI Kissing Video Generator?",
        steps: [
          {
            title: "1. Select a Kiss Style",
            description:
              "Choose the kiss type you want first, such as a gentle romantic kiss, a French kiss, or another AI Kissing style with a different mood.",
          },
          {
            title: "2. Upload Your Photos",
            description:
              "Upload the required photo input for the selected style. Clear, well-framed photos usually produce the most natural-looking kissing motion.",
          },
          {
            title: "3. Generate and Download Your Kissing Video",
            description:
              "Start generation and let AI animate the expressions, lip motion, and interaction. Once the result is ready, preview it, download it, or compare another kiss style.",
          },
        ],
        faqTitle: "FAQs About AI Kissing Video Generator",
        faqs: [
          {
            question: "What is AI kissing?",
            answer:
              "AI kissing turns still photos into animated kissing scenes by simulating facial expression changes, head movement, and romantic interaction between the subjects.",
          },
          {
            question: "Is the AI kissing video generator free?",
            answer:
              "You can try AI Kissing directly from this page. Any credit requirement is shown in the workspace before you generate.",
          },
          {
            question: "Are AI-generated kissing videos private?",
            answer:
              "Yes. Uploaded images and generated videos are kept private and are only used for the current AI kissing generation flow.",
          },
          {
            question: "Can I share my AI kissing videos on social media?",
            answer:
              "Yes. After generation you can download the video and share it on social platforms, in chats, or keep it private for yourself.",
          },
          {
            question:
              "Are there any restrictions when using the AI kissing generator?",
            answer:
              "Use clear images that you have permission to upload. Better source photos usually lead to more natural and stable kissing animations.",
          },
        ],
        ctaTitle:
          "Turn Your Photos into Lifelike Kissing Videos with AI Kissing",
        ctaButton: "Create Kissing Videos Now",
      };
}

function buildAiTwerkHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "免费 AI Twerk 视频生成器",
        intro:
          "上传一张单人全身照，把静态照片快速变成更有节奏感的 AI 扭胯舞蹈视频。适合做短视频内容、社媒分享和趣味舞蹈效果。",
      }
    : {
        title: "Free AI Twerk Video Generator Online",
        intro:
          "Turn a single full-body photo into an energetic AI twerk dance video with playful motion, rhythm, and a short-form result ready to share.",
      };
}

function buildAiJiggleHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "免费 AI 抖动视频生成器",
        intro:
          "上传一张单人照片，把静态画面快速变成更有弹性节奏和上半身动态的 AI 抖动短视频。适合做趣味演绎、角色整活和更抓眼球的社媒内容。",
      }
    : {
        title: "Free AI Jiggle Video Generator Online",
        intro:
          "Upload one photo and turn it into a playful AI jiggle clip with lively upper-body bounce, expressive motion, and a short-form result ready to share.",
      };
}

function buildAiFlyingHeroContent(locale: string): ReplicaHeroContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        title: "免费在线把照片变成有趣的飞行短片",
        intro:
          "用 AI 飞行特效让静态照片动起来。把人物变成腾空、滑翔、穿梭空中的动态画面，快速生成吸睛的飞行视频和轻盈自然的滑翔效果。",
      }
    : {
        title: "Turn Photos into Fun Flying Clips Online Free",
        intro:
          "Bring your photos to life with AI flying effects. Transform still images into lively scenes where characters soar through the air. Mango AI uses advanced technology to create smooth, natural motion for eye-catching flying videos and gentle paragliding effects.",
      };
}

function buildAiJiggleLandingContent(locale: string): AiJiggleLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        sectionTitle: "把任意照片变成更抓眼球的 AI 抖动短片",
        sectionIntro:
          "AI Jiggle 会围绕人物上半身节奏、轻微弹动和整体画面表现补全更有存在感的动态，让静态照片快速变成更吸睛的趣味短视频。无论是角色展示、梗图二创还是娱乐向内容，都能更快做出更容易让人停留的结果。",
        features: [
          {
            title: "把静态照片做成更有表现力的抖动短片",
            description:
              "系统会围绕人物上半身补全更有节奏感的动态，让静态照片迅速变成更有表演感的 AI 抖动视频，而不是只有简单的图片晃动。",
            cta: "立即生成 AI 抖动视频",
          },
          {
            title: "让画面拥有更自然的弹动和上半身节奏",
            description:
              "AI 会尽量保持主体清晰度和整体构图，同时加入更自然的轻晃、弹动和身体节奏，让结果看起来更顺眼、更有动感。",
            cta: "立即生成 AI 抖动视频",
          },
          {
            title: "上传照片后几步内就能看到结果",
            description:
              "不需要时间轴、关键帧或复杂剪辑。只要上传一张清晰的单人照片，点击生成后就能快速看到动态成片，适合快速试图和反复换图。",
            cta: "立即生成 AI 抖动视频",
          },
          {
            title: "给各种娱乐向内容加入 AI 抖动效果",
            description:
              "无论是整活短片、角色趣味演绎、社媒玩梗，还是想把普通照片变得更有记忆点，AI Jiggle 都能快速补上视觉冲击力。",
            cta: "立即生成 AI 抖动视频",
          },
        ],
        stepsTitle: "如何使用 AI 抖动视频生成器？",
        steps: [
          {
            title: "1. 上传一张清晰的单人照片",
            description:
              "上传一张清晰、光线稳定的单人照片。半身照或全身照都可以，但建议主体完整、边缘清楚，这样更容易得到自然的 AI 抖动效果。",
          },
          {
            title: "2. 生成 AI 抖动效果",
            description:
              "点击“生成抖动视频”后，系统会自动围绕人物上半身补全弹动与节奏感动作，让静态照片迅速变成更有表现力的短视频。",
          },
          {
            title: "3. 预览、下载并继续分享",
            description:
              "结果完成后可以直接下载到本地，或继续分享到社交平台。如果你想比较不同人物或不同构图，也可以继续换图重新生成。",
          },
        ],
        faqTitle: "AI 抖动视频生成器常见问题",
        faqs: [
          {
            question: "什么是 AI 抖动视频生成器？",
            answer:
              "它是一种把单张照片转换成短视频的 AI 工具，会自动为人物补充更有弹性和节奏感的上半身动态，让静态画面变得更有趣、更容易吸引注意力。",
          },
          {
            question: "哪些照片更适合生成 AI 抖动效果？",
            answer:
              "单人照片通常效果最好。建议使用主体清晰、光线稳定的半身照或全身照，并尽量避免人物手里拿着过多道具，这样动作补全通常更自然。",
          },
          {
            question: "上传图片是安全的吗？",
            answer:
              "是的。页面里的上传仅用于当前生成流程。只要你使用自己有权限处理的图片素材，就可以更安心地完成生成和下载。",
          },
          {
            question: "上传照片时有什么限制？",
            answer:
              "请不要上传未成年人、名人，或未经当事人同意的图片。只使用你有权处理和分享的素材，避免涉及隐私、肖像权或不当内容。",
          },
          {
            question: "生成后的视频可以下载和分享吗？",
            answer:
              "可以。结果生成完成后你可以直接下载视频到本地，也可以继续把它分享到社交平台或聊天场景里。",
          },
        ],
        ctaTitle: "把一张照片变成更有动感的 AI 抖动短视频",
        ctaButton: "立即开始生成",
      }
    : {
        sectionTitle: "Turn Any Photo into a Hot, Playful AI Jiggle Clip",
        sectionIntro:
          "AI Jiggle adds lively upper-body bounce, playful motion, and stronger on-screen energy to a single portrait so a still photo feels more expressive, more entertaining, and easier to share as attention-grabbing short-form content.",
        features: [
          {
            title: "Animate photos into playful AI jiggle clips",
            description:
              "Turn a static portrait into a playful short video with lively bounce and visible upper-body motion, so the result feels more animated than a simple image shake.",
            cta: "Create AI Jiggle Video Now",
          },
          {
            title: "Add more natural bounce and upper-body rhythm",
            description:
              "The generator focuses on smoother upper-body sway and elastic movement while keeping the subject readable, helping the final clip feel lively without looking overly stiff.",
            cta: "Create AI Jiggle Video Now",
          },
          {
            title: "Upload, click, and get the motion fast",
            description:
              "Start from one clear image of a single person and let the tool handle the motion pass. It is built for quick experiments, fast retries, and easy side-by-side comparison.",
            cta: "Create AI Jiggle Video Now",
          },
          {
            title: "Create jiggle effects for fun social moments",
            description:
              "Use AI Jiggle for entertaining edits, character-driven content, meme ideas, and short-form clips that need stronger visual movement to stop the scroll.",
            cta: "Create AI Jiggle Video Now",
          },
        ],
        stepsTitle: "How to Use Our AI Jiggle Video Generator?",
        steps: [
          {
            title: "1. Upload a Clear Photo",
            description:
              "Upload one clear, well-lit photo of a single person. Half-body or full-body shots usually produce the most natural-looking AI jiggle motion.",
          },
          {
            title: "2. Generate the AI Jiggle Effect",
            description:
              "Click the generate button and let AI animate playful upper-body bounce and visible motion, turning the original image into a more expressive short clip.",
          },
          {
            title: "3. Preview, Download, and Share",
            description:
              "Once the result is ready, download the generated video to your device or share it online. You can also try another image to compare different motion outcomes.",
          },
        ],
        faqTitle: "FAQs About AI Jiggle Video Generator",
        faqs: [
          {
            question: "What is an AI jiggle video generator?",
            answer:
              "It is an image-to-video tool that adds lively upper-body bounce and playful motion to a still portrait, turning one static photo into a short animated clip.",
          },
          {
            question: "What kind of photo works best?",
            answer:
              "Photos of a single person usually work best. Half-body or full-body shots with good lighting and clear subject visibility tend to produce the most natural and expressive result.",
          },
          {
            question: "Can I safely upload my images?",
            answer:
              "Yes. The upload is used for the current generation flow. You should still make sure you have the right to use the image before uploading it.",
          },
          {
            question: "Are there any restrictions on the photos I can upload?",
            answer:
              "Yes. Do not upload images of minors, celebrities, or anyone without consent. Only use photos you have permission to use and share.",
          },
          {
            question: "Can I download and share the generated video?",
            answer:
              "Yes. After generation, you can preview the result, download it to your device, and use it for social posts, chats, or other fun creative content.",
          },
        ],
        ctaTitle: "Turn One Photo into a Playful AI Jiggle Video",
        ctaButton: "Create Jiggle Videos Now",
      };
}

function buildAiFlyingLandingContent(locale: string): AiFlyingLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");
  const assets = AI_FLYING_OSS_ASSETS;

  return isChinese
    ? {
        sectionTitle: "用 Mango AI Flying 视频生成器制作惊艳飞行特效",
        sectionIntro:
          "让照片中的人物看起来像漂浮、滑翔或在空中翱翔。AI Flying 会识别照片中的人物，把主体从背景中分离出来，并补上更自然的飞行动作。只需一张静态照片，就能生成更真实的飞行动画视频。",
        heroVideoUrl: assets.heroVideo,
        heroPosterUrl: assets.heroImage,
        features: [
          {
            title: "把任意照片变成飞行场景",
            description:
              "上传任意高清照片，AI 就会让画面中的人物离地飞起。系统会聚焦主体，并加入平滑、轻盈的漂浮动作。",
            imageUrl: assets.featureScene,
            videoUrl: assets.featureSceneVideo,
            posterUrl: assets.featureScene,
            cta: "立即生成 AI 飞行视频",
          },
          {
            title: "体验更真实的飞行动作",
            description:
              "看着静态照片真正动起来。AI 会补充自然的移动方向、身体流动感和空中滑翔细节，让从起飞到悬空的每一步都更顺滑、更真实。",
            imageUrl: assets.featureMotion,
            videoUrl: assets.featureMotionVideo,
            posterUrl: assets.featureMotion,
            cta: "立即生成 AI 飞行视频",
          },
          {
            title: "几分钟内完成并下载",
            description:
              "上传照片后，平台会在短时间内生成专业质感的飞行动画视频，完成后即可下载并分享至任意平台。",
            imageUrl: assets.featureEffect,
            videoUrl: assets.featureEffectVideo,
            posterUrl: assets.featureEffect,
            cta: "立即生成 AI 飞行视频",
          },
          {
            title: "让飞行动作进入每个创意项目",
            description:
              "飞行特效适合做社媒视频、品牌视觉或故事化短片。Mango AI 能为任意照片加入动作、空间感和一点魔法感。",
            imageUrl: assets.featureCreative,
            videoUrl: assets.featureCreativeVideo,
            posterUrl: assets.featureCreative,
            cta: "立即生成 AI 飞行视频",
          },
        ],
        stepsTitle: "如何用 Mango AI 生成 AI 飞行视频",
        steps: [
          {
            title: "1. 上传你的照片",
            description:
              "上传一张清晰的单人全身照到 AI 飞行生成器。Mango AI 会自动检测人物，并为飞行动画做好准备。",
            imageUrl: assets.stepUpload,
          },
          {
            title: "2. 生成飞行效果",
            description:
              "点击“生成飞行视频”，系统就会开始处理你的照片。只需几秒，静态图片就会被转换成顺滑的飞行动画，人物会像在空中漂浮和飞翔一样自然。",
            imageUrl: assets.stepGenerate,
          },
          {
            title: "3. 下载并分享",
            description:
              "把生成好的 AI 飞行视频下载到本地，然后轻松分享到社交媒体、发送给朋友，或用于其他创意项目。",
            imageUrl: assets.stepDownload,
          },
        ],
        faqTitle: "AI 飞行视频生成器常见问题",
        faqs: [
          {
            question: "什么是 AI 飞行特效？",
            answer:
              "它是一种通过先进 AI 技术把静态照片转换成飞行视频的动画效果，为画面加入动作、景深和更有电影感的氛围，让照片中的人物看起来像真正腾空飞起。",
          },
          {
            question: "什么样的图片更适合做飞行效果？",
            answer:
              "建议使用光线充足、背景尽量干净的单人全身照。这样更有利于 AI 分离主体，并生成更顺滑自然的飞行动作。",
          },
          {
            question: "生成的 AI 飞行视频可以商用吗？",
            answer:
              "可以。只要遵守平台规则，你可以将生成的视频用于营销、社交媒体或品牌内容。",
          },
          {
            question: "Mango AI 的 AI 飞行视频生成器可以免费试用吗？",
            answer:
              "可以试用。当前工具通常提供带有限额的免费体验；如果需要更高频率或更高产出，再根据工作区中的积分与套餐信息继续使用。",
          },
          {
            question: "生成一个飞行视频通常要多久？",
            answer:
              "大多数图片会在几秒到几分钟内完成转换，具体时间取决于图片尺寸和当时的服务负载。",
          },
        ],
        ctaTitle: "一键把照片变成带魔法感的飞行场景",
        ctaButton: "立即开始制作飞行视频",
      }
    : {
        sectionTitle:
          "Create Amazing AI Flight Effects with Mango AI Flying Video Creator",
        sectionIntro:
          "Make the subject in a photo appear to float, glide, or soar through the sky. Our AI flying generator recognizes the person within the photo, crops it from the background, and adds natural movement that resembles real flight. Transform still photos into realistic flying animations with Mango AI.",
        heroVideoUrl: assets.heroVideo,
        heroPosterUrl: assets.heroImage,
        features: [
          {
            title: "Convert Any Picture into a Flying Scene",
            description:
              "Convert any photo into a flying video. Just upload a high-resolution picture and the AI will elevate your subject off the ground. Mango AI converges on the person and applies smooth, floating movement.",
            imageUrl: assets.featureScene,
            videoUrl: assets.featureSceneVideo,
            posterUrl: assets.featureScene,
            cta: "Create AI Flying Video Now",
          },
          {
            title: "Enjoy Realistic Flying Motion",
            description:
              "Watch your image come alive as the AI adds natural movement, direction, and flow. From the lift of the body to the glide in the air, every detail is crafted to look fluid and realistic.",
            imageUrl: assets.featureMotion,
            videoUrl: assets.featureMotionVideo,
            posterUrl: assets.featureMotion,
            cta: "Create AI Flying Video Now",
          },
          {
            title: "Create and Download in Minutes",
            description:
              "Create your AI flying video effortlessly. After you've uploaded your image, the platform will create a professional-quality animation video in just minutes, ready to share on any platform.",
            imageUrl: assets.featureEffect,
            videoUrl: assets.featureEffectVideo,
            posterUrl: assets.featureEffect,
            cta: "Create AI Flying Video Now",
          },
          {
            title: "Make Flying Motion in Every Creative Project",
            description:
              "The great AI flying effect can be used for different types of projects, such as videos on social media and visuals for the brand, or fun videos that tell your story. Mango AI puts motion and depth, and a little magic on any photo.",
            imageUrl: assets.featureCreative,
            videoUrl: assets.featureCreativeVideo,
            posterUrl: assets.featureCreative,
            cta: "Create AI Flying Video Now",
          },
        ],
        stepsTitle: "How to Generate an AI Flying Video with Mango AI",
        steps: [
          {
            title: "1. Upload Your Photo",
            description:
              "Upload a clear single full-body photo to the AI flying generator. Mango AI will automatically detect and prepare the subject for flying animation.",
            imageUrl: assets.stepUpload,
          },
          {
            title: "2. Create Flying Effect",
            description:
              'Click "Generate Flying Video" to process your photo. In a matter of seconds, it converts your still image into a seamless flying animation in which the person seems to float and fly across the sky.',
            imageUrl: assets.stepGenerate,
          },
          {
            title: "3. Download and Share",
            description:
              "Download your AI flying video to your device. You can share your flying animation easily on social media or with your friends, or use it for any other creative projects.",
            imageUrl: assets.stepDownload,
          },
        ],
        faqTitle: "FAQs About AI Flying Video Generator",
        faqs: [
          {
            question: "What is an AI flying effect?",
            answer:
              "It's a video animation that is created through cutting-edge AI technology that converts a still image into flying video, adding motion, depth, and cinematic feeling. The subject in the photo seems airborne and active.",
          },
          {
            question: "What kind of image yields the best flying results?",
            answer:
              "For the best result, use a well-lit full-body photo of a single person with an uncluttered background. This allows the AI to separate the subject from the background and move it smoothly.",
          },
          {
            question: "Can I use AI-generated flying video for commercial use?",
            answer:
              "Yes. You can use your AI flying video for marketing, social media, or branding events as long as you follow the platform's rules.",
          },
          {
            question: "Is Mango AI's AI flying video generator free to try?",
            answer:
              "Mango AI's AI fly generator has a free plan with limited credits. You may need to subscribe for higher production use.",
          },
          {
            question: "How much time does it take to generate a flying video?",
            answer:
              "Most pictures are converted to flying animations in seconds to a couple of minutes, depending on picture size and server load.",
          },
        ],
        ctaTitle: "Create Magical Flying Scenes from Photos in One Click",
        ctaButton: "Create Flying Videos Now",
      };
}

function buildAiTwerkLandingContent(locale: string): AiTwerkLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        sectionTitle: "用 AI Twerk 让照片动出更强节奏感",
        sectionIntro:
          "AI Twerk 会把静态人物照片转换成更有舞蹈感的短视频表现。通过更明显的臀部摆动、身体节奏和镜头动感，让一张普通照片快速变成更适合传播的舞蹈内容。",
        features: [
          {
            title: "更有动感的扭胯动画",
            description:
              "系统会围绕人物姿态生成更连贯的腰胯摆动和舞蹈节奏，让结果更像短视频舞蹈片段，而不是简单图片抖动。",
            cta: "立即生成 AI Twerk 视频",
          },
          {
            title: "一张照片即可开始",
            description:
              "不需要复杂素材，上传一张清晰的单人全身照就可以开始生成，更适合快速试玩、做梗图视频或内容创作。",
            cta: "立即生成 AI Twerk 视频",
          },
          {
            title: "更适合社媒短视频",
            description:
              "AI Twerk 输出的是更轻快、更吸睛的短视频结果，适合二次剪辑、分享和做娱乐化内容展示。",
            cta: "立即生成 AI Twerk 视频",
          },
          {
            title: "更轻松的创意舞蹈玩法",
            description:
              "你可以把人物肖像、角色设定或趣味照片做成夸张又有节奏的舞蹈视频，快速尝试更多搞怪或娱乐向创意。",
            cta: "立即生成 AI Twerk 视频",
          },
        ],
        stepsTitle: "如何使用 AI Twerk 视频生成器？",
        steps: [
          {
            title: "1. 上传一张单人全身照",
            description:
              "先准备一张人物完整、构图清晰的单人全身照。主体越明显，后续扭胯动作和身体节奏通常会更自然。",
          },
          {
            title: "2. 开始生成 Twerk 视频",
            description:
              "点击生成后，AI 会自动为人物添加更有节奏感的舞蹈动作、摆胯动势和短视频化的表演效果。",
          },
          {
            title: "3. 预览并下载结果",
            description:
              "等待生成完成后即可预览视频，满意的话可以直接下载，或者替换照片重新尝试不同的人物和舞蹈效果。",
          },
        ],
        faqTitle: "AI Twerk 常见问题",
        faqs: [
          {
            question: "什么是 AI Twerk？",
            answer:
              "AI Twerk 会把静态人物照片转换成短视频舞蹈效果，通过模拟身体节奏和摆动动作，生成更有娱乐感的扭胯视频。",
          },
          {
            question: "AI Twerk 需要几张图片？",
            answer:
              "通常只需要上传一张单人全身照。人物越完整、越清晰，生成出的舞蹈动作往往越稳定。",
          },
          {
            question: "AI Twerk 视频生成器是免费的吗？",
            answer:
              "你可以直接在当前页面体验 AI Twerk，具体积分消耗会以工作区里展示的 credits 信息为准。",
          },
          {
            question: "哪些照片更适合生成 AI Twerk？",
            answer:
              "建议使用清晰、无遮挡、主体明显的单人全身照，尽量避免多人合照、严重裁切或动作过于复杂的素材。",
          },
          {
            question: "生成后的视频可以分享吗？",
            answer:
              "可以。你可以在生成完成后下载结果，再按自己的需要发布到社交平台或保存在本地。",
          },
        ],
        ctaTitle: "把一张照片变成更有节奏感的 AI Twerk 视频",
        ctaButton: "立即开始生成",
      }
    : {
        sectionTitle: "Bring More Energy to Photos with AI Twerk",
        sectionIntro:
          "AI Twerk turns a still portrait into a punchier short-form dance clip with stronger rhythm, hip motion, and playful movement. It is a quick way to transform one image into a more social-ready dance video.",
        features: [
          {
            title: "Energetic twerk-style motion",
            description:
              "The animation focuses on more fluid hip movement, body rhythm, and a dance-like result that feels closer to a short performance clip.",
            cta: "Create AI Twerk Video Now",
          },
          {
            title: "Start from one photo",
            description:
              "You only need one clear full-body image to get started, making AI Twerk easy for quick experiments, memes, and fast social content creation.",
            cta: "Create AI Twerk Video Now",
          },
          {
            title: "Made for social sharing",
            description:
              "The result is built to feel more eye-catching and short-form friendly, so it works well for clips you want to remix, post, or share.",
            cta: "Create AI Twerk Video Now",
          },
          {
            title: "More playful creative options",
            description:
              "Try portraits, characters, or stylized photos and turn them into dance-driven videos with a more humorous or entertaining tone.",
            cta: "Create AI Twerk Video Now",
          },
        ],
        stepsTitle: "How to Use Our AI Twerk Video Generator?",
        steps: [
          {
            title: "1. Upload a Full-Body Photo",
            description:
              "Start with one clear full-body photo of a single person. A well-framed subject usually leads to cleaner motion and a more natural twerk animation.",
          },
          {
            title: "2. Generate Your Twerk Video",
            description:
              "Launch the generation and let AI animate the body with dance rhythm, hip movement, and a more playful performance feel.",
          },
          {
            title: "3. Preview and Download the Result",
            description:
              "Once the video is ready, preview the result, download it, or upload another image to try a different character or dance outcome.",
          },
        ],
        faqTitle: "FAQs About AI Twerk Video Generator",
        faqs: [
          {
            question: "What is AI Twerk?",
            answer:
              "AI Twerk converts a still image into a dance-style short video by simulating body rhythm, hip motion, and an energetic twerk-inspired performance.",
          },
          {
            question: "How many photos do I need for AI Twerk?",
            answer:
              "In most cases, you only need one clear full-body photo of a single person to generate an AI Twerk video.",
          },
          {
            question: "Is the AI Twerk video generator free?",
            answer:
              "You can try AI Twerk directly from this page. Any credit requirement is shown in the workspace before you generate.",
          },
          {
            question: "What kind of photo works best for AI Twerk?",
            answer:
              "Clear, unobstructed, full-body photos tend to work best. Avoid crowded scenes, severe crops, or images where the person is hard to distinguish.",
          },
          {
            question: "Can I share the generated AI Twerk video?",
            answer:
              "Yes. After generation, you can download the video and share it on social platforms or keep it for your own projects.",
          },
        ],
        ctaTitle: "Turn One Photo into an Energetic AI Twerk Video",
        ctaButton: "Create Twerk Videos Now",
      };
}

function buildAiHugLandingContent(locale: string): AiHugLandingContent {
  const isChinese = locale.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        sectionTitle: "把静态合照变成自然流动的拥抱时刻",
        sectionIntro:
          "AI Hug 会围绕两个人物之间的距离、视线和身体朝向生成更连贯的靠近与相拥动作，让原本静止的照片拥有更明显的情绪推进和真实感。无论是情侣合照、亲友纪念照，还是想表达重逢与思念的内容，都可以更快做成可分享的拥抱短视频。",
        features: [
          {
            title: "更自然的靠近与拥抱动作",
            description:
              "系统会尽量让两个人的动作衔接更柔和，从靠近、抬手到拥抱完成都有更连贯的节奏，避免结果只像简单图片晃动。",
            cta: "立即生成 AI 拥抱视频",
          },
          {
            title: "适合情侣、亲友和纪念内容",
            description:
              "你可以把恋人合照、朋友同框、家人照片或带有怀念意味的人物素材做成更有温度的拥抱视频，适合节日、生日和重逢主题。",
            cta: "立即生成 AI 拥抱视频",
          },
          {
            title: "一张双人照片即可开始",
            description:
              "不需要复杂剪辑素材，只要上传一张人物清晰、构图稳定的双人照片，就能快速体验 AI Hug 的生成效果并继续替换图片比较结果。",
            cta: "立即生成 AI 拥抱视频",
          },
          {
            title: "更适合做情绪向社媒短视频",
            description:
              "最终结果保留短视频传播需要的情绪表达和动作重点，适合做纪念向内容、温暖互动片段，或配合文案再次剪辑发布。",
            cta: "立即生成 AI 拥抱视频",
          },
        ],
        stepsTitle: "如何使用 AI 拥抱视频生成器？",
        steps: [
          {
            title: "1. 准备一张包含两个人的照片",
            description:
              "尽量选择人物清晰、无遮挡、两位主体都完整可见的合照。两个人之间的关系和姿态越明确，生成出的拥抱动作通常越自然。",
          },
          {
            title: "2. 上传照片并开始生成",
            description:
              "把照片上传到工作区后点击生成，AI 会围绕人物位置、身体朝向和距离关系补全靠近与相拥的动态过程。",
          },
          {
            title: "3. 预览、下载或继续换图尝试",
            description:
              "结果生成完成后可以直接预览和下载。如果你想比较不同情绪或不同人物组合，也可以继续替换照片重新生成。",
          },
        ],
        faqTitle: "AI 拥抱常见问题",
        faqs: [
          {
            question: "什么是 AI 拥抱视频？",
            answer:
              "AI 拥抱视频会把一张双人照片转换成短视频，通过模拟两个人逐渐靠近并完成拥抱的动作，让静态画面拥有更强的情绪表达。",
          },
          {
            question: "AI Hug 需要上传几张照片？",
            answer:
              "通常只需要一张包含两个人的照片即可开始。为了让动作更稳定，建议使用主体清晰、构图完整的素材。",
          },
          {
            question: "哪些照片更适合生成拥抱效果？",
            answer:
              "双人同框、人物边缘清楚、姿态自然的照片通常表现更好。尽量避免主体过小、严重遮挡或背景过于杂乱的图片。",
          },
          {
            question: "生成后的拥抱视频可以分享吗？",
            answer:
              "可以。生成完成后你可以下载结果，用于社交媒体分享、节日祝福、纪念视频拼接，或仅保存在自己的设备里。",
          },
          {
            question: "上传的照片和结果会公开展示吗？",
            answer:
              "不会默认公开。上传素材和生成内容仅用于当前 AI Hug 生成流程，你可以在生成完成后自行决定是否下载和分享。",
          },
        ],
        ctaTitle: "把一张合照变成更有温度的 AI 拥抱视频",
        ctaButton: "立即开始生成",
      }
    : {
        sectionTitle: "Turn Still Photos into Warm Hug Moments",
        sectionIntro:
          "AI Hug transforms a photo of two people into a more emotional short video by adding natural approach, embrace timing, and gentle body movement. It works well for couples, friends, family portraits, reunion scenes, and memory-driven social clips.",
        features: [
          {
            title: "Natural movement into the hug",
            description:
              "The animation focuses on a smoother motion arc from approaching to embracing, so the result feels more like a real interaction than a simple image shake.",
            cta: "Create AI Hug Video Now",
          },
          {
            title: "Made for relationships and memories",
            description:
              "Use couple photos, friendship portraits, family images, or reunion moments to create warmer hug videos that fit emotional storytelling and celebration posts.",
            cta: "Create AI Hug Video Now",
          },
          {
            title: "Start from one two-person photo",
            description:
              "You only need one clear image with two visible subjects to begin, making AI Hug easy to test, iterate, and compare across different photos.",
            cta: "Create AI Hug Video Now",
          },
          {
            title: "Great for shareable emotional clips",
            description:
              "The final result is suited to short-form sharing, memory edits, and heartfelt social posts where warmth, closeness, and story matter more than heavy editing.",
            cta: "Create AI Hug Video Now",
          },
        ],
        stepsTitle: "How to Use Our AI Hug Video Generator?",
        steps: [
          {
            title: "1. Choose a Photo with Two People",
            description:
              "Start with one clear image where both people are visible and easy to distinguish. Better framing usually leads to more natural hug motion.",
          },
          {
            title: "2. Upload the Photo and Generate",
            description:
              "Upload the image and launch the generation. AI will analyze position, spacing, and body direction to animate a warm hug sequence.",
          },
          {
            title: "3. Preview, Download, or Try Another Photo",
            description:
              "Once the video is ready, preview the result, download it, or swap in another image to test a different emotional tone or pairing.",
          },
        ],
        faqTitle: "FAQs About AI Hug Video Generator",
        faqs: [
          {
            question: "What is an AI hug video?",
            answer:
              "An AI hug video converts a still image of two people into a short animated scene where they move closer and embrace with more lifelike motion.",
          },
          {
            question: "How many photos do I need for AI Hug?",
            answer:
              "In most cases, one photo containing two clearly visible people is enough to generate an AI hug video.",
          },
          {
            question: "What kind of photo works best?",
            answer:
              "Clear two-person photos with visible bodies, clean separation from the background, and stable composition usually produce the best hug effect.",
          },
          {
            question: "Can I share the generated hug video?",
            answer:
              "Yes. After generation, you can download the video and use it for social sharing, greetings, memory edits, or personal keepsakes.",
          },
          {
            question: "Will my uploaded photo be shown publicly?",
            answer:
              "No. Your uploaded image and generated result are only used for the current AI Hug generation flow unless you choose to share them yourself.",
          },
        ],
        ctaTitle: "Turn One Photo into a Warmer AI Hug Video",
        ctaButton: "Create Hug Videos Now",
      };
}

function buildImageEffectMarketingContent(
  effect: ImageEffectItem,
  tDetail: Translator,
): EffectMarketingContent {
  const effectName = effect.title;
  const sourceCount = getImageEffectRequiredInputCount(
    effect.requiredInputCount,
  );
  const sourceText =
    sourceCount > 1
      ? tDetail("marketing.image.sourceCountMany", { count: sourceCount })
      : tDetail("marketing.image.sourceCountOne");

  return {
    eyebrow: tDetail("marketing.eyebrow"),
    title: tDetail("marketing.image.title", { effectName }),
    intro:
      effect.description ||
      tDetail("marketing.image.intro", { effectName, sourceText }),
    featureTitle: tDetail("marketing.featureTitle", { effectName }),
    features: [
      {
        title: tDetail("marketing.image.features.workflow.title"),
        description: tDetail("marketing.image.features.workflow.description", {
          effectName,
        }),
      },
      {
        title: tDetail("marketing.image.features.reference.title"),
        description: tDetail("marketing.image.features.reference.description", {
          effectName,
        }),
      },
      {
        title: tDetail("marketing.image.features.iteration.title"),
        description: tDetail("marketing.image.features.iteration.description"),
      },
    ],
    stepsTitle: tDetail("marketing.stepsTitle", { effectName }),
    steps: [
      {
        title: tDetail("marketing.image.steps.pick.title"),
        description: tDetail("marketing.image.steps.pick.description", {
          effectName,
          libraryLabel: tDetail("workspace.library"),
          useTemplateLabel: tDetail("actions.useTemplate"),
        }),
      },
      {
        title: tDetail("marketing.image.steps.upload.title"),
        description: tDetail("marketing.image.steps.upload.description", {
          sourceText,
        }),
      },
      {
        title: tDetail("marketing.image.steps.generate.title"),
        description: tDetail("marketing.image.steps.generate.description", {
          libraryLabel: tDetail("workspace.library"),
        }),
      },
    ],
    faqTitle: tDetail("marketing.faqTitle", { effectName }),
    faqs: [
      {
        question: tDetail("marketing.image.faq.bestInput.question", {
          effectName,
        }),
        answer: tDetail("marketing.image.faq.bestInput.answer", {
          sourceText,
        }),
      },
      {
        question: tDetail("marketing.image.faq.switch.question", {
          effectName,
        }),
        answer: tDetail("marketing.image.faq.switch.answer", {
          libraryLabel: tDetail("workspace.library"),
          useTemplateLabel: tDetail("actions.useTemplate"),
        }),
      },
      {
        question: tDetail("marketing.image.faq.preset.question"),
        answer: tDetail("marketing.image.faq.preset.answer"),
      },
    ],
    mediaType: "image",
    mediaUrl:
      effect.previewExample?.outputImageUrl ||
      effect.coverUrl ||
      effect.posterUrl,
    posterUrl: effect.posterUrl || effect.coverUrl,
  };
}

function buildVideoEffectMarketingContent(
  effect: VideoEffectItem,
  tDetail: Translator,
  locale: string,
): EffectMarketingContent {
  const effectName = effect.title;
  const isChinese = locale.toLowerCase().startsWith("zh");

  if (effect.slug === AI_BIKINI_SLUG) {
    return isChinese
      ? {
          eyebrow: "AI Bikini Guide",
          title: "用 AI Bikini 快速做出夏日换装视频",
          intro:
            "AI Bikini 让你从一张静态人物照出发，自动生成更轻量、更适合传播的 bikini 换装短视频。当前页面直接走项目里的 Wan 2.7 image-to-video 工作流，内置换装提示词、720p 分辨率和 5 秒时长，适合快速试样、活动素材和风格化社媒内容。",
          featureTitle: "为什么使用 AI Bikini？",
          features: [
            {
              title: "单图即可开始",
              description:
                "只需要上传一张清晰人物照片，不用额外准备结尾帧、动作参考或复杂参数，就能直接进入生成流程。",
            },
            {
              title: "固定夏日换装设定",
              description:
                "工作台已经内置 change the clothes to bikini 提示词，并锁定 720p / 5 秒参数，适合快速验证 bikini 换装主题。",
            },
            {
              title: "保留原始人物姿态",
              description:
                "生成时会尽量沿用原始站姿、构图和环境氛围，让结果更像是基于原照片做出的动态换装片段。",
            },
          ],
          stepsTitle: "如何使用 AI Bikini？",
          steps: [
            {
              title: "1. 上传一张清晰人物照",
              description:
                "建议使用单人、主体清楚、服装边界明显的照片。人物越清晰，换装与动画结果通常越稳定。",
            },
            {
              title: "2. 一键生成换装视频",
              description:
                "系统会自动调用 Wan 2.7 image-to-video，并使用内置提示词 change the clothes to bikini，输出 720p、5 秒视频。",
            },
            {
              title: "3. 预览并下载结果",
              description:
                "生成完成后可以直接在工作台预览结果，满意后下载，或更换输入图片继续做不同的夏日风格版本。",
            },
          ],
          faqTitle: "AI Bikini 常见问题",
          faqs: [
            {
              question: "AI Bikini 是什么？",
              answer:
                "AI Bikini 是一种基于单张人物照片生成 bikini 换装短视频的工作流。它会保留人物主体和场景，并把静态照片转换为短视频结果。",
            },
            {
              question: "这个页面使用的是什么模型？",
              answer:
                "当前页面使用项目里现有的 Wan 2.7 image-to-video 能力，并固定使用 720p、5 秒参数完成生成。",
            },
            {
              question: "我还需要自己写提示词吗？",
              answer:
                "不用。这个工具已经内置 change the clothes to bikini 提示词，上传图片后就可以直接生成。",
            },
            {
              question: "适合什么样的输入图片？",
              answer:
                "更推荐使用成年人、单人、人物完整且衣着轮廓清晰的照片。清晰的主体边缘和稳定构图通常会带来更自然的换装表现。",
            },
            {
              question: "结果可以直接下载吗？",
              answer:
                "可以。生成完成后你可以直接在当前工作台预览并下载视频结果。",
            },
          ],
          mediaType: "video",
          mediaUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl,
          posterUrl: effect.coverUrl || effect.sourceImageUrl,
        }
      : {
          eyebrow: "AI Bikini Guide",
          title: "Create a Summer Outfit-Change Clip with AI Bikini",
          intro:
            "AI Bikini turns one still portrait into a short bikini outfit-change video that is easy to preview, compare, and share. This page uses your existing Wan 2.7 image-to-video workflow with a built-in prompt, fixed 720p resolution, and a 5-second duration so the flow stays simple.",
          featureTitle: "Why use AI Bikini?",
          features: [
            {
              title: "Start from one photo",
              description:
                "Upload a single clear portrait and begin immediately without preparing an end frame, motion reference, or extra prompt settings.",
            },
            {
              title: "Preset outfit-change setup",
              description:
                "The workspace already includes the prompt change the clothes to bikini together with a fixed 720p, 5-second output for quick testing.",
            },
            {
              title: "Keeps the original pose and mood",
              description:
                "The generation stays anchored to the source pose, framing, and scene atmosphere so the result still feels connected to the original image.",
            },
          ],
          stepsTitle: "How to Use AI Bikini?",
          steps: [
            {
              title: "1. Upload a clear portrait",
              description:
                "Single-subject photos with a visible outfit outline usually produce the cleanest clothing-change and motion results.",
            },
            {
              title: "2. Generate with one click",
              description:
                "The tool calls Wan 2.7 image-to-video automatically and uses the built-in prompt change the clothes to bikini with 720p resolution and a 5-second duration.",
            },
            {
              title: "3. Preview and download",
              description:
                "Once the video is ready, preview it in the same workspace, download the result, or try another photo for a different summer-style variation.",
            },
          ],
          faqTitle: "FAQs About AI Bikini",
          faqs: [
            {
              question: "What is AI Bikini?",
              answer:
                "AI Bikini is a single-image workflow that turns one portrait into a short bikini outfit-change video while preserving the subject and general scene layout.",
            },
            {
              question: "Which model powers this page?",
              answer:
                "This page uses the existing Wan 2.7 image-to-video workflow in the project and runs with a fixed 720p, 5-second output setup.",
            },
            {
              question: "Do I need to write my own prompt?",
              answer:
                "No. The tool already includes the prompt change the clothes to bikini, so you only need to upload a photo and generate.",
            },
            {
              question: "What kind of photo works best?",
              answer:
                "Clear adult single-person photos with a stable pose and visible clothing boundaries usually lead to more natural outfit-change results.",
            },
            {
              question: "Can I download the result directly?",
              answer:
                "Yes. After generation you can preview and download the finished video from the same workspace.",
            },
          ],
          mediaType: "video",
          mediaUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl,
          posterUrl: effect.coverUrl || effect.sourceImageUrl,
        };
  }

  if (effect.slug === AI_KISSING_HUB_SLUG) {
    return isChinese
      ? {
          eyebrow: "AI Kissing Guide",
          title: "用 AI Kissing 让浪漫瞬间更有真实感",
          intro:
            "把珍藏照片变成更有情绪的亲吻时刻。AI Kissing 会捕捉细微表情、头部倾斜和轻柔动作，把温柔亲吻、法式热吻或情侣互动转成更自然的接吻视频。",
          featureTitle: "为什么使用 AI Kissing？",
          features: [
            {
              title: "更自然的接吻动画",
              description:
                "生成结果会带有轻微微笑、柔和头部动作和更连贯的肢体节奏，让亲吻画面看起来更真实、更有情绪。",
            },
            {
              title: "多种亲吻风格可选",
              description:
                "你可以在同一个 AI Kissing 工作区里切换不同亲吻风格，从温柔轻吻到更浪漫的法式热吻，再到更有戏剧感的变体。",
            },
            {
              title: "更灵活的亲吻组合",
              description:
                "不管是情侣合照、双人肖像，还是想尝试不同角色组合，AI Kissing 都能帮助你快速生成可分享的接吻视频效果。",
            },
            {
              title: "更重视隐私的生成体验",
              description:
                "上传的照片和生成的视频仅用于这次 AI 接吻视频生成流程，不会被公开展示，让你在制作浪漫内容时更安心。",
            },
          ],
          stepsTitle: "如何使用 AI Kissing？",
          steps: [
            {
              title: "1. 选择亲吻风格",
              description:
                "先挑选你想要的亲吻类型，比如温柔亲吻、法式热吻或其他 kiss style，不同风格会带来不同的动作与情绪表达。",
            },
            {
              title: "2. 上传清晰照片",
              description:
                "根据当前风格要求上传图片。尽量保证人物清晰、构图稳定，这样生成出的亲吻动作会更自然。",
            },
            {
              title: "3. 生成并下载接吻视频",
              description:
                "点击生成后，AI 会自动补全嘴部动作、头部角度和互动节奏。完成后你可以直接预览、下载，或者继续切换风格比较结果。",
            },
          ],
          faqTitle: "AI Kissing 常见问题",
          faqs: [
            {
              question: "什么是 AI Kissing？",
              answer:
                "AI Kissing 是一种把静态照片自动转成接吻动画的生成方式。它会模拟人物之间的表情、头部动作和亲吻节奏，生成更自然的浪漫视频片段。",
            },
            {
              question: "AI Kissing 是免费的吗？",
              answer:
                "你可以直接在当前页面体验 AI Kissing，实际是否消耗额度会以工作区里展示的 credits 为准。",
            },
            {
              question: "AI 接吻视频会被公开吗？",
              answer:
                "不会。上传素材和生成内容只用于当前生成流程，不会默认公开展示。",
            },
            {
              question: "生成的视频可以分享到社交媒体吗？",
              answer:
                "可以。完成后你可以下载视频，并按自己的需要分享到社交媒体、聊天工具，或仅自己保存。",
            },
            {
              question: "使用 AI Kissing 有限制吗？",
              answer:
                "建议只上传清晰、适合动画处理的照片，并确保你对上传内容拥有使用权限。这样更容易得到自然、稳定的接吻视频结果。",
            },
          ],
          mediaType: "video",
          mediaUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl,
          posterUrl: effect.coverUrl || effect.sourceImageUrl,
        }
      : {
          eyebrow: "AI Kissing Guide",
          title: "Elevate Your Romance with AI Kissing",
          intro:
            "Turn your cherished photos into moments of affection with AI Kissing. It captures subtle expressions, head tilt, and gentle movement to create a lifelike kiss scene, whether you want a tender kiss, a passionate French kiss, or another romantic variation.",
          featureTitle: "Why use AI Kissing?",
          features: [
            {
              title: "AI Kissing with lifelike animations",
              description:
                "Every generated kiss feels more natural with gentle smiles, soft head tilts, and motion that better matches the emotional tone of the scene.",
            },
            {
              title: "Diverse kissing styles",
              description:
                "Choose the type of kiss that fits your idea best, from soft romantic pecks to more expressive French-kiss motion and other stylized kiss directions.",
            },
            {
              title: "Flexible kissing pair options",
              description:
                "Use couples, portraits, fictional characters, or other playful pairings to explore different romantic video ideas inside one AI Kissing workspace.",
            },
            {
              title: "Privacy-first generation",
              description:
                "Your uploaded photos and generated videos stay private and are used only for creating your AI kissing video experience.",
            },
          ],
          stepsTitle: "How to Use Our AI Kissing Video Generator?",
          steps: [
            {
              title: "1. Select a Kiss Style",
              description:
                "Choose the kiss type you want first, such as a gentle romantic kiss, a French kiss, or another AI Kissing style with a different mood.",
            },
            {
              title: "2. Upload Your Photos",
              description:
                "Upload the required photo input for the selected style. Clear, well-framed photos usually produce the most natural-looking kissing motion.",
            },
            {
              title: "3. Generate and Download Your Kissing Video",
              description:
                "Start generation and let AI animate the expressions, lip motion, and interaction. Once the result is ready, preview it, download it, or compare another kiss style.",
            },
          ],
          faqTitle: "FAQs About AI Kissing Video Generator",
          faqs: [
            {
              question: "What is AI kissing?",
              answer:
                "AI kissing turns still photos into animated kissing scenes by simulating facial expression changes, head movement, and romantic interaction between the subjects.",
            },
            {
              question: "Is the AI kissing video generator free?",
              answer:
                "You can try AI Kissing directly from this page. Any credit requirement is shown in the workspace before you generate.",
            },
            {
              question: "Are AI-generated kissing videos private?",
              answer:
                "Yes. Uploaded images and generated videos are kept private and are only used for the current AI kissing generation flow.",
            },
            {
              question: "Can I share my AI kissing videos on social media?",
              answer:
                "Yes. After generation you can download the video and share it on social platforms, in chats, or keep it private for yourself.",
            },
            {
              question:
                "Are there any restrictions when using the AI kissing generator?",
              answer:
                "Use clear images that you have permission to upload. Better source photos usually lead to more natural and stable kissing animations.",
            },
          ],
          mediaType: "video",
          mediaUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl,
          posterUrl: effect.coverUrl || effect.sourceImageUrl,
        };
  }

  return {
    eyebrow: tDetail("marketing.eyebrow"),
    title: tDetail("marketing.video.title", { effectName }),
    intro: tDetail("marketing.video.intro", { effectName }),
    featureTitle: tDetail("marketing.featureTitle", { effectName }),
    features: [
      {
        title: tDetail("marketing.video.features.motion.title"),
        description: tDetail("marketing.video.features.motion.description", {
          effectName,
        }),
      },
      {
        title: tDetail("marketing.video.features.preview.title"),
        description: tDetail("marketing.video.features.preview.description"),
      },
      {
        title: tDetail("marketing.video.features.exploration.title"),
        description: tDetail(
          "marketing.video.features.exploration.description",
          {
            libraryLabel: tDetail("workspace.library"),
            useTemplateLabel: tDetail("actions.useTemplate"),
          },
        ),
      },
    ],
    stepsTitle: tDetail("marketing.stepsTitle", { effectName }),
    steps: [
      {
        title: tDetail("marketing.video.steps.pick.title"),
        description: tDetail("marketing.video.steps.pick.description", {
          effectName,
          libraryLabel: tDetail("workspace.library"),
        }),
      },
      {
        title: tDetail("marketing.video.steps.upload.title"),
        description: tDetail("marketing.video.steps.upload.description"),
      },
      {
        title: tDetail("marketing.video.steps.generate.title"),
        description: tDetail("marketing.video.steps.generate.description"),
      },
    ],
    faqTitle: tDetail("marketing.faqTitle", { effectName }),
    faqs: [
      {
        question: tDetail("marketing.video.faq.image.question", {
          effectName,
        }),
        answer: tDetail("marketing.video.faq.image.answer"),
      },
      {
        question: tDetail("marketing.video.faq.switch.question", {
          effectName,
        }),
        answer: tDetail("marketing.video.faq.switch.answer", {
          libraryLabel: tDetail("workspace.library"),
          useTemplateLabel: tDetail("actions.useTemplate"),
        }),
      },
      {
        question: tDetail("marketing.video.faq.preset.question"),
        answer: tDetail("marketing.video.faq.preset.answer"),
      },
    ],
    mediaType: "video",
    mediaUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl,
    posterUrl: effect.coverUrl || effect.sourceImageUrl,
  };
}

function EffectMarketingSection({
  content,
}: {
  content: EffectMarketingContent;
}) {
  return (
    <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,440px)] xl:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a5600]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 max-w-[18ch] text-[2rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.title}
          </h2>
          <p className="mt-4 max-w-[42rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.intro}
          </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#fff8de_0%,#fffef5_100%)] p-3 shadow-[0_18px_42px_rgba(35,40,47,0.08)]">
          <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[22px] bg-[#F5F7F9]">
            {content.mediaType === "video" && content.mediaUrl ? (
              <video
                src={content.mediaUrl}
                poster={content.posterUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-[15rem] w-full object-cover"
              />
            ) : content.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  withOssImageResize(content.mediaUrl, 880, 600) ||
                  content.mediaUrl
                }
                alt={content.title}
                className="h-[15rem] w-full object-cover"
              />
            ) : (
              <div className="flex h-[15rem] items-center justify-center bg-[#F5F7F9]">
                <Sparkles className="size-8 text-[#9AA3AF]" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#23282F]">
          {content.featureTitle}
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {content.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#fffef8] p-5"
            >
              <h4 className="text-lg font-semibold text-[#23282F]">
                {feature.title}
              </h4>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#23282F]">
          {content.stepsTitle}
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step) => (
            <article
              key={step.title}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F7F9] p-5"
            >
              <h4 className="text-base font-semibold text-[#23282F]">
                {step.title}
              </h4>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#23282F]">
          {content.faqTitle}
        </h3>
        <div className="mt-4 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-white p-5"
            >
              <h4 className="text-base font-semibold text-[#23282F]">
                {faq.question}
              </h4>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiKissingLandingSection({
  content,
  effect,
  onCtaClick,
}: {
  content: AiKissingLandingContent;
  effect: VideoEffectItem;
  onCtaClick: () => void;
}) {
  const styleItems = effect.styleItems?.slice(0, 4) || [];
  const featurePreviews = styleItems.map((item) => ({
    title: item.title,
    mediaUrl: item.samplePreviewClipUrl || item.sampleVideoUrl || "",
    posterUrl: item.coverUrl || item.sourceImageUrl || "",
  }));
  const stepInputImages = Array.from(
    new Set(
      styleItems
        .flatMap((item) =>
          (item.examples || [])
            .map((example) => example.inputImageUrl || "")
            .filter(Boolean),
        )
        .slice(0, 2),
    ),
  );
  const previewFallback =
    effect.samplePreviewClipUrl || effect.sampleVideoUrl || "";
  const posterFallback = effect.coverUrl || effect.sourceImageUrl || "";

  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[48rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const preview = featurePreviews[index] || {
              title: effect.title,
              mediaUrl: previewFallback,
              posterUrl: posterFallback,
            };
            const isReversed = index % 2 === 1;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#23282F] px-5 text-sm font-semibold text-white transition hover:bg-[#333333]"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-[#F5F7F9]">
                    {preview.mediaUrl ? (
                      <video
                        src={preview.mediaUrl}
                        poster={preview.posterUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : preview.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          withOssImageResize(preview.posterUrl, 960, 720) ||
                          preview.posterUrl
                        }
                        alt={preview.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step, index) => {
            const preview = featurePreviews[index] || {
              title: effect.title,
              mediaUrl: previewFallback,
              posterUrl: posterFallback,
            };

            return (
              <article
                key={step.title}
                className="overflow-hidden rounded-[26px] border border-[#E5E7EB] bg-[#F8FAFC]"
              >
                <div className="overflow-hidden bg-[#EEF4FB]">
                  {index === 0 ? (
                    <div className="grid aspect-[1.28] w-full grid-cols-2 gap-2 p-3">
                      {styleItems.slice(0, 4).map((item) => {
                        const thumbUrl = item.coverUrl || item.sourceImageUrl;

                        return (
                          <div
                            key={item.slug}
                            className="relative overflow-hidden rounded-[18px] bg-white"
                          >
                            {thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  withOssImageResize(thumbUrl, 640, 420) ||
                                  thumbUrl
                                }
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white">
                                <Sparkles className="size-6 text-[#9AA3AF]" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.7)_100%)]" />
                            <p className="absolute inset-x-2 bottom-2 text-[12px] font-semibold text-white">
                              {item.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : index === 1 ? (
                    <div className="grid aspect-[1.28] w-full grid-cols-2 gap-2 p-3">
                      {stepInputImages.length > 0 ? (
                        stepInputImages.map((imageUrl, imageIndex) => (
                          <div
                            key={`${imageUrl}-${imageIndex}`}
                            className="overflow-hidden rounded-[18px] bg-white"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                withOssImageResize(imageUrl, 640, 760) ||
                                imageUrl
                              }
                              alt={`${step.title} input ${imageIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 flex h-full items-center justify-center rounded-[18px] bg-white">
                          <Sparkles className="size-8 text-[#9AA3AF]" />
                        </div>
                      )}
                    </div>
                  ) : preview.mediaUrl ? (
                    <video
                      src={preview.mediaUrl}
                      poster={preview.posterUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="aspect-[1.28] w-full object-cover"
                    />
                  ) : preview.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        withOssImageResize(preview.posterUrl, 840, 560) ||
                        preview.posterUrl
                      }
                      alt={preview.title}
                      className="aspect-[1.28] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[1.28] w-full items-center justify-center">
                      <Sparkles className="size-8 text-[#9AA3AF]" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#23282F]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                    {step.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#F1F7FF_0%,#FFFFFF_100%)] p-6 text-center shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-8">
        <h2 className="mx-auto max-w-[22ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] px-7 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiTwerkLandingSection({
  content,
  effect,
  onCtaClick,
}: {
  content: AiTwerkLandingContent;
  effect: VideoEffectItem;
  onCtaClick: () => void;
}) {
  const previewVideoUrl =
    effect.samplePreviewClipUrl || effect.sampleVideoUrl || "";
  const previewPosterUrl = effect.coverUrl || effect.sourceImageUrl || "";
  const previewImageUrl = effect.sourceImageUrl || effect.coverUrl || "";
  const stepPreviewImages = [
    "https://online.mangoanimate.com/mango_ai/ai-twerk/upload-your-photo.jpg",
    "https://online.mangoanimate.com/mango_ai/ai-twerk/generate-ai-twerk-video.jpg",
    "https://online.mangoanimate.com/mango_ai/ai-twerk/download-and-share-ai-twerk-video.jpg",
  ];

  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[48rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const isReversed = index % 2 === 1;
            const useVideoPreview = index % 2 === 0 && previewVideoUrl;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#23282F] px-5 text-sm font-semibold text-white transition hover:bg-[#333333]"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-[#F5F7F9]">
                    {useVideoPreview ? (
                      <video
                        src={previewVideoUrl}
                        poster={previewPosterUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : previewImageUrl ? (
                      <img
                        src={
                          withOssImageResize(previewImageUrl, 960, 720) ||
                          previewImageUrl
                        }
                        alt={effect.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step, index) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[26px] border border-[#E5E7EB] bg-[#F8FAFC]"
            >
              <div className="overflow-hidden bg-[#EEF4FB]">
                {stepPreviewImages[index] ? (
                  <img
                    src={
                      withOssImageResize(stepPreviewImages[index], 840, 560) ||
                      stepPreviewImages[index]
                    }
                    alt={step.title}
                    className="aspect-[1.28] w-full object-cover"
                  />
                ) : previewVideoUrl ? (
                  <video
                    src={previewVideoUrl}
                    poster={previewPosterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="aspect-[1.28] w-full object-cover"
                  />
                ) : previewPosterUrl ? (
                  <img
                    src={
                      withOssImageResize(previewPosterUrl, 840, 560) ||
                      previewPosterUrl
                    }
                    alt={step.title}
                    className="aspect-[1.28] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[1.28] w-full items-center justify-center">
                    <Sparkles className="size-8 text-[#9AA3AF]" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#23282F]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#F1F7FF_0%,#FFFFFF_100%)] p-6 text-center shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-8">
        <h2 className="mx-auto max-w-[22ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] px-7 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiBikiniLandingSection({
  content,
  onCtaClick,
}: {
  content: AiBikiniLandingContent;
  onCtaClick: () => void;
}) {
  const stepMeta = [
    {
      badge: "Upload",
      Icon: FolderOpen,
      iconClassName: "h-5 w-5",
      chipClassName:
        "border-[#BEE0FF] bg-white/92 text-[#2474E5] shadow-[0_14px_30px_rgba(36,116,229,0.16)]",
      frameClassName: "bg-[linear-gradient(180deg,#FFF8F1_0%,#FDE6D5_100%)]",
    },
    {
      badge: "Generate",
      Icon: Sparkles,
      iconClassName: "h-5 w-5",
      chipClassName:
        "border-[#D8C0FF] bg-white/92 text-[#8D43FF] shadow-[0_14px_30px_rgba(141,67,255,0.16)]",
      frameClassName: "bg-[linear-gradient(180deg,#F5F7FF_0%,#E9D9FF_100%)]",
    },
    {
      badge: "Preview",
      Icon: Play,
      iconClassName: "ml-0.5 h-4.5 w-4.5 fill-current",
      chipClassName:
        "border-[#FFD2A6] bg-white/92 text-[#F08A24] shadow-[0_14px_30px_rgba(240,138,36,0.16)]",
      frameClassName: "bg-[linear-gradient(180deg,#FFF7ED_0%,#FFE7CC_100%)]",
    },
  ] as const;

  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#E8E8EE] bg-white p-5 shadow-[0_18px_42px_rgba(18,25,38,0.06)] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[50rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const isReversed = index % 2 === 1;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#ECECF2] bg-[#FFFDF8] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(90deg,#3D8BFF_0%,#A946FF_100%)] px-5 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#ECECF2] bg-[#F5F7F9]">
                    <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.68),transparent_58%)] px-5 py-4">
                      {feature.videoUrl ? (
                        <video
                          src={feature.videoUrl}
                          poster={feature.posterUrl || feature.imageUrl}
                          className="h-full w-full rounded-[18px] object-contain"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={
                            withOssImageMaxSide(feature.imageUrl, 960) ||
                            feature.imageUrl
                          }
                          alt={feature.title}
                          className="h-full w-full rounded-[18px] object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E8E8EE] bg-white p-5 shadow-[0_18px_42px_rgba(18,25,38,0.06)] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step, index) => {
            const meta = stepMeta[index] ?? stepMeta[stepMeta.length - 1];
            const StepIcon = meta.Icon;

            return (
              <article
                key={step.title}
                className="overflow-hidden rounded-[26px] border border-[#ECECF2] bg-[#FBFBFD]"
              >
                <div
                  className={cn(
                    "relative overflow-hidden",
                    meta.frameClassName,
                  )}
                >
                  <div className="flex aspect-[1.28] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_55%)] px-6 py-4">
                    {step.mediaType === "video" && step.videoUrl ? (
                      <video
                        src={step.videoUrl}
                        poster={step.posterUrl || step.imageUrl}
                        className="h-full w-full rounded-[18px] object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={
                          withOssImageMaxSide(step.imageUrl, 840) ||
                          step.imageUrl
                        }
                        alt={step.title}
                        className="h-full w-full rounded-[18px] object-contain"
                      />
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(35,40,47,0.1)_100%)]" />
                  <div className="absolute left-4 top-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        meta.chipClassName,
                      )}
                    >
                      <StepIcon className={meta.iconClassName} />
                      {meta.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#23282F]/88 px-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(35,40,47,0.2)]">
                      0{index + 1}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#23282F]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                    {step.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E8E8EE] bg-white p-5 shadow-[0_18px_42px_rgba(18,25,38,0.06)] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[24px] border border-[#ECECF2] bg-[#FFFDF8] p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-[#23282F]">
                <span>{faq.question}</span>
                <span className="text-[#98A2B3] transition group-open:rotate-90">
                  <ChevronRight className="size-5" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#DFE8FF] bg-[linear-gradient(135deg,#EFF5FF_0%,#F9F2FF_100%)] p-6 text-center shadow-[0_18px_42px_rgba(61,139,255,0.08)] sm:p-8">
        <h2 className="mx-auto max-w-[24ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#3D8BFF_0%,#A946FF_100%)] px-7 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiJiggleLandingSection({
  content,
  effect,
  onCtaClick,
}: {
  content: AiJiggleLandingContent;
  effect: VideoEffectItem;
  onCtaClick: () => void;
}) {
  const previewVideoUrl =
    effect.samplePreviewClipUrl ||
    effect.sampleVideoUrl ||
    AI_JIGGLE_ASSETS.heroVideo;
  const previewPosterUrl =
    effect.coverUrl || effect.sourceImageUrl || AI_JIGGLE_ASSETS.heroImage;
  const featurePreviewItems = [
    {
      imageUrl: AI_JIGGLE_ASSETS.feature1,
      videoUrl: AI_JIGGLE_ASSETS.heroVideo,
    },
    { imageUrl: AI_JIGGLE_ASSETS.feature2 },
    { imageUrl: AI_JIGGLE_ASSETS.heroImage },
    { imageUrl: AI_JIGGLE_ASSETS.feature3 },
  ];
  const stepPreviewItems = [
    AI_JIGGLE_ASSETS.step1,
    AI_JIGGLE_ASSETS.step2,
    AI_JIGGLE_ASSETS.step3,
  ];

  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#F1D5E0] bg-white p-5 shadow-[0_20px_50px_rgba(236,72,153,0.08)] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[48rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const isReversed = index % 2 === 1;
            const preview =
              featurePreviewItems[index] || featurePreviewItems[0];

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#F6DCE5] bg-[linear-gradient(135deg,#FFF8FB_0%,#FFFDF6_100%)] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <div className="inline-flex rounded-full border border-[#F5BDD1] bg-[#FFF1F7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C34777]">
                    AI Jiggle
                  </div>
                  <h3 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(90deg,#EC4899_0%,#F59E0B_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(236,72,153,0.2)] transition hover:opacity-95"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#F5D7E2] bg-[#FFF6FA]">
                    {preview?.videoUrl ? (
                      <video
                        src={preview.videoUrl}
                        poster={previewPosterUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : preview?.imageUrl ? (
                      <img
                        src={
                          withOssImageResize(preview.imageUrl, 960, 720) ||
                          preview.imageUrl
                        }
                        alt={effect.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#F1D5E0] bg-white p-5 shadow-[0_20px_50px_rgba(236,72,153,0.08)] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step, index) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[26px] border border-[#F6DCE5] bg-[#FFF8FB]"
            >
              <div className="overflow-hidden bg-[linear-gradient(180deg,#FFF0F6_0%,#FFF8E7_100%)]">
                {stepPreviewItems[index] ? (
                  <img
                    src={
                      withOssImageResize(stepPreviewItems[index], 840, 560) ||
                      stepPreviewItems[index]
                    }
                    alt={step.title}
                    className="aspect-[1.28] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[1.28] w-full items-center justify-center">
                    <Sparkles className="size-8 text-[#9AA3AF]" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#23282F]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#F1D5E0] bg-white p-5 shadow-[0_20px_50px_rgba(236,72,153,0.08)] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#F6DCE5] bg-[#FFF8FB] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#F4C2D4] bg-[linear-gradient(135deg,#FFE0EC_0%,#FFF0C8_100%)] p-6 text-center shadow-[0_24px_60px_rgba(236,72,153,0.14)] sm:p-8">
        <h2 className="mx-auto max-w-[24ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#23282F] px-7 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(35,40,47,0.2)] transition hover:bg-[#333333]"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiFlyingLandingSection({
  content,
  onCtaClick,
}: {
  content: AiFlyingLandingContent;
  onCtaClick: () => void;
}) {
  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[48rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const isReversed = index % 2 === 1;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#23282F] px-5 text-sm font-semibold text-white transition hover:bg-[#333333]"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-[#F5F7F9]">
                    {feature.videoUrl ? (
                      <video
                        src={feature.videoUrl}
                        poster={feature.posterUrl || feature.imageUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            withOssImageResize(feature.imageUrl, 960, 720) ||
                            feature.imageUrl
                          }
                          alt={feature.title}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[26px] border border-[#E5E7EB] bg-[#F8FAFC]"
            >
              <div className="overflow-hidden bg-[#EEF4FB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    withOssImageResize(step.imageUrl, 840, 560) || step.imageUrl
                  }
                  alt={step.title}
                  className="aspect-[1.28] w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#23282F]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E7D173] bg-[linear-gradient(135deg,#FFC100_0%,#FFD75A_55%,#FFF0B5_100%)] p-6 text-center shadow-[0_22px_56px_rgba(255,193,0,0.18)] sm:p-8">
        <h2 className="mx-auto max-w-[24ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#23282F] px-7 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(35,40,47,0.2)] transition hover:bg-[#333333]"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiHugLandingSection({
  content,
  effect,
  onCtaClick,
}: {
  content: AiHugLandingContent;
  effect: VideoEffectItem;
  onCtaClick: () => void;
}) {
  const previewVideoUrl =
    effect.samplePreviewClipUrl || effect.sampleVideoUrl || "";
  const previewPosterUrl = effect.coverUrl || effect.sourceImageUrl || "";
  const exampleItems = (effect.examples || []).slice(0, 8);
  const featurePreviewItems = content.features.map((_, index) => {
    const example = exampleItems[index] || exampleItems[0];

    return {
      imageUrl: example?.inputImageUrl || previewPosterUrl,
      videoUrl:
        example?.outputPreviewClipUrl ||
        example?.outputVideoUrl ||
        previewVideoUrl,
    };
  });
  const stepPreviewItems = content.steps.map((_, index) => {
    const example = exampleItems[index] || exampleItems[0];

    return {
      imageUrl: example?.inputImageUrl || previewPosterUrl,
      videoUrl:
        example?.outputPreviewClipUrl ||
        example?.outputVideoUrl ||
        previewVideoUrl,
    };
  });

  return (
    <section className="space-y-8">
      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[48rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const preview = featurePreviewItems[index];
            const isReversed = index % 2 === 1;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed ? "lg:order-2" : "")}>
                  <h3 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#23282F] px-5 text-sm font-semibold text-white transition hover:bg-[#333333]"
                  >
                    {feature.cta}
                  </button>
                </div>

                <div className={cn(isReversed ? "lg:order-1" : "")}>
                  <div className="overflow-hidden rounded-[22px] border border-[#E5E7EB] bg-[#F5F7F9]">
                    {preview?.videoUrl ? (
                      <video
                        src={preview.videoUrl}
                        poster={preview.imageUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : preview?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          withOssImageResize(preview.imageUrl, 960, 720) ||
                          preview.imageUrl
                        }
                        alt={effect.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.stepsTitle}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {content.steps.map((step, index) => {
            const preview = stepPreviewItems[index];

            return (
              <article
                key={step.title}
                className="overflow-hidden rounded-[26px] border border-[#E5E7EB] bg-[#F8FAFC]"
              >
                <div className="overflow-hidden bg-[#EEF4FB]">
                  {index === 0 ? (
                    <div className="grid aspect-[1.28] w-full grid-cols-2 gap-2 p-3">
                      {exampleItems.slice(0, 4).map((example, imageIndex) => (
                        <div
                          key={`${example.inputImageUrl}-${imageIndex}`}
                          className="overflow-hidden rounded-[18px] bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              withOssImageResize(
                                example.inputImageUrl || "",
                                640,
                                760,
                              ) || example.inputImageUrl
                            }
                            alt={`${step.title} ${imageIndex + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : index === 1 && preview?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        withOssImageResize(preview.imageUrl, 840, 560) ||
                        preview.imageUrl
                      }
                      alt={step.title}
                      className="aspect-[1.28] w-full object-cover"
                    />
                  ) : preview?.videoUrl ? (
                    <video
                      src={preview.videoUrl}
                      poster={preview.imageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="aspect-[1.28] w-full object-cover"
                    />
                  ) : preview?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        withOssImageResize(preview.imageUrl, 840, 560) ||
                        preview.imageUrl
                      }
                      alt={step.title}
                      className="aspect-[1.28] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[1.28] w-full items-center justify-center">
                      <Sparkles className="size-8 text-[#9AA3AF]" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[#23282F]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                    {step.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.faqTitle}
        </h2>
        <div className="mt-6 space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#F1F7FF_0%,#FFFFFF_100%)] p-6 text-center shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-8">
        <h2 className="mx-auto max-w-[22ch] text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] px-7 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function ReplicaHeroSection({ content }: { content: ReplicaHeroContent }) {
  return (
    <section className="mx-auto max-w-[1080px] rounded-[26px] bg-[linear-gradient(180deg,#EAF4FF_0%,#F6FAFF_100%)] px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-6">
      <div className="mx-auto max-w-[64rem] text-center">
        <h1 className="text-balance text-[1.72rem] font-bold leading-[1.08] tracking-[-0.03em] text-[#2E3138] sm:text-[2.15rem] lg:text-[2.45rem]">
          {content.title}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[52rem] text-balance text-[0.88rem] leading-5 text-[#666666] sm:text-[0.94rem] lg:text-[0.98rem]">
          {content.intro}
        </p>
      </div>
    </section>
  );
}

function buildGenericMangoLandingContent({
  sceneTitle,
  category,
  workspaceDescription,
}: {
  sceneTitle: string;
  category: string;
  workspaceDescription: string;
}): GenericMangoLandingContent {
  const mediaLabel = category === "Video" ? "video" : "image";
  const mediaLabelPlural = category === "Video" ? "videos" : "images";
  const capitalizedMediaLabel =
    mediaLabel.charAt(0).toUpperCase() + mediaLabel.slice(1);
  const isImageToImageScene = /image to image/i.test(sceneTitle);
  const uploadLabel = isImageToImageScene
    ? `reference ${mediaLabel}`
    : `source ${mediaLabel}`;
  const uploadLabelPlural = isImageToImageScene
    ? `reference ${mediaLabelPlural}`
    : `source ${mediaLabelPlural}`;
  const isBackgroundRemoverGuide = /background remover/i.test(sceneTitle);
  const isImageUpscalerGuide = /image upscaler/i.test(sceneTitle);
  const isImageEraserGuide = /image eraser/i.test(sceneTitle);

  return {
    sectionTitle: `Create stunning AI ${mediaLabelPlural} with ${sceneTitle}`,
    sectionIntro: isImageUpscalerGuide
      ? `${workspaceDescription} Upload a ${uploadLabel}, choose the upscale settings you need, and generate cleaner ${mediaLabelPlural} in a workflow that stays close to the look and structure of your original input.`
      : isImageEraserGuide
        ? `${workspaceDescription} Upload a ${uploadLabel}, mark the area you want to remove, and generate a cleaner ${mediaLabel} while the surrounding background is reconstructed naturally.`
        : `${workspaceDescription} Upload a ${uploadLabel}, refine the visual direction, and generate cleaner ${mediaLabelPlural} in a workflow that stays close to the look and structure of your original input.`,
    features: isImageUpscalerGuide
      ? [
          {
            title: `Upload your ${uploadLabel} and keep the direction grounded`,
            description: `${sceneTitle} lets you start from a clear ${uploadLabel}, so the output stays anchored to your subject, composition, and visual intent instead of drifting into an unrelated result.`,
          },
          {
            title: "Generate a sharper result for delivery",
            description: `Run the upscale, compare the before and after, and keep the version that best improves clarity, texture, and readability in the final ${mediaLabel}.`,
          },
        ]
      : isImageEraserGuide
        ? [
            {
              title: `Upload the ${uploadLabel} you want to clean`,
              description: `${sceneTitle} starts from your original ${uploadLabel}, so the final image keeps the same composition, lighting, and background context.`,
            },
            {
              title: "Mark the object, text, or distraction",
              description:
                "Use a mask to identify the exact area that should disappear. A short optional prompt can clarify what the cleaned background should preserve.",
            },
            {
              title: "Generate a natural-looking cleanup",
              description: `Review the erased result and keep the version where the repaired area blends cleanly into the surrounding ${mediaLabel}.`,
            },
          ]
        : [
            {
              title: `Upload your ${uploadLabel} and keep the direction grounded`,
              description: `${sceneTitle} lets you start from a clear ${uploadLabel}, so the output stays anchored to your subject, composition, and visual intent instead of drifting into an unrelated result.`,
            },
            {
              title: `Add a prompt to guide style, mood, and details`,
              description: `Describe the lighting, texture, background, or styling changes you want while preserving the structure of the uploaded ${uploadLabel}. This makes it easier to iterate without rebuilding from scratch.`,
            },
            {
              title: `Choose the model that fits the result you need`,
              description: `Switch between available models to optimize for realism, speed, or stylization, then compare multiple generations until the final ${mediaLabel} matches your target direction.`,
            },
          ],
    stepsTitle: `How to use ${sceneTitle}`,
    steps: isBackgroundRemoverGuide
      ? [
          {
            title: `1. Upload a clear ${uploadLabel}`,
            description: `First, upload a clean and readable ${uploadLabel}. This gives ${sceneTitle} a stable visual base so it can isolate the main subject cleanly while preserving edges, shape, and important details.`,
          },
          {
            title: `2. Generate and download the clean cutout`,
            description: `Then generate the result and review the transparent cutout. If needed, swap in a cleaner ${uploadLabel} and run it again until the final ${mediaLabel} looks ready to use.`,
          },
        ]
      : isImageUpscalerGuide
        ? [
            {
              title: `1. Upload a clear ${uploadLabel}`,
              description: `First, upload a clean and readable ${uploadLabel}. This gives ${sceneTitle} a stable visual base so it can preserve the key subject, composition, and structure before enlarging the image.`,
            },
            {
              title: "2. Choose the output settings you need",
              description: `Next, choose the target resolution and output format that fit your delivery needs, then generate the upscale and export the version that gives you the cleanest detail and clarity in the final ${mediaLabel}.`,
            },
          ]
        : isImageEraserGuide
          ? [
              {
                title: `1. Upload the ${uploadLabel}`,
                description: `First, upload the ${mediaLabel} you want to clean. This gives ${sceneTitle} the original scene, lighting, and background texture it needs to preserve.`,
              },
              {
                title: "2. Mark what should be erased",
                description:
                  "Next, brush or upload a mask over the unwanted object, text, logo, or distraction. You can add a short prompt only when the repaired area needs extra guidance.",
              },
              {
                title: `3. Generate the clean result`,
                description: `Finally, generate the cleanup and compare it with the source. Keep the result where the erased area blends naturally with the surrounding ${mediaLabel}.`,
              },
            ]
          : [
              {
                title: `1. Upload a clear ${uploadLabel}`,
                description: `First, upload a clean and readable ${uploadLabel}. This gives ${sceneTitle} a stable visual base so it can preserve the key subject, composition, and structure before applying edits.`,
              },
              {
                title: "2. Describe the result you want",
                description:
                  "Next, write a concise prompt describing the style, lighting, mood, composition, and specific changes you want. The clearer the instruction, the easier it is to steer the final result in the right direction.",
              },
              {
                title: `3. Generate, review, and refine`,
                description: `Finally, generate the result, compare the outputs, and refine the prompt if needed. Repeat until the final ${mediaLabel} reaches the quality and direction you want.`,
              },
            ],
    faqTitle: `FAQs about ${sceneTitle}`,
    faqs: isImageUpscalerGuide
      ? [
          {
            question: `What kind of reference files work best for ${sceneTitle}?`,
            answer: `${uploadLabelPlural.charAt(0).toUpperCase() + uploadLabelPlural.slice(1)} with a clear subject, readable lighting, and a stable composition usually produce the most consistent results.`,
          },
          {
            question: "Do I need to enter a prompt to upscale an image?",
            answer:
              "No. Image Upscaler can work directly from the uploaded source image, so the main controls here are the target resolution and output format.",
          },
          {
            question: `How do I get cleaner ${mediaLabelPlural}?`,
            answer: `Use a higher-quality ${uploadLabel}, avoid heavily damaged inputs, and choose the output resolution that matches your delivery needs.`,
          },
          {
            question: "Can I export the same image in different sizes?",
            answer:
              "Yes. You can reuse the same source image and generate alternate upscale outputs at different resolutions or formats when needed.",
          },
        ]
      : [
          {
            question: `What kind of reference files work best for ${sceneTitle}?`,
            answer: `${uploadLabelPlural.charAt(0).toUpperCase() + uploadLabelPlural.slice(1)} with a clear subject, readable lighting, and a stable composition usually produce the most consistent results.`,
          },
          {
            question: `Can I guide the output with my own prompt?`,
            answer: `Yes. You can upload a ${uploadLabel} and still describe the styling, mood, detail, or background changes you want in the final output.`,
          },
          {
            question: `How do I get more consistent ${mediaLabelPlural}?`,
            answer: `Use a cleaner ${uploadLabel}, keep the prompt specific, and stay focused on one visual direction instead of combining too many conflicting instructions.`,
          },
          {
            question: `Can I try multiple styles from the same input?`,
            answer: `Yes. The workspace is built for iteration, so you can reuse the same ${uploadLabel} and quickly generate several alternate directions.`,
          },
        ],
    ctaTitle: `Start creating with ${sceneTitle}`,
    ctaDescription: isImageUpscalerGuide
      ? `Upload your ${uploadLabel}, choose the output settings you need, and generate polished AI ${mediaLabelPlural} in one workspace.`
      : `Upload your ${uploadLabel}, refine the prompt, and generate polished AI ${mediaLabelPlural} in one workspace.`,
    ctaButton: `Try ${capitalizedMediaLabel} to ${capitalizedMediaLabel}`,
  };
}

function MangoHeroSection({ content }: { content: ReplicaHeroContent }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1220px] px-4 pb-3 pt-4 text-center sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pb-5 lg:pt-6">
        <h1 className="text-balance text-[2rem] font-bold leading-[1.08] text-[#23282F] sm:text-[2.45rem] lg:text-[3rem]">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[1180px] text-balance text-[0.95rem] leading-[1.5] text-[#626B7A] sm:text-[1.08rem] lg:text-[1.18rem]">
          {content.intro}
        </p>
      </div>
    </section>
  );
}

function MangoMarketingSection({
  content,
  previewItems,
  templateItems,
  onCtaClick,
}: {
  content: GenericMangoLandingContent;
  previewItems: ToolEffectCarouselItem[];
  templateItems: WorkbenchTemplateItem[];
  onCtaClick: () => void;
}) {
  const isImageToImageGuide = /image to image/i.test(content.stepsTitle);
  const isImageUpscalerGuide = /image upscaler/i.test(content.sectionTitle);
  const isImageEraserGuide = /image eraser/i.test(content.sectionTitle);
  const showcaseTemplateItem =
    templateItems.find(
      (item) =>
        item.referencePreviewUrls.length > 0 &&
        Boolean(item.thumbnailUrl || item.previewUrl),
    ) ||
    templateItems.find((item) => item.referencePreviewUrls.length > 0) ||
    templateItems[0] ||
    null;
  const comparisonTemplateItem =
    (isImageUpscalerGuide
      ? templateItems.find(
          (item) =>
            item.referencePreviewUrls.length > 0 &&
            /fantasy|dragon|epic/i.test(item.prompt || item.title || ""),
        )
      : null) || showcaseTemplateItem;
  const comparisonSourceImageUrl =
    comparisonTemplateItem?.referencePreviewUrls?.[0] || null;
  const comparisonResultImageUrl =
    comparisonTemplateItem?.thumbnailUrl ||
    comparisonTemplateItem?.previewUrl ||
    null;
  const showcasePoseRefImageUrl =
    showcaseTemplateItem?.referencePreviewUrls?.[0] || null;
  const showcaseMaskImageUrl =
    Array.isArray(showcaseTemplateItem?.params?.maskImage) &&
    typeof showcaseTemplateItem.params.maskImage[0]?.url === "string"
      ? showcaseTemplateItem.params.maskImage[0].url
      : Array.isArray(showcaseTemplateItem?.params?.maskImage) &&
          typeof showcaseTemplateItem.params.maskImage[0]?.preview === "string"
        ? showcaseTemplateItem.params.maskImage[0].preview
        : null;
  const showcaseResultImageUrl =
    showcaseTemplateItem?.thumbnailUrl ||
    showcaseTemplateItem?.previewUrl ||
    null;
  const featurePreviews = isImageUpscalerGuide
    ? [
        comparisonSourceImageUrl
          ? {
              id: `${comparisonTemplateItem?.id || "upscaler"}-source`,
              title: content.features[0]?.title || "Source",
              mediaType: "image" as const,
              sourcePreviewUrl: comparisonSourceImageUrl,
              previewClipUrl: undefined,
              previewUrl: comparisonSourceImageUrl,
              thumbnailUrl: comparisonSourceImageUrl,
            }
          : null,
        comparisonResultImageUrl
          ? {
              id: `${comparisonTemplateItem?.id || "upscaler"}-result`,
              title: content.features[1]?.title || "Result",
              mediaType: "image" as const,
              sourcePreviewUrl: comparisonSourceImageUrl,
              previewClipUrl: undefined,
              previewUrl: comparisonResultImageUrl,
              thumbnailUrl: comparisonResultImageUrl,
            }
          : null,
      ]
    : content.features.map(
        (_, index) =>
          previewItems[index % Math.max(previewItems.length, 1)] || null,
      );
  const stepPromptText =
    showcaseTemplateItem?.prompt ||
    content.features[1]?.description ||
    content.sectionIntro;
  const isTwoStepGuide = content.steps.length === 2;

  return (
    <section className="space-y-8 pb-8 pt-4">
      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[52rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {content.features.map((feature, index) => {
            const preview = featurePreviews[index];
            const isReversed = index % 2 === 1;
            const mediaUrl = preview?.previewUrl || preview?.thumbnailUrl;
            const posterUrl = preview?.thumbnailUrl || preview?.previewUrl;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed && "lg:order-2")}>
                  <div className="overflow-hidden rounded-[24px] border border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)]">
                    {preview?.previewClipUrl ? (
                      <video
                        src={preview.previewClipUrl}
                        poster={posterUrl || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : mediaUrl ? (
                      <img
                        src={withOssImageMaxSide(mediaUrl, 2000) || mediaUrl}
                        alt={preview?.title || feature.title}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn("px-1 sm:px-2", isReversed && "lg:order-1")}>
                  <h3 className="text-[1.45rem] font-semibold leading-[1.12] tracking-[-0.04em] text-[#23282F] sm:text-[1.8rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[44rem] text-center">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            {content.stepsTitle}
          </h2>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-5",
            isTwoStepGuide
              ? "lg:mx-auto lg:max-w-[760px] lg:grid-cols-2"
              : "lg:grid-cols-3",
          )}
        >
          {content.steps.map((step, index) => {
            return (
              <article
                key={step.title}
                className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6]"
              >
                <div className="overflow-hidden border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)]">
                  {index === 0 ? (
                    <div className="relative aspect-[4/5] w-full p-4">
                      <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                        {showcasePoseRefImageUrl ? (
                          <img
                            src={
                              withOssImageResize(
                                showcasePoseRefImageUrl,
                                900,
                                1125,
                              ) || showcasePoseRefImageUrl
                            }
                            alt={showcaseTemplateItem?.title || step.title}
                            className="aspect-[4/5] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                            <Sparkles className="size-8 text-[#9AA3AF]" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-7 left-7 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5600] shadow-[0_8px_20px_rgba(35,40,47,0.08)]">
                        {isImageToImageGuide ? "Ref" : "Source"}
                      </div>
                    </div>
                  ) : index === 1 ? (
                    isTwoStepGuide && showcaseResultImageUrl ? (
                      <div className="relative aspect-[4/5] w-full p-4">
                        <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                          <img
                            src={
                              withOssImageResize(
                                showcaseResultImageUrl,
                                900,
                                1125,
                              ) || showcaseResultImageUrl
                            }
                            alt={showcaseTemplateItem?.title || step.title}
                            className="aspect-[4/5] w-full object-contain"
                          />
                        </div>
                        <div className="absolute bottom-7 left-7 rounded-full bg-[#23282F] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_20px_rgba(35,40,47,0.12)]">
                          Result
                        </div>
                      </div>
                    ) : isImageUpscalerGuide ? (
                      <div className="relative aspect-[4/5] w-full p-4">
                        <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                          {showcasePoseRefImageUrl ? (
                            <img
                              src={
                                withOssImageResize(
                                  showcasePoseRefImageUrl,
                                  900,
                                  1125,
                                ) || showcasePoseRefImageUrl
                              }
                              alt={showcaseTemplateItem?.title || step.title}
                              className="aspect-[4/5] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                              <Sparkles className="size-8 text-[#9AA3AF]" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-7 bottom-7 rounded-[20px] bg-white/96 p-4 shadow-[0_12px_30px_rgba(35,40,47,0.12)] backdrop-blur-sm">
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5600]">
                            Settings
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#23282F] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                              4K
                            </span>
                            <span className="rounded-full bg-[#F3F4F6] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#23282F]">
                              JPEG
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#23282F]">
                            Select the target resolution and export format you
                            need before generating the upscale.
                          </p>
                        </div>
                      </div>
                    ) : isImageEraserGuide ? (
                      <div className="relative aspect-[4/5] w-full p-4">
                        <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                          {showcasePoseRefImageUrl ? (
                            <img
                              src={
                                withOssImageResize(
                                  showcasePoseRefImageUrl,
                                  900,
                                  1125,
                                ) || showcasePoseRefImageUrl
                              }
                              alt={showcaseTemplateItem?.title || step.title}
                              className="aspect-[4/5] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                              <Sparkles className="size-8 text-[#9AA3AF]" />
                            </div>
                          )}
                          {showcaseMaskImageUrl ? (
                            <div
                              className="pointer-events-none absolute inset-0 bg-[#FF5A3D]/45"
                              style={{
                                WebkitMaskImage: `url("${withOssImageResize(showcaseMaskImageUrl, 900, 1125) || showcaseMaskImageUrl}")`,
                                maskImage: `url("${withOssImageResize(showcaseMaskImageUrl, 900, 1125) || showcaseMaskImageUrl}")`,
                                WebkitMaskSize: "cover",
                                maskSize: "cover",
                                WebkitMaskPosition: "center",
                                maskPosition: "center",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="absolute bottom-7 left-7 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5600] shadow-[0_8px_20px_rgba(35,40,47,0.08)]">
                          Erase Area
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[4/5] w-full p-4">
                        <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                          {showcasePoseRefImageUrl ? (
                            <img
                              src={
                                withOssImageResize(
                                  showcasePoseRefImageUrl,
                                  900,
                                  1125,
                                ) || showcasePoseRefImageUrl
                              }
                              alt={showcaseTemplateItem?.title || step.title}
                              className="aspect-[4/5] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                              <Sparkles className="size-8 text-[#9AA3AF]" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-x-7 bottom-7 rounded-[20px] bg-white/96 p-4 shadow-[0_12px_30px_rgba(35,40,47,0.12)] backdrop-blur-sm">
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5600]">
                            Prompt
                          </div>
                          <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#23282F]">
                            {stepPromptText}
                          </p>
                        </div>
                      </div>
                    )
                  ) : isImageEraserGuide && showcaseResultImageUrl ? (
                    <div className="relative aspect-[4/5] w-full p-4">
                      <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                        <img
                          src={
                            withOssImageResize(
                              showcaseResultImageUrl,
                              900,
                              1125,
                            ) || showcaseResultImageUrl
                          }
                          alt={showcaseTemplateItem?.title || step.title}
                          className="aspect-[4/5] w-full object-cover"
                        />
                      </div>
                      <div className="absolute right-7 top-7 rounded-full bg-[#23282F] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_20px_rgba(35,40,47,0.12)]">
                        Result
                      </div>
                    </div>
                  ) : showcaseResultImageUrl ? (
                    <div className="relative aspect-[4/5] w-full p-4">
                      <div className="absolute left-1/2 top-1/2 w-[64%] -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_18px_36px_rgba(35,40,47,0.12)]">
                        <img
                          src={
                            withOssImageResize(
                              showcaseResultImageUrl,
                              720,
                              900,
                            ) || showcaseResultImageUrl
                          }
                          alt={showcaseTemplateItem?.title || step.title}
                          className="aspect-[4/5] w-full object-cover"
                        />
                      </div>
                      {showcasePoseRefImageUrl ? (
                        <div className="absolute right-[18%] top-[16%] w-[38%] rotate-[8deg] overflow-hidden rounded-[16px] border border-white/80 bg-white shadow-[0_14px_28px_rgba(35,40,47,0.12)]">
                          <img
                            src={
                              withOssImageResize(
                                showcasePoseRefImageUrl,
                                480,
                                600,
                              ) || showcasePoseRefImageUrl
                            }
                            alt={showcaseTemplateItem?.title || step.title}
                            className="aspect-[4/5] w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="absolute right-7 top-7 rounded-full bg-[#23282F] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_20px_rgba(35,40,47,0.12)]">
                        Result
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                      <Sparkles className="size-8 text-[#9AA3AF]" />
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="text-sm font-semibold text-[#7A5600]">
                    {`0${index + 1}`}
                  </div>
                  <h3 className="mt-2 text-[1.2rem] font-semibold leading-6 text-[#23282F]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                    {step.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[42rem] text-center">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            {content.faqTitle}
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-[980px] space-y-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#f1df9c] bg-[linear-gradient(135deg,#ffc100_0%,#ffd966_62%,#fff0b5_100%)] p-6 text-center shadow-[0_18px_48px_rgba(255,193,0,0.18)] sm:p-8">
        <h2 className="mx-auto max-w-[24ch] text-balance text-[2rem] font-bold leading-[1.06] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          {content.ctaTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-[40rem] text-sm leading-7 text-[#4A5464] sm:text-base">
          {content.ctaDescription}
        </p>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-[62px] items-center justify-center rounded-full bg-[#23282F] px-8 text-base font-semibold text-white transition hover:opacity-95"
        >
          {content.ctaButton}
        </button>
      </section>
    </section>
  );
}

function AiKissingHeroSection({ content }: { content: ReplicaHeroContent }) {
  return (
    <section className="px-3 pt-2 sm:px-6 xl:px-0">
      <div className="mx-auto max-w-[980px] text-center">
        <h1 className="text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#2E3138] sm:text-[2.45rem]">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[54rem] text-balance text-[1rem] leading-7 text-[#5E6570] sm:text-[1.08rem]">
          {content.intro}
        </p>
      </div>
    </section>
  );
}

function ImageEffectsLandingSection({
  content,
  previewItems,
  onCtaClick,
}: {
  content: ImageEffectsLandingContent;
  previewItems: ImageEffectItem[];
  onCtaClick: () => void;
}) {
  const featureCards = content.features.map((feature, index) => ({
    ...feature,
    preview: previewItems[index % Math.max(previewItems.length, 1)],
  }));
  const stepCards = content.steps.map((step, index) => ({
    ...step,
    preview: previewItems[(index + 1) % Math.max(previewItems.length, 1)],
  }));
  const uploadStepImage =
    previewItems[0]?.previewExample?.inputImageUrl ||
    previewItems[0]?.previewExample?.inputImageUrls?.[0] ||
    previewItems[0]?.examples?.[0]?.inputImageUrl ||
    previewItems[0]?.examples?.[0]?.inputImageUrls?.[0] ||
    previewItems[0]?.posterUrl ||
    previewItems[0]?.coverUrl;
  const getStepOutputPreviewImage = (item?: ImageEffectItem | null) =>
    item?.previewExample?.outputImageUrl ||
    item?.examples?.[0]?.outputImageUrl ||
    item?.posterUrl ||
    null;
  const selectStepImages = previewItems
    .slice(0, 3)
    .map(
      (item) =>
        item.coverUrl ||
        item.previewExample?.outputImageUrl ||
        item.examples?.[0]?.outputImageUrl,
    )
    .filter((value): value is string => Boolean(value));
  const applyStepImage =
    getStepOutputPreviewImage(stepCards[1]?.preview) ||
    previewItems
      .map((item) => getStepOutputPreviewImage(item))
      .find((value): value is string => Boolean(value)) ||
    null;
  const isTwoStepGuide = stepCards.length === 2;
  const getFeaturePreviewImage = (item?: ImageEffectItem | null) =>
    item?.previewExample?.outputImageUrl ||
    item?.examples?.[0]?.outputImageUrl ||
    item?.posterUrl ||
    item?.coverUrl ||
    null;

  return (
    <section className="space-y-6">
      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="max-w-[52rem]">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            {content.sectionTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#4A5464] sm:text-base">
            {content.sectionIntro}
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {featureCards.map((feature) => {
            const featurePreviewImage = getFeaturePreviewImage(feature.preview);

            return (
              <article
                key={feature.title}
                className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6]"
              >
                <div className="border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)]">
                  <div className="overflow-hidden bg-[#F5F7F9]">
                    {featurePreviewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          withOssImageResize(featurePreviewImage, 960, 1200) ||
                          featurePreviewImage
                        }
                        alt={feature.preview?.title || feature.title}
                        className="aspect-[4/5] w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#23282F]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="max-w-[44rem]">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            {content.stepsTitle}
          </h2>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-5",
            isTwoStepGuide
              ? "lg:mx-auto lg:max-w-[760px] lg:grid-cols-2"
              : "lg:grid-cols-3",
          )}
        >
          {stepCards.map((step, index) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6]"
            >
              <div className="border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)] p-4">
                <div className="overflow-hidden rounded-[22px] bg-[#F5F7F9]">
                  {index === 0 && uploadStepImage ? (
                    <div className="flex h-[10rem] items-center justify-center bg-[#F1F3F8] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          withOssImageResize(uploadStepImage, 720, 720) ||
                          uploadStepImage
                        }
                        alt={step.title}
                        className="h-full w-full rounded-[18px] object-contain bg-[#DDE2EC]"
                      />
                    </div>
                  ) : null}

                  {index === 1 ? (
                    isTwoStepGuide ? (
                      applyStepImage ? (
                        <div className="flex h-[10rem] items-center justify-center bg-[#F1F3F8] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              withOssImageResize(applyStepImage, 720, 720) ||
                              applyStepImage
                            }
                            alt={step.title}
                            className="h-full w-full rounded-[18px] object-contain bg-[#DDE2EC]"
                          />
                        </div>
                      ) : (
                        <div className="flex h-[10rem] items-center justify-center">
                          <Sparkles className="size-8 text-[#9AA3AF]" />
                        </div>
                      )
                    ) : selectStepImages.length > 0 ? (
                      <div className="grid h-[10rem] grid-cols-3 gap-3 bg-[#F1F3F8] p-3">
                        {selectStepImages.map((url, imageIndex) => (
                          <div
                            key={`${url}-${imageIndex}`}
                            className="overflow-hidden rounded-[14px] bg-[#DDE2EC]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={withOssImageResize(url, 480, 360) || url}
                              alt={`${step.title} ${imageIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-[10rem] items-center justify-center">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )
                  ) : null}

                  {index === 2 && applyStepImage ? (
                    <div className="flex h-[10rem] items-center justify-center bg-[#F1F3F8] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          withOssImageResize(applyStepImage, 720, 720) ||
                          applyStepImage
                        }
                        alt={step.title}
                        className="h-full w-full rounded-[18px] object-contain bg-[#DDE2EC]"
                      />
                    </div>
                  ) : null}

                  {((index === 0 && !uploadStepImage) ||
                    (index === 2 && !applyStepImage)) && (
                    <div className="flex h-[10rem] items-center justify-center">
                      <Sparkles className="size-8 text-[#9AA3AF]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#23282F] px-3 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#23282F]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="max-w-[44rem]">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            {content.faqTitle}
          </h2>
        </div>

        <div className="mt-8 grid gap-4">
          {content.faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-base font-semibold text-[#23282F] sm:text-lg">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] overflow-hidden rounded-[32px] border border-[#E7D173] bg-[linear-gradient(135deg,#FFC100_0%,#FFD75A_55%,#FFF0B5_100%)] p-6 shadow-[0_22px_56px_rgba(255,193,0,0.18)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[44rem]">
            <h2 className="text-balance text-[2rem] font-bold leading-[1.02] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
              {content.ctaTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#4A5464] sm:text-base">
              {content.ctaDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={onCtaClick}
            className="inline-flex min-h-[62px] items-center justify-center rounded-full bg-[#23282F] px-7 text-base font-semibold text-white shadow-[0_18px_36px_rgba(35,40,47,0.2)] transition hover:scale-[1.01] hover:bg-[#333333]"
          >
            {content.ctaButton}
          </button>
        </div>
      </section>
    </section>
  );
}

function enqueueLibraryPreviewLoad(task: PreviewLoadTask) {
  if (activeLibraryPreviewLoads < LIBRARY_MAX_CONCURRENT_PREVIEWS) {
    activeLibraryPreviewLoads += 1;
    task.run();
    return;
  }

  pendingLibraryPreviewLoads.push(task);
}

function removeLibraryPreviewLoad(taskId: string) {
  const index = pendingLibraryPreviewLoads.findIndex(
    (task) => task.id === taskId,
  );
  if (index >= 0) {
    pendingLibraryPreviewLoads.splice(index, 1);
  }
}

function completeLibraryPreviewLoad() {
  activeLibraryPreviewLoads = Math.max(0, activeLibraryPreviewLoads - 1);
  const nextTask = pendingLibraryPreviewLoads.shift();
  if (nextTask) {
    activeLibraryPreviewLoads += 1;
    nextTask.run();
  }
}

const TOOL_ALIAS_TO_SCENE_PATH: Record<string, string> = {
  "text-to-image": "/text-to-image",
  "image-to-image": "/image-to-image",
  "text-to-video": "/text-to-video",
  "image-to-video": "/image-to-video",
  photoshoot: "/image-to-image",
  "editor-combiner": "/image-to-image",
  "image-effect": "/image-to-image",
  "image-effects": "/image-to-image",
  variations: "/image-to-image",
  "video-effect": "/image-to-video",
  "video-effects": "/image-to-video",
};

const TOOL_ALIAS_TO_LABEL_KEY: Record<string, string> = {
  photoshoot: "aliases.photoshoot",
  "editor-combiner": "aliases.editorCombiner",
  "image-effect": "aliases.imageEffects",
  "image-effects": "aliases.imageEffects",
  variations: "aliases.variations",
  "video-effect": "aliases.videoEffects",
  "video-effects": "aliases.videoEffects",
};

const CANONICAL_TOOL_ALIAS_EXCEPTIONS = new Set([
  "text-to-image",
  "image-to-image",
  "text-to-video",
  "image-to-video",
  "photoshoot",
  "editor-combiner",
  "image-effect",
  "image-effects",
  "variations",
  "video-effect",
  "video-effects",
]);

let toolLibraryOverridesPromise: Promise<
  ToolLibraryOverrideDefinition[]
> | null = null;

async function loadToolLibraryOverrides() {
  if (!toolLibraryOverridesPromise) {
    toolLibraryOverridesPromise =
      import("@/shared/lib/fixed-tools-library").then(
        (module) => module.TOOL_LIBRARY_OVERRIDES,
      );
  }

  return toolLibraryOverridesPromise;
}

function normalizeToolParam(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function normalizeToolAlias(value: string) {
  return normalizeToolParam(value).split("/")[0] || "";
}

function getAliasedEffectSlug(
  toolParam: string,
  aliases: string[],
  availableSlugs: string[],
) {
  const normalized = normalizeToolParam(toolParam);
  if (!normalized) return null;

  const [alias, effectSlug] = normalized.split("/");
  if (!aliases.includes(alias) || !effectSlug) {
    return null;
  }

  return availableSlugs.includes(effectSlug) ? effectSlug : null;
}

function parseToolParam(toolParam: string) {
  const normalized = toolParam.trim().replace(/^\/+|\/+$/g, "");
  const aliasedScenePath = TOOL_ALIAS_TO_SCENE_PATH[normalized];

  if (aliasedScenePath) {
    return {
      scenePath: aliasedScenePath,
      modelSlug: "",
    };
  }

  if (!normalized) {
    return {
      scenePath: undefined,
      modelSlug: "",
    };
  }

  if (!normalized.includes("~")) {
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length > 1) {
      return {
        scenePath: `/${segments.slice(0, -1).join("/")}`,
        modelSlug: segments[segments.length - 1] || "",
      };
    }

    return {
      scenePath: undefined,
      modelSlug: normalized,
    };
  }

  const [sceneKey, ...rest] = normalized.split("~");
  return {
    scenePath: sceneKey ? `/${sceneKey.replace(/^\/+/, "")}` : undefined,
    modelSlug: rest.join("~").trim(),
  };
}

function mapSceneItems(items: NavItem[]): NavItem[] {
  return items
    .map((item) => {
      const firstChild =
        item.children?.find((child) => child.url) || item.children?.[0];
      const derivedSceneUrl = firstChild?.url
        ? `/${firstChild.url.split("/").filter(Boolean).slice(0, -1).join("/")}`
        : undefined;

      return {
        ...item,
        url: item.url || derivedSceneUrl || firstChild?.url,
        description: item.description || firstChild?.description,
        badge: item.badge || firstChild?.badge,
        icon: item.icon || firstChild?.icon,
        icon_url: item.icon_url || firstChild?.icon_url,
      };
    })
    .filter((item) => Boolean(item.url));
}

function isHiddenAiScene(item?: NavItem) {
  if (!item) return false;
  const url = `${item.url || item.children?.[0]?.url || ""}`.toLowerCase();
  const title = `${item.title || ""} ${item.name || ""}`.toLowerCase();

  return (
    url.includes("/video-face-swap") ||
    url.includes("video-face-swap") ||
    title.includes("video face swap")
  );
}

function getToolSlug(tool?: NavItem | null) {
  return tool?.url?.split("/").filter(Boolean).pop() || "";
}

function sceneContainsSlug(scene: NavItem, slug: string | null) {
  if (!slug) return false;
  if (getToolSlug(scene) === slug) return true;
  return scene.children?.some((child) => getToolSlug(child) === slug) || false;
}

function findCurrentScene(navItems: NavItem[], toolSlug: string) {
  const { scenePath, modelSlug } = parseToolParam(toolSlug);
  const imageRoot = navItems.find((item) => item.icon === "Image");
  const videoRoot = navItems.find((item) => item.icon === "Video");
  const imageScenes = imageRoot?.children
    ? mapSceneItems(imageRoot.children)
    : [];
  const videoScenes = videoRoot?.children
    ? mapSceneItems(videoRoot.children)
    : [];
  const allScenes = [
    ...imageScenes.map((scene) => ({ category: "Image" as const, scene })),
    ...videoScenes.map((scene) => ({ category: "Video" as const, scene })),
  ];
  const matchedEntry =
    allScenes.find((entry) => {
      if (scenePath) {
        if (entry.scene.url === scenePath) {
          return true;
        }

        return (
          entry.scene.children?.some((child) => {
            if (!child.url) return false;
            return (
              child.url.startsWith(`${scenePath}/`) &&
              getToolSlug(child) === modelSlug
            );
          }) || false
        );
      }

      return sceneContainsSlug(entry.scene, modelSlug);
    }) ||
    allScenes.find((entry) => !isHiddenAiScene(entry.scene)) ||
    null;

  return {
    currentScene: matchedEntry?.scene || null,
    category: matchedEntry?.category || "Image",
  };
}

function getCurrentModelUrl(scene: NavItem | null, toolSlug: string) {
  if (!scene) return "";
  const { modelSlug } = parseToolParam(toolSlug);
  const matchedChild = scene.children?.find(
    (child) => getToolSlug(child) === modelSlug,
  );
  if (matchedChild?.url) {
    return matchedChild.url;
  }
  return resolveDefaultSceneModelUrl(scene);
}

function resolveDefaultSceneModelUrl(scene: NavItem | null) {
  if (!scene) {
    return "";
  }

  const candidates = [
    ...(scene.children?.map((child) => child.url).filter(Boolean) ?? []),
  ]
    .concat(scene.url ? [scene.url] : [])
    .filter(Boolean) as string[];

  const isTextToImageScene =
    scene.url?.startsWith("/text-to-image") ||
    candidates.some((url) => url.startsWith("/text-to-image/"));
  if (isTextToImageScene) {
    return DEFAULT_TEXT_TO_IMAGE_MODEL_URL;
  }

  const isImageToImageScene =
    scene.url?.startsWith("/image-to-image") ||
    candidates.some((url) => url.startsWith("/image-to-image/"));
  if (isImageToImageScene) {
    return DEFAULT_IMAGE_TO_IMAGE_MODEL_URL;
  }

  const isTextToVideoScene =
    scene.url?.startsWith("/text-to-video") ||
    candidates.some((url) => url.startsWith("/text-to-video/"));
  if (isTextToVideoScene) {
    return "/text-to-video/seedance-2-0";
  }

  const isImageToVideoScene =
    scene.url?.startsWith("/image-to-video") ||
    candidates.some((url) => url.startsWith("/image-to-video/"));
  if (isImageToVideoScene) {
    return DEFAULT_IMAGE_TO_VIDEO_MODEL_URL;
  }

  return scene.children?.find((child) => child.url)?.url || scene.url || "";
}

function getCanonicalSceneTool(scene: NavItem | null) {
  if (!scene) {
    return "";
  }

  const firstChildUrl = scene.children?.find((child) => child.url)?.url;
  if (firstChildUrl) {
    const segments = firstChildUrl.split("/").filter(Boolean);
    if (segments.length > 1) {
      return segments.slice(0, -1).join("/");
    }
    return segments[0] || "";
  }

  return scene.url?.replace(/^\/+/, "") || "";
}

function buildToolsRouteFromSceneUrl(sceneUrl: string) {
  const normalized = sceneUrl.startsWith("/") ? sceneUrl : `/${sceneUrl}`;
  return `/tools${normalized}`;
}

function findFirstSceneUrl(
  navItems: NavItem[],
  predicate: (url: string) => boolean,
) {
  const visit = (items: NavItem[]): string | null => {
    for (const item of items) {
      if (item.url && predicate(item.url)) {
        return item.url;
      }
      const childMatch = item.children ? visit(item.children) : null;
      if (childMatch) {
        return childMatch;
      }
    }

    return null;
  };

  return visit(navItems);
}

function getSceneLabel(scene?: NavItem | null, fallbackLabel = "") {
  return scene?.title || scene?.name || fallbackLabel;
}

function getModelLabel(
  scene: NavItem | null,
  modelUrl: string,
  config?: PlaygroundConfig,
  fallbackLabel = "",
) {
  const childLabel =
    scene?.children?.find((child) => child.url === modelUrl)?.title ||
    scene?.children?.find((child) => child.url === modelUrl)?.name;

  return childLabel || config?.model.name || fallbackLabel;
}

function getModelOptions(
  scene: NavItem | null,
  fallbackLabels?: {
    scene?: string;
    model?: string;
  },
) {
  if (!scene) return [];
  const sceneFallback = fallbackLabels?.scene || "";
  const modelFallback = fallbackLabels?.model || "";

  const models = scene.children?.filter((child) => child.url) || [];
  const isImageToImageScene =
    scene.url?.startsWith("/image-to-image") ||
    models.some((child) => child.url?.startsWith("/image-to-image/"));

  if (models.length === 0 && scene.url) {
    if (isImageToImageScene) {
      const label = "GPT-Image 2";
      return [
        {
          label,
          url: DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
          monogram: "GI",
          iconUrl:
            getModelVendorLogo({
              url: DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
              title: label,
            }).url || scene.icon_url,
        },
      ];
    }

    return [
      {
        label: getSceneLabel(scene, sceneFallback),
        url: scene.url,
        monogram: getSceneLabel(scene, sceneFallback)
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
        iconUrl: scene.icon_url,
      },
    ];
  }

  const options = models
    .map((model) => {
      const label = model.title || model.name || modelFallback;
      return {
        label,
        url: model.url!,
        monogram: label
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
        badge: model.badge,
        iconUrl:
          getModelVendorLogo({ url: model.url, title: label }).url ||
          model.icon_url ||
          scene.icon_url,
      };
    })
    .filter((option) => option.url !== "/image-to-image");

  if (
    isImageToImageScene &&
    !options.some((model) => model.url === DEFAULT_IMAGE_TO_IMAGE_MODEL_URL)
  ) {
    options.unshift({
      label: "GPT-Image 2",
      url: DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
      monogram: "GI",
      badge: undefined,
      iconUrl:
        getModelVendorLogo({
          url: DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
          title: "GPT-Image 2",
        }).url || scene.icon_url,
    });
  }

  return options;
}

async function modelSupportsMultipleReferenceImages(modelUrl: string) {
  const config = await getPlaygroundConfigByUrl(modelUrl);
  const referenceImagesField = config?.schema.referenceImages;
  return (
    config?.scenarioType === "image-to-image" &&
    Boolean(referenceImagesField?.multiple) &&
    typeof referenceImagesField?.maxFiles === "number" &&
    referenceImagesField.maxFiles > 1
  );
}

function getDefaultValues(config?: PlaygroundConfig) {
  if (!config) {
    return {};
  }

  const initialValues: Record<string, any> = {};
  Object.entries(config.schema).forEach(([key, field]) => {
    if (field) {
      initialValues[key] = field.defaultValue;
    }
  });

  return initialValues;
}

function buildOptionalReferenceImagesField() {
  return {
    type: "upload" as const,
    label: "Reference Image",
    description: "Upload an optional reference image to influence style.",
    defaultValue: [],
    required: false,
    accept: "image/*",
    multiple: false,
    maxFiles: 1,
  };
}

function buildReferenceImagesFromTemplateItem(item: WorkbenchTemplateItem) {
  if (Array.isArray(item.params?.referenceImages)) {
    return item.params.referenceImages as ImageUploaderValue[];
  }

  if (!item.referencePreviewUrls[0]) {
    return undefined;
  }

  return [
    {
      id: `style-reference-${item.id}`,
      preview: item.referencePreviewUrls[0],
      url: item.referencePreviewUrls[0],
      status: "uploaded",
    } satisfies ImageUploaderValue,
  ];
}

function getStylePreviewUrlFromTemplateItem(item: WorkbenchTemplateItem) {
  return (
    item.resultPreviewUrl ||
    item.previewUrl ||
    item.thumbnailUrl ||
    item.sourcePreviewUrl ||
    item.referencePreviewUrls[0] ||
    ""
  );
}

function buildStyleAwareConfig(
  config?: PlaygroundConfig,
  templateItems: WorkbenchTemplateItem[] = [],
) {
  if (!config) {
    return undefined;
  }

  if (
    config.model.id === "image-background-remover" ||
    config.creditScenario === "image-background-remover"
  ) {
    return config;
  }

  const styleEntries = new Map<
    string,
    {
      label: string;
      value: string;
      prompt?: string;
      referenceImages?: ImageUploaderValue[];
      previewUrl?: string;
      previewClipUrl?: string;
      mediaType?: "image" | "video";
    }
  >();

  templateItems.forEach((item) => {
    const rawStyle =
      (typeof item.params?.style === "string" && item.params.style.trim()) ||
      (typeof item.title === "string" && item.title.trim()) ||
      "";
    if (!rawStyle || styleEntries.has(rawStyle)) {
      return;
    }

    const prompt =
      typeof item.params?.prompt === "string" && item.params.prompt.trim()
        ? item.params.prompt.trim()
        : item.prompt.trim();

    styleEntries.set(rawStyle, {
      label: rawStyle,
      value: rawStyle,
      prompt: prompt || undefined,
      referenceImages: buildReferenceImagesFromTemplateItem(item),
      previewUrl: getStylePreviewUrlFromTemplateItem(item) || undefined,
      previewClipUrl: item.previewClipUrl || undefined,
      mediaType: item.mediaType,
    });
  });

  const hasStyleField = Boolean(config.schema.style);
  if (styleEntries.size === 0 && !hasStyleField) {
    return config;
  }

  const styleOptions = Array.from(styleEntries.values()).map((entry) => ({
    label: entry.label,
    value: entry.value,
  }));
  const linkedValuesByOption = Object.fromEntries(
    Array.from(styleEntries.values()).map((entry) => [
      entry.value,
      {
        ...(entry.prompt ? { prompt: entry.prompt } : {}),
        ...(entry.referenceImages?.length
          ? { referenceImages: entry.referenceImages }
          : {}),
        ...(entry.previewUrl ? { previewUrl: entry.previewUrl } : {}),
        ...(entry.previewClipUrl
          ? { previewClipUrl: entry.previewClipUrl }
          : {}),
        ...(entry.mediaType ? { mediaType: entry.mediaType } : {}),
      },
    ]),
  );

  const baseStyleField = config.schema.style;
  const nextStyleField =
    hasStyleField || styleOptions.length > 0
      ? {
          type: "select" as const,
          label: baseStyleField?.label || "Style",
          description: baseStyleField?.description,
          placeholder: baseStyleField?.placeholder,
          defaultValue: baseStyleField?.defaultValue ?? "",
          options:
            baseStyleField?.options && baseStyleField.options.length > 0
              ? baseStyleField.options
              : styleOptions,
          visible: baseStyleField?.visible,
          required: false,
          linkedValuesByOption,
        }
      : undefined;

  const needsReferenceImagesField =
    !config.schema.referenceImages &&
    Array.from(styleEntries.values()).some(
      (entry) => entry.referenceImages && entry.referenceImages.length > 0,
    );

  const nextSchema = {
    prompt: config.schema.prompt,
  } as PlaygroundConfig["schema"];

  if (config.schema.referenceImages) {
    nextSchema.referenceImages = config.schema.referenceImages;
  } else if (needsReferenceImagesField) {
    nextSchema.referenceImages = buildOptionalReferenceImagesField();
  }

  if (nextStyleField) {
    nextSchema.style = nextStyleField;
  }

  Object.entries(config.schema).forEach(([key, field]) => {
    if (
      !field ||
      key === "referenceImages" ||
      key === "prompt" ||
      key === "style"
    ) {
      return;
    }

    nextSchema[key] = field;
  });

  return {
    ...config,
    schema: nextSchema,
  } satisfies PlaygroundConfig;
}

function parseCreationParams(value?: string | null) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function sanitizeEffectDisplayText(value?: string | null) {
  if (typeof value !== "string") return "";

  return value
    .replace(/\/tools\/image-effects?/gi, "")
    .replace(/\/tools\/video-effects?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizeComparableAssetUrl(value?: string | null) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname}`;
  } catch {
    return trimmed.split("?")[0]?.split("#")[0] || trimmed;
  }
}

function mapCreationItemToGeneratedMediaItem(
  item: WorkbenchCreationItem,
): GeneratedMediaItem {
  const parsedParams = parseCreationParams(item.params);
  const prompt = sanitizeEffectDisplayText(
    item.prompt || String(parsedParams.prompt || ""),
  );

  return {
    url: item.url,
    previewUrl: item.url,
    params: {
      ...parsedParams,
      creationRecordId: item.id,
    },
    aspectRatio: item.aspectRatio || String(parsedParams.aspectRatio || "1:1"),
    mediaKind:
      item.mediaType === "video" || item.mediaType === "audio"
        ? (item.mediaType as "video" | "audio")
        : "image",
    createdAt: item.createdAt,
    sceneId: item.sceneId || undefined,
    modelUrl: item.modelUrl || undefined,
    prompt,
  };
}

function formatRelativeDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / minute))}m ago`;
  }

  if (diff < day) {
    return `${Math.max(1, Math.round(diff / hour))}h ago`;
  }

  return `${Math.max(1, Math.round(diff / day))}d ago`;
}

function resolveToolLibraryOverride({
  toolParam,
  sceneUrl,
  overrides,
}: {
  toolParam: string;
  sceneUrl?: string | null;
  overrides: ToolLibraryOverrideDefinition[];
}) {
  const normalizedTool = normalizeToolParam(toolParam);
  const toolMatched =
    overrides.find((override) => {
      const { exactToolParams, toolPrefixes } = override.match;

      if (exactToolParams?.includes(normalizedTool)) {
        return true;
      }

      if (toolPrefixes?.some((prefix) => normalizedTool.startsWith(prefix))) {
        return true;
      }

      return false;
    }) || null;

  if (toolMatched) {
    return toolMatched;
  }

  return (
    overrides.find((override) => {
      const { scenePaths } = override.match;

      if (sceneUrl && scenePaths?.includes(sceneUrl)) {
        return true;
      }

      return false;
    }) || null
  );
}

function buildOverrideLibraryItems({
  override,
  sceneId,
  sceneLabel,
}: {
  override: ToolLibraryOverrideDefinition;
  sceneId?: string;
  sceneLabel?: string;
}): WorkbenchTemplateItem[] {
  return override.items.map((item, index) => {
    const referencePreviewUrls = Array.isArray(item.params?.referenceImages)
      ? item.params.referenceImages
          .map(
            (entry: { preview?: string; url?: string }) =>
              entry?.preview || entry?.url,
          )
          .filter((value): value is string => Boolean(value))
      : [];

    return {
      id: `${override.id}-${index}`,
      title: item.title,
      prompt: item.prompt,
      mediaType: override.mediaType,
      sceneId,
      sceneLabel,
      modelLabel: override.modelLabel,
      aspectRatio:
        typeof item.params?.aspectRatio === "string" && item.params.aspectRatio
          ? item.params.aspectRatio
          : override.defaultAspectRatio,
      previewUrl: item.generatedUrl || item.previewUrl,
      previewClipUrl: item.previewClipUrl,
      thumbnailUrl: item.thumbnailUrl,
      sourcePreviewUrl: referencePreviewUrls[0],
      resultPreviewUrl:
        item.generatedUrl || item.previewUrl || item.thumbnailUrl,
      resultPreviewUrls: Array.isArray(item.resultPreviewUrls)
        ? item.resultPreviewUrls.filter(Boolean)
        : [],
      referencePreviewUrls,
      params: { ...item.params },
    };
  });
}

function ToolPreview({
  item,
  className,
  onPreviewSettled,
}: {
  item: {
    mediaType: "image" | "video";
    previewUrl?: string;
    previewClipUrl?: string;
    thumbnailUrl?: string;
    sourcePreviewUrl?: string;
    resultPreviewUrl?: string;
    title: string;
    referencePreviewUrls?: string[];
  };
  className?: string;
  onPreviewSettled?: () => void;
}) {
  const videoSource = item.previewClipUrl || item.previewUrl || "";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoHovering, setIsVideoHovering] = useState(false);
  const proxiedVideoPoster = videoSource
    ? `/api/video-poster?src=${encodeURIComponent(videoSource)}&width=960&snapshotTime=1000`
    : undefined;
  const imageSrc =
    item.mediaType === "video"
      ? proxiedVideoPoster ||
        item.thumbnailUrl ||
        getVideoPosterUrl(videoSource, {
          width: 960,
          height: 0,
          snapshotTime: 1000,
          quality: 80,
        }) ||
        item.previewUrl ||
        item.previewClipUrl
      : withOssImageResize(
          item.thumbnailUrl || item.previewUrl || item.previewClipUrl,
          960,
          1200,
        );
  const primaryComparableUrl = normalizeComparableAssetUrl(
    item.resultPreviewUrl ||
      item.thumbnailUrl ||
      item.previewUrl ||
      item.previewClipUrl ||
      imageSrc,
  );
  const referencePreviewUrls = [
    ...(item.referencePreviewUrls || []),
    item.sourcePreviewUrl,
  ]
    .filter(Boolean)
    .filter((url) => normalizeComparableAssetUrl(url) !== primaryComparableUrl)
    .filter(
      (url, index, collection) =>
        collection.findIndex(
          (entry) =>
            normalizeComparableAssetUrl(entry) ===
            normalizeComparableAssetUrl(url),
        ) === index,
    )
    .slice(0, 1);

  useEffect(() => {
    if (!imageSrc) {
      onPreviewSettled?.();
    }
  }, [imageSrc, onPreviewSettled]);

  const handleVideoHoverStart = () => {
    setIsVideoHovering(true);
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {});
  };

  const handleVideoHoverEnd = () => {
    setIsVideoHovering(false);
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  if (item.mediaType === "video") {
    return (
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-[24px] bg-[#F5F7F9]",
          className,
        )}
        onMouseEnter={handleVideoHoverStart}
        onMouseLeave={handleVideoHoverEnd}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={item.title}
            className={cn(
              "absolute inset-0 h-full w-full bg-[#F5F7F9] object-contain transition-opacity duration-200",
              isVideoHovering ? "opacity-0" : "opacity-100",
            )}
            onLoad={onPreviewSettled}
            onError={onPreviewSettled}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,193,0,0.14),transparent_65%)]">
            <Clapperboard className="size-7 text-[#9AA3AF]" />
          </div>
        )}
        {videoSource ? (
          <video
            ref={videoRef}
            src={videoSource}
            poster={imageSrc}
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "absolute inset-0 h-full w-full bg-[#F5F7F9] object-contain transition-opacity duration-200",
              isVideoHovering ? "opacity-100" : "opacity-0",
            )}
            onLoadedData={onPreviewSettled}
            onError={onPreviewSettled}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/8 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-opacity duration-200",
              isVideoHovering ? "opacity-0" : "opacity-100",
            )}
          >
            <Play className="ml-1 size-5 fill-current" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-[#F5F7F9]",
        className,
      )}
    >
      {referencePreviewUrls.length > 0 ? (
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,193,0,0.12),transparent_60%)] p-3 sm:gap-4 sm:p-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-center">
              <span className="rounded-full bg-white/96 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#23282F] shadow-[0_8px_20px_rgba(35,40,47,0.1)]">
                Ref
              </span>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-[#D8DEE6] bg-white shadow-[0_12px_30px_rgba(35,40,47,0.1)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  withOssImageResize(referencePreviewUrls[0], 720, 900) ||
                  referencePreviewUrls[0]
                }
                alt={`${item.title} reference`}
                className="h-full w-full bg-[#F5F7F9] object-cover"
                onLoad={onPreviewSettled}
                onError={onPreviewSettled}
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#23282F] text-white shadow-[0_12px_24px_rgba(35,40,47,0.18)] sm:size-12">
              <ChevronRight className="size-5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-center">
              <span className="rounded-full bg-[#23282F] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_20px_rgba(35,40,47,0.16)]">
                Generated
              </span>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-[#D8DEE6] bg-white shadow-[0_12px_30px_rgba(35,40,47,0.1)]">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={item.title}
                  className="h-full w-full bg-[#F5F7F9] object-cover"
                  onLoad={onPreviewSettled}
                  onError={onPreviewSettled}
                />
              ) : (
                <div className="flex h-full min-h-[12rem] w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,193,0,0.14),transparent_65%)]">
                  <ImageIcon className="size-7 text-[#9AA3AF]" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={item.title}
          className="h-full w-full bg-[#F5F7F9] object-contain"
          onLoad={onPreviewSettled}
          onError={onPreviewSettled}
        />
      ) : null}

      {!referencePreviewUrls.length && !imageSrc ? (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,193,0,0.14),transparent_65%)]">
          <ImageIcon className="size-7 text-[#9AA3AF]" />
        </div>
      ) : null}
    </div>
  );
}

function DeferredToolPreview({
  item,
  className,
  scrollRoot,
}: {
  item: {
    mediaType: "image" | "video";
    previewUrl?: string;
    previewClipUrl?: string;
    thumbnailUrl?: string;
    sourcePreviewUrl?: string;
    resultPreviewUrl?: string;
    title: string;
    referencePreviewUrls?: string[];
  };
  className?: string;
  scrollRoot?: HTMLDivElement | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canRenderPreview, setCanRenderPreview] = useState(false);
  const previewLoadAcquiredRef = useRef(false);
  const previewLoadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        root: scrollRoot ?? null,
        rootMargin: "320px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    if (!isVisible || canRenderPreview) {
      return;
    }

    const taskId = `library-preview-${item.title}-${Math.random().toString(36).slice(2, 8)}`;
    let cancelled = false;

    enqueueLibraryPreviewLoad({
      id: taskId,
      run: () => {
        if (cancelled) {
          completeLibraryPreviewLoad();
          return;
        }

        previewLoadAcquiredRef.current = true;
        if (previewLoadTimeoutRef.current) {
          window.clearTimeout(previewLoadTimeoutRef.current);
        }
        previewLoadTimeoutRef.current = window.setTimeout(() => {
          if (previewLoadAcquiredRef.current) {
            previewLoadAcquiredRef.current = false;
            completeLibraryPreviewLoad();
          }
        }, 12000);
        setCanRenderPreview(true);
      },
    });

    return () => {
      cancelled = true;
      removeLibraryPreviewLoad(taskId);
    };
  }, [canRenderPreview, isVisible, item.title]);

  useEffect(() => {
    return () => {
      if (previewLoadTimeoutRef.current) {
        window.clearTimeout(previewLoadTimeoutRef.current);
        previewLoadTimeoutRef.current = null;
      }
      if (previewLoadAcquiredRef.current) {
        previewLoadAcquiredRef.current = false;
        completeLibraryPreviewLoad();
      }
    };
  }, []);

  const handlePreviewSettled = () => {
    if (previewLoadTimeoutRef.current) {
      window.clearTimeout(previewLoadTimeoutRef.current);
      previewLoadTimeoutRef.current = null;
    }
    if (previewLoadAcquiredRef.current) {
      previewLoadAcquiredRef.current = false;
      completeLibraryPreviewLoad();
    }
  };

  return (
    <div ref={ref} className={className}>
      {isVisible && canRenderPreview ? (
        <ToolPreview
          item={item}
          className="h-full w-full rounded-[22px]"
          onPreviewSettled={handlePreviewSettled}
        />
      ) : (
        <div className="h-full w-full rounded-[22px] bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF1F4_100%)]" />
      )}
    </div>
  );
}

function LibraryLoadingPlaceholder({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div
        className={cn(
          "grid xl:grid-cols-2",
          isMobile ? "gap-2 px-0.5" : "gap-5",
        )}
      >
        {Array.from({ length: isMobile ? 3 : 4 }).map((_, index) => (
          <article
            key={`library-placeholder-${index}`}
            className={cn(
              "overflow-hidden",
              isMobile ? "rounded-[18px]" : "rounded-[24px]",
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden border border-[#E5E7EB] bg-white shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px]",
                isMobile ? "rounded-[18px]" : "rounded-[24px]",
              )}
            >
              <div className="absolute inset-x-0 top-0 z-10 p-3 sm:p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="h-7 w-2/3 rounded-full bg-[#EEF1F4]" />
                  </div>
                  <div className="h-11 w-32 rounded-full bg-[#EEF1F4]" />
                </div>
              </div>

              <div
                className={cn(
                  "relative px-3 pb-3 sm:px-4 sm:pb-4",
                  "pt-[4.75rem] sm:pt-[5.25rem]",
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[6rem] bg-[linear-gradient(180deg,rgba(255,248,222,0.98)_0%,rgba(255,248,222,0.88)_45%,rgba(255,248,222,0.3)_78%,rgba(255,248,222,0)_100%)]" />
                <div className="relative z-[1] space-y-2">
                  <div className="h-4 w-full rounded-full bg-[#F5F7F9]" />
                  <div className="h-4 w-[88%] rounded-full bg-[#F5F7F9]" />
                  <div className="h-4 w-[72%] rounded-full bg-[#F5F7F9]" />
                </div>
                <div
                  className={cn(
                    "relative z-[1] mt-3 overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF1F4_100%)]",
                    "h-[17rem] sm:h-[20rem] xl:h-[18rem]",
                  )}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ToolsDetailPage({
  navItems,
  initialTool,
  imageEffectsReplica = false,
  videoEffectsReplica = false,
  initialTemplateItems = [],
  initialLibraryResolved = false,
  initialIsMobile = false,
  renderMode = "page",
}: ToolsDetailPageProps) {
  const hasInitialLibraryItems = initialTemplateItems.length > 0;
  const isMobile = useIsMobile(initialIsMobile);
  const locale = useLocale();
  const router = useRouter();
  const { user, fetchUserInfo, setIsShowPaymentModal, setIsShowSignModal } =
    useAppContext();
  const tCreator = useTranslations("creator");
  const tGeneration = useTranslations("landing");
  const tDesktop = useTranslations("landing.wavespeed.desktopPlayground");
  const tCommonApi = useTranslations("common.api");
  const tDetail = useTranslations("creator.toolsDetailPage");
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });
  const initialToolAlias = normalizeToolAlias(initialTool);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() =>
    initialToolAlias === "image-upscaler" ? "creations" : "library",
  );
  const [config, setConfig] = useState<PlaygroundConfig | undefined>();
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [currentModelUrl, setCurrentModelUrl] = useState("");
  const [currentValues, setCurrentValues] = useState<Record<string, any>>({});
  const [templateItems, setTemplateItems] =
    useState<WorkbenchTemplateItem[]>(initialTemplateItems);
  const [creations, setCreations] = useState<WorkbenchCreationItem[]>([]);
  const [collections, setCollections] = useState<WorkbenchCollectionItem[]>([]);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(
    initialToolAlias !== "image-upscaler" &&
      (!initialLibraryResolved || !hasInitialLibraryItems),
  );
  const [loadedCreationsKey, setLoadedCreationsKey] = useState<string | null>(
    null,
  );
  const [hasLoadedCollections, setHasLoadedCollections] = useState(false);
  const [libraryRenderCount, setLibraryRenderCount] = useState(
    LIBRARY_INITIAL_RENDER_COUNT,
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [sessionGeneratedItems, setSessionGeneratedItems] = useState<
    GeneratedMediaItem[]
  >([]);
  const [pendingGenerationTasks, setPendingGenerationTasks] = useState<
    PendingGenerationTask[]
  >([]);
  const [libraryScrollRoot, setLibraryScrollRoot] =
    useState<HTMLDivElement | null>(null);
  const [selectedImageEffectSlug, setSelectedImageEffectSlug] = useState<
    string | null
  >(
    getAliasedEffectSlug(
      initialTool,
      ["image-effect", "image-effects"],
      getImageEffectItemsSync().map((item) => item.slug),
    ) || DEFAULT_IMAGE_EFFECT_SLUG,
  );
  const [imageEffectPrefillImages, setImageEffectPrefillImages] = useState<
    ImageUploaderValue[]
  >([]);
  const [imageEffectPrefillNonce, setImageEffectPrefillNonce] = useState(0);
  const [selectedVideoEffectSlug, setSelectedVideoEffectSlug] = useState<
    string | null
  >(
    getAliasedEffectSlug(
      initialTool,
      ["video-effect", "video-effects"],
      getVideoEffectItemsSync().map((item) => item.slug),
    ) || DEFAULT_VIDEO_EFFECT_SLUG,
  );
  const [videoEffectPrefillImages, setVideoEffectPrefillImages] = useState<
    ImageUploaderValue[]
  >([]);
  const [videoEffectPrefillNonce, setVideoEffectPrefillNonce] = useState(0);
  const imageEffectSlugFromRoute = useMemo(
    () =>
      getAliasedEffectSlug(
        initialTool,
        ["image-effect", "image-effects"],
        getImageEffectItemsSync().map((item) => item.slug),
      ),
    [initialTool],
  );
  const [mobileCreationView, setMobileCreationView] =
    useState<MobileCreationView>("creations");
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const libraryLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const shouldReuseInitialLibraryRef = useRef(
    initialLibraryResolved && hasInitialLibraryItems,
  );
  const setLibraryScrollViewport = useCallback(
    (node: HTMLDivElement | null) => {
      setLibraryScrollRoot(isMobile ? null : node);
    },
    [isMobile],
  );

  const { currentScene, category } = useMemo(
    () => findCurrentScene(navItems, initialTool),
    [initialTool, navItems],
  );
  const sceneLabel = getSceneLabel(currentScene, tCreator("tools.untitled"));
  const toolAlias = useMemo(
    () => normalizeToolAlias(initialTool),
    [initialTool],
  );
  const normalizedInitialTool = useMemo(
    () => normalizeToolParam(initialTool),
    [initialTool],
  );
  const isImageEffectsAlias =
    toolAlias === "image-effect" || toolAlias === "image-effects";
  const isImageEffectsPrimaryRoute =
    imageEffectsReplica ||
    normalizedInitialTool === "image-effect" ||
    normalizedInitialTool === "image-effects";
  const isVideoEffectsAlias =
    toolAlias === "video-effect" || toolAlias === "video-effects";
  const isVideoEffectsPrimaryRoute =
    videoEffectsReplica ||
    normalizedInitialTool === "video-effect" ||
    normalizedInitialTool === "video-effects" ||
    normalizedInitialTool === `video-effect/${AI_KISSING_HUB_SLUG}` ||
    normalizedInitialTool === `video-effects/${AI_KISSING_HUB_SLUG}` ||
    normalizedInitialTool === `video-effect/${AI_TWERK_SLUG}` ||
    normalizedInitialTool === `video-effects/${AI_TWERK_SLUG}` ||
    normalizedInitialTool === `video-effect/${AI_JIGGLE_SLUG}` ||
    normalizedInitialTool === `video-effects/${AI_JIGGLE_SLUG}` ||
    normalizedInitialTool === "video-effect/hugging" ||
    normalizedInitialTool === "video-effects/hugging";
  const isVariationsAlias = toolAlias === "variations";
  const isSpecialToolAlias =
    isImageEffectsAlias || isVideoEffectsAlias || isVariationsAlias;
  const shouldShowLibraryTab =
    toolAlias !== "image-upscaler" && !isVariationsAlias;
  const effectiveSceneLabel = TOOL_ALIAS_TO_LABEL_KEY[toolAlias]
    ? tDetail(TOOL_ALIAS_TO_LABEL_KEY[toolAlias])
    : sceneLabel;
  const [modelOptions, setModelOptions] = useState<
    ReturnType<typeof getModelOptions>
  >([]);
  const currentModelOption = useMemo(
    () => modelOptions.find((model) => model.url === currentModelUrl) || null,
    [currentModelUrl, modelOptions],
  );
  const workspaceTabs = [
    {
      id: "creations" as const,
      label: tCreator("sceneBrowser.tabs.creations"),
      icon: Images,
    },
    {
      id: "collections" as const,
      label: tCreator("sceneBrowser.tabs.collections"),
      icon: FolderOpen,
    },
    ...(shouldShowLibraryTab
      ? [
          {
            id: "library" as const,
            label: tDetail("workspace.library"),
            icon: Boxes,
          },
        ]
      : []),
  ];
  const activeWorkspaceTab =
    workspaceTabs.find((tab) => tab.id === activeTab) ?? workspaceTabs[0];
  const mobileCreationsTabLabel =
    mobileCreationView === "uploads"
      ? tDetail("workspace.uploads")
      : tCreator("sceneBrowser.tabs.creations");
  const effectiveConfig = useMemo(
    () =>
      isVariationsAlias
        ? variationsPlaygroundConfig
        : buildStyleAwareConfig(config, templateItems),
    [config, isVariationsAlias, templateItems],
  );
  const currentToolSceneId = useMemo(() => {
    if (isVariationsAlias) {
      return normalizedInitialTool || "variations";
    }

    return (
      effectiveConfig?.creditScenario ||
      effectiveConfig?.model?.id ||
      normalizedInitialTool ||
      currentScene?.id ||
      ""
    );
  }, [
    currentScene?.id,
    effectiveConfig?.creditScenario,
    effectiveConfig?.model?.id,
    isVariationsAlias,
    normalizedInitialTool,
  ]);
  const estimateParams = effectiveConfig?.estimateParams?.(currentValues);
  const creationItems = useMemo(
    () => creations.map(mapCreationItemToGeneratedMediaItem),
    [creations],
  );
  const visibleCreationItems = useMemo(() => {
    const getGeneratedItemKey = (item: GeneratedMediaItem) => {
      const mediaUrl = item.url || item.previewUrl;
      if (mediaUrl) {
        return mediaUrl;
      }

      return [item.createdAt, item.modelUrl, item.sceneId]
        .filter(Boolean)
        .join("|");
    };

    if (sessionGeneratedItems.length === 0) {
      return creationItems;
    }

    const seenIds = new Set(sessionGeneratedItems.map(getGeneratedItemKey));
    return [
      ...sessionGeneratedItems,
      ...creationItems.filter(
        (item) => !seenIds.has(getGeneratedItemKey(item)),
      ),
    ];
  }, [creationItems, sessionGeneratedItems]);
  const currentSceneGeneratedItems = useMemo(() => {
    if (!currentToolSceneId) {
      return visibleCreationItems;
    }

    return visibleCreationItems.filter(
      (item) => item.sceneId === currentToolSceneId,
    );
  }, [currentToolSceneId, visibleCreationItems]);
  const currentScenePendingTaskCount = useMemo(() => {
    if (!currentToolSceneId) {
      return pendingGenerationTasks.length;
    }

    return pendingGenerationTasks.filter(
      (task) => task.sceneId === currentToolSceneId,
    ).length;
  }, [currentToolSceneId, pendingGenerationTasks]);
  const visibleLibraryItems = useMemo(
    () => templateItems.slice(0, libraryRenderCount),
    [libraryRenderCount, templateItems],
  );
  const hasMoreLibraryItems = visibleLibraryItems.length < templateItems.length;
  const selectedImageEffectItem = useMemo(
    () =>
      isImageEffectsAlias
        ? getImageEffectItemsSync().find(
            (item) => item.slug === selectedImageEffectSlug,
          ) || null
        : null,
    [isImageEffectsAlias, selectedImageEffectSlug],
  );
  const selectedVideoEffectItem = useMemo(
    () =>
      isVideoEffectsAlias
        ? getVideoEffectItemsSync().find(
            (item) => item.slug === selectedVideoEffectSlug,
          ) || null
        : null,
    [isVideoEffectsAlias, selectedVideoEffectSlug],
  );
  const workspaceDescription = shouldShowLibraryTab
    ? tDetail("workspace.descriptionWithLibrary")
    : tDetail("workspace.descriptionWithoutLibrary");
  const effectMarketingContent = useMemo(() => {
    if (selectedImageEffectItem) {
      return buildImageEffectMarketingContent(selectedImageEffectItem, tDetail);
    }

    if (selectedVideoEffectItem) {
      return buildVideoEffectMarketingContent(
        selectedVideoEffectItem,
        tDetail,
        locale,
      );
    }

    return null;
  }, [locale, selectedImageEffectItem, selectedVideoEffectItem, tDetail]);
  const canUseSpecialVideoEffectCopy =
    locale.toLowerCase().startsWith("en") ||
    locale.toLowerCase().startsWith("zh");
  const aiKissingLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === AI_KISSING_HUB_SLUG
        ? buildAiKissingLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const aiBikiniLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === AI_BIKINI_SLUG
        ? buildAiBikiniLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const aiTwerkLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === AI_TWERK_SLUG
        ? buildAiTwerkLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const aiJiggleLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === AI_JIGGLE_SLUG
        ? buildAiJiggleLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const aiHugLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === "hugging"
        ? buildAiHugLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const aiFlyingLandingContent = useMemo(
    () =>
      canUseSpecialVideoEffectCopy &&
      selectedVideoEffectItem?.slug === AI_FLYING_SLUG
        ? buildAiFlyingLandingContent(locale)
        : null,
    [canUseSpecialVideoEffectCopy, locale, selectedVideoEffectItem],
  );
  const shouldRenderAiKissingStandalone =
    isVideoEffectsAlias &&
    selectedVideoEffectItem?.slug === AI_KISSING_HUB_SLUG &&
    (normalizedInitialTool === `video-effect/${AI_KISSING_HUB_SLUG}` ||
      normalizedInitialTool === `video-effects/${AI_KISSING_HUB_SLUG}`);
  const shouldRenderAiTwerkStandalone =
    isVideoEffectsAlias &&
    selectedVideoEffectItem?.slug === AI_TWERK_SLUG &&
    (normalizedInitialTool === `video-effect/${AI_TWERK_SLUG}` ||
      normalizedInitialTool === `video-effects/${AI_TWERK_SLUG}`);
  const shouldRenderAiJiggleStandalone =
    isVideoEffectsAlias &&
    selectedVideoEffectItem?.slug === AI_JIGGLE_SLUG &&
    (normalizedInitialTool === `video-effect/${AI_JIGGLE_SLUG}` ||
      normalizedInitialTool === `video-effects/${AI_JIGGLE_SLUG}`);
  const shouldRenderAiHugStandalone =
    isVideoEffectsAlias &&
    selectedVideoEffectItem?.slug === "hugging" &&
    (normalizedInitialTool === "video-effect/hugging" ||
      normalizedInitialTool === "video-effects/hugging");
  const shouldRenderAiFlyingStandalone =
    isVideoEffectsAlias &&
    selectedVideoEffectItem?.slug === AI_FLYING_SLUG &&
    (normalizedInitialTool === `video-effect/${AI_FLYING_SLUG}` ||
      normalizedInitialTool === `video-effects/${AI_FLYING_SLUG}`);
  const fixedVideoSampleEffectSlug = isVideoEffectsAlias
    ? getAliasedEffectSlug(
        initialTool,
        ["video-effect", "video-effects"],
        getVideoEffectItemsSync().map((item) => item.slug),
      )
    : null;
  const imageEffectsLandingContent = useMemo(
    () =>
      isImageEffectsPrimaryRoute
        ? buildImageEffectsLandingContent(tDetail)
        : null,
    [isImageEffectsPrimaryRoute, tDetail],
  );
  const videoEffectsHeroContent = useMemo(
    () =>
      isVideoEffectsPrimaryRoute
        ? !canUseSpecialVideoEffectCopy
          ? buildVideoEffectsHeroContent(tDetail)
          : selectedVideoEffectItem?.slug === AI_KISSING_HUB_SLUG
            ? buildAiKissingHeroContent(locale)
            : selectedVideoEffectItem?.slug === AI_BIKINI_SLUG
              ? buildAiBikiniHeroContent(locale)
              : selectedVideoEffectItem?.slug === AI_TWERK_SLUG
                ? buildAiTwerkHeroContent(locale)
                : selectedVideoEffectItem?.slug === AI_JIGGLE_SLUG
                  ? buildAiJiggleHeroContent(locale)
                  : selectedVideoEffectItem?.slug === "hugging"
                    ? buildAiHugHeroContent(locale)
                    : selectedVideoEffectItem?.slug === AI_FLYING_SLUG
                      ? buildAiFlyingHeroContent(locale)
                      : buildVideoEffectsHeroContent(tDetail)
        : null,
    [
      canUseSpecialVideoEffectCopy,
      isVideoEffectsPrimaryRoute,
      locale,
      selectedVideoEffectItem,
      tDetail,
    ],
  );
  const imageEffectsLandingPreviewItems = useMemo(
    () => getImageEffectItemsSync().slice(0, 4),
    [],
  );
  const filterScenes = useMemo(() => {
    const imageRoot = navItems.find((item) => item.icon === "Image");
    const videoRoot = navItems.find((item) => item.icon === "Video");
    const imageScenes = imageRoot?.children
      ? mapSceneItems(imageRoot.children)
      : [];
    const videoScenes = videoRoot?.children
      ? mapSceneItems(videoRoot.children)
      : [];

    return (category === "Video" ? videoScenes : imageScenes).filter(
      (scene) => !isHiddenAiScene(scene),
    );
  }, [category, navItems]);
  const genericSceneOptions = useMemo(
    () =>
      filterScenes
        .map((scene) => ({
          id: scene.id || scene.url || scene.title || "",
          label: getSceneLabel(scene, tCreator("tools.untitled")),
          url: scene.url || "",
          iconUrl: scene.icon_url,
          badge: scene.badge,
        }))
        .filter((scene) => Boolean(scene.id)),
    [filterScenes, tCreator],
  );
  const handleSceneChange = useCallback(
    (sceneId: string) => {
      if (renderMode === "studio") {
        return;
      }

      const nextScene = filterScenes.find(
        (scene) => (scene.id || scene.url || scene.title) === sceneId,
      );

      if (!nextScene) {
        return;
      }

      const nextTool = getToolSlug(nextScene);
      if (!nextTool || nextTool === normalizeToolAlias(initialTool)) {
        return;
      }

      router.replace(`/tools/${nextTool}`);
    },
    [filterScenes, initialTool, renderMode, router],
  );
  const estimateParamsWithModel = useMemo(
    () =>
      estimateParams === undefined
        ? undefined
        : {
            ...(estimateParams || {}),
            __modelUrl: currentModelUrl,
          },
    [estimateParams, currentModelUrl],
  );
  const { credits: requiredCredits } = useEstimateCredits(
    effectiveConfig?.creditScenario || "flux-2-klein-text-to-image",
    estimateParamsWithModel,
    {
      debounceMs: 300,
      enabled: Boolean(effectiveConfig) && estimateParams !== undefined,
    },
  );
  const imageToVideoTargetRoute = useMemo(() => {
    const sceneUrl =
      findFirstSceneUrl(
        navItems,
        (url) =>
          url === DEFAULT_IMAGE_TO_VIDEO_MODEL_URL ||
          url.startsWith("/image-to-video/"),
      ) || DEFAULT_IMAGE_TO_VIDEO_MODEL_URL;

    return buildToolsRouteFromSceneUrl(sceneUrl);
  }, [navItems]);
  const imageUpscalerTargetRoute = useMemo(() => {
    const sceneUrl =
      findFirstSceneUrl(navItems, (url) => url.startsWith("/image-upscaler")) ||
      "/image-upscaler";

    return buildToolsRouteFromSceneUrl(sceneUrl);
  }, [navItems]);

  const navigateWithInitialReference = (
    item: GeneratedMediaItem,
    targetRoute: string,
  ) => {
    if (!item.url || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem("creator-initial-ref", item.url);
    router.push(targetRoute, { scroll: false });
  };

  const appendGeneratedMedia = (
    generatedMedia: string | string[],
    paramsSnapshot: Record<string, any>,
    options?: {
      createdAt?: string;
      sceneId?: string;
      modelUrl?: string;
      mediaKind?: "image" | "video";
      prompt?: string;
    },
  ) => {
    const createdAt = options?.createdAt || new Date().toISOString();
    const aspectRatio = String(paramsSnapshot.aspectRatio || "1:1");
    const mediaKind =
      options?.mediaKind || (category === "Video" ? "video" : "image");
    const sceneId = options?.sceneId || currentToolSceneId || currentScene?.id;
    const modelUrl = options?.modelUrl || currentModelUrl;
    const prompt =
      options?.prompt ||
      (typeof paramsSnapshot.prompt === "string" ? paramsSnapshot.prompt : "");
    const urls = Array.isArray(generatedMedia)
      ? generatedMedia
      : [generatedMedia];
    const nextItems = urls.filter(Boolean).map((url) => ({
      url,
      params: { ...paramsSnapshot },
      aspectRatio,
      mediaKind,
      createdAt,
      sceneId,
      modelUrl,
      prompt,
    }));

    if (nextItems.length === 0) {
      return;
    }

    setSessionGeneratedItems((prev) => [...nextItems, ...prev]);
  };

  const pollPendingTask = async (task: PendingGenerationTask) => {
    const maxAttempts = 120;
    const pollingInterval = 2000;
    const successStatuses = new Set(["completed", "success"]);
    const failureStatuses = new Set(["failed", "error"]);

    const extractOutputs = (payload: any): string[] => {
      const candidates = [payload?.data?.outputs, payload?.outputs];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate.filter(
            (item: unknown): item is string =>
              typeof item === "string" && Boolean(item),
          );
        }
      }

      const singleOutputCandidates = [
        payload?.data?.output,
        payload?.data?.output_url,
        payload?.data?.imageUrl,
        payload?.data?.videoUrl,
        payload?.output,
        payload?.output_url,
        payload?.imageUrl,
        payload?.videoUrl,
      ];

      for (const candidate of singleOutputCandidates) {
        if (typeof candidate === "string" && candidate) {
          return [candidate];
        }
      }

      return [];
    };

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        const response = await fetch(
          `/api/ai/status?taskId=${encodeURIComponent(task.requestId)}&scenario=${encodeURIComponent(task.scenario)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(tDetail("errors.fetchTaskStatusFailed"));
        }

        const payload = await response.json();
        if (payload?.code !== 0) {
          throw new Error(
            payload?.message || tDetail("errors.fetchTaskStatusFailed"),
          );
        }

        const status = payload?.data?.status;
        if (successStatuses.has(status)) {
          const outputs = extractOutputs(payload);
          if (outputs.length === 0) {
            throw new Error(tDetail("errors.resultUrlNotFound"));
          }

          appendGeneratedMedia(outputs, task.params, {
            createdAt: task.createdAt,
            sceneId: task.sceneId,
            modelUrl: task.modelUrl,
            mediaKind: task.mediaKind,
            prompt: task.prompt,
          });
          setPendingGenerationTasks((prev) =>
            prev.filter((item) => item.requestId !== task.requestId),
          );
          setRefreshTick((prev) => prev + 1);
          return;
        }

        if (failureStatuses.has(status)) {
          throw new Error(payload?.data?.error || tDetail("errors.taskFailed"));
        }
      }

      throw new Error(tDetail("errors.taskPollingTimeout"));
    } catch (error) {
      console.error("[tools-detail-page] pending task failed:", error);
      setPendingGenerationTasks((prev) =>
        prev.filter((item) => item.requestId !== task.requestId),
      );
    }
  };

  const generationContext = useMemo<
    Parameters<PlaygroundConfig["onGenerate"]>[1] | undefined
  >(() => {
    if (!effectiveConfig) {
      return undefined;
    }

    return {
      callbacks: {
        checkAccess: () => checkAccess(),
        modelUrl: currentModelUrl,
        modelLabel: currentModelOption?.label,
        showPricingModal: () => setIsShowPaymentModal(true),
        showSignModal: () => setIsShowSignModal(true),
        fetchUserInfo: async () => {
          await fetchUserInfo();
        },
        onTaskSubmitted: ({ requestId, scenario }) => {
          const pendingTask: PendingGenerationTask = {
            requestId,
            scenario,
            createdAt: new Date().toISOString(),
            params: { ...currentValues },
            aspectRatio: String(currentValues.aspectRatio || "1:1"),
            mediaKind: category === "Video" ? "video" : "image",
            sceneId: currentToolSceneId || currentScene?.id,
            modelUrl: currentModelUrl,
            prompt:
              typeof currentValues.prompt === "string"
                ? currentValues.prompt
                : "",
          };

          setActiveTab("creations");
          setPendingGenerationTasks((prev) => [pendingTask, ...prev]);
          void pollPendingTask(pendingTask);
        },
        deferPolling: true,
        onStatusUpdate: () => {},
        onError: () => {},
        translateApiError: (translationKey) =>
          tCommonApi(translationKey as any),
      },
      t: (key: string, params?: Record<string, any>) => {
        if (
          typeof tGeneration.has === "function" &&
          !tGeneration.has(key as any)
        ) {
          return params?.defaultValue || key;
        }

        try {
          const translated = tGeneration(key as any, params as any);
          return typeof translated === "string"
            ? translated
            : params?.defaultValue || key;
        } catch {
          return params?.defaultValue || key;
        }
      },
      requiredCredits: requiredCredits ?? null,
      remainingCredits: user?.credits?.remainingCredits ?? 0,
    };
  }, [
    checkAccess,
    category,
    effectiveConfig,
    currentScene?.id,
    currentToolSceneId,
    currentValues,
    currentModelOption?.label,
    currentModelUrl,
    fetchUserInfo,
    pollPendingTask,
    requiredCredits,
    setIsShowPaymentModal,
    setIsShowSignModal,
    tCommonApi,
    tGeneration,
    user?.credits?.remainingCredits,
  ]);

  useEffect(() => {
    const nextModelUrl = getCurrentModelUrl(currentScene, initialTool);
    setCurrentModelUrl(nextModelUrl);
  }, [currentScene, initialTool]);

  useEffect(() => {
    let cancelled = false;
    const baseOptions = getModelOptions(currentScene, {
      scene: tCreator("tools.untitled"),
      model: tCreator("model.untitled"),
    });

    if (toolAlias !== "editor-combiner") {
      setModelOptions(baseOptions);
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      baseOptions.map(async (option) => ({
        option,
        supported: await modelSupportsMultipleReferenceImages(option.url),
      })),
    )
      .then((results) => {
        if (cancelled) return;
        const filtered = results
          .filter((item) => item.supported)
          .map((item) => item.option);
        setModelOptions(filtered);
      })
      .catch(() => {
        if (!cancelled) {
          setModelOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentScene, toolAlias]);

  useEffect(() => {
    if (!modelOptions.length) {
      return;
    }

    if (!modelOptions.some((model) => model.url === currentModelUrl)) {
      setCurrentModelUrl(modelOptions[0].url);
    }
  }, [currentModelUrl, modelOptions]);

  useEffect(() => {
    if (renderMode === "studio") {
      return;
    }

    if (!currentScene?.url) {
      return;
    }

    const normalizedTool = normalizeToolParam(initialTool);
    const canonicalTool = getCanonicalSceneTool(currentScene);

    if (CANONICAL_TOOL_ALIAS_EXCEPTIONS.has(toolAlias)) {
      return;
    }

    if (canonicalTool && normalizedTool !== canonicalTool) {
      router.replace(`/tools/${canonicalTool}`);
    }
  }, [currentScene, initialTool, renderMode, router, toolAlias]);

  useEffect(() => {
    let cancelled = false;

    if (isVariationsAlias) {
      setConfig(undefined);
      setCurrentValues(getDefaultValues(variationsPlaygroundConfig));
      setIsLoadingConfig(false);
      return () => {
        cancelled = true;
      };
    }

    if (!currentModelUrl) {
      if (isSpecialToolAlias) {
        setConfig(undefined);
        setCurrentValues({});
        setIsLoadingConfig(false);
        return () => {
          cancelled = true;
        };
      }

      setConfig(undefined);
      setCurrentValues({});
      setIsLoadingConfig(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingConfig(true);

    getPlaygroundConfigByUrl(currentModelUrl)
      .then((nextConfig) => {
        if (cancelled) return;
        setConfig(nextConfig);
        setCurrentValues(getDefaultValues(nextConfig));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingConfig(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentModelUrl, isSpecialToolAlias, isVariationsAlias]);

  useEffect(() => {
    if (!effectiveConfig || isSpecialToolAlias) {
      return;
    }

    setCurrentValues((prev) => {
      const next = { ...prev };
      let didChange = false;

      Object.entries(effectiveConfig.schema).forEach(([key, field]) => {
        if (!field || key in next) {
          return;
        }

        next[key] = field.defaultValue;
        didChange = true;
      });

      return didChange ? next : prev;
    });
  }, [effectiveConfig, isSpecialToolAlias]);

  useEffect(() => {
    setLibraryRenderCount(LIBRARY_INITIAL_RENDER_COUNT);
  }, [templateItems]);

  useEffect(() => {
    const node = libraryLoadMoreRef.current;
    if (
      !node ||
      !hasMoreLibraryItems ||
      activeTab !== "library" ||
      (!isMobile && !libraryScrollRoot)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLibraryRenderCount((prev) =>
            Math.min(templateItems.length, prev + LIBRARY_RENDER_BATCH_SIZE),
          );
        }
      },
      {
        root: isMobile ? null : libraryScrollRoot,
        rootMargin: "480px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    activeTab,
    hasMoreLibraryItems,
    isMobile,
    libraryScrollRoot,
    templateItems.length,
  ]);

  useEffect(() => {
    let cancelled = false;

    const mediaType = category === "Video" ? "video" : "image";
    const creationsRequestKey = `${mediaType}:${currentToolSceneId || "all"}:${refreshTick}`;

    const shouldLoadInlineGenerateList = !isSpecialToolAlias;

    if (
      !mediaType ||
      (activeTab !== "creations" && !shouldLoadInlineGenerateList)
    ) {
      return () => {
        cancelled = true;
      };
    }

    if (loadedCreationsKey === creationsRequestKey) {
      return () => {
        cancelled = true;
      };
    }

    if (!mediaType) {
      setCreations([]);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingCreations(true);
    const params = new URLSearchParams({
      mediaType,
      limit: "100",
    });
    if (currentToolSceneId) {
      params.set("sceneId", currentToolSceneId);
    }
    fetch(`/api/workbench/creations?${params.toString()}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];
        setCreations(items);
        setLoadedCreationsKey(creationsRequestKey);
      })
      .catch(() => {
        if (!cancelled) {
          setCreations([]);
          setLoadedCreationsKey(creationsRequestKey);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCreations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    category,
    currentToolSceneId,
    isSpecialToolAlias,
    loadedCreationsKey,
    refreshTick,
  ]);

  useEffect(() => {
    let cancelled = false;

    if (activeTab !== "collections" || hasLoadedCollections) {
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingCollections(true);
    fetch("/api/workbench/collections?basic=1", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const items = Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];
        setCollections(items);
        setHasLoadedCollections(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCollections([]);
          setHasLoadedCollections(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCollections(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, hasLoadedCollections]);

  useEffect(() => {
    let cancelled = false;

    // Image Upscaler keeps the workspace on "creations", but the landing
    // showcase below still needs templateItems to render real example media.
    if (
      !shouldShowLibraryTab &&
      toolAlias !== "image-upscaler" &&
      toolAlias !== "variations"
    ) {
      setIsLoadingLibrary(false);
      setTemplateItems([]);
      return () => {
        cancelled = true;
      };
    }

    if (!currentScene?.url) {
      setTemplateItems([]);
      setIsLoadingLibrary(false);
      return () => {
        cancelled = true;
      };
    }

    if (shouldReuseInitialLibraryRef.current) {
      shouldReuseInitialLibraryRef.current = false;
      setIsLoadingLibrary(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingLibrary(true);
    loadToolLibraryOverrides()
      .then((overrides) => {
        if (cancelled) return;
        if (isImageEffectsAlias) {
          const imageEffectsOverride =
            overrides.find(
              (override) => override.id === "image-effects-scene-library",
            ) || null;

          if (imageEffectsOverride) {
            setTemplateItems(
              buildOverrideLibraryItems({
                override: imageEffectsOverride,
                sceneId: currentScene?.id,
                sceneLabel: effectiveSceneLabel,
              }),
            );
            return null;
          }
        }
        if (isVideoEffectsAlias) {
          const videoEffectsOverride =
            overrides.find(
              (override) => override.id === "video-effects-scene-library",
            ) || null;

          if (videoEffectsOverride) {
            const effectSlug = getAliasedEffectSlug(
              initialTool,
              ["video-effect", "video-effects"],
              getVideoEffectItemsSync().map((item) => item.slug),
            );
            const override = effectSlug
              ? {
                  ...videoEffectsOverride,
                  items: videoEffectsOverride.items.filter(
                    (item) => item.params?.effectSlug === effectSlug,
                  ),
                }
              : videoEffectsOverride;

            setTemplateItems(
              buildOverrideLibraryItems({
                override,
                sceneId: currentScene?.id,
                sceneLabel: effectiveSceneLabel,
              }),
            );
            return null;
          }
        }
        const libraryOverride = resolveToolLibraryOverride({
          toolParam: initialTool,
          sceneUrl: currentScene?.url,
          overrides,
        });

        if (libraryOverride) {
          setTemplateItems(
            buildOverrideLibraryItems({
              override: libraryOverride,
              sceneId: currentScene?.id,
              sceneLabel: effectiveSceneLabel,
            }),
          );
          return null;
        }

        return buildWorkbenchSceneTemplateCatalog({
          sceneId: currentScene?.id,
          sceneLabel: effectiveSceneLabel,
          scenePath: currentScene.url,
          config,
        }).then((items) => {
          if (!cancelled) {
            setTemplateItems(items);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTemplateItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingLibrary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    config,
    currentScene,
    effectiveSceneLabel,
    initialTool,
    isImageEffectsAlias,
    isVideoEffectsAlias,
    shouldShowLibraryTab,
    toolAlias,
  ]);

  const handleUseValues = (values: Record<string, any>) => {
    startTransition(() => {
      setCurrentValues({
        ...getDefaultValues(effectiveConfig),
        ...values,
      });
    });
  };

  const handleUseLibraryItem = (item: WorkbenchTemplateItem) => {
    if (
      isImageEffectsAlias &&
      Array.isArray(item.params?.referenceImages) &&
      item.params.referenceImages.length > 0
    ) {
      if (
        typeof item.params?.effectSlug === "string" &&
        item.params.effectSlug
      ) {
        setSelectedImageEffectSlug(item.params.effectSlug);
      }

      setImageEffectPrefillImages(
        item.params.referenceImages as ImageUploaderValue[],
      );
      setImageEffectPrefillNonce((prev) => prev + 1);
      if (isMobile) {
        setIsMobileFormOpen(true);
      }
      return;
    }
    if (
      isVideoEffectsAlias &&
      Array.isArray(item.params?.referenceImages) &&
      item.params.referenceImages.length > 0
    ) {
      if (
        typeof item.params?.effectSlug === "string" &&
        item.params.effectSlug
      ) {
        setSelectedVideoEffectSlug(item.params.effectSlug);
      }

      setVideoEffectPrefillImages(
        item.params.referenceImages as ImageUploaderValue[],
      );
      setVideoEffectPrefillNonce((prev) => prev + 1);
      if (isMobile) {
        setIsMobileFormOpen(true);
      }
      return;
    }

    handleUseValues(item.params);
    if (isMobile) {
      setIsMobileFormOpen(true);
    }
  };

  const handleModelChange = (nextModelUrl: string) => {
    if (!nextModelUrl || nextModelUrl === currentModelUrl) {
      return;
    }
    setCurrentModelUrl(nextModelUrl);
  };

  useEffect(() => {
    if (!shouldShowLibraryTab && activeTab === "library") {
      setActiveTab("creations");
    }
  }, [activeTab, shouldShowLibraryTab]);

  useEffect(() => {
    if (!isImageEffectsAlias) {
      return;
    }

    const effectSlug = getAliasedEffectSlug(
      initialTool,
      ["image-effect", "image-effects"],
      getImageEffectItemsSync().map((item) => item.slug),
    );

    if (effectSlug) {
      setSelectedImageEffectSlug(effectSlug);
    }
  }, [initialTool, isImageEffectsAlias]);

  useEffect(() => {
    if (!isVideoEffectsAlias) {
      return;
    }

    const effectSlug = getAliasedEffectSlug(
      initialTool,
      ["video-effect", "video-effects"],
      getVideoEffectItemsSync().map((item) => item.slug),
    );

    if (effectSlug) {
      setSelectedVideoEffectSlug(effectSlug);
    }
  }, [initialTool, isVideoEffectsAlias]);

  const configuredForm = isVariationsAlias ? (
    <VariationsToolForm
      sceneTitle={effectiveSceneLabel}
      sceneIconUrl={currentScene?.icon_url}
      generationContext={generationContext}
      onGenerate={(generatedMedia) => {
        appendGeneratedMedia(generatedMedia, currentValues, {
          sceneId: currentToolSceneId || currentScene?.id,
          modelUrl: currentModelUrl,
          mediaKind: "image",
        });
        setRefreshTick((prev) => prev + 1);
        setActiveTab("creations");
      }}
      onValuesChange={setCurrentValues}
      isGenerating={pendingGenerationTasks.length > 0}
      values={currentValues}
      requiredCredits={requiredCredits}
    />
  ) : isImageEffectsAlias ? (
    <ImageEffectsToolForm
      selectedEffectSlug={selectedImageEffectSlug}
      onEffectSlugChange={setSelectedImageEffectSlug}
      prefillReferenceImages={imageEffectPrefillImages}
      prefillNonce={imageEffectPrefillNonce}
      onGenerateSuccess={() => {
        setRefreshTick((prev) => prev + 1);
        setActiveTab("creations");
      }}
    />
  ) : isVideoEffectsAlias ? (
    <VideoEffectsToolForm
      selectedEffectSlug={selectedVideoEffectSlug}
      onEffectSlugChange={setSelectedVideoEffectSlug}
      sampleEffectSlug={fixedVideoSampleEffectSlug}
      previewEffectSlug={fixedVideoSampleEffectSlug}
      prefillReferenceImages={videoEffectPrefillImages}
      prefillNonce={videoEffectPrefillNonce}
      onGenerateSuccess={() => {
        setRefreshTick((prev) => prev + 1);
        setActiveTab("creations");
      }}
    />
  ) : effectiveConfig ? (
    effectiveConfig.scenarioType === "image-to-image" ||
    effectiveConfig.scenarioType === "image-to-video" ? (
      <ReferenceImageForm
        config={effectiveConfig}
        sceneTitle={effectiveSceneLabel}
        sceneIconUrl={currentScene?.icon_url}
        sceneOptions={genericSceneOptions}
        currentSceneId={
          currentScene?.id || currentScene?.url || currentScene?.title
        }
        onSceneChange={handleSceneChange}
        shellVariant="mango"
        hideSceneTabs={renderMode === "studio"}
        generationContext={generationContext}
        onGenerate={(generatedMedia) => {
          appendGeneratedMedia(generatedMedia, currentValues, {
            sceneId: currentToolSceneId || currentScene?.id,
            modelUrl: currentModelUrl,
            mediaKind: category === "Video" ? "video" : "image",
          });
          setRefreshTick((prev) => prev + 1);
          setActiveTab("creations");
        }}
        onValuesChange={setCurrentValues}
        isGenerating={pendingGenerationTasks.length > 0}
        modelOptions={modelOptions}
        currentModelUrl={currentModelUrl}
        onModelChange={handleModelChange}
        values={currentValues}
        requiredCredits={requiredCredits}
      />
    ) : (
      <PromptToMediaForm
        config={effectiveConfig}
        sceneTitle={effectiveSceneLabel}
        sceneIconUrl={currentScene?.icon_url}
        sceneOptions={genericSceneOptions}
        currentSceneId={
          currentScene?.id || currentScene?.url || currentScene?.title
        }
        onSceneChange={handleSceneChange}
        shellVariant="mango"
        hideSceneTabs={renderMode === "studio"}
        generationContext={generationContext}
        onGenerate={(generatedMedia) => {
          appendGeneratedMedia(generatedMedia, currentValues, {
            sceneId: currentToolSceneId || currentScene?.id,
            modelUrl: currentModelUrl,
            mediaKind: category === "Video" ? "video" : "image",
          });
          setRefreshTick((prev) => prev + 1);
          setActiveTab("creations");
        }}
        onValuesChange={setCurrentValues}
        isGenerating={pendingGenerationTasks.length > 0}
        modelOptions={modelOptions}
        currentModelUrl={currentModelUrl}
        onModelChange={handleModelChange}
        values={currentValues}
        requiredCredits={requiredCredits}
      />
    )
  ) : isLoadingConfig ? (
    <WorkbenchFormSkeleton />
  ) : (
    <div className="flex min-h-[28rem] items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03] px-6 text-center text-sm text-white/58">
      {tCreator("errors.noWorkspace")}
    </div>
  );

  const libraryCarouselItems = useMemo<ToolEffectCarouselItem[]>(
    () =>
      templateItems.map((item) => ({
        id: item.id,
        title:
          item.title ||
          sanitizeEffectDisplayText(item.prompt).split(".")[0]?.slice(0, 32) ||
          tDetail("actions.templateFallback"),
        description: isSpecialToolAlias
          ? null
          : sanitizeEffectDisplayText(item.prompt),
        mediaType: item.mediaType === "video" ? "video" : "image",
        sourcePreviewUrl: item.referencePreviewUrls[0] || item.sourcePreviewUrl,
        referencePreviewUrls: item.referencePreviewUrls,
        resultPreviewUrls: item.resultPreviewUrls,
        previewUrl: item.previewUrl || item.thumbnailUrl,
        previewClipUrl: item.previewClipUrl,
        thumbnailUrl: item.thumbnailUrl || item.previewUrl,
        onSelect: () => handleUseLibraryItem(item),
      })),
    [isSpecialToolAlias, tDetail, templateItems],
  );

  const genericHeroContent: ReplicaHeroContent = {
    title: buildGenericHeroTitle(effectiveSceneLabel, tDetail),
    intro: buildGenericHeroIntro({
      sceneTitle: effectiveSceneLabel,
      category,
      tDetail,
    }),
  };
  const genericLandingContent = useMemo(
    () =>
      buildGenericMangoLandingContent({
        sceneTitle: effectiveSceneLabel,
        category,
        workspaceDescription,
      }),
    [category, effectiveSceneLabel, workspaceDescription],
  );
  const genericGenerator = (
    <ToolGenericStudio
      form={configuredForm}
      carouselItems={libraryCarouselItems}
      generatedItems={currentSceneGeneratedItems}
      pendingItemCount={currentScenePendingTaskCount}
      onUseGeneratedItem={(item) =>
        navigateWithInitialReference(item, imageToVideoTargetRoute)
      }
      onUpscaleGeneratedItem={(item) =>
        navigateWithInitialReference(item, imageUpscalerTargetRoute)
      }
      emptyTitle={tDetail("workspace.library")}
      emptyDescription={tDetail("workspace.emptyLibrary")}
    />
  );

  if (renderMode === "studio") {
    return genericGenerator;
  }

  const workspaceContent = (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        !isMobile && "overflow-hidden",
        activeTab === "library" && isMobile ? "h-auto" : "h-full",
        activeTab === "creations"
          ? ""
          : activeTab === "library"
            ? cn("bg-[#fffef8] sm:p-5", isMobile ? "p-0" : "p-4")
            : isMobile
              ? "bg-transparent p-0"
              : "bg-[#fffef8] p-4 sm:p-5",
      )}
    >
      {activeTab === "creations" ? (
        <WorkbenchMediaPanel
          key={`tools-creations-${category}-${mobileCreationView}-${refreshTick}`}
          defaultTab="creations"
          defaultCreationView={mobileCreationView}
          visibleTabs={["creations"]}
          embeddedShell
          hideInternalHeader={isMobile}
          isSignedIn={Boolean(user?.id)}
          templateItems={[]}
          filterTools={filterScenes
            .filter((scene) => Boolean(scene.id))
            .map((scene) => ({
              value: scene.id!,
              label:
                scene.title ||
                scene.name ||
                scene.id ||
                tCreator("tools.untitled"),
              category: category === "Video" ? "video" : "photo",
            }))}
          filterModelsByTool={Object.fromEntries(
            filterScenes.map((scene) => [
              scene.id,
              (scene.children ?? [])
                .filter((model) => Boolean(model.url))
                .map((model) => ({
                  value: model.url!,
                  label:
                    model.title || model.name || tCreator("model.untitled"),
                })),
            ]),
          )}
          generatedPanelProps={{
            items: visibleCreationItems,
            pendingItemCount: pendingGenerationTasks.length,
            mediaType: category === "Video" ? "video" : "image",
            emptyStateChips: modelOptions
              .map((model) => model.label)
              .slice(0, 6),
            emptyStatePreviewItems: [
              {
                label: effectiveSceneLabel,
                iconUrl: currentScene?.icon_url,
              },
              {
                label:
                  currentModelOption?.label ||
                  modelOptions[0]?.label ||
                  effectiveSceneLabel,
                iconUrl:
                  currentModelOption?.iconUrl || modelOptions[0]?.iconUrl,
              },
            ],
            modelMetaByUrl: Object.fromEntries(
              filterScenes.flatMap((scene) =>
                (scene.children ?? [])
                  .filter((model) => Boolean(model.url))
                  .map((model) => [
                    model.url!,
                    {
                      label:
                        model.title || model.name || tCreator("model.untitled"),
                      iconUrl:
                        getModelVendorLogo({
                          url: model.url,
                          title: model.title || model.name,
                        }).url ||
                        model.icon_url ||
                        scene.icon_url,
                    },
                  ]),
              ),
            ),
            sceneMetaById: Object.fromEntries(
              filterScenes.map((scene) => [
                scene.id,
                { label: scene.title, iconUrl: scene.icon_url },
              ]),
            ),
            onUseItem: (_, params) => {
              const {
                creationRecordId: _creationRecordId,
                __sessionGenerated: _sessionGenerated,
                __sourceGeneratedIndex: _sourceGeneratedIndex,
                ...nextParams
              } = params;
              handleUseValues({
                ...nextParams,
                prompt:
                  typeof nextParams.prompt === "string"
                    ? nextParams.prompt
                    : "",
              });
            },
          }}
        />
      ) : null}

      {activeTab === "collections" ? (
        <WorkbenchMediaPanel
          key={`tools-collections-${category}-${refreshTick}`}
          defaultTab="collections"
          visibleTabs={["collections"]}
          embeddedShell
          hideInternalHeader={isMobile}
          isSignedIn={Boolean(user?.id)}
          templateItems={[]}
          filterTools={filterScenes
            .filter((scene) => Boolean(scene.id))
            .map((scene) => ({
              value: scene.id!,
              label:
                scene.title ||
                scene.name ||
                scene.id ||
                tCreator("tools.untitled"),
              category: category === "Video" ? "video" : "photo",
            }))}
          filterModelsByTool={Object.fromEntries(
            filterScenes.map((scene) => [
              scene.id,
              (scene.children ?? [])
                .filter((model) => Boolean(model.url))
                .map((model) => ({
                  value: model.url!,
                  label:
                    model.title || model.name || tCreator("model.untitled"),
                })),
            ]),
          )}
          generatedPanelProps={{
            items: sessionGeneratedItems,
            pendingItemCount: pendingGenerationTasks.length,
            mediaType: category === "Video" ? "video" : "image",
            emptyStateChips: modelOptions
              .map((model) => model.label)
              .slice(0, 6),
            emptyStatePreviewItems: [
              {
                label: effectiveSceneLabel,
                iconUrl: currentScene?.icon_url,
              },
              {
                label:
                  currentModelOption?.label ||
                  modelOptions[0]?.label ||
                  effectiveSceneLabel,
                iconUrl:
                  currentModelOption?.iconUrl || modelOptions[0]?.iconUrl,
              },
            ],
            modelMetaByUrl: Object.fromEntries(
              filterScenes.flatMap((scene) =>
                (scene.children ?? [])
                  .filter((model) => Boolean(model.url))
                  .map((model) => [
                    model.url!,
                    {
                      label:
                        model.title || model.name || tCreator("model.untitled"),
                      iconUrl:
                        getModelVendorLogo({
                          url: model.url,
                          title: model.title || model.name,
                        }).url ||
                        model.icon_url ||
                        scene.icon_url,
                    },
                  ]),
              ),
            ),
            sceneMetaById: Object.fromEntries(
              filterScenes.map((scene) => [
                scene.id,
                { label: scene.title, iconUrl: scene.icon_url },
              ]),
            ),
            onUseItem: (_, params) => {
              const {
                creationRecordId: _creationRecordId,
                __sessionGenerated: _sessionGenerated,
                __sourceGeneratedIndex: _sourceGeneratedIndex,
                ...nextParams
              } = params;
              handleUseValues({
                ...nextParams,
                prompt:
                  typeof nextParams.prompt === "string"
                    ? nextParams.prompt
                    : "",
              });
            },
          }}
        />
      ) : null}

      {activeTab === "library" ? (
        isLoadingLibrary ? (
          <LibraryLoadingPlaceholder isMobile={isMobile} />
        ) : templateItems.length > 0 ? (
          <div
            ref={setLibraryScrollViewport}
            className={cn(
              "min-h-0 flex-1",
              isMobile
                ? "overflow-visible"
                : "h-full overflow-y-auto overscroll-contain",
            )}
          >
            <div
              className={cn(
                "grid xl:grid-cols-2",
                isMobile ? "gap-2 px-0.5" : "gap-5",
              )}
            >
              {visibleLibraryItems.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "overflow-hidden",
                    isMobile ? "rounded-[18px]" : "rounded-[24px]",
                  )}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden border border-[#E5E7EB] bg-white shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px]",
                      isMobile ? "rounded-[18px]" : "rounded-[24px]",
                    )}
                  >
                    <div className="absolute inset-x-0 top-0 z-10 p-3 sm:p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="max-w-full truncate whitespace-nowrap pr-2 text-[1.15rem] font-semibold tracking-[-0.04em] text-[#23282F] sm:text-[1.4rem]">
                            {item.title ||
                              sanitizeEffectDisplayText(item.prompt)
                                .split(".")[0]
                                ?.slice(0, 28) ||
                              tDetail("actions.templateFallback")}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUseLibraryItem(item)}
                          className="shrink-0 cursor-pointer rounded-full border border-[#23282F] bg-[#23282F] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-[#333333]"
                        >
                          {tDetail("actions.useTemplate")}
                        </button>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "relative px-3 pb-3 sm:px-4 sm:pb-4",
                        isSpecialToolAlias
                          ? "pt-[4.1rem] sm:pt-[4.6rem]"
                          : "pt-[4.75rem] sm:pt-[5.25rem]",
                      )}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[6rem] bg-[linear-gradient(180deg,rgba(255,248,222,0.98)_0%,rgba(255,248,222,0.88)_45%,rgba(255,248,222,0.3)_78%,rgba(255,248,222,0)_100%)]" />

                      {isSpecialToolAlias ? null : (
                        <p className="relative z-[1] line-clamp-3 max-w-[34rem] text-sm leading-6 text-[#4A5464]">
                          {sanitizeEffectDisplayText(item.prompt)}
                        </p>
                      )}

                      <div
                        className={cn(
                          "relative z-[1]",
                          isSpecialToolAlias ? "mt-0" : "mt-3",
                        )}
                      >
                        <DeferredToolPreview
                          item={{
                            mediaType: item.mediaType,
                            previewUrl: item.previewUrl,
                            previewClipUrl: item.previewClipUrl,
                            thumbnailUrl: item.thumbnailUrl,
                            sourcePreviewUrl: item.sourcePreviewUrl,
                            resultPreviewUrl: item.resultPreviewUrl,
                            title: sanitizeEffectDisplayText(item.prompt),
                            referencePreviewUrls: Array.isArray(
                              item.params?.referenceImages,
                            )
                              ? item.params.referenceImages
                                  .map(
                                    (entry: {
                                      preview?: string;
                                      url?: string;
                                    }) => entry?.preview || entry?.url,
                                  )
                                  .filter((value): value is string =>
                                    Boolean(value),
                                  )
                                  .slice(0, 1)
                              : [],
                          }}
                          scrollRoot={libraryScrollRoot}
                          className="h-[17rem] rounded-[20px] sm:h-[20rem] xl:h-[18rem]"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {hasMoreLibraryItems ? (
              <div
                ref={libraryLoadMoreRef}
                className="h-px w-full"
                aria-hidden="true"
              />
            ) : null}
          </div>
        ) : (
          <MangoPanelMessage
            icon={<Boxes className="size-8" />}
            title={tDetail("workspace.library")}
            description={tDetail("workspace.emptyLibrary")}
          />
        )
      ) : null}
    </div>
  );

  if (isImageEffectsPrimaryRoute) {
    return (
      <ToolEffectLayout
        hero={
          imageEffectsLandingContent ? (
            <ReplicaHeroSection
              content={{
                title: imageEffectsLandingContent.heroTitle,
                intro: imageEffectsLandingContent.heroIntro,
              }}
            />
          ) : null
        }
        generator={
          <ImageEffectsToolForm
            layout="studio"
            selectedEffectSlug={selectedImageEffectSlug}
            onEffectSlugChange={setSelectedImageEffectSlug}
            lockSelectedEffect={Boolean(imageEffectSlugFromRoute)}
            prefillReferenceImages={imageEffectPrefillImages}
            prefillNonce={imageEffectPrefillNonce}
            onGenerateSuccess={() => {
              setRefreshTick((value) => value + 1);
              setActiveTab("creations");
            }}
          />
        }
        marketing={
          imageEffectsLandingContent ? (
            <ImageEffectsLandingSection
              content={imageEffectsLandingContent}
              previewItems={imageEffectsLandingPreviewItems}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : null
        }
      />
    );
  }

  if (
    isVideoEffectsPrimaryRoute ||
    shouldRenderAiKissingStandalone ||
    shouldRenderAiTwerkStandalone ||
    shouldRenderAiJiggleStandalone ||
    shouldRenderAiHugStandalone ||
    shouldRenderAiFlyingStandalone
  ) {
    return (
      <ToolEffectLayout
        hero={
          videoEffectsHeroContent ? (
            selectedVideoEffectItem?.slug === AI_KISSING_HUB_SLUG ||
            selectedVideoEffectItem?.slug === AI_BIKINI_SLUG ||
            selectedVideoEffectItem?.slug === AI_TWERK_SLUG ||
            selectedVideoEffectItem?.slug === AI_JIGGLE_SLUG ||
            selectedVideoEffectItem?.slug === "hugging" ||
            selectedVideoEffectItem?.slug === AI_FLYING_SLUG ? (
              <AiKissingHeroSection content={videoEffectsHeroContent} />
            ) : (
              <ReplicaHeroSection content={videoEffectsHeroContent} />
            )
          ) : null
        }
        generator={
          <VideoEffectsToolForm
            layout="studio"
            selectedEffectSlug={selectedVideoEffectSlug}
            onEffectSlugChange={setSelectedVideoEffectSlug}
            sampleEffectSlug={fixedVideoSampleEffectSlug}
            previewEffectSlug={fixedVideoSampleEffectSlug}
            prefillReferenceImages={videoEffectPrefillImages}
            prefillNonce={videoEffectPrefillNonce}
            onGenerateSuccess={() => {
              setRefreshTick((value) => value + 1);
              setActiveTab("creations");
            }}
          />
        }
        marketing={
          selectedVideoEffectItem?.slug === AI_KISSING_HUB_SLUG &&
          aiKissingLandingContent ? (
            <AiKissingLandingSection
              content={aiKissingLandingContent}
              effect={selectedVideoEffectItem}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : selectedVideoEffectItem?.slug === AI_BIKINI_SLUG &&
            aiBikiniLandingContent ? (
            <AiBikiniLandingSection
              content={aiBikiniLandingContent}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : selectedVideoEffectItem?.slug === AI_TWERK_SLUG &&
            aiTwerkLandingContent ? (
            <AiTwerkLandingSection
              content={aiTwerkLandingContent}
              effect={selectedVideoEffectItem}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : selectedVideoEffectItem?.slug === AI_JIGGLE_SLUG &&
            aiJiggleLandingContent ? (
            <AiJiggleLandingSection
              content={aiJiggleLandingContent}
              effect={selectedVideoEffectItem}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : selectedVideoEffectItem?.slug === "hugging" &&
            aiHugLandingContent ? (
            <AiHugLandingSection
              content={aiHugLandingContent}
              effect={selectedVideoEffectItem}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : selectedVideoEffectItem?.slug === AI_FLYING_SLUG &&
            aiFlyingLandingContent ? (
            <AiFlyingLandingSection
              content={aiFlyingLandingContent}
              onCtaClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : effectMarketingContent ? (
            <EffectMarketingSection content={effectMarketingContent} />
          ) : null
        }
      />
    );
  }

  return (
    <ToolEffectLayout
      hero={<MangoHeroSection content={genericHeroContent} />}
      generator={genericGenerator}
      marketing={
        <MangoMarketingSection
          content={genericLandingContent}
          previewItems={libraryCarouselItems}
          templateItems={templateItems}
          onCtaClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      }
    />
  );
}
