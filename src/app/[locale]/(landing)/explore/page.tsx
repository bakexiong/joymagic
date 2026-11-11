import { setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";

import { ExploreClient } from "./explore-client";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "Explore AI Image and Video Examples, Prompts, and Styles | Barko Bear",
  description:
    "Browse Barko Bear AI image and video examples by scene, style, model, and prompt. Recreate product photos, portraits, ads, and short-form visuals faster.",
  keywords:
    "AI image examples, AI video examples, AI prompts gallery, AI style gallery, product photo prompts, AI creative inspiration",
  canonicalUrl: "/explore",
});

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const collectionSchema = generateCollectionPageSchema({
    name: "AI Image and Video Inspiration Gallery",
    description:
      "A curated gallery of AI image and video examples, prompts, styles, models, and scenes for creative inspiration.",
    url: "/explore",
    locale,
  });
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Explore", url: "/explore" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />
      <ExploreClient />
    </>
  );
}
