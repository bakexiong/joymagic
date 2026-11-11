import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { viduQ3ImageToVideoConfig } from "@/shared/blocks/desktop-playground";
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
const CANONICAL_PATH = "/image-to-video/vidu-q3";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.vidu-q3.imageToVideo.metadata");

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "Vidu Q3 Image to Video - Animate Photos with AI | Barko Bear",
  });
  const description = t("description", {
    defaultValue:
      "Turn images into video with Vidu Q3. Upload reference photos, control movement amplitude, generate video with optional audio and background music.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "vidu q3, image to video, ai video generator, animate photos, movement amplitude, background music, vidu q3 image to video",
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

export default async function ImageToVideoViduQ3Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tImageToVideo = await getTranslations("landing.vidu-q3.imageToVideo");
  const tViduQ3 = await getTranslations("landing.vidu-q3");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tImageToVideo.raw("hero.description") as string) ||
    "Vidu Q3 turns your images into video clips with customizable movement amplitude. Upload reference photos, control motion intensity, and generate video with optional audio and background music. Try Vidu Q3 for free below!";
  const heroData: HeroType = {
    id: "hero",
    title: tImageToVideo("hero.title", {
      defaultValue: "Vidu Q3 Image to Video",
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
        title: tImageToVideo("keyFeatures.movementControl.title", {
          defaultValue: "Movement Amplitude Control",
        }),
        description: tImageToVideo("keyFeatures.movementControl.description", {
          defaultValue:
            "Control the intensity of motion in your videos. Choose from auto, small, medium, or large movement amplitude to match your creative vision.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.flexibleDuration.title", {
          defaultValue: "Flexible Duration",
        }),
        description: tImageToVideo("keyFeatures.flexibleDuration.description", {
          defaultValue:
            "Generate videos from 1 to 16 seconds. Adjust the duration slider to create short clips or longer sequences.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.audioOptions.title", {
          defaultValue: "Audio Options",
        }),
        description: tImageToVideo("keyFeatures.audioOptions.description", {
          defaultValue:
            "Choose to generate audio or add background music. Customize your video's sound to enhance the viewing experience.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.multipleResolutions.title", {
          defaultValue: "Multiple Resolutions",
        }),
        description: tImageToVideo(
          "keyFeatures.multipleResolutions.description",
          {
            defaultValue:
              "Select from 540p, 720p, or 1080p resolutions to match your project requirements and quality needs.",
          },
        ),
        icon: "Image",
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
          defaultValue: "What is Vidu Q3 Image to Video?",
        }),
        answer: tImageToVideo("faq.q1.answer", {
          defaultValue:
            "Vidu Q3 Image to Video converts your uploaded images into video clips with customizable movement amplitude, duration, and audio options.",
        }),
      },
      {
        question: tImageToVideo("faq.q2.question", {
          defaultValue: "What is movement amplitude?",
        }),
        answer: tImageToVideo("faq.q2.answer", {
          defaultValue:
            "Movement amplitude controls how much motion appears in your video. Choose auto for automatic detection, or select small, medium, or large for specific intensity levels.",
        }),
      },
      {
        question: tImageToVideo("faq.q3.question", {
          defaultValue: "Can I add background music?",
        }),
        answer: tImageToVideo("faq.q3.answer", {
          defaultValue:
            "Yes. You can enable the background music option to add music to your generated videos.",
        }),
      },
      {
        question: tImageToVideo("faq.q4.question", {
          defaultValue: "What video durations are supported?",
        }),
        answer: tImageToVideo("faq.q4.answer", {
          defaultValue:
            "Vidu Q3 supports video durations from 1 to 16 seconds. Use the slider or input field to set your desired length.",
        }),
      },
      {
        question: tImageToVideo("faq.q5.question", {
          defaultValue: "What resolutions are available?",
        }),
        answer: tImageToVideo("faq.q5.answer", {
          defaultValue:
            "You can choose from 540p, 720p, or 1080p resolutions depending on your quality and file size preferences.",
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
    name: "Vidu Q3 Image to Video",
    description: heroDescriptionText,
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Movement Amplitude Control",
      "Flexible Duration",
      "Audio Options",
      "Multiple Resolutions",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Videos with Vidu Q3 Image to Video",
    description:
      "Turn images into video with Vidu Q3. Upload reference photos, control movement amplitude, generate video with optional audio and background music.",
    steps: [
      {
        name: "Upload reference image",
        text: "Upload a reference photo to convert to video",
      },
      {
        name: "Describe the motion",
        text: "Enter a prompt describing the motion and action you want in the video",
      },
      {
        name: "Adjust settings",
        text: "Set resolution, duration, movement amplitude, and audio options",
      },
      { name: "Generate", text: "Click generate to create your video" },
      {
        name: "Download",
        text: "Download your video with your chosen settings",
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
      { name: "Vidu Q3", url: CANONICAL_PATH },
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
        playgroundConfig={viduQ3ImageToVideoConfig}
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
