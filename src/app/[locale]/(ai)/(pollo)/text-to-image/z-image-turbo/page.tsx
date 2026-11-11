import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CTA } from "@/themes/default/blocks/cta";
import { FAQ } from "@/themes/default/blocks/faq";
import { Features } from "@/themes/default/blocks/features";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { zImageTurboTextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
  Landing,
} from "@/shared/types/blocks/landing";
import { ArrowRight, CheckCircle2, Sparkles, Wand2, Zap } from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  canonicalUrl: "/text-to-image/z-image-turbo",
});

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");

  const page: Landing = {
    hero: t.raw("hero"),
    introduce: t.raw("introduce"),
    benefits: t.raw("benefits"),
    features: t.raw("features"),
    faq: t.raw("faq"),
  };

  const header = t.raw("header");
  const headerNavItems = header?.nav?.items || [];
  const heroData = page.hero as HeroType;
  const introSection = page.introduce as FeaturesType | undefined;
  const benefitsSection = page.benefits as FeaturesType | undefined;
  const capabilitiesSection = page.features as FeaturesType | undefined;
  const faqData = page.faq as FAQType | undefined;

  const finalCTA: CTAType = {
    id: "final-cta",
    title: "Start Creating with Z Image Turbo",
    description:
      "Use the faster workbench to move from prompt to polished image without leaving the page.",
    buttons: [
      {
        title: "Open Workbench",
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Barko Bear AI Z Image Turbo",
    description: String(heroData?.description || "").replace(/<[^>]*>/g, ""),
    url: "/text-to-image/z-image-turbo",
    locale,
    category: "MultimediaApplication",
    features: (benefitsSection?.items || [])
      .map((item) => item.title || "")
      .filter(Boolean),
  });

  const howToSchema = generateHowToSchema({
    name: "How to Use Z Image Turbo Text to Image",
    description:
      introSection?.description ||
      "Write a prompt, tune the output settings, and generate an image.",
    steps:
      capabilitiesSection?.items?.slice(0, 4).map((item) => ({
        name: item.title || "",
        text: typeof item.description === "string" ? item.description : "",
      })) || [],
    totalTime: "PT2M",
  });

  const faqSchema = generateFAQSchema(
    faqData?.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer === "string" ? item.answer : "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Text to Image", url: "/text-to-image" },
      { name: "Z Image Turbo", url: "/text-to-image/z-image-turbo" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd
        data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]}
      />
      {heroData ? (
        <AiMediaPageLayout
          hero={heroData}
          headerNavItems={headerNavItems}
          playgroundConfig={zImageTurboTextToImageConfig}
        >
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.95fr]">
                <ScrollAnimation>
                  <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                        {introSection?.label || "Overview"}
                      </p>
                      <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                        {introSection?.title || heroData.title}
                      </h2>
                    </div>
                    <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                      {introSection?.description || heroData.description}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(benefitsSection?.items || []).slice(0, 3).map((item, index) => {
                        const Icon =
                          [CheckCircle2, Zap, Sparkles][index] || Wand2;
                        return (
                          <div
                            key={item.title || index}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <Icon className="size-5 text-white/75" />
                            <p className="mt-3 text-sm text-white/90">
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation>
                  <div className="h-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)]">
                    <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                      Workbench
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                      Generate with the new Z Image Turbo workspace
                    </h3>
                    <div className="mt-8 space-y-4">
                      {[
                        "Write the prompt directly in the desktop workbench.",
                        "Switch aspect ratio, seed, and output format without leaving the page.",
                        "Move between scene and model routes from the same header controls.",
                        "Keep the result area and generation controls in one focused layout.",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <ArrowRight className="mt-0.5 size-4 shrink-0 text-white/65" />
                          <p className="text-sm leading-7 text-white/82">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {benefitsSection ? (
            <Features
              features={benefitsSection}
              className="py-16 md:py-24"
            />
          ) : null}

          {capabilitiesSection ? (
            <Features
              features={capabilitiesSection}
              className="bg-muted/30 py-16 md:py-24"
            />
          ) : null}

          {introSection?.items?.length ? (
            <section className="py-16 md:py-24">
              <div className="container">
                <div className="mx-auto max-w-5xl">
                  <ScrollAnimation>
                    <div className="mx-auto max-w-3xl text-center">
                      <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                        Workflow
                      </p>
                      <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                        Explore the model strengths
                      </h2>
                      <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
                        {introSection.description}
                      </p>
                    </div>
                  </ScrollAnimation>

                  <div className="mt-12 grid gap-5 md:grid-cols-2">
                    {introSection.items.map((item, index) => (
                      <ScrollAnimation key={item.title || index}>
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white/88">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="text-lg font-semibold">
                              {item.title}
                            </h3>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </ScrollAnimation>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {faqData ? <FAQ faq={faqData} className="py-16 md:py-24" /> : null}
          <CTA cta={finalCTA} className="py-16 md:py-24" />
        </AiMediaPageLayout>
      ) : null}
    </>
  );
}
