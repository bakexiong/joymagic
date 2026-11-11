import { CompanyPage } from "@/shared/blocks/company/company-page";
import { getCompanyPage } from "@/shared/lib/company-pages";
import { normalizeSiteText } from "@/shared/lib/site-identity";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getThemePage } from "@/core/theme";
import { envConfigs } from "@/config";
import { getLocalPage } from "@/shared/models/post";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const t = await getTranslations("common.metadata");

  const { locale, slug } = await params;

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/${slug}`
      : `${envConfigs.app_url}/${slug}`;

  const companyPage = getCompanyPage(slug, locale);
  if (companyPage)
    return {
      title: `${companyPage.title} | Barko Bear`,
      description: companyPage.description,
      alternates: { canonical: canonicalUrl },
    };

  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return {
      title: `${slug} | ${t("title")}`,
      description: t("description"),
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `${page.title} | ${t("title")}`,
    description: normalizeSiteText(page.description || ""),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Get the page from pagesSource
  const companyPage = getCompanyPage(slug, locale);
  if (companyPage) return <CompanyPage page={companyPage} />;

  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return notFound();
  }

  const Page = await getThemePage("page-detail");

  return <Page locale={locale} post={page} />;
}
