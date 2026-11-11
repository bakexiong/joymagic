import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasSectionShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-section-shell";
import { CanvasUploadsPageClient } from "@/shared/blocks/creator-workbench/canvas/page/canvas-uploads-page-client";
import { getSignUser } from "@/shared/models/user";
import { listWorkbenchUploads } from "@/shared/models/workbench-upload";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 0;

const PAGE_SIZE = 30;

function getUploadsCopy(locale: string) {
  if (locale.startsWith("zh")) {
    return {
      eyebrow: "ASSETS",
      title: "Uploads",
      description: "这里集中展示你上传过的参考图、视频和音频素材，方便继续复用到新的工作流里。",
      emptyTitle: "还没有任何上传素材",
      emptyDescription: "上传过的参考素材会出现在这里，方便你随时回看和继续使用。",
      emptyChips: ["图片", "视频", "音频"],
    };
  }

  return {
    eyebrow: "ASSETS",
    title: "Uploads",
    description:
      "All of your uploaded reference images, videos, and audio live here so they are easy to reuse in future workflows.",
    emptyTitle: "No uploads yet",
    emptyDescription:
      "Uploaded reference assets will appear here so you can quickly reuse them later.",
    emptyChips: ["Image", "Video", "Audio"],
  };
}

export default async function CanvasUploadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/uploads`)}`,
    );
  }

  const items = await listWorkbenchUploads({
    userId: user.id,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const copy = getUploadsCopy(locale);

  return (
    <CanvasSectionShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      <CanvasUploadsPageClient
        initialItems={items.map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          sceneId: item.sceneId,
          sceneLabel: item.sceneLabel,
          modelUrl: item.modelUrl,
          modelLabel: item.modelLabel,
          filename: item.filename,
          url: item.url,
          mimeType: item.mimeType,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : String(item.createdAt),
        }))}
        pageSize={PAGE_SIZE}
        copy={{
          emptyTitle: copy.emptyTitle,
          emptyDescription: copy.emptyDescription,
          emptyChips: copy.emptyChips,
        }}
      />
    </CanvasSectionShell>
  );
}
