import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { envConfigs } from "@/config";
import { defaultLocale, locales } from "@/config/locale";
import { redirect } from "@/core/i18n/navigation";
import { JsonLd } from "@/shared/components/jsonld";
import { ToolsDetailPage } from "@/shared/blocks/create/tools-detail-page";
import {
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import {
  AI_BIKINI_SLUG,
  AI_KISSING_HUB_SLUG,
  AI_TWERK_SLUG,
  AI_FLYING_SLUG,
  AI_JIGGLE_SLUG,
  VIDEO_KISS_STYLE_SLUGS,
  getVideoEffectItemsSync,
} from "@/shared/lib/video-effect-data";
import { getImageEffectItemsSync } from "@/shared/lib/image-effect-data";
import {
  isBlockedVideoEffectSlugInCreemReviewMode,
  isCreemReviewMode,
} from "@/shared/lib/creem-review";
import { preloadToolsDetailLibrary } from "@/shared/lib/tools-detail-library-prefetch";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

const TOOL_CATEGORY_COPY: Record<
  string,
  {
    label: string;
    title: string;
    description: string;
    keywords: string;
  }
> = {
  "text-to-image": {
    label: "AI Image Generator",
    title: "AI Image Generator Online Free",
    description:
      "Use joymagic as an AI image generator to create product photos, ad creatives, portraits, posters, and social visuals from text prompts.",
    keywords:
      "AI image generator, text to image AI, product photo generator, AI portrait generator",
  },
  "image-to-image": {
    label: "AI Image Editor",
    title: "AI Image and Photo Editor Online",
    description:
      "Edit images online with AI for product retouching, portrait updates, style changes, background edits, object cleanup, and creative variations.",
    keywords:
      "AI image editor, AI photo editor, image to image AI, photo editing AI",
  },
  "text-to-video": {
    label: "AI Video Generator",
    title: "AI Video Generator Online Free",
    description:
      "Use joymagic as an AI video generator to create short videos from prompts for ads, social posts, cinematic scenes, product storytelling, and creative tests.",
    keywords:
      "AI video generator, text to video AI, AI video maker, video generator online",
  },
  "image-to-video": {
    label: "AI Image to Video Generator",
    title: "Image to Video AI Generator Online",
    description:
      "Turn portraits, product photos, and concept images into AI videos with motion, camera movement, and short-form effects.",
    keywords:
      "image to video AI, AI image to video generator, animate photo AI",
  },
  "image-upscaler": {
    label: "AI Image Upscaler",
    title: "AI Image Upscaler Online Free",
    description:
      "Upscale images online with AI to improve clarity for product photos, portraits, social posts, banners, and catalog visuals.",
    keywords:
      "AI image upscaler, image upscaler, upscale image online, photo enhancer",
  },
  "image-background-remover": {
    label: "AI Background Remover",
    title: "AI Background Remover Online Free",
    description:
      "Remove image backgrounds online with AI for ecommerce product photos, portraits, ad creatives, profile images, and clean design assets.",
    keywords:
      "AI background remover, background remover, remove image background",
  },
  "image-eraser": {
    label: "AI Image Eraser",
    title: "AI Image Eraser and Object Remover",
    description:
      "Erase unwanted objects, text, people, and distractions from photos with AI while keeping the image natural and ready to use.",
    keywords: "AI image eraser, object remover, remove objects from photo",
  },
  "image-effect": {
    label: "AI Image Effect",
    title: "AI Image Effects and Photo Effects",
    description:
      "Apply ready-made AI image effects for Ghibli styles, Y2K looks, portraits, seasonal edits, and social-ready visual trends.",
    keywords:
      "AI image effects, AI photo effects, AI Ghibli effect, photo effect generator",
  },
  "image-effects": {
    label: "AI Image Effect",
    title: "AI Image Effects and Photo Effects",
    description:
      "Apply ready-made AI image effects for Ghibli styles, Y2K looks, portraits, seasonal edits, and social-ready visual trends.",
    keywords:
      "AI image effects, AI photo effects, AI Ghibli effect, photo effect generator",
  },
  "video-effect": {
    label: "AI Video Effect",
    title: "AI Video Effects and Photo Animation",
    description:
      "Create AI video effects from photos for fashion motion, couple scenes, cinematic moments, and shareable short-form clips.",
    keywords:
      "AI video effects, image to video AI, photo animation, AI video generator",
  },
  "video-effects": {
    label: "AI Video Effect",
    title: "AI Video Effects and Photo Animation",
    description:
      "Create AI video effects from photos for fashion motion, couple scenes, cinematic moments, and shareable short-form clips.",
    keywords:
      "AI video effects, image to video AI, photo animation, AI video generator",
  },
};

const SPECIFIC_TOOL_SEO_COPY: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
  }
