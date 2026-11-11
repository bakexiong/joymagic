"use client";

import {
  Loader2,
  Download,
  Trash2,
  Check,
  Maximize2,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  Play,
  Sparkles,
  Pencil,
  Video,
  Camera,
  Music4,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
} from "@/shared/lib/workbench-panel-shared";
import { getMediaWsrvThumbnail } from "@/shared/lib/wsrv";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { MediaDetailModal } from "@/shared/blocks/explore/media-detail-modal";
import { GeneratedMediaEmptyState } from "@/shared/blocks/common/generated-media-empty-state";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { MediaItem } from "@/shared/blocks/explore/media-card";

export interface GeneratedMediaItem {
  url: string;
  previewUrl?: string;
  params: Record<string, any>;
  aspectRatio: string;
  mediaKind?: "image" | "video" | "audio";
  createdAt?: string;
  sceneId?: string;
  modelUrl?: string;
  prompt?: string;
}

export type MediaPreviewLayout = "original" | "crop" | "mixed";
export type MediaGridDensity = "default" | "compact";

interface GeneratedMediaPanelProps {
  items: GeneratedMediaItem[];
  isGenerating?: boolean;
  pendingItemCount?: number;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyText?: string;
  mediaType?: "image" | "video";
  className?: string;
  embedded?: boolean;
  embeddedTone?: "dark" | "light";
  hideHeader?: boolean;
  selectedIndices?: number[];
  onToggleSelectItem?: (index: number, params: Record<string, any>) => void;
  onUseItem?: (index: number, params: Record<string, any>) => void;
  onUpscaleItem?: (index: number, params: Record<string, any>) => void;
  onClearSelection?: () => void;
  onDeleteItem?: (index: number) => void;
  onDeleteItems?: (indices: number[]) => void;
  autoplayVideos?: boolean;
  sceneMetaById?: Record<string, { label: string; iconUrl?: string }>;
  modelMetaByUrl?: Record<
    string,
    { label: string; iconUrl?: string; needsWhiteBg?: boolean }
  >;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateChips?: string[];
  emptyStatePreviewItems?: Array<{ label: string; iconUrl?: string }>;
  cardScale?: number;
  previewLayout?: MediaPreviewLayout;
  showMetadata?: boolean;
  hideAddToCollectionAction?: boolean;
  hideDeleteAction?: boolean;
  selectionActions?: Array<{
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    variant?: "default" | "outline" | "danger";
  }>;
  useItemOnCardClick?: boolean;
  onCardClick?: (index: number, params: Record<string, any>) => void;
  gridDensity?: MediaGridDensity;
}

type CollectionItem = {
  id: string;
  name: string;
  assetCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type QueueTask = {
  id: string;
  run: () => void;
  priority?: "high" | "low";
  top?: number;
  left?: number;
};

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

// 计算宽高比对应的宽度（基于固定高度）

// 生成随机文件名
function generateRandomFilename(extension: string = "png"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `image_${timestamp}_${random}.${extension}`;
}

function getDownloadFilenameFromUrl(
  url: string,
  fallbackExtension: string = "png",
): string {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop();

    if (lastSegment && lastSegment.includes(".")) {
      return decodeURIComponent(lastSegment);
    }
  } catch {
    const normalizedUrl = url.split("?")[0]?.split("#")[0] ?? "";
    const lastSegment = normalizedUrl.split("/").filter(Boolean).pop();

    if (lastSegment && lastSegment.includes(".")) {
      return decodeURIComponent(lastSegment);
    }
  }

  return generateRandomFilename(fallbackExtension);
}

function toCssAspectRatio(aspectRatio?: string) {
  if (!aspectRatio) return "1 / 1";
  if (aspectRatio.includes(":")) {
    return aspectRatio.replace(":", " / ");
  }
  if (aspectRatio.includes("/")) {
    return aspectRatio;
  }
  if (aspectRatio.includes("*")) {
    const [width, height] = aspectRatio.split("*").map(Number);
    if (width > 0 && height > 0) {
      return `${width} / ${height}`;
    }
  }
  return "1 / 1";
}

function isPortraitRatio(aspectRatio?: string) {
  if (!aspectRatio) return false;
  const normalized = aspectRatio.replace("/", ":");
  const [w, h] = normalized.split(":").map(Number);
  if (!w || !h) return false;
  return h > w;
}

function toCompactResolutionLabel(value: string) {
  const normalized = String(value).trim();
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  if (["0.5k", "1k", "2k", "4k", "8k", "720p", "1080p"].includes(lower)) {
    return lower.toUpperCase();
  }

  const match = lower.match(/(\d{3,5})\s*[x*]\s*(\d{3,5})/);
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  const maxEdge = Math.max(width, height);

  if (maxEdge >= 7680) return "8K";
  if (maxEdge >= 3840) return "4K";
  if (maxEdge >= 2048) return "2K";
  if (maxEdge >= 1024) return "1K";
  if (maxEdge >= 720) return `${maxEdge}P`;

  return `${width}×${height}`;
}

function getPrimarySpecLabel(item: GeneratedMediaItem) {
  const directCandidates = [
    item.params?.resolution,
    item.params?.image_size,
    item.params?.output_resolution,
    item.params?.dimensions,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate !== "string") continue;
    const compact = toCompactResolutionLabel(candidate);
    if (compact) return compact;

    const trimmed = candidate.trim();
    if (trimmed) return trimmed.slice(0, 10);
  }

  const width = Number(item.params?.width || item.params?.outputWidth || 0);
  const height = Number(item.params?.height || item.params?.outputHeight || 0);
  if (width > 0 && height > 0) {
    return (
      toCompactResolutionLabel(`${width}x${height}`) || `${width}×${height}`
    );
  }

  return null;
}

function getActualModelSource(item: GeneratedMediaItem) {
  const candidates = [
    item.params?.__modelUrl,
    item.params?.modelUrl,
    item.modelUrl,
    item.params?.model,
    item.params?.modelId,
    item.params?.provider,
    item.params?.providerName,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (trimmed) return trimmed;
  }

  return "";
}

