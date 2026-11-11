import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasCollectionsPageClient } from "@/shared/blocks/creator-workbench/canvas/page/canvas-collections-page-client";
import { CanvasSectionShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-section-shell";
import { getSignUser } from "@/shared/models/user";
import { listWorkbenchCollections } from "@/shared/models/workbench-collection";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 0;

export default async function CanvasCollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/collections`)}`,
    );
  }

  const items = await listWorkbenchCollections(user.id);
  const tWorkspace = await getTranslations("landing.canvasWorkspace");

  return (
    <CanvasSectionShell
      eyebrow={tWorkspace("page.collectionsEyebrow")}
      title={tWorkspace("page.collectionsTitle")}
      description={tWorkspace("page.collectionsDescription")}
    >
      <CanvasCollectionsPageClient
        initialItems={items.map((item) => ({
          id: item.id,
          name: item.name,
          assetCount: Number(item.assetCount ?? 0),
          coverUrl: item.coverUrl ?? null,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : String(item.createdAt),
          updatedAt:
            item.updatedAt instanceof Date
              ? item.updatedAt.toISOString()
              : String(item.updatedAt),
        }))}
        text={{
          heading: tWorkspace("collectionsGrid.heading"),
          createCardLabel: tWorkspace("collectionsGrid.createCardLabel"),
          createTitle: tWorkspace("collectionsGrid.createTitle"),
          createDescription: tWorkspace("collectionsGrid.createDescription"),
          renameTitle: tWorkspace("collectionsGrid.renameTitle"),
          renameDescription: tWorkspace("collectionsGrid.renameDescription"),
          deleteTitle: tWorkspace("collectionsGrid.deleteTitle"),
          deleteDescription: tWorkspace("collectionsGrid.deleteDescription"),
          renameAction: tWorkspace("collectionsGrid.renameAction"),
          deleteAction: tWorkspace("collectionsGrid.deleteAction"),
          createAction: tWorkspace("collectionsGrid.createAction"),
          cancelAction: tWorkspace("collectionsGrid.cancelAction"),
          nameLabel: tWorkspace("collectionsGrid.nameLabel"),
          namePlaceholder: tWorkspace("collectionsGrid.namePlaceholder"),
          emptyTitle: tWorkspace("collectionsGrid.emptyTitle"),
          emptyDescription: tWorkspace("collectionsGrid.emptyDescription"),
          createSuccess: tWorkspace("collectionsGrid.createSuccess"),
          renameSuccess: tWorkspace("collectionsGrid.renameSuccess"),
          deleteSuccess: tWorkspace("collectionsGrid.deleteSuccess"),
          createError: tWorkspace("collectionsGrid.createError"),
          renameError: tWorkspace("collectionsGrid.renameError"),
          deleteError: tWorkspace("collectionsGrid.deleteError"),
        }}
        detailCopy={{
          back: tWorkspace("page.collectionDetailBack"),
          description: tWorkspace("page.collectionDetailDescription"),
          emptyText: tWorkspace("page.collectionDetailEmptyText"),
          emptyTitle: tWorkspace("page.collectionDetailEmptyTitle"),
          emptyDescription: tWorkspace("page.collectionDetailEmptyDescription"),
        }}
      />
    </CanvasSectionShell>
  );
}
