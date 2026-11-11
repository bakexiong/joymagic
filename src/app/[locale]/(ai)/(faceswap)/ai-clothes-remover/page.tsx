import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Hero } from "@/themes/default/blocks/hero";
import { AiClothesRemover } from "@/themes/default/blocks/ai-clothes-remover";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "AI Clothes Remover Online for Photo Editing | joymagic",
  description:
    "Use joymagic AI Clothes Remover to edit portraits and fashion images online with fast AI-powered image transformation workflows.",
  keywords:
    "AI clothes remover, AI photo editor, AI fashion editor, portrait image editor, online image editing",
  canonicalUrl: "/ai-clothes-remover",
});

export default async function AiClothesRemoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "joymagic AI Clothes Remover",
    description: "AI-powered clothes remover tool",
    url: "/ai-clothes-remover",
    locale,
    category: "MultimediaApplication",
    features: ["AI Clothes Removal", "Fast Processing", "High Quality Output"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Clothes Remover", url: "/ai-clothes-remover" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <Hero
        hero={t.raw("clothesRemover")}
        customModule={<AiClothesRemover />}
      />
    </>
  );
}
