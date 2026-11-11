import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasPageShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-page-shell";
import { getSignUser } from "@/shared/models/user";
import { getWorkbenchCanvasProjectById } from "@/shared/models/workbench-canvas-project";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export default async function CanvasProjectPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/${projectId}`)}`,
    );
  }

  const t = await getTranslations("landing");
  const tt = await getTranslations("ai.image");
  const header = t.raw("header") as HeaderType;
  const result = await getWorkbenchCanvasProjectById(projectId, user.id);

  if (!result) {
    notFound();
  }

  return (
    <CanvasPageShell
      navItems={header.nav?.items || []}
      userNav={header.user_nav}
      title={tt.raw("page.title") as string}
      projectId={result.project.id}
      projectName={result.project.name}
      initialGraph={result.snapshot?.graph}
      initialSnapshotVersion={result.snapshot?.version ?? null}
      initialScene={result.project.entrySceneId ?? undefined}
      initialModel={result.project.entryModelUrl ?? undefined}
    />
  );
}
