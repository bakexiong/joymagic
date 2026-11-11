import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PERMISSIONS, requirePermission } from "@/core/rbac";
import { AffiliateAttributionDetailsContent } from "@/shared/blocks/affiliate-admin";
import { Header, Main, MainHeader } from "@/shared/blocks/dashboard";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  getAffiliateProfileAttributionDetails,
  getAffiliateProfileById,
} from "@/shared/models/affiliate";
import { Crumb } from "@/shared/types/blocks/common";

export default async function AffiliateProfileDetailPage({
  params,
}: {
  params: Promise<{ locale: string; profileId: string }>;
}) {
  const { locale, profileId } = await params;
  setRequestLocale(locale);

  await requirePermission({
    code: PERMISSIONS.AFFILIATE_READ,
    redirectUrl: "/admin/no-permission",
    locale,
  });

  const t = await getTranslations("admin.affiliate");
  const [profile, details] = await Promise.all([
    getAffiliateProfileById(profileId),
    getAffiliateProfileAttributionDetails(profileId).catch(() => null),
  ]);

  if (!profile || !details) {
    notFound();
  }

  const crumbs: Crumb[] = [
    { title: t("crumbs.admin"), url: "/admin" },
    { title: t("crumbs.module"), url: "/admin/affiliate/affiliates" },
    {
      title: profile.user?.email || profile.user?.name || profile.code,
      is_active: true,
    },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title={profile.user?.name || profile.user?.email || profile.code}
          description={`推广码 ${profile.code} 的注册用户与订单转化明细`}
        />

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 shadow-none">
            <CardContent className="space-y-1 pt-6">
              <div className="text-sm text-muted-foreground">推广码</div>
              <div className="font-mono text-base font-semibold">
                {profile.code}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-none">
            <CardContent className="space-y-1 pt-6">
              <div className="text-sm text-muted-foreground">注册用户</div>
              <div className="text-2xl font-semibold">
                {details.registrations.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-none">
            <CardContent className="space-y-1 pt-6">
              <div className="text-sm text-muted-foreground">订单转化</div>
              <div className="text-2xl font-semibold">
                {details.conversions.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-none">
            <CardContent className="space-y-1 pt-6">
              <div className="text-sm text-muted-foreground">状态</div>
              <div className="text-base font-semibold capitalize">
                {profile.status}
              </div>
            </CardContent>
          </Card>
        </div>

        <AffiliateAttributionDetailsContent
          details={details}
          detailsLoading={false}
          locale={locale}
        />
      </Main>
    </>
  );
}
