import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { gptImage2TextToImageConfig } from "@/shared/blocks/desktop-playground/configs/text-to-image-configs";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from "@/shared/types/blocks/landing";

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
    "landing.gpt-image-2-text-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/text-to-image/gpt-image-2`
      : `${envConfigs.app_url}/text-to-image/gpt-image-2`;

  return {
    title: t("title", {
      defaultValue: "GPT-Image 2 Text to Image - AI Image Generator | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Generate images with GPT-Image 2 using prompt-first creation and rich aspect ratio controls, from square to ultrawide and tall mobile formats.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "GPT-Image 2, text to image, ai image generator, aspect ratio, prompt to image, openai image model",
    }),
    openGraph: {
      title: t("title", {
        defaultValue:
          "GPT-Image 2 Text to Image - AI Image Generator | joymagic",
      }),
      description: t("description", {
        defaultValue:
          "Generate images with GPT-Image 2 using prompt-first creation and rich aspect ratio controls, from square to ultrawide and tall mobile formats.",
      }),
      url: canonicalUrl,
      siteName: "joymagic",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title", {
        defaultValue:
          "GPT-Image 2 Text to Image - AI Image Generator | joymagic",
      }),
      description: t("description", {
        defaultValue:
          "Generate images with GPT-Image 2 using prompt-first creation and rich aspect ratio controls, from square to ultrawide and tall mobile formats.",
      }),
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GptImage2TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations("landing.gpt-image-2-text-to-image.page");
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'GPT-Image 2 is built for prompt-led image creation with flexible framing controls. Start from a text prompt, then choose the aspect ratio that matches your output surface: square posts, landscape banners, portrait covers, or ultra-wide campaign visuals.<br/><br/>Need to edit uploaded images instead? <a href="/image-to-image/gpt-image-2" class="text-primary underline">Try GPT-Image 2 Image to Image</a>.';

  const faqItems: FAQType["items"] = [
    {
      question: tPage("faq.q1.question", {
        defaultValue: "What parameters does GPT-Image 2 Text to Image support?",
      }),
      answer: tPage("faq.q1.answer", {
        defaultValue:
          "This setup supports two core parameters: prompt and aspect ratio. Aspect ratio includes 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 5:4, 4:5, 2:1, 1:2, 21:9, and 9:21.",
      }),
    },
    {
      question: tPage("faq.q2.question", {
        defaultValue: "Which aspect ratio should I choose?",
      }),
      answer: tPage("faq.q2.answer", {
        defaultValue:
          "Use 1:1 for square covers, 16:9 for banners and desktop hero visuals, 9:16 for mobile-first creatives, and 21:9 when you need a cinematic ultra-wide composition.",
      }),
    },
    {
      question: tPage("faq.q3.question", {
        defaultValue:
          "Can I generate portrait and landscape outputs from the same prompt?",
      }),
      answer: tPage("faq.q3.answer", {
        defaultValue:
          "Yes. Keep the prompt intent consistent and change only the aspect ratio to explore different crops and compositions for the same creative direction.",
      }),
    },
  ];

  const hero: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "GPT-Image 2 Text to Image",
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

  const features: FeaturesType = {
    id: "features",
    title: tPage("features.title", {
      defaultValue: "Why GPT-Image 2",
    }),
    description: tPage("features.description", {
      defaultValue:
        "A lightweight prompt-first setup focused on framing flexibility.",
    }),
    items: [
      {
        title: tPage("features.promptFirst.title", {
          defaultValue: "Prompt-first workflow",
        }),
        description: tPage("features.promptFirst.description", {
          defaultValue:
            "Keep the surface simple: start from a single prompt and iterate quickly without extra controls getting in the way.",
        }),
        icon: "Sparkles",
      },
      {
        title: tPage("features.aspectCoverage.title", {
          defaultValue: "Full aspect ratio coverage",
        }),
        description: tPage("features.aspectCoverage.description", {
          defaultValue:
            "Move between square, standard, classic, tall, wide, and ultra-wide canvases from one model entry point.",
        }),
        icon: "ImageIcon",
      },
      {
        title: tPage("features.creatorReady.title", {
          defaultValue: "Creator-ready framing",
        }),
        description: tPage("features.creatorReady.description", {
          defaultValue:
            "Match your output to social posts, cover art, banners, product cards, and cinematic hero sections without manual resizing first.",
        }),
        icon: "Target",
      },
    ],
  };

  const faq: FAQType = {
    id: "faq",
    title: tPage("faq.title", {
      defaultValue: "Frequently Asked Questions",
    }),
    description: tPage("faq.description", {
      defaultValue: "Common questions about GPT-Image 2 text generation.",
    }),
    items: faqItems,
  };

  const cta: CTAType = {
    id: "cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to create with GPT-Image 2?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Start with a prompt, pick the right frame, and generate the first pass in seconds.",
    }),
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Open Playground",
        }),
        url: "#playground",
      },
    ],
  };

  return (
    <>
      <JsonLd
        data={[
          generateSoftwareApplicationSchema({
            name: tPage("schema.softwareName", {
              defaultValue: "joymagic AI GPT-Image 2 Text to Image",
            }),
            description: tPage("schema.softwareDescription", {
              defaultValue:
                "Generate images with GPT-Image 2 using prompt-first creation and flexible aspect ratio controls.",
            }),
            url: "/text-to-image/gpt-image-2",
            locale,
            category: "MultimediaApplication",
            features: [
              tPage("schema.features.promptFirst", {
                defaultValue: "Prompt-led image generation",
              }),
              tPage("schema.features.aspectPresets", {
                defaultValue: "13 aspect ratio presets",
              }),
              tPage("schema.features.outputCoverage", {
                defaultValue:
                  "Square, landscape, portrait, and ultra-wide outputs",
              }),
            ],
          }),
          generateHowToSchema({
            name: tPage("schema.howToName", {
              defaultValue: "How to generate images with GPT-Image 2",
            }),
            description: tPage("schema.howToDescription", {
              defaultValue:
                "Write a prompt, choose an aspect ratio, and generate an image with GPT-Image 2.",
            }),
            steps: [
              {
                name: tPage("schema.steps.prompt.name", {
                  defaultValue: "Write your prompt",
                }),
                text: tPage("schema.steps.prompt.text", {
                  defaultValue:
                    "Describe the subject, style, lighting, and composition you want to create.",
                }),
              },
              {
                name: tPage("schema.steps.aspectRatio.name", {
                  defaultValue: "Choose aspect ratio",
                }),
                text: tPage("schema.steps.aspectRatio.text", {
                  defaultValue:
                    "Pick the output shape that matches your target canvas, from square to portrait or ultra-wide.",
                }),
              },
              {
                name: tPage("schema.steps.generate.name", {
                  defaultValue: "Generate and download",
                }),
                text: tPage("schema.steps.generate.text", {
                  defaultValue:
                    "Run the model and download the result that best fits your creative workflow.",
                }),
              },
            ],
            totalTime: "PT15S",
          }),
          generateFAQSchema(
            faqItems.map((item) => ({
              question: item.question || "",
              answer: typeof item.answer === "string" ? item.answer : "",
            })),
          ),
          generateBreadcrumbSchema(
            [
              {
                name: tPage("breadcrumb.home", { defaultValue: "Home" }),
                url: "/",
              },
              {
                name: tPage("breadcrumb.textToImage", {
                  defaultValue: "Text to Image",
                }),
                url: "/text-to-image",
              },
              {
                name: tPage("breadcrumb.model", {
                  defaultValue: "GPT-Image 2",
                }),
                url: "/text-to-image/gpt-image-2",
              },
            ],
            locale,
          ),
        ]}
      />

      <AiMediaPageLayout
        hero={hero}
        headerNavItems={headerNavItems}
        playgroundConfig={gptImage2TextToImageConfig}
      >
        <Features features={features} className="bg-transparent py-16 md:py-24" />

        <section className="bg-transparent py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                {tPage("useCases.title", {
                  defaultValue: "Use Cases",
                })}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.socialCampaigns.title", {
                      defaultValue: "Social Campaign Visuals",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.socialCampaigns.description", {
                      defaultValue:
                        "Generate square, portrait, and widescreen campaign variants from one prompt for feeds, stories, and hero banners.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.coverArt.title", {
                      defaultValue: "Cover Art & Thumbnails",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.coverArt.description", {
                      defaultValue:
                        "Use portrait and square ratios for covers, thumbnail systems, and creator packaging across multiple channels.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.productVisuals.title", {
                      defaultValue: "Product & Brand Visuals",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.productVisuals.description", {
                      defaultValue:
                        "Build first-pass product concepts, packaging scenes, and branded key visuals before moving into downstream refinement.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.cinematicBoards.title", {
                      defaultValue: "Cinematic Moodboards",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.cinematicBoards.description", {
                      defaultValue:
                        "Explore wide and ultra-wide frames for editorial moodboards, landing-page heroes, and cinematic concept stills.",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQ faq={faq} className="bg-transparent py-16 md:py-24" />

        <CTA cta={cta} className="bg-transparent py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
