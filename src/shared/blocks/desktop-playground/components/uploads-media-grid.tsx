"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Music4,
  Play,
  Trash2,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GeneratedMediaEmptyState } from "@/shared/blocks/common/generated-media-empty-state";
import type { MediaPreviewLayout } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { cn } from "@/shared/lib/utils";
import { getMediaWsrvThumbnail } from "@/shared/lib/wsrv";

type UploadGridItem = {
  id: string;
  type: "image" | "video" | "audio";
  src: string;
  alt: string;
  model?: string;
  prompt?: string;
  sceneKey?: string;
  modelKey?: string;
  parameters?: Record<string, any>;
};

type QueueTask = {
  id: string;
  run: () => void;
  priority?: "high" | "low";
  top?: number;
  left?: number;
};

const MIXED_GRID_VARIANTS = [
  { aspectRatio: "1 / 1", basis: 0.92, width: 0.88 },
  { aspectRatio: "4 / 5", basis: 0.88, width: 0.82 },
  { aspectRatio: "16 / 10", basis: 1.12, width: 1.12 },
] as const;

const DEFAULT_MAX_CONCURRENT_MEDIA_LOADS = 4;
let activeMediaLoads = 0;
const pendingMediaLoadQueue: QueueTask[] = [];

function enqueueMediaLoad(task: QueueTask) {
  if (activeMediaLoads < DEFAULT_MAX_CONCURRENT_MEDIA_LOADS) {
    activeMediaLoads += 1;
    task.run();
    return;
  }

  const getPriorityWeight = (priority?: "high" | "low") =>
    priority === "high" ? 0 : 1;
  const taskPriority = getPriorityWeight(task.priority);
  const taskTop = Number.isFinite(task.top) ? (task.top as number) : Infinity;
  const taskLeft = Number.isFinite(task.left)
    ? (task.left as number)
    : Infinity;

  const insertIndex = pendingMediaLoadQueue.findIndex((queuedTask) => {
    const queuedPriority = getPriorityWeight(queuedTask.priority);
    if (taskPriority !== queuedPriority) {
      return taskPriority < queuedPriority;
    }

    const queuedTop = Number.isFinite(queuedTask.top)
      ? (queuedTask.top as number)
      : Infinity;
    if (taskTop !== queuedTop) {
      return taskTop < queuedTop;
    }

    const queuedLeft = Number.isFinite(queuedTask.left)
      ? (queuedTask.left as number)
      : Infinity;
    return taskLeft < queuedLeft;
  });

  if (insertIndex === -1) {
    pendingMediaLoadQueue.push(task);
  } else {
    pendingMediaLoadQueue.splice(insertIndex, 0, task);
  }
}

function removeQueuedMediaLoad(taskId: string) {
  const index = pendingMediaLoadQueue.findIndex((task) => task.id === taskId);
  if (index >= 0) {
    pendingMediaLoadQueue.splice(index, 1);
  }
}

function completeMediaLoadSlot() {
  activeMediaLoads = Math.max(0, activeMediaLoads - 1);
  const nextTask = pendingMediaLoadQueue.shift();
  if (nextTask) {
    activeMediaLoads += 1;
    nextTask.run();
  }
}

function generateDownloadName(item: { type: "image" | "video" | "audio" }) {
  const ext =
    item.type === "video" ? "mp4" : item.type === "audio" ? "mp3" : "png";
  const timestamp = Date.now();
  return `upload_${timestamp}.${ext}`;
}

async function downloadFile(url: string, filename: string) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function useDeferredVisibility() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "360px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

function getItemTypeIcon(type: UploadGridItem["type"]) {
  if (type === "video") return Video;
  if (type === "audio") return Music4;
  return ImageIcon;
}