function sanitizeEffectDisplayText(value?: string | null) {
  if (typeof value !== "string") return "";

  const sanitized = value
    .replace(/\/tools\/image-effects?/gi, "")
    .replace(/\/tools\/video-effects?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  return sanitized;
}

function humanizeModelSource(modelSource: string) {
  const trimmed = modelSource.trim();
  if (!trimmed) return "";

  const slug = trimmed
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[?#].*$/, "");

  return (slug || trimmed).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function getModelBadge(item: GeneratedMediaItem) {
  const modelSource = humanizeModelSource(getActualModelSource(item));
  if (!modelSource) return "";

  const parts = modelSource.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const shorthand = parts
    .slice(0, 3)
    .map((part) => {
      const normalized = part.replace(/[^a-z0-9]/gi, "");
      if (!normalized) return "";
      if (/^\d+$/.test(normalized)) return normalized.charAt(0);
      return normalized.charAt(0).toUpperCase();
    })
    .join("");

  return shorthand.slice(0, 3);
}

function getDisplayParam(item: GeneratedMediaItem) {
  return getPrimarySpecLabel(item);
}

function isVideoItem(item: GeneratedMediaItem, mediaType: "image" | "video") {
  return item.mediaKind ? item.mediaKind === "video" : mediaType === "video";
}

function isAudioItem(item: GeneratedMediaItem) {
  return item.mediaKind === "audio";
}

function getGeneratedMediaRenderKey(item: GeneratedMediaItem) {
  const creationRecordId = item.params?.creationRecordId;
  if (typeof creationRecordId === "string" && creationRecordId.trim()) {
    return `creation:${creationRecordId}`;
  }

  const sourceGeneratedIndex = item.params?.__sourceGeneratedIndex;
  if (typeof sourceGeneratedIndex === "number") {
    return `session:${sourceGeneratedIndex}`;
  }

  const timestamp =
    item.createdAt ||
    item.params?.createdAt ||
    item.params?.generatedAt ||
    item.params?.timestamp ||
    "";

  return `url:${item.url}:${item.mediaKind || "image"}:${timestamp}`;
}

const MIXED_GRID_VARIANTS = [
  { aspectRatio: "1 / 1", basis: 0.92, width: 0.88 },
  { aspectRatio: "4 / 5", basis: 0.88, width: 0.82 },
  { aspectRatio: "16 / 10", basis: 1.12, width: 1.12 },
] as const;

// 下载图片
async function downloadImage(url: string, filename: string) {
  try {
    // 优先用 blob + ObjectURL 下载，避免浏览器对跨域资源忽略 download 属性时“新开 Tab”
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
  } catch (error) {
    // 降级：如果 fetch 被 CORS 限制，则回退到普通 a 标签（不使用 _blank，避免新开 Tab）
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error("Download failed:", error, fallbackError);
    }
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

function GeneratedMediaAsset({
  item,
  prompt,
  autoplayVideos,
  itemIsVideo,
  itemIsAudio,
  mediaClassName,
  tone = "dark",
}: {
  item: GeneratedMediaItem;
  prompt: string;
  autoplayVideos: boolean;
  itemIsVideo: boolean;
  itemIsAudio: boolean;
  mediaClassName?: string;
  tone?: "dark" | "light";
}) {
  const [isLoaded, setIsLoaded] = useState(itemIsAudio);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [canStartMediaLoad, setCanStartMediaLoad] = useState(itemIsAudio);
  const { ref, isVisible } = useDeferredVisibility();
  const mediaLoadSlotAcquiredRef = useRef(false);
  const mediaLoadTimeoutRef = useRef<number | null>(null);
  const loadPriority = isVisible ? "high" : "low";

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
    setHasLoadError(false);
  }, [item.url, item.previewUrl, itemIsVideo, itemIsAudio]);

  useEffect(() => {
    if (itemIsAudio) return;
    if (!isVisible || canStartMediaLoad || isLoaded) return;

    const taskId = `generated-media-load-${item.url}-${Math.random()
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
    item.url,
    loadPriority,
    ref,
    itemIsAudio,
  ]);

  useEffect(() => {
    return () => {
      releaseMediaLoadSlot();
    };
  }, []);

  return (
    <div ref={ref} className="relative h-full w-full">
      {!isLoaded && !itemIsAudio ? (
        <div
          className={cn(
            "absolute inset-0 z-0 animate-pulse",
            tone === "light"
              ? "bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F8FF_48%,#EAF3FF_100%)]"
              : "bg-gradient-to-br from-white/[0.05] to-white/[0.02]",
          )}
        />
      ) : null}

      {itemIsAudio ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%),linear-gradient(180deg,#181b1f_0%,#101216_100%)] text-white/80">
          <div className="flex size-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.05]">
            <Music4 className="size-6" />
          </div>
          <div className="max-w-[80%] truncate text-sm font-medium">
            {item.params?.filename || prompt}
          </div>
        </div>
      ) : itemIsVideo && canStartMediaLoad && !hasLoadError ? (
        <video
          src={isVisible ? item.previewUrl || item.url : undefined}
          className={cn(
            "block h-full w-full transition-transform duration-500 group-hover/media:scale-[1.02]",
            mediaClassName,
            !isLoaded && "opacity-0",
          )}
          controls={!autoplayVideos}
          autoPlay={autoplayVideos}
          muted={autoplayVideos}
          loop={autoplayVideos}
          playsInline
          preload={autoplayVideos ? "auto" : "metadata"}
          onLoadedData={() => {
            setIsLoaded(true);
            releaseMediaLoadSlot();
          }}
          onCanPlay={() => {
            setIsLoaded(true);
            releaseMediaLoadSlot();
          }}
          onError={() => {
            setHasLoadError(true);
            setIsLoaded(true);
            releaseMediaLoadSlot();
          }}
        />
      ) : !itemIsVideo && canStartMediaLoad && !hasLoadError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getMediaWsrvThumbnail(item.url, "image", {
            width: 600,
          })}
          alt=""
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
            setHasLoadError(true);
            setIsLoaded(true);
            releaseMediaLoadSlot();
          }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 z-0",
            tone === "light"
              ? "bg-[linear-gradient(135deg,#FFFFFF_0%,#F5F9FF_100%)]"
              : "bg-[#0b0c0f]",
          )}
        />
      )}

      {itemIsVideo && !isLoaded ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
            tone === "light" ? "bg-[#EAF3FF]/35" : "bg-black/16",
          )}
        >
          <div
            className={cn(
              "rounded-full p-3 backdrop-blur-sm",
              tone === "light"
                ? "bg-white/88 text-[#42556F] shadow-[0_10px_24px_rgba(109,145,187,0.16)]"
                : "bg-black/52 text-white",
            )}
          >
            <Play
              className={cn(
                "ml-0.5 h-5 w-5",
                tone === "light"
                  ? "fill-[#42556F] text-[#42556F]"
                  : "fill-white text-white",
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PendingGeneratedMediaSkeleton({
  isCompactGrid,
  landscapeMaxWidthRem,
  scaledCardMinHeight,
  tone = "dark",
}: {
  isCompactGrid: boolean;
  landscapeMaxWidthRem: number;
  scaledCardMinHeight: number;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className="relative generated-media-item-skeleton"
      style={{
        width: isCompactGrid
          ? `min(calc(33.333% - 0.75rem), min(100%, clamp(12rem, 46vw, ${landscapeMaxWidthRem}rem)))`
          : `min(calc(50% - 0.5rem), min(100%, clamp(15rem, 78vw, ${landscapeMaxWidthRem}rem)))`,
        minHeight: `clamp(${isCompactGrid ? "10.5rem" : "13rem"}, 58vw, ${scaledCardMinHeight}px)`,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[1.75rem] animate-pulse",
          tone === "light"
            ? "border border-[#D9E7F6] bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_42px_rgba(109,145,187,0.16)]"
            : "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(14,16,20,0.98)_28%,rgba(5,5,7,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_42px_rgba(0,0,0,0.24)]",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            tone === "light"
              ? "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.9),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(191,221,255,0.45),transparent_28%),radial-gradient(circle_at_52%_68%,rgba(227,239,255,0.7),transparent_42%)]"
              : "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_24%,rgba(152,216,255,0.08),transparent_28%),radial-gradient(circle_at_50%_62%,rgba(255,255,255,0.03),transparent_42%)]",
          )}
        />
        <div className="pending-generation-shimmer pointer-events-none absolute inset-y-0 -left-[45%] w-[42%]" />
        <div
          className={cn(
            "pointer-events-none absolute inset-[1.1rem] rounded-[1.3rem]",
            tone === "light"
              ? "border border-[#E6EEF8]"
              : "border border-white/6",
          )}
        />

        <div className="absolute inset-x-5 bottom-5">
          <div
            className={cn(
              "h-[3px] overflow-hidden rounded-full",
              tone === "light" ? "bg-[#DBE8F5]" : "bg-white/[0.08]",
            )}
          >
            <div
              className={cn(
                "pending-generation-progress h-full w-[38%] rounded-full",
                tone === "light"
                  ? "bg-[linear-gradient(90deg,#8BC6FF_0%,#FFFFFF_50%,#B9D9FF_100%)]"
                  : "bg-[linear-gradient(90deg,rgba(140,214,255,0.2)_0%,rgba(255,255,255,1)_50%,rgba(140,214,255,0.24)_100%)]",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generated Media Panel - 网格排列，竖直滚动
 */
export function GeneratedMediaPanel({
  items,
  isGenerating = false,
  pendingItemCount,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  emptyText,
  mediaType = "image",
  className,
  embedded = false,
  embeddedTone = "dark",
  hideHeader = false,
  selectedIndices = [],
  onToggleSelectItem,
  onUseItem,
  onUpscaleItem,
  onClearSelection,
  onDeleteItem,
  onDeleteItems,
  autoplayVideos = true,
  sceneMetaById,
  modelMetaByUrl,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateChips,
  emptyStatePreviewItems,
  cardScale = 50,
  previewLayout = "original",
  showMetadata = true,
  hideAddToCollectionAction = false,
  hideDeleteAction = false,
  selectionActions = [],
  useItemOnCardClick = false,
  onCardClick,
  gridDensity = "default",
}: GeneratedMediaPanelProps) {
  const t = useTranslations(
    "landing.wavespeed.desktopPlayground.generatedPanel",
  );
  const itemCount = items.length;
  const effectivePendingItemCount =
    typeof pendingItemCount === "number"
      ? Math.max(0, pendingItemCount)
      : isGenerating
        ? 1
        : 0;
  const isVideo = mediaType === "video";
  const mediaLabel = isVideo ? t("videos") : t("images");
  const mediaItemLabel = isVideo ? t("video") : t("image");
  const title = isVideo ? t("titleVideos") : t("titleImages");
  const tp = (key: string) => t(`preview.${key}` as any);
  const ts = (key: string, values?: Record<string, any>) =>
    t(`selection.${key}` as any, values);
  const ta = (key: string) => t(`actions.${key}` as any);
  const selectedIndexSet = new Set(selectedIndices);
  const selectedItems = selectedIndices
    .map((index) => items[index])
    .filter((item): item is GeneratedMediaItem => Boolean(item));
  const selectedCount = selectedItems.length;
  const isLightEmbedded = embedded && embeddedTone === "light";
  const selectedCreationIds = Array.from(
    new Set(
      selectedItems
        .map((item) => item.params?.creationRecordId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const isCompactGrid = gridDensity === "compact";
  const cardMinHeight = isVideo ? 280 : 300;
  const normalizedCardScale = Math.min(Math.max(cardScale, 0), 100) / 100;
  const cardBasisRem = isCompactGrid
    ? 12.5 + normalizedCardScale * 4.5
    : 15 + normalizedCardScale * 6;
  const portraitMaxWidthRem = isCompactGrid
    ? 14.5 + normalizedCardScale * 6
    : 18 + normalizedCardScale * 8;
  const landscapeMaxWidthRem = isCompactGrid
    ? 17.5 + normalizedCardScale * 7.5
    : 24 + normalizedCardScale * 12;
  const scaledCardMinHeight = isVideo
    ? isCompactGrid
      ? 180 + normalizedCardScale * 90
      : 220 + normalizedCardScale * 120
    : isCompactGrid
      ? 210 + normalizedCardScale * 55
      : 260 + normalizedCardScale * 80;
  const cropCardAspectRatio = isVideo ? "4 / 5" : "1 / 1";
  const canDeleteItems =
    !hideDeleteAction && Boolean(onDeleteItem || onDeleteItems);

  // 管理每个图片的菜单显示状态
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  // 管理删除确认弹窗
  const [deleteConfirmIndices, setDeleteConfirmIndices] = useState<
    number[] | null
  >(null);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionActionPending, setCollectionActionPending] = useState<
    string | null
  >(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  // 管理媒体预览弹窗（图片 / 视频）
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewPrompt =
    previewIndex !== null &&
    items[previewIndex] &&
    !isAudioItem(items[previewIndex])
      ? sanitizeEffectDisplayText(
          (items[previewIndex].prompt ||
            items[previewIndex].params?.prompt ||
            `${mediaItemLabel} ${previewIndex + 1}`) as string,
        ) || `${mediaItemLabel} ${previewIndex + 1}`
      : "";
  const tm = useTranslations("landing.wavespeed.desktopPlayground.mediaPanel");
  const trimmedCollectionName = newCollectionName.trim().replace(/\s+/g, " ");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    const scrollRoot = scrollContainerRef.current;
    if (!node || !hasMore || !onLoadMore || isGenerating || isLoadingMore) {
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
  }, [hasMore, isGenerating, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (
      !scrollRoot ||
      !hasMore ||
      !onLoadMore ||
      isGenerating ||
      isLoadingMore
    ) {
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
  }, [hasMore, isGenerating, isLoadingMore, onLoadMore]);

  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const response = await fetch("/api/workbench/collections?basic=1");
      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || tm("collectionPicker.loadError"));
      }

      setCollections(result.data?.items || []);
    } catch (error: any) {
      toast.error(error?.message || tm("collections.createError"));
    } finally {
      setCollectionsLoading(false);
    }
  };

  const addSelectedItemsToCollection = async (collectionId: string) => {
    if (!collectionId || selectedCreationIds.length === 0) return;

    setCollectionActionPending(collectionId);
    try {
      const response = await fetch(
        `/api/workbench/collections/${collectionId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creationIds: selectedCreationIds,
          }),
        },
      );
      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || tm("collectionPicker.addError"));
      }

      setCollections((prev) =>
        prev.map((item) =>
          item.id === collectionId
            ? {
                ...item,
                assetCount: result.data?.assetCount ?? item.assetCount,
              }
            : item,
        ),
      );
      toast.success(tm("collectionPicker.addSuccess"));
      setCollectionPickerOpen(false);
    } catch (error: any) {
      toast.error(error?.message || tm("collectionPicker.addError"));
    } finally {
      setCollectionActionPending(null);
    }
  };

  useEffect(() => {
    if (!collectionPickerOpen) return;
    void loadCollections();
  }, [collectionPickerOpen]);

  if (itemCount === 0 && effectivePendingItemCount === 0) {
    return (
      <div
        className={cn("flex h-full min-h-0 flex-1 min-w-0 flex-col", className)}
      >
        <GeneratedMediaEmptyState
          mediaType={mediaType}
          showWorkbenchChrome={false}
          rounded={false}
          title={
            emptyStateTitle ||
            (mediaType === "video"
              ? t("defaults.videoTitle")
              : t("defaults.imageTitle"))
          }
          description={
            emptyStateDescription ||
            (mediaType === "video"
              ? t("defaults.videoDescription")
              : t("defaults.imageDescription"))
          }
          chips={emptyStateChips}
          previewItems={emptyStatePreviewItems}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full min-h-0 flex-1 min-w-0 flex-col", className)}
    >
      <div
        className={cn(
          "group relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          embedded
            ? "bg-transparent shadow-none"
            : cn(
                "min-h-[18rem] rounded-[2rem] max-md:rounded-none max-md:border-0 max-md:shadow-none md:h-[calc(100vh-12rem)]",
                WORKBENCH_PANEL_SURFACE_CLASS,
                WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
              ),
        )}
      >
        {!embedded && !hideHeader ? (
          <div className="px-2 pb-3 pt-4 md:px-6 md:pb-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold tracking-[0.02em] text-white md:text-lg">
                  {title}
                </div>
                {itemCount > 0 && (
                  <p className="mt-1 text-xs text-white/55">
                    {itemCount}{" "}
                    {itemCount === 1
                      ? mediaItemLabel
                      : mediaLabel.toLowerCase()}
                  </p>
                )}
              </div>
              {itemCount > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/14"
                  onClick={async () => {
                    if (items.length === 0) return;
                    try {
                      const JSZipModule = await import("jszip").catch(
                        () => null,
                      );
                      if (!JSZipModule) {
                        console.error(
                          "JSZip module not found. Please install 'jszip' package.",
                        );
                        return;
                      }
                      const JSZip = JSZipModule.default;

                      const zip = new JSZip();

                      const blobs = await Promise.all(
                        items.map(async (item, index) => {
                          const response = await fetch(item.url);
                          if (!response.ok) {
                            throw new Error(
                              `Failed to fetch item ${index + 1}`,
                            );
                          }
                          const blob = await response.blob();
                          const ext = isVideoItem(item, mediaType)
                            ? "mp4"
                            : "png";
                          const filename = generateRandomFilename(ext);
                          return { blob, filename };
                        }),
                      );

                      blobs.forEach(({ blob, filename }) => {
                        zip.file(filename, blob);
                      });

                      const zipBlob = await zip.generateAsync({ type: "blob" });
                      const zipUrl = window.URL.createObjectURL(zipBlob);
                      const link = document.createElement("a");
                      link.href = zipUrl;
                      link.download = `media-${Date.now()}.zip`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(zipUrl);
                    } catch (error) {
                      console.error("Batch zip download failed:", error);
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>{tp("downloadAll")}</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Content - 统一使用网格排列，避免桌面端横向滚动 */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "relative flex-1 overflow-y-auto overscroll-y-contain touch-pan-y [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch]",
            embedded
              ? "px-4 py-4 md:px-6 md:py-5"
              : "px-1.5 py-4 md:px-4 md:py-5",
            selectedCount > 0 && "pb-24 md:pb-28",
          )}
        >
          {
            <div
              className={cn(
                "flex flex-wrap items-start",
                isCompactGrid ? "gap-3" : "gap-4",
              )}
            >
              {/* 生成中的骨架屏 - 显示在最前 */}
              {Array.from({ length: effectivePendingItemCount }).map(
                (_, index) => (
                  <PendingGeneratedMediaSkeleton
                    key={`pending-skeleton-${index}`}
                    isCompactGrid={isCompactGrid}
                    landscapeMaxWidthRem={landscapeMaxWidthRem}
                    scaledCardMinHeight={scaledCardMinHeight}
                    tone={isLightEmbedded ? "light" : "dark"}
                  />
                ),
              )}

              {/* 已生成的图片 - 使用响应式网格排列 */}
              {items.map((item, index) => {
                const itemIsVideo = isVideoItem(item, mediaType);
                const itemIsAudio = isAudioItem(item);
                const isSelected = selectedIndexSet.has(index);
                const prompt =
                  sanitizeEffectDisplayText(
                    item.prompt ||
                      item.params?.prompt ||
                      `${mediaItemLabel} ${index + 1}`,
                  ) || `${mediaItemLabel} ${index + 1}`;
                const isMenuOpen = openMenuIndex === index;
                const mixedVariant =
                  MIXED_GRID_VARIANTS[index % MIXED_GRID_VARIANTS.length];
                const cardAspectRatio =
                  previewLayout === "crop"
                    ? cropCardAspectRatio
                    : previewLayout === "mixed"
                      ? mixedVariant.aspectRatio
                      : toCssAspectRatio(item.aspectRatio);
                const isPortrait = isPortraitRatio(item.aspectRatio);
                const mediaClassName =
                  previewLayout === "original"
                    ? "object-contain"
                    : "object-cover";
                const cardBasis =
                  previewLayout === "mixed"
                    ? cardBasisRem * mixedVariant.basis
                    : cardBasisRem;
                const cardMaxWidth =
                  previewLayout === "mixed"
                    ? (isPortrait
                        ? portraitMaxWidthRem
                        : landscapeMaxWidthRem) * mixedVariant.width
                    : isPortrait
                      ? portraitMaxWidthRem
                      : landscapeMaxWidthRem;
                const compactCardBasisRem = Math.max(11.5, cardBasis - 3.5);
                const compactCardMaxWidthRem = Math.max(
                  isPortrait ? 14 : 16,
                  cardMaxWidth - (isPortrait ? 5 : 6),
                );
                const compactFlexBasis = isCompactGrid
                  ? `min(calc(33.333% - 0.75rem), clamp(${Math.max(10.5, compactCardBasisRem - 1.5)}rem, 46vw, ${Math.max(14, cardBasis)}rem))`
                  : `min(calc(50% - 0.5rem), clamp(${compactCardBasisRem}rem, 78vw, ${cardBasis}rem))`;
                const compactMaxWidth = isCompactGrid
                  ? `min(calc(33.333% - 0.75rem), min(100%, clamp(${Math.max(isPortrait ? 12 : 13.5, compactCardMaxWidthRem - 1.5)}rem, 46vw, ${Math.max(isPortrait ? 15 : 17, cardMaxWidth)}rem)))`
                  : `min(calc(50% - 0.5rem), min(100%, clamp(${compactCardMaxWidthRem}rem, 78vw, ${cardMaxWidth}rem)))`;
                const cardMinHeight =
                  itemIsAudio ||
                  previewLayout === "crop" ||
                  previewLayout === "original"
                    ? `${scaledCardMinHeight}px`
                    : undefined;
                const sceneMeta = item.sceneId
                  ? sceneMetaById?.[item.sceneId]
                  : undefined;
                const modelMeta = item.modelUrl
                  ? modelMetaByUrl?.[item.modelUrl]
                  : undefined;
                const actualModelSource = getActualModelSource(item);
                const modelVendorLogo = getModelVendorLogo({
                  url: actualModelSource,
                });
                const badgeIconUrl =
                  modelMeta?.iconUrl ||
                  modelVendorLogo.url ||
                  sceneMeta?.iconUrl;
                const badgeNeedsWhiteBg = Boolean(
                  (modelMeta?.iconUrl && modelMeta?.needsWhiteBg) ||
                  (!modelMeta?.iconUrl &&
                    modelVendorLogo.url &&
                    modelVendorLogo.needsWhiteBg),
                );
                const badgeLabel =
                  modelMeta?.label ||
                  humanizeModelSource(actualModelSource) ||
                  sceneMeta?.label ||
                  item.sceneId ||
                  "";
                const displayParam = getDisplayParam(item);
                const modelBadge = getModelBadge(item);
                const primaryActionLabel = !itemIsVideo
                  ? ta("imageToVideo")
                  : ta("regenerate");

                return (
                  <div
                    key={getGeneratedMediaRenderKey(item)}
                    className="relative min-w-0"
                    style={{
                      flexBasis: compactFlexBasis,
                      maxWidth: compactMaxWidth,
                      flexGrow: 1,
                      minHeight: cardMinHeight
                        ? `clamp(${isCompactGrid ? "10.5rem" : "13rem"}, 58vw, ${cardMinHeight})`
                        : undefined,
                      aspectRatio: itemIsAudio ? undefined : cardAspectRatio,
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden rounded-[0.75rem] bg-transparent transition-all duration-200"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <div
                        className={cn(
                          "group/media relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.75rem]",
                          isLightEmbedded
                            ? "border border-[#DCE7F4] bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F9FF_100%)] shadow-[0_16px_36px_rgba(109,145,187,0.14)]"
                            : "bg-[#0b0c0f]",
                          !itemIsAudio &&
                            (onCardClick || (useItemOnCardClick && onUseItem)
                              ? "cursor-copy"
                              : "cursor-zoom-in"),
                        )}
                        onClick={() => {
                          if (itemIsAudio) return;
                          if (onCardClick) {
                            onCardClick(index, item.params);
                            setOpenMenuIndex(null);
                            return;
                          }
                          if (useItemOnCardClick && onUseItem) {
                            onUseItem(index, item.params);
                            setOpenMenuIndex(null);
                            return;
                          }
                          setPreviewIndex(index);
                        }}
                        role={!itemIsAudio ? "button" : undefined}
                        tabIndex={!itemIsAudio ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (itemIsAudio) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (onCardClick) {
                              onCardClick(index, item.params);
                              setOpenMenuIndex(null);
                              return;
                            }
                            if (useItemOnCardClick && onUseItem) {
                              onUseItem(index, item.params);
                              setOpenMenuIndex(null);
                              return;
                            }
                            setPreviewIndex(index);
                          }
                        }}
                        aria-label={
                          !itemIsAudio
                            ? onCardClick || (useItemOnCardClick && onUseItem)
                              ? primaryActionLabel
                              : tp("openPreview")
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            "pointer-events-none absolute inset-0 z-10 transition-colors duration-200",
                            isLightEmbedded
                              ? "hidden"
                              : "bg-black/0 group-hover/media:bg-black/10 group-focus-within/media:bg-black/10",
                          )}
                        />
                        <div
                          className={cn(
                            "pointer-events-none absolute inset-x-0 top-0 z-10 h-24 opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 group-focus-within/media:opacity-100",
                            isLightEmbedded
                              ? "hidden"
                              : "bg-gradient-to-b from-black/26 via-black/8 to-transparent",
                          )}
                        />
                        <div
                          className={cn(
                            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 transition-opacity duration-200 group-hover/media:opacity-100 group-focus-within/media:opacity-100",
                            isLightEmbedded
                              ? "hidden"
                              : "bg-gradient-to-t from-black/58 via-black/20 to-transparent opacity-70",
                          )}
                        />

                        <GeneratedMediaAsset
                          item={item}
                          prompt={prompt}
                          autoplayVideos={autoplayVideos}
                          itemIsVideo={itemIsVideo}
                          itemIsAudio={itemIsAudio}
                          mediaClassName={mediaClassName}
                          tone={isLightEmbedded ? "light" : "dark"}
                        />
                        <div
                          className={cn(
                            "absolute inset-x-3 top-3 z-20 flex items-start justify-between transition-all duration-200 md:inset-x-4 md:top-4",
                            isMenuOpen
                              ? "opacity-100"
                              : "opacity-100 md:pointer-events-none md:opacity-0 md:group-hover/media:pointer-events-auto md:group-hover/media:opacity-100 md:group-focus-within/media:pointer-events-auto md:group-focus-within/media:opacity-100",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              aria-label={
                                isSelected
                                  ? ts("selectedItem")
                                  : ts("selectItem")
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) {
                                  onToggleSelectItem?.(index, item.params);
                                } else {
                                  onToggleSelectItem?.(index, item.params);
                                }
                              }}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-[0.7rem] border backdrop-blur-md transition-colors cursor-pointer md:h-6.5 md:w-6.5 md:rounded-[0.6rem]",
                                isSelected
                                  ? "border-[#69a6ff] bg-[#69a6ff] text-white shadow-[0_6px_18px_rgba(105,166,255,0.28)] hover:bg-[#7bb0ff]"
                                  : isLightEmbedded
                                    ? "border-[#C9D8E8] bg-white/92 text-[#4A5D75] hover:bg-white"
                                    : "border-white/45 bg-black/20 text-white/90 hover:bg-black/28",
                              )}
                            >
                              {isSelected ? (
                                <Check className="h-4 w-4 text-white md:h-3.5 md:w-3.5" />
                              ) : null}
                            </button>
                          </div>

                          <div
                            className={cn(
                              "rounded-[1rem] p-1.5 backdrop-blur-[3px] max-md:hidden md:rounded-[0.9rem] md:p-1 md:backdrop-blur-[2px]",
                              isLightEmbedded
                                ? "bg-white/88 shadow-[0_8px_20px_rgba(130,162,198,0.18)]"
                                : "bg-black/18 md:bg-black/12",
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(
                                    item.url,
                                    generateRandomFilename(
                                      itemIsAudio
                                        ? "mp3"
                                        : itemIsVideo
                                          ? "mp4"
                                          : "png",
                                    ),
                                  );
                                  setOpenMenuIndex(null);
                                }}
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-[0.8rem] border backdrop-blur-md transition cursor-pointer md:h-6.5 md:w-6.5 md:rounded-[0.7rem]",
                                  isLightEmbedded
                                    ? "border-[#D5E1EE] bg-white text-[#42556F] hover:bg-[#F5F9FF]"
                                    : "border-white/10 bg-[rgba(28,20,14,0.56)] text-white hover:bg-[rgba(28,20,14,0.68)] md:border-white/8",
                                )}
                              >
                                <Download className="h-3.5 w-3.5 md:h-3 md:w-3" />
                              </button>
                              {canDeleteItems ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmIndices([index]);
                                    setOpenMenuIndex(null);
                                  }}
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-[0.8rem] border backdrop-blur-md transition cursor-pointer md:h-6.5 md:w-6.5 md:rounded-[0.7rem]",
                                    isLightEmbedded
                                      ? "border-[#D5E1EE] bg-white/86 text-[#8B4D5C] hover:bg-[#FFF5F7]"
                                      : "border-white/10 bg-transparent text-white hover:bg-white/10 md:border-white/8",
                                  )}
                                  aria-label={t("deleteConfirm.confirm")}
                                >
                                  <Trash2 className="h-3.5 w-3.5 md:h-3 md:w-3" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-2 transition-all duration-200 md:bottom-4 md:left-4 md:gap-4",
                            isMenuOpen
                              ? "opacity-100"
                              : "opacity-100 md:pointer-events-none md:opacity-0 md:group-hover/media:pointer-events-auto md:group-hover/media:opacity-100 md:group-focus-within/media:pointer-events-auto md:group-focus-within/media:opacity-100",
                          )}
                        >
                          {showMetadata ? (
                            <div
                              className={cn(
                                "hidden min-w-0 items-center overflow-hidden rounded-full pr-2 backdrop-blur-md md:flex",
                                isLightEmbedded
                                  ? "border border-[#D7E4F1] bg-white/92 text-[#42556F] shadow-[0_10px_24px_rgba(130,162,198,0.16)]"
                                  : "border border-white/10 bg-black/62 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
                              )}
                            >
                              <div className="flex h-7 min-w-7 items-center justify-center px-2 md:h-8 md:min-w-8">
                                {itemIsAudio ? (
                                  <Music4 className="h-2.5 w-2.5" />
                                ) : itemIsVideo ? (
                                  <Video className="h-2.5 w-2.5" />
                                ) : (
                                  <ImageIcon className="h-2.5 w-2.5" />
                                )}
                              </div>
                              <div
                                className={cn(
                                  "h-4 w-px",
                                  isLightEmbedded
                                    ? "bg-[#D7E4F1]"
                                    : "bg-white/10",
                                )}
                              />
                              {displayParam ? (
                                <>
                                  <div className="flex h-7 items-center justify-center px-2 md:h-8 md:px-2.5">
                                    <span className="text-[0.68rem] font-semibold leading-none tracking-[0.01em] md:text-[0.72rem]">
                                      {displayParam}
                                    </span>
                                  </div>
                                  <div
                                    className={cn(
                                      "h-4 w-px",
                                      isLightEmbedded
                                        ? "bg-[#D7E4F1]"
                                        : "bg-white/10",
                                    )}
                                  />
                                </>
                              ) : null}
                              <div className="group/badge relative flex h-7 min-w-8 items-center justify-center px-2 md:h-8 md:min-w-10 md:px-2.5">
                                <div
                                  className="flex size-4 items-center justify-center text-[0.72rem] font-semibold leading-none text-white md:size-5 md:text-[0.76rem]"
                                  aria-label={badgeLabel || modelBadge}
                                >
                                  {badgeIconUrl ? (
                                    <span className="flex size-4 items-center justify-center rounded-full">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={badgeIconUrl}
                                        alt={badgeLabel || modelBadge}
                                        className={cn(
                                          "h-2.5 w-2.5 object-contain md:h-3 md:w-3",
                                          badgeNeedsWhiteBg &&
                                            "brightness-0 invert",
                                        )}
                                      />
                                    </span>
                                  ) : (
                                    modelBadge || "?"
                                  )}
                                </div>
                                {badgeLabel ? (
                                  <div
                                    className={cn(
                                      "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] opacity-0 transition-opacity duration-150 group-hover/badge:opacity-100",
                                      isLightEmbedded
                                        ? "bg-white text-[#42556F] shadow-[0_8px_18px_rgba(130,162,198,0.2)]"
                                        : "bg-black/80 text-white",
                                    )}
                                  >
                                    {badgeLabel}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div />
                          )}
                          <div className="hidden shrink-0 overflow-hidden rounded-[0.95rem] border border-black/6 bg-white/95 text-[#111318] shadow-[0_16px_40px_rgba(0,0,0,0.28)] md:flex md:rounded-[0.95rem]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={primaryActionLabel}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUseItem?.(index, item.params);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="flex h-7 w-7 items-center justify-center transition hover:bg-black/6 cursor-pointer md:h-[1.75rem] md:w-[1.75rem]"
                                >
                                  {!itemIsVideo && !itemIsAudio ? (
                                    <Camera className="h-3.25 w-3.25 md:h-3 md:w-3" />
                                  ) : (
                                    <Sparkles className="h-3.25 w-3.25 md:h-3 md:w-3" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={8}>
                                {primaryActionLabel}
                              </TooltipContent>
                            </Tooltip>
                            {!itemIsVideo && !itemIsAudio ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={ta("upscaleImage")}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onUpscaleItem) {
                                        onUpscaleItem(index, item.params);
                                      } else {
                                        setPreviewIndex(index);
                                      }
                                      setOpenMenuIndex(null);
                                    }}
                                    className="hidden h-7 w-7 items-center justify-center border-l border-black/10 transition hover:bg-black/6 cursor-pointer md:flex md:h-[1.75rem] md:w-[1.75rem]"
                                  >
                                    <Maximize2 className="h-3 w-3 md:h-2.75 md:w-2.75" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={8}>
                                  {ta("upscaleImage")}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewIndex(index);
                              }}
                              className="hidden h-8 w-8 items-center justify-center border-l border-black/10 transition hover:bg-black/6 cursor-pointer md:h-[1.75rem] md:w-[1.75rem]"
                            >
                              <Pencil className="h-3 w-3 md:h-2.75 md:w-2.75" />
                            </button>
                          </div>
                        </div>

                        {isMenuOpen && (
                          <div className="absolute right-5 top-20 z-30 min-w-[10rem] overflow-hidden rounded-[1.1rem] border border-white/12 bg-[#16181c]/95 p-2 text-sm text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(
                                  item.url,
                                  generateRandomFilename(
                                    itemIsAudio
                                      ? "mp3"
                                      : itemIsVideo
                                        ? "mp4"
                                        : "png",
                                  ),
                                );
                                setOpenMenuIndex(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/8"
                            >
                              <Download className="h-4 w-4" />
                              <span>{tp("downloadAll")}</span>
                            </button>
                            {canDeleteItems ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmIndices([index]);
                                  setOpenMenuIndex(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-300 transition hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{t("deleteConfirm.confirm")}</span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }

          {(isLoadingMore || hasMore) && (
            <div className="flex justify-center py-6">
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin text-white/45" />
              ) : null}
              {hasMore ? (
                <div ref={sentinelRef} className="h-8 w-full" />
              ) : null}
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 md:bottom-4">
            <div className="pointer-events-auto w-full max-w-[25rem] rounded-[1rem] border border-white/10 bg-[#191b20]/96 p-2 shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white">
                  <button
                    type="button"
                    aria-label={ts("clear")}
                    onClick={onClearSelection}
                    className="flex size-7 items-center justify-center rounded-[0.7rem] bg-white/8 text-white/72 transition hover:bg-white/12 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="text-[11px] font-semibold md:text-xs">
                    {ts("count", { count: selectedCount })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="h-8 rounded-[0.9rem] bg-[#ff2fb3] px-2.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(255,47,179,0.28)] transition hover:bg-[#ff4bc0]"
                        onClick={async () => {
                          if (selectedItems.length === 0) return;

                          if (selectedItems.length === 1) {
                            const singleItem = selectedItems[0];
                            await downloadImage(
                              singleItem.url,
                              generateRandomFilename(
                                isVideoItem(singleItem, mediaType)
                                  ? "mp4"
                                  : "png",
                              ),
                            );
                            return;
                          }

                          try {
                            const JSZipModule = await import("jszip").catch(
                              () => null,
                            );
                            if (!JSZipModule) {
                              console.error(
                                "JSZip module not found. Please install 'jszip' package.",
                              );
                              return;
                            }
                            const JSZip = JSZipModule.default;
                            const zip = new JSZip();

                            const blobs = await Promise.all(
                              selectedItems.map(async (item, index) => {
                                const response = await fetch(item.url);
                                if (!response.ok) {
                                  throw new Error(
                                    `Failed to fetch item ${index + 1}`,
                                  );
                                }
                                const blob = await response.blob();
                                const ext = isVideoItem(item, mediaType)
                                  ? "mp4"
                                  : "png";
                                const filename = generateRandomFilename(ext);
                                return { blob, filename };
                              }),
                            );

                            blobs.forEach(({ blob, filename }) => {
                              zip.file(filename, blob);
                            });

                            const zipBlob = await zip.generateAsync({
                              type: "blob",
                            });
                            const zipUrl = window.URL.createObjectURL(zipBlob);
                            const link = document.createElement("a");
                            link.href = zipUrl;
                            link.download = `media-${Date.now()}.zip`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(zipUrl);
                          } catch (error) {
                            console.error(
                              "Download selected items failed:",
                              error,
                            );
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {ts("download")}
                    </TooltipContent>
                  </Tooltip>
                  {!hideAddToCollectionAction ? (
                    <DropdownMenu
                      open={collectionPickerOpen}
                      onOpenChange={setCollectionPickerOpen}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-[0.9rem] border-white/10 bg-white/6 px-2.5 text-xs font-medium text-white hover:bg-white/10"
                              disabled={selectedCreationIds.length === 0}
                            >
                              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          {tm("collectionPicker.addButton")}
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent
                        align="end"
                        side="top"
                        sideOffset={10}
                        className="z-[1400] w-[18rem] rounded-[1.35rem] border border-[rgba(214,235,253,0.19)] bg-[#17191d]/98 p-2.5 text-white shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,0_18px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl"
                      >
                        <div className="space-y-2">
                          <div className="max-h-[16rem] overflow-y-auto pr-1">
                            {collectionsLoading ? (
                              <div className="flex min-h-28 items-center justify-center text-white/45">
                                <Loader2 className="size-4 animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {collections.map((collection) => (
                                  <button
                                    key={collection.id}
                                    type="button"
                                    onClick={() =>
                                      void addSelectedItemsToCollection(
                                        collection.id,
                                      )
                                    }
                                    disabled={collectionActionPending !== null}
                                    className="flex w-full items-center gap-2.5 rounded-[1.05rem] border border-white/8 bg-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    <div className="flex size-[2.75rem] shrink-0 items-center justify-center rounded-[0.85rem] bg-[#6d2f57]/90 text-[#ff7bd3]">
                                      <FolderOpen className="size-[18px]" />
                                    </div>
                                    <div className="min-w-0 flex-1 font-sans">
                                      <div className="truncate text-[13px] font-semibold leading-[1.3] text-white">
                                        {collection.name}
                                      </div>
                                      {typeof collection.assetCount ===
                                      "number" ? (
                                        <div className="mt-1 text-[11px] font-medium leading-[1.35] text-white/42">
                                          {tm("collections.assetsCount", {
                                            count: collection.assetCount,
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="flex size-8 items-center justify-center rounded-[0.8rem] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] text-white/72">
                                      {collectionActionPending ===
                                      collection.id ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                      ) : (
                                        <span className="block size-4 rounded-[0.45rem] border border-white/60" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCollectionPickerOpen(false);
                              setCreateCollectionOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-2.5 rounded-[1.05rem] border border-white/8 bg-white/[0.06] px-3 py-3 font-sans text-[13px] font-semibold leading-[1.3] text-white transition hover:bg-white/[0.08]"
                          >
                            <Plus className="size-4" />
                            <span>{tm("collectionPicker.newCollection")}</span>
                          </button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  {selectionActions.map((action) => (
                    <Tooltip key={action.key}>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-8 rounded-[0.9rem] border-white/10 bg-white/6 px-2.5 text-xs font-medium text-white hover:bg-white/10",
                            action.variant === "danger" &&
                              "border-red-400/18 bg-red-500/10 text-[#ff9a9a] hover:bg-red-500/16 hover:text-[#ffb5b5]",
                          )}
                          onClick={() => void action.onClick()}
                          disabled={action.disabled}
                        >
                          {action.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        {action.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {canDeleteItems ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={ts("delete")}
                          onClick={() =>
                            setDeleteConfirmIndices(
                              [...selectedIndices].sort((a, b) => a - b),
                            )
                          }
                          className="flex h-8 items-center justify-center rounded-[0.9rem] bg-white/8 px-2.5 text-[#ff9a9a] transition hover:bg-white/12 hover:text-[#ffb5b5] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        {ts("delete")}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={createCollectionOpen}
        onOpenChange={(open) => {
          setCreateCollectionOpen(open);
          if (!open) {
            setNewCollectionName("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/10 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {tm("collections.createTitle")}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {tm("collections.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium text-white/72">
              {tm("collections.nameLabel")}
            </div>
            <Input
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !trimmedCollectionName) return;
                event.preventDefault();
                void (async () => {
                  setCollectionActionPending("create");
                  try {
                    const response = await fetch("/api/workbench/collections", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ name: trimmedCollectionName }),
                    });
                    const result = await response.json();

                    if (result.code !== 0) {
                      throw new Error(
                        result.message || tm("collections.createError"),
                      );
                    }

                    const createdCollection = result.data
                      ?.collection as CollectionItem;
                    setCollections((prev) => [createdCollection, ...prev]);
                    await addSelectedItemsToCollection(createdCollection.id);
                    setCreateCollectionOpen(false);
                    setNewCollectionName("");
                  } catch (error: any) {
                    toast.error(
                      error?.message || tm("collections.createError"),
                    );
                  } finally {
                    setCollectionActionPending(null);
                  }
                })();
              }}
              maxLength={60}
              placeholder={tm("collections.namePlaceholder")}
              className="h-11 rounded-[0.95rem] border-white/12 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/10"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateCollectionOpen(false);
                setNewCollectionName("");
              }}
              className="rounded-[0.95rem] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {tm("collections.cancelAction")}
            </button>
            <button
              type="button"
              disabled={
                !trimmedCollectionName || collectionActionPending !== null
              }
              onClick={() =>
                void (async () => {
                  if (!trimmedCollectionName) return;
                  setCollectionActionPending("create");
                  try {
                    const response = await fetch("/api/workbench/collections", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ name: trimmedCollectionName }),
                    });
                    const result = await response.json();

                    if (result.code !== 0) {
                      throw new Error(
                        result.message || tm("collections.createError"),
                      );
                    }

                    const createdCollection = result.data
                      ?.collection as CollectionItem;
                    setCollections((prev) => [createdCollection, ...prev]);
                    await addSelectedItemsToCollection(createdCollection.id);
                    setCreateCollectionOpen(false);
                    setNewCollectionName("");
                  } catch (error: any) {
                    toast.error(
                      error?.message || tm("collections.createError"),
                    );
                  } finally {
                    setCollectionActionPending(null);
                  }
                })()
              }
              className={cn(
                "inline-flex items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-colors",
                !trimmedCollectionName || collectionActionPending !== null
                  ? "cursor-not-allowed bg-white/12 text-white/32"
                  : "bg-white text-black hover:bg-white/90",
              )}
            >
              {collectionActionPending === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                tm("collections.createAction")
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      {deleteConfirmIndices !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1f] to-[#0f0f12] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {t("deleteConfirm.title")}
            </h3>
            <p className="text-sm text-white/60 mb-6">
              {t("deleteConfirm.description")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmIndices(null)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                {t("deleteConfirm.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmIndices?.length) {
                    if (deleteConfirmIndices.length > 1) {
                      onDeleteItems?.(deleteConfirmIndices);
                    } else {
                      onDeleteItem?.(deleteConfirmIndices[0]);
                    }
                  }
                  setDeleteConfirmIndices(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                {t("deleteConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 媒体预览（图片 / 视频） */}
      {previewIndex !== null &&
        items[previewIndex] &&
        !isAudioItem(items[previewIndex]) &&
        (() => {
          const previewItem = items[previewIndex];
          const previewItemIsVideo = isVideoItem(previewItem, mediaType);
          const previewItemModel =
            humanizeModelSource(getActualModelSource(previewItem)) || undefined;

          const modalItem: MediaItem = {
            id: `creator-preview-${previewIndex}`,
            type: previewItemIsVideo ? "video" : "image",
            src: previewItemIsVideo
              ? previewItem.url
              : getMediaWsrvThumbnail(previewItem.url, "image", {
                  width: 1200,
                }),
            alt: previewPrompt,
            prompt: sanitizeEffectDisplayText(
              previewItem.prompt || previewItem.params?.prompt || undefined,
            ),
            model: previewItemModel,
            quality: previewItem.params?.quality,
            size: previewItem.params?.size,
            parameters: previewItem.params,
          };

          return (
            <MediaDetailModal
              item={modalItem}
              open={previewIndex !== null}
              closeOnOverlayClick
              onDownload={() => {
                downloadImage(
                  items[previewIndex].url,
                  getDownloadFilenameFromUrl(
                    items[previewIndex].url,
                    previewItemIsVideo ? "mp4" : "png",
                  ),
                );
              }}
              onOpenChange={(open) => {
                if (!open) setPreviewIndex(null);
              }}
            />
          );
        })()}
    </div>
  );
}
