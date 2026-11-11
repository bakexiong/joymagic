"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/core/i18n/navigation";
import { HomepagePromoCarousel } from "@/shared/blocks/homepage";
import { getImageEffectItemsSync } from "@/shared/lib/image-effect-data";
import { withOssImageMaxSide, withOssImageResize } from "@/shared/lib/cdn";
import {
  getBannerHref,
  type MobileHomepageBannerSlide,
  type MobileHomepageShowcaseGroup,
} from "@/shared/lib/mobile-homepage";
import { landingSidebarRowCenteredCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { isStudioToolHidden } from "@/shared/lib/studio-tool-visibility";
import { cn } from "@/shared/lib/utils";
import { getVideoEffectItemsSync } from "@/shared/lib/video-effect-data";
import type { NavItem } from "@/shared/types/blocks/common";

type PcHomeStudioProps = {
  bannerSlides: MobileHomepageBannerSlide[];
  showcaseGroups: MobileHomepageShowcaseGroup[];
  headerNavItems: NavItem[];
};

type ModuleCardProps = {
  href: string;
  title: string;
  description: string;
  tools: number;
  className?: string;
  mediaClassName?: string;
  hideMeta?: boolean;
  overlayTitle?: boolean;
  children: ReactNode;
};

function buildToolsHref(value: string) {
  const normalized = value.trim();
  const normalizeScenePath = (sceneValue: string) =>
    sceneValue
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean)
      .slice(0, 1)
      .join("/");

  if (
    normalized === "/image-upscaler" ||
    normalized === "/image-eraser" ||
    normalized === "/image-background-remover" ||
    normalized === "/qwen-image-layered" ||
    normalized === "/longcat-avatar" ||
    normalized === "/video-face-swap"
  ) {
    return `/tools/${normalized.replace(/^\/+/, "")}`;
  }

  if (normalized.startsWith("/creator?")) {
    const query = normalized.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const scene = normalizeScenePath(params.get("scene") || "");

    if (scene) {
      return `/tools/${scene}`;
    }
  }

  const parts = normalized.split("?")[0].split("/").filter(Boolean);
  if (parts.length >= 2) {
    const scene = parts.slice(0, -1).join("/");
    if (scene) {
      return `/tools/${scene}`;
    }
  }

  return "/tools/text-to-image";
}

const referenceToVideoHref = buildToolsHref("/reference-to-video/wan-2-7");
const videoExtendHref = buildToolsHref("/video-extend/wan-2-7");

function MediaImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_32%),linear-gradient(180deg,#121212_0%,#1b1d20_100%)]",
          className,
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}

function OverlayPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[0.65rem] border border-white/14 bg-black/46 px-2.5 py-1 text-[11px] font-medium text-white/86 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

function PlayButton() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex size-[4.25rem] items-center justify-center rounded-full border border-white/28 bg-black/42 text-white shadow-[0_10px_32px_rgba(0,0,0,0.42)] backdrop-blur-md">
        <Play className="ml-0.5 size-6 fill-current" />
      </span>
    </div>
  );
}

type ShowcaseMosaicProps = {
  leadSrc?: string;
  leadAlt: string;
  leadBadge: string;
  gridBadge: string;
  topRightBadge?: ReactNode;
  gridItems: Array<{
    src?: string;
    alt: string;
  }>;
};

