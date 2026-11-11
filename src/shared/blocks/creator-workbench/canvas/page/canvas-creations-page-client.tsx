"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

type WorkbenchCreationRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  modelUrl?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  url: string;
  createdAt: string;
};

function mapCreationRecordToGeneratedItem(
  record: WorkbenchCreationRecord,
): GeneratedMediaItem {
  let parsedParams: Record<string, any> = {};

  if (record.params) {
    try {
      const result = JSON.parse(record.params);
      if (result && typeof result === "object" && !Array.isArray(result)) {
        parsedParams = result;
      }
    } catch {
      parsedParams = {};
    }
  }

  return {
    url: record.url,
    params: {
      ...parsedParams,
      creationRecordId: record.id,
    },
    aspectRatio:
      record.aspectRatio || String(parsedParams.aspectRatio || "1:1"),
    mediaKind:
      record.mediaType === "video" || record.mediaType === "audio"
        ? (record.mediaType as "video" | "audio")
        : "image",
    createdAt: record.createdAt,
    sceneId: record.sceneId || undefined,
    modelUrl: record.modelUrl || undefined,
    prompt: record.prompt || String(parsedParams.prompt || ""),
  };
}

export function CanvasCreationsPageClient({
  initialItems,
  pageSize,
  copy,
  onUseItem,
}: {
  initialItems: WorkbenchCreationRecord[];
  pageSize: number;
  copy: {
    emptyText: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  onUseItem?: (item: GeneratedMediaItem) => void;
}) {
  const [items, setItems] = useState(
    initialItems.map(mapCreationRecordToGeneratedItem),
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [pendingUseIndex, setPendingUseIndex] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);

  const handleDeleteByIndices = async (indices: number[]) => {
    const targets = indices
      .map((index) => ({
        index,
        id: items[index]?.params?.creationRecordId as string | undefined,
      }))
      .filter((target): target is { index: number; id: string } => Boolean(target.id));

    if (targets.length === 0) {
      toast.error("没有可删除的作品");
      return;
    }

    try {
      await Promise.all(
        targets.map((target) =>
          fetch(`/api/workbench/creations/${target.id}`, {
            method: "DELETE",
          }).then(async (response) => {
            const result = await response.json().catch(() => null);
            if (!response.ok || result?.code !== 0) {
              throw new Error(result?.message || "删除作品失败");
            }
          }),
        ),
      );

      setItems((prev) =>
        prev.filter((_, index) => !targets.some((target) => target.index === index)),
      );
      setSelectedIndices((prev) => {
        const removedIndexSet = new Set(targets.map((target) => target.index));
        return prev
          .filter((index) => !removedIndexSet.has(index))
          .map(
            (index) =>
              index -
              targets.filter((target) => target.index < index).length,
          );
      });
      toast.success(targets.length > 1 ? "作品已删除" : "作品已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除作品失败");
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(items.length),
      });
      const response = await fetch(`/api/workbench/creations?${params.toString()}`);
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "加载作品失败");
      }

      const nextItems = Array.isArray(result?.data?.items)
        ? (result.data.items as WorkbenchCreationRecord[]).map(
            mapCreationRecordToGeneratedItem,
          )
        : [];
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(Boolean(result?.data?.hasMore) && nextItems.length > 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载作品失败");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const pendingUseItem =
    pendingUseIndex !== null ? items[pendingUseIndex] : null;

  const handleRequestUseItem = (index: number) => {
    if (!onUseItem || !items[index]) return;
    setPendingUseIndex(index);
  };

  const handleConfirmUseItem = () => {
    if (!onUseItem || !pendingUseItem) return;
    onUseItem(pendingUseItem);
    setPendingUseIndex(null);
  };

  return (
    <>
      <GeneratedMediaPanel
        items={items}
        hideHeader
        gridDensity="compact"
        cardScale={18}
        selectedIndices={selectedIndices}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={() => void handleLoadMore()}
        onClearSelection={() => setSelectedIndices([])}
        onToggleSelectItem={(index) => {
          setSelectedIndices((prev) =>
            prev.includes(index)
              ? prev.filter((item) => item !== index)
              : [...prev, index].sort((a, b) => a - b),
          );
        }}
        onUseItem={
          onUseItem
            ? (index) => {
                handleRequestUseItem(index);
              }
            : undefined
        }
        onDeleteItem={(index) => void handleDeleteByIndices([index])}
        onDeleteItems={(indices) => void handleDeleteByIndices(indices)}
        emptyText={copy.emptyText}
        emptyStateTitle={copy.emptyTitle}
        emptyStateDescription={copy.emptyDescription}
        emptyStateChips={["Image", "Video", "Workflow"]}
      />

      <Dialog
        open={pendingUseIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingUseIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/10 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              添加到画布
            </DialogTitle>
            <DialogDescription className="text-white/45">
              确认后会基于这条作品在当前画布中创建一个新节点。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setPendingUseIndex(null)}
              className="rounded-[0.95rem] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmUseItem}
              className="inline-flex items-center justify-center rounded-[0.95rem] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              确认创建
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
