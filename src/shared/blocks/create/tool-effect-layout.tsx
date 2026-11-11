"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ArrowRight, Play, Sparkles } from "lucide-react";

import { MangoPanelMessage } from "@/shared/blocks/create/tools-mango-shell";
import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { withOssImageMaxSide } from "@/shared/lib/cdn";
import { cn } from "@/shared/lib/utils";

export type ToolEffectCarouselItem = {
  id: string;
  title: string;
  description?: string | null;
  mediaType: "image" | "video";
  sourcePreviewUrl?: string | null;
  referencePreviewUrls?: string[] | null;
  resultPreviewUrls?: string[] | null;
  previewUrl?: string | null;
  previewClipUrl?: string | null;
  thumbnailUrl?: string | null;
  onSelect?: () => void;
};

const STUDIO_PANEL_CLASS_NAME =
  "h-[min(680px,calc(100dvh-190px))] min-h-[520px] overflow-hidden rounded-[28px] bg-transparent p-2 sm:p-3";

function dedupeTrailingRepeatedWords(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return normalized;
  }

  const words = normalized.split(" ");
  while (
    words.length >= 2 &&
    words[words.length - 1].toLowerCase() ===
      words[words.length - 2].toLowerCase()
  ) {
    words.splice(words.length - 1, 1);
  }

  return words.join(" ");
}

function hasRenderableGeneratedMedia(item: GeneratedMediaItem) {
  return Boolean(
    (typeof item.url === "string" && item.url.trim()) ||
    (typeof item.previewUrl === "string" && item.previewUrl.trim()),
  );
}

export function ToolEffectLayout({
  hero,
  generator,
  marketing,
}: {
  hero?: ReactNode;
  generator: ReactNode;
  marketing?: ReactNode;
}) {
  return (
    <section className="bg-white text-[#23282F]">
      <div className="border-b border-[#D9E7F6] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.78),transparent_24%),linear-gradient(180deg,#F1F8FF_0%,#EAF5FF_52%,#F8FBFF_100%)] px-3 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-0">
        <div className="mx-auto max-w-[1240px] space-y-5">
          {hero}
          {generator}
        </div>
      </div>
      {marketing ? (
        <div className="px-3 py-7 sm:px-5 sm:py-8 lg:px-6 xl:px-0">
          <div className="mx-auto max-w-[1240px]">{marketing}</div>
        </div>
      ) : null}
    </section>
  );
}

export function ToolGenericStudio({
  form,
  carouselItems,
  generatedItems = [],
  pendingItemCount = 0,
  onUseGeneratedItem,
  onUpscaleGeneratedItem,
  emptyTitle,
  emptyDescription,
}: {
  form: ReactNode;
  carouselItems: ToolEffectCarouselItem[];
  generatedItems?: GeneratedMediaItem[];
  pendingItemCount?: number;
  onUseGeneratedItem?: (item: GeneratedMediaItem) => void;
  onUpscaleGeneratedItem?: (item: GeneratedMediaItem) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const renderableGeneratedItems = useMemo(
    () => generatedItems.filter(hasRenderableGeneratedMedia),
    [generatedItems],
  );
  const shouldShowGeneratedPanel =
    renderableGeneratedItems.length > 0 || pendingItemCount > 0;
  return (
    <div className="grid gap-4 md:grid-cols-2" data-tool-generic-studio>
      <section className={STUDIO_PANEL_CLASS_NAME}>
        <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF6]">
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto p-2.5",
              "[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none",
              "[&>div]:before:hidden",
              "[&>div>div.relative.z-10]:px-0 [&>div>div.relative.z-10]:pb-0 [&>div>div.relative.z-10]:pt-0",
              "[&_.space-y-5]:!space-y-2 [&_.space-y-4]:!space-y-2 [&_.pt-4]:!pt-1.5 [&_.pb-4]:!pb-1.5",
              "[&>div>div.min-h-0]:!pb-[72px]",
              "[&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#23282F]",
              "[&_textarea]:!min-h-[74px] [&_textarea]:rounded-[10px] [&_textarea]:border-[#D9E0EA] [&_textarea]:bg-[#F7F8FB] [&_textarea]:px-2.5 [&_textarea]:py-2 [&_textarea]:text-[12px]",
              "[&_input]:rounded-[14px] [&_input]:border-[#D9E0EA] [&_input]:bg-[#F7F8FB]",
              "[&_button]:text-[11px] [&_button.h-11]:!h-8 [&_.grid.grid-cols-7_button]:!min-h-[42px] [&_.grid.grid-cols-7_button]:!gap-0.5 [&_.grid.grid-cols-7_button]:!py-1",
              "[&_.border-2.border-dashed]:!min-h-[76px] [&_.border-2.border-dashed]:!gap-1 [&_.border-2.border-dashed]:!p-2",
              "[&_.h-10.w-10]:!h-7 [&_.h-10.w-10]:!w-7 [&_.h-5.w-5]:!h-3.5 [&_.h-5.w-5]:!w-3.5",
              "[&_[data-slot='select-trigger']]:rounded-[14px] [&_[data-slot='select-trigger']]:border-[#D9E0EA] [&_[data-slot='select-trigger']]:bg-[#F7F8FB] [&_[data-slot='select-trigger']]:shadow-none",
              "[&_[data-generate-btn]]:!sticky [&_[data-generate-btn]]:!bottom-0 [&_[data-generate-btn]]:z-20",
              "[&_button[data-generate-btn]]:h-[48px] [&_button[data-generate-btn]]:rounded-full [&_button[data-generate-btn]]:bg-[#23282F] [&_button[data-generate-btn]]:px-4 [&_button[data-generate-btn]]:text-[13px] [&_button[data-generate-btn]]:font-semibold [&_button[data-generate-btn]]:shadow-none [&_button[data-generate-btn]]:hover:scale-100",
              "[&_button[data-generate-btn]:disabled]:bg-[#E6EAF2] [&_button[data-generate-btn]:disabled]:text-[#9AA3AF]",
            )}
          >
            {form}
          </div>
        </div>
      </section>

      {shouldShowGeneratedPanel ? (
        <ToolStudioGeneratedPanel
          items={renderableGeneratedItems}
          pendingItemCount={pendingItemCount}
          onUseGeneratedItem={onUseGeneratedItem}
          onUpscaleGeneratedItem={onUpscaleGeneratedItem}
        />
      ) : (
        <ToolLibraryCarousel
          items={carouselItems}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />
      )}
    </div>
  );
}

