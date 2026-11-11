import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { seedreamV45TextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
  CheckCircle2,
  Zap,
  Wand2,
  Shield,
  Sparkles,
  Globe,
  Camera,
  Palette,
  Lightbulb,
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
    "landing.seedream-v4-5-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/seedream-4-5`
      : `${envConfigs.app_url}/text-to-image/seedream-4-5`;

  return {
    title: t("title", {
      defaultValue:
        "Seedream 4.5 Text to Image - AI Image Generator | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Generate images from text with Seedream 4.5 by ByteDance. Create photorealistic scenes, illustrations, and art. Bilingual prompts in English and Chinese.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "text to image, ai image generator, seedream 4.5, bytedance, bilingual prompts",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function SeedreamV45TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.seedream-v4-5-text-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Seedream 4.5 is ByteDance\'s AI model that turns text descriptions into images. Describe any scene, character, or concept in English or Chinese. Try Seedream 4.5 for free below!<br/><br/>Want to edit existing images instead? <a href="/image-to-image/seedream-4-5" class="text-primary underline">Try Seedream 4.5 Image to Image</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "Seedream 4.5 Text to Image" }),
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

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", { defaultValue: "Key Features" }),
    description: tPage("keyFeatures.description", {
      defaultValue: "Powerful AI image generation capabilities",
    }),
    items: [
      {
        title: tPage("keyFeatures.photorealistic.title", {
          defaultValue: "Photorealistic Quality",
        }),
        description: tPage("keyFeatures.photorealistic.description", {
          defaultValue:
            "Generate images that look like professional photography. Accurate skin textures, natural lighting, realistic environments—without the uncanny valley effect common in AI images.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.complexScene.title", {
          defaultValue: "Complex Scene Understanding",
        }),
        description: tPage("keyFeatures.complexScene.description", {
          defaultValue:
            "Describe detailed scenarios with multiple subjects, spatial relationships, and specific lighting. The model interprets composition, positioning, and atmosphere accurately from your text.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.bilingual.title", {
          defaultValue: "Bilingual Prompts",
        }),
        description: tPage("keyFeatures.bilingual.description", {
          defaultValue:
            "Write in English, Chinese, or both. The model understands nuanced descriptions in either language equally well—useful for Chinese cultural references or specific terminology.",
        }),
        icon: "Globe",
      },
      {
        title: tPage("keyFeatures.fastGeneration.title", {
          defaultValue: "Fast Generation",
        }),
        description: tPage("keyFeatures.fastGeneration.description", {
          defaultValue:
            "Generate high-resolution images in seconds. Fast enough for real-time creative exploration and iteration.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.styleFlexibility.title", {
          defaultValue: "Style Flexibility",
        }),
        description: tPage("keyFeatures.styleFlexibility.description", {
          defaultValue:
            "Create photorealistic images, anime illustrations, oil paintings, watercolors, 3D renders, and more. Specify your desired style in the prompt or let the model match the subject matter.",
        }),
        icon: "Wand2",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Seedream 4.5 Text to Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Seedream 4.5?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Seedream 4.5 is ByteDance's AI image generation model that creates images from text descriptions. It produces photorealistic and stylized images at high resolution.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How detailed should my prompt be?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "More detail generally means better results. Include subject, setting, lighting, style, mood, and camera angle. Start with a few sentences and add more if needed.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What styles can it generate?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Photorealistic, anime, oil painting, watercolor, 3D render, sketch, and more. Specify style in your prompt or reference specific artists and studios.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "Does it support Chinese prompts?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Yes, Seedream 4.5 understands both English and Chinese equally well. You can write prompts in either language or mix both.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What's the difference from GPT-Image-1?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Seedream 4.5 excels at bilingual prompts and multi-image blending (in Image to Image mode). GPT-Image-1 is better for text rendering within images. Choose based on your primary need.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", { defaultValue: "Ready to Create?" }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start generating amazing images from your text descriptions today.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", { defaultValue: "Try It Now" }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: tPage("schema.softwareName", {
      defaultValue: "joymagic AI Seedream 4.5 Text to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/seedream-4-5",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiTextToImage", {
        defaultValue: "AI Text to Image Generation",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High Quality Images",
      }),
      tPage("schema.features.fastProcessing", {
        defaultValue: "Fast Processing",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Generate Images with Seedream 4.5",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Generate images from text descriptions using Seedream 4.5",
    }),
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe the image you want to generate in English or Chinese",
      },
      { name: "Generate", text: "Click generate to create your image" },
      { name: "Download", text: "Download your high-quality generated image" },
    ],
    totalTime: "PT1M",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer || "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: tPage("breadcrumb.home", { defaultValue: "Home" }), url: "/" },
      {
        name: tPage("breadcrumb.textToImage", {
          defaultValue: "Text to Image",
        }),
        url: "/text-to-image",
      },
      {
        name: tPage("breadcrumb.seedreamV45", { defaultValue: "Seedream 4.5" }),
        url: "/text-to-image/seedream-4-5",
      },
    ],
    locale,
  );

  return (
    <>
      <JsonLd
        data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]}
      />
      {/* Hero Section */}
      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={seedreamV45TextToImageConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Prompting Tips */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue: "Prompting Tips",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.lighting.title", {
                          defaultValue: "Be Specific About Lighting",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.lighting.description", {
                        defaultValue:
                          '"Golden hour sunlight from the left, soft shadows" works better than "good lighting."',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.camera.title", {
                          defaultValue: "Include Camera Details",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.camera.description", {
                        defaultValue:
                          '"Shot with 85mm lens, shallow depth of field" adds professional photography quality.',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.style.title", {
                          defaultValue: "Specify Art Style",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.style.description", {
                        defaultValue:
                          '"Digital illustration in Studio Ghibli style" or "hyperrealistic 3D render" gives clear direction.',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.mood.title", {
                          defaultValue: "Describe Mood and Atmosphere",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.mood.description", {
                        defaultValue:
                          '"Cozy, warm, nostalgic feeling" or "dramatic, cinematic, high contrast" shapes the overall image.',
                      })}
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
                  {tPage("useCases.title", { defaultValue: "Use Cases" })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.marketing.title", {
                        defaultValue: "Marketing Visuals",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.marketing.description", {
                        defaultValue:
                          "Generate product concepts, ad imagery, and social media content without photoshoots.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.character.title", {
                        defaultValue: "Character Design",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.character.description", {
                        defaultValue:
                          "Create original characters for games, comics, or animation projects from text descriptions.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.concept.title", {
                        defaultValue: "Concept Art",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.concept.description", {
                        defaultValue:
                          "Visualize scenes, environments, and ideas quickly for creative projects and presentations.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.stock.title", {
                        defaultValue: "Stock Photo Alternative",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.stock.description", {
                        defaultValue:
                          "Generate specific images you need instead of searching through generic stock libraries.",
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
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
