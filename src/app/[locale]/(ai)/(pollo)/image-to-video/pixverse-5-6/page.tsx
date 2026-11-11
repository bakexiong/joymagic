import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { pixverse56ImageToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/image-to-video/pixverse-5-6";

export const generateMetadata = getMetadata({
  title: "PixVerse v5.6 image-to-video | Barko Bear",
  description:
    "Use PixVerse v5.6 image-to-video on Barko Bear. Upload a reference image plus a prompt to turn it into a short video with flexible resolutions, durations and optional audio.",
  keywords: "image-to-video,pixverse-v5.6,pixverse v5.6,image to video AI",
  canonicalUrl: CANONICAL_PATH,
});

type Pixverse56ImagePageMessages = {
  hero?: {
    title?: string;
    description?: string;
    button1?: string;
    button2?: string;
  };
  intro?: string;
  features?: {
    title?: string;
    items?: {
      imagePrompt?: { title?: string; description?: string };
      sharedPricing?: { title?: string; description?: string };
      formats?: { title?: string; description?: string };
      audio?: { title?: string; description?: string };
    };
  };
  faq?: {
    title?: string;
    q1?: { question?: string; answer?: string };
    q2?: { question?: string; answer?: string };
    q3?: { question?: string; answer?: string };
    q4?: { question?: string; answer?: string };
  };
  finalCTA?: {
    title?: string;
    description?: string;
    button?: string;
  };
  breadcrumb?: {
    home?: string;
    pageName?: string;
  };
};

function canonicalizeUrl(url: string) {
  if (url !== `${BASE_URL}/` && url.endsWith("/")) {
    return url.replace(/\/$/, "");
  }
  return url;
}

function getAbsoluteUrl(path: string, locale: string) {
  const localePrefix = locale && locale !== defaultLocale ? `/${locale}` : "";
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return canonicalizeUrl(`${BASE_URL}${localePrefix}${safePath}`);
}

export default async function ImageToVideoPixverse56Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tLanding = await getTranslations("landing");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // 获取当前 locale 下的 PixVerse v5.6 image-to-video 页面多语言配置
  const pixverseLanding = (tLanding.raw("pixverse-v5-6") || {}) as Record<
    string,
    any
  >;
  const pixverse56ImagePage = (pixverseLanding.pixverse56ImagePage ||
    {}) as Pixverse56ImagePageMessages;

  const heroMessages = pixverse56ImagePage.hero || {};
  const featuresMessages = pixverse56ImagePage.features || {};
  const faqMessages = pixverse56ImagePage.faq || {};
  const finalCTAMessages = pixverse56ImagePage.finalCTA || {};
  const breadcrumbMessages = pixverse56ImagePage.breadcrumb || {};

  // Hero data（优先多语言配置，缺失时使用英文默认兜底）
  const heroData: HeroType = {
    id: "hero",
    title: heroMessages.title || "PixVerse v5.6 Image-to-Video Generator",
    description:
      heroMessages.description ||
      "Use PixVerse v5.6 image-to-video on Barko Bear to convert your reference images and prompts into high-quality short-form videos. Control resolution, duration and optional audio while keeping costs predictable via the same param-combination pricing used for text-to-video.",
    buttons: [
      {
        title: heroMessages.button1 || "Generate video",
        url: "#playground",
        variant: "default",
      },
      {
        title: heroMessages.button2 || "View pricing",
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // 简单能力介绍区块
  const featuresItems = (featuresMessages.items || {}) as NonNullable<
    Pixverse56ImagePageMessages["features"]
  >["items"];

  const features: FeaturesType = {
    id: "pixverse-image-features",
    title:
      featuresMessages.title ||
      "Why use PixVerse v5.6 Image-to-Video on Barko Bear?",
    description: "",
    items: [
      {
        title: featuresItems?.imagePrompt?.title || "Image + prompt control",
        description:
          featuresItems?.imagePrompt?.description ||
          "Upload a reference image to lock in character identity, style or layout, then use a text prompt to describe motion, camera movement and scene transitions.",
        icon: "Video",
      },
      {
        title:
          featuresItems?.sharedPricing?.title ||
          "Shared pricing grid with text-to-video",
        description:
          featuresItems?.sharedPricing?.description ||
          "Image-to-video uses the same resolution / duration / audio grid as PixVerse v5.6 text-to-video, backed by param-combination pricing for transparent credit usage.",
        icon: "Sparkles",
      },
      {
        title: featuresItems?.formats?.title || "Flexible output formats",
        description:
          featuresItems?.formats?.description ||
          "Choose between multiple aspect ratios, resolutions from 360p to 1080p, and fixed durations (5 / 8 / 10 seconds, with 1080p limited to 5s or 8s).",
        icon: "Video",
      },
      {
        title: featuresItems?.audio?.title || "Optional native audio",
        description:
          featuresItems?.audio?.description ||
          "Turn on native PixVerse audio to generate ambience, music or light SFX that follow your visual motion, or disable it when you only need silent clips.",
        icon: "Video",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: faqMessages.title || "PixVerse v5.6 Image-to-Video FAQ",
    description: "",
    items: [
      {
        question:
          faqMessages.q1?.question ||
          "How is PixVerse image-to-video different from text-to-video?",
        answer:
          faqMessages.q1?.answer ||
          "Text-to-video generates everything from scratch using only your prompt. Image-to-video lets you upload a reference image to control character identity, style or composition while PixVerse animates it according to your prompt.",
      },
      {
        question:
          faqMessages.q2?.question ||
          "Which resolutions and durations are supported?",
        answer:
          faqMessages.q2?.answer ||
          "PixVerse image-to-video follows the same grid as text-to-video: 360p, 540p, 720p and 1080p with 5 / 8 / 10 second presets. For 1080p, only 5s and 8s are allowed; 10s is disabled and rejected by pricing validation.",
      },
      {
        question:
          faqMessages.q3?.question ||
          "Can I generate audio together with the video?",
        answer:
          faqMessages.q3?.answer ||
          "Yes. Enable the generate_audio_switch option to let PixVerse create synchronized audio for your clip. This uses dedicated pricing combinations so you always know when audio is included.",
      },
      {
        question:
          faqMessages.q4?.question || "Do I need both an image and a prompt?",
        answer:
          faqMessages.q4?.answer ||
          "Yes. The image anchors what the scene should look like, while the prompt describes how it should move. Leaving either empty will cause the playground to block the request before sending it.",
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title:
      finalCTAMessages.title ||
      "Start creating with PixVerse v5.6 image-to-video",
    description:
      finalCTAMessages.description ||
      "Upload a reference image, write a simple prompt and let PixVerse v5.6 image-to-video generate short, social-ready videos on top of our credit-based infrastructure.",
    buttons: [
      {
        title: finalCTAMessages.button || "Start generating",
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);
  const homeUrl = getAbsoluteUrl("/", locale);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbMessages.home || "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbMessages.pageName || "PixVerse v5.6 image-to-video",
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity:
      faqData.items?.map((item) => ({
        "@type": "Question",
        name: item.question || "",
        acceptedAnswer: {
          "@type": "Answer",
          text: typeof item.answer === "string" ? item.answer : "",
        },
      })) || [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={pixverse56ImageToVideoConfig}
      >
        {/* 简单说明区块（移动端收紧上下间距与字号） */}
        <section className="py-6 sm:py-8 md:py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center px-3 sm:px-0">
              <ScrollAnimation>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {pixverse56ImagePage.intro ||
                    "PixVerse v5.6 image-to-video on Barko Bear extends the same param-combination credit system used for text-to-video to image-driven workflows, so you can experiment with different resolution, duration and audio settings without losing track of video generation costs."}
                </p>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Features */}
        <Features features={features} className="py-16 md:py-24" />

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24 bg-muted/30" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
