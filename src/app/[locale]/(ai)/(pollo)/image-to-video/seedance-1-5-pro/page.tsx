import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FeaturesList } from "@/themes/default/blocks/features-list";
import { FeaturesStep } from "@/themes/default/blocks/features-step";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { seedance15ProImageToVideoConfig } from "@/shared/blocks/desktop-playground";
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
import { Button } from "@/shared/components/ui/button";
import {
  CheckCircle2,
  Zap,
  Briefcase,
  Sparkles,
  Video,
  Sliders,
  Highlighter,
  Users,
  ShoppingBag,
  Palette,
  Wand2,
  Shield,
  ArrowRight,
  Crosshair,
  CreditCard,
  Languages,
  Smile,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { Link as I18nLink } from "@/core/i18n/navigation";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/image-to-video/seedance-1-5-pro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("landing.seedance-1-5-pro.metadata");

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}${CANONICAL_PATH}`
      : `${envConfigs.app_url}${CANONICAL_PATH}`;

  return {
    title: t("title", {
      defaultValue:
        "Seedance 1.5 Pro Image to Video - Animate Photos with Lip-Sync | Barko Bear",
    }),
    description: t("description", {
      defaultValue:
        "Turn photos into talking videos with Seedance 1.5 Pro. Upload portraits, add dialogue with accurate lip-sync in multiple languages. Character animation made easy.",
    }),
    keywords: t("keywords", {
      defaultValue:
        "seedance 1.5 pro, image to video, lip sync, talking avatar, character animation, photo animation, multilingual video, portrait to video",
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

export default async function ImageToVideoSeedance15ProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.seedance-1-5-pro.seedance15ProPage",
  );
  const tSeedance = await getTranslations("landing.seedance-1-5-pro");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroTitle = tSeedance("hero.h1", {
    defaultValue: "Seedance 1.5 Pro Image to Video",
  });
  const heroDescription =
    (tSeedance.raw("hero.description") as string) ||
    'Seedance 1.5 Pro turns your photos into talking videos with lip-sync. Upload a portrait, write dialogue—the character speaks with lip movements matching multiple languages including English, Chinese, Japanese, Korean, and Spanish. Try Seedance 1.5 Pro for free below!<br/><br/>No reference images? <a href="/text-to-video/seedance-1-5-pro" class="text-primary underline">Try Seedance 1.5 Pro Text to Video</a> to generate from scratch.';

  const heroData: HeroType = {
    id: "hero",
    title: heroTitle,
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
    title: tSeedance("sections.keyFeatures.h2", {
      defaultValue: "Key Features",
    }),
    description: "",
    items: [
      {
        title: tSeedance("sections.keyFeatures.portraitToVideo.title", {
          defaultValue: "Portrait-to-Video Lip-Sync",
        }),
        description: tSeedance(
          "sections.keyFeatures.portraitToVideo.description",
          {
            defaultValue:
              "Upload any portrait photo. Write dialogue. The character speaks with accurate lip movements matching the audio. Works with photos, illustrations, and stylized art—facial structure is analyzed and animated naturally.",
          },
        ),
        icon: "Video",
      },
      {
        title: tSeedance("sections.keyFeatures.multilingual.title", {
          defaultValue: "Multilingual Speech Animation",
        }),
        description: tSeedance(
          "sections.keyFeatures.multilingual.description",
          {
            defaultValue:
              "Lip movements adapt to the language you choose. Multiple languages supported, each with pronunciation-accurate mouth shapes. Regional dialects also handled naturally.",
          },
        ),
        icon: "Languages",
      },
      {
        title: tSeedance("sections.keyFeatures.expressive.title", {
          defaultValue: "Expressive Performance",
        }),
        description: tSeedance("sections.keyFeatures.expressive.description", {
          defaultValue:
            "More than just lip-sync. The model adds natural head movement, eye motion, and facial expressions that match the emotional tone of your dialogue. Characters feel alive, not robotic.",
        }),
        icon: "Smile",
      },
      {
        title: tSeedance("sections.keyFeatures.stylePreservation.title", {
          defaultValue: "Style Preservation",
        }),
        description: tSeedance(
          "sections.keyFeatures.stylePreservation.description",
          {
            defaultValue:
              "Your image's visual style is maintained. Upload a photo, get photorealistic animation. Upload anime art, get anime-style movement. The model adapts to your source material.",
          },
        ),
        icon: "Palette",
      },
    ],
  };

  // Use Cases
  const useCases = [
    {
      title: tSeedance("sections.useCases.talkingAvatars.title", {
        defaultValue: "Talking Avatars",
      }),
      description: tSeedance("sections.useCases.talkingAvatars.description", {
        defaultValue:
          "Turn profile photos into speaking representatives for customer service, tutorials, or announcements.",
      }),
      icon: "User",
    },
    {
      title: tSeedance("sections.useCases.characterAnimation.title", {
        defaultValue: "Character Animation",
      }),
      description: tSeedance(
        "sections.useCases.characterAnimation.description",
        {
          defaultValue:
            "Bring illustrated characters to life with dialogue. Perfect for animated stories and game content.",
        },
      ),
      icon: "Sparkles",
    },
    {
      title: tSeedance("sections.useCases.multilingualSpokespersons.title", {
        defaultValue: "Multilingual Spokespersons",
      }),
      description: tSeedance(
        "sections.useCases.multilingualSpokespersons.description",
        {
          defaultValue:
            "Same portrait speaks your message in multiple languages. Create localized content without reshoots.",
        },
      ),
      icon: "Languages",
    },
    {
      title: tSeedance("sections.useCases.memorialVideos.title", {
        defaultValue: "Memorial Videos",
      }),
      description: tSeedance("sections.useCases.memorialVideos.description", {
        defaultValue:
          "Animate photos with gentle movement and narration. Handle with care and respect.",
      }),
      icon: "ImageIcon",
    },
  ];

  // FAQ
  const faqItems = [
    {
      question: tSeedance("faq.whatIsImageToVideo.question", {
        defaultValue: "What is Image to Video?",
      }),
      answer: tSeedance("faq.whatIsImageToVideo.answer", {
        defaultValue:
          "Image to Video animates your uploaded photos with realistic movement and synchronized speech. The model analyzes facial structure and generates natural lip-sync matching your dialogue.",
      }),
    },
    {
      question: tSeedance("faq.whatImagesWorkBest.question", {
        defaultValue: "What kind of images work best?",
      }),
      answer: tSeedance("faq.whatImagesWorkBest.answer", {
        defaultValue:
          "Clear front-facing portraits with good lighting. Works with photos, illustrations, anime, and stylized art. Avoid heavy occlusion (sunglasses, masks) for best lip-sync.",
      }),
    },
    {
      question: tSeedance("faq.howAccurateLipSync.question", {
        defaultValue: "How accurate is the lip-sync?",
      }),
      answer: tSeedance("faq.howAccurateLipSync.answer", {
        defaultValue:
          "Seedance 1.5 Pro specializes in precise lip synchronization. Mouth shapes match pronunciation naturally across all supported languages without post-production fixes.",
      }),
    },
    {
      question: tSeedance("faq.animateMoreThanLips.question", {
        defaultValue: "Does it animate more than lips?",
      }),
      answer: tSeedance("faq.animateMoreThanLips.answer", {
        defaultValue:
          "Yes. The model adds natural head movement, eye motion, and facial expressions matching your dialogue's emotional tone.",
      }),
    },
    {
      question: tSeedance("faq.differentFromTextToVideo.question", {
        defaultValue: "How is this different from Text to Video?",
      }),
      answer: tSeedance("faq.differentFromTextToVideo.answer", {
        defaultValue:
          "Text to Video generates everything from scratch. Image to Video uses your uploaded portrait to control character appearance while animating it with lip-sync—useful when you need a specific face or style.",
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

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", { defaultValue: "Ready to Create?" }),
    description:
      tPage.raw("finalCTA.description") ||
      "Start creating talking videos from your photos today.",
    buttons: [
      {
        title: tPage("finalCTA.button", { defaultValue: "Try It Now" }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);
  const homeUrl = getAbsoluteUrl("/", locale);

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Seedance 1.5 Pro Image to Video",
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
    name: "How to Create Talking Videos with Seedance 1.5 Pro",
    description:
      "Turn photos into talking videos with accurate lip-sync using Seedance 1.5 Pro",
    steps: [
      {
        name: "Upload Portrait",
        text: "Upload a clear front-facing portrait photo",
      },
      {
        name: "Write Dialogue",
        text: "Enter the dialogue you want the character to speak",
      },
      {
        name: "Select Language",
        text: "Choose the language for accurate lip-sync",
      },
      { name: "Generate", text: "Click generate to create your talking video" },
      { name: "Download", text: "Download your animated video with lip-sync" },
    ],
    totalTime: "PT30S",
  });

  const faqSchema = generateFAQSchema(faqItems);

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Image to Video", url: "/image-to-video" },
      { name: "Seedance 1.5 Pro", url: CANONICAL_PATH },
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
        playgroundConfig={seedance15ProImageToVideoConfig}
      >
        {/* Key Features - Learn More Section */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Use Cases */}
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
                    const IconComponent =
                      useCase.icon === "User"
                        ? User
                        : useCase.icon === "Sparkles"
                          ? Sparkles
                          : useCase.icon === "Languages"
                            ? Languages
                            : ImageIcon;
                    return (
                      <div
                        key={index}
                        className="rounded-lg border bg-card p-6"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="size-5 text-primary" />
                          <h3 className="font-semibold">{useCase.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {useCase.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24 bg-muted/30" />
      </AiMediaPageLayout>
    </>
  );
}
