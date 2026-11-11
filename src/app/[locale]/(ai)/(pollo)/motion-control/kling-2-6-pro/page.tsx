import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { locales, defaultLocale } from "@/config/locale";
import { Hero } from "@/themes/default/blocks/hero";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { kling26ProMotionControlConfig } from "@/shared/blocks/desktop-playground";
import { JsonLd } from "@/shared/components/jsonld";
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/motion-control/kling-2-6-pro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(
    "landing.kling-2-6-pro-motion-control.kling26ProMotionControlPage.metadata",
  );

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "Kling 2.6 Pro Motion Control | Image to Video with Motion Control | AI Video Generator | Barko Bear",
  });
  const description = t("description", {
    defaultValue:
      "Transform images into videos with Kling 2.6 Pro motion control. Upload an image and reference video to create motion-controlled image-to-video content. Free AI-powered motion control image-to-video generator online.",
  });
  const keywords = t("keywords", {
    defaultValue:
      "kling-2-6-pro motion-control, kling 2.6 pro motion control, motion-control image-to-video, image-to-video motion control, kling motion control, AI motion control video, image to video with motion control, motion controlled video generator, kling 2.6 pro image to video, AI video motion control, motion control video generator, image to video AI, motion control AI video",
  });

  return {
    title,
    description,
    keywords,
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

export default async function KlingV26ProMotionControlPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHeader = await getTranslations("landing.header");
  const tPage = await getTranslations(
    "landing.kling-2-6-pro-motion-control.kling26ProMotionControlPage",
  );

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform static images into dynamic videos with Kling 2.6 Pro motion control. Upload an image and reference video to create professional image-to-video content with precise motion control. Free AI-powered motion-control image-to-video generator.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Kling 2.6 Pro Motion Control - Image to Video with AI",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", { defaultValue: "Start Creating Free" }),
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

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", {
      defaultValue:
        "Why Choose Kling 2.6 Pro Motion Control for Image-to-Video?",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue:
        "Experience advanced motion control image-to-video generation with Kling 2.6 Pro. Transform images into videos with precise motion control powered by cutting-edge AI technology.",
    }),
    items: [
      {
        title: tPage("keyFeatures.preciseMotionControl.title", {
          defaultValue: "Precise Motion Control Image-to-Video",
        }),
        description: tPage("keyFeatures.preciseMotionControl.description", {
          defaultValue:
            "Kling 2.6 Pro motion control analyzes both your image and reference video to create motion-controlled image-to-video content with precision. Perfect for transforming static images into dynamic videos.",
        }),
        icon: "Film",
      },
      {
        title: tPage("keyFeatures.dualInput.title", {
          defaultValue: "Dual Input: Image + Video for Motion Control",
        }),
        description: tPage("keyFeatures.dualInput.description", {
          defaultValue:
            "Upload an image for visual style and a reference video for motion patterns. Kling 2.6 Pro combines both inputs to generate professional motion-control image-to-video content.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.preserveAudio.title", {
          defaultValue: "Preserve Original Audio",
        }),
        description: tPage("keyFeatures.preserveAudio.description", {
          defaultValue:
            "Keep the original sound from your reference video when creating motion-control image-to-video content, maintaining authentic audio in your generated videos.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.advancedPrompts.title", {
          defaultValue: "Advanced Motion Control Prompts",
        }),
        description: tPage("keyFeatures.advancedPrompts.description", {
          defaultValue:
            "Fine-tune your motion-control image-to-video generation with detailed prompts and negative prompts, giving you complete creative control over the motion patterns.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue:
        "Everything you need to know about Kling 2.6 Pro motion control for image-to-video generation.",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Kling 2.6 Pro motion control image-to-video?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Kling 2.6 Pro motion control is an AI-powered image-to-video tool that transforms static images into dynamic videos with precise motion control. By providing both an image and a reference video, the AI analyzes both inputs to create motion-controlled image-to-video content with professional quality.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue:
            "How does Kling 2.6 Pro motion control image-to-video work?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Kling 2.6 Pro motion control combines image-to-video technology with motion control capabilities. You upload an image for visual reference and a video for motion patterns. The AI merges the visual style from your image with the motion patterns from your reference video to generate professional motion-control image-to-video content.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue:
            "What makes Kling 2.6 Pro motion control different from regular image-to-video?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Unlike standard image-to-video generators, Kling 2.6 Pro motion control allows you to precisely control the motion patterns in your generated video by providing a reference video. This gives you complete control over how your image animates, making it perfect for creating specific motion-controlled image-to-video content.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue:
            "Can I keep the original sound when using motion control image-to-video?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            'Yes, Kling 2.6 Pro motion control offers a "Keep Original Sound" option that preserves the audio from your reference video in the generated motion-control image-to-video output, maintaining authentic soundscapes.',
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue:
            "What file formats does Kling 2.6 Pro motion control support for image-to-video?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Kling 2.6 Pro motion control supports common image formats (JPG, PNG, WEBP) for your source image and video formats (MP4, MOV, WEBM) for your reference video when creating motion-control image-to-video content.",
        }),
      },
      {
        question: tPage("faq.q6.question", {
          defaultValue:
            "Is Kling 2.6 Pro motion control image-to-video free to use?",
        }),
        answer: tPage("faq.q6.answer", {
          defaultValue:
            "Yes, our Kling 2.6 Pro motion control image-to-video generator offers free access for creating motion-controlled videos from images. Premium plans are available for higher usage limits and priority processing.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue:
        "Ready to Transform Images into Videos with Motion Control?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Join creators using Kling 2.6 Pro motion control to create professional image-to-video content with precise motion control. Start generating motion-control image-to-video videos today - it's free!",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Start Generating Now — It's Free",
        }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: tPage("hero.title", {
      defaultValue: "Kling 2.6 Pro Motion Control - Image to Video with AI",
    }),
    description: tPage("hero.description", {
      defaultValue:
        "Transform images into videos with Kling 2.6 Pro motion control. Upload an image and reference video to create motion-controlled image-to-video content with AI-powered precision.",
    }),
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Kling 2.6 Pro motion control",
      "Image-to-video with motion control",
      "Motion control image-to-video generation",
      "Dual input: image and video",
      "Precise motion control",
      "Keep original sound",
      "AI-powered image-to-video",
      "Free motion control video generator",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("howItWorks.title", {
      defaultValue:
        "How to Use Kling 2.6 Pro Motion Control for Image-to-Video",
    }),
    description: tPage("howItWorks.description", {
      defaultValue:
        "Create motion-control image-to-video content with Kling 2.6 Pro by uploading an image and reference video for precise motion control.",
    }),
    steps: [
      {
        name: tPage("howItWorks.step1.title", {
          defaultValue: "Upload Source Image",
        }),
        text: tPage("howItWorks.step1.description", {
          defaultValue:
            "Upload an image that will serve as the visual reference for your motion-control image-to-video generation. This image will be transformed into video with motion control.",
        }),
      },
      {
        name: tPage("howItWorks.step2.title", {
          defaultValue: "Upload Reference Video for Motion Control",
        }),
        text: tPage("howItWorks.step2.description", {
          defaultValue:
            "Upload a reference video containing the motion patterns you want to apply to your image-to-video conversion. Kling 2.6 Pro motion control will analyze this video to control the motion in your generated video.",
        }),
      },
      {
        name: tPage("howItWorks.step3.title", {
          defaultValue: "Enter Motion Control Prompt",
        }),
        text: tPage("howItWorks.step3.description", {
          defaultValue:
            "Describe the motion control effect you want for your image-to-video conversion. Use negative prompts to specify motion patterns to avoid in your motion-control video.",
        }),
      },
      {
        name: tPage("howItWorks.step4.title", {
          defaultValue: "Configure Motion Control Settings",
        }),
        text: tPage("howItWorks.step4.description", {
          defaultValue:
            "Choose whether to keep the original sound from your reference video in the generated motion-control image-to-video output.",
        }),
      },
      {
        name: tPage("howItWorks.step5.title", {
          defaultValue: "Generate & Download Motion-Control Video",
        }),
        text: tPage("howItWorks.step5.description", {
          defaultValue:
            "Click generate and watch Kling 2.6 Pro motion control transform your image into a motion-controlled video. Download your professional image-to-video content when ready.",
        }),
      },
    ],
    totalTime: "PT120S",
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
      { name: "Video AI", url: "/video-ai" },
      { name: "Motion Control", url: "/motion-control" },
      {
        name: tPage("hero.title", {
          defaultValue: "Kling 2.6 Pro Motion Control - Image to Video with AI",
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
        playgroundConfig={kling26ProMotionControlConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("howItWorks.title", {
                    defaultValue:
                      "How to Use Kling 2.6 Pro Motion Control for Image-to-Video",
                  })}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  {tPage("howItWorks.description", {
                    defaultValue:
                      "Transform images into videos with motion control in five simple steps. Create professional motion-control image-to-video content with Kling 2.6 Pro. No technical knowledge required.",
                  })}
                </p>
                <div className="grid gap-6 md:grid-cols-5 mt-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step1.title", {
                        defaultValue: "Upload Source Image",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step1.description", {
                        defaultValue:
                          "Upload an image that will be transformed into video with motion control. This serves as the visual base for your image-to-video conversion.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step2.title", {
                        defaultValue: "Upload Reference Video",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step2.description", {
                        defaultValue:
                          "Upload a reference video containing motion patterns for Kling 2.6 Pro motion control to analyze and apply to your image-to-video generation.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step3.title", {
                        defaultValue: "Enter Motion Control Prompt",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step3.description", {
                        defaultValue:
                          "Describe the motion control effect for your image-to-video conversion. Use negative prompts to refine motion patterns in your motion-control video.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      4
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step4.title", {
                        defaultValue: "Configure Motion Control Settings",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step4.description", {
                        defaultValue:
                          "Choose whether to preserve original audio from your reference video in the generated motion-control image-to-video output.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      5
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step5.title", {
                        defaultValue: "Generate Motion-Control Video",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step5.description", {
                        defaultValue:
                          "Click generate and watch Kling 2.6 Pro motion control transform your image into a professional motion-controlled video. Download your image-to-video content when ready.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="py-16 md:py-24" />

        <CTA cta={finalCTA} className="py-16 md:py-24 bg-muted/30" />
      </AiMediaPageLayout>
    </>
  );
}
