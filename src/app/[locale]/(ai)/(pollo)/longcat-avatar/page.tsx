import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { longcatAvatarConfig } from "@/shared/blocks/desktop-playground";
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
  Image,
  Video,
  User,
  Palette,
  Package,
  Camera,
  Music,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/longcat-avatar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.longcat-avatar.metadata");

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "Longcat Avatar - AI Talking Avatar Video Generator with Lip-Sync | Barko Bear",
  });
  const description = t("description", {
    defaultValue:
      "Create professional AI avatar videos with Longcat Avatar. Generate synchronized talking avatar videos from audio and images with perfect lip-sync. Support up to 2 minutes, 480p/720p HD quality. Free trial available.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "longcat avatar, longcat-avatar, ai avatar video generator, talking avatar, ai talking avatar, avatar video maker, lip-sync avatar, ai avatar generator, animated avatar video, avatar video creator, ai video avatar, digital avatar video, virtual avatar generator",
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

export default async function LongcatAvatarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tLongcatAvatar = await getTranslations("landing.longcat-avatar");
  const tHeader = await getTranslations("landing.header");

  // 獲取 header 導航菜單項
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tLongcatAvatar.raw("hero.description") as string) ||
    "Create AI avatar videos with Longcat Avatar. Upload audio and image to generate synchronized avatar videos up to 2 minutes long.";
  const heroData: HeroType = {
    id: "hero",
    title: tLongcatAvatar("hero.title", { defaultValue: "Longcat Avatar" }),
    description: heroDescription,
    buttons: [
      {
        title: tLongcatAvatar("hero.button1", { defaultValue: "Try Now" }),
        url: "#playground",
        variant: "default",
      },
      {
        title: tLongcatAvatar("hero.button2", { defaultValue: "View Pricing" }),
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tLongcatAvatar("keyFeatures.title", {
      defaultValue: "Key Features",
    }),
    description: "",
    items: [
      {
        title: tLongcatAvatar("keyFeatures.audioSync.title", {
          defaultValue: "Audio Synchronization",
        }),
        description: tLongcatAvatar("keyFeatures.audioSync.description", {
          defaultValue:
            "Upload audio files and generate avatar videos with perfect lip-sync and facial expressions synchronized to your audio.",
        }),
        icon: "Music",
      },
      {
        title: tLongcatAvatar("keyFeatures.imageControl.title", {
          defaultValue: "Image Control",
        }),
        description: tLongcatAvatar("keyFeatures.imageControl.description", {
          defaultValue:
            "Use any image as your avatar base. The AI will animate facial features and expressions based on your audio input.",
        }),
        icon: "Image",
      },
      {
        title: tLongcatAvatar("keyFeatures.highQuality.title", {
          defaultValue: "High Quality Output",
        }),
        description: tLongcatAvatar("keyFeatures.highQuality.description", {
          defaultValue:
            "Generate videos in 480p or 720p resolution with smooth animations and natural movements.",
        }),
        icon: "Video",
      },
      {
        title: tLongcatAvatar("keyFeatures.longDuration.title", {
          defaultValue: "Long Duration Support",
        }),
        description: tLongcatAvatar("keyFeatures.longDuration.description", {
          defaultValue:
            "Create avatar videos up to 2 minutes long, perfect for presentations, tutorials, and content creation.",
        }),
        icon: "Video",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tLongcatAvatar("faq.title", { defaultValue: "FAQ" }),
    description: "",
    items: [
      {
        question: tLongcatAvatar("faq.q1.question", {
          defaultValue: "What is Longcat Avatar?",
        }),
        answer: tLongcatAvatar("faq.q1.answer", {
          defaultValue:
            "Longcat Avatar is an AI-powered tool that generates avatar videos from audio and image inputs. It creates synchronized animations with lip-sync and facial expressions.",
        }),
      },
      {
        question: tLongcatAvatar("faq.q2.question", {
          defaultValue: "What audio formats are supported?",
        }),
        answer: tLongcatAvatar("faq.q2.answer", {
          defaultValue:
            "We support common audio formats including MP3, WAV, and other standard audio formats. Maximum duration is 2 minutes.",
        }),
      },
      {
        question: tLongcatAvatar("faq.q3.question", {
          defaultValue: "What image formats can I use?",
        }),
        answer: tLongcatAvatar("faq.q3.answer", {
          defaultValue:
            "You can upload any standard image format (JPG, PNG, etc.). For best results, use clear front-facing portraits.",
        }),
      },
      {
        question: tLongcatAvatar("faq.q4.question", {
          defaultValue: "What resolutions are available?",
        }),
        answer: tLongcatAvatar("faq.q4.answer", {
          defaultValue:
            "You can choose between 480p and 720p resolution. Higher resolution requires more credits.",
        }),
      },
      {
        question: tLongcatAvatar("faq.q5.question", {
          defaultValue: "How long can the videos be?",
        }),
        answer: tLongcatAvatar("faq.q5.answer", {
          defaultValue:
            "Videos can be up to 2 minutes (120 seconds) long. Credits are calculated per 5-second blocks.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tLongcatAvatar("finalCTA.title", {
      defaultValue: "Ready to Create?",
    }),
    description: tLongcatAvatar("finalCTA.description", {
      defaultValue: "Start generating amazing avatar videos today.",
    }),
    buttons: [
      {
        title: tLongcatAvatar("finalCTA.button", {
          defaultValue: "Try It Now",
        }),
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
    name: tLongcatAvatar("schema.softwareName", {
      defaultValue: "Longcat Avatar - AI Talking Avatar Video Generator",
    }),
    description: heroDescriptionText,
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      tLongcatAvatar("schema.features.audioSync", {
        defaultValue: "Longcat Avatar Audio Synchronization",
      }),
      tLongcatAvatar("schema.features.imageControl", {
        defaultValue: "Longcat Avatar Image Control",
      }),
      tLongcatAvatar("schema.features.highQuality", {
        defaultValue: "Longcat Avatar HD Quality Output",
      }),
      tLongcatAvatar("schema.features.longDuration", {
        defaultValue: "Longcat Avatar Long Duration Support",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tLongcatAvatar("schema.howToName", {
      defaultValue: "How to Generate Avatar Videos with Longcat Avatar",
    }),
    description: tLongcatAvatar("schema.howToDescription", {
      defaultValue:
        "Learn how to create professional AI avatar videos with Longcat Avatar. Upload audio and image, choose resolution, and generate synchronized talking avatar videos with perfect lip-sync using Longcat Avatar.",
    }),
    steps: [
      {
        name: tLongcatAvatar("schema.step1.name", {
          defaultValue: "Upload audio to Longcat Avatar",
        }),
        text: tLongcatAvatar("schema.step1.text", {
          defaultValue:
            "Upload an audio file (MP3, WAV, etc.) up to 2 minutes long to Longcat Avatar",
        }),
      },
      {
        name: tLongcatAvatar("schema.step2.name", {
          defaultValue: "Upload image to Longcat Avatar",
        }),
        text: tLongcatAvatar("schema.step2.text", {
          defaultValue:
            "Upload an image to use as your avatar base in Longcat Avatar",
        }),
      },
      {
        name: tLongcatAvatar("schema.step3.name", {
          defaultValue: "Choose resolution in Longcat Avatar",
        }),
        text: tLongcatAvatar("schema.step3.text", {
          defaultValue:
            "Select 480p or 720p resolution for your Longcat Avatar video",
        }),
      },
      {
        name: tLongcatAvatar("schema.step4.name", {
          defaultValue: "Generate with Longcat Avatar",
        }),
        text: tLongcatAvatar("schema.step4.text", {
          defaultValue:
            "Click generate to create your avatar video with Longcat Avatar's synchronized animations and lip-sync",
        }),
      },
      {
        name: tLongcatAvatar("schema.step5.name", {
          defaultValue: "Download Longcat Avatar video",
        }),
        text: tLongcatAvatar("schema.step5.text", {
          defaultValue: "Download your generated Longcat Avatar video",
        }),
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
      {
        name: tLongcatAvatar("breadcrumb.home", { defaultValue: "Home" }),
        url: "/",
      },
      {
        name: tLongcatAvatar("breadcrumb.videoAI", {
          defaultValue: "Video AI",
        }),
        url: "/#video-ai",
      },
      {
        name: tLongcatAvatar("breadcrumb.longcatAvatar", {
          defaultValue: "Longcat Avatar",
        }),
        url: CANONICAL_PATH,
      },
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
        playgroundConfig={longcatAvatarConfig}
      >
        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tLongcatAvatar("useCases.title", {
                    defaultValue: "Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tLongcatAvatar("useCases.presentations.title", {
                          defaultValue: "Presentations",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tLongcatAvatar("useCases.presentations.description", {
                        defaultValue:
                          "Create engaging presentation videos with animated avatars explaining your content.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tLongcatAvatar("useCases.tutorials.title", {
                          defaultValue: "Tutorials",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tLongcatAvatar("useCases.tutorials.description", {
                        defaultValue:
                          "Produce tutorial videos with animated avatars guiding viewers through your content.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tLongcatAvatar("useCases.contentCreation.title", {
                          defaultValue: "Content Creation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tLongcatAvatar("useCases.contentCreation.description", {
                        defaultValue:
                          "Generate social media content with animated avatars speaking your script.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tLongcatAvatar("useCases.personalization.title", {
                          defaultValue: "Personalization",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tLongcatAvatar("useCases.personalization.description", {
                        defaultValue:
                          "Create personalized avatar videos with your own image and voice.",
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
