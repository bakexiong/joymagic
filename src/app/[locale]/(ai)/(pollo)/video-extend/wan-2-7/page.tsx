import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/core/i18n/navigation";
import { locales } from "@/config/locale";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export default async function Wan27VideoExtendPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  redirect({
    href: "/creator?scene=%2Fvideo-extend%2Fwan-2-7&model=wan-2-7",
    locale,
  });
}
