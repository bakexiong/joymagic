import { setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { FaceGeneratorPage } from "@/shared/blocks/face-generator/face-generator-page";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title:
    "AI Face Generator Online for Portraits, Avatars, and Characters | joymagic",
  description:
    "Generate AI faces, portraits, avatars, and character references online with joymagic using a fast browser-based face generator.",
  keywords:
    "AI face generator, AI portrait generator, avatar generator, character face generator, realistic AI faces",
  canonicalUrl: "/tools/face-generator",
});

export default async function FaceGeneratorRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FaceGeneratorPage />;
}
