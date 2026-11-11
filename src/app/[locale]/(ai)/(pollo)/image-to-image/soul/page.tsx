import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { soulImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
  const t = await getTranslations("landing.soul-image-to-image.page.metadata");

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/soul`
      : `${envConfigs.app_url}/image-to-image/soul`;

  return {
    title: t("title", {
      defaultValue: "Soul Image-to-Image - AI Image Editor | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Transform images with Soul image-to-image. Upload one image and transform it with quality, size, strength and style controls.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "soul image-to-image, soul, image editing, ai image editor, image transformation",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function SoulImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.soul-image-to-image.page");
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform images with Soul image-to-image. Upload one image and transform it with quality, size, strength and style controls.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "Soul Image-to-Image" }),
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

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", { defaultValue: "Key Features" }),
    description: tPage("keyFeatures.description", {
      defaultValue: "Powerful Soul image-to-image capabilities",
    }),
    items: [
      {
        title: tPage("keyFeatures.singleImage.title", {
          defaultValue: "Single Image Upload",
        }),
        description: tPage("keyFeatures.singleImage.description", {
          defaultValue:
            "Upload one image and transform it with full control over quality, size, strength and style.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.highQuality.title", {
          defaultValue: "High Quality Output",
        }),
        description: tPage("keyFeatures.highQuality.description", {
          defaultValue:
            "Choose medium or high quality. Multiple output sizes from 960×1696 to 2048×1536.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.styleFlexibility.title", {
          defaultValue: "Style & Strength",
        }),
        description: tPage("keyFeatures.styleFlexibility.description", {
          defaultValue:
            "Many preset styles (Creatures, Spotlight, Y2K, etc.) and strength 0–1 for how much to transform.",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.affordable.title", {
          defaultValue: "Affordable Pricing",
        }),
        description: tPage("keyFeatures.affordable.description", {
          defaultValue:
            "Pay only for what you use. Fixed credits per transformation.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Soul Image-to-Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How many images can I upload?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Soul processes one image at a time. Upload one image, set prompt, quality, size, strength and style, then generate.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How much does it cost?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Each transformation uses a fixed number of credits. Check the generate button for the current cost.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What image formats are supported?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "We support PNG, JPEG, JPG, and WebP. Use clear, well-lit images for best results.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How detailed should my prompt be?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Include subject, setting, lighting, style and mood. More detail typically gives better results.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What does strength do?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Strength (0.00–1.00) controls how much the image is transformed. Lower keeps more of the original; higher changes more.",
        }),
      },
    ],
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Transform Your Images?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue: "Start transforming your images with Soul today.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", { defaultValue: "Try It Now" }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: tPage("schema.softwareName", {
      defaultValue: "joymagic AI Soul Image to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/soul",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "AI Image Editing",
      }),
      tPage("schema.features.singleImage", {
        defaultValue: "Single Image with Full Controls",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High Quality Output",
      }),
    ],
  });

  const howToStepsRaw = tPage.raw("schema.howToSteps") as
    | Array<{ name: string; text: string }>
    | undefined;
  const howToSteps =
    Array.isArray(howToStepsRaw) && howToStepsRaw.length > 0
      ? howToStepsRaw
      : [
          {
            name: "Upload image",
            text: "Upload one image you want to transform",
          },
          {
            name: "Enter prompt and options",
            text: "Set prompt, quality, size, strength and style",
          },
          { name: "Generate", text: "Click generate to transform your image" },
          { name: "Download", text: "Download your transformed image" },
        ];
  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Transform Images with Soul",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Transform images using Soul image-to-image",
    }),
    steps: howToSteps,
    totalTime: "PT2M",
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
        name: tPage("breadcrumb.imageToImage", {
          defaultValue: "Image to Image",
        }),
        url: "/image-to-image",
      },
      {
        name: tPage("breadcrumb.soul", { defaultValue: "Soul" }),
        url: "/image-to-image/soul",
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
        playgroundConfig={soulImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Results with Soul Image-to-Image",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.specific.title", {
                          defaultValue: "Be Specific",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.specific.description", {
                        defaultValue:
                          'Describe exactly what transformation you want. For example: "Harsh flash, timestamp corner, raw textures".',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.style.title", {
                          defaultValue: "Choose Style",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.style.description", {
                        defaultValue:
                          "Pick a preset style (e.g. Spotlight, Y2K, Medieval) or use General. Default is Creatures.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.strength.title", {
                          defaultValue: "Strength",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.strength.description", {
                        defaultValue:
                          "Use strength 0–1 to control how much the image changes. Lower keeps more of the original.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.details.title", {
                          defaultValue: "Quality & Size",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.details.description", {
                        defaultValue:
                          "Use medium or high quality and pick an output size that fits your use case.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", {
                    defaultValue: "Soul Image-to-Image Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.style.title", {
                        defaultValue: "Style Transformation",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.style.description", {
                        defaultValue:
                          "Transform photos into different styles - Spotlight, Y2K, Medieval, and many more.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.creative.title", {
                        defaultValue: "Creative Projects",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.creative.description", {
                        defaultValue:
                          "Experiment with quality, size, strength and style for creative projects.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.product.title", {
                        defaultValue: "Product & Social",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.product.description", {
                        defaultValue:
                          "Transform product or social photos with controlled output size and quality.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.consistent.title", {
                        defaultValue: "Consistent Look",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.consistent.description", {
                        defaultValue:
                          "Use the same style and strength across images for a consistent look.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="py-16 md:py-24" />

        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
