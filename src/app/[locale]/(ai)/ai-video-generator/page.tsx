import { setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { redirect } from "@/core/i18n/navigation";
import { DEFAULT_TEXT_TO_VIDEO_MODEL_URL } from "@/shared/lib/video-model-defaults";
import { getMetadata } from "@/shared/lib/seo";
import { getUserInfo } from "@/shared/models/user";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "ai.video.metadata",
  canonicalUrl: "/ai-video-generator",
});

export default async function AiVideoGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUserInfo();

  if (user) {
    redirect({
      href: "/creator?scene=text-to-video&model=seedance-1-5-pro",
      locale,
    });
  }

  redirect({ href: DEFAULT_TEXT_TO_VIDEO_MODEL_URL, locale });
}
