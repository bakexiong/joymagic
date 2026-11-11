import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { seedance20ImageToVideoConfig } from "@/shared/blocks/desktop-playground";
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
import { Sparkles, Languages, Smile, Palette, User, Image as ImageIcon } from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/image-to-video/seedance-2-0";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.seedance-2-0.metadata");

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  return {
    title: t("title", {
      defaultValue:
        "Seedance 2.0 Image to Video - Animate Photos with Lip-Sync | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Turn photos into talking videos with Seedance 2.0. Upload portraits, add dialogue with accurate lip-sync in multiple languages.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "seedance 2.0, image to video, lip sync, talking avatar, character animation, photo animation",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

function canonicalizeUrl(url: string) {
  if (url !== `${BASE_URL}/` && url.endsWith("/")) {
    return url.replace(/\/$/, "");
  }
  return url;
}

function getAbsoluteUrl(path: string, locale: string) {
  const localePrefix = locale && locale !== defaultLocale ? `/${locale}` : "";
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return canonicalizeUrl(`${BASE_URL}${localePrefix}${safePath}`);
}

export default async function ImageToVideoSeedance20Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tSeedance = await getTranslations("landing.seedance-2-0");
  const tHeader = await getTranslations("landing.header");

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroDescription =
    (tSeedance.raw("hero.description") as string) ||
    'Seedance 2.0 turns your photos into talking videos with lip-sync. Upload a portrait, write dialogue. <br/><br/>No reference images? <a href="/text-to-video/seedance-2-0" class="text-primary underline">Try Seedance 2.0 Text to Video</a>.';

  const heroData: HeroType = {
    id: "hero",
    title: tSeedance("hero.h1", {
      defaultValue: "Seedance 2.0 Image to Video",
    }),
    description: heroDescription,
    buttons: [
      {
        title: "Try Now",
        url: "#playground",
        variant: "default",
      },
      {
        title: "View Pricing",
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tSeedance("sections.keyFeatures.h2", {
      defaultValue: "Key Features",
    }),
    description: "",
    items: [
      {
        title: tSeedance("sections.keyFeatures.portraitToVideo.title", {
          defaultValue: "Portrait-to-Video Lip-Sync",
        }),
        description: tSeedance("sections.keyFeatures.portraitToVideo.description", {
          defaultValue:
            "Upload portraits and animate them into speaking videos with natural lip-sync.",
        }),
        icon: "Video",
      },
      {
        title: tSeedance("sections.keyFeatures.multilingual.title", {
          defaultValue: "Multilingual Speech Animation",
        }),
        description: tSeedance("sections.keyFeatures.multilingual.description", {
          defaultValue:
            "Lip movements adapt to multiple languages with pronunciation-aware motion.",
        }),
        icon: "Languages",
      },
      {
        title: tSeedance("sections.keyFeatures.expressive.title", {
          defaultValue: "Expressive Performance",
        }),
        description: tSeedance("sections.keyFeatures.expressive.description", {
          defaultValue:
            "Beyond lips, add natural head and facial movement that matches tone.",
        }),
        icon: "Smile",
      },
      {
        title: tSeedance("sections.keyFeatures.stylePreservation.title", {
          defaultValue: "Style Preservation",
        }),
        description: tSeedance("sections.keyFeatures.stylePreservation.description", {
          defaultValue:
            "Keep the source image style while adding motion and dialogue animation.",
        }),
        icon: "Palette",
      },
    ],
  };

  const useCases = [
    {
      title: tSeedance("sections.useCases.talkingAvatars.title", {
        defaultValue: "Talking Avatars",
      }),
      description: tSeedance("sections.useCases.talkingAvatars.description", {
        defaultValue:
          "Turn profile photos into speaking representatives for support and education.",
      }),
      icon: User,
    },
    {
      title: tSeedance("sections.useCases.characterAnimation.title", {
        defaultValue: "Character Animation",
      }),
      description: tSeedance("sections.useCases.characterAnimation.description", {
        defaultValue: "Animate illustrated characters with dialogue and emotion.",
      }),
      icon: Sparkles,
    },
    {
      title: tSeedance("sections.useCases.multilingualSpokespersons.title", {
        defaultValue: "Multilingual Spokespersons",
      }),
      description: tSeedance("sections.useCases.multilingualSpokespersons.description", {
        defaultValue:
          "Use one portrait to generate localized videos in different languages.",
      }),
      icon: Languages,
    },
    {
      title: tSeedance("sections.useCases.memorialVideos.title", {
        defaultValue: "Memorial Videos",
      }),
      description: tSeedance("sections.useCases.memorialVideos.description", {
        defaultValue: "Create respectful animated memorial videos from old photos.",
      }),
      icon: ImageIcon,
    },
  ];

  const faqItems = [
    {
      question: tSeedance("faq.whatIsImageToVideo.question", {
        defaultValue: "What is Image to Video?",
      }),
      answer: tSeedance("faq.whatIsImageToVideo.answer", {
        defaultValue:
          "Image to Video animates uploaded photos into moving videos with synchronized dialogue.",
      }),
    },
    {
      question: tSeedance("faq.whatImagesWorkBest.question", {
        defaultValue: "What kind of images work best?",
      }),
      answer: tSeedance("faq.whatImagesWorkBest.answer", {
        defaultValue: "Clear front-facing portraits generally produce better lip-sync results.",
      }),
    },
    {
      question: tSeedance("faq.howAccurateLipSync.question", {
        defaultValue: "How accurate is the lip-sync?",
      }),
      answer: tSeedance("faq.howAccurateLipSync.answer", {
        defaultValue:
          "Seedance 2.0 supports natural mouth shapes and synchronized speech timing.",
      }),
    },
    {
      question: tSeedance("faq.animateMoreThanLips.question", {
        defaultValue: "Does it animate more than lips?",
      }),
      answer: tSeedance("faq.animateMoreThanLips.answer", {
        defaultValue:
          "Yes, it can add head movement, eye motion, and subtle facial expressions.",
      }),
    },
    {
      question: tSeedance("faq.differentFromTextToVideo.question", {
        defaultValue: "How is this different from Text to Video?",
      }),
      answer: tSeedance("faq.differentFromTextToVideo.answer", {
        defaultValue:
          "Image to Video keeps character identity from uploaded photos while adding motion and dialogue.",
      }),
    },
  ];

  const faqData: FAQType = {
    id: "faq",
    title: tSeedance("faq.h2", { defaultValue: "Frequently Asked Questions" }),
    description: "",
    items: faqItems.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: "Ready to Animate Your Photo?",
    description: "Start creating talking videos with Seedance 2.0.",
    buttons: [
      {
        title: "Try It Now",
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Seedance 2.0 Image to Video",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "Portrait-to-Video Lip-Sync",
      "Multilingual Speech Animation",
      "Expressive Performance",
      "Style Preservation",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Create Talking Videos with Seedance 2.0",
    description: "Animate portraits into speaking videos with Seedance 2.0",
    steps: [
      { name: "Upload first frame", text: "Upload a clear portrait image." },
      {
        name: "Upload frames",
        text: "Upload a first frame image. If you also upload a last frame, the transition mode is detected automatically.",
      },
      { name: "Enter prompt", text: "Describe motion and dialogue for the clip." },
      { name: "Generate", text: "Generate and download your output video." },
    ],
    totalTime: "PT30S",
  });

  const faqSchema = generateFAQSchema(faqItems);
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Image to Video", url: "/image-to-video" },
      { name: "Seedance 2.0", url: CANONICAL_PATH },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]} />

      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={seedance20ImageToVideoConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tSeedance("sections.useCases.h2", {
                    defaultValue: "Use Cases",
                  })}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                  {useCases.map((useCase, index) => {
                    const IconComponent = useCase.icon;
                    return (
                      <div key={index} className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="size-5 text-primary" />
                          <h3 className="font-semibold">{useCase.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{useCase.description}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="py-16 md:py-24" />
        <CTA cta={finalCTA} className="py-16 md:py-24 bg-muted/30" />
      </AiMediaPageLayout>
    </>
  );
}
