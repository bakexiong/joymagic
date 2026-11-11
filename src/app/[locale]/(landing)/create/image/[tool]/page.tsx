import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/core/i18n/navigation";

import { locales } from "@/config/locale";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";
import { getUserInfo } from "@/shared/models/user";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "AI Image Creator Tool | joymagic",
  description:
    "Open a specific joymagic image creation tool inside the authenticated creator workspace.",
  canonicalUrl: "/create/image",
  noIndex: true,
});

export default async function CreateImageToolPage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}) {
  const { locale, tool } = await params;
  setRequestLocale(locale);

  const user = await getUserInfo();

  if (!user) {
    redirect({
      href: `/sign-in?callbackUrl=${encodeURIComponent(`/create/image/${tool}`)}`,
      locale,
    });
  }

  const t = await getTranslations("landing");
  const header = t.raw("header") as HeaderType;

  return (
    <CreateLayout
      navItems={header.nav?.items || []}
      category="Image"
      initialTool={tool}
    />
  );
}
