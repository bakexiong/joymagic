import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { envConfigs } from "@/config";
import { JsonLd } from "@/shared/components/jsonld";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { gptImage2ImageToImageConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
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
    "landing.gpt-image-2-image-to-image.page.metadata",
  );

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/gpt-image-2`
      : `${envConfigs.app_url}/image-to-image/gpt-image-2`;

  return {
    title: t("title", {
      defaultValue:
        "GPT-Image 2 Image to Image - Edit Posters, UI, and Photoreal Images | joymagic",
    }),
    description: t("description", {
      defaultValue:
        "Edit up to 4 uploaded images with GPT-Image 2 for Chinese poster cleanup, document-style layouts, photoreal retouching, and interface mockup transformations.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "GPT-Image 2 image to image, chinese poster editing, photoreal image editor, UI mockup editor, image to image AI, edit up to 4 images",
    }),
    openGraph: {
      title: t("title", {
        defaultValue:
          "GPT-Image 2 Image to Image - Edit Posters, UI, and Photoreal Images | joymagic",
      }),
      description: t("description", {
        defaultValue:
          "Edit up to 4 uploaded images with GPT-Image 2 for Chinese poster cleanup, document-style layouts, photoreal retouching, and interface mockup transformations.",
      }),
      url: canonicalUrl,
      siteName: "joymagic",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title", {
        defaultValue:
          "GPT-Image 2 Image to Image - Edit Posters, UI, and Photoreal Images | joymagic",
      }),
      description: t("description", {
        defaultValue:
          "Edit up to 4 uploaded images with GPT-Image 2 for Chinese poster cleanup, document-style layouts, photoreal retouching, and interface mockup transformations.",
      }),
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GptImage2ImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations(
    "landing.gpt-image-2-image-to-image.page",
  );
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    'GPT-Image 2 image editing is especially strong when you need to revise text-heavy visuals, reshape document-like layouts, retouch photoreal scenes, or transform UI-style screenshots. You can upload up to 4 source images, describe the change in plain language, and keep the result aligned with the right aspect ratio.<br/><br/>Need to generate from scratch instead? <a href="/text-to-image/gpt-image-2" class="text-primary underline">Try GPT-Image 2 Text to Image</a>.';

  const faqItems: FAQType["items"] = [
    {
      question: tPage("faq.q1.question", {
        defaultValue: "How many images can I upload?",
      }),
      answer: tPage("faq.q1.answer", {
        defaultValue:
          "This GPT-Image 2 image-to-image workflow supports up to 4 uploaded images in a single run.",
      }),
    },
    {
      question: tPage("faq.q2.question", {
        defaultValue: "What parameters are available?",
      }),
      answer: tPage("faq.q2.answer", {
        defaultValue:
          "The editor supports images, prompt, and aspect ratio. Aspect ratio includes 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 5:4, 4:5, 2:1, 1:2, 21:9, and 9:21.",
      }),
    },
    {
      question: tPage("faq.q3.question", {
        defaultValue: "What kinds of edits is GPT-Image 2 especially good at?",
      }),
      answer: tPage("faq.q3.answer", {
        defaultValue:
          "It is especially useful for Chinese poster edits, document-style layouts, photoreal retouching, and UI or screenshot transformations where text, structure, and realism all matter.",
      }),
    },
  ];

  const hero: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "GPT-Image 2 Image to Image",
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
      defaultValue: "Why GPT-Image 2 for image editing",
    }),
    description: tPage("features.description", {
      defaultValue:
        "A stronger editing workflow for text-aware layouts, photoreal refinements, and interface-style images.",
    }),
    items: [
      {
        title: tPage("features.references.title", {
          defaultValue: "Edit up to 4 images together",
        }),
        description: tPage("features.references.description", {
          defaultValue:
            "Upload a short batch of source images when you want one direction applied consistently across a poster set, campaign asset group, or UI mockup series.",
        }),
        icon: "ImageIcon",
      },
      {
        title: tPage("features.promptLed.title", {
          defaultValue: "Text-aware and layout-aware edits",
        }),
        description: tPage("features.promptLed.description", {
          defaultValue:
            "GPT-Image 2 is better suited to poster text, document structure, labels, and mixed visual layouts, making it useful for revision tasks that go beyond simple style swaps.",
        }),
        icon: "Sparkles",
      },
      {
        title: tPage("features.framing.title", {
          defaultValue: "Photoreal and UI-friendly output control",
        }),
        description: tPage("features.framing.description", {
          defaultValue:
            "Choose the final frame before generation so photo retouching, screenshot restyling, and composition changes land closer to the intended placement.",
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
      defaultValue:
        "Common questions about GPT-Image 2 image editing for posters, photoreal scenes, and UI screenshots.",
    }),
    items: faqItems,
  };

  const cta: CTAType = {
    id: "cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to edit with GPT-Image 2?",
    }),
    description: tPage("finalCTA.description", {
      defaultValue:
        "Upload your images, describe the revision in plain language, and turn posters, UI mockups, or photoreal scenes into cleaner final visuals.",
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
              defaultValue: "joymagic GPT-Image 2 Image to Image",
            }),
            description: tPage("schema.softwareDescription", {
              defaultValue:
                "Edit up to 4 uploaded images with GPT-Image 2 for Chinese poster refinement, photoreal retouching, and UI screenshot transformation.",
            }),
            url: "/image-to-image/gpt-image-2",
            locale,
            category: "MultimediaApplication",
            features: [
              tPage("schema.features.multiUpload", {
                defaultValue: "Upload up to 4 images",
              }),
              tPage("schema.features.promptEditing", {
                defaultValue: "Text-aware and layout-aware image editing",
              }),
              tPage("schema.features.aspectPresets", {
                defaultValue: "13 aspect ratio presets",
              }),
            ],
          }),
          generateHowToSchema({
            name: tPage("schema.howToName", {
              defaultValue:
                "How to edit posters, UI, and photoreal images with GPT-Image 2",
            }),
            description: tPage("schema.howToDescription", {
              defaultValue:
                "Upload images, describe the edits you want, choose an aspect ratio, and generate revised posters, photoreal scenes, or interface visuals with GPT-Image 2.",
            }),
            steps: [
              {
                name: tPage("schema.steps.upload.name", {
                  defaultValue: "Upload images",
                }),
                text: tPage("schema.steps.upload.text", {
                  defaultValue:
                    "Add up to 4 source images for the same poster edit, screenshot update, or photoreal retouching direction.",
                }),
              },
              {
                name: tPage("schema.steps.prompt.name", {
                  defaultValue: "Write the prompt",
                }),
                text: tPage("schema.steps.prompt.text", {
                  defaultValue:
                    "Describe what should change, what should stay, and whether the result should feel more realistic, cleaner, or more interface-like.",
                }),
              },
              {
                name: tPage("schema.steps.aspectRatio.name", {
                  defaultValue: "Choose aspect ratio and generate",
                }),
                text: tPage("schema.steps.aspectRatio.text", {
                  defaultValue:
                    "Pick the output frame that matches the final placement, then generate and review the edited results.",
                }),
              },
            ],
            totalTime: "PT20S",
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
                name: tPage("breadcrumb.imageToImage", {
                  defaultValue: "Image to Image",
                }),
                url: "/image-to-image",
              },
              {
                name: tPage("breadcrumb.model", {
                  defaultValue: "GPT-Image 2",
                }),
                url: "/image-to-image/gpt-image-2",
              },
            ],
            locale,
          ),
        ]}
      />

      <AiMediaPageLayout
        hero={hero}
        headerNavItems={headerNavItems}
        playgroundConfig={gptImage2ImageToImageConfig}
      >
        <Features features={features} className="bg-transparent py-16 md:py-24" />

        <section className="bg-transparent py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                {tPage("promptingTips.title", {
                  defaultValue: "How to get better GPT-Image 2 edits",
                })}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("promptingTips.specific.title", {
                      defaultValue: "Say what must change and what must stay",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("promptingTips.specific.description", {
                      defaultValue:
                        "For poster, document, and UI edits, be explicit about the text block, layout region, or visual element you want changed while keeping the rest intact.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("promptingTips.batch.title", {
                      defaultValue: "Keep one direction across the batch",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("promptingTips.batch.description", {
                      defaultValue:
                        "When uploading multiple images, use one clear instruction so the whole set stays in the same visual family and quality level.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("promptingTips.framing.title", {
                      defaultValue: "Choose the target ratio early",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("promptingTips.framing.description", {
                      defaultValue:
                        "Pick the final aspect ratio before generation so crop, spacing, and composition better match where the result will be used.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("promptingTips.details.title", {
                      defaultValue: "Call out realism or interface style",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("promptingTips.details.description", {
                      defaultValue:
                        "Mention whether you want photoreal retouching, film-like rendering, clean UI surfaces, or realistic screenshot behavior to steer the finish more precisely.",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                    {tPage("useCases.batchAssets.title", {
                      defaultValue: "Poster and layout revision",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.batchAssets.description", {
                      defaultValue:
                        "Refresh Chinese posters, cover art, or document-like designs while preserving the core structure and improving clarity, balance, or text-heavy sections.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.productRefresh.title", {
                      defaultValue: "Photoreal product and portrait retouching",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.productRefresh.description", {
                      defaultValue:
                        "Refine lighting, texture, background mood, and finishing quality for product shots, portraits, or street-style photography without rebuilding the whole scene.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.socialVariants.title", {
                      defaultValue: "UI and screenshot restyling",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.socialVariants.description", {
                      defaultValue:
                        "Transform finance apps, desktop layouts, dashboards, and software screenshots into cleaner, sharper, or more cinematic interface visuals.",
                    })}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <h3 className="mb-3 font-semibold">
                    {tPage("useCases.lookDev.title", {
                      defaultValue: "Small-batch creative alignment",
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tPage("useCases.lookDev.description", {
                      defaultValue:
                        "Use a single prompt across up to 4 images to test one creative direction on a short asset set before moving into final production.",
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
