import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { veo31ImageToVideoConfig } from "@/shared/blocks/desktop-playground";
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
import { Image, Video, User, Palette, Package, Camera } from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/image-to-video/veo-3-1";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.veo-3-1.imageToVideo.metadata");

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "Veo 3.1 Image to Video - Animate Photos with AI | Barko Bear",
  });
  const description = t("description", {
    defaultValue:
      "Turn images into video with Google Veo 3.1. Upload reference photos, maintain character consistency, generate cinematic video with native audio.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "veo 3.1, image to video, ai video generator, animate photos, character consistency, cinematic video, native audio, google veo",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Barko Bear",
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

export default async function ImageToVideoVeo31Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tImageToVideo = await getTranslations("landing.veo-3-1.imageToVideo");
  const tVeo31 = await getTranslations("landing.veo-3-1");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tImageToVideo.raw("hero.description") as string) ||
    'Google Veo 3.1 turns your images into video clips with synchronized audio. Upload reference photos to control character identity, scene composition, or visual style—then describe the motion you want. Try Veo 3.1 for free below!<br/><br/>No reference images? <a href="/text-to-video/veo-3-1" class="text-primary underline">Try Veo 3.1 Text to Video</a> to generate from scratch.';
  const heroData: HeroType = {
    id: "hero",
    title: tImageToVideo("hero.title", {
      defaultValue: "Veo 3.1 Image to Video",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tImageToVideo("hero.button1", { defaultValue: "Try Now" }),
        url: "#playground",
        variant: "default",
      },
      {
        title: tImageToVideo("hero.button2", { defaultValue: "View Pricing" }),
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // Key Features - Learn More Section
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tImageToVideo("keyFeatures.title", { defaultValue: "Key Features" }),
    description: "",
    items: [
      {
        title: tImageToVideo("keyFeatures.multiImageReference.title", {
          defaultValue: "Multi-Image Reference",
        }),
        description: tImageToVideo(
          "keyFeatures.multiImageReference.description",
          {
            defaultValue:
              "Upload multiple images to guide your video's visual direction. Use one for character reference, another for style, a third for scene composition—the model combines them intelligently.",
          },
        ),
        icon: "Image",
      },
      {
        title: tImageToVideo("keyFeatures.characterConsistency.title", {
          defaultValue: "Character Consistency",
        }),
        description: tImageToVideo(
          "keyFeatures.characterConsistency.description",
          {
            defaultValue:
              "Your character looks identical throughout the video. Upload a clear reference—facial features, proportions, clothing details stay locked across all frames, poses, and camera angles.",
          },
        ),
        icon: "User",
      },
      {
        title: tImageToVideo("keyFeatures.realisticMotion.title", {
          defaultValue: "Realistic Motion",
        }),
        description: tImageToVideo("keyFeatures.realisticMotion.description", {
          defaultValue:
            "Static images come alive with natural movement. Hair flows, fabric shifts, expressions change—all while maintaining visual identity from your reference photos.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.nativeAudioSync.title", {
          defaultValue: "Native Audio Sync",
        }),
        description: tImageToVideo("keyFeatures.nativeAudioSync.description", {
          defaultValue:
            "Generated video includes synchronized audio—footsteps, ambient sounds, dialogue. Audio matches the motion and scene automatically based on your prompt.",
        }),
        icon: "Video",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tImageToVideo("faq.title", { defaultValue: "FAQ" }),
    description: "",
    items: [
      {
        question: tImageToVideo("faq.q1.question", {
          defaultValue: "What is Image to Video?",
        }),
        answer: tImageToVideo("faq.q1.answer", {
          defaultValue:
            "Image to Video uses your uploaded photos to control the visual output. The model generates motion and audio while preserving character identity, style, or composition from your references.",
        }),
      },
      {
        question: tImageToVideo("faq.q2.question", {
          defaultValue: "How many images can I upload?",
        }),
        answer: tImageToVideo("faq.q2.answer", {
          defaultValue:
            "Multiple reference images are supported. Use different images to control different aspects—character, style, scene.",
        }),
      },
      {
        question: tImageToVideo("faq.q3.question", {
          defaultValue: "Will my character stay consistent?",
        }),
        answer: tImageToVideo("faq.q3.answer", {
          defaultValue:
            "Yes. Veo 3.1 preserves character identity across all frames. Upload a clear front-facing reference for best results.",
        }),
      },
      {
        question: tImageToVideo("faq.q4.question", {
          defaultValue: "Does it include audio?",
        }),
        answer: tImageToVideo("faq.q4.answer", {
          defaultValue:
            "Yes. Generated videos include synchronized ambient sounds, effects, and dialogue based on your prompt.",
        }),
      },
      {
        question: tImageToVideo("faq.q5.question", {
          defaultValue: "How is this different from Text to Video?",
        }),
        answer: tImageToVideo("faq.q5.answer", {
          defaultValue:
            "Text to Video generates everything from scratch. Image to Video uses your photos to control visual identity while generating motion.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tImageToVideo("finalCTA.title", {
      defaultValue: "Ready to Create?",
    }),
    description: tImageToVideo("finalCTA.description", {
      defaultValue: "Start generating amazing videos from your images today.",
    }),
    buttons: [
      {
        title: tImageToVideo("finalCTA.button", { defaultValue: "Try It Now" }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);
  const heroDescriptionText = heroDescription
    .replace(/<[^>]*>/g, "")
    .substring(0, 200);

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Veo 3.1 Image to Video",
    description: heroDescriptionText,
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Multi-Image Reference",
      "Character Consistency",
      "Realistic Motion",
      "Native Audio Sync",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Videos with Veo 3.1 Image to Video",
    description:
      "Turn images into video with Google Veo 3.1. Upload reference photos, maintain character consistency, generate cinematic video with native audio.",
    steps: [
      {
        name: "Upload reference images",
        text: "Upload one or multiple reference photos to control character identity, style, or scene composition",
      },
      {
        name: "Describe the motion",
        text: "Enter a prompt describing the motion and action you want in the video",
      },
      {
        name: "Generate",
        text: "Click generate to create your video with synchronized audio",
      },
      {
        name: "Download",
        text: "Download your video with maintained character consistency and realistic motion",
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
      { name: "Image to Video", url: "/image-to-video" },
      { name: "Veo 3.1", url: CANONICAL_PATH },
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
        playgroundConfig={veo31ImageToVideoConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tImageToVideo("useCases.title", {
                    defaultValue: "Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.productAnimation.title", {
                          defaultValue: "Product Animation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.productAnimation.description", {
                        defaultValue:
                          "Turn product photos into demo videos showing rotation, usage, or lifestyle contexts.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.characterAnimation.title", {
                          defaultValue: "Character Animation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo(
                        "useCases.characterAnimation.description",
                        {
                          defaultValue:
                            "Bring character designs and concept art to life with movement and expressions.",
                        },
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.portraitVideos.title", {
                          defaultValue: "Portrait Videos",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.portraitVideos.description", {
                        defaultValue:
                          "Animate portrait photos with subtle movements—blinking, head turns, gentle smiles.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.styleMatchedClips.title", {
                          defaultValue: "Style-Matched Clips",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.styleMatchedClips.description", {
                        defaultValue:
                          "Upload style references to generate videos matching a specific aesthetic or art direction.",
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
