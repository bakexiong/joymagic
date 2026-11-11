"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CanvasCollectionDetailPageClient } from "@/shared/blocks/creator-workbench/canvas/page/canvas-collection-detail-page-client";
import type { GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { WorkbenchCollectionsGrid } from "@/shared/blocks/desktop-playground/components/workbench-collections-grid";

type CollectionItem = {
  id: string;
  name: string;
  assetCount: number;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

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

export function CanvasCollectionsPageClient({
  initialItems,
  text,
  detailCopy,
  onUseItem,
}: {
  initialItems: CollectionItem[];
  text: {
    heading: string;
    createCardLabel: string;
    createTitle: string;
    createDescription: string;
    renameTitle: string;
    renameDescription: string;
    deleteTitle: string;
    deleteDescription: string;
    renameAction: string;
    deleteAction: string;
    createAction: string;
    cancelAction: string;
    nameLabel: string;
    namePlaceholder: string;
    emptyTitle: string;
    emptyDescription: string;
    createSuccess: string;
    renameSuccess: string;
    deleteSuccess: string;
    createError: string;
    renameError: string;
    deleteError: string;
  };
  detailCopy: {
    back: string;
    description: string;
    emptyText: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  onUseItem?: (item: GeneratedMediaItem) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [activeCollection, setActiveCollection] = useState<CollectionItem | null>(null);
  const [detailItems, setDetailItems] = useState<CollectionCreationRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCollectionDetail = async (item: CollectionItem) => {
    try {
      setDetailLoading(true);
      const params = new URLSearchParams({
        limit: "30",
        offset: "0",
      });
      const response = await fetch(
        `/api/workbench/collections/${item.id}/items?${params.toString()}`,
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || text.deleteError);
      }

      const nextItems = Array.isArray(result?.data?.items)
        ? (result.data.items as Array<Record<string, unknown>>).map((detail) => ({
            id: String(detail.id || ""),
            mediaType: String(detail.mediaType || "image"),
            sceneId:
              typeof detail.sceneId === "string" ? detail.sceneId : null,
            modelUrl:
              typeof detail.modelUrl === "string" ? detail.modelUrl : null,
            prompt: typeof detail.prompt === "string" ? detail.prompt : null,
            params: typeof detail.params === "string" ? detail.params : null,
            aspectRatio:
              typeof detail.aspectRatio === "string" ? detail.aspectRatio : null,
            url: String(detail.url || ""),
            createdAt:
              detail.createdAt instanceof Date
                ? detail.createdAt.toISOString()
                : String(detail.createdAt || ""),
          }))
        : [];

      setActiveCollection(item);
      setDetailItems(nextItems);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.deleteError);
    } finally {
      setDetailLoading(false);
    }
  };

  if (activeCollection) {
    if (detailLoading) {
      return (
        <div className="flex min-h-[18rem] items-center justify-center rounded-[1.8rem] border border-white/8 bg-white/[0.02] text-sm text-white/45">
          Loading...
        </div>
      );
    }

    return (
      <CanvasCollectionDetailPageClient
        collectionId={activeCollection.id}
        collectionName={activeCollection.name}
        initialItems={detailItems}
        pageSize={30}
        copy={detailCopy}
        onUseItem={onUseItem}
        onBack={() => {
          setActiveCollection(null);
          setDetailItems([]);
        }}
      />
    );
  }

  return (
    <WorkbenchCollectionsGrid
      items={items}
      text={text}
      onCreate={async (name) => {
        const response = await fetch("/api/workbench/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0 || !result?.data?.collection) {
          throw new Error(result?.message || text.createError);
        }

        setItems((prev) => [
          {
            ...result.data.collection,
            assetCount: Number(result.data.collection.assetCount ?? 0),
          },
          ...prev,
        ]);
      }}
      onRename={async (id, name) => {
        const response = await fetch(`/api/workbench/collections/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0 || !result?.data?.collection) {
          throw new Error(result?.message || text.renameError);
        }

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: result.data.collection.name,
                  updatedAt: result.data.collection.updatedAt,
                }
              : item,
          ),
        );
      }}
      onDelete={async (id) => {
        const response = await fetch(`/api/workbench/collections/${id}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0) {
          throw new Error(result?.message || text.deleteError);
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
      }}
      onOpen={(item) => {
        void loadCollectionDetail(item);
      }}
    />
  );
}
