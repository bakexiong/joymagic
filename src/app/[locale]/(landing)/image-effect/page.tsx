import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { ImageEffectGallery } from "@/shared/blocks/image-effect/image-effect-gallery";
import { getImageEffectItems } from "@/shared/lib/image-effect-data";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "landing.image-effects.gallery.metadata",
  canonicalUrl: "/image-effect",
});

export default async function ImageEffectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.image-effects");
  const items = await getImageEffectItems(
    t.raw("titles") as Record<string, string>,
  );

  return (
    <ImageEffectGallery
      ctaLabel={t("gallery.ctaLabel")}
      items={items}
    />
  );
}