function ShowcaseMosaic({
  leadSrc,
  leadAlt,
  leadBadge,
  gridBadge,
  topRightBadge,
  gridItems,
}: ShowcaseMosaicProps) {
  return (
    <div className="absolute inset-x-0 top-0 bottom-[4.35rem] bg-[#061018] p-3">
      {topRightBadge ? (
        <div className="absolute right-4 top-4 z-20">{topRightBadge}</div>
      ) : null}
      <div className="grid h-full grid-cols-[1.18fr_1fr] gap-3">
        <div className="relative overflow-hidden rounded-[0.8rem] bg-white/[0.04]">
          <MediaImage src={leadSrc} alt={leadAlt} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/36 via-transparent to-transparent" />
          <OverlayPill className="absolute bottom-3 left-3 border-white/12 bg-black/52 px-3 py-1.5 text-[12px] font-semibold tracking-[0.08em] text-white/92 uppercase">
            {leadBadge}
          </OverlayPill>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          {gridItems.slice(0, 4).map((item, index) => (
            <div
              key={`${item.src ?? "showcase"}-${index}`}
              className="relative overflow-hidden rounded-[0.8rem] bg-white/[0.04]"
            >
              <MediaImage src={item.src} alt={item.alt} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/32 via-transparent to-transparent" />
              {index === 2 ? (
                <OverlayPill className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] border-white/12 bg-black/52 px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-white/92 uppercase">
                  {gridBadge}
                </OverlayPill>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HoverPreviewVideo({
  src,
  poster,
  title,
  className,
}: {
  src?: string;
  poster?: string;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <>
        <MediaImage src={poster} alt={title} className={className} />
        <PlayButton />
      </>
    );
  }

  const handleMouseEnter = (event: SyntheticEvent<HTMLVideoElement>) => {
    void event.currentTarget.play().catch(() => {});
  };

  const handleMouseLeave = (event: SyntheticEvent<HTMLVideoElement>) => {
    event.currentTarget.pause();
    event.currentTarget.currentTime = 0;
  };

  return (
    <>
      <video
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        aria-label={title}
      />
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-0">
        <PlayButton />
      </div>
    </>
  );
}

function HoverPreviewTile({
  src,
  poster,
  title,
  active = false,
}: {
  src?: string;
  poster?: string;
  title: string;
  active?: boolean;
}) {
  return (
    <div className="relative h-full w-full">
      <MediaImage src={poster} alt={title} />
      {src && active ? (
        <video
          src={src}
          poster={poster}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-label={title}
          onLoadedData={(event) => {
            void event.currentTarget.play().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}

function ModuleCard({
  href,
  title,
  description,
  tools,
  className,
  mediaClassName,
  hideMeta = false,
  overlayTitle = false,
  children,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[1.2rem] border border-white/12 bg-[#0c1015] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0e1218]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))]" />
      <div
        data-slot="media"
        className={cn(
          "relative aspect-[1.02/1] overflow-hidden",
          mediaClassName,
        )}
      >
        {children}
      </div>
      {!overlayTitle ? (
        hideMeta ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4.35rem] bg-[#081018]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-[4.35rem] h-px bg-white/8" />
            <div className="absolute inset-x-0 bottom-0 z-10 flex h-[4.35rem] items-end justify-between gap-3 px-4 pb-4">
              <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-white md:text-[1.06rem]">
                {title}
              </h3>
              <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/84 transition-colors duration-300 group-hover:bg-white/15">
                <ArrowRight className="size-4" />
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4.35rem] bg-[#081018]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-[4.35rem] h-px bg-white/8" />
            <div className="absolute inset-x-0 bottom-0 z-10 flex h-[4.35rem] items-end justify-between gap-3 px-4 pb-4">
              <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-white md:text-[1.06rem]">
                {title}
              </h3>
              <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/84 transition-colors duration-300 group-hover:bg-white/15">
                <ArrowRight className="size-4" />
              </span>
            </div>
          </>
        )
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 px-4 pb-4">
          <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-white md:text-[1.06rem]">
            {title}
          </h3>
          <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/84 transition-colors duration-300 group-hover:bg-white/15">
            <ArrowRight className="size-4" />
          </span>
        </div>
      )}
    </Link>
  );
}

function buildPromptLines(text: string) {
  return text.split(", ");
}

export function PcHomeStudio({
  bannerSlides,
  showcaseGroups,
}: PcHomeStudioProps) {
  const t = useTranslations("landing.homeStudio");
  const [activeVideoEffectId, setActiveVideoEffectId] = useState<string | null>(
    null,
  );
  const imageEffects = getImageEffectItemsSync().slice(0, 4);
  const videoEffects = getVideoEffectItemsSync().slice(0, 4);
  const showcaseItems = showcaseGroups.flatMap((group) => group.items);
  const visualItems = showcaseItems.filter((item) => item.type !== "audio");

  const textToImageSlide =
    bannerSlides.find((slide) => !slide.videoSrc && !slide.previewVideoSrc) ??
    bannerSlides[0];
  const textToVideoSlide =
    bannerSlides.find((slide) => slide.previewVideoSrc || slide.videoSrc) ??
    bannerSlides[0];
  const imageToVideoSlide =
    bannerSlides.find((slide) => slide.href?.includes("/image-to-video/")) ??
    textToVideoSlide;

  const heroPrompt = buildPromptLines(
    "Photorealistic luxury beauty-fashion portrait of a confident Middle Eastern woman with rich chestnut wavy hair, wearing a sculptural emerald satin mini dress with subtle draping and modern gold accents, elegant poised stance, refined glamorous makeup, warm amber-orange studio background, premium editorial lighting, ultra-detailed skin texture, high-end campaign photography, centered vertical composition, no text, no watermark.",
  );
  const textToVideoPrompt = buildPromptLines(
    "9:16 vertical, cinematic luxury fashion film, a stunning adult woman with long slightly tousled dark hair, glowing skin, and a captivating elegant presence, alone in a luxury penthouse after a late-night party. she wears a silky red dress with a soft shimmer, standing by the floor-to-ceiling window with blurred neon city lights outside. she holds a wine glass loosely, slowly turns toward the camera, lightly brushing her hair back and lowering her gaze with a faint, mysterious smile. close-up on her face, eyes, fingertips, and the flowing texture of the red dress. warm golden light mixed with soft blue city reflections, shallow depth of field, smooth dolly in, premium nightlife atmosphere, refined cinematic mood, highly realistic, ultra detailed.",
  );

  const ttiImage =
    "https://ocdn.10b.ai/homepage/generated/text-to-image-hero-emerald-v1.png?x-oss-process=image/resize,w_900,h_700,m_lfit";
  const itiBeforeImage =
    "https://ocdn.10b.ai/homepage/generated/image-to-image-before-seaside-lifestyle-v1.png?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const itiAfterImage =
    "https://ocdn.10b.ai/homepage/generated/image-to-image-after-seaside-lifestyle-v1.png?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const upscalerBeforeImage =
    "https://ocdn.10b.ai/image-upscaler-samples/1779500973070-fantasy-source.jpg?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const upscalerAfterImage =
    "https://ocdn.10b.ai/image-upscaler-samples/1779532253516-fantasy-result-provided.png?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const ttvImage =
    textToVideoSlide?.imageSrc ||
    visualItems[1]?.src ||
    visualItems[1]?.thumbnail;
  const ttvVideo =
    "https://ocdn.10b.ai/homepage/generated/text-to-video-luxury-penthouse-red-dress.mp4";
  const ttvPoster =
    "https://ocdn.10b.ai/homepage/generated/text-to-video-luxury-penthouse-red-dress-poster.jpg?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const itvImage = withOssImageResize(
    "https://ocdn.10b.ai/homepage/generated/image-to-video/images/ig_0794fbaf87912a470169f4d7af8288819a8577980fcb6b0101-fd87713de6.png",
    900,
    1200,
  );
  const itvVideo =
    "https://ocdn.10b.ai/homepage/generated/image-to-video/videos/woman_on_terrace_at_sunset_202605021129-245f44eefc.mp4";
  const upscalerBefore = upscalerBeforeImage;
  const upscalerAfter = upscalerAfterImage;
  const videoUpscaleImage = visualItems[5]?.src || visualItems[5]?.thumbnail;
  const backgroundRemoveBeforeImage =
    "https://ocdn.10b.ai/background-remover-samples/1779444431682-portrait-source.png";
  const backgroundRemoveAfterImage =
    "https://ocdn.10b.ai/background-remover-samples/1779444461783-portrait-result.png";
  const imageEraserBeforeImage = withOssImageResize(
    "https://ocdn.10b.ai/homepage/generated/image-eraser/image-eraser-before-young-woman-cafe-v1.png",
    900,
    1200,
  );
  const imageEraserAfterImage = withOssImageResize(
    "https://ocdn.10b.ai/homepage/generated/image-eraser/image-eraser-after-young-woman-cafe-v1.png",
    900,
    1200,
  );
  const referenceToVideoImage = withOssImageResize(
    "https://ocdn.10b.ai/homepage/generated/image-to-video/images/ig_0794fbaf87912a470169f4d7af8288819a8577980fcb6b0101-fd87713de6.png",
    900,
    1200,
  );
  const referenceToVideoVideo = itvVideo;
  const videoExtendPoster =
    "https://ocdn.10b.ai/homepage/generated/text-to-video-luxury-penthouse-red-dress-poster.jpg?x-oss-process=image/resize,m_fill,w_900,h_1200";
  const motionControlImage =
    withOssImageResize(
      "https://ocdn.10b.ai/icon/motion_control.png?x-oss-process=image/resize,m_fill,w_500,h_500",
      900,
      1200,
    );
  const longcatAvatarImage = withOssImageResize(
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-2-11364f9c7873.png",
    900,
    1200,
  );
  const longcatAvatarVideo =
    "https://ocdn.10b.ai/homepage/generated/longcat-avatar/1766570387014215295_10ZWV30Z.mp4";
  const longcatAvatarPoster = longcatAvatarImage;
  const faceTiles = [
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-1-0a7e15ad0d52.png",
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-2-11364f9c7873.png",
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-3-1ca365d64dae.png",
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-4-170077aaed07.png",
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-5-87b8a615e783.png",
    "https://ocdn.10b.ai/homepage/generated/face-generator/face-young-6-684020597b94.png",
  ].map((src) => withOssImageResize(src, 320, 420));
  const variationLeadImage =
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-input.png";
  const variationTiles = [
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-1.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-2.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-3.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-4.png",
  ].map((src, index) => ({
    src: withOssImageResize(src, 480, 580),
    alt: `Variation ${index + 1}`,
  }));
  const photoshootLeadImage =
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/photoshoot-input.png";
  const photoshootTiles = [
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/photoshoot-output-1.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/photoshoot-output-2.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/photoshoot-output-3.png",
    "https://ocdn.10b.ai/homepage/generated/homepage-variations/photoshoot-output-4.png",
  ].map((src, index) => ({
    src: withOssImageResize(src, 480, 580),
    alt: `Photoshoot ${index + 1}`,
  }));

  const imageEffectTiles = imageEffects.map(
    (item) => item.previewExample?.outputImageUrl || item.coverUrl,
  );
  const videoEffectTiles = videoEffects.map((item) => ({
    id: item.id,
    title: item.title,
    poster: item.coverUrl,
    previewSrc: item.samplePreviewClipUrl || item.sampleVideoUrl,
  }));
  const editorPersonImage =
    "/imgs/home/editor-combiner/editor-person-young-beauty-v1.png";
  const editorProductImage =
    "/imgs/home/editor-combiner/editor-product-satin-ribbon-v1.png";
  const editorOutputImage =
    "/imgs/home/editor-combiner/editor-output-young-beauty-ribbon-v1.png";

  return (
    <section className="overflow-hidden bg-[#050505] pb-10 pt-5 text-white">
      <div
        className={landingSidebarRowCenteredCn(
          "mx-auto w-full max-w-[1600px] px-5",
        )}
      >
        <HomepagePromoCarousel slides={bannerSlides} className="mb-8 px-0" />

        <div className="mb-5 pt-1">
          <h2 className="text-[2.15rem] font-semibold tracking-[-0.05em] text-white">
            {t("header.title")}
          </h2>
          <p className="mt-1 text-[15px] text-white/70">
            {t("header.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <ModuleCard
            href="/tool/image-to-video"
            title={t("cards.imageToVideo.title")}
            description={t("cards.imageToVideo.description")}
            tools={8}
          >
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <MediaImage
                  src={itvImage}
                  alt={t("cards.imageToVideo.inputAlt")}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="pointer-events-none absolute left-3 top-3">
                  <OverlayPill>{t("common.image")}</OverlayPill>
                </div>
              </div>
              <div className="relative">
                <HoverPreviewVideo
                  src={itvVideo}
                  poster={itvImage}
                  title={t("cards.imageToVideo.outputTitle")}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="pointer-events-none absolute right-3 top-3">
                  <OverlayPill>{t("common.video")}</OverlayPill>
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href="/tool/text-to-video"
            title={t("cards.textToVideo.title")}
            description={t("cards.textToVideo.description")}
            tools={6}
            mediaClassName="aspect-[0.95/1]"
            hideMeta
          >
            <div className="absolute inset-x-0 top-0 bottom-[4.35rem] overflow-hidden bg-[linear-gradient(180deg,rgba(14,18,27,0.99),rgba(9,13,20,0.99))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_46%,rgba(190,65,65,0.18),transparent_28%),radial-gradient(circle_at_76%_30%,rgba(83,131,214,0.16),transparent_24%)]" />
              <div className="absolute inset-0 grid grid-cols-[0.72fr_1.28fr] gap-0">
                <div className="relative z-10 flex min-w-0 items-stretch">
                  <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#4a2d7f_0%,#392061_58%,#27153e_100%)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-white/96">
                        {t("common.prompt")}
                      </p>
                      <OverlayPill className="border-white/16 bg-white/8 px-2 py-0.5 text-[10px] text-white/82">
                        9:16
                      </OverlayPill>
                    </div>
                    <div className="max-h-[11.5rem] space-y-1.5 overflow-hidden pb-20 text-[10px] leading-[1.52] text-white/94">
                      {textToVideoPrompt.slice(0, 10).map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative z-10 min-w-0">
                  <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(22,25,33,0.38),rgba(8,10,16,0.2))]">
                    <MediaImage
                      src={ttvPoster || ttvImage}
                      alt=""
                      className="scale-110 object-cover object-center opacity-30 blur-[4px]"
                    />
                    <div className="relative z-10 h-full w-full overflow-hidden">
                      <HoverPreviewVideo
                        src={ttvVideo}
                        poster={ttvPoster || ttvImage}
                        title={t("cards.textToVideo.title")}
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href="/tools/editor-combiner"
            title={t("cards.editorCombiner.title")}
            description={t("cards.editorCombiner.description")}
            tools={11}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#08101c_0%,#070d18_100%)]" />
            <div className="absolute inset-0 p-4">
              <div className="grid h-full grid-cols-[0.78fr_1.22fr] gap-4">
                <div className="relative flex flex-col gap-4">
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.04] shadow-[0_14px_36px_rgba(0,0,0,0.26)]">
                    <MediaImage
                      src={editorPersonImage}
                      alt={t("cards.editorCombiner.referencePortraitAlt")}
                    />
                  </div>
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.04] shadow-[0_14px_36px_rgba(0,0,0,0.26)]">
                    <MediaImage
                      src={editorProductImage}
                      alt={t("cards.editorCombiner.referenceProductAlt")}
                    />
                  </div>
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex size-[3.4rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8c79c]/40 bg-[#0c1220] text-[2rem] text-white shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                    +
                  </div>
                </div>
                <div className="relative min-h-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                  <MediaImage
                    src={editorOutputImage}
                    alt={t("cards.editorCombiner.outputAlt")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href={buildToolsHref("/image-to-image/gpt-image-2")}
            title={t("cards.imageToImage.title")}
            description={t("cards.imageToImage.description")}
            tools={9}
          >
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <MediaImage src={itiBeforeImage} alt={t("common.before")} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-3 top-3">
                  <OverlayPill>{t("common.before")}</OverlayPill>
                </div>
              </div>
              <div className="relative">
                <MediaImage src={itiAfterImage} alt={t("common.after")} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-3 top-3">
                  <OverlayPill>{t("common.after")}</OverlayPill>
                </div>
              </div>
            </div>
            <div className="absolute right-4 top-4 z-20">
              <OverlayPill className="border-emerald-200/85 bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#052814] shadow-[0_12px_30px_rgba(52,211,153,0.55)]">
                {t("common.freeTrial")}
              </OverlayPill>
            </div>
          </ModuleCard>

          <ModuleCard
            href={
              textToImageSlide
                ? buildToolsHref(getBannerHref(textToImageSlide))
                : "/tools/text-to-image"
            }
            title={t("cards.textToImage.title")}
            description={t("cards.textToImage.description")}
            tools={12}
            mediaClassName="aspect-[0.95/1]"
            hideMeta
          >
            <div className="absolute inset-x-0 top-0 bottom-[4.35rem] overflow-hidden bg-[linear-gradient(180deg,rgba(14,18,27,0.99),rgba(9,13,20,0.99))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_50%,rgba(113,73,186,0.16),transparent_28%),radial-gradient(circle_at_68%_44%,rgba(217,116,28,0.12),transparent_26%)]" />
              <div className="absolute right-4 top-4 z-20">
                <OverlayPill className="border-emerald-200/85 bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#052814] shadow-[0_12px_30px_rgba(52,211,153,0.55)]">
                  {t("common.freeTrial")}
                </OverlayPill>
              </div>
              <div className="absolute inset-0 grid grid-cols-[0.72fr_1.28fr] gap-0">
                <div className="relative z-10 flex min-w-0 items-stretch">
                  <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#4a2d7f_0%,#392061_58%,#27153e_100%)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <p className="mb-3 text-[13px] font-semibold text-white/96">
                      {t("common.prompt")}
                    </p>
                    <div className="max-h-[11.5rem] space-y-1.5 overflow-hidden pb-20 text-[10px] leading-[1.52] text-white/94">
                      {heroPrompt.slice(0, 8).map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative z-10 min-w-0">
                  <div className="relative flex h-full w-full items-end justify-center overflow-hidden">
                    <MediaImage
                      src={ttiImage}
                      alt=""
                      className="scale-110 object-cover object-center opacity-35 blur-[2px]"
                    />
                    <MediaImage
                      src={ttiImage}
                      alt={t("cards.textToImage.title")}
                      className="relative z-10 h-full w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href="/tool/photoshoot"
            title={t("cards.photoShoot.title")}
            description={t("cards.photoShoot.description")}
            tools={6}
          >
            <ShowcaseMosaic
              leadSrc={withOssImageResize(photoshootLeadImage, 760, 920)}
              leadAlt={t("cards.photoShoot.coverAlt")}
              leadBadge={t("cards.photoShoot.coverBadge")}
              gridBadge={t("cards.photoShoot.scenesBadge")}
              topRightBadge={
                <OverlayPill className="border-emerald-200/85 bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#052814] shadow-[0_12px_30px_rgba(52,211,153,0.55)]">
                  {t("common.freeTrial")}
                </OverlayPill>
              }
              gridItems={photoshootTiles}
            />
          </ModuleCard>

          <ModuleCard
            href="/tool/variations"
            title={t("cards.variations.title")}
            description={t("cards.variations.description")}
            tools={7}
          >
            <ShowcaseMosaic
              leadSrc={withOssImageResize(variationLeadImage, 760, 920)}
              leadAlt={t("cards.variations.inputAlt")}
              leadBadge={t("cards.variations.inputBadge")}
              gridBadge={t("cards.variations.outputBadge")}
              topRightBadge={
                <OverlayPill className="border-emerald-200/85 bg-emerald-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#052814] shadow-[0_12px_30px_rgba(52,211,153,0.55)]">
                  {t("common.freeTrial")}
                </OverlayPill>
              }
              gridItems={variationTiles}
            />
          </ModuleCard>

          <ModuleCard
            href="/tools/face-generator"
            title={t("cards.faceGenerator.title")}
            description={t("cards.faceGenerator.description")}
            tools={8}
          >
            <div className="absolute inset-x-0 top-0 bottom-[4.35rem] bg-[#061018] p-3">
              <div className="grid h-full grid-cols-3 grid-rows-2 gap-3">
                {faceTiles.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative overflow-hidden rounded-[1.15rem] bg-white/[0.04]"
                  >
                    <MediaImage src={src} alt={`Face ${index + 1}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href={buildToolsHref("/image-upscaler")}
            title={t("cards.imageUpscaler.title")}
            description={t("cards.imageUpscaler.description")}
            tools={6}
          >
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <MediaImage
                  src={upscalerBefore}
                  alt={t("cards.imageUpscaler.beforeAlt")}
                />
                <div className="absolute left-3 top-3 flex flex-col gap-1">
                  <OverlayPill className="w-fit">
                    {t("common.before")}
                  </OverlayPill>
                  <OverlayPill className="w-fit">
                    {t("cards.imageUpscaler.lowRes")}
                  </OverlayPill>
                </div>
              </div>
              <div className="relative">
                <MediaImage
                  src={upscalerAfter}
                  alt={t("cards.imageUpscaler.afterAlt")}
                />
                <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                  <OverlayPill className="w-fit">
                    {t("common.after")}
                  </OverlayPill>
                  <OverlayPill className="w-fit">
                    {t("cards.imageUpscaler.enhanced")}
                  </OverlayPill>
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href="/tools/image-effect"
            title={t("cards.imageEffects.title")}
            description={t("cards.imageEffects.description")}
            tools={15}
          >
            <div className="absolute inset-0 grid grid-cols-4">
              {imageEffectTiles.map((src, index) => (
                <div key={`${src}-${index}`} className="relative">
                  <MediaImage src={src} alt={`Image effect ${index + 1}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ))}
            </div>
            <div className="absolute left-4 top-4 flex gap-2">
              {[
                t("cards.imageEffects.chips.original"),
                t("cards.imageEffects.chips.filmLook"),
                t("cards.imageEffects.chips.goldenHour"),
                t("cards.imageEffects.chips.blackWhite"),
              ].map((label) => (
                <OverlayPill key={label} className="px-2 py-1 text-[10px]">
                  {label}
                </OverlayPill>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard
            href="/tool/video-effect"
            title={t("cards.videoEffects.title")}
            description={t("cards.videoEffects.description")}
            tools={12}
          >
            <div className="absolute inset-0 grid grid-cols-4">
              {videoEffectTiles.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="relative"
                  onPointerEnter={() => setActiveVideoEffectId(item.id)}
                  onPointerLeave={() =>
                    setActiveVideoEffectId((current) =>
                      current === item.id ? null : current,
                    )
                  }
                >
                  <HoverPreviewTile
                    src={item.previewSrc}
                    poster={item.poster}
                    title={item.title || `Video effect ${index + 1}`}
                    active={activeVideoEffectId === item.id}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/42 to-transparent" />
                </div>
              ))}
            </div>
            {!activeVideoEffectId ? <PlayButton /> : null}
            <div className="absolute left-4 top-4 flex gap-2">
              {[
                t("cards.videoEffects.chips.cinematic"),
                t("cards.videoEffects.chips.slowMotion"),
                t("cards.videoEffects.chips.lightLeak"),
                t("cards.videoEffects.chips.vintage"),
              ].map((label) => (
                <OverlayPill key={label} className="px-2 py-1 text-[10px]">
                  {label}
                </OverlayPill>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard
            href={buildToolsHref("/image-background-remover")}
            title={t("cards.backgroundRemove.title")}
            description={t("cards.backgroundRemove.description")}
            tools={4}
          >
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <MediaImage
                  src={backgroundRemoveBeforeImage}
                  alt={t("cards.backgroundRemove.beforeAlt")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute left-3 top-3">
                  <OverlayPill>{t("common.before")}</OverlayPill>
                </div>
              </div>
              <div className="relative overflow-hidden bg-transparent">
                <MediaImage
                  src={backgroundRemoveAfterImage}
                  alt={t("cards.backgroundRemove.afterAlt")}
                  className="object-contain object-bottom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/18 to-transparent" />
                <div className="absolute right-3 top-3">
                  <OverlayPill>{t("common.after")}</OverlayPill>
                </div>
              </div>
            </div>
          </ModuleCard>

          <ModuleCard
            href={buildToolsHref("/image-eraser")}
            title={t("cards.imageEraser.title")}
            description={t("cards.imageEraser.description")}
            tools={4}
          >
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <MediaImage
                  src={imageEraserBeforeImage}
                  alt={t("cards.imageEraser.beforeAlt")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-3 top-3">
                  <OverlayPill>{t("common.before")}</OverlayPill>
                </div>
              </div>
              <div className="relative">
                <MediaImage
                  src={imageEraserAfterImage}
                  alt={t("cards.imageEraser.afterAlt")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute right-3 top-3">
                  <OverlayPill>{t("common.after")}</OverlayPill>
                </div>
              </div>
            </div>
          </ModuleCard>

          {isStudioToolHidden(referenceToVideoHref) ? null : (
            <ModuleCard
              href={referenceToVideoHref}
              title={t("cards.referenceToVideo.title")}
              description={t("cards.referenceToVideo.description")}
              tools={6}
            >
              <div className="absolute inset-0 grid grid-cols-2">
                <div className="relative">
                  <MediaImage
                    src={referenceToVideoImage}
                    alt={t("cards.referenceToVideo.referenceAlt")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/52 to-transparent" />
                  <div className="pointer-events-none absolute left-3 top-3">
                    <OverlayPill>{t("cards.referenceToVideo.referenceBadge")}</OverlayPill>
                  </div>
                </div>
                <div className="relative">
                  <HoverPreviewVideo
                    src={referenceToVideoVideo}
                    poster={referenceToVideoImage}
                    title={t("cards.referenceToVideo.outputAlt")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/52 to-transparent" />
                  <div className="pointer-events-none absolute right-3 top-3">
                    <OverlayPill>{t("common.video")}</OverlayPill>
                  </div>
                </div>
              </div>
            </ModuleCard>
          )}

          {isStudioToolHidden(videoExtendHref) ? null : (
            <ModuleCard
              href={videoExtendHref}
              title={t("cards.videoExtend.title")}
              description={t("cards.videoExtend.description")}
              tools={5}
            >
              <MediaImage
                src={videoExtendPoster}
                alt={t("cards.videoExtend.title")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3">
                <OverlayPill className="flex-col items-start gap-0 px-3 py-2">
                  <span>{t("cards.videoExtend.shortDuration")}</span>
                  <span className="text-white/64">
                    {t("cards.videoExtend.beforeBadge")}
                  </span>
                </OverlayPill>
              </div>
              <div className="absolute right-3 top-3">
                <OverlayPill className="flex-col items-end gap-0 px-3 py-2">
                  <span>{t("cards.videoExtend.longDuration")}</span>
                  <span className="text-white/64">
                    {t("cards.videoExtend.afterBadge")}
                  </span>
                </OverlayPill>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-full w-px bg-white/20" />
              </div>
              <PlayButton />
            </ModuleCard>
          )}

          <ModuleCard
            href={buildToolsHref("/motion-control/kling-2-6-pro")}
            title={t("cards.motionControl.title")}
            description={t("cards.motionControl.description")}
            tools={5}
          >
            <MediaImage
              src={motionControlImage}
              alt={t("cards.motionControl.inputAlt")}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="pointer-events-none absolute left-3 top-3">
              <OverlayPill>{t("common.image")}</OverlayPill>
            </div>
          </ModuleCard>

          <ModuleCard
            href={buildToolsHref("/longcat-avatar")}
            title={t("cards.longcatAvatar.title")}
            description={t("cards.longcatAvatar.description")}
            tools={4}
          >
            <HoverPreviewVideo
              src={longcatAvatarVideo}
              poster={longcatAvatarPoster}
              title={t("cards.longcatAvatar.outputAlt")}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="pointer-events-none absolute right-3 top-3">
              <OverlayPill>{t("common.video")}</OverlayPill>
            </div>
          </ModuleCard>
        </div>
      </div>
    </section>
  );
}
