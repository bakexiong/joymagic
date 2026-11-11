/**
 * 阿里云 OSS 视频处理工具
 * 文档：https://help.aliyun.com/document_detail/64555.html
 */

export interface VideoThumbnailOptions {
  // 缩略图类型
  type?: 'image' | 'gif' | 'webp';
  // 截图时间点（毫秒）
  snapshotTime?: number;
  // 动图持续时间（秒）
  duration?: number;
  // 宽度（px）
  width?: number;
  // 高度（px，0 表示自适应）
  height?: number;
  // 质量（1-100）
  quality?: number;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<VideoThumbnailOptions> = {
  type: 'webp',
  snapshotTime: 1000,
  duration: 3,
  width: 500,
  height: 0,
  quality: 80,
};

export function isOssVideoUrl(videoUrl: string): boolean {
  return (
    videoUrl.includes('aliyuncs.com') ||
    videoUrl.includes('oss-') ||
    videoUrl.includes('ocdn.10b.ai')
  );
}

/**
 * 生成视频缩略图 URL
 * @param videoUrl 视频 URL
 * @param options 配置选项
 * @returns 缩略图 URL
 */
export function getVideoThumbnailUrl(
  videoUrl: string,
  options: VideoThumbnailOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 检查是否是 OSS URL
  if (!isOssVideoUrl(videoUrl)) {
    console.warn('视频 URL 不是阿里云 OSS 地址，无法使用 OSS 视频处理功能');
    return videoUrl;
  }

  // 移除已有的处理参数
  const baseUrl = videoUrl.split('?')[0];

  if (opts.type === 'image') {
    // 静态截图
    const params = [
      'video/snapshot',
      `t_${opts.snapshotTime}`,
      'f_jpg',
      `w_${opts.width}`,
      `h_${opts.height}`,
      'm_fast',
      `q_${opts.quality}`,
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  } else {
    // 动图（GIF 或 WebP）
    const format = opts.type === 'gif' ? 'gif' : 'webp';
    const params = [
      'video/convert',
      `f_${format}`,
      `w_${opts.width}`,
      `h_${opts.height}`,
      'ss_0', // 从第 0 秒开始
      `t_${opts.duration}`, // 持续时间
      `q_${opts.quality}`,
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  }
}

/**
 * 获取适合作为 video poster 的静态截图 URL。
 */
export function getVideoPosterUrl(
  videoUrl: string,
  options: Omit<VideoThumbnailOptions, 'type' | 'duration'> = {}
): string | undefined {
  if (!isOssVideoUrl(videoUrl)) {
    return undefined;
  }

  return getVideoThumbnailUrl(videoUrl, {
    ...options,
    type: 'image',
  });
}

/**
 * 检查浏览器是否支持 WebP
 */
export function isSupportWebP(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * 获取最佳视频缩略图类型
 * 根据浏览器支持情况自动选择
 */
export function getBestVideoThumbnailType(): 'image' | 'gif' | 'webp' {
  if (typeof window === 'undefined') return 'image';

  // 优先使用 WebP（体积小，质量好）
  if (isSupportWebP()) {
    return 'webp';
  }

  // 降级到 GIF
  return 'gif';
}

/**
 * 批量生成视频缩略图 URL
 */
export function batchGetVideoThumbnailUrls(
  videoUrls: string[],
  options: VideoThumbnailOptions = {}
): string[] {
  return videoUrls.map((url) => getVideoThumbnailUrl(url, options));
}
