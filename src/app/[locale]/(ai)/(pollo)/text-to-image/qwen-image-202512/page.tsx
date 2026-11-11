import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { qwen202512TextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
  Type,
  Image as ImageIcon,
  FileText,
  Settings,
  Download,
  DollarSign,
  Target,
  Info,
  Package,
} from "lucide-react";
import Image from "next/image";

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
    "landing.qwen-202512-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/qwen-image-202512`
      : `${envConfigs.app_url}/text-to-image/qwen-image-202512`;

  return {
    title: t("title", {
      defaultValue:
        "Qwen Image 2512: Alibaba's Text-to-Image Model Built for Readable Text | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Qwen Image 2512 is Alibaba's latest text-to-image generation model optimized for high-quality image generation with accurate, readable text. Perfect for posters, signage, logos, advertisements, and brand design assets.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "Qwen Image 2512, text to image, ai image generator, readable text, posters, signage, logos, Alibaba, Qwen AI",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Qwen202512TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.qwen-202512-text-to-image.page");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Qwen Image 2512 is Alibaba's latest text-to-image generation model from the Qwen AI family. It is specifically optimized for high-quality image generation with accurate, readable text, making it an excellent choice for posters, signage, logos, advertisements, and brand design assets where text clarity truly matters.<br/><br/>Unlike many image generation models that prioritize visual aesthetics alone, Qwen Image 2512 stands out by combining strong natural language understanding with industry-leading text rendering inside images.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue:
        "Qwen Image 2512: Alibaba's Text-to-Image Model Built for Readable Text",
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

  // Key Features - Why Choose Qwen Image 2512
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", {
      defaultValue: "Why Choose Qwen Image 2512?",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue:
        "Discover the unique advantages that make Qwen Image 2512 the ideal choice for text-rich visual content",
    }),
    items: [
      {
        title: tPage("keyFeatures.superiorTextRendering.title", {
          defaultValue: "Superior Text Rendering",
        }),
        description: tPage("keyFeatures.superiorTextRendering.description", {
          defaultValue:
            "Qwen Image 2512 excels at generating clear, legible text within images, supporting multiple languages, fonts, and layout styles. This makes it ideal for use cases such as marketing posters, promotional banners, product labels, logos, and signage—scenarios where text readability is critical.",
        }),
        icon: "Type",
      },
      {
        title: tPage("keyFeatures.advancedPromptUnderstanding.title", {
          defaultValue: "Advanced Prompt Understanding",
        }),
        description: tPage(
          "keyFeatures.advancedPromptUnderstanding.description",
          {
            defaultValue:
              "The model demonstrates enhanced comprehension of complex prompts, accurately interpreting subject relationships, spatial layouts and composition, and stylistic intent and visual hierarchy. Even long, detailed prompts are handled with consistent and reliable results.",
          },
        ),
        icon: "Lightbulb",
      },
      {
        title: tPage("keyFeatures.flexibleImageSizing.title", {
          defaultValue: "Flexible Image Sizing",
        }),
        description: tPage("keyFeatures.flexibleImageSizing.description", {
          defaultValue:
            "Qwen Image 2512 supports custom width and height parameters, allowing you to generate images tailored for social media formats (1:1, 4:5, 9:16), presentations and web banners, and print-ready visuals and posters.",
        }),
        icon: "ImageIcon",
      },
      {
        title: tPage("keyFeatures.consistentQuality.title", {
          defaultValue: "Consistent Quality Across Styles",
        }),
        description: tPage("keyFeatures.consistentQuality.description", {
          defaultValue:
            "Whether you need photorealistic images, illustrations or concept art, or abstract or brand-driven designs, Qwen Image 2512 maintains high visual quality and stylistic consistency across outputs.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.builtInPromptEnhancer.title", {
          defaultValue: "Built-in Prompt Enhancer",
        }),
        description: tPage("keyFeatures.builtInPromptEnhancer.description", {
          defaultValue:
            "The integrated Prompt Enhancer automatically refines your input, helping you achieve better generation results with less trial and error.",
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
      defaultValue: "Common questions about Qwen Image 2512",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Qwen Image 2512?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Qwen Image 2512 is Alibaba's latest text-to-image generation model from the Qwen AI family. It is specifically optimized for high-quality image generation with accurate, readable text, making it ideal for posters, signage, logos, advertisements, and brand design assets.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue:
            "What makes Qwen Image 2512 different from other models?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Qwen Image 2512 stands out by combining strong natural language understanding with industry-leading text rendering inside images. Unlike many models that prioritize visual aesthetics alone, it excels at generating clear, legible text within images.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What output formats are supported?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Qwen Image 2512 supports JPEG (smaller file size, ideal for photos and web), PNG (lossless quality with transparency, best for images containing text), and WebP (modern format with better compression and strong browser compatibility).",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "Can I customize the image size?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Yes, Qwen Image 2512 supports custom width and height parameters, allowing you to generate images tailored for social media formats (1:1, 4:5, 9:16), presentations, web banners, and print-ready visuals.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "How do I get the best results with text in images?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "When generating text inside images, explicitly specify the exact wording, font style, and placement. For example: \"Poster with the text 'SUMMER SALE' in bold red letters at the top.\" This model is specifically optimized for readable text generation, so take advantage of that strength.",
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
        "Qwen Image 2512 is not just another text-to-image model—it is a production-ready visual generation tool designed for real-world design and marketing workflows. If your projects require clear typography, precise layouts, and strong visual storytelling, Qwen Image 2512 is one of the most compelling choices available today.",
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
      defaultValue: "joymagic AI Qwen Image 2512 Text to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/qwen-image-202512",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.superiorTextRendering", {
        defaultValue: "Superior Text Rendering",
      }),
      tPage("schema.features.advancedPromptUnderstanding", {
        defaultValue: "Advanced Prompt Understanding",
      }),
      tPage("schema.features.flexibleImageSizing", {
        defaultValue: "Flexible Image Sizing",
      }),
      tPage("schema.features.consistentQuality", {
        defaultValue: "Consistent Quality Across Styles",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Generate Images with Qwen Image 2512",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue:
        "Generate images from text descriptions using Qwen Image 2512 with accurate, readable text",
    }),
    steps: [
      {
        name: "Write your prompt",
        text: "Describe the subject, style, composition, lighting, and mood",
      },
      {
        name: "Adjust image size",
        text: "Set width and height according to your target platform",
      },
      {
        name: "Set the seed",
        text: "Use -1 for random outputs or specify a fixed value for reproducibility",
      },
      {
        name: "Choose output format",
        text: "Select jpeg, png, or webp based on your needs",
      },
      {
        name: "Run and iterate",
        text: "Generate, preview, and refine your prompt as needed",
      },
    ],
    totalTime: "PT1M",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer === "string" ? item.answer : "",
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
        name: tPage("breadcrumb.qwenImage2512", {
          defaultValue: "Qwen Image 2512",
        }),
        url: "/text-to-image/qwen-image-202512",
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
        playgroundConfig={qwen202512TextToImageConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* How to Use Qwen Image 2512 */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("howToUse.title", {
                    defaultValue: "How to Use Qwen Image 2512",
                  })}
                </h2>
                <div className="space-y-4 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("howToUse.step1.title", {
                            defaultValue: "Write your prompt",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("howToUse.step1.description", {
                            defaultValue:
                              "Describe the subject, style, composition, lighting, and mood.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("howToUse.step2.title", {
                            defaultValue: "Adjust image size",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("howToUse.step2.description", {
                            defaultValue:
                              "Set width and height according to your target platform.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("howToUse.step3.title", {
                            defaultValue: "Set the seed",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("howToUse.step3.description", {
                            defaultValue:
                              "Use -1 for random outputs or specify a fixed value for reproducibility.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("howToUse.step4.title", {
                            defaultValue: "Choose output format",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("howToUse.step4.description", {
                            defaultValue:
                              "Select jpeg, png, or webp based on your needs.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        5
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("howToUse.step5.title", {
                            defaultValue: "Run and iterate",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("howToUse.step5.description", {
                            defaultValue:
                              "Generate, preview, and refine your prompt as needed.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Best Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("bestUseCases.title", {
                    defaultValue: "Best Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("bestUseCases.marketing.title", {
                          defaultValue: "Marketing & Advertising",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("bestUseCases.marketing.description", {
                        defaultValue:
                          "Create high-impact visuals with readable text for ads, posters, and campaigns.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("bestUseCases.socialMedia.title", {
                          defaultValue: "Social Media Content",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("bestUseCases.socialMedia.description", {
                        defaultValue:
                          "Generate platform-optimized visuals that drive engagement.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("bestUseCases.productDesign.title", {
                          defaultValue: "Product & Packaging Design",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("bestUseCases.productDesign.description", {
                        defaultValue:
                          "Visualize concepts, mockups, and packaging with integrated typography.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("bestUseCases.branding.title", {
                          defaultValue: "Branding & Visual Identity",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("bestUseCases.branding.description", {
                        defaultValue:
                          "Design logos, signage, and brand assets with clear text elements.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("bestUseCases.editorial.title", {
                          defaultValue: "Editorial & Publishing",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("bestUseCases.editorial.description", {
                        defaultValue:
                          "Produce illustrations, cover art, and visual content for articles and media.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Pro Tips for Best Results */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("proTips.title", {
                    defaultValue: "Pro Tips for Best Results",
                  })}
                </h2>
                <div className="space-y-4 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="size-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("proTips.specific.title", {
                            defaultValue:
                              "Be as specific as possible in your prompts",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tPage("proTips.specific.description", {
                            defaultValue:
                              "Include subject details, style, lighting, camera angle, and atmosphere.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <Type className="size-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("proTips.textInImages.title", {
                            defaultValue:
                              "When generating text inside images, explicitly specify the exact wording, font style, and placement",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tPage("proTips.textInImages.example", {
                            defaultValue: "Example:",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded">
                          {tPage("proTips.textInImages.exampleText", {
                            defaultValue:
                              "\"Poster with the text 'SUMMER SALE' in bold red letters at the top.\"",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <Settings className="size-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">
                          {tPage("proTips.reproducibility.title", {
                            defaultValue:
                              "Use the same prompt and seed to reproduce identical outputs",
                          })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tPage("proTips.reproducibility.description", {
                            defaultValue:
                              "This model is specifically optimized for readable text generation, so take advantage of that strength.",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <div className="rounded-lg border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <Info className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h2 className="text-2xl font-semibold mb-3">
                        {tPage("notes.title", { defaultValue: "Notes" })}
                      </h2>
                      <p className="text-muted-foreground">
                        {tPage("notes.description", {
                          defaultValue:
                            "Please ensure that your prompts comply with applicable content guidelines. If an error occurs, review and refine your prompt before retrying.",
                        })}
                      </p>
                    </div>
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

        {/* Image Showcase */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              <ScrollAnimation>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg overflow-hidden border bg-card">
                  <div className="relative w-full overflow-hidden aspect-[3/4]">
                    <Image
                      src="https://cdn.10b.ai/qwen_image_1.png"
                      alt={tPage("showcase.image1.alt", {
                        defaultValue:
                          "Qwen Image 2512 generated poster with readable text",
                      })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={75}
                      priority
                    />
                  </div>
                  <div className="relative w-full overflow-hidden aspect-[3/4]">
                    <Image
                      src="https://cdn.10b.ai/qwen_image_2.png"
                      alt={tPage("showcase.image2.alt", {
                        defaultValue:
                          "Qwen Image 2512 generated multilingual hello design",
                      })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={75}
                    />
                  </div>
                  <div className="relative w-full overflow-hidden aspect-[3/4]">
                    <Image
                      src="https://cdn.10b.ai/qwen_image_3.jpeg"
                      alt={tPage("showcase.image3.alt", {
                        defaultValue: "Qwen Image 2512 generated image collage",
                      })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={75}
                    />
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>
      </AiMediaPageLayout>
    </>
  );
}
