export const CREEM_REVIEW_BLOCKED_PATHS = [
  "/video-face-swap",
  "/ai-clothes-remover",
  "/tool/video-effect/ai-bikini",
  "/tools/video-effect/ai-bikini",
  "/tool/video-effect/ai-twerk",
  "/tools/video-effect/ai-twerk",
  "/tool/video-effect/ai-kissing",
  "/tools/video-effect/ai-kissing",
  "/tool/video-effect/sexy-me",
  "/tools/video-effect/sexy-me",
  "/tool/video-effect/blow-kiss",
  "/tools/video-effect/blow-kiss",
  "/tool/video-effect/french-kiss",
  "/tools/video-effect/french-kiss",
  "/tool/video-effect/kissing-pro",
  "/tools/video-effect/kissing-pro",
  "/tool/video-effect/rain-kiss",
  "/tools/video-effect/rain-kiss",
  "/tool/video-effect/jiggle-up",
  "/tools/video-effect/jiggle-up",
] as const;

export const CREEM_REVIEW_BLOCKED_VIDEO_EFFECT_SLUGS = [
  // adult / suggestive / sexually-oriented positioning (high risk for Creem reviews)
  "ai-bikini",
  "ai-twerk",
  "ai-kissing",
  "blow-kiss",
  "french-kiss",
  "kissing-pro",
  "rain-kiss",
  "sexy-me",
  "jiggle-up",
] as const;

export function isBlockedVideoEffectSlugInCreemReviewMode(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return (CREEM_REVIEW_BLOCKED_VIDEO_EFFECT_SLUGS as readonly string[]).includes(
    normalized,
  );
}

export function isBlockedModelSlugInCreemReviewMode(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return (
    normalized === "video-face-swap" ||
    normalized === "ai-clothes-remover" ||
    isBlockedVideoEffectSlugInCreemReviewMode(normalized)
  );
}

function parseBooleanEnv(value: string | undefined | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return null;
}

/**
 * CREEM_REVIEW_MODE
 * - 生产环境默认开启（更符合“过审版本”的安全策略）
 * - 可通过 `NEXT_PUBLIC_CREEM_REVIEW_MODE=false` 显式关闭
 * - 开发环境默认关闭，可通过 `NEXT_PUBLIC_CREEM_REVIEW_MODE=true` 开启
 */
export function isCreemReviewMode(): boolean {
  const explicit =
    parseBooleanEnv(process.env.NEXT_PUBLIC_CREEM_REVIEW_MODE) ??
    parseBooleanEnv(process.env.CREEM_REVIEW_MODE);
  if (explicit !== null) {
    return explicit;
  }

  return process.env.NODE_ENV === "production";
}

export function isBlockedByCreemReviewMode(pathname: string): boolean {
  const normalized = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  return (CREEM_REVIEW_BLOCKED_PATHS as readonly string[]).some(
    (blocked) => normalized === blocked || normalized.startsWith(`${blocked}/`),
  );
}
