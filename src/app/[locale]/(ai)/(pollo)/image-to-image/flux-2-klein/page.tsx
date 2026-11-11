import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { flux2KleinImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
    "landing.flux-2-klein-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/flux-2-klein`
      : `${envConfigs.app_url}/image-to-image/flux-2-klein`;

  return {
    title: t("title", {
      defaultValue:
        "Flux 2 Klein Image-to-Image - AI Image Editor | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Transform and edit images with Flux 2 Klein image-to-image. Upload up to 4 images and transform them with AI-powered editing.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "flux-2-klein image-to-image, flux-2-klein, image editing, ai image editor, image transformation",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Flux2KleinImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.flux-2-klein-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform and edit images with Flux 2 Klein image-to-image. Upload up to 4 images and transform them with AI-powered editing.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "Flux 2 Klein Image-to-Image" }),
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
      defaultValue: "Powerful AI image editing capabilities",
    }),
    items: [
      {
        title: tPage("keyFeatures.multiImage.title", {
          defaultValue: "Multiple Image Support",
        }),
        description: tPage("keyFeatures.multiImage.description", {
          defaultValue:
            "Upload up to 4 images at once for batch processing. Each image is charged separately at 2 credits per image.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.highQuality.title", {
          defaultValue: "High Quality Output",
        }),
        description: tPage("keyFeatures.highQuality.description", {
          defaultValue:
            "Generate high-resolution transformed images with exceptional detail and clarity.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.styleFlexibility.title", {
          defaultValue: "Style Flexibility",
        }),
        description: tPage("keyFeatures.styleFlexibility.description", {
          defaultValue:
            "Transform images in various styles - photorealistic, artistic, abstract, and more. Control the output with detailed prompts.",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.affordable.title", {
          defaultValue: "Affordable Pricing",
        }),
        description: tPage("keyFeatures.affordable.description", {
          defaultValue:
            "Pay only for what you use. Each image transformation costs just 2 credits, making it affordable for any project.",
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
      defaultValue: "Common questions about Flux 2 Klein Image-to-Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How many images can I upload?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "You can upload up to 4 images at once. Each image is processed separately and charged at 2 credits per image.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How much does it cost?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Each image transformation costs 2 credits. If you upload 4 images, the total cost will be 8 credits (4 images × 2 credits).",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What image formats are supported?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "We support PNG, JPEG, JPG, and WebP image formats. Make sure your images are clear and well-lit for best results.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How detailed should my prompt be?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "More detail generally means better results. Include subject, setting, lighting, style, mood, and composition details. Be specific about what transformation you want.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "Can I use the same prompt for multiple images?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Yes, you can use the same prompt for all uploaded images. Each image will be transformed according to your prompt description.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Transform Your Images?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start transforming your images with AI-powered editing today.",
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
      defaultValue: "Barko Bear AI Flux 2 Klein Image to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/flux-2-klein",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "AI Image Editing",
      }),
      tPage("schema.features.multiImage", {
        defaultValue: "Multiple Image Support",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High Quality Output",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Transform Images with Flux 2 Klein",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Transform images using Flux 2 Klein image-to-image",
    }),
    steps: [
      {
        name: "Upload images",
        text: "Upload up to 4 images you want to transform",
      },
      {
        name: "Enter prompt",
        text: "Describe how you want to transform the images",
      },
      { name: "Generate", text: "Click generate to transform your images" },
      { name: "Download", text: "Download your transformed images" },
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
        name: tPage("breadcrumb.flux2Klein", { defaultValue: "Flux 2 Klein" }),
        url: "/image-to-image/flux-2-klein",
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
        playgroundConfig={flux2KleinImageToImageConfig}
      >
        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Prompting Tips */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Results with Flux-2-Klein Image-to-Image",
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
                          'Describe exactly what transformation you want. For example: "Change to comic style" or "Make it look like a watercolor painting".',
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
                          'Mention the artistic style you want: "comic book style", "oil painting", "digital art", etc.',
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
                          'Describe color schemes and mood: "vibrant colors", "muted tones", "dark and moody", etc.',
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
                          "Include details about lighting, composition, and any specific elements you want to preserve or change.",
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
                    defaultValue: "Flux-2-Klein Image-to-Image Use Cases",
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
                          "Transform photos into different artistic styles - comic, watercolor, oil painting, and more.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.batch.title", {
                        defaultValue: "Batch Processing",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.batch.description", {
                        defaultValue:
                          "Process up to 4 images at once with the same transformation style for consistent results.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.product.title", {
                        defaultValue: "Product Photography",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.product.description", {
                        defaultValue:
                          "Transform product photos into different styles for marketing materials and social media.",
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
                          "Experiment with different artistic styles and transformations for creative projects.",
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
