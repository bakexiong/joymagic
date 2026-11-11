import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { zImageTurboImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
import { Camera, Palette, Lightbulb, Sparkles } from "lucide-react";

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
    "landing.z-image-turbo-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/z-image-turbo`
      : `${envConfigs.app_url}/image-to-image/z-image-turbo`;

  return {
    title: t("title", {
      defaultValue:
        "Z Image Turbo Image-to-Image - AI Image Editor | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Transform images with Z Image Turbo. Single image upload with size, strength and output format controls.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "z-image-turbo image-to-image, Barko Bear turbo, image editing, ai image editor, image transformation",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ZImageTurboImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations(
    "landing.z-image-turbo-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform images with Z Image Turbo image-to-image. Upload one image and control size (1:1, 16:9, 9:16, etc.), strength and output format.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "Z Image Turbo Image-to-Image",
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

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", { defaultValue: "Key Features" }),
    description: tPage("keyFeatures.description", {
      defaultValue: "Powerful Z Image Turbo image-to-image capabilities",
    }),
    items: [
      {
        title: tPage("keyFeatures.singleImage.title", {
          defaultValue: "Single Image Upload",
        }),
        description: tPage("keyFeatures.singleImage.description", {
          defaultValue:
            "Upload one image and transform it with full control over size, strength and output format.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.sizeControl.title", {
          defaultValue: "Size & Aspect Ratio",
        }),
        description: tPage("keyFeatures.sizeControl.description", {
          defaultValue:
            "Choose from 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3. Width and height from 256 to 1536, default 1024.",
        }),
        icon: "Sparkles",
      },
      {
        title: tPage("keyFeatures.strength.title", {
          defaultValue: "Strength Control",
        }),
        description: tPage("keyFeatures.strength.description", {
          defaultValue:
            "Adjust strength from 0 to 1 to control how much the image is transformed.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.outputFormat.title", {
          defaultValue: "Output Format",
        }),
        description: tPage("keyFeatures.outputFormat.description", {
          defaultValue: "Export as JPEG, PNG or WebP to match your workflow.",
        }),
        icon: "Sparkles",
      },
    ],
  };

  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about Z Image Turbo Image-to-Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "How many images can I upload?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "Z Image Turbo processes one image at a time. Upload your image, set size and strength, then generate.",
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
            "We support PNG, JPEG, JPG, and WebP for input. Output can be JPEG, PNG or WebP.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "How detailed should my prompt be?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "More detail generally means better results. Include subject, setting, lighting, style and what you want to preserve or change.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What does strength do?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Strength (0–1) controls how much the image changes. Lower values keep more of the original; higher values allow more transformation.",
        }),
      },
    ],
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Transform Your Image?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue: "Start transforming with Z Image Turbo today.",
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
      defaultValue: "Barko Bear AI Z Image Turbo Image to Image",
    }),
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/image-to-image/z-image-turbo",
    locale,
    category: "MultimediaApplication",
    features: [
      tPage("schema.features.aiImageEditing", {
        defaultValue: "AI Image Editing",
      }),
      tPage("schema.features.sizeControl", {
        defaultValue: "Size & Aspect Ratio Control",
      }),
      tPage("schema.features.highQuality", {
        defaultValue: "High Quality Output",
      }),
    ],
  });

  const howToSchema = generateHowToSchema({
    name: tPage("schema.howToName", {
      defaultValue: "How to Transform Images with Z Image Turbo",
    }),
    description: tPage("schema.howToDescription", {
      defaultValue: "Transform images using Z Image Turbo image-to-image",
    }),
    steps: [
      { name: "Upload image", text: "Upload one image you want to transform" },
      {
        name: "Enter prompt",
        text: "Describe how you want to transform the image",
      },
      { name: "Set options", text: "Choose size, strength and output format" },
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
        name: tPage("breadcrumb.zImageTurbo", {
          defaultValue: "Z Image Turbo",
        }),
        url: "/image-to-image/z-image-turbo",
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
        playgroundConfig={zImageTurboImageToImageConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("promptingTips.title", {
                    defaultValue:
                      "How to Get Best Results with Z Image Turbo Image-to-Image",
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
                    defaultValue: "Z Image Turbo Image-to-Image Use Cases",
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
                      {tPage("useCases.aspectRatio.title", {
                        defaultValue: "Aspect Ratio & Size",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.aspectRatio.description", {
                        defaultValue:
                          "Output in 1:1, 16:9, 9:16, 4:3, 3:4, 3:2 or 2:3 with full control over dimensions.",
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
                          "Transform product photos for marketing and social media with strength and format control.",
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
                          "Experiment with strength and aspect ratios for creative image transformations.",
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
