import { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAdminAccess } from "@/core/rbac/permission";
import { LocaleDetector } from "@/shared/blocks/common";
import { DashboardLayout } from "@/shared/blocks/dashboard/layout";
import { getSignUser } from "@/shared/models/user";
import { filterSidebarByPermission } from "@/shared/lib/filter-sidebar-by-permission";
import { getUserPermissions } from "@/shared/services/rbac";
import { Sidebar as SidebarType } from "@/shared/types/blocks/dashboard";

/**
 * Admin layout to manage datas
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has admin access permission
  await requireAdminAccess({
    redirectUrl: `/no-permission`,
    locale: locale || "",
  });

  const t = await getTranslations("admin");

  const sidebar: SidebarType = t.raw("sidebar");
  const user = await getSignUser();
  const permissionCodes = user
    ? (await getUserPermissions(user.id)).map((item) => item.code)
    : [];
  const filteredSidebar = filterSidebarByPermission(sidebar, permissionCodes);

  return (
    <DashboardLayout sidebar={filteredSidebar}>
      <LocaleDetector />
      {children}
    </DashboardLayout>
  );
}
