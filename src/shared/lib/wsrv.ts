/**
 * wsrv.nl 缩略图生成工具
 * 文档：https://wsrv.nl/docs
 *
 * wsrv.nl 是一个图片缓存和调整大小的 CDN 服务，
 * 支持图片和视频帧提取，可用于生成缩略图。
 */

export interface WsrvOptions {
  /** 输出宽度 (px) */
  width?: number;
  /** 输出高度 (px) */
  height?: number;
  /** 质量 1-100 */
  quality?: number;
  /** 输出格式: webp, png, jpg, gif */
  format?: "webp" | "png" | "jpg" | "gif";
  /** 是否使用渐进式加载 (适合大图) */
  progressive?: boolean;
  /** 背景填充颜色 (用于 letterbox) */
  background?: string;
  /** 圆角 (px) */
  radius?: number | "max";
  /** 是否适配 (fit), 裁剪 (cover), 拉伸 (stretch) */
  fit?: "contain" | "cover" | "fill" | "bounding-box";
}

const DEFAULT_OPTIONS: Required<WsrvOptions> = {
  width: 400,
  height: 0,
  quality: 80,
  format: "webp",
  progressive: true,
  background: "",
  radius: 0,
  fit: "cover",
};

/**
 * 对 URL 参数进行编码
 * wsrv.nl 要求 ? 和 & 被编码为 %3F 和 %26
 */
function encodeUrlParam(url: string): string {
  return url.replace(/\?/g, "%3F").replace(/&/g, "%26");
}

/**
 * 构建 wsrv.nl URL
 */
function buildWsrvUrl(url: string, options: WsrvOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 跳过非 HTTP/HTTPS URL
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return url;
  }

  const params = new URLSearchParams();
  params.set("url", encodeUrlParam(url));

  if (opts.width > 0) params.set("w", String(opts.width));
  if (opts.height > 0) params.set("h", String(opts.height));
  if (opts.quality < 100) params.set("q", String(opts.quality));
  if (opts.format !== "webp") params.set("output", opts.format);
  if (opts.progressive) params.set("progressive", "yes");
  if (opts.background) params.set("background", opts.background);
  if (opts.radius) params.set("r", String(opts.radius));
  if (opts.fit !== "cover") {
    const fitMap: Record<NonNullable<WsrvOptions["fit"]>, string> = {
      contain: "contain",
      cover: "cover",
      fill: "fill",
      "bounding-box": "bounding-box",
    };
    params.set("fit", fitMap[opts.fit]);
  }

  return `https://wsrv.nl/?${params.toString()}`;
}

/**
 * 获取图片缩略图 URL
 * @param imageUrl 原图 URL
 * @param options 缩略图配置
 */
export function getImageWsrvThumbnail(
  imageUrl: string,
  options: WsrvOptions = {}
): string {
  if (!imageUrl) return imageUrl;
  return buildWsrvUrl(imageUrl, options);
}

/**
 * 获取视频缩略图 URL (从视频中提取第一帧)
 * @param videoUrl 视频 URL
 * @param options 缩略图配置
 */
export function getVideoWsrvThumbnail(
  videoUrl: string,
  options: WsrvOptions = {}
): string {
  if (!videoUrl) return videoUrl;
  // wsrv.nl 会自动从视频中提取缩略图帧
  return buildWsrvUrl(videoUrl, {
    width: 400,
    height: 0,
    quality: 80,
    format: "webp",
    progressive: true,
    ...options,
  });
}

/**
 * 获取媒体缩略图 URL (自动判断是图片还是视频)
 * @param mediaUrl 图片或视频 URL
 * @param mediaType 类型 'image' | 'video'
 * @param options 缩略图配置
 */
export function getMediaWsrvThumbnail(
  mediaUrl: string,
  mediaType: "image" | "video" | "audio" = "image",
  options: WsrvOptions = {}
): string {
  if (!mediaUrl) return mediaUrl;
  if (mediaType === "video") {
    return getVideoWsrvThumbnail(mediaUrl, options);
  }
  return getImageWsrvThumbnail(mediaUrl, options);
}