function ToolStudioGeneratedPanel({
  items,
  pendingItemCount,
  onUseGeneratedItem,
  onUpscaleGeneratedItem,
}: {
  items: GeneratedMediaItem[];
  pendingItemCount: number;
  onUseGeneratedItem?: (item: GeneratedMediaItem) => void;
  onUpscaleGeneratedItem?: (item: GeneratedMediaItem) => void;
}) {
  return (
    <section className={STUDIO_PANEL_CLASS_NAME}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF6]">
        <div className="border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)] px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="text-[1rem] font-semibold text-[#23282F]">
            Generate List
          </h3>
        </div>
        <GeneratedMediaPanel
          items={items}
          isGenerating={pendingItemCount > 0}
          pendingItemCount={pendingItemCount}
          mediaType={
            items.some((item) => item.mediaKind === "video") ? "video" : "image"
          }
          className="min-h-0 flex-1"
          embedded
          embeddedTone="light"
          hideHeader
          hideAddToCollectionAction
          gridDensity="compact"
          cardScale={20}
          previewLayout="crop"
          showMetadata={false}
          onUseItem={(index) => {
            const item = items[index];
            if (item) {
              onUseGeneratedItem?.(item);
            }
          }}
          onUpscaleItem={(index) => {
            const item = items[index];
            if (item) {
              onUpscaleGeneratedItem?.(item);
            }
          }}
        />
      </div>
    </section>
  );
}

