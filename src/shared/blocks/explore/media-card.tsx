'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Heart } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import {
  getVideoPosterUrl,
  getVideoThumbnailUrl,
  getBestVideoThumbnailType,
} from '@/shared/lib/oss-video-thumbnail';

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  thumbnail?: string;
  thumbnailUrl?: string; // OSS 缩略图 URL
  alt?: string;
  author?: {
    username: string;
    avatar?: string;
  };
  likes?: number;
  model?: string;
  prompt?: string;
  quality?: string;
  size?: string;
  width?: number;
  height?: number;
  aspectRatio?: number; // 预计算的宽高比，避免布局偏移
  gridSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  generateUrl?: string;
  priority?: 'high' | 'low'; // 加载优先级，首屏可见设为 high
  srcSet?: {
    small?: string;   // 移动端优化 (320-640px)
    medium?: string;  // 平板优化 (640-1024px)
    large?: string;   // 桌面优化 (1024px+)
  };
  blurDataURL?: string; // 低质量占位图 base64
  sceneKey?: string; // 场景 key (如 'text-to-image')
  modelKey?: string; // 模型 key (如 'yoga-v1')
  parameters?: Record<string, any>; // 生成参数
}

interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
  onLoadFailed?: (itemId: string) => void;
  onLoadComplete?: () => void;
  className?: string;
  disableImageOptimization?: boolean;
  limitImageConcurrency?: boolean;
  visibilityRoot?: HTMLDivElement | null;
}

type QueueTask = {
  id: string;
  run: () => void;
  priority?: 'high' | 'low';
  top?: number;
  left?: number;
};

const DEFAULT_MAX_CONCURRENT_IMAGE_LOADS = 4;
const DEFAULT_MAX_CONCURRENT_VIDEO_LOADS = 3;
let activeImageLoads = 0;
let activeVideoLoads = 0;
const pendingImageLoadQueue: QueueTask[] = [];
const pendingVideoLoadQueue: QueueTask[] = [];

function isLikelyVideoAssetUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(pathname);
  } catch {
    return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(url);
  }
}

function enqueueImageLoad(task: QueueTask) {
  if (activeImageLoads < DEFAULT_MAX_CONCURRENT_IMAGE_LOADS) {
    activeImageLoads += 1;
    task.run();
    return;
  }
  const getPriorityWeight = (priority?: 'high' | 'low') => (priority === 'high' ? 0 : 1);
  const taskPriority = getPriorityWeight(task.priority);
  const taskTop = Number.isFinite(task.top) ? (task.top as number) : Number.POSITIVE_INFINITY;
  const taskLeft = Number.isFinite(task.left) ? (task.left as number) : Number.POSITIVE_INFINITY;

  const insertIndex = pendingImageLoadQueue.findIndex((queuedTask) => {
    const queuedPriority = getPriorityWeight(queuedTask.priority);
    if (taskPriority !== queuedPriority) {
      return taskPriority < queuedPriority;
    }

    const queuedTop = Number.isFinite(queuedTask.top)
      ? (queuedTask.top as number)
      : Number.POSITIVE_INFINITY;
    if (taskTop !== queuedTop) {
      return taskTop < queuedTop;
    }

    const queuedLeft = Number.isFinite(queuedTask.left)
      ? (queuedTask.left as number)
      : Number.POSITIVE_INFINITY;
    return taskLeft < queuedLeft;
  });

  if (insertIndex === -1) {
    pendingImageLoadQueue.push(task);
  } else {
    pendingImageLoadQueue.splice(insertIndex, 0, task);
  }
}

function removeQueuedImageLoad(taskId: string) {
  const index = pendingImageLoadQueue.findIndex((task) => task.id === taskId);
  if (index >= 0) {
    pendingImageLoadQueue.splice(index, 1);
  }
}

