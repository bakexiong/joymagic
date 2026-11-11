import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { AiGirlGeneratePage } from "@/shared/blocks/ai-character/ai-girl-generate-page";
import { getMetadata } from "@/shared/lib/seo";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "AI Girl Generate | Barko Bear",
  description:
    "Generate an AI girl portrait from Character DNA and extra description with a dedicated secure route.",
  canonicalUrl: "/ai-girl/generate",
});

export default async function AiGirlGenerateRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const header = t.raw("header") as HeaderType;

  return <AiGirlGeneratePage navItems={header.nav?.items || []} />;
}
