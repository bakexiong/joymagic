"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  BookOpen,
  Copy,
  Ellipsis,
  Film,
  Loader2,
  Megaphone,
  Palette,
  Paperclip,
  Plus,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  extractImageAiScenes,
  type SceneNode,
} from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import { CanvasCommandMenu } from "@/shared/blocks/creator-workbench/canvas/commands/canvas-command-menu";
import { getAvailableCommandsForNode } from "@/shared/blocks/creator-workbench/canvas/commands/canvas-command-registry";
import type { CanvasCommandType } from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import { findFirstSceneWithWorkspace } from "@/shared/blocks/common/ai-generator-shared";
import type { NavItem } from "@/shared/types/blocks/common";

const DEFAULT_TEXT_TO_IMAGE_MODEL_URL = "/text-to-image/gpt-image-2";
const PROJECT_AUTO_GENERATE_STORAGE_KEY_PREFIX =
  "canvas-project:auto-generate:";
const CANVAS_AGENT_AVATAR_URL =
  "https://ocdn.10b.ai/icon/spirit-redesign-transparent.png?x-oss-process=image/resize,m_fill,w_256,h_256";

type CanvasProjectListItem = {
  id: string;
  name: string;
  coverUrl: string | null;
  updatedAt: Date | string;
};

type CanvasProjectsReferencePreview = {
  id: string;
  name: string;
  previewUrl: string;
};

type CanvasProjectsHubProps = {
  locale: string;
  navItems: NavItem[];
  initialProjects: CanvasProjectListItem[];
  pageTitle: string;
  copy: {
    heroTitle: string;
    heroSubtitle: string;
    heroPlaceholder: string;
    heroSubmit: string;
    heroSceneLabel: string;
    heroModelLabel: string;
    heroHint: string;
    sectionTitle: string;
    sectionAction: string;
    createCardTitle: string;
    createCardSubtitle: string;
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
    duplicateSuccess: string;
    duplicateError: string;
    updatedAtPrefix: string;
    duplicateAria: string;
    deleteAria: string;
    submitError: string;
    autoLabel?: string;
    plusMenuTitle?: string;
    uploadReferenceAria?: string;
    closeDirectionAria?: string;
    skills?: CanvasSkillCard[];
    virtualReferenceLabel?: string;
    virtualPromptLabel?: string;
  };
};

type CanvasProjectGraphNode = {
  id: string;
  kind: "workflow";
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    sceneId: string;
    sceneLabel: string;
    modelUrl: string;
    modelLabel: string;
    prompt: string;
    aspectRatio?: string;
    count?: number;
    settings: Record<string, any>;
    status: "idle";
  };
};

type CanvasProjectGraph = {
  nodes: CanvasProjectGraphNode[];
  edges: Array<unknown>;
  viewport: { x: number; y: number; scale: number };
  selection: { nodeId: string | null; edgeId: string | null };
  composer: { nodeId: string | null; references: [] };
  commandMenu: null;
};

type CanvasSkillCard = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  composerPrompt?: string;
  quickOptions?: Array<{
    id: string;
    label: string;
    prompt: string;
  }>;
  sceneCategory: "Image" | "Video";
  icon:
    | "commerce"
    | "poster"
    | "brand"
    | "interior"
    | "social"
    | "story"
    | "marketing"
    | "comic";
};

const SKILL_CARD_ICON_MAP = {
  commerce: Megaphone,
  poster: BookOpen,
  brand: Shield,
  interior: Armchair,
  social: Palette,
  story: Film,
  marketing: Tv,
  comic: Sparkles,
} as const;

function getModelSlug(modelUrl: string) {
  return modelUrl.split("/").filter(Boolean).pop() ?? "";
}

