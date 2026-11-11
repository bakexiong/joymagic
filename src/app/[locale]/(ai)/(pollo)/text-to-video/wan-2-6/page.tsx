import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FeaturesList } from "@/themes/default/blocks/features-list";
import { FeaturesStep } from "@/themes/default/blocks/features-step";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { wan26TextToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import { Button } from "@/shared/components/ui/button";
import {
  CheckCircle2,
  Zap,
  Briefcase,
  Sparkles,
  Video,
  Sliders,
  Highlighter,
  Users,
  ShoppingBag,
  Palette,
  Wand2,
  Shield,
  ArrowRight,
  Crosshair,
  CreditCard,
} from "lucide-react";
import { Link as I18nLink } from "@/core/i18n/navigation";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/text-to-video/wan-2-6";

export const generateMetadata = getMetadata({
  metadataKey: "landing.wan-2-6.metadata",
  canonicalUrl: CANONICAL_PATH,
});

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

export default async function TextToVideoWan26Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.wan-2-6.wan26Page");
  const tWan26 = await getTranslations("landing.wan-2-6");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroData: HeroType = {
    id: "hero",
    title: tWan26("hero.h1"),
    description: tWan26("hero.description"),
    buttons: [
      {
        title: tPage("hero.button1"),
        url: "#playground",
        variant: "default",
      },
      {
        title: tPage("hero.button2"),
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // What You Can Do sections - 使用 wan-2-6 的 creations 内容
  const whatYouCanDo: FeaturesType = {
    id: "what-you-can-do",
    title: tWan26("sections.creations.h2"),
    description: "",
    items: [
      {
        title: tWan26("sections.creations.cards.t2i.h3"),
        description: tWan26("sections.creations.cards.t2i.p"),
        icon: "Sparkles",
      },
      {
        title: tWan26("sections.creations.cards.editing.h3"),
        description: tWan26("sections.creations.cards.editing.p"),
        icon: "ShoppingBag",
      },
      {
        title: tWan26("sections.creations.cards.i2v.h3"),
        description: tWan26("sections.creations.cards.i2v.p"),
        icon: "Video",
      },
    ],
  };

  // Key Features - 使用 wan-2-6 的 i2v 内容
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tWan26("sections.i2v.h2"),
    description: tWan26("sections.i2v.p"),
    items: [
      {
        title: tWan26("sections.i2v.cards.inputs.h3"),
        description: tWan26("sections.i2v.cards.inputs.p"),
        icon: "Wand2",
      },
      {
        title: tWan26("sections.i2v.cards.controls.h3"),
        description: tWan26("sections.i2v.cards.controls.p"),
        icon: "Highlighter",
      },
      {
        title: tWan26("sections.i2v.cards.use_cases.h3"),
        description: tWan26("sections.i2v.cards.use_cases.p"),
        icon: "Sliders",
      },
    ],
  };

  // How It Works - 使用 wan-2-6 的 how_to 内容
  const howItWorks: FeaturesType = {
    id: "how-it-works",
    title: tWan26("sections.how_to.h2"),
    description: "",
    items: [
      {
        title: tWan26("sections.how_to.steps.1.h3"),
        description: tWan26("sections.how_to.steps.1.p"),
        icon: "Wand2",
      },
      {
        title: tWan26("sections.how_to.steps.2.h3"),
        description: tWan26("sections.how_to.steps.2.p"),
        icon: "Sliders",
      },
      {
        title: tWan26("sections.how_to.steps.3.h3"),
        description: tWan26("sections.how_to.steps.3.p"),
        icon: "Video",
      },
      {
        title: tWan26("sections.how_to.steps.4.h3"),
        description: tWan26("sections.how_to.steps.4.p"),
        icon: "CheckCircle2",
      },
      {
        title: tWan26("sections.how_to.steps.5.h3"),
        description: tWan26("sections.how_to.steps.5.p"),
        icon: "CheckCircle2",
      },
      {
        title: tWan26("sections.how_to.steps.6.h3"),
        description: tWan26("sections.how_to.steps.6.p"),
        icon: "CheckCircle2",
      },
    ],
  };

  // FAQ - 使用 wan-2-6 的 FAQ 内容
  const faqItems: { question: string; answer: string }[] =
    tWan26.raw("faq.items");
  const faqData: FAQType = {
    id: "faq",
    title: tWan26("faq.h2"),
    description: "",
    items: faqItems.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title"),
    description: tPage.raw("finalCTA.description"),
    buttons: [
      {
        title: tPage("finalCTA.button"),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  // 从 wan-2-6 翻译文件获取文案
  const heroTrust: string[] = tWan26.raw("hero.trust");
  const whatIsParagraphs: string[] = tWan26.raw("sections.what_is.paragraphs");

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);
  const homeUrl = getAbsoluteUrl("/", locale);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Wan 2.6",
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
        playgroundConfig={wan26TextToVideoConfig}
      >
        {/* Hero Description Extension */}
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-lg text-muted-foreground">
                  {tPage("heroDescription")}
                </p>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Built for modern creators */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <p className="text-center text-sm font-medium text-muted-foreground mb-6">
                  {tPage("builtFor.title")}
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-500" />
                    <span>{tPage("builtFor.hdOutputs")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="size-5 text-yellow-500" />
                    <span>{tPage("builtFor.fastGeneration")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-5 text-blue-500" />
                    <span>{tPage("builtFor.commercialReady")}</span>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* What is Wan 2.6? */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold">
                {tWan26("sections.what_is.h2")}
              </h2>
              <div className="text-muted-foreground mt-4 space-y-4 leading-relaxed">
                {whatIsParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What You Can Do */}
        <Features features={whatYouCanDo} className="py-16 md:py-24" />

        {/* Key Features */}
        <Features
          features={keyFeatures}
          className="py-16 md:py-24 bg-muted/30"
        />

        {/* How It Works */}
        <FeaturesStep features={howItWorks} className="py-16 md:py-24" />

        {/* Pricing for Wan 2.6 */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold">
                {tWan26("sections.pricing.h2")}
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {tWan26("sections.pricing.p_before")}{" "}
                <I18nLink href="/pricing" className="underline">
                  /pricing
                </I18nLink>{" "}
                {tWan26("sections.pricing.p_after")}
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 font-medium">
                        {tWan26("sections.pricing.table.task")}
                      </th>
                      <th className="px-4 py-3 font-medium">
                        {tWan26("sections.pricing.table.unit")}
                      </th>
                      <th className="px-4 py-3 font-medium">
                        {tWan26("sections.pricing.table.starting_from")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:not(:last-child)]:border-b">
                    <tr>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.720p.task")}
                      </td>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.720p.unit")}
                      </td>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.720p.start")}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.1080p.task")}
                      </td>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.1080p.unit")}
                      </td>
                      <td className="px-4 py-3">
                        {tWan26("sections.pricing.rows.1080p.start")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {tWan26("sections.pricing.note")}
              </p>
            </div>
          </div>
        </section>

        {/* Quality, Safety, and Usage Rights */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold">
                {tWan26("sections.quality.h2")}
              </h2>
              <div className="text-muted-foreground mt-4 space-y-4 leading-relaxed">
                <p>{tWan26("sections.quality.p1")}</p>
                <p>
                  {tWan26("sections.quality.p2_before")}{" "}
                  <I18nLink href="/terms-of-service" className="underline">
                    {tWan26("sections.quality.terms_link")}
                  </I18nLink>{" "}
                  {tWan26("sections.quality.p2_after")}
                </p>
                <p>
                  {tWan26("sections.quality.p3_before")}{" "}
                  <I18nLink
                    href="/content-moderation-policy"
                    className="underline"
                  >
                    {tWan26("sections.quality.moderation_link")}
                  </I18nLink>{" "}
                  {tWan26("sections.quality.p3_middle")}{" "}
                  <I18nLink href="/acceptable-use-policy" className="underline">
                    {tWan26("sections.quality.aup_link")}
                  </I18nLink>{" "}
                  {tWan26("sections.quality.p3_after")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24 bg-muted/30" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24" />

        {/* Disclaimer */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl rounded-2xl border bg-muted/30 p-6">
              <h2 className="text-lg font-semibold">
                {tWan26("disclaimer.h2")}
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {tWan26("disclaimer.p", {
                  brand: envConfigs.app_name || "joymagic",
                })}
              </p>
            </div>
          </div>
        </section>
      </AiMediaPageLayout>
    </>
  );
}
