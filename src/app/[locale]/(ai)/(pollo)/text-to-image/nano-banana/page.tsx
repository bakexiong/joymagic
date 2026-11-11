import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { nanoBananaTextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
  Sparkles,
  Palette,
  Lightbulb,
  Image,
  Rocket,
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
    "landing.nano-banana-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/nano-banana`
      : `${envConfigs.app_url}/text-to-image/nano-banana`;

  return {
    title: t("title", {
      defaultValue:
        "Nano Banana Text to Image - AI Image Generation | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Generate images from text with Google Nano Banana AI. Create photos, illustrations, and designs with clear text rendering. Try Nano Banana free.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "nano banana text to image, ai image generator, google nano banana, gemini 2.5 flash image, text to image ai",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function NanoBananaTextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.nano-banana-text-to-image.page");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'Google Nano Banana (Gemini 2.5 Flash Image) generates images from text descriptions. Type what you want, get photos, illustrations, or concept art in seconds. Handles different visual styles naturally. Try Nano Banana free below!<br/><br/>Need professional controls and clear text rendering? <a href="/text-to-image/nano-banana-pro" class="text-primary underline">Try Nano Banana Pro</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "Nano Banana Text to Image" }),
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
        title: tPage("keyFeatures.createFromScratch.title", {
          defaultValue: "Create From Scratch",
        }),
        description: tPage("keyFeatures.createFromScratch.description", {
          defaultValue:
            "Describe any scene and the model generates it. No reference images needed—just write what you want to see and the model builds it from your description.",
        }),
        icon: "Sparkles",
      },
      {
        title: tPage("keyFeatures.differentStyles.title", {
          defaultValue: "Handles Different Styles",
        }),
        description: tPage("keyFeatures.differentStyles.description", {
          defaultValue:
            "Works across visual styles naturally. Generate photorealistic scenes, anime characters, digital illustrations, concept art, or sketches by describing the style in your prompt.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.plainTextInput.title", {
          defaultValue: "Plain Text Input",
        }),
        description: tPage("keyFeatures.plainTextInput.description", {
          defaultValue:
            'Write descriptions in everyday language. "A cat wearing sunglasses on a beach at sunset" or "cyberpunk street scene with neon signs"—the model understands natural phrasing.',
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.fastGeneration.title", {
          defaultValue: "Fast Generation",
        }),
        description: tPage("keyFeatures.fastGeneration.description", {
          defaultValue:
            "Most images generate in 5-10 seconds. Test different ideas quickly—try variations of lighting, composition, and subjects without long waits.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.clearTextPro.title", {
          defaultValue: "Clear Text in Images (Pro)",
        }),
        description: tPage("keyFeatures.clearTextPro.description", {
          defaultValue:
            "Pro version renders readable text in multiple languages. Generate logos, posters, signage, and product labels where typography stays sharp and legible. Particularly good at Chinese characters.",
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
      defaultValue: "Common questions about Nano Banana Text to Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is Nano Banana Text to Image?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Nano Banana is Google DeepMind's AI image generator. It creates images from text descriptions—type what you want to see, get a generated image in seconds.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How detailed should my prompts be?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            'More detail usually helps. Instead of "a dog," try "a golden retriever sitting in a park, morning sunlight, photographic style." Include subject, setting, lighting, and visual style.',
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What formats are supported?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Outputs JPG, PNG, and WebP. Choose PNG if you need transparency support.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "What's the difference from Nano Banana Pro?",
        }),
        answer:
          (tPage.raw("faq.q4.answer") as string) ||
          'Standard Nano Banana generates images quickly across different styles. Pro adds camera-style controls (depth of field, lighting), clear text rendering in multiple languages, and higher resolution output. <a href="/text-to-image/nano-banana-pro" class="text-primary underline">Compare versions →</a>',
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "How long does generation take?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Standard: 5-10 seconds per image. Pro: 10-15 seconds for complex prompts or higher resolution outputs.",
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
    name: "Barko Bear AI Nano Banana Text to Image",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/nano-banana",
    locale,
    category: "MultimediaApplication",
    features: [
      "AI Text to Image Generation",
      "Fast Generation (5-10 seconds)",
      "Multiple Visual Styles",
      "Plain Text Input",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Images with Nano Banana",
    description: "Generate images from text descriptions using Nano Banana AI",
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe the image you want to generate in plain language",
      },
      {
        name: "Generate",
        text: "Click generate to create your image in 5-10 seconds",
      },
      {
        name: "Download",
        text: "Download your generated image in JPG, PNG, or WebP format",
      },
    ],
    totalTime: "PT10S",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer || "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Text to Image", url: "/text-to-image" },
      { name: "Nano Banana", url: "/text-to-image/nano-banana" },
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
        playgroundConfig={nanoBananaTextToImageConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", { defaultValue: "Use Cases" })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.conceptVisualization.title", {
                          defaultValue: "Concept Visualization",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.conceptVisualization.description", {
                        defaultValue:
                          "Need to show clients an idea but don't have reference photos? Describe the concept and generate visuals for presentations and pitches.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.socialMedia.title", {
                          defaultValue: "Social Media Graphics",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.socialMedia.description", {
                        defaultValue:
                          "Create original images for posts and ads. Generate backgrounds, product mockups, or illustrations without stock photos or hiring designers.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.marketing.title", {
                          defaultValue: "Marketing Materials",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.marketing.description", {
                        defaultValue:
                          "Design posters, ads, and promotional graphics with text elements. Pro version keeps typography clear and professional—useful for event posters and product packaging.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("useCases.creativeExploration.title", {
                          defaultValue: "Creative Exploration",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.creativeExploration.description", {
                        defaultValue:
                          "Test different visual directions before committing to detailed work. Generate multiple style variations to find what works.",
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
