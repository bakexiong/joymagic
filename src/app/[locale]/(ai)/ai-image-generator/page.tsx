import { setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { redirect } from "@/core/i18n/navigation";
import { getMetadata } from "@/shared/lib/seo";
import { getUserInfo } from "@/shared/models/user";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "ai.image.metadata",
  canonicalUrl: "/ai-image-generator",
});

export default async function AiImageGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUserInfo();

  if (user) {
    redirect({
      href: "/creator?scene=text-to-image",
      locale,
    });
  }

  redirect({ href: "/text-to-image/gpt-image-2", locale });
}