> = {
  [`video-effect/${AI_BIKINI_SLUG}`]: {
    title: "AI Bikini Video Generator Online | joymagic",
    description:
      "Upload one portrait and create a 5-second AI bikini outfit-change video with Wan 2.7 for beach concepts, summer looks, and fashion clips.",
    keywords:
      "AI bikini generator, AI bikini video generator, bikini video AI",
  },
  [`video-effect/${AI_FLYING_SLUG}`]: {
    title: "AI Flying Video Generator Online | joymagic",
    description:
      "Turn a full-body photo into an AI flying video with floating, gliding, and soaring motion for social clips and creative scenes.",
    keywords: "AI flying video generator, flying video AI, photo animation",
  },
  [`video-effect/${AI_JIGGLE_SLUG}`]: {
    title: "AI Jiggle Video Generator Online | joymagic",
    description:
      "Create a short AI jiggle video from one photo with playful motion, rhythmic movement, and a share-ready video effect.",
    keywords: "AI jiggle video generator, AI video effect, photo animation",
  },
  [`video-effect/${AI_TWERK_SLUG}`]: {
    title: "AI Twerk Video Generator Online | joymagic",
    description:
      "Turn a still photo into an AI twerk video with dance motion, short-form rhythm, and an easy browser-based workflow.",
    keywords: "AI twerk video generator, AI dance video, photo animation",
  },
  [`video-effect/${AI_KISSING_HUB_SLUG}`]: {
    title: "AI Kissing Video Generator Online | joymagic",
    description:
      "Create AI kissing videos from photos with romantic couple scenes, natural motion, and share-ready short video results.",
    keywords: "AI kissing video generator, AI kiss video, couple video AI",
  },
};

type ToolSeoCopy = {
  title: string;
  description: string;
  keywords: string;
  imageUrl?: string;
};

function humanizeToolSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) =>
      ["ai", "3d", "4k", "8k"].includes(part.toLowerCase())
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function getCanonicalToolUrl(locale: string, normalizedToolPath: string) {
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${envConfigs.app_url}${localePrefix}/tools/${normalizedToolPath}`;
}

function buildToolKeywords(parts: string[]) {
  const keywords = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return keywords.length <= 100 ? keywords : keywords.slice(0, 100).trim();
}

function startsWithAi(value: string) {
  return /^ai[\s-]/i.test(value.trim());
}

function buildSpecificImageEffectSeo(slug: string): ToolSeoCopy | null {
  const item = getImageEffectItemsSync().find((effect) => effect.slug === slug);
  if (!item) return null;

  const effectName = item.title || humanizeToolSlug(slug);
  const title = startsWithAi(effectName)
    ? `${effectName} Online | joymagic`
    : `${effectName} AI Image Effect | joymagic`;
  const description =
    item.description ||
    `Create ${effectName} online with joymagic. Upload a photo and apply a ready-made AI image effect for portraits, social posts, and creative visuals.`;

  return {
    title,
    description,
    keywords: buildToolKeywords([
      effectName,
      `${effectName} AI effect`,
      "AI image effect",
      "AI photo effects",
    ]),
    imageUrl: item.coverUrl || item.posterUrl,
  };
}

function buildSpecificVideoEffectSeo(slug: string): ToolSeoCopy | null {
  const normalizedPath = `video-effect/${slug}`;
  const fixedCopy = SPECIFIC_TOOL_SEO_COPY[normalizedPath];
  if (fixedCopy) {
    const item = getVideoEffectItemsSync().find((effect) => effect.slug === slug);
    return {
      ...fixedCopy,
      imageUrl: item?.coverUrl || item?.sourceImageUrl,
    };
  }

  const item = getVideoEffectItemsSync().find((effect) => effect.slug === slug);
  if (!item) return null;

  const effectName = item.title || humanizeToolSlug(slug);
  const title = startsWithAi(effectName)
    ? `${effectName} Video Generator | joymagic`
    : `${effectName} AI Video Effect | joymagic`;

  return {
    title,
    description: `Create ${effectName} online with joymagic. Upload a photo and turn it into a shareable AI video effect with motion, style, and short-form output.`,
    keywords: buildToolKeywords([
      effectName,
      `${effectName} AI video`,
      "AI video effect",
      "image to video AI",
    ]),
    imageUrl: item.coverUrl || item.sourceImageUrl,
  };
}

function resolveToolSeoCopy(normalizedToolPath: string): ToolSeoCopy | null {
  const [toolAlias, specificSlug] = normalizedToolPath.split("/");
  if (specificSlug) {
    if (toolAlias === "image-effect" || toolAlias === "image-effects") {
      return buildSpecificImageEffectSeo(specificSlug);
    }

    if (toolAlias === "video-effect" || toolAlias === "video-effects") {
      return buildSpecificVideoEffectSeo(specificSlug);
    }

    const category =
      TOOL_CATEGORY_COPY[toolAlias] || TOOL_CATEGORY_COPY["text-to-image"];
    const toolName = humanizeToolSlug(specificSlug);

    return {
      title: `${toolName} Online | joymagic`,
      description: `Use ${toolName} online with joymagic's ${category.label.toLowerCase()} workflow for fast browser-based creative generation, editing, and scene-ready outputs.`,
      keywords: buildToolKeywords([
        toolName,
        category.label,
        "AI creative tool",
      ]),
    };
  }

  const category =
    TOOL_CATEGORY_COPY[toolAlias] || TOOL_CATEGORY_COPY["text-to-image"];

  return {
    title: `${category.title} | joymagic`,
    description: category.description,
    keywords: category.keywords,
  };
}

