import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { nanoBananaImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
    "landing.nano-banana-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/nano-banana`
      : `${envConfigs.app_url}/image-to-image/nano-banana`;

  return {
    title: t("title", {
      defaultValue:
        "Nano Banana Image-to-Image AI Editor - Transform Images | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Use Nano Banana image-to-image AI to edit and transform images online. Upload up to 10 images with aspect ratio control.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "nano banana 2, nano-banana, image-to-image, nano banana 2 image-to-image, AI image editor",
    }),
    alternates: { canonical: canonicalUrl },
  };
}

export default async function NanoBananaImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.nano-banana-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Edit and transform images with Nano Banana image-to-image AI. Upload up to 10 images with aspect ratio control for intelligent image-to-image edits.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue:
        "Nano Banana Image-to-Image — AI Image Editor & Transformer",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", {
          defaultValue: "Try Nano Banana Image-to-Image",
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
      defaultValue: "Why Choose Nano Banana for Image-to-Image Editing?",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue:
        "Advanced AI image-to-image editing powered by nano-banana technology",
    }),
    items: [
      {
        title: tPage("keyFeatures.multiImage.title", {
          defaultValue: "Batch Image-to-Image with Nano Banana",
        }),
        description: tPage("keyFeatures.multiImage.description", {
          defaultValue:
            "Upload up to 10 images at once for batch image-to-image editing with nano-banana.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.aspectRatio.title", {
          defaultValue: "Nano Banana Aspect Ratio Control",
        }),
        description: tPage("keyFeatures.aspectRatio.description", {
          defaultValue:
            "Nano-banana-2 image-to-image supports 10+ aspect ratios including 1:1, 16:9, 9:16, and more.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.smartEdit.title", {
          defaultValue: "Intelligent Image-to-Image Editing",
        }),
        description: tPage("keyFeatures.smartEdit.description", {
          defaultValue:
            "Nano Banana understands context and semantics for precise image-to-image transformations.",
        }),
        icon: "Wand2",
      },
      {
        title: tPage("keyFeatures.affordable.title", {
          defaultValue: "Affordable Nano Banana Pricing",
        }),
        description: tPage("keyFeatures.affordable.description", {
          defaultValue:
            "Cost-effective nano-banana image-to-image transformations accessible for any project.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", {
      defaultValue: "Nano Banana Image-to-Image FAQ",
    }),
    description: tPage("faq.description", {
      defaultValue:
        "Frequently asked questions about Nano Banana image-to-image AI editor",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue:
            "How many images can I edit with Nano Banana image-to-image?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "You can upload up to 10 images for batch image-to-image editing with nano-banana.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue:
            "What aspect ratios does Nano Banana image-to-image support?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Nano Banana image-to-image supports 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, and 21:9 aspect ratios.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What formats does Nano Banana image-to-image support?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "Nano Banana image-to-image supports PNG, JPEG, JPG, and WebP formats.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue:
            "How do I write effective prompts for Nano Banana image-to-image?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "For best nano-banana image-to-image results, include target style, mood, lighting, and composition details.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What makes Nano Banana image-to-image different?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Nano Banana uses advanced nano-banana AI for context-aware image-to-image transformations with flexible aspect ratio control.",
        }),
      },
    ],
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Try Nano Banana Image-to-Image?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start transforming your images with nano-banana image-to-image AI today.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Try Nano Banana Image-to-Image Now",
        }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: tPage("schema.softwareName", {
      defaultValue: "Nano Banana Image-to-Image AI Editor - Barko Bear",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/nano-banana",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "Nano Banana Image-to-Image AI Editing",
      }),
      tPage("schema.features.multiImage", {
        defaultValue: "Batch Image-to-Image with Nano Banana",
      }),
      tPage("schema.features.aspectRatio", {
        defaultValue: "Nano Banana Aspect Ratio Control",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Use Nano Banana Image-to-Image AI Editor",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue:
        "Edit and transform images using nano-banana image-to-image AI technology",
    }),
    steps: [
      {
        name: "Upload images",
        text: "Upload up to 10 images for nano-banana image-to-image editing",
      },
      {
        name: "Select aspect ratio",
        text: "Choose your desired output aspect ratio for image-to-image",
      },
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
        name: tPage("breadcrumb.nanoBanana", { defaultValue: "Nano Banana" }),
        url: "/image-to-image/nano-banana",
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
        playgroundConfig={nanoBananaImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Nano Banana Image-to-Image Results",
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
                          "For optimal nano-banana image-to-image results, describe exactly what edits you want.",
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
                          "When using Nano Banana image-to-image, mention the target style clearly.",
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
                          "Guide nano-banana image-to-image with color and mood cues.",
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
                          "Maximize Nano Banana image-to-image quality by specifying lighting, composition, and texture.",
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
