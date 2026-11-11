/**
 * 生成图片的 blur placeholder
 * 用于改善图片加载体验
 */

/**
 * 生成简单的 blur placeholder（纯色）
 */
export function generateSimpleBlurDataURL(color: string = '#f3f4f6'): string {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${color}"/>
    </svg>`
  )}`;
}

/**
 * 生成渐变 blur placeholder
 */
export function generateGradientBlurDataURL(
  color1: string = '#f3f4f6',
  color2: string = '#e5e7eb'
): string {
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)"/>
    </svg>`
  )}`;
}

/**
 * 生成 shimmer 效果的 blur placeholder
 */
export function generateShimmerBlurDataURL(
  width: number = 700,
  height: number = 475
): string {
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="20%" />
          <stop stop-color="#f6f7f8" offset="40%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}

/**
 * 预定义的 blur placeholder
 */
export const BLUR_DATA_URLS = {
  // 灰色系
  gray: generateSimpleBlurDataURL('#f3f4f6'),
  darkGray: generateSimpleBlurDataURL('#9ca3af'),

  // 渐变
  grayGradient: generateGradientBlurDataURL('#f3f4f6', '#e5e7eb'),
  blueGradient: generateGradientBlurDataURL('#dbeafe', '#bfdbfe'),
  purpleGradient: generateGradientBlurDataURL('#e9d5ff', '#d8b4fe'),

  // Shimmer 效果
  shimmer: generateShimmerBlurDataURL(),
};

/**
 * 根据图片类型返回合适的 blur placeholder
 */
export function getBlurDataURL(type?: 'avatar' | 'banner' | 'thumbnail' | 'default'): string {
  switch (type) {
    case 'avatar':
      return BLUR_DATA_URLS.grayGradient;
    case 'banner':
      return BLUR_DATA_URLS.shimmer;
    case 'thumbnail':
      return BLUR_DATA_URLS.blueGradient;
    default:
      return BLUR_DATA_URLS.gray;
  }
}
