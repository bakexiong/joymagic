import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { AiCharacterPage } from "@/shared/blocks/ai-character/ai-character-page";
import { getMetadata } from "@/shared/lib/seo";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "AI Girlfriend Studio | Barko Bear",
  description:
    "A stripped-back AI girlfriend workspace focused on form controls and generation preview.",
  canonicalUrl: "/ai-girl",
});

export default async function AiGirlRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const header = t.raw("header") as HeaderType;

  return <AiCharacterPage navItems={header.nav?.items || []} />;
}
