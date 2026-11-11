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

const DEFAULT_IMAGE_TOOL = "z-image-turbo";

export const generateMetadata = getMetadata({
  title:
    "AI Image Creator Workspace for Product Photos, Ads, Portraits | Barko Bear",
  description:
    "Open the Barko Bear AI image creator to generate product photos, ad creatives, portraits, image edits, and reusable visual concepts from one scene-based workspace.",
  keywords:
    "AI image creator, AI product photo generator, AI ad creative generator, AI portrait generator, AI image editor",
  canonicalUrl: "/create/image",
});

export default async function CreateImagePage({
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
    name: "Barko Bear AI Image Creator Workspace",
    description:
      "Scene-based AI image creator for product photos, ad creatives, portraits, image edits, and reusable visual concepts.",
    url: "/create/image",
    locale,
    category: "MultimediaApplication",
    features: [
      "AI image generation",
      "Product photo creation",
      "Image editing workflow",
      "Portrait and ad creative generation",
    ],
  });
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Image Creator", url: "/create/image" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <CreateLayout
        navItems={header.nav?.items || []}
        category="Image"
        initialTool={tool || DEFAULT_IMAGE_TOOL}
        variant="scene-browser"
      />
    </>
  );
}
