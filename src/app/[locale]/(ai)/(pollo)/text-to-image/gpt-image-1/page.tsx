import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { gptImage1TextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
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
  Type,
  Target,
  Palette,
  Image as ImageIcon,
  FileText,
  Music,
  Package,
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
    "landing.gpt-image-1-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/gpt-image-1`
      : `${envConfigs.app_url}/text-to-image/gpt-image-1`;

  return {
    title: t("title", {
      defaultValue:
        "GPT-Image-1 Text to Image - AI Image Generator | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Generate images from text with OpenAI GPT-Image-1. Superior text rendering for posters and signage. Precise prompt following, multiple styles. Try free now.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "GPT-Image-1, text to image, ai image generator, openai, text rendering, posters, signage, prompt following",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GptImage1TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations("landing.gpt-image-1-text-to-image.page");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'GPT-Image-1 is OpenAI\'s image generation model built for precise prompt following and accurate text rendering. Describe any scene, style, or design—including text elements like headlines, signage, and labels. Try GPT-Image-1 for free below!<br/><br/>Need bilingual prompts or character consistency? <a href="/text-to-image/seedream-4-5" class="text-primary underline">Try Seedream 4.5 Text to Image</a>.';
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", { defaultValue: "GPT-Image-1 Text to Image" }),
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

  // Key Features (Learn More Section)
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", { defaultValue: "Key Features" }),
    description: tPage("keyFeatures.description", {
      defaultValue: "Powerful capabilities for precise image generation",
    }),
    items: [
      {
        title: tPage("keyFeatures.superiorTextRendering.title", {
          defaultValue: "Superior Text Rendering",
        }),
        description: tPage("keyFeatures.superiorTextRendering.description", {
          defaultValue:
            "Generate clear, legible text inside images—posters, signage, book covers, product labels, social media graphics. Handles multiple text elements and dense typography better than most generation models.",
        }),
        icon: "Type",
      },
      {
        title: tPage("keyFeatures.preciseInstructionFollowing.title", {
          defaultValue: "Precise Instruction Following",
        }),
        description: tPage(
          "keyFeatures.preciseInstructionFollowing.description",
          {
            defaultValue:
              "The model interprets detailed prompts accurately. Specify composition, lighting, color palette, mood, style, and subject placement—GPT-Image-1 follows your instructions down to small elements without drift.",
          },
        ),
        icon: "Target",
      },
      {
        title: tPage("keyFeatures.styleVersatility.title", {
          defaultValue: "Style Versatility",
        }),
        description: tPage("keyFeatures.styleVersatility.description", {
          defaultValue:
            "Create photorealistic images, illustrations, concept art, vintage photography, minimalist designs, and more. Reference specific artistic styles or movements in your prompt for targeted results.",
        }),
        icon: "Palette",
      },
      {
        title: tPage("keyFeatures.transparentBackground.title", {
          defaultValue: "Transparent Background Support",
        }),
        description: tPage("keyFeatures.transparentBackground.description", {
          defaultValue:
            'Generate images with transparency using PNG output. Specify "transparent background" in your prompt for assets ready to composite into designs without manual cutout.',
        }),
        icon: "ImageIcon",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about GPT-Image-1 Text to Image",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is GPT-Image-1?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "GPT-Image-1 is OpenAI's AI image generation model that creates images from text descriptions. It's particularly strong at rendering readable text within images.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "How accurate is the text rendering?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "GPT-Image-1 generates legible text better than most AI models. It handles multiple text elements and dense typography. For pixel-perfect text in critical applications, generate the base image here and add final text in design software.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "Can I get transparent backgrounds?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            'Yes. Choose PNG output format and include "transparent background" in your prompt. Useful for logos, stickers, and composite assets.',
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "What styles can it generate?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Photorealism, illustration, concept art, digital painting, vintage aesthetics, minimalist design, and more. Reference specific styles in your prompt.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "When should I use Seedream 4.5 instead?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Use Seedream 4.5 when you need bilingual prompt support (Chinese) or want to maintain character consistency across generations. Use GPT-Image-1 when text rendering quality is the priority.",
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
    name: "Barko Bear AI GPT-Image-1 Text to Image",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: "/text-to-image/gpt-image-1",
    locale,
    category: "MultimediaApplication",
    features: [
      "Superior Text Rendering",
      "Precise Instruction Following",
      "Style Versatility",
      "Transparent Background Support",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Generate Images with GPT-Image-1",
    description:
      "Generate images from text with OpenAI GPT-Image-1 using superior text rendering and precise prompt following",
    steps: [
      {
        name: "Enter your prompt",
        text: "Describe the image you want to generate, including text elements, style, and composition",
      },
      {
        name: "Generate",
        text: "Click generate to create your image with accurate text rendering in 10-15 seconds",
      },
      {
        name: "Download",
        text: "Download your image in JPG, PNG, or WebP format. Use PNG for transparent backgrounds.",
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
      { name: "GPT-Image-1", url: "/text-to-image/gpt-image-1" },
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
        playgroundConfig={gptImage1TextToImageConfig}
      >
        <Features
          features={keyFeatures}
          className="bg-transparent py-16 md:py-24"
        />

        <section className="bg-transparent py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                  {tPage("useCases.title", { defaultValue: "Use Cases" })}
                </h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage("useCases.marketingGraphics.title", {
                          defaultValue: "Marketing Graphics",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.marketingGraphics.description", {
                        defaultValue:
                          "Create social posts, banner ads, and promotional materials with text elements built in. Headlines, CTAs, and pricing render cleanly.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Type className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage("useCases.signagePosters.title", {
                          defaultValue: "Signage & Posters",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.signagePosters.description", {
                        defaultValue:
                          "Design event posters, store signage, and announcements where typography is central to the visual.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Music className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage("useCases.bookAlbumCovers.title", {
                          defaultValue: "Book & Album Covers",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.bookAlbumCovers.description", {
                        defaultValue:
                          "Generate cover concepts with title and author text integrated. Explore directions before committing to final design.",
                      })}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Package className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage("useCases.productMockups.title", {
                          defaultValue: "Product Mockups",
                        })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tPage("useCases.productMockups.description", {
                        defaultValue:
                          "Create packaging concepts and label designs with readable product names, ingredients, and branding.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="bg-transparent py-16 md:py-24" />

        <CTA
          cta={finalCTA}
          className="bg-transparent py-16 md:py-24 text-foreground"
        />
      </AiMediaPageLayout>
    </>
  );
}
