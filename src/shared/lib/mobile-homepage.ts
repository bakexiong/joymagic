import { cache } from "react";
import { z } from "zod";
import {
  parseExploreConfig,
  ExploreConfig,
} from "@/shared/models/explore-config";
import { MediaItem } from "@/shared/blocks/explore/media-card";
import { DEFAULT_TEXT_TO_VIDEO_MODEL_URL } from "@/shared/lib/video-model-defaults";
import { filterBorderlineExploreConfig } from "@/shared/lib/explore-content-filter";
import { withOssImageMaxSide } from "@/shared/lib/cdn";

/**
 * 解析 + 过滤 explore_page_config 的合并入口。
 * 用 React `cache()` 包裹，使同一次请求内 PC 端与移动端两次调用共享一次解析+过滤结果，
 * 避免 186 词 borderline 扫描在一次渲染里跑两遍。
 */
const parseAndFilterExploreConfig = cache(
  (raw: string | undefined): ExploreConfig => {
    return filterBorderlineExploreConfig(parseExploreConfig(raw ?? null));
  },
);

const bannerSlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  titleHighlight: z.string().optional(), // 高亮部分文字（如 "Lite"）
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageSrc: z.string(),
  imageAlt: z.string().optional(),
  videoSrc: z.string().optional(),
  previewVideoSrc: z.string().optional(),
  videoPoster: z.string().optional(),
  href: z.string().optional(),
  badge: z.string().optional(),
  modelId: z.string().optional(), // 模型 ID，用于登录后跳转
  sceneId: z.string().optional(), // 场景 ID，用于登录后跳转
});

const bannerSlidesSchema = z.array(bannerSlideSchema);

export type MobileHomepageBannerSlide = z.infer<typeof bannerSlideSchema>;
export type MobileHomepageShowcaseGroup = {
  id?: string;
  title: string;
  viewAllHref?: string;
  items: MediaItem[];
  enabled?: boolean;
};

export type MobileHomepageConfig = {
  legacyHref: string;
  createImageHref: string;
  createVideoHref: string;
  bannerSlides: MobileHomepageBannerSlide[];
  showcaseGroups: MobileHomepageShowcaseGroup[];
};

/**
 * 将远端图片地址改为 OSS 处理后的可控尺寸，避免客户端拉取源站原图大文件。
 * 约定：使用 x-oss-process=image/resize,m_fill,w_x,h_y。
 */
function withOssResizeParams(imageSrc: string, width: number, height: number) {
  const ossProcess = `image/resize,m_fill,w_${width},h_${height}`;

  try {
    const url = new URL(imageSrc);
    // 清理 next/image 风格的多余查询参数，提升 CDN 缓存命中
    url.searchParams.delete("w");
    url.searchParams.delete("q");

    const currentProcess = url.searchParams.get("x-oss-process");
    if (!currentProcess) {
      url.searchParams.set("x-oss-process", ossProcess);
      return url.toString();
    }

    // 如果已有 resize 参数，直接替换目标尺寸；其余处理参数保持不变
    const replacedProcess = currentProcess.match(
      /image\/resize,m_fill,w_\d+,h_\d+/,
    )
      ? currentProcess.replace(/image\/resize,m_fill,w_\d+,h_\d+/, ossProcess)
      : `${currentProcess}/resize,m_fill,w_${width},h_${height}`;

    url.searchParams.set("x-oss-process", replacedProcess);
    return url.toString();
  } catch {
    // 兜底：非标准 URL 直接拼接
    return imageSrc.includes("?")
      ? `${imageSrc}&x-oss-process=${ossProcess}`
      : `${imageSrc}?x-oss-process=${ossProcess}`;
  }
}

function optimizeBannerSlides(
  slides: MobileHomepageBannerSlide[],
  width: number,
  height: number,
): MobileHomepageBannerSlide[] {
  return slides.map((slide) => ({
    ...slide,
    imageSrc: withOssResizeParams(slide.imageSrc, width, height),
  }));
}

function normalizeWorkbenchEntryHref(
  value: string | undefined,
  fallback: string,
  legacyRoutes: string[],
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue || legacyRoutes.includes(normalizedValue)) {
    return fallback;
  }

  return normalizedValue;
}