function resolveDefaultEntryModelUrl(scene?: SceneNode | null) {
  if (!scene) return "";

  const candidates = [...(scene.children?.map((child) => child.url) ?? [])]
    .concat(scene.url ? [scene.url] : [])
    .filter(Boolean);

  const isTextToImageScene =
    scene.url?.startsWith("/text-to-image") ||
    candidates.some((url) => url.startsWith("/text-to-image/"));
  if (isTextToImageScene) {
    return (
      candidates.find((url) => url === DEFAULT_TEXT_TO_IMAGE_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  return scene.children?.[0]?.url || scene.url || "";
}

function createInitialGraph(input: {
  sceneId: string;
  sceneLabel: string;
  modelUrl: string;
  modelLabel: string;
  prompt: string;
}): CanvasProjectGraph {
  const workflowId = `workflow-${crypto.randomUUID()}`;
  return {
    nodes: [
      {
        id: workflowId,
        kind: "workflow",
        subtype: input.modelUrl.includes("/text-to-video")
          ? "text-to-video"
          : input.modelUrl.includes("/image-to-video")
            ? "image-to-video"
            : input.modelUrl.includes("/image-to-image")
              ? "image-to-image"
              : "text-to-image",
        position: { x: 280, y: 200 },
        size: { width: 228, height: 228 },
        data: {
          sceneId: input.sceneId,
          sceneLabel: input.sceneLabel,
          modelUrl: input.modelUrl,
          modelLabel: input.modelLabel,
          prompt: input.prompt,
          aspectRatio: "1:1",
          count: 1,
          settings: {
            prompt: input.prompt,
            aspectRatio: "1:1",
            count: 1,
          },
          status: "idle",
        },
      },
    ],
    edges: [],
    viewport: { x: 140, y: 120, scale: 1 },
    selection: { nodeId: workflowId, edgeId: null },
    composer: { nodeId: workflowId, references: [] },
    commandMenu: null,
  };
}

export function CanvasProjectsHub({
  locale,
  navItems,
  initialProjects,
  pageTitle,
  copy,
}: CanvasProjectsHubProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("commerce");
  const [selectedQuickOptionId, setSelectedQuickOptionId] = useState<
    string | null
  >(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [plusMenuPosition, setPlusMenuPosition] = useState({ x: 0, y: 0 });
  const [referencePreviews, setReferencePreviews] = useState<
    CanvasProjectsReferencePreview[]
  >([]);
  const inputCardRef = useRef<HTMLDivElement | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scenes = useMemo(() => extractImageAiScenes(navItems), [navItems]);
  const selectableScenes = useMemo(
    () =>
      scenes.filter(
        (scene) => (scene.children?.length ?? 0) > 0 || Boolean(scene.url),
      ),
    [scenes],
  );
  const imageScene = useMemo(
    () =>
      findFirstSceneWithWorkspace(selectableScenes, "Image") ??
      findFirstSceneWithWorkspace(scenes, "Image") ??
      findFirstSceneWithWorkspace(selectableScenes) ??
      findFirstSceneWithWorkspace(scenes),
    [scenes, selectableScenes],
  );
  const videoScene = useMemo(
    () =>
      findFirstSceneWithWorkspace(selectableScenes, "Video") ??
      findFirstSceneWithWorkspace(scenes, "Video") ??
      imageScene,
    [imageScene, scenes, selectableScenes],
  );
  const defaultScene = imageScene;
  const selectedScene = useMemo(
    () =>
      selectableScenes.find((scene) => scene.id === selectedSceneId) ??
      defaultScene,
    [defaultScene, selectableScenes, selectedSceneId],
  );
  const defaultModelUrl = useMemo(
    () => resolveDefaultEntryModelUrl(selectedScene),
    [selectedScene],
  );
  const defaultModelLabel = useMemo(
    () =>
      selectedScene?.children?.find((child) => child.url === defaultModelUrl)
        ?.title ??
      selectedScene?.title ??
      pageTitle,
    [defaultModelUrl, pageTitle, selectedScene],
  );

  useEffect(() => {
    if (!selectedSceneId && defaultScene?.id) {
      setSelectedSceneId(defaultScene.id);
    }
  }, [defaultScene?.id, selectedSceneId]);

  const isZh = locale.toLowerCase().startsWith("zh");
  const skillCards = useMemo<CanvasSkillCard[]>(
    () =>
      copy.skills && copy.skills.length > 0
        ? copy.skills
        : isZh
          ? [
              {
                id: "commerce",
                title: "电商套图",
                description: "生成一套跨平台商品主视觉",
                prompt:
                  "帮我做一套电商主图，包含主图、卖点图和细节展示，产品是：",
                composerPrompt: "帮我做一套电商主图，产品是：",
                quickOptions: [
                  {
                    id: "commerce-amazon-listing",
                    label: "Amazon Listing",
                    prompt:
                      "帮我做一套适合 Amazon Listing 的主图套装，包含主图、卖点图、尺寸/细节展示，产品是：",
                  },
                  {
                    id: "commerce-shopify-hero",
                    label: "Shopify Hero",
                    prompt:
                      "帮我做一组适合 Shopify 独立站首页 Hero Banner 与首屏产品视觉，产品是：",
                  },
                  {
                    id: "commerce-meta-ads",
                    label: "Meta Ads",
                    prompt:
                      "帮我做一组适合 Facebook / Instagram 投放的电商广告素材，突出卖点与转化感，产品是：",
                  },
                  {
                    id: "commerce-pdp-features",
                    label: "PDP 卖点图",
                    prompt:
                      "帮我做一组适合海外电商 PDP 详情页的卖点讲解图，突出功能、对比与使用场景，产品是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "commerce",
              },
              {
                id: "poster",
                title: "海报设计",
                description: "营销、节日和活动主视觉",
                prompt: "帮我设计一张海报主视觉，主题是：",
                composerPrompt: "帮我设计一张海报，主题是：",
                quickOptions: [
                  {
                    id: "poster-sale-campaign",
                    label: "促销活动",
                    prompt:
                      "帮我设计一张适合海外电商促销活动的海报，突出折扣、限时感和购买转化，主题是：",
                  },
                  {
                    id: "poster-seasonal-launch",
                    label: "季节上新",
                    prompt:
                      "帮我设计一张适合季节上新发布的产品海报，强调新品氛围和品牌调性，主题是：",
                  },
                  {
                    id: "poster-social-announcement",
                    label: "社媒宣发",
                    prompt:
                      "帮我设计一张适合 Instagram / Facebook 宣发的品牌海报，画面抓眼、适合线上传播，主题是：",
                  },
                  {
                    id: "poster-event-key-visual",
                    label: "活动主视觉",
                    prompt:
                      "帮我设计一张品牌活动主视觉海报，强调视觉冲击力和统一品牌感，主题是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "poster",
              },
              {
                id: "brand",
                title: "品牌设计",
                description: "Logo、VI 和品牌识别方向",
                prompt: "为我的品牌做一套视觉方案，品牌名称是：",
                composerPrompt: "为我的品牌做一套视觉方案，品牌名称是：",
                quickOptions: [
                  {
                    id: "brand-logo-design",
                    label: "Logo 设计",
                    prompt: "为我的公司设计一套 Logo，公司名字是：",
                  },
                  {
                    id: "brand-vi-system",
                    label: "VI 全套设计",
                    prompt:
                      "为我的品牌设计一套完整 VI 视觉识别系统，品牌名称是：",
                  },
                  {
                    id: "brand-campaign",
                    label: "品牌战役",
                    prompt:
                      "为我的品牌策划一套 campaign 主视觉方向，包含核心视觉语言与传播风格，品牌名称是：",
                  },
                  {
                    id: "brand-assets",
                    label: "品牌周边",
                    prompt:
                      "为我的品牌设计一组品牌周边延展视觉，包含包装、贴纸或礼品风格，品牌名称是：",
                  },
                  {
                    id: "brand-ip-design",
                    label: "IP 设计",
                    prompt:
                      "为我的品牌设计一个专属 IP 形象与视觉设定，品牌名称是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "brand",
              },
              {
                id: "interior",
                title: "室内设计",
                description: "配色研究、改造概念和材质板",
                prompt: "帮我做一套室内设计方案，空间需求是：",
                composerPrompt: "帮我做一套室内设计方案，空间需求是：",
                quickOptions: [
                  {
                    id: "interior-3d-render",
                    label: "3D 渲染",
                    prompt:
                      "帮我做一组室内设计 3D 渲染效果图，强调空间氛围、光影和整体风格，空间需求是：",
                  },
                  {
                    id: "interior-floor-plan",
                    label: "彩平图",
                    prompt:
                      "帮我做一张室内设计彩平图，清晰展示功能分区、动线和软装配色，空间需求是：",
                  },
                  {
                    id: "interior-material-board",
                    label: "材质拼板",
                    prompt:
                      "帮我做一组室内设计材质拼板，体现主材、配色和风格方向，空间需求是：",
                  },
                  {
                    id: "interior-furniture-plan",
                    label: "家具方案",
                    prompt:
                      "帮我做一套室内家具配置方案，突出家具组合、尺度和风格统一，空间需求是：",
                  },
                  {
                    id: "interior-detail-closeup",
                    label: "细部大样",
                    prompt:
                      "帮我做一组室内设计细部大样图，突出节点、材质收口和局部质感，空间需求是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "interior",
              },
              {
                id: "social",
                title: "社交媒体",
                description: "轮播、跨平台素材和投放创意",
                prompt: "帮我做一组海外社交媒体视觉，产品或主题是：",
                composerPrompt: "帮我做一组海外社交媒体视觉，产品或主题是：",
                quickOptions: [
                  {
                    id: "social-carousel",
                    label: "Carousel",
                    prompt:
                      "帮我做一组适合 Instagram / LinkedIn 的社交轮播图，强调连续叙事和统一视觉，产品或主题是：",
                  },
                  {
                    id: "social-cross-platform",
                    label: "Cross-Platform",
                    prompt:
                      "帮我做一组适配 Instagram、Facebook、X 和 LinkedIn 的跨平台社交媒体视觉，产品或主题是：",
                  },
                  {
                    id: "social-paid-creative",
                    label: "Paid Creative",
                    prompt:
                      "帮我做一组适合 Meta Ads / TikTok Ads 的投放创意素材，突出转化和卖点表达，产品或主题是：",
                  },
                  {
                    id: "social-video-cover",
                    label: "Video Cover",
                    prompt:
                      "帮我做一组适合 YouTube Shorts、TikTok 或 Reels 的视频封面与横封视觉，产品或主题是：",
                  },
                  {
                    id: "social-static-post",
                    label: "Static Posts",
                    prompt:
                      "帮我做一组适合海外社交平台日常发帖的图文视觉，强调品牌感和互动感，产品或主题是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "social",
              },
              {
                id: "story",
                title: "故事短片",
                description: "自动生成剧本和分镜驱动短片",
                prompt: "帮我做一支适合海外平台的故事短片，主题是：",
                composerPrompt: "帮我做一支适合海外平台的故事短片，主题是：",
                quickOptions: [
                  {
                    id: "story-narrative-short",
                    label: "故事短片",
                    prompt:
                      "帮我做一支适合海外短视频平台传播的故事短片，强调情节起伏、情感钩子和结尾反转，主题是：",
                  },
                  {
                    id: "story-micro-drama",
                    label: "微短剧",
                    prompt:
                      "帮我做一支适合 TikTok / Reels 风格的微短剧，节奏快、冲突强、适合连续追更，主题是：",
                  },
                  {
                    id: "story-cinematic-short",
                    label: "电影感短片",
                    prompt:
                      "帮我做一支电影感剧情短片，强调镜头语言、氛围和情绪张力，主题是：",
                  },
                  {
                    id: "story-vlog-short",
                    label: "Vlog 短片",
                    prompt:
                      "帮我做一支带剧情包装的 Vlog 短片，适合 YouTube Shorts / TikTok 的生活方式内容，主题是：",
                  },
                  {
                    id: "story-creative-ad",
                    label: "创意广告片",
                    prompt:
                      "帮我做一支带故事线的创意广告短片，适合海外社交平台投放和品牌传播，主题是：",
                  },
                ],
                sceneCategory: "Video",
                icon: "story",
              },
              {
                id: "marketing",
                title: "营销视频",
                description: "一句话生成营销推广视频概念",
                prompt: "帮我做一支适合海外市场的营销视频，产品或主题是：",
                composerPrompt:
                  "帮我做一支适合海外市场的营销视频，产品或主题是：",
                quickOptions: [
                  {
                    id: "marketing-video-feed-15s",
                    label: "信息流 15s",
                    prompt:
                      "帮我做一支适合 TikTok、Reels 和 Meta Feed 投放的 15 秒信息流营销视频，强调前 3 秒钩子和转化表达，产品或主题是：",
                  },
                  {
                    id: "marketing-video-tvc-30s",
                    label: "标准 TVC 30s",
                    prompt:
                      "帮我做一支 30 秒标准 TVC 风格的营销视频，强调品牌质感、卖点铺陈和完整节奏，产品或主题是：",
                  },
                  {
                    id: "marketing-video-brand-story-60s",
                    label: "品牌故事 60s",
                    prompt:
                      "帮我做一支 60 秒品牌故事营销视频，强调品牌价值、情绪氛围和长期记忆点，产品或主题是：",
                  },
                  {
                    id: "marketing-video-amazon",
                    label: "亚马逊适配",
                    prompt:
                      "帮我做一支适合 Amazon Listing / Marketplace 商品页的营销视频，突出功能演示和购买决策信息，产品或主题是：",
                  },
                ],
                sceneCategory: "Video",
                icon: "marketing",
              },
              {
                id: "comic",
                title: "智能漫画",
                description: "分镜画面和角色一致短场景",
                prompt: "帮我做一组漫画分镜场景，主题是：",
                composerPrompt:
                  "帮我做一组适合海外受众的智能漫剧内容，主题是：",
                quickOptions: [
                  {
                    id: "comic-narrative-short",
                    label: "剧情短片",
                    prompt:
                      "帮我做一组剧情短片式漫剧分镜，强调故事推进、镜头节奏和角色一致性，主题是：",
                  },
                  {
                    id: "comic-series",
                    label: "系列漫剧",
                    prompt:
                      "帮我做一组适合海外平台连载的系列漫剧内容，强调章节感、角色稳定和追更动力，主题是：",
                  },
                  {
                    id: "comic-character-sheet",
                    label: "角色定稿",
                    prompt:
                      "帮我做一组漫剧角色定稿与设定图，确保角色外观、服装和气质统一，主题是：",
                  },
                  {
                    id: "comic-storyboard",
                    label: "漫画分镜板",
                    prompt:
                      "帮我做一组漫画分镜板，突出镜头构图、情节转场和阅读节奏，主题是：",
                  },
                  {
                    id: "comic-character-showcase",
                    label: "角色展示",
                    prompt:
                      "帮我做一组角色展示型漫剧画面，用于展示主角魅力、设定和世界观，主题是：",
                  },
                ],
                sceneCategory: "Image",
                icon: "comic",
              },
            ]
          : [
              {
                id: "commerce",
                title: "Commerce Set",
                description:
                  "Generate a full cross-platform product key visual set",
                prompt:
                  "Create a full e-commerce key visual set with a hero image, feature frames, and close-up details for:",
                composerPrompt:
                  "Create a commerce hero image set for this product:",
                quickOptions: [
                  {
                    id: "commerce-amazon-listing",
                    label: "Amazon Listing",
                    prompt:
                      "Create an Amazon listing image set for this product, including the main image, key feature slides, and size/detail frames:",
                  },
                  {
                    id: "commerce-shopify-hero",
                    label: "Shopify Hero",
                    prompt:
                      "Create a Shopify storefront hero banner and above-the-fold product visual set for this product:",
                  },
                  {
                    id: "commerce-meta-ads",
                    label: "Meta Ads",
                    prompt:
                      "Create a set of Meta ad creatives for Facebook and Instagram focused on conversion and clear product benefits for this product:",
                  },
                  {
                    id: "commerce-pdp-features",
                    label: "PDP Features",
                    prompt:
                      "Create a PDP feature visual pack for this product with benefit callouts, comparison moments, and usage scenarios:",
                  },
                ],
                sceneCategory: "Image",
                icon: "commerce",
              },
              {
                id: "poster",
                title: "Poster Design",
                description: "Marketing, holiday, and campaign key visuals",
                prompt:
                  "Design a campaign poster key visual with strong brand presence for:",
                composerPrompt: "Design a poster for this theme:",
                quickOptions: [
                  {
                    id: "poster-sale-campaign",
                    label: "Sale Campaign",
                    prompt:
                      "Design a promotional poster for an overseas ecommerce sale campaign with strong discount messaging, urgency, and conversion-focused hierarchy for this theme:",
                  },
                  {
                    id: "poster-seasonal-launch",
                    label: "Seasonal Launch",
                    prompt:
                      "Design a seasonal product launch poster with a fresh campaign feel and a strong branded visual direction for this theme:",
                  },
                  {
                    id: "poster-social-announcement",
                    label: "Social Promo",
                    prompt:
                      "Design a poster for Instagram and Facebook promotion with bold visual impact and strong social-first composition for this theme:",
                  },
                  {
                    id: "poster-event-key-visual",
                    label: "Event KV",
                    prompt:
                      "Design an event key visual poster with clear hierarchy, campaign polish, and strong brand presence for this theme:",
                  },
                ],
                sceneCategory: "Image",
                icon: "poster",
              },
              {
                id: "brand",
                title: "Brand Design",
                description: "Logo, VI, and full brand identity directions",
                prompt:
                  "Create a brand visual direction including logo mood, color system, and key visuals for:",
                composerPrompt:
                  "Create a brand visual system for this company:",
                quickOptions: [
                  {
                    id: "brand-logo-design",
                    label: "Logo Design",
                    prompt:
                      "Design a logo system for my company. The company name is:",
                  },
                  {
                    id: "brand-vi-system",
                    label: "VI System",
                    prompt:
                      "Create a full visual identity system for my brand, including color, typography, and core brand rules. The brand name is:",
                  },
                  {
                    id: "brand-campaign",
                    label: "Brand Campaign",
                    prompt:
                      "Create a brand campaign visual direction with a clear hero look, communication mood, and rollout style. The brand name is:",
                  },
                  {
                    id: "brand-assets",
                    label: "Brand Assets",
                    prompt:
                      "Create a set of branded merchandise and supporting visual assets for my brand. The brand name is:",
                  },
                  {
                    id: "brand-ip-design",
                    label: "IP Design",
                    prompt:
                      "Design a signature brand IP character and visual world for my brand. The brand name is:",
                  },
                ],
                sceneCategory: "Image",
                icon: "brand",
              },
              {
                id: "interior",
                title: "Interior Design",
                description:
                  "Color studies, renovation concepts, and material boards",
                prompt:
                  "Create an interior design concept set with a main view and material moodboard for:",
                composerPrompt:
                  "Create an interior design concept for this space:",
                quickOptions: [
                  {
                    id: "interior-3d-render",
                    label: "3D Render",
                    prompt:
                      "Create a set of interior 3D renders with strong atmosphere, lighting, and a cohesive design direction for this space:",
                  },
                  {
                    id: "interior-floor-plan",
                    label: "Color Plan",
                    prompt:
                      "Create a colored floor plan that clearly shows zoning, circulation, and key furniture layout for this space:",
                  },
                  {
                    id: "interior-material-board",
                    label: "Material Board",
                    prompt:
                      "Create an interior material board with finishes, colors, and style references for this space:",
                  },
                  {
                    id: "interior-furniture-plan",
                    label: "Furniture Plan",
                    prompt:
                      "Create an interior furniture plan with coordinated furniture choices, layout logic, and style consistency for this space:",
                  },
                  {
                    id: "interior-detail-closeup",
                    label: "Detail Views",
                    prompt:
                      "Create a set of interior detail views that highlight joinery, material transitions, and local design moments for this space:",
                  },
                ],
                sceneCategory: "Image",
                icon: "interior",
              },
              {
                id: "social",
                title: "Social Media",
                description:
                  "Carousels, cross-platform assets, paid creatives, and covers",
                prompt:
                  "Create a social media visual set with a unified style for:",
                composerPrompt:
                  "Create an overseas social media visual set for this product or theme:",
                quickOptions: [
                  {
                    id: "social-carousel",
                    label: "Carousel",
                    prompt:
                      "Create a social carousel set for Instagram and LinkedIn with strong visual continuity and clear storytelling for this product or theme:",
                  },
                  {
                    id: "social-cross-platform",
                    label: "Cross-Platform",
                    prompt:
                      "Create a cross-platform social asset set adapted for Instagram, Facebook, X, and LinkedIn for this product or theme:",
                  },
                  {
                    id: "social-paid-creative",
                    label: "Paid Creative",
                    prompt:
                      "Create a set of paid social creatives for Meta Ads and TikTok Ads with conversion-focused messaging and clear product benefits for this product or theme:",
                  },
                  {
                    id: "social-video-cover",
                    label: "Video Cover",
                    prompt:
                      "Create a set of video cover visuals for YouTube Shorts, TikTok, and Reels for this product or theme:",
                  },
                  {
                    id: "social-static-post",
                    label: "Static Posts",
                    prompt:
                      "Create a set of branded static social posts for overseas platforms with strong engagement and brand consistency for this product or theme:",
                  },
                ],
                sceneCategory: "Image",
                icon: "social",
              },
              {
                id: "story",
                title: "Story Short",
                description:
                  "Auto-generate scripts and storyboard-driven shorts",
                prompt:
                  "Create a storyboard-driven short video with a clear narrative arc for:",
                composerPrompt:
                  "Create a story-driven short video for overseas platforms around this theme:",
                quickOptions: [
                  {
                    id: "story-narrative-short",
                    label: "Narrative Short",
                    prompt:
                      "Create a narrative short for overseas short-video platforms with a strong hook, emotional arc, and satisfying twist around this theme:",
                  },
                  {
                    id: "story-micro-drama",
                    label: "Micro Drama",
                    prompt:
                      "Create a fast-paced micro drama for TikTok and Reels with high conflict, cliffhanger energy, and bingeable structure around this theme:",
                  },
                  {
                    id: "story-cinematic-short",
                    label: "Cinematic Short",
                    prompt:
                      "Create a cinematic short with strong visual language, mood, and emotional tension around this theme:",
                  },
                  {
                    id: "story-vlog-short",
                    label: "Vlog Short",
                    prompt:
                      "Create a story-led vlog short for YouTube Shorts and TikTok with lifestyle energy and natural pacing around this theme:",
                  },
                  {
                    id: "story-creative-ad",
                    label: "Creative Ad",
                    prompt:
                      "Create a story-driven creative ad short for overseas social platforms with clear brand appeal and strong audience retention around this theme:",
                  },
                ],
                sceneCategory: "Video",
                icon: "story",
              },
              {
                id: "marketing",
                title: "Marketing Video",
                description:
                  "Turn one sentence into a promotional video concept",
                prompt:
                  "Create a marketing video concept for an international audience about:",
                composerPrompt:
                  "Create a marketing video for overseas audiences around this product or theme:",
                quickOptions: [
                  {
                    id: "marketing-video-feed-15s",
                    label: "15s Feed Ad",
                    prompt:
                      "Create a 15-second feed ad for TikTok, Reels, and Meta placements with a strong first-3-second hook and clear conversion messaging for this product or theme:",
                  },
                  {
                    id: "marketing-video-tvc-30s",
                    label: "30s TVC",
                    prompt:
                      "Create a 30-second TVC-style marketing video with strong brand polish, clear product benefits, and a complete narrative arc for this product or theme:",
                  },
                  {
                    id: "marketing-video-brand-story-60s",
                    label: "60s Brand Story",
                    prompt:
                      "Create a 60-second brand story marketing video with emotional pacing, brand values, and memorable storytelling for this product or theme:",
                  },
                  {
                    id: "marketing-video-amazon",
                    label: "Amazon Ready",
                    prompt:
                      "Create a marketplace-ready product marketing video for Amazon and similar listings with clear feature demos and decision-driving information for this product or theme:",
                  },
                ],
                sceneCategory: "Video",
                icon: "marketing",
              },
              {
                id: "comic",
                title: "Smart Comic",
                description:
                  "Storyboard scenes and character-consistent short-form frames",
                prompt: "Create a smart comic storyboard about:",
                composerPrompt:
                  "Create a smart comic concept for overseas audiences around this theme:",
                quickOptions: [
                  {
                    id: "comic-narrative-short",
                    label: "Narrative Short",
                    prompt:
                      "Create a comic-style narrative short with clear scene progression, pacing, and consistent characters around this theme:",
                  },
                  {
                    id: "comic-series",
                    label: "Series Comic",
                    prompt:
                      "Create a serialized comic concept for overseas platforms with recurring characters, episode continuity, and bingeable appeal around this theme:",
                  },
                  {
                    id: "comic-character-sheet",
                    label: "Character Sheet",
                    prompt:
                      "Create a character sheet set for a smart comic project with stable appearance, outfit logic, and personality clarity around this theme:",
                  },
                  {
                    id: "comic-storyboard",
                    label: "Storyboard",
                    prompt:
                      "Create a comic storyboard board with strong framing, readable action beats, and clear visual transitions around this theme:",
                  },
                  {
                    id: "comic-character-showcase",
                    label: "Character Showcase",
                    prompt:
                      "Create a character showcase set for a smart comic project that highlights hero appeal, design details, and world-building around this theme:",
                  },
                ],
                sceneCategory: "Image",
                icon: "comic",
              },
            ],
    [copy.skills, isZh],
  );

  const selectedSkill = useMemo(
    () => skillCards.find((skill) => skill.id === selectedSkillId) ?? null,
    [selectedSkillId, skillCards],
  );

  const handleSelectSkill = (skill: CanvasSkillCard) => {
    setSelectedSkillId(skill.id);
    setSelectedQuickOptionId(null);
    setPrompt(skill.composerPrompt ?? skill.prompt);
    const targetScene =
      skill.sceneCategory === "Video" ? videoScene : imageScene;
    if (targetScene?.id) {
      setSelectedSceneId(targetScene.id);
    }
    focusPromptInput();
  };

  const handleSelectQuickOption = (option: { id: string; prompt: string }) => {
    setSelectedQuickOptionId(option.id);
    setPrompt(option.prompt);
    focusPromptInput();
  };

  const focusPromptInput = () => {
    requestAnimationFrame(() => {
      const input = document.getElementById(
        "canvas-projects-prompt-input",
      ) as HTMLInputElement | null;
      if (!input) return;
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    });
  };

  const openPlusMenu = () => {
    const container = inputCardRef.current;
    const button = plusButtonRef.current;
    if (!container || !button) return;
    setPlusMenuPosition({
      x: button.offsetLeft,
      y: button.offsetTop + button.offsetHeight + 12,
    });
    setPlusMenuOpen(true);
  };

  const handleReferenceFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setReferencePreviews((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        }));
    });
  };

  useEffect(() => {
    return () => {
      referencePreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [referencePreviews]);

  const plusMenuCommands = useMemo<CanvasCommandType[]>(() => {
    const virtualNode =
      referencePreviews.length > 0
        ? {
            id: "projects-virtual-image-input",
            kind: "input" as const,
            subtype: "upload" as const,
            position: { x: 0, y: 0 },
            size: { width: 0, height: 0 },
            data: {
              label:
                referencePreviews[0]?.name ||
                copy.virtualReferenceLabel ||
                "Reference image",
              mediaKind: "image" as const,
              url: referencePreviews[0]?.previewUrl,
            },
          }
        : {
            id: "projects-virtual-text",
            kind: "text" as const,
            subtype: "copy" as const,
            position: { x: 0, y: 0 },
            size: { width: 0, height: 0 },
            data: {
              label: copy.virtualPromptLabel || "Prompt",
              content: prompt,
            },
          };

    return getAvailableCommandsForNode(virtualNode);
  }, [prompt, referencePreviews]);

  const handlePlusMenuSelect = (command: CanvasCommandType) => {
    setPlusMenuOpen(false);

    if (command === "text-to-video" || command === "image-to-video") {
      if (videoScene?.id) {
        setSelectedSceneId(videoScene.id);
      }
      setSelectedSkillId("story");
      focusPromptInput();
      return;
    }

    if (command === "text-to-image" || command === "image-to-image") {
      if (imageScene?.id) {
        setSelectedSceneId(imageScene.id);
      }
      setSelectedSkillId("commerce");
      focusPromptInput();
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    const confirmed = window.confirm(
      copy.deleteConfirm.replace("{name}", projectName),
    );
    if (!confirmed) return;

    try {
      setDeletingId(projectId);
      const response = await fetch(
        `/api/workbench/canvas-projects/${projectId}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || copy.deleteError);
      }

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      toast.success(copy.deleteSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      setDuplicatingId(projectId);
      const response = await fetch(
        `/api/workbench/canvas-projects/${projectId}/duplicate`,
        {
          method: "POST",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.project) {
        throw new Error(result?.message || copy.duplicateError);
      }

      setProjects((prev) => [result.data.project, ...prev]);
      toast.success(copy.duplicateSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.duplicateError);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCreateProject = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || !selectedScene || !defaultModelUrl) {
      toast.error(copy.submitError);
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/workbench/canvas-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedPrompt.slice(0, 48),
          entrySceneId: selectedScene.id,
          entryModelUrl: defaultModelUrl,
          initialGraph: createInitialGraph({
            sceneId: selectedScene.id,
            sceneLabel: selectedScene.title,
            modelUrl: defaultModelUrl,
            modelLabel: defaultModelLabel,
            prompt: trimmedPrompt,
          }),
          meta: {
            source: "canvas-projects",
            autoGenerate: true,
          },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.project?.id) {
        throw new Error(result?.message || copy.submitError);
      }

      window.sessionStorage.setItem(
        `${PROJECT_AUTO_GENERATE_STORAGE_KEY_PREFIX}${result.data.project.id}`,
        "1",
      );
      window.location.assign(
        `/${locale}/create/canvas/${result.data.project.id}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.submitError);
    } finally {
      setCreating(false);
    }
  };

  const createHref = useMemo(() => {
    if (!selectedScene || !defaultModelUrl) {
      return `/${locale}/create/canvas`;
    }
    const params = new URLSearchParams();
    params.set("scene", selectedScene.id);
    const modelSlug = getModelSlug(defaultModelUrl);
    if (modelSlug) params.set("model", modelSlug);
    return `/${locale}/create/canvas?${params.toString()}`;
  }, [defaultModelUrl, locale, selectedScene]);

  return (
    <div className="space-y-10 pb-10 sm:space-y-12">
      <section className="relative overflow-hidden px-2 py-4 sm:px-4 sm:py-7 lg:px-8 lg:py-8">
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 text-center sm:gap-6">
          <div className="relative flex items-center justify-center gap-4 space-y-1.5">
            <div className="pointer-events-none hidden shrink-0 sm:block">
              <span className="absolute left-[1.75rem] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,255,153,0.28),rgba(17,255,153,0.08)_58%,transparent_82%)] blur-md" />
              <img
                src={CANVAS_AGENT_AVATAR_URL}
                alt=""
                className="relative size-14 object-contain drop-shadow-[0_12px_24px_rgba(17,255,153,0.22)]"
              />
            </div>
            <h1 className="text-balance text-[2rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.8rem] lg:text-[3.5rem]">
              {copy.heroTitle}
            </h1>
          </div>

          <div className="w-full">
            <div
              ref={inputCardRef}
              className="relative rounded-[26px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#111317,#0b0d10)] p-3.5 shadow-[0_20px_56px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleReferenceFileChange(event.target.files);
                  event.target.value = "";
                }}
              />
              <div className="flex min-h-[7.4rem] flex-col justify-between">
                <div className="flex items-start gap-2.5">
                  <button
                    ref={plusButtonRef}
                    type="button"
                    onClick={openPlusMenu}
                    className="mt-0.5 flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[16px] border border-white/[0.08] bg-white/[0.03] text-white/52 transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
                  >
                    <Plus className="size-4.5" />
                  </button>

                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <input
                      id="canvas-projects-prompt-input"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCreateProject();
                        }
                      }}
                      placeholder={copy.heroPlaceholder}
                      className="h-10 w-full bg-transparent px-1 pt-0.5 text-left text-[0.9rem] leading-7 text-white outline-none placeholder:text-white/28"
                    />

                    {referencePreviews.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {referencePreviews.map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-[12px] border border-white/[0.08] bg-white/[0.03]"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="h-12 w-12 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="relative mt-2 flex flex-col gap-2.5 border-t border-white/[0.06] pt-2.5 text-white/54">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/74"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={
                        copy.uploadReferenceAria || "Upload reference"
                      }
                    >
                      <Paperclip className="size-4" />
                    </button>

                    <div className="hidden h-6 w-px bg-white/[0.1] sm:block" />

                    <div className="inline-flex h-8 items-center gap-2 rounded-full px-1 text-[0.78rem] font-medium text-white/82 transition">
                      <Sparkles className="size-3.5" />
                      <span>{copy.autoLabel || "AUTO"}</span>
                    </div>

                    {selectedSkill?.quickOptions?.length ? (
                      <div className="flex flex-1 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="hidden h-6 w-px bg-white/[0.1] sm:block" />
                        {selectedSkill.quickOptions.map((option) => {
                          const active = option.id === selectedQuickOptionId;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleSelectQuickOption(option)}
                              className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[0.8rem] font-semibold transition ${
                                active
                                  ? "border border-[#2ab8ff] bg-[#2ab8ff]/12 text-white shadow-[inset_0_0_0_1px_rgba(42,184,255,0.75)]"
                                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.09] hover:text-white"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedQuickOptionId(null)}
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/38 transition hover:bg-white/[0.04] hover:text-white/72"
                          aria-label={
                            copy.closeDirectionAria ||
                            (isZh ? "关闭方向卡片" : "Close")
                          }
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-3 sm:ml-auto">
                      <div className="hidden h-6 w-px bg-white/[0.1] sm:block" />
                      <button
                        type="button"
                        onClick={() => void handleCreateProject()}
                        disabled={creating || !prompt.trim()}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4.5 text-[0.88rem] font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {creating ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>{copy.heroSubmit}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {plusMenuOpen ? (
                <CanvasCommandMenu
                  x={plusMenuPosition.x}
                  y={plusMenuPosition.y}
                  title={
                    copy.plusMenuTitle ||
                    (isZh ? "引用该节点生成" : "Generate from this node")
                  }
                  commands={plusMenuCommands}
                  onSelect={handlePlusMenuSelect}
                  onClose={() => setPlusMenuOpen(false)}
                />
              ) : null}
            </div>
          </div>

          <div className="w-full pt-1 text-left">
            <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-3">
                {skillCards.map((skill) => {
                  const Icon = SKILL_CARD_ICON_MAP[skill.icon];
                  const active = selectedSkillId === skill.id;

                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSelectSkill(skill)}
                      className={`group flex h-[3.2rem] w-[10.75rem] shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 text-left transition ${
                        active
                          ? "border-[#b6ff1a]/55 bg-white/[0.06] shadow-[0_0_0_1px_rgba(182,255,26,0.12),0_0_24px_rgba(182,255,26,0.08)]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        className={`flex size-7.5 shrink-0 items-center justify-center rounded-full border transition ${
                          active
                            ? "border-[#b6ff1a] bg-[#b6ff1a] text-black"
                            : "border-white/[0.08] bg-white/[0.04] text-white/84"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.84rem] font-semibold tracking-[-0.03em] text-white">
                          {skill.title}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
              {copy.sectionTitle}
            </h2>
          </div>
          <span className="text-sm font-medium text-white/42">
            {copy.sectionAction}
          </span>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-4 lg:gap-5">
            <Link
              href={createHref}
              className="group flex w-[15rem] shrink-0 cursor-pointer flex-col"
            >
              <div className="flex aspect-[1.16/1] items-center justify-center overflow-hidden rounded-[28px] border border-[color:var(--color-frost-border)] bg-[radial-gradient(circle_at_top_left,rgba(214,235,253,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(17,255,153,0.18),transparent_30%),linear-gradient(135deg,rgba(151,206,234,0.95),rgba(76,205,164,0.92))] shadow-[var(--shadow-ring-frost),0_24px_72px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-ring-frost),0_32px_90px_rgba(0,0,0,0.35)]">
                <span className="inline-flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition duration-300 group-hover:scale-105">
                  <Plus className="size-8" />
                </span>
              </div>
              <div className="px-3 pt-4">
                <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {copy.createCardTitle}
                </div>
                <div className="mt-1 text-sm text-white/42">
                  {copy.createCardSubtitle}
                </div>
              </div>
            </Link>

            {projects.map((project) => (
              <article
                key={project.id}
                className="group flex w-[18rem] shrink-0 flex-col"
              >
                <Link
                  href={`/${locale}/create/canvas/${project.id}`}
                  className="block overflow-hidden rounded-[28px] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,#0B0E12_0%,#07090C_100%)] shadow-[var(--shadow-ring-frost),0_24px_70px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:border-[color:var(--color-frost-border)] hover:shadow-[var(--shadow-ring-frost),0_30px_80px_rgba(0,0,0,0.36)]"
                >
                  <div className="aspect-[1.34/1] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(214,235,253,0.14),transparent_28%),linear-gradient(135deg,rgba(135,206,235,0.82),rgba(96,218,176,0.84))]">
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold tracking-[0.18em] text-white/36 uppercase">
                        {pageTitle}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-3 px-3 pt-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${locale}/create/canvas/${project.id}`}
                      className="block truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-white"
                    >
                      {project.name}
                    </Link>
                    <div className="mt-1 text-sm text-white/42">
                      {copy.updatedAtPrefix}
                      {new Intl.DateTimeFormat(locale, {
                        month: "2-digit",
                        day: "2-digit",
                      }).format(new Date(project.updatedAt))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDuplicate(project.id)}
                      disabled={duplicatingId === project.id}
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/52 transition hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={copy.duplicateAria}
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(project.id, project.name)
                      }
                      disabled={deletingId === project.id}
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/52 transition hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={copy.deleteAria}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-transparent text-white/28">
                      <Ellipsis className="size-4" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
