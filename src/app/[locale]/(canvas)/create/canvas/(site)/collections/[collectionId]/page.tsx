import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasCollectionDetailPageClient } from "@/shared/blocks/creator-workbench/canvas/page/canvas-collection-detail-page-client";
import { CanvasSectionShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-section-shell";
import { getSignUser } from "@/shared/models/user";
import { listWorkbenchCollectionCreations } from "@/shared/models/workbench-collection-creation";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 0;

const PAGE_SIZE = 30;

export default async function CanvasCollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; collectionId: string }>;
}) {
  const { locale, collectionId } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/collections/${collectionId}`)}`,
    );
  }

  let result;
  try {
    result = await listWorkbenchCollectionCreations({
      userId: user.id,
      collectionId,
      limit: PAGE_SIZE,
      offset: 0,
    });
  } catch {
    notFound();
  }
  const tWorkspace = await getTranslations("landing.canvasWorkspace");

  return (
    <CanvasSectionShell
      eyebrow={tWorkspace("page.collectionsEyebrow")}
      title={result.collection.name}
      description={tWorkspace("page.collectionDetailDescription")}
    >
      <CanvasCollectionDetailPageClient
        collectionId={collectionId}
        collectionName={result.collection.name}
        initialItems={result.items.map((item) => ({
          ...item,
          createdAt: item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : String(item.createdAt),
        }))}
        pageSize={PAGE_SIZE}
        copy={{
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
