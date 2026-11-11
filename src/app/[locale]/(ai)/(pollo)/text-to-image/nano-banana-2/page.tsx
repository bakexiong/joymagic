import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { nanoBanana2TextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
    "landing.nano-banana-2-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/nano-banana-2`
      : `${envConfigs.app_url}/text-to-image/nano-banana-2`;

  return {
    title: t("title", {
      defaultValue:
        "Nano Banana 2 Text to Image — Free AI Image Generator Online | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Nano Banana 2 text to image generator creates high-quality images from prompts. Advanced camera controls, clear text rendering in Chinese & English, up to 4K resolution. Try Nano Banana 2 free online.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "nano banana 2, text to image, nano banana 2 text to image, ai image generator, nano banana 2 ai, text to image generator, free ai image generator, nano banana 2 online, text to image free, ai art generator, nano banana text to image",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
export default async function NanoBanana2TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.nano-banana-2-text-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Nano Banana 2 is a next-generation text to image AI model that turns your prompts into professional-quality visuals. With advanced camera controls, clear multilingual text rendering, and up to 4K output, Nano Banana 2 text to image delivers results that rival professional photography. Try the Nano Banana 2 text to image generator below!<br/><br/>Looking for basic image generation? <a href="/text-to-image/nano-banana" class="text-primary underline">Try standard Nano Banana text to image</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Nano Banana 2 Text to Image Generator",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", {
          defaultValue: "Try Nano Banana 2 Free",
        }),
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
  // What Makes Nano Banana 2 Text to Image Special
  const proFeatures: FeaturesType = {
    id: "pro-features",
    title: tPage("proFeatures.title", {
      defaultValue: "What Makes Nano Banana 2 Text to Image Special",
    }),
    description: tPage("proFeatures.description", {
      defaultValue:
        "Advanced capabilities that set Nano Banana 2 apart from other text to image generators",
    }),
    items: [
      {
        title: tPage("proFeatures.cameraControls.title", {
          defaultValue: "Camera Controls via Text Prompts",
        }),
        description: tPage("proFeatures.cameraControls.description", {
          defaultValue:
            "Nano Banana 2 text to image understands professional photography language. Describe depth of field, bokeh, film noir lighting, or color grading — the model applies real camera techniques to your generated images.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("proFeatures.clearTextRendering.title", {
          defaultValue: "Clear Text Rendering in Images",
        }),
        description: tPage("proFeatures.clearTextRendering.description", {
          defaultValue:
            "Unlike most text to image models, Nano Banana 2 renders readable typography in multiple languages. Logos, signage, posters, product labels — text stays sharp. Especially strong with Chinese characters for bilingual designs.",
        }),
        icon: "Type",
      },
      {
        title: tPage("proFeatures.highResolution.title", {
          defaultValue: "Up to 4K Resolution Output",
        }),
        description: tPage("proFeatures.highResolution.description", {
          defaultValue:
            "Nano Banana 2 text to image outputs high-resolution images up to 4K, suitable for print materials and large displays. Upscaling preserves fine details — fabric texture, architectural elements, product surfaces.",
        }),
        icon: "Image",
      },
      {
        title: tPage("proFeatures.complexScene.title", {
          defaultValue: "Complex Scene Composition",
        }),
        description: tPage("proFeatures.complexScene.description", {
          defaultValue:
            "Nano Banana 2 handles detailed spatial instructions in text to image generation. Describe object placement, lighting direction, and spatial relationships — the model interprets them accurately.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("proFeatures.professionalComposition.title", {
          defaultValue: "Professional Framing & Angles",
        }),
        description: tPage("proFeatures.professionalComposition.description", {
          defaultValue:
            "Describe specific framing, angles, and perspectives in your text to image prompts. Low angle shots, close-up portraits, leading lines — Nano Banana 2 understands cinematography terminology.",
        }),
        icon: "Camera",
      },
    ],
  };
  // Core Text to Image Features
  const standardFeatures: FeaturesType = {
    id: "standard-features",
    title: tPage("standardFeatures.title", {
      defaultValue: "Core Text to Image Features",
    }),
    description: tPage("standardFeatures.description", {
      defaultValue:
        "Essential capabilities included in every Nano Banana 2 generation",
    }),
    items: [
      {
        title: tPage("standardFeatures.styleFlexibility.title", {
          defaultValue: "Multiple Art Styles",
        }),
        description: tPage("standardFeatures.styleFlexibility.description", {
          defaultValue:
            "Photos, anime, digital art, illustrations, oil paintings",
        }),
        icon: "Palette",
      },
      {
        title: tPage("standardFeatures.naturalLanguage.title", {
          defaultValue: "Natural Language Prompts",
        }),
        description: tPage("standardFeatures.naturalLanguage.description", {
          defaultValue:
            "Describe scenes in everyday language — no special syntax needed",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("standardFeatures.fastGeneration.title", {
          defaultValue: "Fast Image Generation",
        }),
        description: tPage("standardFeatures.fastGeneration.description", {
          defaultValue: "10–15 seconds per image with Nano Banana 2",
        }),
        icon: "Zap",
      },
      {
        title: tPage("standardFeatures.multipleFormats.title", {
          defaultValue: "Multiple Output Formats",
        }),
        description: tPage("standardFeatures.multipleFormats.description", {
          defaultValue: "Download in JPG, PNG, or WebP",
        }),
        icon: "CheckCircle2",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", {
      defaultValue: "Nano Banana 2 Text to Image FAQ",
    }),
    description: tPage("faq.description", {
      defaultValue:
        "Frequently asked questions about the Nano Banana 2 text to image generator",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Nano Banana 2 text to image?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Nano Banana 2 is a next-generation AI text to image model that converts text prompts into high-quality images. It features advanced camera controls, clear multilingual text rendering, and up to 4K resolution output — making it one of the most capable text to image generators available.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue:
            "How does Nano Banana 2 text to image handle text rendering?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Nano Banana 2 text to image generates readable typography directly in images. Describe the text content, style, and position in your prompt. It renders text clearly at any size — particularly effective for Chinese characters where most AI text to image models struggle.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue:
            "What resolution does Nano Banana 2 text to image support?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Nano Banana 2 text to image supports 1K, 2K, and 4K resolution output. The 4K option is ideal for print materials, trade show displays, and magazine-quality images.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue:
            "How to write good prompts for Nano Banana 2 text to image?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            'Be specific. Instead of "a product on a table," try "smartphone on wooden table, afternoon sunlight from left, shallow depth of field, professional product photography style." Nano Banana 2 text to image responds well to detailed descriptions of subject, lighting, camera settings, and visual style.',
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "Is Nano Banana 2 text to image free to use?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "You can try Nano Banana 2 text to image for free with limited credits. For regular use, check our pricing plans. Nano Banana 2 offers the best value for professional-quality text to image generation with camera controls and clear text rendering.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Try Nano Banana 2 Text to Image Now",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start generating professional images from text with Nano Banana 2 — free to try, no signup required.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Generate Your First Image",
        }),
        url: "#playground",
        variant: "default",
      },
    ],
  };
  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Nano Banana 2 Text to Image Generator — joymagic",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/nano-banana-2",
    locale,
    category: "MultimediaApplication",
    features: [
      "Nano Banana 2 Text to Image Generation",
      "Camera Controls via Text Prompts",
      "Clear Text Rendering in Images",
      "Up to 4K Resolution Output",
      "Professional Framing & Angles",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Images with Nano Banana 2 Text to Image",
    description:
      "Use Nano Banana 2 text to image to generate professional images from text prompts with camera controls, clear text rendering, and up to 4K resolution",
    steps: [
      {
        name: "Enter your text to image prompt",
        text: "Describe the image you want Nano Banana 2 to generate, including camera settings, lighting, and text content",
      },
      {
        name: "Generate with Nano Banana 2",
        text: "Click generate to create your professional image with Nano Banana 2 text to image in 10–15 seconds",
      },
      {
        name: "Download your image",
        text: "Download your high-resolution Nano Banana 2 generated image in JPG, PNG, or WebP format",
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
      {
        name: "Nano Banana 2 Text to Image",
        url: "/text-to-image/nano-banana-2",
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
        playgroundConfig={nanoBanana2TextToImageConfig}
      >
        {/* What Makes Nano Banana 2 Text to Image Special */}
        <Features features={proFeatures} className="py-16 md:py-24" />

        {/* Core Text to Image Features */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("standardFeatures.title", {
                    defaultValue: "Core Text to Image Features",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Palette className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.styleFlexibility.title", {
                        defaultValue: "Multiple Art Styles",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.styleFlexibility.description", {
                        defaultValue:
                          "Photos, anime, digital art, illustrations, oil paintings",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Wand2 className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.naturalLanguage.title", {
                        defaultValue: "Natural Language Prompts",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.naturalLanguage.description", {
                        defaultValue:
                          "Describe scenes in everyday language — no special syntax needed",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Zap className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.fastGeneration.title", {
                        defaultValue: "Fast Image Generation",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.fastGeneration.description", {
                        defaultValue:
                          "10–15 seconds per image with Nano Banana 2",
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
                        defaultValue: "Download in JPG, PNG, or WebP",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Nano Banana 2 Text to Image Use Cases */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", {
                    defaultValue: "Nano Banana 2 Text to Image Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.eventPosters.title", {
                          defaultValue: "Posters & Banners with Text",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.eventPosters.description", {
                        defaultValue:
                          "Use Nano Banana 2 text to image to generate promotional posters with event details, dates, and venue info. Text renders clearly in both Chinese and English — readable at any size for print or digital.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.productVisualization.title", {
                          defaultValue: "Product Mockups & Visualization",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.productVisualization.description", {
                        defaultValue:
                          "Generate product mockups from text descriptions with Nano Banana 2. Describe the product, setting, and lighting — get professional scenes with realistic shadows and reflections.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.conceptPresentations.title", {
                          defaultValue: "Design Concepts & Presentations",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.conceptPresentations.description", {
                        defaultValue:
                          "Pitch design directions to clients using Nano Banana 2 text to image. Generate multiple visual styles with camera controls to show different moods and approaches — no finished artwork needed.",
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
                          "Create ads and graphics with Chinese and English text using Nano Banana 2 text to image. Both languages render cleanly — ideal for retail signage and product packaging across markets.",
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
