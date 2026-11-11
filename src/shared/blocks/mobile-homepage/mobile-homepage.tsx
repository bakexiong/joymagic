"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  memo,
  Suspense,
} from "react";
import {
  ArrowRight,
  Clapperboard,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/core/i18n/navigation";
import { Button } from "@/shared/components/ui/button";
import { MediaCard, MediaItem } from "@/shared/blocks/explore/media-card";
import { HomepagePromoCarousel } from "@/shared/blocks/homepage";
import { HomepageSuiteVertical } from "@/shared/blocks/homepage-suite/homepage-suite-vertical";
import { getImageEffectItemsSync } from "@/shared/lib/image-effect-data";
import { withOssImageMaxSide } from "@/shared/lib/cdn";
import {
  MobileHomepageConfig,
  type MobileHomepageShowcaseGroup,
} from "@/shared/lib/mobile-homepage";
import { getVideoEffectItemsSync } from "@/shared/lib/video-effect-data";
import { cn } from "@/shared/lib/utils";
import { Hero as HeroType } from "@/shared/types/blocks/landing";
import type { NavItem } from "@/shared/types/blocks/common";

const MediaDetailModal = lazy(() =>
  import("@/shared/blocks/explore/media-detail-modal").then((mod) => ({
    default: mod.MediaDetailModal,
  })),
);

type EffectEntry = {
  id: string;
  title: string;
  href: string;
  mediaType: "image" | "video";
  mediaSrc?: string;
  mediaPoster?: string;
  aspectRatio?: string;
};

const EFFECT_VIDEO_CONCURRENCY = 2;
let activeEffectVideoLoads = 0;
const pendingEffectVideoLoads: Array<() => void> = [];

function acquireEffectVideoSlot(onReady: () => void) {
  if (activeEffectVideoLoads < EFFECT_VIDEO_CONCURRENCY) {
    activeEffectVideoLoads += 1;
    onReady();
    return () => {
      activeEffectVideoLoads = Math.max(0, activeEffectVideoLoads - 1);
      const next = pendingEffectVideoLoads.shift();
      if (next) {
        activeEffectVideoLoads += 1;
        next();
      }
    };
  }

  pendingEffectVideoLoads.push(onReady);

  return () => {
    const index = pendingEffectVideoLoads.indexOf(onReady);
    if (index >= 0) {
      pendingEffectVideoLoads.splice(index, 1);
      return;
    }

    activeEffectVideoLoads = Math.max(0, activeEffectVideoLoads - 1);
    const next = pendingEffectVideoLoads.shift();
    if (next) {
      activeEffectVideoLoads += 1;
      next();
    }
  };
}

const frostBorderClassName =
  "border border-[rgba(214,235,253,0.19)] shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px]";

function parseAspectRatio(aspectRatio?: string) {
  if (!aspectRatio) return "4 / 5";
  const [width, height] = aspectRatio.split("/").map((value) => Number(value.trim()));
  if (!width || !height) return "4 / 5";
  return `${width} / ${height}`;
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
        rootMargin: "280px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

const ShowcaseCard = memo(
  function ShowcaseCard({
    item,
    onClick,
  }: {
    item: MediaItem;
    onClick?: (item: MediaItem) => void;
  }) {
    const isInteractive = item.type !== "audio" && Boolean(onClick);
    const aspectRatio =
      item.aspectRatio ||
      (item.height && item.width ? item.height / item.width : 1);
    const cssAspectRatio = 1 / aspectRatio;

    return (
      <div className="mb-3 w-full break-inside-avoid">
        <div
          className={cn(
            "overflow-hidden rounded-[1.05rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)]",
            frostBorderClassName,
          )}
          style={{ aspectRatio: cssAspectRatio.toString() }}
        >
          <MediaCard
            item={item}
            onClick={isInteractive ? onClick : undefined}
            disableImageOptimization
            className="h-full w-full rounded-[1rem] border-white/0"
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.item.id === nextProps.item.id,
);

function EffectMasonryCard({ item }: { item: EffectEntry }) {
  const { ref, isVisible } = useDeferredVisibility();
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const hasVideoSlotRef = useRef(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const previewImageSrc =
    item.mediaPoster || withOssImageMaxSide(item.mediaSrc, 900);

  useEffect(() => {
    if (item.mediaType !== "video" || !item.mediaSrc || !isVisible || hasVideoSlotRef.current) {
      return;
    }

    releaseSlotRef.current = acquireEffectVideoSlot(() => {
      hasVideoSlotRef.current = true;
      setShouldLoadVideo(true);
    });
  }, [item.mediaType, item.mediaSrc, isVisible]);

  useEffect(() => {
    if (isVisible) return;

    setShouldLoadVideo(false);
    if (releaseSlotRef.current) {
      const release = releaseSlotRef.current;
      releaseSlotRef.current = null;
      hasVideoSlotRef.current = false;
      release();
    }
  }, [isVisible]);

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
    <Link
      href={item.href}
      className={cn(
        "group relative mb-3 block break-inside-avoid overflow-hidden rounded-[1.1rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_100%)]",
        "transition-all duration-300 hover:bg-white/[0.055]",
        frostBorderClassName,
      )}
    >
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[1rem] bg-white/[0.03]"
        style={{ aspectRatio: parseAspectRatio(item.aspectRatio) }}
      >
        {item.mediaType === "video" && item.mediaSrc && shouldLoadVideo ? (
          <video
            src={item.mediaSrc}
            poster={item.mediaPoster}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
          />
        ) : previewImageSrc ? (
          <img
            src={previewImageSrc}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-white/5" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/24 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-[0.95rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  actionLabel,
}: {
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[1.2rem] font-semibold leading-none tracking-[-0.03em] text-white">
        {title}
      </h2>
      {href && actionLabel ? (
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-medium text-white/72 transition-colors duration-200 hover:text-white",
            frostBorderClassName,
          )}
        >
          <span>{actionLabel}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function flattenShowcaseGroups(showcaseGroups: MobileHomepageShowcaseGroup[]) {
  return showcaseGroups.flatMap((group) => group.items);
}

export function MobileHomepage({
  hero,
  config,
  sectionClassName,
  headerNavItems,
}: {
  hero: HeroType;
  config: MobileHomepageConfig;
  sectionClassName?: string;
  headerNavItems?: NavItem[];
}) {
  const t = useTranslations("explore.mobile_homepage");
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allItems = useMemo(
    () => flattenShowcaseGroups(config.showcaseGroups),
    [config.showcaseGroups],
  );
  const imageEffectItems = useMemo(
    () =>
      getImageEffectItemsSync()
        .slice(0, 8)
        .map((item) => ({
          id: `image-effect-${item.id}`,
          title: item.title,
          href: `/ai-effect/image?effect=${item.slug}`,
          mediaType: "image" as const,
          mediaSrc: item.previewExample?.outputImageUrl || item.coverUrl,
          aspectRatio: item.aspectRatio,
        })),
    [],
  );
  const videoEffectItems = useMemo(
    () =>
      getVideoEffectItemsSync()
        .slice(0, 8)
        .map((item) => ({
          id: `video-effect-${item.id}`,
          title: item.title,
          href: `/ai-effect/video?effect=${item.slug}`,
          mediaType: "video" as const,
          mediaSrc: item.samplePreviewClipUrl || item.sampleVideoUrl,
          mediaPoster: item.coverUrl,
          aspectRatio: item.aspectRatio,
        })),
    [],
  );

  const handleItemClick = useCallback((item: MediaItem) => {
    if (item.type === "audio") {
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleRecreate = useCallback(
    (item: MediaItem) => {
      if (item.prompt) {
        sessionStorage.setItem("creator-initial-prompt", item.prompt);
      }
      if (item.parameters && Object.keys(item.parameters).length > 0) {
        sessionStorage.setItem("creator-initial-params", JSON.stringify(item.parameters));
      }
      router.push(item.generateUrl || "/creator");
    },
    [router],
  );

  return (
    <>
      <section
        className={cn(
          "overflow-hidden bg-[#050505] px-2 pb-12 text-white",
          sectionClassName,
        )}
      >
        <div className="relative mx-auto flex w-full max-w-none flex-col gap-6">
          <div className="absolute inset-x-[-18%] top-[-7rem] h-52 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.05)_32%,rgba(255,255,255,0)_72%)] opacity-60 blur-3xl" />

          <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/creator"
                  prefetch={false}
                  className={cn(
                    "group relative flex min-h-[126px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.065)_0%,rgba(255,255,255,0.025)_100%)] p-4 transition-all duration-200 hover:bg-white/[0.08]",
                    frostBorderClassName,
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-black shadow-[0_14px_26px_-18px_rgba(255,255,255,0.75)]">
                    <WandSparkles className="size-4.5" />
                  </div>
                  <p className="text-[1rem] font-semibold leading-tight text-white">
                    {t("create_image")}
                  </p>
                </Link>

                <Link
                  href="/creator?scene=text-to-video&model=seedance-1-5-pro"
                  prefetch={false}
                  className={cn(
                    "group relative flex min-h-[126px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-4 transition-all duration-200 hover:bg-white/[0.08]",
                    frostBorderClassName,
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/10 text-white">
                    <Clapperboard className="size-4.5" />
                  </div>
                  <p className="text-[1rem] font-semibold leading-tight text-white">
                    {t("create_video")}
                  </p>
                </Link>

                <Link
                  href="/ai-effect"
                  prefetch={false}
                  className={cn(
                    "relative col-span-2 flex min-h-[112px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.02)_100%)] p-4 transition-all duration-200 hover:bg-white/[0.08]",
                    frostBorderClassName,
                  )}
                >
                  <div className="absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,rgba(17,255,153,0.18)_0%,rgba(17,255,153,0)_72%)]" />
                  <span className="inline-flex w-fit items-center rounded-full bg-[#11FF99] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    {t("new_badge")}
                  </span>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[1rem] font-semibold leading-tight text-white">
                      {t("ai_effect")}
                    </p>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white/10 text-white">
                      <Sparkles className="size-4.5" />
                    </div>
                  </div>
                </Link>
          </div>

          <HomepagePromoCarousel
            slides={config.bannerSlides}
            className="!px-0"
          />

          <div
            className={cn(
              "overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)]",
            )}
          >
            <HomepageSuiteVertical headerNavItems={headerNavItems ?? []} />
          </div>

          {imageEffectItems.length > 0 ? (
            <section>
              <SectionHeader
                title="Image Effects"
                href="/ai-effect?tab=image"
                actionLabel={t("view_all")}
              />
              <div className="columns-2 gap-3 [column-fill:_balance]">
                {imageEffectItems.map((item) => (
                  <EffectMasonryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {videoEffectItems.length > 0 ? (
            <section>
              <SectionHeader
                title="Video Effects"
                href="/ai-effect?tab=video"
                actionLabel={t("view_all")}
              />
              <div className="columns-2 gap-3 [column-fill:_balance]">
                {videoEffectItems.map((item) => (
                  <EffectMasonryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {allItems.length > 0 ? (
            <section>
              <SectionHeader title="Inspirations" />
              <div className="columns-2 gap-3 [column-fill:_balance]">
                {allItems.map((item) => (
                  <ShowcaseCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
              {config.showcaseGroups[0]?.viewAllHref ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-10 rounded-full bg-white/[0.04] px-5 text-[0.82rem] text-white hover:bg-white/[0.08]",
                      frostBorderClassName,
                    )}
                  >
                    <Link href={config.showcaseGroups[0].viewAllHref} prefetch={false}>
                      {t("view_more")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {(hero.title || hero.description) ? (
            <section
              className={cn(
                "overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.015)_100%)] p-5",
                frostBorderClassName,
              )}
            >
              <div className="space-y-2">
                {hero.title ? (
                  <h1 className="text-[1.7rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[#f0f0f0]">
                    {hero.title}
                  </h1>
                ) : null}
                {hero.description ? (
                  <p className="text-[0.95rem] leading-6 text-[#a1a4a5]">
                    {hero.description}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {isModalOpen ? (
        <Suspense fallback={null}>
          <MediaDetailModal
            item={selectedItem}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onRecreate={handleRecreate}
          />
        </Suspense>
      ) : null}
    </>
  );
}
