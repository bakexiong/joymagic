/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

import { CompanyOverview } from "@/shared/blocks/company/company-overview";
import { envConfigs } from "@/config";
import { Link } from "@/core/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

import {
  homepageEffectTags,
  homepageImageEffects,
  homepageScenarioPaths,
  homepageTabs,
  homepageVideoEffects,
} from "./static-tool-previews";
import type { HomeTabId, PreviewCard } from "./types";

function ToolPreviewCard({ item }: { item: PreviewCard }) {
  const t = useTranslations("landing.homeStudio.mangoHomepage.cards");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaPoster = item.imageSrc;
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setSupportsHover(mediaQuery.matches);

    update();
    mediaQuery.addEventListener?.("change", update);

    return () => {
      mediaQuery.removeEventListener?.("change", update);
    };
  }, []);

  const handlePlayVideo = async () => {
    if (!videoRef.current || item.mediaType !== "video" || !supportsHover)
      return;
    await videoRef.current.play().catch(() => undefined);
  };

  const handlePauseVideo = () => {
    if (!videoRef.current || item.mediaType !== "video" || !supportsHover)
      return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  useEffect(() => {
    if (!videoRef.current || item.mediaType !== "video") return;

    if (supportsHover) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      return;
    }

    videoRef.current.play().catch(() => undefined);
  }, [item.mediaType, item.videoSrc, supportsHover]);

  return (
    <Link
      href={item.href}
      aria-label={t(`${item.copyKey}.title`)}
      className="group block min-w-[82vw] snap-start cursor-pointer overflow-hidden rounded-[1.35rem] border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)] md:min-w-0 md:rounded-[1.65rem] md:shadow-[0_12px_28px_rgba(0,0,0,0.05)]"
    >
      <article>
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(180deg,rgba(244,245,249,0.96),rgba(232,235,242,0.92))] md:aspect-[5/6]"
          onMouseEnter={handlePlayVideo}
          onMouseLeave={handlePauseVideo}
        >
          <div
            aria-hidden="true"
            style={{ backgroundImage: `url(${mediaPoster})` }}
            className="absolute inset-0 h-full w-full scale-105 bg-cover bg-center blur-3xl opacity-18"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.18))]" />
          <div className="relative z-10 flex h-full items-center justify-center p-2 sm:p-3">
            {item.mediaType === "video" ? (
              <video
                ref={videoRef}
                src={item.videoSrc}
                poster={item.imageSrc}
                muted
                loop
                playsInline
                autoPlay={!supportsHover}
                preload="metadata"
                className="h-full w-full rounded-[0.9rem] object-contain"
              />
            ) : (
              <img
                src={item.imageSrc}
                alt={t(`${item.copyKey}.title`)}
                className="h-full w-full rounded-[0.9rem] object-contain"
              />
            )}
          </div>
        </div>
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold tracking-[-0.03em] md:text-xl">
            {t(`${item.copyKey}.title`)}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60 md:mt-3 md:leading-7">
            {t(`${item.copyKey}.description`)}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-black md:mt-5">
            {t("openTool")}
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function MangoHomepage() {
  const t = useTranslations("landing.homeStudio.mangoHomepage");
  const [activeTab, setActiveTab] = useState<HomeTabId>(
    homepageTabs[0]?.id || "video-tools",
  );
  const activeTabConfig =
    homepageTabs.find((tab) => tab.id === activeTab) || homepageTabs[0];
  const brandName = envConfigs.app_name || "Barko Bear";
  const locale = useLocale();

  return (
    <div className="mango-homepage bg-[#fff8df] text-[#171717] [font-family:'Avenir_Next','Segoe_UI',sans-serif]">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7ca3f_0%,#f7ca3f_42%,#fff8df_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,168,103,0.18),transparent_22%)]" />

        <div className="relative mx-auto max-w-[1320px] px-4 pb-12 pt-10 text-center sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2 text-sm font-semibold text-black/72 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Barko Bear LLC ·{" "}
            {locale.startsWith("zh") ? "公开测试" : "Public beta"}
          </div>

          <h1 className="mx-auto mt-6 max-w-[980px] text-balance text-[2.35rem] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[4.2rem] lg:text-[5.15rem]">
            AI image and video creation by Barko Bear
          </h1>

          <p className="mx-auto mt-5 max-w-[1100px] px-2 text-sm leading-7 text-black/72 sm:text-[1.5rem] sm:leading-[2.8rem]">
            {brandName} helps you create AI images, AI videos, image-to-video
            clips, photo edits, background removal, upscales, portraits, and ad
            creatives from one browser workspace.
          </p>

          <div className="mx-auto mt-10 max-w-[980px] rounded-[1.6rem] bg-[#efeff4] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.05)] md:rounded-full">
            <div className="flex gap-2 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible">
              {homepageTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={
                    activeTab === tab.id
                      ? "min-w-max cursor-pointer rounded-full bg-[linear-gradient(90deg,#7d68ff_0%,#43b5ff_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(95,113,255,0.24)] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 md:min-w-0"
                      : "min-w-max cursor-pointer rounded-full px-4 py-3 text-sm font-semibold text-black/62 transition-colors duration-200 hover:bg-white hover:text-black outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 md:min-w-0"
                  }
                >
                  {t(`tabs.${tab.id}.label`)}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 px-2 text-sm leading-6 text-black/60 sm:text-base">
            {activeTabConfig ? t(activeTabConfig.descriptionKey) : ""}
          </p>

          <p className="mt-5 text-xs text-black/60">
            {locale.startsWith("zh")
              ? "以下为工具用途示意。测试访问视可用额度及容量而定，支付尚未开放。"
              : "Illustrative workflow previews. Beta access depends on available allowances and capacity. Payments have not launched."}
          </p>

          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
            {activeTabConfig?.cards.map((item) => (
              <ToolPreviewCard
                key={`${activeTab}-${item.copyKey}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>
      <CompanyOverview locale={locale} />

      <section className="bg-[#fff8df] px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[820px]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7d68ff]">
                Creation workflows
              </p>
              <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.05em] sm:text-[2.7rem]">
                Choose a workflow for your next project
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-7 text-black/62 sm:text-base">
              Explore image generation, editing, background removal, upscaling,
              and video tools in one place.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {homepageScenarioPaths.map((scenario) => (
              <Link
                key={scenario.intent}
                href={scenario.href}
                className="group rounded-[1.35rem] border border-black/10 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.045)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.075)] md:px-6 md:py-6"
              >
                <article>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                    {scenario.intent}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-black md:text-2xl">
                    {scenario.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-black/62">
                    {scenario.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-black">
                    Open workflow
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-[760px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff8a57]">
              {t("sections.imageEffects.eyebrow")}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.05em] sm:text-[2.7rem]">
              {t("sections.imageEffects.title")}
            </h2>
          </div>

          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
            {homepageImageEffects.map((item) => (
              <ToolPreviewCard
                key={`image-effect-${item.copyKey}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff4c8] px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-[760px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#43b5ff]">
              {t("sections.videoEffects.eyebrow")}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.05em] sm:text-[2.7rem]">
              {t("sections.videoEffects.title")}
            </h2>
          </div>

          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
            {homepageVideoEffects.map((item) => (
              <ToolPreviewCard
                key={`video-effect-${item.copyKey}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-[760px]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7d68ff]">
              {t("sections.popularPaths.eyebrow")}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.05em] sm:text-[2.7rem]">
              {t("sections.popularPaths.title")}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
            {homepageEffectTags.map((tag) => (
              <Link
                key={tag.labelKey}
                href={tag.href}
                className="rounded-[1rem] border border-black/10 bg-white px-4 py-3 text-center text-sm font-medium text-black/72 shadow-[0_8px_18px_rgba(0,0,0,0.04)] transition-colors duration-200 hover:bg-black hover:text-white sm:px-5"
              >
                {t(`cards.${tag.labelKey}.title`)}
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-[1.6rem] bg-[#f7ca3f] px-5 py-7 sm:mt-12 sm:rounded-[2rem] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[760px]">
                <h3 className="text-xl font-semibold tracking-[-0.04em] sm:text-[2.1rem]">
                  {t("cta.title")}
                </h3>
                <p className="mt-3 text-sm leading-7 text-black/66 sm:text-base sm:leading-8">
                  {t("cta.description")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/text-to-image"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white sm:h-14 sm:px-7"
                >
                  {t("cta.openImageWorkspace")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/tools/text-to-video"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-black/12 bg-white px-6 text-sm font-semibold text-black/82 sm:h-14 sm:px-7"
                >
                  {t("cta.openVideoWorkspace")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
