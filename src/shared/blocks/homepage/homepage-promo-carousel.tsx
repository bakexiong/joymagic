"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "@/core/i18n/navigation";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  type MobileHomepageBannerSlide,
} from "@/shared/lib/mobile-homepage";
import { cn } from "@/shared/lib/utils";

type HomepagePromoCarouselProps = {
  slides: MobileHomepageBannerSlide[];
  className?: string;
};

function getSafeSlide(
  slides: MobileHomepageBannerSlide[],
  index: number,
): MobileHomepageBannerSlide {
  return slides[((index % slides.length) + slides.length) % slides.length];
}

function PromoMedia({
  slide,
  sizes,
  contain = false,
  containVideo = false,
  shouldPlayVideo = false,
}: {
  slide: MobileHomepageBannerSlide;
  sizes: string;
  contain?: boolean;
  containVideo?: boolean;
  shouldPlayVideo?: boolean;
}) {
  const [activeVideoSrc, setActiveVideoSrc] = useState(
    slide.videoSrc || "",
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setActiveVideoSrc(slide.videoSrc || "");
  }, [slide.videoSrc]);

  useEffect(() => {
    if (!shouldPlayVideo || !activeVideoSrc || !videoRef.current) return;

    const video = videoRef.current;
    let cancelled = false;

    const tryPlay = async () => {
      try {
        const playPromise = video.play();
        if (playPromise) {
          await playPromise;
        }
      } catch {
        // 静默降级：保留 poster，不阻断首页展示
      }
    };

    // 等 DOM 和动画状态稳定后再尝试播放，避免切换瞬间失效
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void tryPlay();
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      video.pause();
    };
  }, [shouldPlayVideo, activeVideoSrc]);

  if (activeVideoSrc) {
    return (
      <video
        key={activeVideoSrc}
        ref={videoRef}
        src={activeVideoSrc}
        autoPlay={shouldPlayVideo}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        onError={() => {
          // 视频资源失效时退回静态图，避免持续黑块。
          setActiveVideoSrc("");
        }}
        className={cn(
          "absolute inset-0 h-full w-full",
          containVideo ? "object-contain" : "object-cover",
        )}
      />
    );
  }

  return (
    <img
      src={slide.imageSrc}
      alt={slide.imageAlt || slide.title || "Featured launch"}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={cn(
        "absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.025]",
        contain ? "object-contain" : "object-cover",
      )}
    />
  );
}

function shouldContainSlide(_slide: MobileHomepageBannerSlide, isPrimary: boolean) {
  return !isPrimary;
}

function PromoTitle({
  slide,
  primary = false,
}: {
  slide: MobileHomepageBannerSlide;
  primary?: boolean;
}) {
  const title = slide.title || "Featured launch";
  const highlight = slide.titleHighlight?.trim();
  const isPromoHighlight = slide.id === "happyhorse-coming-soon" && highlight;

  return (
    <div
      className={cn(
        "max-w-[85%] text-balance font-semibold tracking-[-0.04em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
        primary
          ? "text-[1.1rem] leading-[1.15] lg:text-[1.25rem]"
          : "text-[0.92rem] leading-[1.18]",
      )}
    >
      <span>{title}</span>
      {highlight ? (
        <span
          className={cn(
            "ml-2 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-[0.72em] font-black tracking-[0.04em]",
            isPromoHighlight
              ? "bg-[#ffd54a] text-black shadow-[0_8px_24px_rgba(255,213,74,0.35)]"
              : "bg-white/18 text-white backdrop-blur-md",
          )}
        >
          {highlight}
        </span>
      ) : null}
    </div>
  );
}

function getPromoToolsHref(slide: MobileHomepageBannerSlide): string {
  const normalizeSceneKey = (value?: string) =>
    value
      ?.trim()
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean)
      .join("/") || "";

  const normalizeModelKey = (value?: string) => {
    const normalized = value?.trim().replace(/^\/+/, "") || "";
    if (!normalized) return "";
    const parts = normalized.split("/").filter(Boolean);
    return parts.at(-1) || "";
  };

  const sceneKey = normalizeSceneKey(slide.sceneId);
  const modelKey = normalizeModelKey(slide.modelId);

  if (sceneKey && modelKey) {
    return `/tools/${sceneKey}~${modelKey}`;
  }

  if (sceneKey) {
    return `/tools/${sceneKey}`;
  }

  const normalizedHref = slide.href?.trim() || "";
  if (!normalizedHref) {
    return "/tools/text-to-image";
  }

  const parts = normalizedHref.split("?")[0].split("/").filter(Boolean);
  if (parts.length >= 2) {
    return `/tools/${parts.slice(0, -1).join("/")}`;
  }

  if (parts.length === 1) {
    return `/tools/${parts[0]}`;
  }

  return "/tools/text-to-image";
}

