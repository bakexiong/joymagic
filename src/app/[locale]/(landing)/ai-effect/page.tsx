import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { AiEffectsGalleryTabs } from "@/shared/blocks/ai-effect/ai-effects-gallery-tabs";
import { getImageEffectItems } from "@/shared/lib/image-effect-data";
import { getMetadata } from "@/shared/lib/seo";
import { getVideoEffectItems } from "@/shared/lib/video-effect-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "landing.ai-effect.metadata",
  canonicalUrl: "/ai-effect",
});

export default async function AiEffectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tAiEffect = await getTranslations("landing.ai-effect");
  const tImageEffects = await getTranslations("landing.image-effects");
  const tVideoEffects = await getTranslations("landing.video-effects");

  const imageItems = await getImageEffectItems(
    tImageEffects.raw("titles") as Record<string, string>,
  );
  const videoItems = await getVideoEffectItems(
    tVideoEffects.raw("titles") as Record<string, string>,
  );

  return (
    <AiEffectsGalleryTabs
      imageCtaLabel={tImageEffects("gallery.ctaLabel")}
      imageItems={imageItems}
      videoCtaLabel={tAiEffect("cta.video")}
      videoItems={videoItems}
    />
  );
}
