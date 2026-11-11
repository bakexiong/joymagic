import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { locales } from "@/config/locale";
import { imageEraserConfig } from "@/shared/blocks/desktop-playground";
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
  Eraser,
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
    "landing.image-eraser.imageEraserPage.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-eraser`
      : `${envConfigs.app_url}/image-eraser`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageEraserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.image-eraser.imageEraserPage");
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
        title: tPage("keyFeatures.smartRemoval.title"),
        description: tPage.raw("keyFeatures.smartRemoval.description"),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.realisticInpainting.title"),
        description: tPage.raw("keyFeatures.realisticInpainting.description"),
        icon: "Sparkles",
      },
      {
        title: tPage("keyFeatures.fastPrecise.title"),
        description: tPage.raw("keyFeatures.fastPrecise.description"),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.batchRemoval.title"),
        description: tPage.raw("keyFeatures.batchRemoval.description"),
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
        title: tPage("whatYouCanDo.travelPhotos.title"),
        description: tPage.raw("whatYouCanDo.travelPhotos.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("whatYouCanDo.productPhotography.title"),
        description: tPage.raw("whatYouCanDo.productPhotography.description"),
        icon: "ShoppingBag",
      },
      {
        title: tPage("whatYouCanDo.portraits.title"),
        description: tPage.raw("whatYouCanDo.portraits.description"),
        icon: "Users",
      },
      {
        title: tPage("whatYouCanDo.realEstate.title"),
        description: tPage.raw("whatYouCanDo.realEstate.description"),
        icon: "Briefcase",
      },
      {
        title: tPage("whatYouCanDo.socialMedia.title"),
        description: tPage.raw("whatYouCanDo.socialMedia.description"),
        icon: "Sparkles",
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
        icon: "Eraser",
      },
      {
        title: tPage("howItWorks.step3.title"),
        description: tPage.raw("howItWorks.step3.description"),
        icon: "Sparkles",
      },
      {
        title: tPage("howItWorks.step4.title"),
        description: tPage.raw("howItWorks.step4.description"),
        icon: "CheckCircle2",
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
    name: "joymagic AI Image Eraser",
    description: tPage("hero.description"),
    url: "/image-eraser",
    locale,
    category: "MultimediaApplication",
    features: [
      "Object Removal",
      "AI Inpainting",
      "Smart Erasing",
      "Batch Processing",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Erase Objects from Images",
    description: tPage("howItWorks.description"),
    steps:
      howItWorks.items?.map((item) => ({
        name: item.title || "",
        text: typeof item.description === "string" ? item.description : "",
      })) || [],
    totalTime: "PT2M",
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
      { name: "Image Eraser", url: "/image-eraser" },
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
        playgroundConfig={imageEraserConfig}
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

        {/* What is AI Image Eraser? */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("whatIsAIEraser.title")}
                </h2>
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg">
                    {tPage("whatIsAIEraser.description")}
                  </p>
                  <p className="font-medium text-foreground">
                    {tPage("whatIsAIEraser.unlikeTraditional")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{tPage("whatIsAIEraser.understandContext")}</li>
                    <li>{tPage("whatIsAIEraser.generateRealistic")}</li>
                    <li>{tPage("whatIsAIEraser.handleComplex")}</li>
                    <li>{tPage("whatIsAIEraser.simpleBrush")}</li>
                  </ul>
                  <p>{tPage("whatIsAIEraser.perfectFor")}</p>
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
