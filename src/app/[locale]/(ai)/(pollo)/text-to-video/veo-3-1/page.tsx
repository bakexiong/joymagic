import { getTranslations, setRequestLocale } from "next-intl/server";
import { envConfigs } from "@/config";
import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { veo31TextToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  Video,
  Briefcase,
  Volume2,
  Camera,
  Frame,
  Maximize2,
  Lightbulb,
  Film,
  GraduationCap,
} from "lucide-react";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/text-to-video/veo-3-1";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("landing.veo-3-1.textToVideo.metadata");
  const metadataFn = getMetadata({
    title: t("title"),
    description: t("description"),
    metadataKey: "landing.veo-3-1.metadata",
    canonicalUrl: CANONICAL_PATH,
  });

  return metadataFn({ params: Promise.resolve({ locale }) });
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

export default async function TextToVideoVeo31Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations("landing.veo-3-1.veo31Page");
  const tTextToVideo = await getTranslations("landing.veo-3-1.textToVideo");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription = tTextToVideo.raw("hero.description") as string;
  const heroData: HeroType = {
    id: "hero",
    title: tTextToVideo("hero.title"),
    description: heroDescription,
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

  // Key Features - Learn More Section
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tTextToVideo("keyFeatures.title"),
    description: "",
    items: [
      {
        title: tTextToVideo("keyFeatures.nativeAudio.title"),
        description: tTextToVideo("keyFeatures.nativeAudio.description"),
        icon: "Volume2",
      },
      {
        title: tTextToVideo("keyFeatures.cinematicCamera.title"),
        description: tTextToVideo("keyFeatures.cinematicCamera.description"),
        icon: "Camera",
      },
      {
        title: tTextToVideo("keyFeatures.frameControl.title"),
        description: tTextToVideo("keyFeatures.frameControl.description"),
        icon: "Frame",
      },
      {
        title: tTextToVideo("keyFeatures.videoExtension.title"),
        description: tTextToVideo("keyFeatures.videoExtension.description"),
        icon: "Maximize2",
      },
    ],
  };

  // FAQ - Updated with specified questions
  const faqData: FAQType = {
    id: "faq",
    title: tTextToVideo("faq.title"),
    description: "",
    items: [
      {
        question: tTextToVideo("faq.q1.question"),
        answer: tTextToVideo("faq.q1.answer"),
      },
      {
        question: tTextToVideo("faq.q2.question"),
        answer: tTextToVideo("faq.q2.answer"),
      },
      {
        question: tTextToVideo("faq.q3.question"),
        answer: tTextToVideo("faq.q3.answer"),
      },
      {
        question: tTextToVideo("faq.q4.question"),
        answer: tTextToVideo("faq.q4.answer"),
      },
      {
        question: tTextToVideo("faq.q5.question"),
        answer: tTextToVideo("faq.q5.answer"),
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
        name: "Veo 3.1",
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
        playgroundConfig={veo31TextToVideoConfig}
      >
        {/* Learn More Section - Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Prompting Tips */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tTextToVideo("promptingTips.title")}
                </h2>
                <div className="grid gap-6 md:grid-cols-3 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <Camera className="size-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tTextToVideo("promptingTips.cameraMovement.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("promptingTips.cameraMovement.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <Volume2 className="size-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tTextToVideo("promptingTips.audioDetails.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("promptingTips.audioDetails.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <Lightbulb className="size-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tTextToVideo("promptingTips.lighting.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("promptingTips.lighting.description")}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tTextToVideo("useCases.title")}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tTextToVideo("useCases.socialMedia.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("useCases.socialMedia.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tTextToVideo("useCases.adPrevisualization.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("useCases.adPrevisualization.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Film className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tTextToVideo("useCases.storyboard.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("useCases.storyboard.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tTextToVideo("useCases.educational.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tTextToVideo("useCases.educational.description")}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24 bg-muted/30" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
