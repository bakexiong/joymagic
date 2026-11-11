import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PERMISSIONS, requirePermission } from "@/core/rbac";
import { Header, Main, MainHeader } from "@/shared/blocks/dashboard";
import {
  type AffiliateSection,
  AffiliateSectionContent,
} from "@/shared/blocks/affiliate-admin";
import { Crumb, Search, Tab } from "@/shared/types/blocks/common";

const sections: AffiliateSection[] = [
  "overview",
  "affiliates",
  "applications",
  "commissions",
  "payouts",
  "settings",
];

function createTabs(
  t: (key: string) => string,
  active: AffiliateSection,
): Tab[] {
  return sections.map((section) => ({
    name: section,
    title: t(`tabs.${section}`),
    url: `/admin/affiliate/${section}`,
    is_active: section === active,
  }));
}

export default async function AffiliateSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; section: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale, section } = await params;
  const { q, status } = await searchParams;
  setRequestLocale(locale);

  if (!sections.includes(section as AffiliateSection)) {
    notFound();
  }

  await requirePermission({
    code: PERMISSIONS.AFFILIATE_READ,
    redirectUrl: "/admin/no-permission",
    locale,
  });

  const t = await getTranslations("admin.affiliate");
  const currentSection = section as AffiliateSection;

  const crumbs: Crumb[] = [
    { title: t("crumbs.admin"), url: "/admin" },
    { title: t("crumbs.module"), is_active: true },
  ];

  const searchBySection: Partial<Record<AffiliateSection, Search>> = {
    affiliates: {
      name: "q",
      placeholder: t("search.affiliates"),
      value: q,
      buttonTitle: t("search.button"),
    },
    applications: {
      name: "q",
      placeholder: t("search.affiliates"),
      value: q,
      buttonTitle: t("search.button"),
    },
    commissions: {
      name: "q",
      placeholder: t("search.commissions"),
      value: q,
      buttonTitle: t("search.button"),
    },
    payouts: {
      name: "q",
      placeholder: t("search.payouts"),
      value: q,
      buttonTitle: t("search.button"),
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title={t(`sections.${currentSection}.title`)}
          description={t(`sections.${currentSection}.description`)}
          tabs={createTabs(t, currentSection)}
          search={searchBySection[currentSection]}
        />
        <AffiliateSectionContent
          section={currentSection}
          query={q}
          status={status}
        />
      </Main>
    </>
  );
}
