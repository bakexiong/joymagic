import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { seedance15ProTextToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  generateSoftwareApplicationSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld/index";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  CheckCircle2,
  Zap,
  Briefcase,
  Video,
  Users,
  ShoppingBag,
  Camera,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/text-to-video/seedance-1-5-pro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(
    "landing.seedance-1-5-pro.seedance15ProPage.metadata",
  );

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "Seedance 1.5 Pro Text to Video - AI Video with Lip-Sync | joymagic",
  });
  const description = t("description", {
    defaultValue:
      "Generate AI videos with synchronized dialogue using Seedance 1.5 Pro. Accurate lip-sync in multiple languages, cinematic camera control, multi-shot storytelling.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "seedance 1.5 pro, text to video, ai video generator, lip-sync, multilingual video, cinematic camera control, multi-shot storytelling, synchronized dialogue",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "joymagic",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
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

export default async function TextToVideoSeedance15ProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations(
    "landing.seedance-1-5-pro.seedance15ProPage",
  );
  const tSeedance = await getTranslations("landing.seedance-1-5-pro");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Seedance 1.5 Pro generates video and synchronized audio in a single pass. Describe your scene with dialogue—characters speak with lip movements matching multiple languages including English, Chinese, Japanese, Korean, and Spanish. Try Seedance 1.5 Pro for free below!<br/><br/>Have reference images? <a href="/image-to-video/seedance-1-5-pro" class="text-primary underline">Try Seedance 1.5 Pro Image to Video</a> for character animation.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Seedance 1.5 Pro Text to Video",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", { defaultValue: "Try Now" }),
        url: "#playground",
        variant: "default",
      },
      {
        title: tPage("hero.button2", { defaultValue: "View Pricing" }),
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // Key Features - Learn More Section
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", { defaultValue: "Key Features" }),
    description: "",
    items: [
      {
        title: tPage("keyFeatures.multilingualLipSync.title", {
          defaultValue: "Multilingual Lip-Sync",
        }),
        description: tPage("keyFeatures.multilingualLipSync.description", {
          defaultValue:
            "Characters speak with accurate lip movements matching your dialogue. Supports multiple languages including English, Chinese, Japanese, Korean, Spanish, Indonesian, and Portuguese, plus regional dialects. No dubbing artifacts or timing mismatches.",
        }),
        icon: "Users",
      },
      {
        title: tPage("keyFeatures.multiShotStorytelling.title", {
          defaultValue: "Multi-Shot Storytelling",
        }),
        description: tPage("keyFeatures.multiShotStorytelling.description", {
          defaultValue:
            "Generate videos with multiple scenes that maintain narrative coherence. Characters, lighting, and visual style stay consistent across different shots—create story sequences, not just isolated clips.",
        }),
        icon: "Video",
      },
      {
        title: tPage("keyFeatures.cinematicCameraControl.title", {
          defaultValue: "Cinematic Camera Control",
        }),
        description: tPage("keyFeatures.cinematicCameraControl.description", {
          defaultValue:
            "Direct your video like a cinematographer. Specify pan, tilt, zoom, orbit, and tracking shots in your prompt. The model executes professional camera movements with precise framing.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.jointAudioVisual.title", {
          defaultValue: "Joint Audio-Visual Generation",
        }),
        description: tPage("keyFeatures.jointAudioVisual.description", {
          defaultValue:
            "Video and audio generate together, not sequentially. Dialogue timing, sound effect placement, and music sync are built into the generation process—no manual alignment needed.",
        }),
        icon: "Zap",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "FAQ" }),
    description: "",
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Seedance 1.5 Pro?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Seedance 1.5 Pro is ByteDance's AI video model that generates video and audio simultaneously. It specializes in accurate lip-sync across multiple languages.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How is this different from Veo 3.1?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Seedance 1.5 Pro focuses on precise multilingual lip-sync and multi-shot storytelling. Veo 3.1 offers broader creative flexibility with first/last frame control and video extension. Choose Seedance when lip-sync accuracy matters.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What languages does lip-sync support?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "English, Chinese (including regional dialects), Japanese, Korean, Spanish, Indonesian, Portuguese, and more.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "Can I control camera movement?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Yes. Describe pan, tilt, zoom, orbit, or tracking shots in your prompt. The model executes professional cinematography.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What's the difference from Image to Video?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Text to Video generates everything from your description. Image to Video uses uploaded photos to control character appearance while animating them with lip-sync.",
        }),
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

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Seedance 1.5 Pro Text to Video",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Multilingual Lip-Sync",
      "Multi-Shot Storytelling",
      "Cinematic Camera Control",
      "Joint Audio-Visual Generation",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Videos with Seedance 1.5 Pro",
    description:
      "Generate AI videos with synchronized dialogue using Seedance 1.5 Pro with accurate lip-sync in multiple languages",
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe your scene with dialogue—characters speak with lip movements matching multiple languages",
      },
      {
        name: "Generate",
        text: "Click generate to create your video with synchronized audio in a single pass",
      },
      {
        name: "Download",
        text: "Download your video with accurate lip-sync and professional camera movements",
      },
    ],
    totalTime: "PT60S",
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
      { name: "Text to Video", url: "/text-to-video" },
      { name: "Seedance 1.5 Pro", url: CANONICAL_PATH },
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
        playgroundConfig={seedance15ProTextToVideoConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", { defaultValue: "Use Cases" })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.multilingualMarketing.title", {
                          defaultValue: "Multilingual Marketing",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.multilingualMarketing.description", {
                        defaultValue:
                          "Create the same ad in multiple languages with accurate lip-sync. No reshoots, no dubbing artifacts.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.shortFormStorytelling.title", {
                          defaultValue: "Short-Form Storytelling",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.shortFormStorytelling.description", {
                        defaultValue:
                          "Generate multi-shot narrative sequences with consistent characters for web series and social content.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.explainerVideos.title", {
                          defaultValue: "Explainer Videos",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.explainerVideos.description", {
                        defaultValue:
                          "Produce talking-head style content with synchronized speech. Characters explain concepts naturally.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingBag className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.socialMediaAds.title", {
                          defaultValue: "Social Media Ads",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.socialMediaAds.description", {
                        defaultValue:
                          "Create scroll-stopping video ads with dialogue hooks. Test multiple scripts rapidly.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24 bg-muted/30" />
      </AiMediaPageLayout>
    </>
  );
}
