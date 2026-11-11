import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { locales } from "@/config/locale";
import { imageUpscalerConfig } from "@/shared/blocks/desktop-playground";
import { Features } from "@/themes/default/blocks/features";
import { FeaturesList } from "@/themes/default/blocks/features-list";
import { FeaturesStep } from "@/themes/default/blocks/features-step";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import {
  generateSoftwareApplicationSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld";
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
  Image as ImageIcon,
  Maximize2,
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
  const t = await getTranslations(
    "landing.image-upscaler.imageUpscalerPage.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-upscaler`
      : `${envConfigs.app_url}/image-upscaler`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageUpscalerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.image-upscaler.imageUpscalerPage",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title"),
    description: tPage("hero.description"),
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

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title"),
    description: tPage("keyFeatures.description"),
    items: [
      {
        title: tPage("keyFeatures.fastProcessing.title"),
        description: tPage.raw("keyFeatures.fastProcessing.description"),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.highQuality.title"),
        description: tPage.raw("keyFeatures.highQuality.description"),
        icon: "CheckCircle2",
      },
      {
        title: tPage("keyFeatures.twoModes.title"),
        description: tPage.raw("keyFeatures.twoModes.description"),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.batch.title"),
        description: tPage.raw("keyFeatures.batch.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("keyFeatures.cleanOutput.title"),
        description: tPage.raw("keyFeatures.cleanOutput.description"),
        icon: "CheckCircle2",
      },
    ],
  };

  // What You Can Do sections
  const whatYouCanDo: FeaturesType = {
    id: "what-you-can-do",
    title: tPage("whatYouCanDo.title"),
    description: tPage("whatYouCanDo.description"),
    items: [
      {
        title: tPage("whatYouCanDo.photography.title"),
        description: tPage.raw("whatYouCanDo.photography.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("whatYouCanDo.design.title"),
        description: tPage.raw("whatYouCanDo.design.description"),
        icon: "Palette",
      },
      {
        title: tPage("whatYouCanDo.ecommerce.title"),
        description: tPage.raw("whatYouCanDo.ecommerce.description"),
        icon: "ShoppingBag",
      },
      {
        title: tPage("whatYouCanDo.socialMedia.title"),
        description: tPage.raw("whatYouCanDo.socialMedia.description"),
        icon: "Sparkles",
      },
      {
        title: tPage("whatYouCanDo.print.title"),
        description: tPage.raw("whatYouCanDo.print.description"),
        icon: "Briefcase",
      },
    ],
  };

  // How It Works
  const howItWorks: FeaturesType = {
    id: "how-it-works",
    title: tPage("howItWorks.title"),
    description: tPage("howItWorks.description"),
    items: [
      {
        title: tPage("howItWorks.step1.title"),
        description: tPage.raw("howItWorks.step1.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("howItWorks.step2.title"),
        description: tPage.raw("howItWorks.step2.description"),
        icon: "Maximize2",
      },
      {
        title: tPage("howItWorks.step3.title"),
        description: tPage.raw("howItWorks.step3.description"),
        icon: "Wand2",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title"),
    description: tPage("faq.description"),
    items: [
      {
        question: tPage("faq.q1.question"),
        answer: tPage("faq.q1.answer"),
      },
      {
        question: tPage("faq.q2.question"),
        answer: tPage("faq.q2.answer"),
      },
      {
        question: tPage("faq.q3.question"),
        answer: tPage("faq.q3.answer"),
      },
      {
        question: tPage("faq.q4.question"),
        answer: tPage("faq.q4.answer"),
      },
      {
        question: tPage("faq.q5.question"),
        answer: tPage("faq.q5.answer"),
      },
      {
        question: tPage("faq.q6.question"),
        answer: tPage("faq.q6.answer"),
      },
    ],
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

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "joymagic AI Image Upscaler",
    description: tPage("hero.description"),
    url: "/image-upscaler",
    locale,
    category: "MultimediaApplication",
    features: [
      "AI Image Upscaling",
      "High Quality Enhancement",
      "Fast Processing",
      "Batch Processing",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Upscale Images with AI",
    description: tPage("howItWorks.description"),
    steps:
      howItWorks.items?.map((item) => ({
        name: item.title || "",
        text: typeof item.description === "string" ? item.description : "",
      })) || [],
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
      { name: "Home", url: "/" },
      { name: "Image Upscaler", url: "/image-upscaler" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd
        data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]}
      />
      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={imageUpscalerConfig}
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

        {/* What is AI Image Upscaler? */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("whatIsAIUpscaler.title")}
                </h2>
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg">
                    {tPage("whatIsAIUpscaler.description")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {(tPage.raw("whatIsAIUpscaler.features") as string[]).map(
                      (feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ),
                    )}
                  </ul>
                  <p className="font-medium text-foreground">
                    {tPage("whatIsAIUpscaler.perfectFor")}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <FeaturesStep
          features={howItWorks}
          className="py-16 md:py-24 bg-muted/30"
        />

        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* What You Can Do */}
        <Features
          features={whatYouCanDo}
          className="py-16 md:py-24 bg-muted/30"
        />

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24" />

        {/* Privacy & Security */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("privacySecurity.title")}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  {tPage("privacySecurity.description")}
                </p>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="text-center">
                    <Shield className="size-8 mx-auto mb-3 text-primary" />
                    <p className="text-sm">
                      {tPage("privacySecurity.secureProcessing")}
                    </p>
                  </div>
                  <div className="text-center">
                    <CheckCircle2 className="size-8 mx-auto mb-3 text-primary" />
                    <p className="text-sm">
                      {tPage("privacySecurity.autoDelete")}
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="size-8 mx-auto mb-3 text-primary" />
                    <p className="text-sm">
                      {tPage("privacySecurity.neverShared")}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
