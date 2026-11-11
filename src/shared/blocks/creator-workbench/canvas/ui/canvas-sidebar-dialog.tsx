"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "@/core/i18n/navigation";
import { getCanvasCopy } from "@/shared/blocks/creator-workbench/canvas/canvas-copy";
import {
  CanvasCollectionsPageClient,
} from "@/shared/blocks/creator-workbench/canvas/page/canvas-collections-page-client";
import {
  CanvasCreationsPageClient,
} from "@/shared/blocks/creator-workbench/canvas/page/canvas-creations-page-client";
import type { GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

type CanvasProjectListItem = {
  id: string;
  name: string;
  coverUrl: string | null;
  updatedAt: Date | string;
};

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

type CollectionItem = {
  id: string;
  name: string;
  assetCount: number;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SidebarDialogMode = "projects" | "creations" | "collections" | null;

export function CanvasSidebarDialog({
  open,
  mode,
  locale,
  onOpenChange,
  onUseItem,
}: {
  open: boolean;
  mode: SidebarDialogMode;
  locale: string;
  onOpenChange: (open: boolean) => void;
  onUseItem: (item: GeneratedMediaItem) => void;
}) {
  const router = useRouter();
  const copy = getCanvasCopy(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<CanvasProjectListItem[]>([]);
  const [creations, setCreations] = useState<WorkbenchCreationRecord[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    if (!open || !mode) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);

        if (mode === "projects") {
          const response = await fetch("/api/workbench/canvas-projects");
          const result = await response.json().catch(() => null);
          if (!response.ok || result?.code !== 0) {
            throw new Error(result?.message || copy.common.projects);
          }
          setProjects(Array.isArray(result?.data?.items) ? result.data.items : []);
          return;
        }

        if (mode === "creations") {
          const response = await fetch("/api/workbench/creations?limit=30&offset=0");
          const result = await response.json().catch(() => null);
          if (!response.ok || result?.code !== 0) {
            throw new Error(result?.message || copy.common.creations);
          }
          setCreations(Array.isArray(result?.data?.items) ? result.data.items : []);
          return;
        }

        const response = await fetch("/api/workbench/collections");
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0) {
          throw new Error(result?.message || copy.common.collections);
        }
        setCollections(Array.isArray(result?.data?.items) ? result.data.items : []);
      } catch (error) {
        console.error("[CanvasSidebarDialog] load failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [mode, open]);

  const title =
    mode === "projects"
      ? copy.common.projects
      : mode === "creations"
        ? copy.common.creations
        : mode === "collections"
          ? copy.common.collections
          : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86vh,940px)] w-[94vw] max-w-[94vw] flex-col overflow-hidden rounded-[28px] border border-[color:var(--color-frost-border)] bg-[linear-gradient(180deg,#07090C_0%,#0D1014_100%)] p-0 text-[#F0F0F0] shadow-[var(--shadow-ring-frost),0_28px_90px_rgba(0,0,0,0.5)] duration-300 sm:h-[min(86vh,940px)] sm:w-[min(94vw,1320px)] sm:max-w-[min(94vw,1320px)]">
        <DialogHeader className="border-b border-[color:var(--color-frost-border-alt)] px-6 py-4">
          <DialogTitle className="text-[16px] font-semibold text-[#F0F0F0]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex min-h-full w-full items-center justify-center text-white/55">
              <Loader2 className="mr-2 size-5 animate-spin" />
              {copy.common.loading}
            </div>
          ) : null}

          {!isLoading && mode === "projects" ? (
            <div
              className="grid w-full gap-5 overflow-y-auto px-6 py-5"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
            >
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/${locale}/create/canvas`);
                }}
                className="flex h-[16.5rem] cursor-pointer flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-[color:var(--color-frost-border-alt)] bg-white/[0.03] px-6 py-6 text-center text-white/72 transition hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white text-black">
                  <Plus className="size-6" />
                </div>
                <div className="text-base font-semibold">{copy.common.newProject}</div>
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/${locale}/create/canvas/${project.id}`);
                  }}
                  className="flex h-[16.5rem] flex-col overflow-hidden rounded-[1.8rem] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,rgba(14,17,22,0.98)_0%,rgba(10,12,16,0.98)_100%)] text-left shadow-[var(--shadow-ring-frost),0_24px_70px_rgba(0,0,0,0.24)] transition hover:border-[color:var(--color-frost-border)] hover:bg-[linear-gradient(180deg,rgba(16,19,24,0.98)_0%,rgba(11,13,18,0.99)_100%)]"
                >
                  <div className="h-[10.75rem] shrink-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]">
                    {project.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverUrl}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end px-4 py-4">
                    <div className="truncate text-base font-semibold text-white/92">
                      {project.name}
                    </div>
                    <div className="mt-2 text-xs text-[#A1A4A5]">
                      {copy.common.recentlyUpdated} {new Intl.DateTimeFormat(locale, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(project.updatedAt))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {!isLoading && mode === "creations" ? (
            <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
              <CanvasCreationsPageClient
                initialItems={creations}
                pageSize={30}
                onUseItem={(item) => {
                  onUseItem(item);
                  onOpenChange(false);
                }}
                copy={{
                  emptyText: "还没有可用作品",
                  emptyTitle: "暂无作品",
                  emptyDescription: "你生成的图片和视频会显示在这里。",
                }}
              />
            </div>
          ) : null}

          {!isLoading && mode === "collections" ? (
            <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
              <CanvasCollectionsPageClient
                initialItems={collections}
                onUseItem={(item) => {
                  onUseItem(item);
                  onOpenChange(false);
                }}
                text={{
                  heading: "Collections",
                  createCardLabel: "新建合集",
                  createTitle: "创建合集",
                  createDescription: "把常用素材整理到同一个合集里。",
                  renameTitle: "重命名合集",
                  renameDescription: "更新这个合集的显示名称。",
                  deleteTitle: "删除合集",
                  deleteDescription: "删除后不可恢复，但不会删除原始作品。",
                  renameAction: "保存",
                  deleteAction: "删除",
                  createAction: "创建",
                  cancelAction: "取消",
                  nameLabel: "名称",
                  namePlaceholder: "输入合集名称",
                  emptyTitle: "还没有合集",
                  emptyDescription: "创建一个合集来整理图片和视频。",
                  createSuccess: "合集已创建",
                  renameSuccess: "合集已更新",
                  deleteSuccess: "合集已删除",
                  createError: "创建合集失败",
                  renameError: "更新合集失败",
                  deleteError: "删除合集失败",
                }}
                detailCopy={{
                  back: "返回",
                  description: "点击素材可直接添加到当前画布。",
                  emptyText: "这个合集还没有内容",
                  emptyTitle: "暂无素材",
                  emptyDescription: "先把作品加入合集，之后就能在这里快速复用。",
                }}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
