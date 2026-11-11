"use client";

import { useState } from "react";
import { toast } from "sonner";

import { UploadsMediaGrid } from "@/shared/blocks/desktop-playground/components/uploads-media-grid";

type WorkbenchUploadRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  url: string;
  mimeType?: string | null;
  createdAt: string;
};

function mapUploadRecordToGridItem(record: WorkbenchUploadRecord) {
  const normalizedType = record.mediaType === "video" || record.mediaType === "audio"
    ? record.mediaType
    : "image";

  return {
    id: record.id,
    type: normalizedType as "image" | "video" | "audio",
    src: record.url,
    alt: record.filename,
    model: record.modelLabel || record.sceneLabel || record.filename,
    prompt: record.filename,
    sceneKey: record.sceneLabel || record.sceneId || undefined,
    modelKey: record.modelUrl || undefined,
    parameters: {
      filename: record.filename,
      mimeType: record.mimeType,
      createdAt: record.createdAt,
    },
  };
}

export function CanvasUploadsPageClient({
  initialItems,
  pageSize,
  copy,
}: {
  initialItems: WorkbenchUploadRecord[];
  pageSize: number;
  copy: {
    emptyTitle: string;
    emptyDescription: string;
    emptyChips: string[];
  };
}) {
  const [items, setItems] = useState(
    initialItems.map(mapUploadRecordToGridItem),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(items.length),
      });
      const response = await fetch(`/api/workbench/uploads?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "加载上传素材失败");
      }

      const nextItems = Array.isArray(result?.data?.items)
        ? (result.data.items as WorkbenchUploadRecord[]).map(
            mapUploadRecordToGridItem,
          )
        : [];

      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(Boolean(result?.data?.hasMore) && nextItems.length > 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "加载上传素材失败",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <UploadsMediaGrid
      items={items}
      isLoading={false}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={() => void handleLoadMore()}
      emptyTitle={copy.emptyTitle}
      emptyDescription={copy.emptyDescription}
      emptyChips={copy.emptyChips}
      cardScale={18}
    />
  );
}