function UploadCard({
  item,
  onPreview,
  onDelete,
  cardScale = 50,
  previewLayout = "original",
  showMetadata = true,
}: {
  item: UploadGridItem;
  onPreview: (item: UploadGridItem) => void;
  onDelete?: (id: string) => void;
  cardScale?: number;
  previewLayout?: MediaPreviewLayout;
  showMetadata?: boolean;
}) {
  const t = useTranslations(
    "landing.wavespeed.desktopPlayground.generatedPanel",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, isVisible } = useDeferredVisibility();
  const [canStartMediaLoad, setCanStartMediaLoad] = useState(false);
  const mediaLoadSlotAcquiredRef = useRef(false);
  const mediaLoadTimeoutRef = useRef<number | null>(null);
  const isAudio = item.type === "audio";
  const isVideo = item.type === "video";
  const shouldOpenPreview = !isAudio;
  const MediaTypeIcon = getItemTypeIcon(item.type);
  const modelVendorLogo = getModelVendorLogo({
    url: item.modelKey,
  });
  const badgeIconUrl = modelVendorLogo.url;
  const badgeNeedsWhiteBg = modelVendorLogo.needsWhiteBg;
  const badgeLabel = item.model || item.sceneKey || item.alt;
  const filename = item.parameters?.filename || item.alt;
  const shouldQueueLoad = !isAudio;
  const loadPriority = isVisible ? "high" : "low";
  const normalizedCardScale = Math.min(Math.max(cardScale, 0), 100) / 100;
  const cardBasisRem = 15 + normalizedCardScale * 6;
  const audioMaxWidthRem = 20 + normalizedCardScale * 8;
  const mediaMaxWidthRem = 24 + normalizedCardScale * 12;
  const cardMinHeight = 260 + normalizedCardScale * 80;
  const mixedVariant =
    MIXED_GRID_VARIANTS[
      Number.parseInt(item.id.slice(-1), 36) % MIXED_GRID_VARIANTS.length
    ];
  const cropCardAspectRatio = isVideo ? "4 / 5" : "1 / 1";
  const aspectRatio =
    previewLayout === "crop"
      ? cropCardAspectRatio
      : previewLayout === "mixed"
        ? mixedVariant.aspectRatio
        : "1 / 1";
  const mediaClassName =
    previewLayout === "original" ? "object-contain" : "object-cover";
  const cardBasis =
    previewLayout === "mixed"
      ? cardBasisRem * mixedVariant.basis
      : cardBasisRem;
  const cardMaxWidth =
    previewLayout === "mixed"
      ? mediaMaxWidthRem * mixedVariant.width
      : isAudio
        ? audioMaxWidthRem
        : mediaMaxWidthRem;
  const compactCardBasisRem = Math.max(11.5, cardBasis - 3.5);
  const compactCardMaxWidthRem = Math.max(
    isAudio ? 14 : 16,
    cardMaxWidth - (isAudio ? 4 : 6),
  );
  const wrapperMinHeight =
    isAudio || previewLayout === "crop" || previewLayout === "original"
      ? `${cardMinHeight}px`
      : undefined;

  const releaseMediaLoadSlot = () => {
    if (mediaLoadTimeoutRef.current) {
      window.clearTimeout(mediaLoadTimeoutRef.current);
      mediaLoadTimeoutRef.current = null;
    }
    if (mediaLoadSlotAcquiredRef.current) {
      mediaLoadSlotAcquiredRef.current = false;
      completeMediaLoadSlot();
    }
  };

  useEffect(() => {
    if (!shouldQueueLoad) return;
    if (!isVisible || canStartMediaLoad || isLoaded) return;

    const taskId = `upload-media-load-${item.id}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    let cancelled = false;
    const cardRect = ref.current?.getBoundingClientRect();

    enqueueMediaLoad({
      id: taskId,
      priority: loadPriority,
      top: cardRect?.top,
      left: cardRect?.left,
      run: () => {
        if (cancelled) {
          completeMediaLoadSlot();
          return;
        }

        mediaLoadSlotAcquiredRef.current = true;
        if (mediaLoadTimeoutRef.current) {
          window.clearTimeout(mediaLoadTimeoutRef.current);
        }
        mediaLoadTimeoutRef.current = window.setTimeout(() => {
          releaseMediaLoadSlot();
        }, 12000);
        setCanStartMediaLoad(true);
      },
    });

    return () => {
      cancelled = true;
      removeQueuedMediaLoad(taskId);
    };
  }, [
    canStartMediaLoad,
    isLoaded,
    isVisible,
    item.id,
    loadPriority,
    ref,
    shouldQueueLoad,
  ]);

  useEffect(() => {
    if (!shouldQueueLoad) return;

    return () => {
      releaseMediaLoadSlot();
    };
  }, [shouldQueueLoad]);

  useEffect(() => {
    if (isAudio) {
      setIsLoaded(true);
    }
  }, [isAudio]);

  return (
    <div
      ref={ref}
      className="relative min-w-0"
      style={{
        flexBasis: `min(calc(50% - 0.5rem), clamp(${compactCardBasisRem}rem, 78vw, ${cardBasis}rem))`,
        maxWidth: `min(calc(50% - 0.5rem), min(100%, clamp(${compactCardMaxWidthRem}rem, 78vw, ${cardMaxWidth}rem)))`,
        flexGrow: 1,
        minHeight: wrapperMinHeight
          ? `clamp(13rem, 58vw, ${wrapperMinHeight})`
          : undefined,
        aspectRatio: isAudio ? undefined : aspectRatio,
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[0.75rem] bg-transparent transition-all duration-200">
        <div
          className={cn(
            "group/media relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.75rem] bg-[#0b0c0f]",
            shouldOpenPreview && "cursor-zoom-in",
          )}
          style={aspectRatio ? { aspectRatio } : undefined}
          onClick={() => {
            if (shouldOpenPreview) {
              onPreview(item);
            }
          }}
          role={shouldOpenPreview ? "button" : undefined}
          tabIndex={shouldOpenPreview ? 0 : undefined}
          onKeyDown={(event) => {
            if (!shouldOpenPreview) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onPreview(item);
            }
          }}
          aria-label={shouldOpenPreview ? t("preview.openPreview") : undefined}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition-colors duration-200 group-hover/media:bg-black/10 group-focus-within/media:bg-black/10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/26 via-black/8 to-transparent opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 group-focus-within/media:opacity-100" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-black/58 via-black/20 to-transparent opacity-70 transition-opacity duration-200 group-hover/media:opacity-100 group-focus-within/media:opacity-100" />

          {!isLoaded && !isAudio ? (
            <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-br from-white/[0.05] to-white/[0.02]" />
          ) : null}

          {isVisible ? (
            isAudio ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%),linear-gradient(180deg,#181b1f_0%,#101216_100%)] text-white/80">
                <div className="flex size-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.05]">
                  <Music4 className="size-6" />
                </div>
                <div className="max-w-[80%] truncate text-sm font-medium">
                  {filename}
                </div>
              </div>
            ) : isVideo && canStartMediaLoad ? (
              <video
                src={isVisible ? item.src : undefined}
                className={cn(
                  "block h-full w-full transition-transform duration-500 group-hover/media:scale-[1.02]",
                  mediaClassName,
                  !isLoaded && "opacity-0",
                )}
                muted
                playsInline
                preload="metadata"
                onLoadedData={() => {
                  setIsLoaded(true);
                  releaseMediaLoadSlot();
                }}
                onError={() => {
                  setIsLoaded(true);
                  releaseMediaLoadSlot();
                }}
              />
            ) : canStartMediaLoad ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaWsrvThumbnail(item.src, "image", { width: 600 })}
                alt={item.alt}
                loading={loadPriority === "high" ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={loadPriority === "high" ? "high" : "auto"}
                className={cn(
                  "block h-full w-full transition-transform duration-500 group-hover/media:scale-[1.02]",
                  mediaClassName,
                  !isLoaded && "opacity-0",
                )}
                onLoad={() => {
                  setIsLoaded(true);
                  releaseMediaLoadSlot();
                }}
                onError={() => {
                  setIsLoaded(true);
                  releaseMediaLoadSlot();
                }}
              />
            ) : (
              <div className="absolute inset-0 z-0 bg-[#0b0c0f]" />
            )
          ) : null}

          {isVideo && !isLoaded ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/16">
              <div className="rounded-full bg-black/52 p-3 backdrop-blur-sm">
                <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
              </div>
            </div>
          ) : null}

          <div className="absolute inset-x-3 top-3 z-20 flex items-start justify-between transition-all duration-200 md:inset-x-4 md:top-4 md:pointer-events-none md:opacity-0 md:group-hover/media:pointer-events-auto md:group-hover/media:opacity-100 md:group-focus-within/media:pointer-events-auto md:group-focus-within/media:opacity-100">
            <div />
            <div className="rounded-[1rem] bg-black/18 p-1.5 backdrop-blur-[3px] md:rounded-[0.9rem] md:bg-black/12 md:p-1 md:backdrop-blur-[2px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void downloadFile(item.src, generateDownloadName(item));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[0.8rem] border border-white/10 bg-[rgba(28,20,14,0.56)] text-white backdrop-blur-md transition hover:bg-[rgba(28,20,14,0.68)] md:h-6.5 md:w-6.5 md:rounded-[0.7rem] md:border-white/8"
                  aria-label={t("selection.download")}
                >
                  <Download className="h-3.5 w-3.5 md:h-3 md:w-3" />
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-[0.8rem] border border-white/10 bg-transparent text-white backdrop-blur-md transition hover:bg-white/10 md:h-6.5 md:w-6.5 md:rounded-[0.7rem] md:border-white/8"
                    aria-label={t("selection.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-3 md:w-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-2 transition-all duration-200 md:bottom-4 md:left-4 md:gap-4 md:pointer-events-none md:opacity-0 md:group-hover/media:pointer-events-auto md:group-hover/media:opacity-100 md:group-focus-within/media:pointer-events-auto md:group-focus-within/media:opacity-100">
            {showMetadata ? (
              <div className="flex min-w-0 items-center overflow-hidden rounded-full border border-white/10 bg-black/62 pr-2 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <div className="flex h-7 min-w-7 items-center justify-center px-2 md:h-8 md:min-w-8">
                  <MediaTypeIcon className="h-2.5 w-2.5" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex h-7 max-w-[8rem] items-center px-2 md:h-8 md:max-w-[10rem] md:px-2.5">
                  <span className="truncate text-[0.68rem] font-semibold leading-none tracking-[0.01em] md:text-[0.72rem]">
                    {filename}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="group/badge relative flex h-7 min-w-8 items-center justify-center px-2 md:h-8 md:min-w-10 md:px-2.5">
                  <div
                    className="flex size-4 items-center justify-center text-[0.72rem] font-semibold leading-none text-white md:size-5 md:text-[0.76rem]"
                    aria-label={badgeLabel}
                  >
                    {badgeIconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={badgeIconUrl}
                        alt={badgeLabel}
                        className={cn(
                          "h-2.5 w-2.5 object-contain md:h-3 md:w-3",
                          badgeNeedsWhiteBg && "brightness-0 invert",
                        )}
                      />
                    ) : (
                      String(badgeLabel || "U")
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  {badgeLabel ? (
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-1.5 py-1 text-[10px] text-white opacity-0 transition-opacity duration-150 group-hover/badge:opacity-100">
                      {badgeLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div />
            )}

            {!isAudio ? (
              <div className="flex shrink-0 overflow-hidden rounded-[1rem] border border-black/6 bg-white/95 text-[#111318] shadow-[0_16px_40px_rgba(0,0,0,0.28)] md:rounded-[0.95rem]">
                <button
                  type="button"
                  aria-label={t("preview.openPreview")}
                  onClick={(event) => {
                    event.stopPropagation();
                    onPreview(item);
                  }}
                  className="flex h-8 w-8 items-center justify-center transition hover:bg-black/6 md:h-[1.75rem] md:w-[1.75rem]"
                >
                  <Maximize2 className="h-3 w-3 md:h-2.75 md:w-2.75" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function UploadsMediaGrid({
  items,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onDeleteItem,
  emptyTitle,
  emptyDescription,
  emptyChips,
  cardScale = 50,
  previewLayout = "original",
  showMetadata = true,
}: {
  items: UploadGridItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onDeleteItem?: (id: string) => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyChips?: string[];
  cardScale?: number;
  previewLayout?: MediaPreviewLayout;
  showMetadata?: boolean;
}) {
  const t = useTranslations(
    "landing.wavespeed.desktopPlayground.generatedPanel",
  );
  const [selectedItem, setSelectedItem] = useState<UploadGridItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    const scrollRoot = scrollContainerRef.current;
    if (!node || !hasMore || !onLoadMore || isLoading || isLoadingMore) {
      return;
    }

    let cancelled = false;
    const triggerLoadMore = () => {
      if (cancelled) return;
      onLoadMore();
    };

    const viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerLoadMore();
          }
        });
      },
      {
        rootMargin: "480px 0px",
        threshold: 0.01,
      },
    );

    viewportObserver.observe(node);

    const scopedObserver = scrollRoot
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                triggerLoadMore();
              }
            });
          },
          {
            root: scrollRoot,
            rootMargin: "480px 0px",
            threshold: 0.01,
          },
        )
      : null;

    if (scopedObserver) {
      scopedObserver.observe(node);
    }

    return () => {
      cancelled = true;
      viewportObserver.disconnect();
      scopedObserver?.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (!scrollRoot || !hasMore || !onLoadMore || isLoading || isLoadingMore) {
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;
        const distanceToBottom =
          scrollRoot.scrollHeight -
          scrollRoot.scrollTop -
          scrollRoot.clientHeight;

        if (distanceToBottom <= 720) {
          onLoadMore();
        }
      });
    };

    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollRoot.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 min-w-0 flex-col">
        <GeneratedMediaEmptyState
          mediaType="image"
          showWorkbenchChrome={false}
          rounded={false}
          title={emptyTitle}
          description={emptyDescription}
          chips={emptyChips}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 touch-pan-y [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] md:px-6 md:py-5"
      >
        <div className="flex flex-wrap items-start gap-4">
          {items.map((item) => (
            <UploadCard
              key={item.id}
              item={item}
              onPreview={setSelectedItem}
              onDelete={onDeleteItem}
              cardScale={cardScale}
              previewLayout={previewLayout}
              showMetadata={showMetadata}
            />
          ))}
        </div>

        {(isLoading || isLoadingMore) && (
          <div className="flex items-center justify-center py-6 text-white/55">
            <Loader2
              className="h-4 w-4 animate-spin"
              aria-label={t("selection.download")}
            />
          </div>
        )}

        {hasMore ? <div ref={sentinelRef} className="h-8 w-full" /> : null}
      </div>

      <Dialog
        open={Boolean(selectedItem && selectedItem.type !== "audio")}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-auto w-[min(92vw,64rem)] max-w-[64rem] overflow-hidden border-white/12 bg-black p-0 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        >
          {selectedItem && selectedItem.type !== "audio" ? (
            <div className="relative flex max-h-[80vh] min-h-[18rem] w-full items-center justify-center bg-black">
              {selectedItem.type === "video" ? (
                <video
                  src={selectedItem.src}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[80vh] w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.src}
                  alt={selectedItem.alt}
                  className="max-h-[80vh] w-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 z-20 rounded-full border border-white/12 bg-black/55 px-3 py-2 text-sm font-medium text-white transition hover:bg-black/70"
              >
                {t("preview.close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void downloadFile(
                    selectedItem.src,
                    generateDownloadName(selectedItem),
                  );
                }}
                className="absolute bottom-4 right-4 z-20 rounded-full border border-white/12 bg-black/55 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/70"
              >
                {t("preview.download")}
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
