import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FeaturesStep } from "@/themes/default/blocks/features-step";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { qwenImageLayeredConfig } from "@/shared/blocks/desktop-playground";
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
import {
  Sparkles,
  Wand2,
  ImageIcon,
  Sliders,
  CheckCircle2,
  Palette,
  Gamepad2,
  Paintbrush,
  Shuffle,
  Shield,
  Lock,
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
    "landing.qwen-image-layered.qwenImageLayeredPage.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/qwen-image-layered`
      : `${envConfigs.app_url}/qwen-image-layered`;

  return {
    title: t("title"),
    description: t("description"),
    keywords:
      "Qwen-Image-Layered, AI layer decomposition, RGBA layers, transparent backgrounds, photo editing, compositing",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      siteName: "joymagic",
    },
  };
}

export default async function QwenImageLayeredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.qwen-image-layered.qwenImageLayeredPage",
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

  // How to Decompose
  const howTo: FeaturesType = {
    id: "how-to",
    title: tPage("howTo.title"),
    description: tPage("howTo.description"),
    items: [
      {
        title: tPage("howTo.step1.title"),
        description: tPage.raw("howTo.step1.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("howTo.step2.title"),
        description: tPage.raw("howTo.step2.description"),
        icon: "Sliders",
      },
      {
        title: tPage("howTo.step3.title"),
        description: tPage.raw("howTo.step3.description"),
        icon: "Sparkles",
      },
      {
        title: tPage("howTo.step4.title"),
        description: tPage.raw("howTo.step4.description"),
        icon: "CheckCircle2",
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
        title: tPage("keyFeatures.semantic.title"),
        description: tPage("keyFeatures.semantic.description"),
        icon: "Layers",
      },
      {
        title: tPage("keyFeatures.alpha.title"),
        description: tPage("keyFeatures.alpha.description"),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.occlusion.title"),
        description: tPage("keyFeatures.occlusion.description"),
        icon: "Sparkles",
      },
      {
        title: tPage("keyFeatures.adjustable.title"),
        description: tPage("keyFeatures.adjustable.description"),
        icon: "Sliders",
      },
      {
        title: tPage("keyFeatures.prompt.title"),
        description: tPage("keyFeatures.prompt.description"),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.quality.title"),
        description: tPage("keyFeatures.quality.description"),
        icon: "CheckCircle2",
      },
    ],
  };

  // Use Cases
  const useCases: FeaturesType = {
    id: "use-cases",
    title: tPage("useCases.title"),
    description: tPage("useCases.description"),
    items: [
      {
        title: tPage("useCases.editing.title"),
        description: tPage("useCases.editing.description"),
        icon: "ImageIcon",
      },
      {
        title: tPage("useCases.compositing.title"),
        description: tPage("useCases.compositing.description"),
        icon: "Shuffle",
      },
      {
        title: tPage("useCases.gameAssets.title"),
        description: tPage("useCases.gameAssets.description"),
        icon: "Gamepad2",
      },
      {
        title: tPage("useCases.illustration.title"),
        description: tPage("useCases.illustration.description"),
        icon: "Paintbrush",
      },
      {
        title: tPage("useCases.sceneReconstruction.title"),
        description: tPage("useCases.sceneReconstruction.description"),
        icon: "Palette",
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
    name: "joymagic AI Image Layered Decomposition",
    description: tPage("hero.description"),
    url: "/qwen-image-layered",
    locale,
    category: "MultimediaApplication",
    features: [
      "Layer Decomposition",
      "RGBA Layers",
      "Transparent Backgrounds",
      "AI Compositing",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Decompose Images into Layers",
    description: tPage("howTo.description"),
    steps:
      howTo.items?.map((item) => ({
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
      { name: "Image Layered", url: "/qwen-image-layered" },
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
        playgroundConfig={qwenImageLayeredConfig}
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

        {/* What is AI Image Layered Decomposition */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-semibold md:text-4xl mb-4">
                    {tPage("whatIs.title")}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {tPage("whatIs.description")}
                  </p>
                </div>
              </ScrollAnimation>
              <ScrollAnimation delay={0.2}>
                <div className="space-y-6">
                  <p className="text-muted-foreground font-medium">
                    {tPage("whatIs.paragraph1")}
                  </p>
                  <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                    {tPage
                      .raw("whatIs.points")
                      .map((point: string, index: number) => (
                        <li key={index} className="ml-4">
                          {point}
                        </li>
                      ))}
                  </ul>
                  <p className="text-muted-foreground mt-6">
                    {tPage("whatIs.paragraph2")}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* How to Decompose an Image into Layers */}
        <FeaturesStep features={howTo} className="py-16 md:py-24 bg-muted/30" />

        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* What You Can Do With joymagic AI Layered Decomposition */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <ScrollAnimation>
              <div className="mx-auto max-w-4xl text-center mb-12">
                <h2 className="text-3xl font-semibold md:text-4xl mb-4">
                  {tPage("useCases.title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {tPage("useCases.description")}
                </p>
              </div>
            </ScrollAnimation>
            <Features features={useCases} className="py-0" />
            <ScrollAnimation delay={0.3}>
              <div className="mx-auto max-w-2xl text-center mt-12">
                <p className="text-xl font-semibold text-foreground">
                  {tPage("useCases.tagline")}
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-4">
                    <Shield className="size-12 text-primary" />
                  </div>
                  <h2 className="text-3xl font-semibold md:text-4xl mb-4">
                    {tPage("privacy.title")}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {tPage("privacy.description")}
                  </p>
                </div>
              </ScrollAnimation>
              <ScrollAnimation delay={0.2}>
                <div className="grid gap-4 sm:grid-cols-3">
                  {tPage
                    .raw("privacy.points")
                    .map((point: string, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-card p-6 text-center"
                      >
                        <Lock className="size-6 text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{point}</p>
                      </div>
                    ))}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24 bg-muted/30" />

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold md:text-4xl mb-4">
                  {tPage("finalCTA.title")}
                </h2>
                <p
                  className="text-lg text-muted-foreground mb-8"
                  dangerouslySetInnerHTML={{
                    __html: tPage("finalCTA.description"),
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href="#playground"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {tPage("finalCTA.button")}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  {tPage("finalCTA.helperText")}
                </p>
              </ScrollAnimation>
            </div>
          </div>
        </section>
      </AiMediaPageLayout>
    </>
  );
}