export function HomepagePromoCarousel({
  slides,
  className,
}: HomepagePromoCarouselProps) {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [allowVideoPlayback, setAllowVideoPlayback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const enablePlayback = () => {
      if (!cancelled) {
        setAllowVideoPlayback(true);
      }
    };

    if (document.readyState === "complete") {
      timeoutId = window.setTimeout(enablePlayback, 250);
    } else {
      const handleLoad = () => {
        timeoutId = window.setTimeout(enablePlayback, 250);
      };
      window.addEventListener("load", handleLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", handleLoad);
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const promoSlides = useMemo<MobileHomepageBannerSlide[]>(() => {
    const withDirectPoster = (
      slide: MobileHomepageBannerSlide,
      videoSrc?: string,
    ): MobileHomepageBannerSlide => {
      if (!videoSrc) {
        return slide;
      }

      return {
        ...slide,
        videoSrc,
      };
    };

    const seedanceSlide: MobileHomepageBannerSlide = {
      id: "seedance-2-0-launch",
      title: "SEEDANCE 2.0 IS HERE",
      imageSrc:
        "https://ocdn.10b.ai/homepage/slides/seedance-2-0/image_1775232342615_987423.mp4?x-oss-process=video/snapshot,t_1000,f_jpg,w_1400,h_800,m_fast,q_80",
      imageAlt: "Seedance 2.0 launch",
      videoSrc:
        "https://ocdn.10b.ai/homepage/slides/seedance-2-0/image_1775232342615_987423.mp4",
      href: "/text-to-video/seedance-2-0",
      modelId: "/text-to-video/seedance-2-0",
      sceneId: "/text-to-video",
      badge: "New",
    };

    const desktopSlides = slides.map((slide) =>
      slide.id === "gpt-image-1"
        ? withDirectPoster(slide, "https://ocdn.10b.ai/icon/gpt-image-1.mp4")
        : slide.id === "nanobanana-2"
          ? withDirectPoster(slide, "http://ocdn.10b.ai/icon/nano-banana-2.mp4")
          : slide.id === "midjourney"
            ? withDirectPoster(slide, "https://ocdn.10b.ai/icon/midjounery1.mp4")
            : slide.id === "seedream-5-0-lite"
              ? withDirectPoster(
                  slide,
                  "https://ocdn.10b.ai/icon/seedream-5-0-lite.mp4",
                )
              : slide.id === "soul"
                ? withDirectPoster(slide, "https://ocdn.10b.ai/icon/soul1.mp4")
                : slide.id === "qwen-image-202512"
                  ? withDirectPoster(
                      slide,
                      "https://ocdn.10b.ai/icon/qwen-image-202512.mp4",
                    )
                  : slide,
    );

    const filtered = desktopSlides.filter(
      (slide) => slide.id !== "seedance-2-0-launch",
    );
    const happyHorseSlide = filtered.find(
      (slide) => slide.id === "happyhorse-coming-soon",
    );
    const gptImage2Slide = filtered.find((slide) => slide.id === "gpt-image-2");
    const remainingSlides = filtered.filter(
      (slide) =>
        slide.id !== "happyhorse-coming-soon" && slide.id !== "gpt-image-2",
    );

    return [
      ...(happyHorseSlide ? [happyHorseSlide] : []),
      ...(gptImage2Slide ? [gptImage2Slide] : []),
      seedanceSlide,
      ...remainingSlides,
    ];
  }, [slides]);

  if (!promoSlides.length) return null;

  const canLoop = promoSlides.length > 1;
  const visibleSlides = useMemo(() => {
    const count = Math.min(3, promoSlides.length);
    return Array.from({ length: count }, (_, offset) =>
      getSafeSlide(promoSlides, activeIndex + offset),
    );
  }, [activeIndex, promoSlides]);

  return (
    <section className={cn("relative px-5 xl:px-6", className)}>
      <div className="relative h-[260px] sm:h-[210px] xl:h-[228px]">
        {isMobile ? (
          <AnimatePresence mode="sync" initial={false} custom={direction}>
            <motion.div
              key={`mobile-${activeIndex}`}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 26 : -26 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -18 : 18 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {(() => {
                const slide = getSafeSlide(promoSlides, activeIndex);
                return (
                  <Link
                    href={getPromoToolsHref(slide)}
                    prefetch={false}
                    className="group relative block h-full overflow-hidden rounded-[1.6rem] border border-[color:var(--color-frost-border)] bg-[#09090b] shadow-[var(--shadow-ring-frost)]"
                  >
                    <PromoMedia
                      slide={slide}
                      contain={shouldContainSlide(slide, true)}
                      containVideo={false}
                      sizes="100vw"
                      shouldPlayVideo={allowVideoPlayback}
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18%,transparent_82%,rgba(255,255,255,0.015))]" />

                    {slide.badge && (
                      <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/12 bg-black/38 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/82 backdrop-blur-md">
                        {slide.badge}
                      </div>
                    )}

                    <div className="absolute inset-x-5 bottom-5">
                      <h4 className="text-[1.5rem] leading-[1.02] tracking-[-0.05em]">
                        <PromoTitle slide={slide} primary />
                      </h4>

                      <div className="mt-3 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-[0.9rem] font-medium text-white backdrop-blur-md">
                        Try now
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className="absolute inset-0 grid-cols-[1.78fr_1fr_1fr] gap-4 sm:grid"
            key={`desktop-${activeIndex}`}
          >
            {visibleSlides.map((slide, index) => {
              const isPrimary = index === 0;
              const containMedia = shouldContainSlide(slide, isPrimary);
              return (
                <motion.div
                  key={`${slide.id || slide.title || index}-${activeIndex}-${index}`}
                  initial={{ opacity: 0.72, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.34,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={getPromoToolsHref(slide)}
                    prefetch={false}
                    className={cn(
                      "group relative block h-full overflow-hidden rounded-[1.6rem] border border-[color:var(--color-frost-border)] bg-[#09090b] shadow-[var(--shadow-ring-frost)]",
                    )}
                  >
                    <PromoMedia
                      slide={slide}
                      contain={containMedia}
                      containVideo={false}
                      sizes={
                        isPrimary
                          ? "(max-width: 1536px) 46vw, 680px"
                          : "(max-width: 1536px) 22vw, 320px"
                      }
                      shouldPlayVideo={allowVideoPlayback}
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_18%,transparent_82%,rgba(255,255,255,0.015))]" />

                    {slide.badge && (
                      <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/12 bg-black/38 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/82 backdrop-blur-md">
                        {slide.badge}
                      </div>
                    )}

                    <div
                      className={cn(
                        "absolute inset-x-5 bottom-5",
                        !isPrimary && "inset-x-4 bottom-4",
                      )}
                    >
                      <h4>
                        <PromoTitle slide={slide} primary={isPrimary} />
                      </h4>

                      <div className="mt-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1.5 text-[0.82rem] font-medium text-white backdrop-blur-md">
                        {index === 0 ? "Try now" : "Explore"}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0">
          <button
            type="button"
            onClick={() => {
              setDirection(-1);
              setActiveIndex((prev) => prev - 1);
            }}
            disabled={!canLoop}
            className={cn(
              "pointer-events-auto absolute -left-5 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-frost-border)] bg-black/72 text-white/82 backdrop-blur-xl transition-all duration-200",
              canLoop
                ? "hover:scale-[1.03] hover:bg-black/72"
                : "cursor-not-allowed opacity-40",
            )}
            aria-label="Previous promo"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection(1);
              setActiveIndex((prev) => prev + 1);
            }}
            disabled={!canLoop}
            className={cn(
              "pointer-events-auto absolute -right-5 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-frost-border)] bg-black/72 text-white/82 backdrop-blur-xl transition-all duration-200",
              canLoop
                ? "hover:scale-[1.03] hover:bg-black/72"
                : "cursor-not-allowed opacity-40",
            )}
            aria-label="Next promo"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
