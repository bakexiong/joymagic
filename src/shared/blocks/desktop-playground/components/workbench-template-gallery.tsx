"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { MediaCard, type MediaItem } from "@/shared/blocks/explore/media-card";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { withOssImageResize } from "@/shared/lib/cdn";
import { cn } from "@/shared/lib/utils";
import type { WorkbenchTemplateItem } from "@/shared/lib/workbench-template-catalog";

const TEMPLATE_INITIAL_RENDER_COUNT = 20;
const TEMPLATE_RENDER_BATCH_SIZE = 20;
const TEMPLATE_CARD_THUMBNAIL_WIDTH = 480;
const TEMPLATE_CARD_THUMBNAIL_HEIGHT = 640;
const TEMPLATE_REFERENCE_THUMBNAIL_WIDTH = 128;
const TEMPLATE_REFERENCE_THUMBNAIL_HEIGHT = 176;

function parseAspectRatio(aspectRatio?: string): {
  width?: number;
  height?: number;
  ratio?: number;
} {
  if (!aspectRatio) {
    return {};
  }

  const normalized = aspectRatio.replace(":", "/");
  const [rawWidth, rawHeight] = normalized
    .split("/")
    .map((value) => Number(value.trim()));

  if (
    !Number.isFinite(rawWidth) ||
    !Number.isFinite(rawHeight) ||
    rawWidth <= 0 ||
    rawHeight <= 0
  ) {
    return {};
  }

  return {
    width: rawWidth,
    height: rawHeight,
    ratio: rawHeight / rawWidth,
  };
}

function getTemplateImageThumbnail(
  url: string | undefined,
  width: number,
  height?: number,
) {
  if (!url) return url;
  return withOssImageResize(url, width, height ?? width) ?? url;
}

function toCssAspectRatio(aspectRatio?: string) {
  if (!aspectRatio) return "4 / 5";
  return aspectRatio.includes(":")
    ? aspectRatio.replace(":", " / ")
    : aspectRatio;
}

function useDeferredVisibility(root?: HTMLDivElement | null) {
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
        root: root ?? null,
        rootMargin: "240px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, root]);

  return { ref, isVisible };
}

function buildMediaItem(item: WorkbenchTemplateItem): MediaItem {
  const previewUrl =
    item.mediaType === "video"
      ? item.previewClipUrl || item.previewUrl || ""
      : item.previewUrl || item.thumbnailUrl || "";
  const imageThumbnailUrl =
    item.thumbnailUrl || item.previewUrl || item.previewClipUrl;
  const parsedAspectRatio = parseAspectRatio(item.aspectRatio);

  return {
    id: item.id,
    type: item.mediaType,
    src: previewUrl || "",
    thumbnail:
      item.mediaType === "image"
        ? getTemplateImageThumbnail(
            imageThumbnailUrl,
            TEMPLATE_CARD_THUMBNAIL_WIDTH,
            TEMPLATE_CARD_THUMBNAIL_HEIGHT,
          )
        : imageThumbnailUrl,
    thumbnailUrl:
      item.mediaType === "image"
        ? getTemplateImageThumbnail(
            imageThumbnailUrl,
            TEMPLATE_CARD_THUMBNAIL_WIDTH,
            TEMPLATE_CARD_THUMBNAIL_HEIGHT,
          )
        : imageThumbnailUrl,
    alt: "",
    prompt: item.prompt,
    width: parsedAspectRatio.width,
    height: parsedAspectRatio.height,
    aspectRatio: parsedAspectRatio.ratio,
    priority: "low",
  };
}

const TemplateReferenceStrip = memo(function TemplateReferenceStrip({
  item,
}: {
  item: WorkbenchTemplateItem;
}) {
  const previewUrl =
    (item.mediaType === "video" ? item.previewClipUrl : undefined) ||
    item.previewUrl ||
    item.thumbnailUrl;
  const hasReferencePreview =
    item.referencePreviewUrls.length > 0 &&
    item.referencePreviewUrls.some((url) => url !== previewUrl);

  if (!hasReferencePreview) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 w-[24%] min-w-[60px] max-w-[92px] overflow-hidden rounded-[0.95rem] bg-black/24 p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.34)] backdrop-blur-sm">
      <div className="mb-1 inline-flex items-center rounded-full bg-black/35 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/88 backdrop-blur-md">
        Ref
      </div>
      <div
        className={cn(
          "aspect-[4/5] overflow-hidden rounded-[0.8rem]",
          item.referencePreviewUrls.length > 1
            ? "grid grid-cols-2 gap-[2px]"
            : "",
        )}
      >
        {item.referencePreviewUrls.map((url, refIndex) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${item.id}-ref-${refIndex}`}
            src={getTemplateImageThumbnail(
              url,
              TEMPLATE_REFERENCE_THUMBNAIL_WIDTH,
              TEMPLATE_REFERENCE_THUMBNAIL_HEIGHT,
            )}
            alt={`reference ${refIndex + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
    </div>
  );
});

