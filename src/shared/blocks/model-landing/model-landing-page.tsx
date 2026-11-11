import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { defaultLocale, locales } from "@/config/locale";
import { ModelLandingTemplate } from "@/shared/blocks/model-landing/model-landing-template";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import {
  getModelLandingPageData,
  getModelLandingSlugs,
} from "@/shared/lib/model-landing-data";

type ModelLandingSearchParams = {
  scene?: string;
  model?: string;
  prompt?: string;
  params?: string;
  ref?: string;
  auto?: string;
};

export function generateModelLandingStaticParams() {
  return Promise.all(
    locales.map(async (locale) => {
      const slugs = await getModelLandingSlugs(locale);
      return slugs.map((slug) => ({ locale, slug }));
    }),
  ).then((items) => items.flat());
}

export async function generateModelLandingMetadata({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  if (!locales.includes(locale)) {
    return {};
  }

  const tModelPages = await getTranslations({
    locale,
    namespace: "landing.model-pages",
  });
  const data = await getModelLandingPageData(slug, locale, tModelPages);

  if (!data) {
    return {};
  }

  return {
    title: data.seoTitle,
    description: data.seoDescription,
    alternates: {
      canonical: `${envConfigs.app_url}${
        locale === defaultLocale ? "" : `/${locale}`
      }/model/${data.slug}`,
    },
  };
}

export async function ModelLandingPageServer({
  locale,
  slug,
  searchParams,
}: {
  locale: string;
  slug: string;
  searchParams: ModelLandingSearchParams;
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const { scene, model, prompt, params, ref, auto } = searchParams;

  setRequestLocale(locale);

  const tModelPages = await getTranslations({
    locale,
    namespace: "landing.model-pages",
  });
  const data = await getModelLandingPageData(slug, locale, tModelPages);

  if (!data) {
    notFound();
  }

  const tHeader = await getTranslations({
    locale,
    namespace: "landing.header",
  });
  const headerNav = tHeader.raw("nav") as { items?: any[] } | undefined;
  const softwareSchema = generateSoftwareApplicationSchema({
    name: data.title,
    description: data.seoDescription,
    url: `/model/${data.slug}`,
    locale,
    category: "MultimediaApplication",
    features: data.scenes
      .map((scene) => scene.modeLabel || scene.title)
      .filter(Boolean),
  });
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Models", url: "/" },
      { name: data.title, url: `/model/${data.slug}` },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <ModelLandingTemplate
        data={data}
        navItems={headerNav?.items || []}
        initialScene={scene}
        initialModel={model}
        initialPrompt={prompt}
        initialParams={params}
        initialRef={ref}
        initialAuto={auto === "1"}
      />
    </>
  );
}
