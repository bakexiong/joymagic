import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { grokImagineImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
import { Camera, Palette, Lightbulb, Sparkles, Zap, Wand2 } from "lucide-react";

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
    "landing.grok-imagine-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/grok-imagine-image`
      : `${envConfigs.app_url}/image-to-image/grok-imagine-image`;

  return {
    title: t("title", {
      defaultValue:
        "Grok Imagine Image-to-Image - AI Image Editor | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Transform and edit images with Grok Imagine image-to-image. Upload an image and transform it with AI-powered editing.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "grok imagine image-to-image, grok imagine, image editing, ai image editor, image transformation",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GrokImagineImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations(
    "landing.grok-imagine-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform and edit images using Grok Imagine image-to-image AI. Upload an image and transform it with advanced AI-powered editing.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "Grok Imagine Image-to-Image" }),
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
      defaultValue: "Powerful AI image editing with Grok Imagine",
    }),
    items: [
      {
        title: tPage("keyFeatures.singleImage.title", {
          defaultValue: "Single Image Upload",
        }),
        description: tPage("keyFeatures.singleImage.description", {
          defaultValue:
            "Upload one image and describe how you want to transform it. Simple and fast.",
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
            "Pay only for what you use. Each image transformation costs credits, making it affordable for any project.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Grok Imagine Image-to-Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How many images can I upload?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "You upload one image at a time. Describe your transformation in the prompt and generate.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How much does it cost?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Each image transformation costs a fixed number of credits. Check the pricing page for current rates.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What image formats are supported?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "We support PNG, JPEG, JPG, and WebP image formats. Make sure your image is clear and well-lit for best results.",
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
          defaultValue: "Can I transform the same image multiple times?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Yes, you can use different prompts on the same image to get different transformations.",
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
      defaultValue:
        "Start transforming your images with Grok Imagine AI-powered editing today.",
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
      defaultValue: "Barko Bear AI Grok Imagine Image to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/grok-imagine-image",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "AI Image Editing",
      }),
      tPage("schema.features.singleImage", {
        defaultValue: "Single Image Transform",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High Quality Output",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Transform Images with Grok Imagine",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Transform images using Grok Imagine image-to-image",
    }),
    steps: [
      { name: "Upload image", text: "Upload the image you want to transform" },
      {
        name: "Enter prompt",
        text: "Describe how you want to transform the image",
      },
      { name: "Generate", text: "Click generate to transform your image" },
      { name: "Download", text: "Download your transformed image" },
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
        name: tPage("breadcrumb.grokImagine", { defaultValue: "Grok Imagine" }),
        url: "/image-to-image/grok-imagine-image",
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
        playgroundConfig={grokImagineImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Results with Grok Imagine Image-to-Image",
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

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", {
                    defaultValue: "Grok Imagine Image-to-Image Use Cases",
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
                  <div className="rounded-lg border bg-card p-6">
                    <h3 className="font-semibold mb-3">
                      {tPage("useCases.personal.title", {
                        defaultValue: "Personal Use",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.personal.description", {
                        defaultValue:
                          "Reimagine your photos with AI - change mood, style, or setting with a single prompt.",
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
