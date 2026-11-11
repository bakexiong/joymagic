"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { usePathname, useRouter } from "@/core/i18n/navigation";
import {
  ImageUploader,
  type ImageUploaderValue,
} from "@/shared/blocks/common/image-uploader";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAppContext } from "@/shared/contexts/app";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import type { VideoEffectItem } from "@/shared/lib/video-effect-data";
import type { NavItem } from "@/shared/types/blocks/common";
import { cn } from "@/shared/lib/utils";

const EFFECT_PREVIEW_VIDEO_CONCURRENCY = 4;
const EFFECT_PICKER_GRID_GAP = 12;
const EFFECT_PICKER_OVERSCAN_ROWS = 2;
let activeEffectPreviewVideos = 0;
const pendingEffectPreviewLoads: Array<() => void> = [];

function acquireEffectPreviewVideoSlot(onReady: () => void) {
  if (activeEffectPreviewVideos < EFFECT_PREVIEW_VIDEO_CONCURRENCY) {
    activeEffectPreviewVideos += 1;
    onReady();
    return () => {
      activeEffectPreviewVideos = Math.max(0, activeEffectPreviewVideos - 1);
      const next = pendingEffectPreviewLoads.shift();
      if (next) {
        activeEffectPreviewVideos += 1;
        next();
      }
    };
  }

  pendingEffectPreviewLoads.push(onReady);

  return () => {
    const index = pendingEffectPreviewLoads.indexOf(onReady);
    if (index >= 0) {
      pendingEffectPreviewLoads.splice(index, 1);
      return;
    }

    activeEffectPreviewVideos = Math.max(0, activeEffectPreviewVideos - 1);
    const next = pendingEffectPreviewLoads.shift();
    if (next) {
      activeEffectPreviewVideos += 1;
      next();
    }
  };
}

