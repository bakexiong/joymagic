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
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import { withOssImageResize } from "@/shared/lib/cdn";
import {
  getImageEffectRequiredInputCount,
  type ImageEffectItem,
} from "@/shared/lib/image-effect-data";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

const EFFECT_PICKER_GRID_GAP = 12;
const EFFECT_PICKER_OVERSCAN_ROWS = 2;

type ExampleOption = {
  inputImageUrls: string[];
  outputImageUrl: string;
};

function getGeneratedItemsStorageKey(pathname: string) {
  return `image-effect-workbench:generated-items:${pathname}`;
}

function getInputPreviewUrls(source?: {
  inputImageUrl?: string;
  inputImageUrls?: string[];
}) {
  const urls = source?.inputImageUrls?.filter(Boolean) || [];
  if (urls.length > 0) {
    return urls.slice(0, 2);
  }

  return source?.inputImageUrl ? [source.inputImageUrl] : [];
}

function EffectPreviewCard({
  item,
  inputLabel,
  outputLabel,
}: {
  item: ImageEffectItem;
  inputLabel: string;
  outputLabel: string;
}) {
  const inputImageUrls = getInputPreviewUrls(item.previewExample);
  const outputImageUrl = item.previewExample?.outputImageUrl || item.coverUrl;
  const hasTransformationPreview =
    inputImageUrls.length > 0 &&
    Boolean(outputImageUrl) &&
    inputImageUrls.some((url) => url !== outputImageUrl);
  const previewImageUrl = outputImageUrl || inputImageUrls[0] || item.coverUrl;
  const mainPreviewSrc = withOssImageResize(previewImageUrl, 720, 900);
  const outputPreviewSrc = withOssImageResize(outputImageUrl, 720, 900);

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.45rem] bg-white/[0.04] shadow-[0_22px_50px_rgba(0,0,0,0.28)]">
      {hasTransformationPreview ? (
        <>
          <img
            src={outputPreviewSrc}
            alt={`${item.title} output`}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090f]/92 via-[#07090f]/22 to-transparent" />
          <div className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/92 backdrop-blur-md">
            {outputLabel}
          </div>
          <div className="absolute left-3 top-10 z-10 w-[28%] min-w-[64px] max-w-[92px] overflow-hidden rounded-[0.95rem] bg-black/18 p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.34)] backdrop-blur-sm">
            <div className="mb-1 inline-flex items-center rounded-full bg-black/35 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-white/88 backdrop-blur-md">
              {inputLabel}
            </div>
            <div
              className={cn(
                "aspect-[4/5] overflow-hidden rounded-[0.75rem]",
                inputImageUrls.length > 1 ? "grid grid-cols-2 gap-[2px]" : "",
              )}
            >
              {inputImageUrls.map((url, index) => (
                <img
                  key={`${item.slug}-effect-preview-${index}`}
                  src={withOssImageResize(url, 240, 300)}
                  alt={`${item.title} input ${index + 1}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090f]/92 via-[#07090f]/22 to-transparent" />
          <div className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/92 backdrop-blur-md">
            {outputLabel}
          </div>
        </>
      ) : (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

      {item.badge ? (
        <div className="absolute left-3 top-12 rounded-full bg-[#ff3b72] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[#ff3b72]/25">
          {item.badge}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-[0.98rem] font-semibold leading-[1.02] tracking-[0.01em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.32)]">
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
  copy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ImageEffectItem[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  copy: {
    dialogTitle: string;
    dialogSearchPlaceholder: string;
    dialogCloseAria: string;
    dialogDescription: string;
    dialogEmptyTitle: string;
    dialogEmptyDescription: string;
    inputLabel: string;
    outputLabel: string;
  };
}) {
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
      item: ImageEffectItem;
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
                {copy.dialogTitle}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden w-[320px] shrink-0 lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/32" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.dialogSearchPlaceholder}
                  className="h-11 rounded-[14px] border-white/8 bg-white/[0.04] pl-10 pr-3 text-[14px] text-white placeholder:text-white/28 focus-visible:border-white/14 focus-visible:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.05] hover:text-white/88"
                aria-label={copy.dialogCloseAria}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {copy.dialogDescription}
          </DialogDescription>
          <div className="relative mt-4 lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/32" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.dialogSearchPlaceholder}
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
                  {copy.dialogEmptyTitle}
                </p>
                <p className="mt-2 text-sm text-white/45">
                  {copy.dialogEmptyDescription}
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
                        inputLabel={copy.inputLabel}
                        outputLabel={copy.outputLabel}
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
                      inputLabel={copy.inputLabel}
                      outputLabel={copy.outputLabel}
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

function getExampleInputUrls(effect: ImageEffectItem) {
  const examples: ExampleOption[] = [];
  const seen = new Set<string>();

  const addExample = (
    inputImageUrls: string[] | undefined,
    outputImageUrl?: string,
  ) => {
    const normalizedInputUrls = (inputImageUrls || []).filter(Boolean).slice(0, 2);
    if (normalizedInputUrls.length === 0 || !outputImageUrl) {
      return;
    }

    const key = `${normalizedInputUrls.join("|")}::${outputImageUrl}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    examples.push({ inputImageUrls: normalizedInputUrls, outputImageUrl });
  };

  effect.examples?.forEach((example) => {
    addExample(getInputPreviewUrls(example), example.outputImageUrl);
  });

  return examples.slice(0, 8);
}

export function ImageEffectsWorkbench({
  navItems,
  effect,
  items,
}: {
  navItems: NavItem[];
  effect: ImageEffectItem;
  items: ImageEffectItem[];
}) {
  const tCopy = useTranslations("landing.image-effects.workspace");
  const copy = useMemo(
    () => ({
      category: tCopy("category"),
      pageTitle: tCopy("pageTitle"),
      workspaceLabel: tCopy("workspaceLabel"),
      inputBadge: tCopy("inputBadge"),
      selectedEffect: tCopy("selectedEffect"),
      change: tCopy("change"),
      imageTitle: tCopy("imageTitle"),
      imageHint: tCopy("imageHint"),
      uploadHint: tCopy("uploadHint"),
      tryExamples: tCopy("tryExamples"),
      estimating: tCopy("estimating"),
      create: tCopy("create"),
      creditsUnit: tCopy("creditsUnit"),
      estimateError: tCopy("estimateError"),
      emptyState: tCopy("emptyState"),
      inputLabel: tCopy("inputLabel"),
      outputLabel: tCopy("outputLabel"),
      exampleAria: (index: number) => tCopy("exampleAria", { index }),
      dialogTitle: tCopy("dialog.title"),
      dialogSearchPlaceholder: tCopy("dialog.searchPlaceholder"),
      dialogCloseAria: tCopy("dialog.closeAria"),
      dialogDescription: tCopy("dialog.description"),
      dialogEmptyTitle: tCopy("dialog.emptyTitle"),
      dialogEmptyDescription: tCopy("dialog.emptyDescription"),
    }),
    [tCopy],
  );
  const tGeneration = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const pathname = usePathname();
  const router = useRouter();
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });
  const requiredInputCount = getImageEffectRequiredInputCount(
    effect.requiredInputCount,
  );
  const [uploadedItems, setUploadedItems] = useState<ImageUploaderValue[]>([]);
  const [isEffectPickerOpen, setIsEffectPickerOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleOption | null>(
    null,
  );
  const [selectedExampleUrls, setSelectedExampleUrls] = useState<string[] | null>(
    null,
  );
  const [generatedItems, setGeneratedItems] = useState<GeneratedMediaItem[]>(
    [],
  );
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [requiredCredits, setRequiredCredits] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(true);
  const [estimateError, setEstimateError] = useState<string | null>(null);

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
  const imageToVideoTargetUrl = "/image-to-video/vidu-q3";
  const imageUpscalerTargetUrl = "/image-upscaler";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedItems = sessionStorage.getItem(getGeneratedItemsStorageKey(pathname));
    if (!savedItems) {
      setGeneratedItems([]);
      setSelectedItemIndices([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedItems) as GeneratedMediaItem[];
      setGeneratedItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setGeneratedItems([]);
    }
    setSelectedItemIndices([]);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getGeneratedItemsStorageKey(pathname);
    if (generatedItems.length === 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(generatedItems));
  }, [generatedItems, pathname]);

  const exampleOptions = useMemo(() => getExampleInputUrls(effect), [effect]);
  const uploadedImageUrls = useMemo(
    () =>
      uploadedItems
        .filter((item) => item.status === "uploaded" && item.url)
        .map((item) => item.url as string)
        .slice(0, requiredInputCount),
    [requiredInputCount, uploadedItems],
  );
  const uploadedReady = useMemo(
    () => uploadedImageUrls.length >= requiredInputCount,
    [requiredInputCount, uploadedImageUrls.length],
  );
  const isUploading = useMemo(
    () => uploadedItems.some((item) => item.status === "uploading"),
    [uploadedItems],
  );
  useEffect(() => {
    let cancelled = false;

    const loadRequiredCredits = async () => {
      setIsEstimating(true);
      setEstimateError(null);

      try {
        const response = await fetch("/api/ai/image-effect/estimate-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.code !== 0) {
          throw new Error(result.message || "Failed to estimate credits");
        }

        if (!cancelled) {
          setRequiredCredits(result.data?.requiredCredits ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setRequiredCredits(null);
          setEstimateError(
            error instanceof Error ? error.message : "Failed to estimate credits",
          );
        }
      } finally {
        if (!cancelled) {
          setIsEstimating(false);
        }
      }
    };

    void loadRequiredCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearSelectedExample = () => {
    setSelectedExample(null);
    setSelectedExampleUrls(null);
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
    router.push(`/ai-effect/image?effect=${slug}`);
  };

  const handleExampleSelect = (example: ExampleOption) => {
    setSelectedExample(example);
    setSelectedExampleUrls(example.inputImageUrls);
    setGenerationError("");
    setUploadedItems(
      example.inputImageUrls.map((url, index) => ({
        id: `example-${effect.slug}-${index}-${url}`,
        preview: url,
        url,
        status: "uploaded" as const,
      })),
    );
    setGeneratedItems((prev) => {
      const nextItems = prev.filter(
        (item) => item.params?.exampleSource !== "try-examples",
      );

      return [
        {
          url: example.outputImageUrl,
          params: {
            effect: effect.slug,
            effectTitle: effect.title,
            image: example.inputImageUrls[0],
            images: example.inputImageUrls,
            exampleSource: "try-examples",
          },
          aspectRatio: effect.aspectRatio,
          createdAt: new Date().toISOString(),
          sceneId: `image-effect-${effect.slug}`,
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

    const nextUploadedUrls = nextItems
      .filter((item) => item.status === "uploaded" && item.url)
      .map((item) => item.url as string);
    const stillUsingSelectedExample = selectedExample.inputImageUrls.every((url) =>
      nextUploadedUrls.includes(url),
    );

    if (!stillUsingSelectedExample) {
      clearSelectedExample();
    }
  };

  const handleGenerate = async () => {
    if (!uploadedReady) {
      setGenerationError(copy.uploadHint);
      return;
    }

    setGenerationError("");
    setIsGenerating(true);

    const scene = `image-effect-${effect.slug}`;
    const result = await executeGeneration(
      {
        apiEndpoint: "/api/ai/image-effect/generate",
        scenario: "gpt-image-2-image-to-image",
        buildStatusEndpoint: (requestId) =>
          `/api/ai/status?taskId=${encodeURIComponent(requestId)}&scenario=gpt-image-2-image-to-image`,
        requestBody: {
          effectSlug: effect.slug,
          images: uploadedImageUrls,
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
            image: uploadedImageUrls[0],
            images: uploadedImageUrls,
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

  const previewInputUrls =
    selectedExample?.inputImageUrls?.length
      ? selectedExample.inputImageUrls
      : selectedExampleUrls?.length
        ? selectedExampleUrls
        : getInputPreviewUrls(effect.previewExample).length
          ? getInputPreviewUrls(effect.previewExample)
          : getInputPreviewUrls(effect).length
            ? getInputPreviewUrls(effect)
            : [effect.posterUrl || effect.coverUrl].filter(Boolean);
  const previewOutputUrl =
    selectedExample?.outputImageUrl ||
    effect.previewExample?.outputImageUrl ||
    effect.coverUrl;
  const hasDistinctPreviewImages =
    previewInputUrls.length > 0 &&
    Boolean(previewOutputUrl) &&
    previewInputUrls.some((url) => url !== previewOutputUrl);

  const toolPanelContent = (
    <div className="h-full min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-3 md:py-3 lg:px-0 lg:py-2.5">
      <div className="rounded-[1.55rem] border border-white/6 bg-[linear-gradient(180deg,rgba(23,24,31,0.96)_0%,rgba(18,19,25,0.94)_100%)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:p-4">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/34">
              {copy.workspaceLabel}
            </p>
            <h1 className="text-[1.45rem] font-semibold tracking-tight text-white md:text-[1.6rem]">
              {copy.pageTitle}
            </h1>
          </div>
          <div className="hidden rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/54 md:block">
            {copy.inputBadge}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.15rem] border border-white/8 bg-white/[0.04]">
          <div className="relative h-[180px] overflow-hidden md:h-[196px]">
            {previewOutputUrl ? (
              <img
                src={previewOutputUrl}
                alt={effect.title}
                className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
              />
            ) : (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.1)_100%)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,12,0.14)_0%,rgba(8,9,12,0.3)_46%,rgba(8,9,12,0.5)_100%)]" />

            <div
              className={cn(
                "absolute inset-y-0 left-1/2 w-[38%] min-w-[180px] max-w-[240px] -translate-x-1/2 overflow-hidden rounded-[1rem] border border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.28)]",
                hasDistinctPreviewImages ? "grid grid-cols-2" : "block",
              )}
            >
              {hasDistinctPreviewImages ? (
                <>
                  {previewInputUrls.length > 0 ? (
                    <div
                      className={cn(
                        "h-full w-full overflow-hidden",
                        previewInputUrls.length > 1 ? "grid grid-cols-2 gap-px" : "",
                      )}
                    >
                      {previewInputUrls.map((url, index) => (
                        <img
                          key={`${effect.slug}-preview-input-${index}`}
                          src={url}
                          alt={`${effect.title} input ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <Skeleton className="h-full w-full rounded-none" />
                  )}
                  {previewOutputUrl ? (
                    <img
                      src={previewOutputUrl}
                      alt={`${effect.title} output`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Skeleton className="h-full w-full rounded-none" />
                  )}
                </>
              ) : previewOutputUrl ? (
                <img
                  src={previewOutputUrl}
                  alt={effect.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Skeleton className="h-full w-full rounded-none" />
              )}
            </div>

            <div className="absolute left-2.5 top-2.5 z-10">
              <div className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white/68 backdrop-blur-md">
                {copy.selectedEffect}
              </div>
            </div>
            <div className="absolute right-2.5 top-2.5 z-20">
              <button
                type="button"
                onClick={() => setIsEffectPickerOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-black/32 px-2.5 py-1.5 text-[11px] font-medium text-white/88 backdrop-blur-md transition hover:bg-black/48"
              >
                <span>{copy.change}</span>
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
              {copy.imageTitle}
            </h2>
            <p className="text-[11px] text-white/42">{copy.imageHint}</p>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: requiredInputCount }).map((_, index) => {
              const isFilled = index < uploadedImageUrls.length;
              return (
                <div
                  key={`${effect.slug}-input-slot-${index}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] transition",
                    isFilled
                      ? "border-white/18 bg-white/[0.08] text-white"
                      : "border-white/8 bg-white/[0.03] text-white/54",
                  )}
                >
                  <span className="font-medium tabular-nums">0{index + 1}</span>
                  <span>{copy.inputLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
            <ImageUploader
              allowMultiple={requiredInputCount > 1}
              maxImages={requiredInputCount}
              maxSizeMB={15}
              accept="image/*"
              previewType="image"
              emptyHint={copy.uploadHint}
              defaultPreviews={selectedExampleUrls || undefined}
              onChange={handleUploadedItemsChange}
              uploadMetadata={{
                sceneId: `image-effect-${effect.slug}`,
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
                {copy.tryExamples}
              </p>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {exampleOptions.map((example, index) => {
                  const isActive =
                    selectedExample?.outputImageUrl === example.outputImageUrl &&
                    selectedExample?.inputImageUrls.join("|") ===
                      example.inputImageUrls.join("|");

                  return (
                    <button
                      key={`${example.inputImageUrls.join("|")}-${example.outputImageUrl}-${index}`}
                      type="button"
                      onClick={() => handleExampleSelect(example)}
                      className={cn(
                        "relative h-10 shrink-0 cursor-pointer overflow-hidden border transition-all duration-200",
                        example.inputImageUrls.length > 1
                          ? "w-[3.4rem] rounded-[14px]"
                          : "w-10 rounded-full",
                        isActive
                          ? "border-[#ff4b8b] ring-2 ring-[#ff4b8b]/30"
                          : "border-white/10 hover:border-white/24",
                      )}
                      aria-label={copy.exampleAria(index + 1)}
                    >
                      <div
                        className={cn(
                          "h-full w-full overflow-hidden",
                          example.inputImageUrls.length > 1
                            ? "grid grid-cols-2 gap-px"
                            : "",
                        )}
                      >
                        {example.inputImageUrls.map((url, inputIndex) => (
                          <img
                            key={`${url}-${inputIndex}`}
                            src={url}
                            alt={`${effect.title} example ${index + 1} input ${inputIndex + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ))}
                      </div>
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
              <span>{copy.estimating}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4.5 w-4.5" />
              <span>
                {copy.create}
                {requiredCredits !== null && requiredCredits !== undefined ? (
                  <span className="ml-1.5 opacity-90">
                    ({requiredCredits} {copy.creditsUnit})
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
                ? `${copy.estimateError} ${estimateError}`
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
      mediaType="image"
      emptyText={copy.emptyState}
      className="min-w-0"
      selectedIndices={selectedItemIndices}
      onClearSelection={() => setSelectedItemIndices([])}
      onToggleSelectItem={(index) => {
        toggleSelectedItem(index);
      }}
      onUseItem={(index) => {
        const item = generatedItems[index];
        if (!item?.url) return;
        sessionStorage.setItem("creator-initial-ref", item.url);
        router.push(imageToVideoTargetUrl, { scroll: false });
      }}
      onUpscaleItem={(index) => {
        const item = generatedItems[index];
        if (!item?.url) return;
        sessionStorage.setItem("creator-initial-ref", item.url);
        router.push(imageUpscalerTargetUrl, { scroll: false });
      }}
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

  return (
    <>
      <CreateLayout
        navItems={navItems}
        category={copy.category as "Image"}
        initialTool={effect.slug}
        routingMode="direct-target"
        toolPanelContent={toolPanelContent}
        mainPanelContent={mainPanelContent}
        variant="two-column"
      />
      <EffectPickerDialog
        open={isEffectPickerOpen}
        onOpenChange={setIsEffectPickerOpen}
        items={items}
        selectedSlug={effect.slug}
        onSelect={handleEffectChange}
        copy={copy}
      />
    </>
  );
}
