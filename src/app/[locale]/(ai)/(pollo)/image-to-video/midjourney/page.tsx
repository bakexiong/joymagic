import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { midjourneyImageToVideoConfig } from "@/shared/blocks/desktop-playground";
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
const CANONICAL_PATH = "/image-to-video/midjourney";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(
    "landing.midjourney-image-to-video.imageToVideo.metadata",
  );

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue: "Midjourney Image to Video - AI Video Generator | joymagic",
  });
  const description = t("description", {
    defaultValue:
      "Transform images into stunning videos with Midjourney AI. Control motion, quality, and style parameters to create professional video content.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "image to video midjourney, midjourney video generator, ai video from image, midjourney animation, image animation ai",
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

export default async function ImageToVideoMidjourneyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tImageToVideo = await getTranslations(
    "landing.midjourney-image-to-video.imageToVideo",
  );
  const tMidjourney = await getTranslations(
    "landing.midjourney-image-to-video",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tImageToVideo.raw("hero.description") as string) ||
    "Transform your images into captivating videos with Midjourney AI. Upload images, add prompts, control motion parameters, and generate high-quality videos with advanced AI technology. Try Midjourney Image to Video for free below!";
  const heroData: HeroType = {
    id: "hero",
    title: tImageToVideo("hero.title", {
      defaultValue: "Midjourney Image to Video",
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
        title: tImageToVideo("keyFeatures.advancedMotion.title", {
          defaultValue: "Advanced Motion Control",
        }),
        description: tImageToVideo("keyFeatures.advancedMotion.description", {
          defaultValue:
            "Control motion intensity with low or high settings. Fine-tune the movement in your videos to match your creative vision.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.qualityControl.title", {
          defaultValue: "Quality Control",
        }),
        description: tImageToVideo("keyFeatures.qualityControl.description", {
          defaultValue:
            "Adjust quality from 0.25 to 2 to balance detail and processing time. Higher quality produces more detailed and refined videos.",
        }),
        icon: "Video",
      },
      {
        title: tImageToVideo("keyFeatures.styleParameters.title", {
          defaultValue: "Style Parameters",
        }),
        description: tImageToVideo("keyFeatures.styleParameters.description", {
          defaultValue:
            "Use stylize (0-1000), chaos (0-100), and weird (0-3000) parameters to control artistic style, variety, and unconventional results.",
        }),
        icon: "Palette",
      },
      {
        title: tImageToVideo("keyFeatures.multipleResolutions.title", {
          defaultValue: "Multiple Resolutions",
        }),
        description: tImageToVideo(
          "keyFeatures.multipleResolutions.description",
          {
            defaultValue:
              "Choose from 480p or 720p resolutions. Select the resolution that best fits your project needs.",
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
          defaultValue: "What is Midjourney Image to Video?",
        }),
        answer: tImageToVideo("faq.q1.answer", {
          defaultValue:
            "Midjourney Image to Video converts your uploaded images into video clips with customizable motion, quality, and style parameters using advanced AI technology.",
        }),
      },
      {
        question: tImageToVideo("faq.q2.question", {
          defaultValue: "What motion settings are available?",
        }),
        answer: tImageToVideo("faq.q2.answer", {
          defaultValue:
            "You can choose between low and high motion settings to control the intensity of movement in your generated videos.",
        }),
      },
      {
        question: tImageToVideo("faq.q3.question", {
          defaultValue: "What is the quality parameter?",
        }),
        answer: tImageToVideo("faq.q3.answer", {
          defaultValue:
            "The quality parameter ranges from 0.25 to 2 and controls image detail and processing time. Higher values produce more detailed results but take longer to process.",
        }),
      },
      {
        question: tImageToVideo("faq.q4.question", {
          defaultValue: "What are stylize, chaos, and weird parameters?",
        }),
        answer: tImageToVideo("faq.q4.answer", {
          defaultValue:
            "Stylize (0-1000) controls artistic style, chaos (0-100) adds variety to results, and weird (0-3000) makes images more quirky and unconventional.",
        }),
      },
      {
        question: tImageToVideo("faq.q5.question", {
          defaultValue: "What resolutions are supported?",
        }),
        answer: tImageToVideo("faq.q5.answer", {
          defaultValue:
            "Midjourney Image to Video supports 480p and 720p resolutions. Choose the resolution that best matches your project requirements.",
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
      defaultValue:
        "Start generating amazing videos from your images with Midjourney AI today.",
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
    name: "Midjourney Image to Video",
    description: heroDescriptionText,
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Advanced Motion Control",
      "Quality Control",
      "Style Parameters",
      "Multiple Resolutions",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Videos with Midjourney Image to Video",
    description:
      "Transform images into videos with Midjourney AI. Upload images, add prompts, control motion parameters, and generate high-quality videos.",
    steps: [
      { name: "Upload image", text: "Upload an image to convert to video" },
      {
        name: "Add prompt",
        text: "Enter a prompt describing the motion and action you want",
      },
      {
        name: "Adjust parameters",
        text: "Set resolution, motion, quality, and style parameters",
      },
      { name: "Generate", text: "Click generate to create your video" },
      { name: "Download", text: "Download your generated video" },
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
      { name: "Midjourney", url: CANONICAL_PATH },
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
        playgroundConfig={midjourneyImageToVideoConfig}
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
                        {tImageToVideo("useCases.productShowcase.title", {
                          defaultValue: "Product Showcase",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.productShowcase.description", {
                        defaultValue:
                          "Transform product images into engaging video demonstrations with controlled motion and professional quality.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.artisticAnimation.title", {
                          defaultValue: "Artistic Animation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.artisticAnimation.description", {
                        defaultValue:
                          "Bring artwork and illustrations to life with customizable style parameters and motion controls.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.contentCreation.title", {
                          defaultValue: "Content Creation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo("useCases.contentCreation.description", {
                        defaultValue:
                          "Create engaging social media content and marketing videos from static images with AI-powered animation.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tImageToVideo("useCases.creativeExperiments.title", {
                          defaultValue: "Creative Experiments",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tImageToVideo(
                        "useCases.creativeExperiments.description",
                        {
                          defaultValue:
                            "Experiment with chaos and weird parameters to create unique, unconventional video effects and artistic styles.",
                        },
                      )}
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
