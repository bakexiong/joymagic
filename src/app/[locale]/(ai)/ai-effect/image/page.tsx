import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { ImageEffectsWorkbench } from "@/shared/blocks/image-effect/image-effects-workbench";
import { getImageEffectItems } from "@/shared/lib/image-effect-data";
import { getMetadata } from "@/shared/lib/seo";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "landing.image-effects.workspace.metadata",
  canonicalUrl: "/ai-effect/image",
});

export default async function ImageEffectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ effect?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tImageEffects = await getTranslations("landing.image-effects");
  const header = t.raw("header") as HeaderType;
  const items = await getImageEffectItems(
    tImageEffects.raw("titles") as Record<string, string>,
  );

  const selectedEffectSlug = Array.isArray(resolvedSearchParams.effect)
    ? resolvedSearchParams.effect[0]
    : resolvedSearchParams.effect;

  const effect =
    items.find((item) => item.slug === selectedEffectSlug) ?? items[0];

  return (
    <ImageEffectsWorkbench
      navItems={header.nav?.items || []}
      effect={effect}
      items={items}
    />
  );
}
