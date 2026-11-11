import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { locales } from "@/config/locale";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { wan27ImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
import { JsonLd } from "@/shared/components/jsonld";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import {
  getWan27CommonLabels,
  getWan27ImageToImageHowToSteps,
  getWan27ImageToImagePageCopy,
} from "@/shared/lib/wan-2-7-page-copy";
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from "@/shared/types/blocks/landing";
import { CTA } from "@/themes/default/blocks/cta";
import { FAQ } from "@/themes/default/blocks/faq";
import { Features } from "@/themes/default/blocks/features";
import {
  CheckCircle2,
  Layers,
  Lightbulb,
  Maximize,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getWan27ImageToImagePageCopy(locale);
  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/wan-2-7`
      : `${envConfigs.app_url}/image-to-image/wan-2-7`;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: copy.metaKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
  };
}

export default async function Wan27ImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const copy = getWan27ImageToImagePageCopy(locale);
  const labels = getWan27CommonLabels(locale);
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroData: HeroType = {
    id: "hero",
    title: copy.heroTitle,
    description: copy.heroDescription,
    buttons: [
      {
        title: labels.tryNow,
        url: "#playground",
        variant: "default",
      },
      {
        title: labels.viewPricing,
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: copy.featuresTitle,
    description: copy.featuresDescription,
    items: copy.features,
  };

  const faqData: FAQType = {
    id: "faq",
    title: copy.faqTitle,
    description: copy.faqDescription,
    items: copy.faq,
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: copy.ctaTitle,
    description: copy.ctaDescription,
    buttons: [
      {
        title: copy.ctaButton,
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: copy.softwareName,
    description: copy.metaDescription,
    url: "/image-to-image/wan-2-7",
    locale,
    category: "MultimediaApplication",
    features: copy.featureList,
  });

  const howToSchema = generateHowToSchema({
    name: copy.howToName,
    description: copy.howToDescription,
    steps: getWan27ImageToImageHowToSteps(locale),
    totalTime: "PT1M",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer === "string" ? item.answer : "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: labels.home, url: "/" },
      {
        name: labels.imageToImage,
        url: "/image-to-image",
      },
      { name: copy.breadcrumbModel, url: "/image-to-image/wan-2-7" },
    ],
    locale,
  );

  const tipIcons = [Lightbulb, Palette, Maximize, Target];
  const useCaseIcons = [Layers, Sparkles, CheckCircle2, Maximize];

  return (
    <>
      <JsonLd data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]} />
      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={wan27ImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                  {copy.tipsTitle}
                </h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {copy.tips.map((tip, index) => {
                    const Icon = tipIcons[index] || Sparkles;
                    return (
                      <div key={tip.title} className="rounded-lg border bg-card p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className="size-5 text-primary" />
                          <h3 className="font-semibold">{tip.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tip.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                  {copy.useCasesTitle}
                </h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {copy.useCases.map((item, index) => {
                    const Icon = useCaseIcons[index] || Sparkles;
                    return (
                      <div key={item.title} className="rounded-lg border bg-card p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className="size-5 text-primary" />
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="py-16 md:py-24" />
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
