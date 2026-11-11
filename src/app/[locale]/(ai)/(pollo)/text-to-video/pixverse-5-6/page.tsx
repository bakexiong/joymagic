import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { pixverse56TextToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import { Video } from "lucide-react";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/text-to-video/pixverse-v5-6";

export const generateMetadata = getMetadata({
  title: "PixVerse v5.6 text-to-video | joymagic",
  description:
    "Use PixVerse v5.6 text-to-video on joymagic. Turn your prompts into high‑quality videos with flexible resolutions, durations and optional audio.",
  keywords: "text-to-video,pixverse-v5.6,pixverse v5.6,text to video AI",
  canonicalUrl: CANONICAL_PATH,
});

type Pixverse56PageMessages = {
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
      multiResolution?: {
        title?: string;
        description?: string;
      };
      audio?: {
        title?: string;
        description?: string;
      };
      thinking?: {
        title?: string;
        description?: string;
      };
      safety?: {
        title?: string;
        description?: string;
      };
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

function getNested(messages: Record<string, any>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, any>)
    ) {
      return (current as Record<string, any>)[key];
    }
    return undefined;
  }, messages);
}

function validatePixverse56PageMessages(
  messages: Pixverse56PageMessages | undefined,
) {
  if (process.env.NODE_ENV !== "development") return;
  if (!messages) {
    // eslint-disable-next-line no-console
    console.warn(
      "[PixVerse v5.6] pixverse56Page messages are missing for current locale.",
    );
    return;
  }

  const requiredPaths: string[] = [
    "hero.title",
    "hero.description",
    "hero.button1",
    "hero.button2",
    "intro",
    "features.title",
    "features.items.multiResolution.title",
    "features.items.multiResolution.description",
    "features.items.audio.title",
    "features.items.audio.description",
    "features.items.thinking.title",
    "features.items.thinking.description",
    "features.items.safety.title",
    "features.items.safety.description",
    "faq.title",
    "faq.q1.question",
    "faq.q1.answer",
    "faq.q2.question",
    "faq.q2.answer",
    "faq.q3.question",
    "faq.q3.answer",
    "faq.q4.question",
    "faq.q4.answer",
    "finalCTA.title",
    "finalCTA.description",
    "finalCTA.button",
    "breadcrumb.home",
    "breadcrumb.pageName",
  ];

  const missing: string[] = requiredPaths.filter(
    (path) => getNested(messages as Record<string, any>, path) == null,
  );

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[PixVerse v5.6] Missing pixverse56Page i18n keys for current locale:",
      missing.map((key) => `landing.pixverse-v5-6.pixverse56Page.${key}`),
    );
  }
}

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

export default async function TextToVideoPixverse56Page({
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

  // 获取当前 locale 下的 PixVerse v5.6 页面多语言配置
  const pixverseLanding = (tLanding.raw("pixverse-v5-6") || {}) as Record<
    string,
    any
  >;
  const pixverse56Page = (pixverseLanding.pixverse56Page ||
    {}) as Pixverse56PageMessages;

  // 开发环境下简单校验缺失 key，避免未来新增语言时漏翻
  validatePixverse56PageMessages(pixverse56Page);

  const heroMessages = pixverse56Page.hero || {};
  const featuresMessages = pixverse56Page.features || {};
  const faqMessages = pixverse56Page.faq || {};
  const finalCTAMessages = pixverse56Page.finalCTA || {};
  const breadcrumbMessages = pixverse56Page.breadcrumb || {};

  // Hero data
  const heroData: HeroType = {
    id: "hero",
    title: heroMessages.title || "",
    description: heroMessages.description || "",
    buttons: [
      {
        title: heroMessages.button1 || "",
        url: "#playground",
        variant: "default",
      },
      {
        title: heroMessages.button2 || "",
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // 简单能力介绍区块
  const featuresItems = (featuresMessages.items || {}) as NonNullable<
    Pixverse56PageMessages["features"]
  >["items"];

  const features: FeaturesType = {
    id: "pixverse-features",
    title: featuresMessages.title || "",
    description: "",
    items: [
      {
        title: featuresItems?.multiResolution?.title || "",
        description: featuresItems?.multiResolution?.description || "",
        icon: "Video",
      },
      {
        title: featuresItems?.audio?.title || "",
        description: featuresItems?.audio?.description || "",
        icon: "Sparkles",
      },
      {
        title: featuresItems?.thinking?.title || "",
        description: featuresItems?.thinking?.description || "",
        icon: "Cpu",
      },
      {
        title: featuresItems?.safety?.title || "",
        description: featuresItems?.safety?.description || "",
        icon: "ShieldCheck",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: faqMessages.title || "",
    description: "",
    items: [
      {
        question: faqMessages.q1?.question || "",
        answer: faqMessages.q1?.answer || "",
      },
      {
        question: faqMessages.q2?.question || "",
        answer: faqMessages.q2?.answer || "",
      },
      {
        question: faqMessages.q3?.question || "",
        answer: faqMessages.q3?.answer || "",
      },
      {
        question: faqMessages.q4?.question || "",
        answer: faqMessages.q4?.answer || "",
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: finalCTAMessages.title || "",
    description: finalCTAMessages.description || "",
    buttons: [
      {
        title: finalCTAMessages.button || "",
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
        name: breadcrumbMessages.home || "",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbMessages.pageName || "",
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
        playgroundConfig={pixverse56TextToVideoConfig}
      >
        {/* 简单说明区块 */}
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-lg text-muted-foreground">
                  {pixverse56Page.intro || ""}
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
