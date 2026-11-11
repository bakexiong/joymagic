"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/core/i18n/navigation";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { withOssImageResize } from "@/shared/lib/cdn";
import { landingSidebarInnerCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import type { ImageEffectItem } from "@/shared/lib/image-effect-data";

type ImageEffectGalleryProps = {
  ctaLabel: string;
  items: ImageEffectItem[];
};

type LayoutItem = {
  item: ImageEffectItem;
  top: number;
  left: number;
  width: number;
  height: number;
  aspectRatio: string;
};

const GALLERY_GAP = 12;
const GALLERY_OVERSCAN = 180;

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

function useDeferredVisibility() {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

function ImageEffectCard({
  item,
  ctaLabel,
  renderAspectRatio,
}: {
  item: ImageEffectItem;
  ctaLabel: string;
  renderAspectRatio: string;
}) {
  const t = useTranslations("landing.image-effects.gallery");
  const { ref, isVisible } = useDeferredVisibility();
  const inputImageUrls = (
    item.previewExample?.inputImageUrls?.filter(Boolean) ||
    (item.previewExample?.inputImageUrl ? [item.previewExample.inputImageUrl] : [])
  ).slice(0, 2);
  const outputImageUrl = item.previewExample?.outputImageUrl || item.coverUrl;
  const hasTransformationPreview =
    inputImageUrls.length > 0 &&
    Boolean(outputImageUrl) &&
    inputImageUrls.some((url) => url !== outputImageUrl);
  const previewImageUrl = outputImageUrl || inputImageUrls[0];
  const mainPreviewSrc = withOssImageResize(previewImageUrl, 720, 900);
  const outputPreviewSrc = withOssImageResize(outputImageUrl, 720, 900);

  return (
    <Link
      ref={ref}
      href={`/ai-effect/image?effect=${item.slug}`}
      className="group relative block cursor-pointer overflow-hidden rounded-[1.45rem] bg-white/[0.04] shadow-[0_22px_50px_rgba(0,0,0,0.32)] transition duration-300 hover:bg-white/[0.06]"
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: renderAspectRatio }}
      >
        {!isVisible ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        ) : hasTransformationPreview ? (
          <>
            <div className="absolute inset-0">
              <img
                src={outputPreviewSrc}
                alt={`${item.title} output`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#07090f]/92 via-[#07090f]/22 to-transparent" />
            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/92 backdrop-blur-md sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px]">
              <span>{t("outputLabel")}</span>
            </div>

            <div className="absolute left-2 top-9 z-10 w-[22%] min-w-[52px] max-w-[74px] overflow-hidden rounded-[0.8rem] bg-black/18 p-1 shadow-[0_12px_24px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:left-4 sm:top-[3.6rem] sm:w-[29%] sm:min-w-[76px] sm:max-w-[108px] sm:rounded-[0.95rem] sm:p-1.5 sm:shadow-[0_14px_30px_rgba(0,0,0,0.34)]">
              <div className="mb-1 inline-flex items-center rounded-full bg-black/35 px-1.5 py-0.5 text-[6px] font-semibold uppercase tracking-[0.12em] text-white/88 backdrop-blur-md sm:px-2 sm:text-[8px]">
                {t("inputLabel")}
              </div>
              <div
                className={cn(
                  "aspect-[4/5] overflow-hidden rounded-[0.75rem]",
                  inputImageUrls.length > 1 ? "grid grid-cols-2 gap-[2px]" : "",
                )}
              >
                {inputImageUrls.map((url, index) => (
                  <img
                    key={`${item.slug}-input-${index}`}
                    src={withOssImageResize(url, 240, 300)}
                    alt={`${item.title} input ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </>
        ) : previewImageUrl ? (
          <>
            <img
              src={mainPreviewSrc}
              alt={`${item.title} preview`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090f]/92 via-[#07090f]/22 to-transparent" />
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/92 backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px]">
              <span>{t("previewLabel")}</span>
            </div>
          </>
        ) : null}

        {item.badge ? (
          <div className="absolute left-3 top-12 rounded-full bg-[#ff3b72] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#ff3b72]/25 sm:left-4 sm:top-[3.25rem] sm:px-3 sm:text-[11px]">
            {item.badge}
          </div>
        ) : null}

        {item.likes ? (
          <div className="absolute right-3 top-12 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/92 backdrop-blur-md sm:right-4 sm:top-[3.25rem] sm:px-3 sm:py-1.5 sm:text-xs">
            <Flame className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" />
            <span>{item.likes}</span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="flex min-h-[92px] flex-col justify-end sm:min-h-[120px]">
            <h2 className="max-w-[94%] text-[0.84rem] font-semibold leading-[1.02] tracking-[0.01em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.32)] transition duration-300 md:group-hover:-translate-y-1 sm:max-w-[92%] sm:text-[1.18rem]">
              {item.title}
            </h2>

            <div className="hidden overflow-hidden md:block">
              <div className="pointer-events-none mt-0 max-h-0 translate-y-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:mt-3 group-hover:max-h-12 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:mt-3 group-focus-within:max-h-12 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:pointer-events-auto motion-reduce:mt-3 motion-reduce:max-h-12 motion-reduce:translate-y-0 motion-reduce:opacity-100">
                <div className="inline-flex h-8 w-fit max-w-full items-center gap-1 rounded-full bg-[linear-gradient(135deg,rgba(255,73,131,0.96)_0%,rgba(190,67,255,0.94)_100%)] px-2.5 py-1 text-[10px] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(215,57,143,0.24)] sm:h-10 sm:gap-1.5 sm:px-3.5 sm:text-[12px]">
                  <Sparkles className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  <span className="whitespace-nowrap">{ctaLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-2 md:hidden">
              <div className="inline-flex min-h-[36px] w-full items-center justify-center gap-1 rounded-full bg-[linear-gradient(135deg,rgba(255,73,131,0.96)_0%,rgba(190,67,255,0.94)_100%)] px-3 text-[10px] font-semibold text-white shadow-[0_14px_28px_rgba(215,57,143,0.24)]">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">{ctaLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ImageEffectGallery({
  ctaLabel,
  items,
}: ImageEffectGalleryProps) {
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
      const ratio = { width: 4, height: 5 };
      const cardHeight = columnWidth * (ratio.height / ratio.width);
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const top = columnHeights[shortestColumn];
      const left = shortestColumn * (columnWidth + GALLERY_GAP);

      positionedItems.push({
        item,
        top,
        left,
        width: columnWidth,
        height: cardHeight,
        aspectRatio: `${ratio.width} / ${ratio.height}`,
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
          {visibleItems.map(({ item, top, left, width, aspectRatio }) => (
            <div
              key={item.id}
              className="absolute"
              style={{
                transform: `translate(${left}px, ${top}px)`,
                width,
              }}
            >
              <ImageEffectCard
                item={item}
                ctaLabel={ctaLabel}
                renderAspectRatio={aspectRatio}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
