import { withOssImageResize } from '@/shared/lib/cdn';

export const SITE_LOGO_ORIGIN = 'https://ocdn.10b.ai/icon/joymagic-logo.png';
export const SITE_ICON_ORIGIN = 'https://ocdn.10b.ai/icon/joymagic-icon-512.png';

export function getSiteLogoUrl(width?: number, height?: number) {
  const useIcon =
    typeof width === 'number' &&
    typeof height === 'number' &&
    Math.abs(width - height) <= Math.max(width, height) * 0.2;
  const origin = useIcon ? SITE_ICON_ORIGIN : SITE_LOGO_ORIGIN;

  if (width && height) {
    return withOssImageResize(origin, width, height) ?? origin;
  }

  return origin;
}