function ToolLibraryCarousel({
  items,
  emptyTitle,
  emptyDescription,
  activeIndex,
  onActiveIndexChange,
}: {
  items: ToolEffectCarouselItem[];
  emptyTitle: string;
  emptyDescription: string;
  activeIndex: number;
  onActiveIndexChange: Dispatch<SetStateAction<number>>;
}) {
  const normalizedItems = useMemo(
    () =>
      items.filter(
        (item) => item.previewClipUrl || item.previewUrl || item.thumbnailUrl,
      ),
    [items],
  );
  const [isPaused, setIsPaused] = useState(false);
  const [generatedVideoAspectRatio, setGeneratedVideoAspectRatio] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (activeIndex < normalizedItems.length) {
      return;
    }

    onActiveIndexChange(0);
  }, [activeIndex, normalizedItems.length, onActiveIndexChange]);

  const activeItem = normalizedItems[activeIndex] || null;
  useEffect(() => {
    setGeneratedVideoAspectRatio(null);
  }, [activeItem?.id, activeItem?.previewClipUrl]);

  useEffect(() => {
    if (isPaused || normalizedItems.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      onActiveIndexChange((currentIndex) =>
        normalizedItems.length > 0
          ? (currentIndex + 1) % normalizedItems.length
          : 0,
      );
    }, 3600);

    return () => window.clearInterval(timer);
  }, [isPaused, normalizedItems.length, onActiveIndexChange]);

  if (!activeItem) {
    return (
      <section className={STUDIO_PANEL_CLASS_NAME}>
        <div className="flex h-full items-center justify-center overflow-hidden rounded-[16px] bg-white">
          <MangoPanelMessage
            icon={<Sparkles className="size-8" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      </section>
    );
  }

  const activePreviewImage =
    withOssImageMaxSide(
      activeItem.previewUrl || activeItem.thumbnailUrl || undefined,
      1280,
    ) ||
    activeItem.previewUrl ||
    activeItem.thumbnailUrl ||
    undefined;
  const activeReferenceImage =
    withOssImageMaxSide(activeItem.sourcePreviewUrl || undefined, 960) ||
    activeItem.sourcePreviewUrl;
  const displayTitle = dedupeTrailingRepeatedWords(activeItem.title);
  const isGeneratedVideo = activeItem.mediaType === "video";
  const resultPreviewImages = Array.isArray(activeItem.resultPreviewUrls)
    ? activeItem.resultPreviewUrls.filter(Boolean).slice(0, 4)
    : [];
  const hasResultPreviewGrid =
    !activeItem.previewClipUrl &&
    !isGeneratedVideo &&
    resultPreviewImages.length > 1;
  const stackedReferenceImages = Array.isArray(activeItem.referencePreviewUrls)
    ? activeItem.referencePreviewUrls.filter(Boolean).slice(0, 2)
    : activeReferenceImage
      ? [activeReferenceImage]
      : [];
  const hasDualReferenceImages = stackedReferenceImages.length > 1;
  const hasReferenceImages = stackedReferenceImages.length > 0;
  const generatedAspectRatio = isGeneratedVideo
    ? generatedVideoAspectRatio || 16 / 9
    : null;
  const isPortraitGeneratedVideo =
    isGeneratedVideo &&
    generatedAspectRatio !== null &&
    generatedAspectRatio < 1;
  const isGeneratedOnlyVideo = isGeneratedVideo && !hasReferenceImages;
  const generatedVideoMaxHeight = hasReferenceImages ? 520 : 560;
  const generatedPortraitVideoWidth =
    isPortraitGeneratedVideo && generatedAspectRatio
      ? Math.round(generatedVideoMaxHeight * generatedAspectRatio)
      : null;
  const generatedPreviewFrameClassName = cn(
    "w-full overflow-hidden rounded-[18px] bg-[#F8FAFC] shadow-[0_18px_44px_rgba(35,40,47,0.14)] sm:rounded-[22px]",
    isGeneratedVideo ? "mx-auto" : "aspect-[3/4]",
  );
  const generatedPreviewMediaClassName =
    "h-full w-full bg-[#F8FAFC] object-contain";
  const generatedColumnClassName = cn(
    "min-w-0 w-full flex-1",
    hasReferenceImages
      ? isGeneratedVideo
        ? isPortraitGeneratedVideo
          ? "max-w-[260px] sm:max-w-[320px] lg:max-w-[360px]"
          : "max-w-[360px] sm:max-w-[520px] lg:max-w-[660px]"
        : "max-w-[280px] sm:max-w-[440px]"
      : isPortraitGeneratedVideo
        ? "mx-auto max-w-[320px] sm:max-w-[380px]"
        : "mx-auto max-w-[320px] sm:max-w-[820px]",
  );

  return (
    <section
      className={STUDIO_PANEL_CLASS_NAME}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF6]">
        <div className="border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)] px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="text-[1rem] font-semibold text-[#23282F]">Examples</h3>
        </div>

        <div
          className={cn(
            "flex flex-1 items-center justify-center",
            isGeneratedOnlyVideo ? "p-2 sm:p-3" : "p-3 pb-4 sm:p-5 sm:pb-8",
          )}
        >
          <div className="contents">
            <div
              className={cn(
                "relative flex w-full flex-col items-center justify-center gap-3 sm:gap-6 lg:flex-row",
                isGeneratedVideo
                  ? isGeneratedOnlyVideo
                    ? "h-full max-w-[1080px] lg:gap-5"
                    : "max-w-[1020px] lg:gap-5"
                  : "max-w-[880px] lg:gap-8",
              )}
            >
              {hasReferenceImages ? (
                <>
                  <div
                    className={cn(
                      "flex w-full shrink-0 flex-col gap-3 sm:gap-5",
                      isGeneratedVideo
                        ? "max-w-[112px] sm:max-w-[144px]"
                        : "max-w-[128px] sm:max-w-[176px]",
                    )}
                  >
                    <div
                      className={cn(
                        "grid gap-4 sm:gap-5",
                        hasDualReferenceImages ? "grid-cols-1" : "grid-cols-1",
                      )}
                    >
                      {stackedReferenceImages.map((referenceImage, index) => (
                        <div key={`${referenceImage}-${index}`}>
                          <div className="mb-3 flex items-center justify-center">
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#23282F] shadow-[0_8px_20px_rgba(35,40,47,0.1)]">
                              {index === 0 ? "Ref" : "Face"}
                            </span>
                          </div>
                          <div className="overflow-hidden rounded-[24px] border border-[#F3E9BE] bg-white p-2 shadow-[0_12px_30px_rgba(122,86,0,0.08)] sm:rounded-[28px]">
                            <img
                              src={
                                withOssImageMaxSide(referenceImage, 720) ||
                                referenceImage
                              }
                              alt={`${displayTitle} ${index === 0 ? "reference" : "face"}`}
                              className="aspect-[3/4] w-full rounded-[18px] bg-[#F8FAFC] object-contain sm:rounded-[22px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full bg-[#23282F] text-white shadow-[0_10px_24px_rgba(35,40,47,0.18)]",
                      isGeneratedVideo
                        ? "h-9 w-9 sm:h-10 sm:w-10"
                        : "h-10 w-10 sm:h-11 sm:w-11",
                    )}
                  >
                    <ArrowRight
                      className={cn(
                        "rotate-90 lg:rotate-0",
                        isGeneratedVideo ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5",
                      )}
                    />
                  </div>
                </>
              ) : null}

              <div
                className={cn(
                  generatedColumnClassName,
                  isGeneratedOnlyVideo ? "flex h-full flex-col" : null,
                )}
              >
                <div className="mb-3 flex items-center justify-center lg:justify-start">
                  <span className="rounded-full bg-[#23282F] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_20px_rgba(35,40,47,0.16)]">
                    Result
                  </span>
                </div>
                <div
                  className={cn(
                    "overflow-visible",
                    isGeneratedOnlyVideo
                      ? "flex min-h-0 flex-1 items-center"
                      : null,
                  )}
                >
                  <div
                    className={cn("relative", generatedPreviewFrameClassName)}
                    style={
                      generatedAspectRatio
                        ? {
                            aspectRatio: generatedAspectRatio,
                            maxHeight: `${generatedVideoMaxHeight}px`,
                            width: generatedPortraitVideoWidth
                              ? `min(100%, ${generatedPortraitVideoWidth}px)`
                              : undefined,
                          }
                        : undefined
                    }
                  >
                    {hasResultPreviewGrid ? (
                      <div className="grid h-full w-full grid-cols-2 gap-1.5 bg-[#F8FAFC] p-1.5 sm:gap-2 sm:p-2">
                        {resultPreviewImages.map((imageUrl, index) => (
                          <img
                            key={`${imageUrl}-${index}`}
                            src={withOssImageMaxSide(imageUrl, 720) || imageUrl}
                            alt={`${displayTitle} angle ${index + 1}`}
                            className="h-full min-h-0 w-full rounded-[12px] bg-white object-cover sm:rounded-[16px]"
                          />
                        ))}
                      </div>
                    ) : activeItem.previewClipUrl ? (
                      <video
                        src={activeItem.previewClipUrl}
                        poster={activePreviewImage}
                        className={generatedPreviewMediaClassName}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(event) => {
                          const video = event.currentTarget;
                          if (video.videoWidth > 0 && video.videoHeight > 0) {
                            setGeneratedVideoAspectRatio(
                              video.videoWidth / video.videoHeight,
                            );
                          }
                        }}
                      />
                    ) : activePreviewImage ? (
                      <img
                        src={activePreviewImage}
                        alt={displayTitle}
                        className={generatedPreviewMediaClassName}
                      />
                    ) : (
                      <div className="h-full w-full bg-[#EEF4FB]" />
                    )}
                    {isGeneratedVideo ? (
                      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#23282F] shadow-[0_10px_24px_rgba(35,40,47,0.18)] backdrop-blur">
                        <Play className="h-4 w-4 fill-current" />
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(35,40,47,0)_0%,rgba(35,40,47,0.78)_100%)] px-3 pb-3 pt-12 sm:px-4 sm:pb-4">
                      <div className="inline-flex max-w-full rounded-[14px] bg-white/14 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-md">
                        <p className="line-clamp-2 text-[0.9rem] font-semibold leading-5 text-white sm:text-[1rem]">
                          {displayTitle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
