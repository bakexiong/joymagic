import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { VideoEffectsWorkbench } from "@/shared/blocks/video-effect/video-effects-workbench";
import { getMetadata } from "@/shared/lib/seo";
import { getVideoEffectItems } from "@/shared/lib/video-effect-data";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "landing.video-effects.workspace.metadata",
  canonicalUrl: "/ai-effect/video",
});

export default async function VideoEffectsPage({
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
  const tVideoEffects = await getTranslations("landing.video-effects");
  const header = t.raw("header") as HeaderType;
  const items = await getVideoEffectItems(
    tVideoEffects.raw("titles") as Record<string, string>,
  );

  const selectedEffectSlug = Array.isArray(resolvedSearchParams.effect)
    ? resolvedSearchParams.effect[0]
    : resolvedSearchParams.effect;

  const effect =
    items.find((item) => item.slug === selectedEffectSlug) ?? items[0];

  return (
    <VideoEffectsWorkbench
      navItems={header.nav?.items || []}
      effect={effect}
      items={items}
    />
  );
}
