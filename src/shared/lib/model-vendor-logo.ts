import { getSiteLogoUrl } from '@/shared/lib/site-logo';

type ModelVendorLogoInput = {
  url?: string;
  title?: string;
};

/** 与 @lobehub/icons-static-svg 包内文件名对齐（1.82.x）：仅部分 id 提供 `-color` 后缀 */
const LOBE_ICONS_PKG_VERSION = "1.82.0";

const LOBE_ICON_IDS_WITH_COLOR_SUFFIX = new Set([
  "google",
  "alibabacloud",
  "bytedance",
  "pixverse",
  "vidu",
  "kling",
]);

/**
 * Lobe 静态 SVG CDN。mono 在包内常无独立文件，与 color 共用 `{id}.svg`。
 */
export function getLobeIconUrl(
  iconId: string,
  variant: "mono" | "color" = "color",
): string {
  const base = `https://unpkg.com/@lobehub/icons-static-svg@${LOBE_ICONS_PKG_VERSION}/icons`;
  if (variant === "color" && LOBE_ICON_IDS_WITH_COLOR_SUFFIX.has(iconId)) {
    return `${base}/${iconId}-color.svg`;
  }
  return `${base}/${iconId}.svg`;
}

const SOUL_HIGGSFIELD_LOGO =
  "https://ocdn.10b.ai/icon/higgsfield-seeklogo.svg";

export type ModelVendorLogo = {
  url: string | undefined;
  /** 非 color 变体的 SVG 在深色背景上不可见，需要白底 */
  needsWhiteBg: boolean;
};

export function getModelVendorLogo({ url, title }: ModelVendorLogoInput): ModelVendorLogo {
  const normalized = `${url || ""} ${title || ""}`.toLowerCase();

  if (!normalized.trim()) return { url: undefined, needsWhiteBg: false };

  // Soul uses Higgsfield logo per product requirement
  if (normalized.includes("soul")) {
    return { url: SOUL_HIGGSFIELD_LOGO, needsWhiteBg: false };
  }

  // Google: color icon has enough contrast on dark bg
  if (normalized.includes("nano-banana") || normalized.includes("veo")) {
    return { url: getLobeIconUrl("google", "color"), needsWhiteBg: false };
  }

  // ByteDance: color icon for seedream, seedance
  if (normalized.includes("seedream") || normalized.includes("seedance")) {
    return { url: getLobeIconUrl("bytedance", "color"), needsWhiteBg: false };
  }

  // PixVerse: color icon
  if (normalized.includes("pixverse")) {
    return { url: getLobeIconUrl("pixverse", "color"), needsWhiteBg: false };
  }

  // Vidu: color icon
  if (normalized.includes("vidu")) {
    return { url: getLobeIconUrl("vidu", "color"), needsWhiteBg: false };
  }

  // Kling: color icon
  if (normalized.includes("kling")) {
    return { url: getLobeIconUrl("kling", "color"), needsWhiteBg: false };
  }

  // Alibaba / Qwen / Wan / HappyHorse
  if (
    normalized.includes("z-image-turbo") ||
    normalized.includes("z image turbo") ||
    normalized.includes("qwen") ||
    normalized.includes("wan") ||
    normalized.includes("wan-2-6") ||
    normalized.includes("wan-2-7") ||
    normalized.includes("wan 2.7") ||
    normalized.includes("happyhorse") ||
    normalized.includes("alibabacloud") ||
    normalized.includes("yoga-v1")
  ) {
    return { url: getLobeIconUrl("alibabacloud", "color"), needsWhiteBg: false };
  }

  // OpenAI / GPT: mono icon on white bg
  if (normalized.includes("gpt-image-1") || normalized.includes("gpt-image-2")) {
    return { url: getLobeIconUrl("openai", "mono"), needsWhiteBg: true };
  }

  // Midjourney: mono icon on white bg
  if (normalized.includes("midjourney")) {
    return { url: getLobeIconUrl("midjourney", "mono"), needsWhiteBg: true };
  }

  // xAI / Grok: mono icon on white bg
  if (normalized.includes("grok")) {
    return { url: getLobeIconUrl("xai", "mono"), needsWhiteBg: true };
  }

  // Black Forest Labs / FLUX: mono icon on white bg
  if (normalized.includes("flux-2-klein") || normalized.includes("flux")) {
    return { url: getLobeIconUrl("bfl", "mono"), needsWhiteBg: true };
  }

  // Lightricks / LTX: mono icon on white bg
  if (normalized.includes("ltx-2")) {
    return { url: getLobeIconUrl("lightricks", "mono"), needsWhiteBg: true };
  }

  // joymagic / internal generic entries (must be after provider-specific matching)
  if (
    normalized.includes("joymagic") ||
    normalized.includes("yoga-v1") ||
    normalized.includes("general") ||
    normalized.includes("image-background-remover") ||
    normalized.includes("image-eraser") ||
    normalized.includes("image-upscaler") ||
    normalized.includes("video-face-swap") ||
    normalized.includes("longcat-avatar") ||
    normalized.includes("generate-video")
  ) {
    return { url: getSiteLogoUrl(64, 64), needsWhiteBg: false };
  }

  return { url: undefined, needsWhiteBg: false };
}