const defaultBannerSlides: MobileHomepageBannerSlide[] = [
  {
    id: "happyhorse-coming-soon",
    title: "HappyHorse IS HERE",
    titleHighlight: "20% OFF",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/icon/image_1776520716328_789369.mp4?x-oss-process=video/snapshot,t_1000,f_jpg,w_1400,h_800,m_fast,q_80",
      1400,
      800,
    ),
    imageAlt: "HappyHorse Coming Soon",
    videoSrc: "https://ocdn.10b.ai/icon/image_1776520716328_789369.mp4",
    previewVideoSrc:
      "https://ocdn.10b.ai/homepage/previews/c216a1218c7589bde9febe7f16d4cffb.mp4",
    href: "/text-to-video/happyhorse-1-0",
    modelId: "/text-to-video/happyhorse-1-0",
    sceneId: "/text-to-video",
    badge: "Happy Horse 1.0 20% OFF",
  },
  {
    id: "gpt-image-1",
    title: "GPT Image 1",
    // banner 容器 aspect-[7/4]，用近似的 w/h 比例提前缩放并避免下载原图
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/gpt-image-1.png",
      1400,
      800,
    ),
    imageAlt: "GPT Image 1",
    href: "/ai-image-generator",
    modelId: "/text-to-image/gpt-image-1",
    sceneId: "/text-to-image/z-image-turbo",
  },
  {
    id: "gpt-image-2",
    title: "GPT IMAGE 2 IS HERE",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/icon/9998223208966580-5f402cd7-725c-4949-85ae-954e52699e78-video_task_01KPRFV7KQAXVJM506T945WZRY.mp4?x-oss-process=video/snapshot,t_1000,f_jpg,w_1400,h_800,m_fast,q_80",
      1400,
      800,
    ),
    imageAlt: "GPT IMAGE 2 IS HERE",
    videoSrc:
      "https://ocdn.10b.ai/icon/9998223208966580-5f402cd7-725c-4949-85ae-954e52699e78-video_task_01KPRFV7KQAXVJM506T945WZRY.mp4",
    previewVideoSrc:
      "https://ocdn.10b.ai/homepage/previews/090530b39ea08171f18378bb9a54193a.mp4",
    href: "/ai-image-generator",
    modelId: "/text-to-image/gpt-image-2",
    sceneId: "/text-to-image/z-image-turbo",
    badge: "New",
  },
  {
    id: "midjourney",
    title: "Midjourney",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/midjounery.png",
      1400,
      800,
    ),
    imageAlt: "Midjourney",
    href: "/ai-image-generator",
    modelId: "/text-to-image/midjourney",
    sceneId: "/text-to-image/z-image-turbo",
  },
  {
    id: "nanobanana-2",
    title: "Nano Banana 2",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/nanobanana-2.png",
      1400,
      800,
    ),
    imageAlt: "Nano Banana 2",
    href: "/ai-image-generator",
    modelId: "/text-to-image/nano-banana-2",
    sceneId: "/text-to-image/z-image-turbo",
  },
  {
    id: "qwen-image-202512",
    title: "Qwen Image 202512",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/qwen_image_202512.jpeg",
      1400,
      800,
    ),
    imageAlt: "Qwen Image 202512",
    href: "/ai-image-generator",
    modelId: "/text-to-image/qwen-image-202512",
    sceneId: "/text-to-image/z-image-turbo",
  },
  {
    id: "seedream-5-0-lite",
    title: "Seedream 5.0 Lite",
    titleHighlight: "Lite",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/seedream-5-0-lite.png",
      1400,
      800,
    ),
    imageAlt: "Seedream 5.0 Lite",
    href: "/ai-image-generator",
    modelId: "/text-to-image/seedream-5-0-lite",
    sceneId: "/text-to-image/z-image-turbo",
  },
  {
    id: "soul",
    title: "Soul",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/soul.png",
      1400,
      800,
    ),
    imageAlt: "Soul",
    href: "/image-to-image/soul",
    modelId: "/image-to-image/soul",
    // CreatorWorkbench 的 scene 是 playground id（/image-to-image），model 是 child（soul）
    sceneId: "/image-to-image",
  },
  {
    id: "z-image-turbo",
    title: "Z Image Turbo",
    imageSrc: withOssResizeParams(
      "https://ocdn.10b.ai/model/model/image/z-image-tubro.png",
      1400,
      800,
    ),
    imageAlt: "Z Image Turbo",
    href: "/image-to-image/z-image-turbo",
    modelId: "/image-to-image/z-image-turbo",
    // CreatorWorkbench 的 scene 是 playground id（/image-to-image），model 是 child（z-image-turbo）
    sceneId: "/image-to-image",
  },
];

function parseJsonValue<T>(
  value: string | undefined,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return schema.parse(parsed);
  } catch (error) {
    console.error("[mobile-homepage] parse config failed:", error);
    return fallback;
  }
}

/**
 * 生成虚拟点赞数，基于图片 ID 生成确定性的点赞数
 */
function generateVirtualLikes(itemId: string): number {
  // 使用简单的哈希算法生成确定性的点赞数
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    const char = itemId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为 32 位整数
  }

  // 将哈希值映射到 100-9999 的范围
  const min = 100;
  const max = 9999;
  const likes = min + (Math.abs(hash) % (max - min + 1));

  return likes;
}