function buildToolMetadata({
  locale,
  normalizedToolPath,
  title,
  description,
  keywords,
  imageUrl,
}: {
  locale: string;
  normalizedToolPath: string;
  title: string;
  description: string;
  keywords?: string;
  imageUrl?: string;
}): Metadata {
  const canonicalUrl = getCanonicalToolUrl(locale, normalizedToolPath);
  const resolvedImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${envConfigs.app_url}${imageUrl}`
    : undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      siteName: envConfigs.app_name || "joymagic",
      images: resolvedImageUrl ? [resolvedImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: resolvedImageUrl ? [resolvedImageUrl] : undefined,
    },
  };
}

function buildFallbackToolMetadata(locale: string, normalizedToolPath: string) {
  const seoCopy = resolveToolSeoCopy(normalizedToolPath);
  return buildToolMetadata({
    locale,
    normalizedToolPath,
    title: seoCopy?.title || "AI Creative Tool Online | joymagic",
    description:
      seoCopy?.description ||
      "Create images, videos, edits, and visual effects online with joymagic's browser-based AI creative tools.",
    keywords: seoCopy?.keywords,
    imageUrl: seoCopy?.imageUrl,
  });
}

function getToolSchemaCopy(normalizedToolPath: string) {
  const [toolAlias, specificSlug] = normalizedToolPath.split("/");
  const category =
    TOOL_CATEGORY_COPY[toolAlias] || TOOL_CATEGORY_COPY["text-to-image"];
  const seoCopy = resolveToolSeoCopy(normalizedToolPath);
  const name = specificSlug
    ? seoCopy?.title.replace(/\s*\|\s*joymagic$/i, "") ||
      `${humanizeToolSlug(specificSlug)} ${category.label}`
    : category.title;

  return {
    name,
    description: seoCopy?.description || category.description,
    categoryLabel: category.label,
    categoryPath: `/tools/${toolAlias}`,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tool: string[] }>;
}): Promise<Metadata> {
  const { locale, tool } = await params;
  const toolPath = Array.isArray(tool) ? tool.join("/") : tool;
  const normalizedToolPath = toolPath.replace(/^\/+|\/+$/g, "");
  const [toolAlias, videoEffectSlug] = normalizedToolPath.split("/");
  const isVideoEffectTool =
    toolAlias === "video-effect" || toolAlias === "video-effects";
  if (
    isCreemReviewMode() &&
    isVideoEffectTool &&
    videoEffectSlug &&
    isBlockedVideoEffectSlugInCreemReviewMode(videoEffectSlug)
  ) {
    return {};
  }

  const isChinese = locale.toLowerCase().startsWith("zh");
  if (normalizedToolPath === `video-effect/${AI_KISSING_HUB_SLUG}`) {
    const seoCopy = buildSpecificVideoEffectSeo(AI_KISSING_HUB_SLUG);
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI 接吻视频生成器 | joymagic"
        : "Free AI Kissing Video Generator Online | joymagic",
      description: isChinese
        ? "把静态照片变成更自然的浪漫亲吻场景、法式热吻动画和情侣接吻短视频。用 AI Kissing 快速生成更真实、更适合分享的亲吻视频。"
        : "Transform your static photos into lifelike romantic kiss scenes, French kissing animations, and AI-generated couple kiss videos with AI Kissing.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  if (normalizedToolPath === `video-effect/${AI_BIKINI_SLUG}`) {
    const seoCopy = buildSpecificVideoEffectSeo(AI_BIKINI_SLUG);
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI Bikini 视频生成器 | joymagic"
        : "AI Bikini Video Generator Online | joymagic",
      description: isChinese
        ? "上传一张人物照片，使用 Wan 2.7 在 5 秒内生成 720p 的 AI Bikini 换装视频效果。适合做海滩风、夏日感和时尚短视频内容。"
        : seoCopy?.description ||
          "Upload one portrait and turn it into a 5-second 720p AI Bikini outfit-change video with Wan 2.7. Great for summer looks, beach concepts, and fashion-style short videos.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  if (normalizedToolPath === `video-effect/${AI_TWERK_SLUG}`) {
    const seoCopy = buildSpecificVideoEffectSeo(AI_TWERK_SLUG);
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI Twerk 视频生成器 | joymagic"
        : "Free AI Twerk Video Generator | joymagic",
      description: isChinese
        ? "把静态照片变成节奏感更强的 AI 扭胯短视频。上传单人全身照，快速生成更自然、更适合分享的舞蹈效果。"
        : "Turn still photos into energetic AI twerk videos with natural hip motion, dance rhythm, and short-form shareable results.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  if (normalizedToolPath === `video-effect/${AI_FLYING_SLUG}`) {
    const seoCopy = buildSpecificVideoEffectSeo(AI_FLYING_SLUG);
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI 飞行视频生成器 | joymagic"
        : "AI Flying Video Generator: Make Anyone Fly in Videos | joymagic",
      description: isChinese
        ? "把照片变成轻盈自然的 AI 飞行视频。上传单人全身照，快速生成漂浮、滑翔、腾空等飞行动画效果。"
        : "Turn still photos into lively flying scenes with floating, gliding, and soaring motion. Create smooth AI flying videos online from a single full-body image.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  if (normalizedToolPath === `video-effect/${AI_JIGGLE_SLUG}`) {
    const seoCopy = buildSpecificVideoEffectSeo(AI_JIGGLE_SLUG);
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI 抖动视频生成器 | joymagic"
        : "Free AI Jiggle Video Generator Online | joymagic",
      description: isChinese
        ? "上传单人照片，快速生成更自然、更有弹性节奏感的 AI 抖动短视频。适合做趣味内容、角色演绎和更吸睛的动态展示。"
        : "Turn a single photo into a lively AI jiggle video with playful upper-body motion, bounce, and a short-form result ready to share.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  if (normalizedToolPath === "video-effect/hugging") {
    const seoCopy = buildSpecificVideoEffectSeo("hugging");
    return buildToolMetadata({
      locale,
      normalizedToolPath,
      title: isChinese
        ? "免费 AI 拥抱视频生成器 | joymagic"
        : "Free AI Hug Video Generator Online | joymagic",
      description: isChinese
        ? "上传包含两个人物的照片，把静态画面变成自然靠近、轻柔拥抱的 AI 拥抱视频。适合情侣、亲友、纪念照和情感向短视频内容。"
        : "Turn a still photo of two people into a warm AI hug video with natural movement, closeness, and a shareable emotional result.",
      keywords: seoCopy?.keywords,
      imageUrl: seoCopy?.imageUrl,
    });
  }

  return buildFallbackToolMetadata(locale, normalizedToolPath);
}

export default async function ToolsDetailRoutePage({
  params,
}: {
  params: Promise<{ locale: string; tool: string[] }>;
}) {
  const { locale, tool } = await params;
  const toolPath = Array.isArray(tool) ? tool.join("/") : tool;
  const normalizedToolPath = toolPath.replace(/^\/+|\/+$/g, "");
  const [toolAlias, videoEffectSlug] = normalizedToolPath.split("/");
  const isVideoEffectTool =
    toolAlias === "video-effect" || toolAlias === "video-effects";

  if (
    isCreemReviewMode() &&
    isVideoEffectTool &&
    videoEffectSlug &&
    isBlockedVideoEffectSlugInCreemReviewMode(videoEffectSlug)
  ) {
    notFound();
  }

  const isLegacyKissStyleRoute =
    (toolAlias === "video-effect" || toolAlias === "video-effects") &&
    Boolean(videoEffectSlug) &&
    VIDEO_KISS_STYLE_SLUGS.includes(
      videoEffectSlug as (typeof VIDEO_KISS_STYLE_SLUGS)[number],
    ) &&
    videoEffectSlug !== AI_KISSING_HUB_SLUG;

  if (
    normalizedToolPath === "video-effect" ||
    normalizedToolPath === "video-effects" ||
    isLegacyKissStyleRoute
  ) {
    // 审核模式下选择可用特效，避免总入口跳转到已屏蔽页面。
    const defaultEffectSlug = isCreemReviewMode()
      ? getVideoEffectItemsSync()[0]?.slug
      : AI_KISSING_HUB_SLUG;
    if (!defaultEffectSlug) notFound();

    redirect({
      href: `/tools/video-effect/${defaultEffectSlug}`,
      locale,
    });
  }

  setRequestLocale(locale);
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  const initialIsMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );

  const t = await getTranslations("landing");
  const header = t.raw("header") as HeaderType;
  const initialLibrary = await preloadToolsDetailLibrary({
    navItems: header.nav?.items || [],
    initialTool: toolPath,
  });
  const isImageEffectsReplicaRoute =
    toolPath === "image-effect" || toolPath.startsWith("image-effect/");
  const isVideoEffectsReplicaRoute =
    toolPath === "video-effect" || toolPath.startsWith("video-effect/");
  const schemaCopy = getToolSchemaCopy(normalizedToolPath);
  const softwareSchema = generateSoftwareApplicationSchema({
    name: schemaCopy.name,
    description: schemaCopy.description,
    url: `/tools/${normalizedToolPath}`,
    locale,
    category: "MultimediaApplication",
    features: [
      schemaCopy.categoryLabel,
      "Browser-based AI creation",
      "Prompt-driven workflow",
    ],
  });
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: schemaCopy.categoryLabel, url: schemaCopy.categoryPath },
  ];
  const [, specificSlug] = normalizedToolPath.split("/");
  if (specificSlug) {
    breadcrumbItems.push({
      name: humanizeToolSlug(specificSlug),
      url: `/tools/${normalizedToolPath}`,
    });
  }
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems, locale);

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <ToolsDetailPage
        navItems={header.nav?.items || []}
        initialTool={toolPath}
        imageEffectsReplica={isImageEffectsReplicaRoute}
        videoEffectsReplica={isVideoEffectsReplicaRoute}
        initialTemplateItems={initialLibrary.items}
        initialLibraryResolved={initialLibrary.resolved}
        initialIsMobile={initialIsMobile}
      />
    </>
  );
}
