import { redirect } from "@/core/i18n/navigation";

export default async function AiCharacterRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/ai-girl", locale });
}
