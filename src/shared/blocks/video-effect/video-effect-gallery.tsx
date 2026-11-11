"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Sparkles } from "lucide-react";

import { Link } from "@/core/i18n/navigation";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { landingSidebarInnerCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import type { VideoEffectItem } from "@/shared/lib/video-effect-data";

type VideoEffectGalleryProps = {
  ctaLabel: string;
  items: VideoEffectItem[];
};

type LayoutItem = {
  item: VideoEffectItem;
  top: number;
  left: number;
  width: number;
  height: number;
};

const GALLERY_GAP = 12;
const GALLERY_OVERSCAN = 450;

function parseAspectRatio(aspectRatio: string) {
  const [width, height] = aspectRatio
    .split("/")
    .map((value) => Number(value.trim()));

  if (!width || !height) {
    return { width: 4, height: 5 };
  }

  return { width, height };
}

function getColumnCount(width: number) {
  if (width >= 1536) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

function VideoEffectMedia({ item }: { item: VideoEffectItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [item.samplePreviewClipUrl, item.sampleVideoUrl]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {item.sampleVideoUrl ? (
        <video
          ref={videoRef}
          src={item.samplePreviewClipUrl || item.sampleVideoUrl}
          poster={item.coverUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={item.title}
          onLoadedData={() => {
            const video = videoRef.current;
            if (!video) {
              return;
            }
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }}
        />
      ) : item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
      ) : (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
    </div>
  );
}

function VideoEffectCard({
  item,
  ctaLabel,
}: {
  item: VideoEffectItem;
  ctaLabel: string;
}) {
  if (!item.sampleVideoUrl) {
    return (
      <div className="overflow-hidden rounded-[1.45rem] border border-white/8 bg-white/[0.03] shadow-[0_22px_50px_rgba(0,0,0,0.22)]">
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: item.aspectRatio }}
        >
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.08)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <div className="relative flex min-h-[108px] flex-col justify-end sm:min-h-[120px]">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full bg-white/10" />
                <Skeleton className="h-7 w-2/3 rounded-full bg-white/10" />
                <Skeleton className="h-10 w-40 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/ai-effect/video?effect=${item.slug}`}
      className="group relative block cursor-pointer overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.04] shadow-[0_22px_50px_rgba(0,0,0,0.32)] transition duration-300 hover:border-white/18 hover:bg-white/[0.06]"
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: item.aspectRatio }}
      >
        <VideoEffectMedia item={item} />

        <div className="absolute inset-0 bg-gradient-to-t from-[#06070b]/90 via-[#06070b]/24 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0f1118]/80 to-transparent opacity-85 transition duration-300 group-hover:opacity-100" />

        {item.badge ? (
          <div className="absolute left-3 top-3 rounded-full border border-white/12 bg-[#ff3b72] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#ff3b72]/25 sm:left-4 sm:top-4 sm:px-3 sm:text-[11px]">
            {item.badge}
          </div>
        ) : null}

        {item.likes ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/92 backdrop-blur-md sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
            <Flame className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" />
            <span>{item.likes}</span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="relative flex min-h-[108px] flex-col justify-end sm:min-h-[120px]">
            <h2 className="max-w-[92%] translate-y-0 text-[1.02rem] font-semibold leading-[1.04] tracking-[0.01em] text-white text-balance drop-shadow-[0_4px_12px_rgba(0,0,0,0.32)] transition duration-300 group-hover:mb-11 group-hover:-translate-y-2 group-focus-within:mb-11 group-focus-within:-translate-y-2 max-md:mb-11 max-md:-translate-y-2 sm:text-[1.18rem]">
              {item.title}
            </h2>

            <div className="pointer-events-none absolute bottom-0 left-0 hidden h-9 w-fit max-w-full items-center gap-1.5 rounded-full border border-white/12 bg-[linear-gradient(135deg,rgba(255,73,131,0.96)_0%,rgba(190,67,255,0.94)_100%)] px-3 py-1.5 text-[11px] font-semibold leading-none text-white opacity-0 shadow-[0_14px_28px_rgba(215,57,143,0.24)] translate-y-2 transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-hover:shadow-[0_18px_34px_rgba(215,57,143,0.3)] group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:pointer-events-auto motion-reduce:translate-y-0 motion-reduce:opacity-100 md:inline-flex sm:h-10 sm:px-3.5 sm:text-[12px]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{ctaLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function VideoEffectGallery({
  ctaLabel,
  items,
}: VideoEffectGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateViewport = () => {
      setScrollTop(window.scrollY);
      setViewportHeight(window.innerHeight);
    };

    updateViewport();
    window.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(node.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const columnCount = useMemo(
    () => getColumnCount(containerWidth),
    [containerWidth],
  );

  const layout = useMemo(() => {
    if (!containerWidth || !columnCount) {
      return {
        items: [] as LayoutItem[],
        height: 0,
      };
    }

    const columnWidth =
      (containerWidth - GALLERY_GAP * (columnCount - 1)) / columnCount;
    const columnHeights = Array.from({ length: columnCount }, () => 0);
    const positionedItems: LayoutItem[] = [];

    for (const item of items) {
      const ratio = parseAspectRatio(item.aspectRatio);
      const mediaHeight = columnWidth * (ratio.height / ratio.width);
      const cardHeight = mediaHeight;
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const top = columnHeights[shortestColumn];
      const left = shortestColumn * (columnWidth + GALLERY_GAP);

      positionedItems.push({
        item,
        top,
        left,
        width: columnWidth,
        height: cardHeight,
      });

      columnHeights[shortestColumn] += cardHeight + GALLERY_GAP;
    }

    return {
      items: positionedItems,
      height: Math.max(0, ...columnHeights) - GALLERY_GAP,
    };
  }, [columnCount, containerWidth, items]);

  const visibleItems = useMemo(() => {
    if (!layout.items.length) {
      return [];
    }

    const containerTop =
      (containerRef.current?.getBoundingClientRect().top ?? 0) + scrollTop;
    const visibleTop = Math.max(0, scrollTop - containerTop - GALLERY_OVERSCAN);
    const visibleBottom =
      scrollTop - containerTop + viewportHeight + GALLERY_OVERSCAN;

    return layout.items.filter((entry) => {
      return entry.top < visibleBottom && entry.top + entry.height > visibleTop;
    });
  }, [layout.items, scrollTop, viewportHeight]);

  return (
    <div className="min-h-screen px-0 pb-8 pt-2 sm:pb-10 sm:pt-3 md:pb-12 md:pt-4">
      <div className={landingSidebarInnerCn("w-full max-w-[1680px]")}>
        <div
          ref={containerRef}
          className={cn("relative")}
          style={{ height: layout.height || undefined }}
        >
          {visibleItems.map(({ item, top, left, width }) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                transform: `translate(${left}px, ${top}px)`,
                width,
              }}
            >
              <VideoEffectCard item={item} ctaLabel={ctaLabel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
