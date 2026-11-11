import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasCreationsPageClient } from "@/shared/blocks/creator-workbench/canvas/page/canvas-creations-page-client";
import { CanvasSectionShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-section-shell";
import { getSignUser } from "@/shared/models/user";
import { listWorkbenchCreations } from "@/shared/models/workbench-creation";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 0;

const PAGE_SIZE = 30;

export default async function CanvasCreationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/creations`)}`,
    );
  }

  const items = await listWorkbenchCreations({
    userId: user.id,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const tWorkspace = await getTranslations("landing.canvasWorkspace");

  return (
    <CanvasSectionShell
      eyebrow={tWorkspace("page.creationsEyebrow")}
      title={tWorkspace("page.creationsTitle")}
      description={tWorkspace("page.creationsDescription")}
    >
      <CanvasCreationsPageClient
        initialItems={items.map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          sceneId: item.sceneId,
          modelUrl: item.modelUrl,
          prompt: item.prompt,
          params: item.params,
          aspectRatio: item.aspectRatio,
          url: item.url,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : String(item.createdAt),
        }))}
        pageSize={PAGE_SIZE}
        copy={{
          emptyText: tWorkspace("page.creationsEmptyText"),
          emptyTitle: tWorkspace("page.creationsEmptyTitle"),
          emptyDescription: tWorkspace("page.creationsEmptyDescription"),
        }}
      />
    </CanvasSectionShell>
  );
}
