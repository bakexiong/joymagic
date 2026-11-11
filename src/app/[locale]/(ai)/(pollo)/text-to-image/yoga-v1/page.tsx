import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/core/i18n/navigation";

import { locales } from "@/config/locale";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600; // ISR: revalidate every hour

export const generateMetadata = getMetadata({
  canonicalUrl: "/text-to-image/z-image-turbo",
});

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/text-to-image/z-image-turbo", locale });
}
