import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Hero } from "@/themes/default/blocks/hero";
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
  title:
    "AI Audio Generator Online for Voice, Sound, and Creative Audio | joymagic",
  description:
    "Create AI audio online with joymagic for creative sound, voice, and multimedia projects using a fast browser-based generator.",
  keywords:
    "AI audio generator, text to audio AI, AI sound generator, online audio generator, creative AI audio",
  canonicalUrl: "/ai-audio-generator",
});

export default async function AiAudioGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tt = await getTranslations("demo.ai-audio-generator");

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "joymagic AI Audio Generator",
    description: tt.raw("description") as string,
    url: "/ai-audio-generator",
    locale,
    category: "MultimediaApplication",
    features: ["Text to Audio", "AI Audio Generation", "High Quality Output"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Audio Generator", url: "/ai-audio-generator" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <Hero
        hero={{
          title: tt.raw("title"),
          description: tt.raw("description"),
        }}
      />
    </>
  );
}
