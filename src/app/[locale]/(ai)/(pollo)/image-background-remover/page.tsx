import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { locales } from "@/config/locale";
import { imageBackgroundRemoverConfig } from "@/shared/blocks/desktop-playground";
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
    "landing.image-background-remover.imageBackgroundRemoverPage.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-background-remover`
      : `${envConfigs.app_url}/image-background-remover`;

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageBackgroundRemoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.image-background-remover.imageBackgroundRemoverPage",
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
        title: tPage("keyFeatures.oneClickPrecision.title"),
        description: tPage.raw("keyFeatures.oneClickPrecision.description"),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.highQualityTransparent.title"),
        description: tPage.raw(
          "keyFeatures.highQualityTransparent.description",
        ),
        icon: "CheckCircle2",
      },
      {
        title: tPage("keyFeatures.batchRemoval.title"),
        description: tPage.raw("keyFeatures.batchRemoval.description"),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.cleanProfessional.title"),
        description: tPage.raw("keyFeatures.cleanProfessional.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("keyFeatures.replaceBackground.title"),
        description: tPage.raw("keyFeatures.replaceBackground.description"),
        icon: "Palette",
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
        title: tPage("whatYouCanDo.productPhotos.title"),
        description: tPage.raw("whatYouCanDo.productPhotos.description"),
        icon: "ShoppingBag",
      },
      {
        title: tPage("whatYouCanDo.profilePictures.title"),
        description: tPage.raw("whatYouCanDo.profilePictures.description"),
        icon: "Users",
      },
      {
        title: tPage("whatYouCanDo.graphicsMemes.title"),
        description: tPage.raw("whatYouCanDo.graphicsMemes.description"),
        icon: "Palette",
      },
      {
        title: tPage("whatYouCanDo.ecommerce.title"),
        description: tPage.raw("whatYouCanDo.ecommerce.description"),
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
        icon: "Wand2",
      },
      {
        title: tPage("howItWorks.step3.title"),
        description: tPage.raw("howItWorks.step3.description"),
        icon: "Eraser",
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
      {
        question: tPage("faq.q7.question"),
        answer: tPage("faq.q7.answer"),
      },
      {
        question: tPage("faq.q8.question"),
        answer: tPage("faq.q8.answer"),
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
    name: "Barko Bear AI Background Remover",
    description: tPage("hero.description"),
    url: "/image-background-remover",
    locale,
    category: "MultimediaApplication",
    features: [
      "Background Removal",
      "Transparent PNG",
      "One-Click Processing",
      "High Quality Output",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Remove Image Backgrounds",
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
      { name: "Background Remover", url: "/image-background-remover" },
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
        playgroundConfig={imageBackgroundRemoverConfig}
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

        {/* What is AI Image Background Remover? */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("whatIsAIBackgroundRemover.title")}
                </h2>
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg">
                    {tPage("whatIsAIBackgroundRemover.description")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {(
                      tPage.raw(
                        "whatIsAIBackgroundRemover.features",
                      ) as string[]
                    ).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                  <p className="font-medium text-foreground">
                    {tPage("whatIsAIBackgroundRemover.perfectFor")}
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
