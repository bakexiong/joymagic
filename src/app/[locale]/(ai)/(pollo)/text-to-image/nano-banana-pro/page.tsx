import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { nanoBananaProTextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
  Camera,
  Palette,
  Lightbulb,
  Image,
  Rocket,
  Type,
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
    "landing.nano-banana-pro-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/nano-banana-pro`
      : `${envConfigs.app_url}/text-to-image/nano-banana-pro`;

  return {
    title: t("title", {
      defaultValue:
        "Nano Banana Pro - AI Text to Image with Clear Typography | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Generate professional images from text with Nano Banana Pro. Camera controls, clear text in Chinese/English, high resolution output. Create photos and designs.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "nano banana pro, text to image, ai image generator, clear text rendering, camera controls, professional image generation, chinese text ai, bilingual text ai",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function NanoBananaProTextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.nano-banana-pro-text-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Nano Banana Pro generates professional images from text descriptions with camera-level controls. Describe depth of field, lighting setups, and color grading in plain language. Renders text in Chinese and English clearly—useful for posters, logos, and branded materials. Try Nano Banana Pro below!<br/><br/>Looking for basic image generation without pro controls? <a href="/text-to-image/nano-banana" class="text-primary underline">Try standard Nano Banana</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Nano Banana Pro Text to Image",
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

  // Pro-Exclusive Features (Learn More Section)
  const proFeatures: FeaturesType = {
    id: "pro-features",
    title: tPage("proFeatures.title", {
      defaultValue: "Pro-Exclusive Features",
    }),
    description: tPage("proFeatures.description", {
      defaultValue:
        "Professional-grade capabilities for advanced image generation",
    }),
    items: [
      {
        title: tPage("proFeatures.cameraControls.title", {
          defaultValue: "Camera Controls via Text",
        }),
        description: tPage("proFeatures.cameraControls.description", {
          defaultValue:
            'Describe professional photography settings in plain language. "Shallow depth of field with bokeh background" or "film noir lighting with high contrast"—the model applies techniques that normally require expensive equipment and expertise.',
        }),
        icon: "Camera",
      },
      {
        title: tPage("proFeatures.clearTextRendering.title", {
          defaultValue: "Clear Text Rendering",
        }),
        description: tPage("proFeatures.clearTextRendering.description", {
          defaultValue:
            "Generate readable typography in multiple languages. Logos, signage, posters, product labels—text stays sharp and professional. Particularly strong with Chinese characters, making it useful for bilingual marketing materials.",
        }),
        icon: "Type",
      },
      {
        title: tPage("proFeatures.highResolution.title", {
          defaultValue: "High Resolution Output",
        }),
        description: tPage("proFeatures.highResolution.description", {
          defaultValue:
            "Output high-resolution images suitable for print materials and large format displays. Optional upscaling preserves fine details—fabric texture, architectural elements, product surfaces.",
        }),
        icon: "Image",
      },
      {
        title: tPage("proFeatures.complexScene.title", {
          defaultValue: "Complex Scene Understanding",
        }),
        description: tPage("proFeatures.complexScene.description", {
          defaultValue:
            'Handles detailed spatial instructions. "Place the vase on the left side of the table, with sunlight coming from the right window"—the model interprets positioning, lighting direction, and object relationships correctly.',
        }),
        icon: "Palette",
      },
      {
        title: tPage("proFeatures.professionalComposition.title", {
          defaultValue: "Professional Composition Control",
        }),
        description: tPage("proFeatures.professionalComposition.description", {
          defaultValue:
            'Describe specific framing, angles, and perspectives. "Low angle shot looking up at the building" or "close-up portrait with leading lines in background"—the model understands cinematography and photography terminology.',
        }),
        icon: "Camera",
      },
    ],
  };

  // Standard Features (Also Included)
  const standardFeatures: FeaturesType = {
    id: "standard-features",
    title: tPage("standardFeatures.title", {
      defaultValue: "Standard Features (Also Included)",
    }),
    description: tPage("standardFeatures.description", {
      defaultValue: "All the essential capabilities you need",
    }),
    items: [
      {
        title: tPage("standardFeatures.styleFlexibility.title", {
          defaultValue: "Style Flexibility",
        }),
        description: tPage("standardFeatures.styleFlexibility.description", {
          defaultValue: "Photos, anime, digital art, illustrations",
        }),
        icon: "Palette",
      },
      {
        title: tPage("standardFeatures.naturalLanguage.title", {
          defaultValue: "Natural Language Input",
        }),
        description: tPage("standardFeatures.naturalLanguage.description", {
          defaultValue: "Describe scenes in everyday language",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("standardFeatures.fastGeneration.title", {
          defaultValue: "Fast Generation",
        }),
        description: tPage("standardFeatures.fastGeneration.description", {
          defaultValue: "10-15 seconds per image",
        }),
        icon: "Zap",
      },
      {
        title: tPage("standardFeatures.multipleFormats.title", {
          defaultValue: "Multiple Output Formats",
        }),
        description: tPage("standardFeatures.multipleFormats.description", {
          defaultValue: "JPG, PNG, WebP",
        }),
        icon: "CheckCircle2",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Nano Banana Pro Text to Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What makes Pro different from standard Nano Banana?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Pro adds camera controls (depth of field, lighting, color grading), clear multi-language text rendering, and higher resolution output. Standard generates images quickly across styles but without professional photography controls or guaranteed text quality.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How does text rendering work?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Describe the text you want in your prompt, including content, style, and position. Pro generates typography that stays readable at any size—particularly effective for Chinese characters where rendering quality varies across AI models.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What resolution can I output?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Pro outputs higher resolution than standard, with optional upscaling for print-quality results. Suitable for large format printing, trade show materials, and magazine ads.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How detailed should my prompts be?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            'More detail helps. Instead of "a product on a table," try "smartphone on wooden table, afternoon sunlight from left, shallow depth of field, professional product photography style." Include subject, lighting, camera settings, and visual style.',
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "Is Pro worth it for basic images?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Standard Nano Banana works fine for social media graphics, quick concepts, and images where text quality doesn't matter. Use Pro when you need professional photography controls, clear typography in your images, or print-quality resolution.",
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
    name: "Barko Bear AI Nano Banana Pro Text to Image",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/nano-banana-pro",
    locale,
    category: "MultimediaApplication",
    features: [
      "AI Text to Image Generation",
      "Camera Controls",
      "Clear Text Rendering",
      "High Resolution Output",
      "Professional Composition Control",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Images with Nano Banana Pro",
    description:
      "Generate professional images from text with Nano Banana Pro using camera controls and clear text rendering",
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe the image you want to generate, including camera settings, lighting, and text content",
      },
      {
        name: "Generate",
        text: "Click generate to create your professional image in 10-15 seconds",
      },
      {
        name: "Download",
        text: "Download your high-resolution image in JPG, PNG, or WebP format",
      },
    ],
    totalTime: "PT15S",
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
      { name: "Text to Image", url: "/text-to-image" },
      { name: "Nano Banana Pro", url: "/text-to-image/nano-banana-pro" },
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
        playgroundConfig={nanoBananaProTextToImageConfig}
      >
        {/* Pro-Exclusive Features - Learn More Section */}
        <Features features={proFeatures} className="py-16 md:py-24" />

        {/* Standard Features */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("standardFeatures.title", {
                    defaultValue: "Standard Features (Also Included)",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Palette className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.styleFlexibility.title", {
                        defaultValue: "Style Flexibility",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.styleFlexibility.description", {
                        defaultValue:
                          "Photos, anime, digital art, illustrations",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Wand2 className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.naturalLanguage.title", {
                        defaultValue: "Natural Language Input",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.naturalLanguage.description", {
                        defaultValue: "Describe scenes in everyday language",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Zap className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.fastGeneration.title", {
                        defaultValue: "Fast Generation",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.fastGeneration.description", {
                        defaultValue: "10-15 seconds per image",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <CheckCircle2 className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.multipleFormats.title", {
                        defaultValue: "Multiple Output Formats",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.multipleFormats.description", {
                        defaultValue: "JPG, PNG, WebP",
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
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.eventPosters.title", {
                          defaultValue: "Event Posters with Text",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.eventPosters.description", {
                        defaultValue:
                          "Generate promotional posters with event details, dates, and venue information. Pro renders text clearly in both Chinese and English—readable at any size for print or digital use.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.productVisualization.title", {
                          defaultValue: "Product Visualization",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.productVisualization.description", {
                        defaultValue:
                          "Need product mockups for presentations but don't have photos? Describe the product, setting, and lighting. Pro generates professional-looking scenes with realistic shadows and reflections.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.conceptPresentations.title", {
                          defaultValue: "Concept Presentations",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.conceptPresentations.description", {
                        defaultValue:
                          "Pitch clients on design directions without creating finished work. Generate multiple visual styles with camera controls to show different moods and approaches.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.bilingualMarketing.title", {
                          defaultValue: "Bilingual Marketing Materials",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.bilingualMarketing.description", {
                        defaultValue:
                          "Create ads and promotional graphics with Chinese and English text. Pro handles both languages' typography well—important for retail signage and product packaging targeting multiple markets.",
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
