import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasPageShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-page-shell";
import { CanvasProjectBootstrap } from "@/shared/blocks/creator-workbench/canvas/page/canvas-project-bootstrap";
import { getSignUser } from "@/shared/models/user";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export default async function CreateCanvasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scene?: string; model?: string }>;
}) {
  const { locale } = await params;
  const { scene, model } = await searchParams;
  setRequestLocale(locale);
  const user = await getSignUser();

  const t = await getTranslations("landing");
  const tt = await getTranslations("ai.image");
  const header = t.raw("header") as HeaderType;

  if (user?.id) {
    return (
      <>
        <CanvasProjectBootstrap
          locale={locale}
          name={tt.raw("page.title") as string}
          entrySceneId={scene ?? undefined}
          entryModelUrl={model ?? undefined}
        />
        <CanvasPageShell
          navItems={header.nav?.items || []}
          userNav={header.user_nav}
          title={tt.raw("page.title") as string}
          initialScene={scene}
          initialModel={model}
        />
      </>
    );
  }

  return (
    <CanvasPageShell
      navItems={header.nav?.items || []}
      userNav={header.user_nav}
      title={tt.raw("page.title") as string}
      initialScene={scene}
      initialModel={model}
    />
  );
}