function completeImageLoadSlot() {
  activeImageLoads = Math.max(0, activeImageLoads - 1);
  const nextTask = pendingImageLoadQueue.shift();
  if (nextTask) {
    activeImageLoads += 1;
    nextTask.run();
  }
}

function enqueueVideoLoad(task: QueueTask) {
  if (activeVideoLoads < DEFAULT_MAX_CONCURRENT_VIDEO_LOADS) {
    activeVideoLoads += 1;
    task.run();
    return;
  }
  const getPriorityWeight = (priority?: 'high' | 'low') => (priority === 'high' ? 0 : 1);
  const taskPriority = getPriorityWeight(task.priority);
  const taskTop = Number.isFinite(task.top) ? (task.top as number) : Number.POSITIVE_INFINITY;
  const taskLeft = Number.isFinite(task.left) ? (task.left as number) : Number.POSITIVE_INFINITY;

  const insertIndex = pendingVideoLoadQueue.findIndex((queuedTask) => {
    const queuedPriority = getPriorityWeight(queuedTask.priority);
    if (taskPriority !== queuedPriority) {
      return taskPriority < queuedPriority;
    }

    const queuedTop = Number.isFinite(queuedTask.top)
      ? (queuedTask.top as number)
      : Number.POSITIVE_INFINITY;
    if (taskTop !== queuedTop) {
      return taskTop < queuedTop;
    }

    const queuedLeft = Number.isFinite(queuedTask.left)
      ? (queuedTask.left as number)
      : Number.POSITIVE_INFINITY;
    return taskLeft < queuedLeft;
  });

  if (insertIndex === -1) {
    pendingVideoLoadQueue.push(task);
  } else {
    pendingVideoLoadQueue.splice(insertIndex, 0, task);
  }
}

function removeQueuedVideoLoad(taskId: string) {
  const index = pendingVideoLoadQueue.findIndex((task) => task.id === taskId);
  if (index >= 0) {
    pendingVideoLoadQueue.splice(index, 1);
  }
}

function completeVideoLoadSlot() {
  activeVideoLoads = Math.max(0, activeVideoLoads - 1);
  const nextTask = pendingVideoLoadQueue.shift();
  if (nextTask) {
    activeVideoLoads += 1;
    nextTask.run();
  }
}

