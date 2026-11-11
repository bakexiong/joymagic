import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { midjourneyTextToImageConfig } from "@/shared/blocks/desktop-playground";
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
    "landing.midjourney-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/midjourney`
      : `${envConfigs.app_url}/text-to-image/midjourney`;

  return {
    title: t("title", {
      defaultValue: "Midjourney Style AI Text to Image Generator | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Generate stunning Midjourney-style images from text descriptions. Professional AI image generation with artistic control, high resolution output, and creative flexibility.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "midjourney, text to image, ai image generator, midjourney alternative, ai art generator, creative image generation, artistic ai, midjourney style",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function MidjourneyTextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.midjourney-text-to-image.page");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Create stunning Midjourney-style images from text descriptions with advanced AI. Experience artistic control, creative flexibility, and professional-quality outputs. Perfect for designers, artists, and creative professionals seeking high-quality AI-generated imagery.<br/><br/>Looking for other AI models? <a href="/text-to-image" class="text-primary underline">Explore all text-to-image tools</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Midjourney Style Text to Image",
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

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", {
      defaultValue: "Midjourney-Style Features",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue:
        "Professional artistic capabilities for creative image generation",
    }),
    items: [
      {
        title: tPage("keyFeatures.artisticControl.title", {
          defaultValue: "Artistic Control",
        }),
        description: tPage("keyFeatures.artisticControl.description", {
          defaultValue:
            "Fine-tune artistic style, mood, and aesthetic direction with natural language prompts. Describe painting styles, art movements, or specific visual qualities to achieve your creative vision.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.highQuality.title", {
          defaultValue: "High-Quality Output",
        }),
        description: tPage("keyFeatures.highQuality.description", {
          defaultValue:
            "Generate professional-grade images with exceptional detail and clarity. Suitable for commercial projects, portfolio work, and high-resolution printing needs.",
        }),
        icon: "Image",
      },
      {
        title: tPage("keyFeatures.creativeFlexibility.title", {
          defaultValue: "Creative Flexibility",
        }),
        description: tPage("keyFeatures.creativeFlexibility.description", {
          defaultValue:
            "Explore unlimited creative possibilities from photorealistic renders to abstract art. Mix styles, combine concepts, and experiment with unique visual combinations.",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.compositionControl.title", {
          defaultValue: "Composition Control",
        }),
        description: tPage("keyFeatures.compositionControl.description", {
          defaultValue:
            "Direct framing, perspective, and visual hierarchy through descriptive prompts. Achieve professional composition without technical photography knowledge.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.styleConsistency.title", {
          defaultValue: "Style Consistency",
        }),
        description: tPage("keyFeatures.styleConsistency.description", {
          defaultValue:
            "Maintain consistent visual style across multiple generations. Perfect for creating cohesive series, brand materials, or project collections.",
        }),
        icon: "CheckCircle2",
      },
    ],
  };

  // Standard Features
  const standardFeatures: FeaturesType = {
    id: "standard-features",
    title: tPage("standardFeatures.title", {
      defaultValue: "Standard Features",
    }),
    description: tPage("standardFeatures.description", {
      defaultValue: "All the essential capabilities you need",
    }),
    items: [
      {
        title: tPage("standardFeatures.multipleStyles.title", {
          defaultValue: "Multiple Art Styles",
        }),
        description: tPage("standardFeatures.multipleStyles.description", {
          defaultValue:
            "Photorealistic, anime, oil painting, watercolor, digital art",
        }),
        icon: "Palette",
      },
      {
        title: tPage("standardFeatures.naturalLanguage.title", {
          defaultValue: "Natural Language Prompts",
        }),
        description: tPage("standardFeatures.naturalLanguage.description", {
          defaultValue: "Describe your vision in everyday language",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("standardFeatures.fastGeneration.title", {
          defaultValue: "Fast Generation",
        }),
        description: tPage("standardFeatures.fastGeneration.description", {
          defaultValue: "10-20 seconds per image",
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
      defaultValue:
        "Common questions about Midjourney-style text to image generation",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How does Midjourney-style generation work?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Our AI model is trained to generate images with artistic qualities similar to Midjourney, focusing on aesthetic appeal, creative interpretation, and professional-quality outputs. Simply describe your vision in natural language.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue:
            "What makes this different from other AI image generators?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Midjourney-style generation emphasizes artistic quality, creative interpretation, and aesthetic appeal. It excels at producing visually striking images with strong composition and artistic coherence.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "Can I use generated images commercially?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Yes, images generated through our platform can be used for commercial purposes. Please review our terms of service for specific usage rights and attribution requirements.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How detailed should my prompts be?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            'More detailed prompts generally produce better results. Include subject matter, artistic style, mood, lighting, composition, and any specific visual elements you want. For example: "ethereal forest landscape, golden hour lighting, impressionist style, soft focus, dreamy atmosphere".',
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What resolution are the generated images?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Generated images are high-resolution and suitable for most professional uses including web, print, and presentations. Optional upscaling is available for even higher resolution outputs.",
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
        "Start generating stunning Midjourney-style images from your text descriptions today.",
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
    name: "Barko Bear AI Midjourney Style Text to Image",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/midjourney",
    locale,
    category: "MultimediaApplication",
    features: [
      "AI Text to Image Generation",
      "Midjourney Style",
      "Artistic Control",
      "High-Quality Output",
      "Creative Flexibility",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Midjourney-Style Images",
    description:
      "Generate stunning artistic images with Midjourney-style AI from text descriptions",
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe the image you want to generate, including artistic style, mood, and composition",
      },
      {
        name: "Generate",
        text: "Click generate to create your artistic image in 10-20 seconds",
      },
      {
        name: "Download",
        text: "Download your high-resolution image in JPG, PNG, or WebP format",
      },
    ],
    totalTime: "PT20S",
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
      { name: "Midjourney", url: "/text-to-image/midjourney" },
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
        playgroundConfig={midjourneyTextToImageConfig}
      >
        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Standard Features */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("standardFeatures.title", {
                    defaultValue: "Standard Features",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Palette className="size-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">
                      {tPage("standardFeatures.multipleStyles.title", {
                        defaultValue: "Multiple Art Styles",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("standardFeatures.multipleStyles.description", {
                        defaultValue:
                          "Photorealistic, anime, oil painting, watercolor, digital art",
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
                          "Describe your vision in everyday language",
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
                        defaultValue: "10-20 seconds per image",
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
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.conceptArt.title", {
                          defaultValue: "Concept Art & Design",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.conceptArt.description", {
                        defaultValue:
                          "Create concept art for games, films, and creative projects. Explore visual directions quickly and iterate on ideas without traditional illustration time.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.marketing.title", {
                          defaultValue: "Marketing & Advertising",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.marketing.description", {
                        defaultValue:
                          "Generate eye-catching visuals for campaigns, social media, and promotional materials. Create unique imagery that stands out and captures attention.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.creative.title", {
                          defaultValue: "Creative Exploration",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.creative.description", {
                        defaultValue:
                          "Experiment with artistic styles and visual concepts. Perfect for artists, designers, and creatives seeking inspiration or exploring new directions.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.portfolio.title", {
                          defaultValue: "Portfolio & Presentation",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.portfolio.description", {
                        defaultValue:
                          "Create professional-quality images for portfolios, presentations, and client pitches. Showcase ideas with polished, high-resolution visuals.",
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
