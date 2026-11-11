export const SITE_LOGO_ORIGIN = "/brand/barko-bear-wordmark.svg";
export const SITE_ICON_ORIGIN = "/brand/barko-bear-icon.svg";
export function getSiteLogoUrl(width?: number, height?: number) {
  const square =
    typeof width === "number" &&
    typeof height === "number" &&
    Math.abs(width - height) <= Math.max(width, height) * 0.2;
  return square ? SITE_ICON_ORIGIN : SITE_LOGO_ORIGIN;
}
