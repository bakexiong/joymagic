import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title:
    "AI Video Creator Workspace for Text to Video and Image to Video | Barko Bear",
  description:
    "Create AI videos from prompts or images, explore cinematic models, generate motion effects, and build short-form video scenes in Barko Bear.",
  keywords:
    "AI video creator, text to video generator, image to video AI, AI video effects, cinematic AI video generator",
  canonicalUrl: "/create/video",
});

export default async function CreateVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tool?: string }>;
}) {
  const { locale } = await params;
  const { tool } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const header = t.raw("header") as HeaderType;
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Barko Bear AI Video Creator Workspace",
    description:
      "Scene-based AI video creator for text-to-video, image-to-video, cinematic motion, and short-form video effects.",
    url: "/create/video",
    locale,
    category: "MultimediaApplication",
    features: [
      "Text to video generation",
      "Image to video animation",
      "AI video effects",
      "Cinematic short-form workflows",
    ],
  });
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Video Creator", url: "/create/video" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <CreateLayout
        navItems={header.nav?.items || []}
        category="Video"
        initialTool={tool}
        variant="scene-browser"
      />
    </>
  );
}