function EffectPreviewCard({
  item,
  scrollRoot,
}: {
  item: VideoEffectItem;
  scrollRoot: HTMLDivElement | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const hasVideoSlotRef = useRef(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !item.sampleVideoUrl) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          setShouldLoadVideo(true);
        }
        setIsVisible(visible);
      },
      {
        root: scrollRoot,
        rootMargin: "240px",
        threshold: 0.15,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [item.samplePreviewClipUrl, item.sampleVideoUrl, scrollRoot]);

  useEffect(() => {
    if (!item.sampleVideoUrl || !isVisible || hasVideoSlotRef.current) {
      return;
    }

    releaseSlotRef.current = acquireEffectPreviewVideoSlot(() => {
      hasVideoSlotRef.current = true;
      setShouldLoadVideo(true);
    });
  }, [isVisible, item.samplePreviewClipUrl, item.sampleVideoUrl]);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    if (releaseSlotRef.current) {
      const release = releaseSlotRef.current;
      releaseSlotRef.current = null;
      hasVideoSlotRef.current = false;
      release();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible || !hasVideoSlotRef.current || !shouldLoadVideo) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShouldLoadVideo(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [isVisible, shouldLoadVideo]);

  useEffect(() => {
    return () => {
      if (releaseSlotRef.current) {
        const release = releaseSlotRef.current;
        releaseSlotRef.current = null;
        hasVideoSlotRef.current = false;
        release();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[1/1.1] overflow-hidden bg-white/[0.03]"
    >
      {item.sampleVideoUrl && shouldLoadVideo ? (
        <video
          src={item.samplePreviewClipUrl || item.sampleVideoUrl}
          poster={item.coverUrl}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          autoPlay={isVisible}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      ) : item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/22 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <p className="line-clamp-2 text-[0.95rem] font-semibold leading-tight tracking-[-0.01em] text-white">
          {item.title}
        </p>
      </div>
    </div>
  );
}

function EffectPickerDialog({
  open,
  onOpenChange,
  items,
  selectedSlug,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VideoEffectItem[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations("landing.video-effects.workspace");
  const [query, setQuery] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportMetrics, setViewportMetrics] = useState({
    width: 0,
    height: 0,
    scrollTop: 0,
  });

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword)
      );
    });
  }, [items, query]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !open) {
      return;
    }

    const updateMetrics = () => {
      setViewportMetrics((current) => {
        const next = {
          width: viewport.clientWidth,
          height: viewport.clientHeight,
          scrollTop: viewport.scrollTop,
        };

        if (
          current.width === next.width &&
          current.height === next.height &&
          current.scrollTop === next.scrollTop
        ) {
          return current;
        }

        return next;
      });
    };

    updateMetrics();
    const rafId = window.requestAnimationFrame(updateMetrics);

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });

    resizeObserver.observe(viewport);
    viewport.addEventListener("scroll", updateMetrics, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      viewport.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [open]);

  const columnCount = useMemo(() => {
    const width = viewportMetrics.width;
    if (width >= 1536) return 6;
    if (width >= 1280) return 5;
    if (width >= 1024) return 4;
    if (width >= 640) return 3;
    return 2;
  }, [viewportMetrics.width]);

  const cardWidth = useMemo(() => {
    if (!viewportMetrics.width || !columnCount) {
      return 0;
    }

    return Math.max(
      0,
      (viewportMetrics.width - EFFECT_PICKER_GRID_GAP * (columnCount - 1)) /
        columnCount,
    );
  }, [columnCount, viewportMetrics.width]);

  const rowHeight = useMemo(() => {
    if (!cardWidth) {
      return 0;
    }

    return cardWidth * 1.1 + 24;
  }, [cardWidth]);

  const totalRows = useMemo(
    () => Math.ceil(filteredItems.length / Math.max(columnCount, 1)),
    [columnCount, filteredItems.length],
  );

  const visibleRowRange = useMemo(() => {
    if (!rowHeight || !viewportMetrics.height) {
      return {
        startRow: 0,
        endRow: Math.min(totalRows, 3),
      };
    }

    const startRow = Math.max(
      0,
      Math.floor(viewportMetrics.scrollTop / rowHeight) -
        EFFECT_PICKER_OVERSCAN_ROWS,
    );
    const endRow = Math.min(
      totalRows,
      Math.ceil(
        (viewportMetrics.scrollTop + viewportMetrics.height) / rowHeight,
      ) + EFFECT_PICKER_OVERSCAN_ROWS,
    );

    return { startRow, endRow };
  }, [rowHeight, totalRows, viewportMetrics.height, viewportMetrics.scrollTop]);

  const virtualItems = useMemo(() => {
    const itemsToRender: Array<{
      item: VideoEffectItem;
      index: number;
      top: number;
      left: number;
      width: number;
    }> = [];

    for (
      let row = visibleRowRange.startRow;
      row < visibleRowRange.endRow;
      row += 1
    ) {
      for (let column = 0; column < columnCount; column += 1) {
        const index = row * columnCount + column;
        const item = filteredItems[index];

        if (!item) {
          continue;
        }

        itemsToRender.push({
          item,
          index,
          top: row * rowHeight,
          left: column * (cardWidth + EFFECT_PICKER_GRID_GAP),
          width: cardWidth,
        });
      }
    }

    return itemsToRender;
  }, [
    cardWidth,
    columnCount,
    filteredItems,
    rowHeight,
    visibleRowRange.endRow,
    visibleRowRange.startRow,
  ]);

  const virtualGridHeight = useMemo(() => {
    if (!totalRows || !rowHeight) {
      return 0;
    }

    return totalRows * rowHeight - EFFECT_PICKER_GRID_GAP;
  }, [rowHeight, totalRows]);

  const isVirtualGridReady =
    viewportMetrics.width > 0 &&
    viewportMetrics.height > 0 &&
    cardWidth > 0 &&
    rowHeight > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-hidden rounded-[26px] border-white/10 bg-[#1b1c22] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.58)] max-sm:max-w-[calc(100vw-1rem)] sm:max-w-[94vw] xl:max-w-[1380px]"
      >
        <DialogHeader className="border-b border-white/8 px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[1.08rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.32rem]">
                {t("dialog.title")}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden w-[320px] shrink-0 lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/32" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("dialog.searchPlaceholder")}
                  className="h-11 rounded-[14px] border-white/8 bg-white/[0.04] pl-10 pr-3 text-[14px] text-white placeholder:text-white/28 focus-visible:border-white/14 focus-visible:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.05] hover:text-white/88"
                aria-label={t("dialog.closeAria")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {t("dialog.description")}
          </DialogDescription>
          <div className="relative mt-4 lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/32" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("dialog.searchPlaceholder")}
              className="h-11 rounded-[14px] border-white/8 bg-white/[0.04] pl-10 pr-3 text-[14px] text-white placeholder:text-white/28 focus-visible:border-white/14 focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div
          ref={scrollViewportRef}
          className="max-h-[calc(92vh-110px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
        >
          {filteredItems.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-[22px] border border-white/8 bg-white/[0.03] text-center">
              <div>
                <p className="text-[1rem] font-semibold text-white/88">
                  {t("dialog.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-white/45">
                  {t("dialog.emptyDescription")}
                </p>
              </div>
            </div>
          ) : isVirtualGridReady ? (
            <div
              className="relative"
              style={{
                height: virtualGridHeight || undefined,
                minHeight: rowHeight || undefined,
              }}
            >
              {virtualItems.map(({ item, left, top, width, index }) => {
                const isActive = item.slug === selectedSlug;

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      transform: `translate(${left}px, ${top}px)`,
                      width,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item.slug);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "group w-full cursor-pointer overflow-hidden rounded-[20px] border text-left transition-all duration-300",
                        isActive
                          ? "border-white/18 bg-[#15161c] shadow-[0_18px_34px_rgba(0,0,0,0.34)]"
                          : "border-white/8 bg-[#14151a] hover:border-white/14 hover:bg-[#171820]",
                      )}
                      style={{
                        willChange:
                          index < columnCount * 2 ? "auto" : "transform",
                      }}
                    >
                      <EffectPreviewCard
                        item={item}
                        scrollRoot={scrollViewportRef.current}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredItems.map((item) => {
                const isActive = item.slug === selectedSlug;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.slug);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "group w-full cursor-pointer overflow-hidden rounded-[20px] border text-left transition-all duration-300",
                      isActive
                        ? "border-white/18 bg-[#15161c] shadow-[0_18px_34px_rgba(0,0,0,0.34)]"
                        : "border-white/8 bg-[#14151a] hover:border-white/14 hover:bg-[#171820]",
                    )}
                  >
                    <EffectPreviewCard
                      item={item}
                      scrollRoot={scrollViewportRef.current}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VideoEffectsWorkbench({
  navItems,
  effect,
  items,
}: {
  navItems: NavItem[];
  effect: VideoEffectItem;
  items: VideoEffectItem[];
}) {
  const pathname = usePathname();
  const t = useTranslations("landing.video-effects.workspace");
  const tGeneration = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const router = useRouter();
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const exampleOptions = useMemo(() => {
    const examples = new Map<
      string,
      {
        inputImageUrl: string;
        outputVideoUrl: string;
        outputPreviewClipUrl?: string;
      }
    >();

    const addExample = (
      inputImageUrl?: string,
      outputVideoUrl?: string,
      outputPreviewClipUrl?: string,
    ) => {
      if (!inputImageUrl || !outputVideoUrl) {
        return;
      }

      const key = `${inputImageUrl}::${outputVideoUrl}`;
      if (!examples.has(key)) {
        examples.set(key, {
          inputImageUrl,
          outputVideoUrl,
          outputPreviewClipUrl,
        });
      }
    };

    effect.examples?.forEach((example) => {
      addExample(
        example.inputImageUrl,
        example.outputVideoUrl || effect.sampleVideoUrl,
        example.outputPreviewClipUrl || effect.samplePreviewClipUrl,
      );
    });

    addExample(
      effect.sourceImageUrl,
      effect.sampleVideoUrl,
      effect.samplePreviewClipUrl,
    );

    return Array.from(examples.values()).slice(0, 8);
  }, [
    effect.examples,
    effect.samplePreviewClipUrl,
    effect.sampleVideoUrl,
    effect.sourceImageUrl,
  ]);
  const [uploadedItems, setUploadedItems] = useState<ImageUploaderValue[]>([]);
  const [isEffectPickerOpen, setIsEffectPickerOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<{
    inputImageUrl: string;
    outputVideoUrl: string;
    outputPreviewClipUrl?: string;
  } | null>(null);
  const [selectedExampleUrl, setSelectedExampleUrl] = useState<string | null>(
    null,
  );
  const [generatedItems, setGeneratedItems] = useState<GeneratedMediaItem[]>(
    [],
  );
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const removeSelectedIndices = (prevSelected: number[], removedIndices: number[]) => {
    const sortedRemoved = [...removedIndices].sort((a, b) => a - b);
    const removedSet = new Set(sortedRemoved);

    return prevSelected
      .filter((index) => !removedSet.has(index))
      .map((index) => index - sortedRemoved.filter((removed) => removed < index).length);
  };

  const toggleSelectedItem = (index: number) => {
    setSelectedItemIndices((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const uploadedReady = useMemo(
    () => uploadedItems.some((item) => item.status === "uploaded" && item.url),
    [uploadedItems],
  );
  const isUploading = useMemo(
    () => uploadedItems.some((item) => item.status === "uploading"),
    [uploadedItems],
  );
  const uploadedImageUrl = useMemo(
    () =>
      uploadedItems.find((item) => item.status === "uploaded" && item.url)
        ?.url || "",
    [uploadedItems],
  );
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    `video-effect-${effect.slug}`,
    {},
    {
      enabled: true,
      debounceMs: 200,
    },
  );

  const clearSelectedExample = () => {
    setSelectedExample(null);
    setSelectedExampleUrl(null);
    setGeneratedItems((prev) => {
      const exampleIndex = prev.findIndex(
        (item) => item.params?.exampleSource === "try-examples",
      );

      if (exampleIndex === -1) {
        return prev;
      }

      setSelectedItemIndices((prevSelected) =>
        removeSelectedIndices(prevSelected, [exampleIndex]),
      );

      return prev.filter(
        (item) => item.params?.exampleSource !== "try-examples",
      );
    });
  };

  useEffect(() => {
    clearSelectedExample();
    setUploadedItems([]);
  }, [effect.slug]);

  const handleEffectChange = (slug: string) => {
    router.push(`/ai-effect/video?effect=${slug}`);
  };

  const handleExampleSelect = (example: {
    inputImageUrl: string;
    outputVideoUrl: string;
    outputPreviewClipUrl?: string;
  }) => {
    setSelectedExample(example);
    setSelectedExampleUrl(example.inputImageUrl);
    setGenerationError("");
    setUploadedItems([
      {
        id: `example-${effect.slug}-${example.inputImageUrl}`,
        preview: example.inputImageUrl,
        url: example.inputImageUrl,
        status: "uploaded",
      },
    ]);
    setGeneratedItems((prev) => {
      const nextItems = prev.filter(
        (item) => item.params?.exampleSource !== "try-examples",
      );

      return [
        {
          url: example.outputVideoUrl,
          previewUrl: example.outputPreviewClipUrl,
          params: {
            effect: effect.slug,
            effectTitle: effect.title,
            image: example.inputImageUrl,
            poster: example.inputImageUrl,
            exampleSource: "try-examples",
          },
          aspectRatio: effect.aspectRatio,
          createdAt: new Date().toISOString(),
          sceneId: `video-effect-${effect.slug}`,
          prompt: `${effect.title} example`,
        },
        ...nextItems,
      ];
    });
    setSelectedItemIndices([0]);
  };

  const handleUploadedItemsChange = (nextItems: ImageUploaderValue[]) => {
    setUploadedItems(nextItems);

    if (!selectedExample) {
      return;
    }

    const stillUsingSelectedExample = nextItems.some(
      (item) =>
        item.status === "uploaded" &&
        item.url === selectedExample.inputImageUrl,
    );

    if (!stillUsingSelectedExample) {
      clearSelectedExample();
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      setGenerationError(t("uploadHint"));
      return;
    }

    setGenerationError("");
    setIsGenerating(true);

    const scene = `video-effect-${effect.slug}`;
    const result = await executeGeneration(
      {
        apiEndpoint: `/api/ai/${scene}/generate`,
        scenario: scene,
        requestBody: {
          image: uploadedImageUrl,
        },
        requiredCredits,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      },
      {
        checkAccess: () => checkAccess(),
        showPricingModal: () => setIsShowPaymentModal(true),
        showSignModal: () => setIsShowSignModal(true),
        fetchUserInfo: async () => {
          await fetchUserInfo();
        },
        onStatusUpdate: () => {},
        onError: (error) => setGenerationError(error),
        translateApiError: (translationKey) =>
          tCommonApi(translationKey as any),
      },
      (key: string, params?: Record<string, any>) => {
        try {
          const translated = tGeneration(key as any, params as any);
          return typeof translated === "string"
            ? translated
            : params?.defaultValue || key;
        } catch {
          return params?.defaultValue || key;
        }
      },
    );

    if (result.success && result.url) {
      setGeneratedItems((prev) => [
        {
          url: result.url!,
          params: {
            effect: effect.slug,
            effectTitle: effect.title,
            image: uploadedImageUrl,
            poster: uploadedImageUrl,
          },
          aspectRatio: effect.aspectRatio,
          createdAt: new Date().toISOString(),
          sceneId: scene,
          prompt: effect.title,
        },
        ...prev,
      ]);
      setSelectedItemIndices([0]);
    }

    setIsGenerating(false);
  };

  const toolPanelContent = (
    <div className="h-full min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-3 md:py-3 lg:px-0 lg:py-2.5">
      <div className="rounded-[1.55rem] border border-white/6 bg-[linear-gradient(180deg,rgba(23,24,31,0.96)_0%,rgba(18,19,25,0.94)_100%)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:p-4">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/34">
              {t("workspaceLabel")}
            </p>
            <h1 className="text-[1.45rem] font-semibold tracking-tight text-white md:text-[1.6rem]">
              {t("pageTitle")}
            </h1>
          </div>
          <div className="hidden rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/54 md:block">
            {t("inputBadge")}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.15rem] border border-white/8 bg-white/[0.04]">
          <div className="relative h-[180px] overflow-hidden md:h-[196px]">
            {effect.sampleVideoUrl ? (
              <video
                src={effect.sampleVideoUrl}
                poster={effect.coverUrl}
                className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={effect.title}
              />
            ) : effect.coverUrl ? (
              <img
                src={effect.coverUrl}
                alt={effect.title}
                className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
              />
            ) : (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.1)_100%)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,12,0.14)_0%,rgba(8,9,12,0.3)_46%,rgba(8,9,12,0.5)_100%)]" />

            <div className="absolute inset-y-0 left-1/2 w-[30%] min-w-[128px] max-w-[170px] -translate-x-1/2 overflow-hidden rounded-[1rem] border border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
              {effect.sampleVideoUrl ? (
                <video
                  src={effect.sampleVideoUrl}
                  poster={effect.coverUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
              ) : effect.coverUrl ? (
                <img
                  src={effect.coverUrl}
                  alt={effect.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Skeleton className="h-full w-full rounded-none" />
              )}
            </div>

            <div className="absolute left-2.5 top-2.5 z-10">
              <div className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white/68 backdrop-blur-md">
                {t("selectedEffect")}
              </div>
            </div>
            <div className="absolute right-2.5 top-2.5 z-20">
              <button
                type="button"
                onClick={() => setIsEffectPickerOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-black/32 px-2.5 py-1.5 text-[11px] font-medium text-white/88 backdrop-blur-md transition hover:bg-black/48"
              >
                <span>{t("change")}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12 text-center">
              <p className="text-[1.1rem] font-semibold leading-none tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] md:text-[1.24rem]">
                {effect.title}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-[1.05rem] font-semibold text-white">
              {t("imageTitle")}
            </h2>
            <p className="text-[11px] text-white/42">{t("imageHint")}</p>
          </div>
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
            <ImageUploader
              allowMultiple={false}
              maxImages={1}
              maxSizeMB={15}
              accept="image/*"
              previewType="image"
              emptyHint={t("uploadHint")}
              defaultPreviews={
                selectedExampleUrl ? [selectedExampleUrl] : undefined
              }
              onChange={handleUploadedItemsChange}
              uploadMetadata={{
                sceneId: `video-effect-${effect.slug}`,
                sceneLabel: effect.title,
                modelUrl: pathname,
                modelLabel: effect.title,
              }}
              className="[&_img]:rounded-[18px] [&_.text-muted-foreground]:hidden [&>div:last-of-type]:w-full [&>div:last-of-type>button]:min-h-[152px] [&>div:last-of-type>button]:rounded-[18px] [&>div:last-of-type>button]:border-white/8 [&>div:last-of-type>button]:bg-[#202129] [&>div:last-of-type>button]:text-white/70"
            />
          </div>

          {exampleOptions.length > 0 ? (
            <div className="mt-3.5 flex items-center gap-3 overflow-hidden">
              <p className="shrink-0 text-[13px] font-medium text-white/62">
                {t("tryExamples")}
              </p>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {exampleOptions.map((example, index) => {
                  const isActive =
                    selectedExample?.inputImageUrl === example.inputImageUrl &&
                    selectedExample?.outputVideoUrl === example.outputVideoUrl;

                  return (
                    <button
                      key={`${example.inputImageUrl}-${example.outputVideoUrl}-${index}`}
                      type="button"
                      onClick={() => handleExampleSelect(example)}
                      className={cn(
                        "relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border transition-all duration-200",
                        isActive
                          ? "border-[#ff4b8b] ring-2 ring-[#ff4b8b]/30"
                          : "border-white/10 hover:border-white/24",
                      )}
                      aria-label={t("exampleAria", { index: index + 1 })}
                    >
                      <img
                        src={example.inputImageUrl}
                        alt={`${effect.title} example ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <Button
          disabled={
            !uploadedReady || isUploading || isEstimating || isGenerating
          }
          onClick={handleGenerate}
          className={cn(
            "mt-4 h-11 w-full rounded-[1rem] text-[15px] font-semibold shadow-none",
            "bg-white/[0.08] text-white hover:bg-white/[0.12] disabled:bg-white/[0.05] disabled:text-white/35",
          )}
        >
          {isEstimating || isGenerating ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              <span>{t("estimating")}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4.5 w-4.5" />
              <span>
                {t("create")}
                {requiredCredits !== null && requiredCredits !== undefined ? (
                  <span className="ml-1.5 opacity-90">
                    ({requiredCredits} {t("creditsUnit")})
                  </span>
                ) : null}
              </span>
            </>
          )}
        </Button>

        {estimateError || generationError ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="break-words">
              {estimateError
                ? `${t("estimateError")} ${estimateError}`
                : generationError}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );

  const mainPanelContent = (
    <GeneratedMediaPanel
      items={generatedItems}
      isGenerating={isGenerating}
      mediaType="video"
      autoplayVideos
      emptyText={t("emptyState")}
      className="min-w-0"
      selectedIndices={selectedItemIndices}
      onClearSelection={() => setSelectedItemIndices([])}
      onToggleSelectItem={(index) => {
        toggleSelectedItem(index);
      }}
      onUseItem={() => {}}
      onDeleteItem={(index) => {
        setGeneratedItems((prev) => prev.filter((_, i) => i !== index));
        setSelectedItemIndices((prevSelected) =>
          removeSelectedIndices(prevSelected, [index]),
        );
      }}
      onDeleteItems={(indices) => {
        const removedSet = new Set(indices);
        setGeneratedItems((prev) => prev.filter((_, i) => !removedSet.has(i)));
        setSelectedItemIndices((prevSelected) =>
          removeSelectedIndices(prevSelected, indices),
        );
      }}
    />
  );

  const layout = (
    <CreateLayout
      navItems={navItems}
      category={t("category") as "Video"}
      initialTool={effect.slug}
      routingMode="direct-target"
      toolPanelContent={toolPanelContent}
      mainPanelContent={mainPanelContent}
      variant="two-column"
    />
  );

  return (
    <>
      {layout}
      <EffectPickerDialog
        open={isEffectPickerOpen}
        onOpenChange={setIsEffectPickerOpen}
        items={items}
        selectedSlug={effect.slug}
        onSelect={handleEffectChange}
      />
    </>
  );
}
