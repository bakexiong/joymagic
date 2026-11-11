import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CTA } from "@/themes/default/blocks/cta";
import { FAQ } from "@/themes/default/blocks/faq";
import { Features } from "@/themes/default/blocks/features";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { happyhorse10ImageToVideoConfig } from "@/shared/blocks/desktop-playground";
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from "@/shared/types/blocks/landing";
import { getMetadata } from "@/shared/lib/seo";

const CANONICAL_PATH = "/image-to-video/happyhorse-1-0";

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
  const t = await getTranslations("landing.happyhorse-1-0.imageToVideo.metadata");

  return getMetadata({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    canonicalUrl: CANONICAL_PATH,
  })({ params: Promise.resolve({ locale }) });
}

export default async function HappyHorseImageToVideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing.happyhorse-1-0.imageToVideo");
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as { items?: any[] } | null;

  const hero: HeroType = {
    id: "hero",
    title: t("hero.title"),
    description: t.raw("hero.description") as string,
    buttons: [
      { title: t("hero.button1"), url: "#playground", variant: "default" },
      { title: t("hero.button2"), url: "/pricing", variant: "outline" },
    ],
  };

  const features: FeaturesType = {
    id: "key-features",
    title: t("keyFeatures.title"),
    description: "",
    items: [
      {
        title: t("keyFeatures.singleImageMotion.title"),
        description: t("keyFeatures.singleImageMotion.description"),
        icon: "ImageIcon",
      },
      {
        title: t("keyFeatures.fastFiveSecond.title"),
        description: t("keyFeatures.fastFiveSecond.description"),
        icon: "TimerReset",
      },
      {
        title: t("keyFeatures.cleanOutput.title"),
        description: t("keyFeatures.cleanOutput.description"),
        icon: "Film",
      },
      {
        title: t("keyFeatures.simpleWorkflow.title"),
        description: t("keyFeatures.simpleWorkflow.description"),
        icon: "Sparkles",
      },
    ],
  };

  const faq: FAQType = {
    id: "faq",
    title: t("faq.title"),
    description: "",
    items: [1, 2, 3, 4, 5].map((index) => ({
      question: t(`faq.q${index}.question`),
      answer: t(`faq.q${index}.answer`),
    })),
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: t("finalCTA.title"),
    description: t("finalCTA.description"),
    buttons: [
      { title: t("finalCTA.button"), url: "#playground", variant: "default" },
    ],
  };

  return (
    <AiMediaPageLayout
      hero={hero}
      headerNavItems={headerNav?.items || []}
      playgroundConfig={happyhorse10ImageToVideoConfig}
    >
      <Features
        features={features}
        className="py-16 md:py-24"
      />
      <FAQ faq={faq} className="py-16 md:py-24" />
      <CTA cta={finalCTA} className="pb-16 md:pb-24" />
    </AiMediaPageLayout>
  );
}
