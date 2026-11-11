'use client';

import { useState } from 'react';
import { CopyIcon, ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'sonner';
import { LazyImage } from '@/shared/blocks/common/lazy-image';
import { AudioPlayer } from '@/shared/blocks/common/audio-player';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';

/**
 * 检查字符串是否是有效的 URL
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

/**
 * 检查字符串是否是图片 URL
 */
function isImageUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  const hasImagePath = /\/images?\/|\/img\/|image|photo|picture/i.test(url);
  
  return hasImageExtension || hasImagePath;
}

/**
 * 检查字符串是否是视频 URL
 */
function isVideoUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
  const hasVideoExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  const hasVideoPath = /\/videos?\/|\/video\/|video|movie|film/i.test(url);
  
  return hasVideoExtension || hasVideoPath;
}

/**
 * 检查字符串是否是音频 URL
 */
function isAudioUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }
  
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
  const hasAudioExtension = audioExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  const hasAudioPath = /\/audios?\/|\/audio\/|\/music\/|audio|music|song|sound/i.test(url);
  
  return hasAudioExtension || hasAudioPath;
}

/**
 * 递归提取对象中的所有 URL
 */
function extractUrlsFromObject(obj: any, checkFunction: (url: string) => boolean, urls: string[] = []): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  // 如果是数组
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === 'string' && checkFunction(item)) {
        urls.push(item);
      } else if (item && typeof item === 'object') {
        extractUrlsFromObject(item, checkFunction, urls);
      }
    });
    return;
  }

  // 如果是对象，检查所有字段
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    
    // 如果值是字符串且是有效 URL
    if (typeof value === 'string' && checkFunction(value)) {
      urls.push(value);
    }
    // 如果值是对象或数组，递归检查
    else if (value && typeof value === 'object') {
      extractUrlsFromObject(value, checkFunction, urls);
    }
  });
}

/**
 * 从 taskResult 中提取链接（根据 mediaType）
 */
function extractMediaUrls(
  taskResult: string | null | undefined,
  mediaType: string | null | undefined
): string[] {
  if (!taskResult) {
    return [];
  }

  try {
    const parsed = typeof taskResult === 'string' ? JSON.parse(taskResult) : taskResult;
    const urls: string[] = [];
    
    // 根据 mediaType 选择检查函数
    const checkFunction = 
      mediaType === 'image' ? isImageUrl :
      mediaType === 'video' ? isVideoUrl :
      mediaType === 'music' || mediaType === 'audio' ? isAudioUrl :
      isValidUrl; // 默认检查所有有效 URL
    
    // 递归提取所有 URL
    extractUrlsFromObject(parsed, checkFunction, urls);
    
    // 去重并保持顺序
    return Array.from(new Set(urls));
  } catch (error) {
    // 如果不是 JSON，尝试直接作为字符串处理
    if (typeof taskResult === 'string' && isValidUrl(taskResult)) {
      return [taskResult];
    }
    return [];
  }
}

