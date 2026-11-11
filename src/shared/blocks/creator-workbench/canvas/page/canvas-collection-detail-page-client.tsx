"use client";

import { useState } from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
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

type CollectionCreationRecord = {
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
  record: CollectionCreationRecord,
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

export function CanvasCollectionDetailPageClient({
  collectionId,
  collectionName,
  initialItems,
  pageSize,
  copy,
  onBack,
  onUseItem,
}: {
  collectionId: string;
  collectionName: string;
  initialItems: CollectionCreationRecord[];
  pageSize: number;
  copy: {
    back: string;
    description: string;
    emptyText: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  onBack?: () => void;
  onUseItem?: (item: GeneratedMediaItem) => void;
}) {
  const [items, setItems] = useState(
    initialItems.map(mapCreationRecordToGeneratedItem),
  );
  const [pendingUseIndex, setPendingUseIndex] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);

  const handleRemoveByIndices = async (indices: number[]) => {
    const creationIds = indices
      .map((index) => items[index]?.params?.creationRecordId as string | undefined)
      .filter((id): id is string => Boolean(id));

    if (creationIds.length === 0) {
      toast.error("没有可移除的作品");
      return;
    }

    try {
      const response = await fetch(
        `/api/workbench/collections/${collectionId}/items`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ creationIds }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "移出 Collection 失败");
      }

      setItems((prev) =>
        prev.filter((_, index) => !indices.includes(index)),
      );
      toast.success("作品已移出 Collection");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "移出 Collection 失败");
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
      const response = await fetch(
        `/api/workbench/collections/${collectionId}/items?${params.toString()}`,
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "加载 Collection 失败");
      }

      const nextItems = Array.isArray(result?.data?.items)
        ? (result.data.items as CollectionCreationRecord[]).map(
            mapCreationRecordToGeneratedItem,
          )
        : [];
      setItems((prev) => [...prev, ...nextItems]);
      setHasMore(Boolean(result?.data?.hasMore) && nextItems.length > 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载 Collection 失败");
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
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] text-white/62 transition hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.06] hover:text-white"
              aria-label={copy.back}
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white/92">
                {collectionName}
              </div>
              <p className="mt-1 truncate text-sm text-white/45">
                {copy.description}
              </p>
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/62">
            <FolderOpen className="size-3.5" />
            <span>{items.length} assets</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,rgba(12,15,20,0.96)_0%,rgba(9,11,16,0.98)_100%)]">
          {items.length === 0 ? (
            <div className="flex h-full min-h-0 items-center justify-center p-8">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.04] text-white/42">
                  <FolderOpen className="size-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white/92">
                  {copy.emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {copy.emptyDescription}
                </p>
              </div>
            </div>
          ) : (
            <GeneratedMediaPanel
              items={items}
              hideHeader
              gridDensity="compact"
              cardScale={18}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={() => void handleLoadMore()}
              onUseItem={
                onUseItem
                  ? (index) => {
                      handleRequestUseItem(index);
                    }
                  : undefined
              }
              onDeleteItem={(index) => void handleRemoveByIndices([index])}
              onDeleteItems={(indices) => void handleRemoveByIndices(indices)}
              hideAddToCollectionAction
              emptyText={copy.emptyText}
              emptyStateTitle={copy.emptyTitle}
              emptyStateDescription={copy.emptyDescription}
              emptyStateChips={["Collection", "Selected", "Saved"]}
            />
          )}
        </div>
      </div>

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
              确认后会基于这条素材在当前画布中创建一个新节点。
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