export function MediaCard({
  item,
  onClick,
  onLoadFailed,
  onLoadComplete,
  className,
  disableImageOptimization = false,
  limitImageConcurrency = false,
  visibilityRoot,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [canStartImageLoad, setCanStartImageLoad] = useState(!limitImageConcurrency);
  const [imageLoadSlotAcquired, setImageLoadSlotAcquired] = useState(false);
  const imageLoadSlotAcquiredRef = useRef(false);
  const imageLoadTimeoutRef = useRef<number | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const [canStartVideoLoad, setCanStartVideoLoad] = useState(false);
  const [videoPosterLoaded, setVideoPosterLoaded] = useState(item.type !== 'video');
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadCompletionNotifiedRef = useRef(false);
  const videoLoadSlotAcquiredRef = useRef(false);
  const videoLoadTimeoutRef = useRef<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    item.width && item.height ? { width: item.width, height: item.height } : null
  );

  // 获取缩略图 URL（优先使用 thumbnailUrl，其次 thumbnail）
  const thumbnailSrc = item.thumbnailUrl || item.thumbnail;
  const normalizedVideoThumbnail =
    item.type === 'video' && thumbnailSrc
      ? (
        isLikelyVideoAssetUrl(thumbnailSrc)
          ? getVideoPosterUrl(thumbnailSrc, { width: 500 }) || ''
          : thumbnailSrc
      )
      : thumbnailSrc;

  // 对于视频，尝试生成 OSS 视频缩略图（非 OSS URL 会返回原 URL）
  const ossVideoThumbnail = item.type === 'video' && !normalizedVideoThumbnail
    ? (
      getVideoPosterUrl(item.src, { width: 500 }) ||
      getVideoThumbnailUrl(item.src, {
        type: getBestVideoThumbnailType(),
        width: 400,
        duration: 3,
      })
    )
    : undefined;

  // 获取显示 URL（优先用预设缩略图，其次用 OSS 视频缩略图）
  const displaySrc: string = item.type === 'video'
    ? (
      normalizedVideoThumbnail ||
      (ossVideoThumbnail && ossVideoThumbnail !== item.src ? ossVideoThumbnail : '')
    )
    : (thumbnailSrc || item.src || '');

  // 计算宽高比，优先使用预设的 aspectRatio，防止布局偏移
  const aspectRatio = item.aspectRatio
    ? item.aspectRatio
    : imageDimensions
      ? imageDimensions.height / imageDimensions.width
      : item.gridSize === 'tall' || item.gridSize === 'large'
        ? 4 / 3
        : item.gridSize === 'small'
          ? 1
        : 10 / 16;

  const notifyLoadComplete = () => {
    if (loadCompletionNotifiedRef.current) return;
    loadCompletionNotifiedRef.current = true;
    onLoadComplete?.();
  };

  const releaseVideoLoadSlot = () => {
    if (videoLoadTimeoutRef.current) {
      window.clearTimeout(videoLoadTimeoutRef.current);
      videoLoadTimeoutRef.current = null;
    }
    if (videoLoadSlotAcquiredRef.current) {
      videoLoadSlotAcquiredRef.current = false;
      completeVideoLoadSlot();
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!imageDimensions && img.naturalWidth && img.naturalHeight) {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
    setImageLoading(false);
    if (limitImageConcurrency && imageLoadSlotAcquiredRef.current) {
      if (imageLoadTimeoutRef.current) {
        window.clearTimeout(imageLoadTimeoutRef.current);
        imageLoadTimeoutRef.current = null;
      }
      imageLoadSlotAcquiredRef.current = false;
      setImageLoadSlotAcquired(false);
      completeImageLoadSlot();
    }
    notifyLoadComplete();
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsVisible(true);
          } else if (!entry.isIntersecting) {
            setIsVisible(false);
          }
        });
      },
      {
        root: visibilityRoot ?? null,
        threshold: [0, 0.1],
        rootMargin: '240px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [visibilityRoot]);

  useEffect(() => {
    if (item.type !== 'video') return;
    setVideoPosterLoaded(!displaySrc);
  }, [displaySrc, item.id, item.type]);

  useEffect(() => {
    if (item.type === 'video' && videoRef && !videoError && canStartVideoLoad) {
      if (isVisible) {
        const tryPlay = async () => {
          if (!videoRef || videoError) return;

          try {
            if (videoRef.readyState === 0) {
              videoRef.load();
            }

            if (videoRef.readyState < 2) {
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  cleanup();
                  if (videoRef.readyState >= 1) {
                    resolve();
                  } else {
                    reject(new Error('Video load timeout'));
                  }
                }, 2000);

                const handleCanPlay = () => {
                  cleanup();
                  resolve();
                };

                const handleError = () => {
                  cleanup();
                  reject(new Error('Video load error'));
                };

                const cleanup = () => {
                  clearTimeout(timeout);
                  videoRef.removeEventListener('canplay', handleCanPlay);
                  videoRef.removeEventListener('error', handleError);
                };

                videoRef.addEventListener('canplay', handleCanPlay, { once: true });
                videoRef.addEventListener('error', handleError, { once: true });
              });
            }

            const playPromise = videoRef.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
            setVideoCanPlay(true);
            setVideoLoading(false);
          } catch (error: any) {
            if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
              setVideoCanPlay(true);
              setVideoLoading(false);
            } else {
              if (videoRef.readyState >= 1) {
                setVideoCanPlay(true);
                setVideoLoading(false);
              }
            }
          }
        };

        setTimeout(tryPlay, 100);
      } else {
        if (videoRef.readyState > 0) {
          videoRef.pause();
        }
      }
    }
  }, [item.type, videoRef, videoError, isVisible, canStartVideoLoad]);


  const handleVideoCanPlay = () => {
    setVideoCanPlay(true);
    setVideoLoading(false);
    releaseVideoLoadSlot();
    notifyLoadComplete();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;

    console.error('[MediaCard] Video error:', {
      videoId: item.id,
      videoSrc: item.src,
      errorCode: error?.code,
      errorMessage: error?.message,
    });

    setVideoError(true);
    setVideoLoading(false);
    releaseVideoLoadSlot();
  };

  const handleVideoLoadStart = () => {
    setVideoLoading(true);
    setVideoError(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleActivate = () => {
    onClick?.(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  useEffect(() => {
    if (item.type === 'image' && imageError && onLoadFailed) {
      onLoadFailed(item.id);
    }
  }, [item.type, imageError, item.id, onLoadFailed]);

  useEffect(() => {
    if (!limitImageConcurrency || item.type !== 'image') return;
    if (!isVisible || imageError || canStartImageLoad) return;

    const taskId = `image-load-${item.id}-${Math.random().toString(36).slice(2, 8)}`;
    let cancelled = false;
    const cardRect = containerRef.current?.getBoundingClientRect();

    enqueueImageLoad({
      id: taskId,
      priority: item.priority,
      top: cardRect?.top,
      left: cardRect?.left,
      run: () => {
        if (cancelled) {
          completeImageLoadSlot();
          return;
        }
        imageLoadSlotAcquiredRef.current = true;
        setImageLoadSlotAcquired(true);
        // 兜底超时释放，避免个别图片请求卡死导致队列阻塞
        if (imageLoadTimeoutRef.current) {
          window.clearTimeout(imageLoadTimeoutRef.current);
        }
        imageLoadTimeoutRef.current = window.setTimeout(() => {
          if (imageLoadSlotAcquiredRef.current) {
            imageLoadSlotAcquiredRef.current = false;
            setImageLoadSlotAcquired(false);
            completeImageLoadSlot();
          }
        }, 12000);
        setCanStartImageLoad(true);
      },
    });

    return () => {
      cancelled = true;
      removeQueuedImageLoad(taskId);
    };
  }, [limitImageConcurrency, item.type, item.id, isVisible, imageError, canStartImageLoad]);

  useEffect(() => {
    if (!limitImageConcurrency || item.type !== 'image') return;
    return () => {
      if (imageLoadTimeoutRef.current) {
        window.clearTimeout(imageLoadTimeoutRef.current);
        imageLoadTimeoutRef.current = null;
      }
      if (imageLoadSlotAcquiredRef.current && imageLoading) {
        imageLoadSlotAcquiredRef.current = false;
        setImageLoadSlotAcquired(false);
        completeImageLoadSlot();
      }
    };
  }, [limitImageConcurrency, item.type, imageLoading]);

  useEffect(() => {
    if (item.type !== 'video' || videoError || !isVisible || canStartVideoLoad) return;
    if (displaySrc && !videoPosterLoaded) return;

    const taskId = `video-load-${item.id}-${Math.random().toString(36).slice(2, 8)}`;
    let cancelled = false;
    const cardRect = containerRef.current?.getBoundingClientRect();

    enqueueVideoLoad({
      id: taskId,
      priority: item.priority,
      top: cardRect?.top,
      left: cardRect?.left,
      run: () => {
        if (cancelled) {
          completeVideoLoadSlot();
          return;
        }
        videoLoadSlotAcquiredRef.current = true;
        if (videoLoadTimeoutRef.current) {
          window.clearTimeout(videoLoadTimeoutRef.current);
        }
        videoLoadTimeoutRef.current = window.setTimeout(() => {
          releaseVideoLoadSlot();
        }, 12000);
        setCanStartVideoLoad(true);
      },
    });

    return () => {
      cancelled = true;
      removeQueuedVideoLoad(taskId);
    };
  }, [
    item.type,
    item.id,
    item.priority,
    isVisible,
    videoError,
    canStartVideoLoad,
    displaySrc,
    videoPosterLoaded,
  ]);

  useEffect(() => {
    if (item.type !== 'video') return;
    if (isVisible) return;

    if (videoRef && !videoRef.paused) {
      videoRef.pause();
    }
    setCanStartVideoLoad(false);
    releaseVideoLoadSlot();
  }, [item.type, isVisible, videoRef]);

  useEffect(() => {
    if (item.type !== 'video') return;
    return () => {
      releaseVideoLoadSlot();
    };
  }, [item.type]);

  useEffect(() => {
    if (item.type === 'video' && videoError && !ossVideoThumbnail && onLoadFailed) {
      onLoadFailed(item.id);
    }
  }, [item.type, videoError, ossVideoThumbnail, item.id, onLoadFailed]);

  useEffect(() => {
    loadCompletionNotifiedRef.current = false;
  }, [item.id]);

  useEffect(() => {
    if (item.type === 'audio') {
      notifyLoadComplete();
    }
  }, [item.type]);

  if (item.type === 'image' && imageError) {
    return null;
  }

  if (item.type === 'video' && videoError && !ossVideoThumbnail) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onClick={onClick ? handleActivate : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-disabled={onClick ? undefined : true}
      className={cn(
        'group relative h-full w-full overflow-hidden rounded-xl bg-white/5',
        onClick ? 'cursor-pointer' : 'cursor-default',
        'border border-white/5',
        className
      )}
      style={{
        transform: 'translateZ(0)',
        maxWidth: '100%',
        maxHeight: '100%',
        isolation: 'isolate',
        aspectRatio: aspectRatio.toString(),
      }}
    >
      {item.type === 'audio' ? (
        <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎵</div>
            <div className="text-2xl font-semibold text-white/90">Coming Soon</div>
            <div className="text-sm text-white/60">Audio generation feature</div>
          </div>
        </div>
      ) : item.type === 'video' ? (
        <div className="relative h-full w-full">
          {displaySrc && !imageError && (
            <div className={cn(
              "absolute inset-0 z-0 transition-opacity duration-500",
              videoCanPlay && isVisible ? "opacity-0" : "opacity-100"
            )}>
              <Image
                src={displaySrc}
                alt={item.alt ?? ''}
                fill
                unoptimized={disableImageOptimization}
                loading="lazy"
                quality={70}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=="
                className="object-cover"
                onLoad={() => {
                  setVideoPosterLoaded(true);
                  notifyLoadComplete();
                }}
                onError={() => {
                  console.error('[MediaCard] Video thumbnail not found:', {
                    videoId: item.id,
                    thumbnailSrc: displaySrc,
                  });
                  setImageError(true);
                  setVideoPosterLoaded(true);
                  notifyLoadComplete();
                }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                priority={false}
              />
              {!isVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded-full bg-black/60 p-3 backdrop-blur-sm">
                    <Play className="ml-1 h-6 w-6 fill-white text-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {videoLoading && !videoError && (!displaySrc || imageError) && (
            <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl">
              <Skeleton className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
            </div>
          )}

          {!videoError && (
            <video
              ref={setVideoRef}
              src={isVisible && canStartVideoLoad ? item.src : undefined}
              poster={displaySrc || undefined}
              muted
              loop
              playsInline
              preload="none"
              webkit-playsinline="true"
              x5-playsinline="true"
              className={cn(
                'relative z-10 h-full w-full object-cover transition-opacity duration-500',
                videoCanPlay && isVisible ? 'opacity-100' : 'opacity-0'
              )}
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
              onLoadedData={handleVideoCanPlay}
              onPlaying={() => {
                setVideoCanPlay(true);
                setVideoLoading(false);
                releaseVideoLoadSlot();
                notifyLoadComplete();
              }}
            />
          )}

        </div>
      ) : item.type === 'image' ? (
        <div className="relative h-full w-full">
          {imageLoading && (
            <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl">
              <Skeleton className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
            </div>
          )}
          {displaySrc && canStartImageLoad && (
            disableImageOptimization ? (
              <img
                src={displaySrc}
                alt={item.alt ?? ''}
                loading={item.priority === 'high' ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={item.priority === 'high' ? 'high' : 'auto'}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover',
                  imageLoading && 'opacity-0'
                )}
                onError={() => {
                  console.error('[MediaCard] Image not found:', {
                    imageId: item.id,
                    imageSrc: displaySrc,
                    imageType: item.type,
                  });
                  setImageError(true);
                  setImageLoading(false);
                  if (limitImageConcurrency && imageLoadSlotAcquiredRef.current) {
                    if (imageLoadTimeoutRef.current) {
                      window.clearTimeout(imageLoadTimeoutRef.current);
                      imageLoadTimeoutRef.current = null;
                    }
                    imageLoadSlotAcquiredRef.current = false;
                    setImageLoadSlotAcquired(false);
                    completeImageLoadSlot();
                  }
                }}
                onLoad={handleImageLoad}
              />
            ) : (
              <Image
                src={displaySrc}
                alt={item.alt ?? ''}
                fill
                unoptimized={false}
                loading={item.priority === 'high' ? 'eager' : 'lazy'}
                priority={item.priority === 'high'}
                quality={70}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                placeholder={item.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={item.blurDataURL}
                className={cn(
                  'object-cover',
                  imageLoading && 'opacity-0'
                )}
                onError={() => {
                  console.error('[MediaCard] Image not found:', {
                    imageId: item.id,
                    imageSrc: displaySrc,
                    imageType: item.type,
                  });
                  setImageError(true);
                  setImageLoading(false);
                  if (limitImageConcurrency && imageLoadSlotAcquiredRef.current) {
                    if (imageLoadTimeoutRef.current) {
                      window.clearTimeout(imageLoadTimeoutRef.current);
                      imageLoadTimeoutRef.current = null;
                    }
                    imageLoadSlotAcquiredRef.current = false;
                    setImageLoadSlotAcquired(false);
                    completeImageLoadSlot();
                  }
                }}
                onLoad={handleImageLoad}
              />
            )
          )}
        </div>
      ) : null}

      {(item.author || item.likes !== undefined) && item.type !== 'audio' && (
        <div
          className={cn(
            'absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm',
          )}
        >
          {item.author && (
            <div className="flex items-center gap-1.5">
              {item.author.avatar ? (
                <Image
                  src={item.author.avatar}
                  alt={item.author.username}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              ) : (
                <div className="h-4 w-4 rounded-full bg-primary" />
              )}
              <span className="text-xs">@{item.author.username}</span>
            </div>
          )}
          {item.likes !== undefined && (
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>{item.likes}</span>
            </div>
          )}
        </div>
      )}

      {/* Parameters display */}
      {item.parameters && item.type !== 'audio' && (
        <div
          className={cn(
            'absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-3 py-2 text-xs text-white backdrop-blur-sm transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="space-y-1">
            {item.prompt && (
              <div className="line-clamp-2 text-xs text-white/90">
                {item.prompt}
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-[10px] text-white/70">
              {item.parameters.aspectRatio && (
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  {item.parameters.aspectRatio}
                </span>
              )}
              {item.parameters.size && (
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  {item.parameters.size}
                </span>
              )}
              {item.parameters.seed !== undefined && item.parameters.seed !== -1 && (
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  seed: {item.parameters.seed}
                </span>
              )}
              {item.parameters.outputFormat && (
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  {item.parameters.outputFormat}
                </span>
              )}
              {item.parameters.output_format && (
                <span className="rounded bg-white/10 px-1.5 py-0.5">
                  {item.parameters.output_format}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0',
          isHovered && item.type !== 'audio' && 'opacity-100'
        )}
      />
    </div>
  );
}
