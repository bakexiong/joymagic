import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { qwenImageMaxImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
  const t = await getTranslations(
    "landing.qwen-image-max-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/qwen-image-max`
      : `${envConfigs.app_url}/image-to-image/qwen-image-max`;

  return {
    title: t("title", {
      defaultValue:
        "Qwen Image Max Image-to-Image AI Editor - Edit & Transform Images | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Edit and transform images with Qwen Image Max image-to-image AI. Upload up to 4 images and apply intelligent edits powered by qwen-image-max-edit technology.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "qwen image max, qwen-image-max-edit, image-to-image, AI image editor, qwen image editing, AI image transformation",
    }),
    alternates: { canonical: canonicalUrl },
  };
}

export default async function QwenImageMaxImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.qwen-image-max-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Edit and transform images with Qwen Image Max image-to-image AI. Upload up to 4 images and apply intelligent edits powered by qwen-image-max-edit technology.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Qwen Image Max Image-to-Image AI Editor",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", {
          defaultValue: "Try Qwen Image Max Editor",
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

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", {
      defaultValue: "Why Choose Qwen Image Max for Image Editing?",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue: "Advanced AI image editing powered by qwen-image-max-edit",
    }),
    items: [
      {
        title: tPage("keyFeatures.multiImage.title", {
          defaultValue: "Batch Image Editing",
        }),
        description: tPage("keyFeatures.multiImage.description", {
          defaultValue:
            "Upload up to 4 images at once for batch editing with qwen-image-max-edit.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.highQuality.title", {
          defaultValue: "Superior Edit Quality",
        }),
        description: tPage("keyFeatures.highQuality.description", {
          defaultValue:
            "Qwen Image Max delivers high-fidelity edits with exceptional detail preservation.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.smartEdit.title", {
          defaultValue: "Intelligent Editing",
        }),
        description: tPage("keyFeatures.smartEdit.description", {
          defaultValue:
            "Qwen-image-max-edit understands context and semantics for precise transformations.",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.affordable.title", {
          defaultValue: "Cost-Effective Editing",
        }),
        description: tPage("keyFeatures.affordable.description", {
          defaultValue:
            "Affordable per-edit pricing makes Qwen Image Max accessible for any project.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", {
      defaultValue: "Qwen Image Max Image-to-Image FAQ",
    }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Qwen Image Max image editing",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How many images can I edit at once?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "You can upload up to 4 images for batch editing with qwen-image-max-edit.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How much does Qwen Image Max editing cost?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Each edit costs a fixed number of credits regardless of image count.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What formats does Qwen Image Max support?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Qwen Image Max supports PNG, JPEG, JPG, and WebP formats.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How do I write effective edit prompts?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Be specific about the changes you want. Include style, mood, lighting, and composition details.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What makes Qwen Image Max different?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Qwen Image Max uses advanced qwen-image-max-edit technology for context-aware, semantically intelligent image transformations.",
        }),
      },
    ],
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Edit Images with Qwen Image Max?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start editing your images with qwen-image-max-edit AI today.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Try Qwen Image Max Now",
        }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: tPage("schema.softwareName", {
      defaultValue: "Qwen Image Max Image-to-Image AI Editor - Barko Bear",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/qwen-image-max",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "Qwen Image Max AI Editing",
      }),
      tPage("schema.features.multiImage", {
        defaultValue: "Batch Image Editing",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High-Quality Output",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Edit Images with Qwen Image Max",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Edit images using qwen-image-max-edit AI technology",
    }),
    steps: [
      { name: "Upload images", text: "Upload up to 4 images you want to edit" },
      { name: "Enter prompt", text: "Describe the edits you want to apply" },
      { name: "Generate", text: "Click generate to apply AI edits" },
      { name: "Download", text: "Download your edited images" },
    ],
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
        name: tPage("breadcrumb.qwenImageMax", {
          defaultValue: "Qwen Image Max",
        }),
        url: "/image-to-image/qwen-image-max",
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
        playgroundConfig={qwenImageMaxImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Prompting Tips */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Results with Qwen Image Max Editor",
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
                          "Describe exactly what edits you want for optimal qwen-image-max-edit results.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.style.title", {
                          defaultValue: "Specify Style",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.style.description", {
                        defaultValue:
                          "Mention the artistic style for your qwen-image-max-edit transformation.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.color.title", {
                          defaultValue: "Color and Mood",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.color.description", {
                        defaultValue:
                          "Describe color schemes and mood for enhanced qwen-image-max-edit results.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        {tPage("promptingTips.details.title", {
                          defaultValue: "Add Details",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("promptingTips.details.description", {
                        defaultValue:
                          "Include lighting, composition, and element details for best qwen-image-max-edit quality.",
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
                  {tPage("useCases.title", {
                    defaultValue: "Qwen Image Max Image Editing Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.style.title", {
                        defaultValue: "Artistic Style Transfer",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.style.description", {
                        defaultValue:
                          "Use qwen-image-max-edit to transform photos into different artistic styles.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.batch.title", {
                        defaultValue: "Batch Photo Editing",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.batch.description", {
                        defaultValue:
                          "Edit up to 4 images simultaneously with consistent style using Qwen Image Max.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.product.title", {
                        defaultValue: "Product Image Enhancement",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.product.description", {
                        defaultValue:
                          "Enhance product photos with qwen-image-max-edit for e-commerce and marketing.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.creative.title", {
                        defaultValue: "Creative Design",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.creative.description", {
                        defaultValue:
                          "Explore creative possibilities with Qwen Image Max intelligent image editing.",
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