/**
 * 基于图片实际宽高比智能分配 gridSize，创造视觉多样性
 * 优先使用预设的 aspectRatio，避免运行时计算
 */
function assignSmartGridSizes(items: MediaItem[]): MediaItem[] {
  return items.map((item, index) => {
    // 如果已经有 gridSize，保持不变
    if (item.gridSize) {
      return item;
    }

    // 计算宽高比
    let aspectRatio: number;
    if (item.aspectRatio) {
      aspectRatio = item.aspectRatio;
    } else if (item.width && item.height) {
      aspectRatio = item.height / item.width;
    } else {
      // 如果没有尺寸信息，使用确定性算法而非随机
      const pattern = index % 4;
      const gridSize =
        pattern === 0
          ? "large"
          : pattern === 1
            ? "tall"
            : pattern === 2
              ? "medium"
              : "small";
      return { ...item, gridSize };
    }

    // 基于宽高比智能分配 gridSize
    let gridSize: MediaItem["gridSize"];
    if (aspectRatio >= 1.4) {
      // 竖图 (高 > 宽 * 1.4)
      gridSize = "tall";
    } else if (aspectRatio >= 1.1) {
      // 略竖 (高 > 宽 * 1.1)
      gridSize = "large";
    } else if (aspectRatio >= 0.9) {
      // 方图
      gridSize = "small";
    } else {
      // 横图
      gridSize = "medium";
    }

    return {
      ...item,
      gridSize,
      aspectRatio, // 保存计算后的宽高比
      width: item.width, // 保留原始宽度
      height: item.height, // 保留原始高度
    };
  });
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 根据登录状态生成 banner 跳转链接
 * - 未登录：跳转到落地页并携带 model 和 scene 参数
 * - 已登录：跳转到 /creator 并携带 model 和 scene 参数
 */
export function getBannerHref(slide: MobileHomepageBannerSlide): string {
  if (slide.modelId && slide.sceneId) {
    const normalizeSceneId = (value: string) => {
      const v = value.trim();
      return v.startsWith("/") ? v : `/${v}`;
    };

    const inferModelKeyFromHref = (href?: string) => {
      if (!href) return undefined;
      const path = href.split("?")[0].trim();
      // 只在 href 明确包含 playground 路径时才推断，避免 /ai-image-generator 误判
      if (
        !path.includes("/text-to-image/") &&
        !path.includes("/image-to-image/")
      )
        return undefined;
      const parts = path.split("/").filter(Boolean);
      return parts.at(-1);
    };

    const normalizeModelKey = (
      modelId: string,
      sceneId: string,
      href?: string,
    ) => {
      const sceneBase = normalizeSceneId(sceneId)
        .split("/")
        .filter(Boolean)
        .at(0);
      const v = modelId.trim();
      const modelKeyFromId = v.includes("/")
        ? (v.split("/").filter(Boolean).at(-1) ?? v.replace(/^\/+/, ""))
        : v.replace(/^\/+/, "");

      // 如果配置错误导致 modelKey 退化成 sceneBase，则尝试从 href 推断真实模型 key
      if (sceneBase && modelKeyFromId === sceneBase) {
        const keyFromHref = inferModelKeyFromHref(href);
        if (keyFromHref && keyFromHref !== sceneBase) return keyFromHref;
      }

      return modelKeyFromId;
    };

    const normalizedSceneId = normalizeSceneId(slide.sceneId);
    const normalizedModelKey = normalizeModelKey(
      slide.modelId,
      slide.sceneId,
      slide.href,
    );

    const params = new URLSearchParams({
      // CreatorWorkbench 的匹配逻辑期望 model 是 modelKey（url 最后一段）
      model: normalizedModelKey,
      // scene 保持 playground id 形态（带 leading slash）
      scene: normalizedSceneId,
    });

    return `/creator?${params.toString()}`;
  }
  return slide.href || "/ai-image-generator";
}

/**
 * 将 ExploreConfig 转换为 MobileHomepageShowcaseGroup 格式
 * @param limitPerSection - 每个分类限制的数量，undefined 表示不限制
 * @param shuffle - 是否随机打乱顺序，默认 true
 * @param imageMaxSide - 图片长边上限（CDN 等比缩放），用于在 CDN 边缘把原图缩成卡片尺寸
 */
function convertExploreToShowcase(
  exploreConfig: ExploreConfig,
  limitPerSection?: number,
  shuffle: boolean = true,
  imageMaxSide: number = 720,
): MobileHomepageShowcaseGroup[] {
  return exploreConfig.sections
    .map((section, sectionIndex) => {
      // 根据 shuffle 参数决定是否随机打乱 items 顺序
      const itemsSource = shuffle ? shuffleArray(section.items) : section.items;

      // 根据 limitPerSection 决定是否限制数量
      const itemsToUse =
        limitPerSection !== undefined
          ? itemsSource.slice(0, limitPerSection)
          : itemsSource;

      return {
        id: section.id,
        title: section.sceneName,
        viewAllHref: "/explore",
        enabled: true,
        items: assignSmartGridSizes(
          itemsToUse.map((item, itemIndex) => {
            // 给图片走 CDN 缩放，避免拉原图。withOssImageMaxSide 仅对自有 host 生效，
            // 第三方 URL 原样返回；视频/音频的 src 是媒体源，不能动。
            const resizedThumbnail = item.thumbnail
              ? (withOssImageMaxSide(item.thumbnail, imageMaxSide) ??
                item.thumbnail)
              : item.thumbnail;
            const resizedThumbnailUrl = item.thumbnailUrl
              ? (withOssImageMaxSide(item.thumbnailUrl, imageMaxSide) ??
                item.thumbnailUrl)
              : item.thumbnailUrl;
            const resizedSrc =
              item.type === "image" && item.src
                ? (withOssImageMaxSide(item.src, imageMaxSide) ?? item.src)
                : item.src;

            return {
              ...item,
              src: resizedSrc,
              thumbnail: resizedThumbnail,
              thumbnailUrl: resizedThumbnailUrl,
              // 首个 showcase 组的前 4 个项目设为高优先级
              priority: sectionIndex === 0 && itemIndex < 4 ? "high" : "low",
              // 如果没有点赞数，生成虚拟点赞数
              likes: item.likes ?? generateVirtualLikes(item.id),
            };
          }),
        ),
      };
    })
    .filter((group) => group.items.length > 0);
}

export function getMobileHomepageConfig(
  configs: Record<string, string | undefined>,
) {
  const legacyHref =
    configs.mobile_home_legacy_href?.trim() || "/?layout=legacy";
  const createImageHref = normalizeWorkbenchEntryHref(
    configs.mobile_home_create_image_href,
    "/text-to-image/z-image-turbo",
    ["/ai-image-generator", "/create/image"],
  );
  const createVideoHref = normalizeWorkbenchEntryHref(
    configs.mobile_home_create_video_href,
    DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
    ["/ai-video-generator", "/create/video", "/video-face-swap"],
  );
  const bannerSlides = optimizeBannerSlides(
    parseJsonValue(
      configs.mobile_home_banner_slides,
      bannerSlidesSchema,
      defaultBannerSlides,
    ),
    960,
    548,
  );

  // 从 explore_page_config 转换，移动端限制每个分类 6 个
  // 公开首页应用 borderline 内容过滤（cached: 同一请求内 PC + 移动复用一次解析）
  const exploreConfig = parseAndFilterExploreConfig(
    configs.explore_page_config,
  );
  // 移动端卡片宽度约 180~240px，2x retina 即 480px 长边足够
  const showcaseGroups = convertExploreToShowcase(exploreConfig, 6, true, 480);

  return {
    legacyHref,
    createImageHref,
    createVideoHref,
    bannerSlides,
    showcaseGroups,
  } satisfies MobileHomepageConfig;
}

/**
 * 获取 PC 端首页配置（不限制每个分类的数量）
 */
export function getPcHomepageConfig(
  configs: Record<string, string | undefined>,
) {
  // 复用移动端配置，确保 PC 端也能展示“模型展示”banner并支持点击跳转
  const bannerSlides = optimizeBannerSlides(
    parseJsonValue(
      configs.mobile_home_banner_slides,
      bannerSlidesSchema,
      defaultBannerSlides,
    ),
    1280,
    731,
  );

  // 公开首页应用 borderline 内容过滤（cached: 同一请求内 PC + 移动复用一次解析）
  const exploreConfig = parseAndFilterExploreConfig(
    configs.explore_page_config,
  );
  // PC 首屏限制每分类 30 项，降低 hydration 压力；用户可点 "View More" 进 explore 页
  // 卡片实际显示宽度 ~250~400px，2x retina 用 720px 长边足够
  const showcaseGroups = convertExploreToShowcase(
    exploreConfig,
    30,
    false,
    720,
  );

  // 在第一个分组中插入 Audio Coming Soon 卡片
  if (showcaseGroups.length > 0) {
    const audioCard: MediaItem = {
      id: "audio-coming-soon",
      type: "audio",
      src: "",
      alt: "Audio generation coming soon",
      gridSize: "large",
      aspectRatio: 4 / 3,
      priority: "low",
    };

    // 在第一个分组的第 5 个位置插入（索引 4）
    showcaseGroups[0].items.splice(4, 0, audioCard);
  }

  return {
    bannerSlides,
    showcaseGroups,
  };
}