export function TaskResultPreview({ 
  taskResult,
  mediaType,
}: { 
  taskResult: string | null | undefined;
  mediaType?: string | null;
}) {
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [enlargedVideoIndex, setEnlargedVideoIndex] = useState<number | null>(null);
  const mediaUrls = extractMediaUrls(taskResult, mediaType);
  
  if (mediaUrls.length === 0) {
    // 如果没有找到对应类型的链接，显示 JSON 预览
    if (!taskResult) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    try {
      const parsed = typeof taskResult === 'string' ? JSON.parse(taskResult) : taskResult;
      return (
        <pre className="text-xs max-w-md overflow-auto">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-sm">{taskResult}</span>;
    }
  }
  
  // 复制所有链接
  const copyAllUrls = () => {
    const allUrls = mediaUrls.join('\n');
    navigator.clipboard.writeText(allUrls).then(() => {
      toast.success(`Copied ${mediaUrls.length} link(s) to clipboard`);
    });
  };

  // 导航到上一张/下一张图片
  const navigateImage = (direction: 'prev' | 'next') => {
    if (enlargedImageIndex === null) return;
    
    if (direction === 'prev') {
      setEnlargedImageIndex(enlargedImageIndex > 0 ? enlargedImageIndex - 1 : mediaUrls.length - 1);
    } else {
      setEnlargedImageIndex(enlargedImageIndex < mediaUrls.length - 1 ? enlargedImageIndex + 1 : 0);
    }
  };

  // 导航到上一个/下一个视频
  const navigateVideo = (direction: 'prev' | 'next') => {
    if (enlargedVideoIndex === null) return;
    
    if (direction === 'prev') {
      setEnlargedVideoIndex(enlargedVideoIndex > 0 ? enlargedVideoIndex - 1 : mediaUrls.length - 1);
    } else {
      setEnlargedVideoIndex(enlargedVideoIndex < mediaUrls.length - 1 ? enlargedVideoIndex + 1 : 0);
    }
  };

  // 根据 mediaType 显示对应的媒体类型
  if (mediaType === 'image') {
    // 根据图片数量决定布局
    const gridCols = mediaUrls.length === 1 ? 'grid-cols-1' :
                     mediaUrls.length <= 4 ? 'grid-cols-2' :
                     mediaUrls.length <= 9 ? 'grid-cols-3' : 'grid-cols-4';
    
    return (
      <>
        <div className="space-y-2">
          {mediaUrls.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{mediaUrls.length} images</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={copyAllUrls}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CopyIcon className="h-3 w-3" />
                      Copy all
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy all image URLs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <div className={`grid ${gridCols} gap-2`}>
            {mediaUrls.map((url, index) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => setEnlargedImageIndex(index)}
              >
                <LazyImage
                  src={url}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-32 rounded object-contain bg-muted"
                  title="Click to enlarge"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(url).then(() => {
                              toast.success('Link copied to clipboard');
                            });
                          }}
                          className="p-1 bg-black/50 hover:bg-black/70 rounded backdrop-blur-sm"
                        >
                          <CopyIcon className="h-3 w-3 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy image URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 图片放大对话框 */}
        <Dialog 
          open={enlargedImageIndex !== null} 
          onOpenChange={(open) => !open && setEnlargedImageIndex(null)}
        >
          <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/95 p-0">
            {enlargedImageIndex !== null && (
              <div className="relative flex items-center justify-center max-h-[98vh] max-w-[98vw]">
                {/* 关闭按钮 */}
                <button
                  onClick={() => setEnlargedImageIndex(null)}
                  className="absolute top-4 right-4 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* 上一张按钮 */}
                {mediaUrls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('prev');
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* 下一张按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('next');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* 图片信息 */}
                {mediaUrls.length > 1 && (
                  <div className="absolute top-4 left-4 z-50 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-white text-sm">
                    {enlargedImageIndex + 1} / {mediaUrls.length}
                  </div>
                )}

                {/* 图片 */}
                <div 
                  className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={mediaUrls[enlargedImageIndex]}
                    alt={`Generated image ${enlargedImageIndex + 1}`}
                    className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                  />
                </div>

                {/* 复制链接按钮 */}
                <div className="absolute bottom-4 right-4 z-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(mediaUrls[enlargedImageIndex]).then(() => {
                              toast.success('Image URL copied to clipboard');
                            });
                          }}
                          className="rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                        >
                          <CopyIcon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy image URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  if (mediaType === 'video') {
    return (
      <>
        <div className="space-y-2">
          {mediaUrls.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{mediaUrls.length} videos</span>
              <button
                onClick={copyAllUrls}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CopyIcon className="h-3 w-3" />
                Copy all
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {mediaUrls.map((url, index) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => setEnlargedVideoIndex(index)}
              >
                <video
                  src={url}
                  className="w-full h-32 rounded object-contain bg-black"
                  title="Click to enlarge and play"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(url).then(() => {
                              toast.success('Link copied to clipboard');
                            });
                          }}
                          className="p-1 bg-black/50 hover:bg-black/70 rounded backdrop-blur-sm"
                        >
                          <CopyIcon className="h-3 w-3 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy video URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 视频放大播放对话框 */}
        <Dialog 
          open={enlargedVideoIndex !== null} 
          onOpenChange={(open) => !open && setEnlargedVideoIndex(null)}
        >
          <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/95 p-0">
            {enlargedVideoIndex !== null && (
              <div className="relative flex items-center justify-center max-h-[98vh] max-w-[98vw]">
                {/* 关闭按钮 */}
                <button
                  onClick={() => setEnlargedVideoIndex(null)}
                  className="absolute top-4 right-4 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* 上一个视频按钮 */}
                {mediaUrls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateVideo('prev');
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* 下一个视频按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateVideo('next');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* 视频信息 */}
                {mediaUrls.length > 1 && (
                  <div className="absolute top-4 left-4 z-50 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-white text-sm">
                    {enlargedVideoIndex + 1} / {mediaUrls.length}
                  </div>
                )}

                {/* 视频播放器 */}
                <div 
                  className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <video
                    src={mediaUrls[enlargedVideoIndex]}
                    controls
                    autoPlay
                    className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                    title={`Video ${enlargedVideoIndex + 1}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* 复制链接按钮 */}
                <div className="absolute bottom-4 right-4 z-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(mediaUrls[enlargedVideoIndex]).then(() => {
                              toast.success('Video URL copied to clipboard');
                            });
                          }}
                          className="rounded-full border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-white transition-all duration-200 hover:scale-110"
                        >
                          <CopyIcon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy video URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  if (mediaType === 'music' || mediaType === 'audio') {
    return (
      <div className="space-y-2">
        {mediaUrls.length > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{mediaUrls.length} audio files</span>
            <button
              onClick={copyAllUrls}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CopyIcon className="h-3 w-3" />
              Copy all
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {mediaUrls.map((url, index) => (
            <div key={index} className="relative">
              <AudioPlayer
                src={url}
                title={`Audio ${index + 1}`}
                className="w-full max-w-md"
              />
              <div className="absolute top-2 right-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(url).then(() => {
                            toast.success('Link copied to clipboard');
                          });
                        }}
                        className="p-1 bg-black/50 hover:bg-black/70 rounded backdrop-blur-sm"
                      >
                        <CopyIcon className="h-3 w-3 text-white" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy audio URL</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // 默认显示为链接列表
  return (
    <div className="space-y-1">
      {mediaUrls.length > 1 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{mediaUrls.length} links</span>
          <button
            onClick={copyAllUrls}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CopyIcon className="h-3 w-3" />
            Copy all
          </button>
        </div>
      )}
      <div className="flex flex-col gap-1">
        {mediaUrls.map((url, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate max-w-md flex-1"
              title={url}
            >
              {url}
            </a>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(url).then(() => {
                        toast.success('Link copied to clipboard');
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    <CopyIcon className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
    </div>
  );
}
