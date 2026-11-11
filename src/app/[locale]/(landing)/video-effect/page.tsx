import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { getMetadata } from "@/shared/lib/seo";
import { VideoEffectGallery } from "@/shared/blocks/video-effect/video-effect-gallery";
import { getVideoEffectItems } from "@/shared/lib/video-effect-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "Video Effects | joymagic",
  description:
    "Browse trending video effects in a masonry gallery and jump into video creation with one click.",
  canonicalUrl: "/video-effect",
});

export default async function VideoEffectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.video-effects");
  const items = await getVideoEffectItems(
    t.raw("titles") as Record<string, string>,
  );

  const copy = locale.startsWith("zh")
    ? {
        ctaLabel: "Create Similar Video",
      }
    : {
        ctaLabel: "Create Similar Video",
      };

  return (
    <VideoEffectGallery
      ctaLabel={copy.ctaLabel}
      items={items}
    />
  );
}
