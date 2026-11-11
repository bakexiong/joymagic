"use client";

import { Sparkles } from "lucide-react";
import { Link } from "@/core/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "next-intl";
import {
  getBannerHref,
  type MobileHomepageBannerSlide,
} from "@/shared/lib/mobile-homepage";

type ModelShowcaseBannerProps = {
  slides: MobileHomepageBannerSlide[];
  heroTitle: string;
  className?: string;
};

type SeedancePromoBannerProps = {
  className?: string;
  compact?: boolean;
};

export function SeedancePromoBanner({
  className,
  compact = false,
}: SeedancePromoBannerProps) {
  const tAnnouncement = useTranslations("landing.wavespeed.homepageAnnouncement");
  const seedanceVideoSrc =
    "https://ocdn.10b.ai/banner/image_1775232342615_987423.mp4";
  const seedancePreviewVideoSrc =
    "https://ocdn.10b.ai/homepage/previews/8085e6775494bf494dc056bfedbbcb88.mp4";
  const tryNowHref = "/creator?scene=%2Ftext-to-video&model=seedance-2-0";

  if (compact) {
    return (
      <Link
        href={tryNowHref}
        className={cn(
          "group relative block overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] shadow-[0_16px_48px_rgba(0,0,0,0.28)]",
          className,
        )}
      >
        <video
          src={seedancePreviewVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          aria-label={tAnnouncement("videoLabel")}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.52)_42%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_28%,rgba(0,0,0,0.22)_100%)]" />

        <div className="relative flex min-h-[148px] flex-col justify-end gap-3 px-5 py-5 sm:min-h-[180px] sm:px-6 sm:py-6">
          <div className="max-w-[min(100%,42rem)]">
            <h3 className="text-pretty text-[1.65rem] font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-[2.2rem]">
              {tAnnouncement("title")}
            </h3>
          </div>

          <div className="inline-flex w-fit items-center justify-center rounded-full bg-white/28 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 group-hover:bg-white/36">
            {tAnnouncement("cta")}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={tryNowHref}
      className={cn(
        "group block overflow-hidden rounded-[24px] border border-cyan-300/20",
        "bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(168,85,247,0.24),transparent_36%),linear-gradient(135deg,rgba(8,15,30,0.98)_0%,rgba(9,20,38,0.96)_48%,rgba(19,53,94,0.94)_100%)]",
        "p-4 shadow-[0_24px_70px_rgba(2,6,23,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:shadow-[0_28px_80px_rgba(14,116,144,0.32)] sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            <Sparkles className="size-3.5 text-cyan-300" />
            <span>{tAnnouncement("badge")}</span>
          </div>
          <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {tAnnouncement("title")}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200/88 sm:text-[0.95rem]">
            {tAnnouncement("description")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-cyan-300/35 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 group-hover:border-cyan-200/55 group-hover:bg-white/12">
          <span>{tAnnouncement("cta")}</span>
          <span
            aria-hidden="true"
            className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

function ModelShowcaseTiles({
  slides,
  heroTitle,
  className,
}: {
  slides: MobileHomepageBannerSlide[];
  heroTitle: string;
  className?: string;
}) {
  const tModels = useTranslations("landing.wavespeed.aiModels");

  if (!slides?.length) return null;

  return (
    <div className={cn("relative z-10", className)}>
      <div className=" relative">
        <div className="mx-auto">
          <div className="mb-6">
            <div className="text-2xl font-semibold text-white">
              {tModels("title")}
            </div>
            <p className="mt-1 text-sm text-white/70">
              {tModels("subtitle")}
            </p>
          </div>
          {/* 为固定两排更均匀：7 张图在 lg/xl 下按 4 列布局（4 + 3） */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {slides.map((slide) => (
              <Link
                key={slide.id || slide.title}
                href={getBannerHref(slide)}
                prefetch={false}
                className={cn(
                  "group relative block overflow-hidden rounded-[18px] bg-white/[0.03]",
                  "transition-all duration-200 hover:bg-white/[0.06]"
                )}
                aria-label={slide.title ? String(slide.title) : "Model"}
              >
                {/* 卡片更大：进一步拉高比例，并使用 object-contain 避免裁剪展示完整图片 */}
                <div className="relative aspect-[16/9] w-full bg-black/5">
                  <img
                    src={slide.imageSrc}
                    alt={slide.imageAlt || heroTitle || "Model banner"}
                    className="absolute inset-0 h-full w-full object-contain transition duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-110"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* 顶部暗化 + 底部渐变（对齐 Ai Tools 卡片视觉，但不展示标题） */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* 悬停高亮层 */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModelShowcaseBanner({
  slides,
  heroTitle,
  className,
}: ModelShowcaseBannerProps) {
  return <ModelShowcaseTiles slides={slides} heroTitle={heroTitle} className={className} />;
}