const TemplateGalleryCard = memo(function TemplateGalleryCard({
  item,
  onUseItem,
  scrollRoot,
}: {
  item: WorkbenchTemplateItem;
  onUseItem?: (item: WorkbenchTemplateItem) => void;
  scrollRoot?: HTMLDivElement | null;
}) {
  const t = useTranslations(
    "landing.wavespeed.desktopPlayground.templatesPanel",
  );
  const mediaItem = useMemo(() => buildMediaItem(item), [item]);
  const placeholderAspectRatio = useMemo(
    () => toCssAspectRatio(item.aspectRatio),
    [item.aspectRatio],
  );
  const { ref, isVisible } = useDeferredVisibility(scrollRoot);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [item.id, item.previewUrl, item.previewClipUrl, item.thumbnailUrl]);

  return (
    <article
      ref={ref}
      className="group/template-card mb-3 w-full break-inside-avoid"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)]",
          "transition-all duration-300 hover:border-white/18 hover:bg-white/[0.045]",
        )}
      >
        {!isLoaded ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-[1.1rem] bg-white/5" />
        ) : null}

        {isVisible ? (
          <div
            className={cn(
              "relative transition-opacity duration-300",
              !isLoaded && "opacity-0",
            )}
          >
            <MediaCard
              item={mediaItem}
              onClick={() => onUseItem?.(item)}
              onLoadComplete={() => setIsLoaded(true)}
              onLoadFailed={() => setIsLoaded(true)}
              disableImageOptimization
              limitImageConcurrency
              visibilityRoot={scrollRoot}
              className="h-full w-full rounded-[1.05rem] border-white/0"
            />

            <TemplateReferenceStrip item={item} />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/58 via-black/16 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
              <Button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onUseItem?.(item);
                }}
                className={cn(
                  "rounded-full border border-white/10 bg-white/92 px-4 py-2 text-xs font-semibold text-[#0f1115] shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:bg-white",
                  "md:invisible md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-hover/template-card:pointer-events-auto md:group-hover/template-card:visible md:group-hover/template-card:translate-y-0 md:group-hover/template-card:opacity-100 md:focus-visible:pointer-events-auto md:focus-visible:visible md:focus-visible:translate-y-0 md:focus-visible:opacity-100",
                )}
              >
                {t("use")}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="w-full bg-white/[0.03]"
            style={{ aspectRatio: placeholderAspectRatio }}
          />
        )}
      </div>
    </article>
  );
});

function TemplateGalleryLoadMore({
  scrollRoot,
  disabled,
  onVisible,
}: {
  scrollRoot?: HTMLDivElement | null;
  disabled: boolean;
  onVisible: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || disabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      {
        root: scrollRoot ?? null,
        rootMargin: "360px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onVisible, scrollRoot]);

  return <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />;
}

export function WorkbenchTemplateGallery({
  items,
  className,
  onUseItem,
  scrollRoot,
}: {
  items: WorkbenchTemplateItem[];
  className?: string;
  onUseItem?: (item: WorkbenchTemplateItem) => void;
  scrollRoot?: HTMLDivElement | null;
}) {
  const t = useTranslations(
    "landing.wavespeed.desktopPlayground.templatesPanel",
  );
  const [renderCount, setRenderCount] = useState(TEMPLATE_INITIAL_RENDER_COUNT);

  useEffect(() => {
    setRenderCount(TEMPLATE_INITIAL_RENDER_COUNT);
  }, [items]);

  const visibleItems = useMemo(
    () => items.slice(0, renderCount),
    [items, renderCount],
  );
  const hasMore = visibleItems.length < items.length;

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-full w-full items-center justify-center px-6 text-center text-sm text-white/60",
          className,
        )}
      >
        {t("empty")}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="columns-2 gap-3 p-4 lg:columns-3 2xl:columns-4 [column-fill:_balance] md:p-5">
        {visibleItems.map((item) => (
          <TemplateGalleryCard
            key={item.id}
            item={item}
            onUseItem={onUseItem}
            scrollRoot={scrollRoot}
          />
        ))}
      </div>

      {hasMore ? (
        <>
          <TemplateGalleryLoadMore
            scrollRoot={scrollRoot}
            disabled={!hasMore}
            onVisible={() => {
              setRenderCount((prev) =>
                Math.min(items.length, prev + TEMPLATE_RENDER_BATCH_SIZE),
              );
            }}
          />
          <div className="flex justify-center px-4 pb-6 md:px-5">
            <button
              type="button"
              onClick={() => {
                setRenderCount((prev) =>
                  Math.min(items.length, prev + TEMPLATE_RENDER_BATCH_SIZE),
                );
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
            >
              More · {visibleItems.length}/{items.length}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
