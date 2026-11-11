"use client";

import { useEffect, useState } from "react";
import {
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { getMediaWsrvThumbnail } from "@/shared/lib/wsrv";

type CollectionItem = {
  id: string;
  name: string;
  assetCount: number;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CollectionText = {
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

function CollectionSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.2rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] md:rounded-[1.4rem]">
      <Skeleton className="aspect-[1/1] w-full rounded-none bg-white/8 md:aspect-[1.02]" />
      <div className="space-y-2 px-3 py-3 md:px-4 md:py-3.5">
        <Skeleton className="h-4 w-2/3 bg-white/8" />
        <Skeleton className="h-3 w-14 bg-white/6 md:w-16" />
      </div>
    </div>
  );
}

function CreateCollectionCard({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-[1.2rem] border border-dashed border-[color:var(--color-frost-border-alt)] bg-white/[0.03] text-left transition-all duration-200 hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.05] md:rounded-[1.4rem]"
    >
      <div className="flex aspect-[1/1] items-center justify-center bg-white/[0.02] md:aspect-[1.02]">
        <div className="flex h-[3rem] w-[3rem] items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0.06)_48%,rgba(112,124,136,0.08)_100%)] transition-transform duration-200 group-hover:scale-[1.02] md:h-[3.6rem] md:w-[3.6rem]">
          <Plus className="size-4.5 text-white/55 md:size-5" />
        </div>
      </div>
      <div className="px-3 py-3 md:px-4 md:py-3.5">
        <div className="w-full text-balance text-center font-sans text-[12px] font-semibold leading-[1.2] tracking-[-0.015em] text-white/56 transition-colors duration-200 group-hover:text-white/78">
          {label}
        </div>
      </div>
    </button>
  );
}

export function WorkbenchCollectionsGrid({
  items,
  isLoading = false,
  text,
  canCreate = true,
  onCreate,
  onRename,
  onDelete,
  onOpen,
  onRequireSignIn,
}: {
  items: CollectionItem[];
  isLoading?: boolean;
  text: CollectionText;
  canCreate?: boolean;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (item: CollectionItem) => void;
  onRequireSignIn?: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CollectionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "create" | "rename" | "delete" | null
  >(null);

  useEffect(() => {
    if (createOpen) {
      setDraftName("");
    }
  }, [createOpen]);

  useEffect(() => {
    if (renameTarget) {
      setDraftName(renameTarget.name);
    }
  }, [renameTarget]);

  const trimmedName = draftName.trim().replace(/\s+/g, " ");
  const disableCreate = !trimmedName || pendingAction !== null;
  const disableRename =
    !trimmedName ||
    trimmedName === renameTarget?.name ||
    pendingAction !== null;

  const handleCreateCardClick = () => {
    if (canCreate) {
      setCreateOpen(true);
      return;
    }

    onRequireSignIn?.();
  };

  const handleCreate = async () => {
    if (disableCreate) return;

    setPendingAction("create");
    try {
      await onCreate(trimmedName);
      toast.success(text.createSuccess);
      setCreateOpen(false);
      setDraftName("");
    } catch (error: any) {
      toast.error(error?.message || text.createError);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || disableRename) return;

    setPendingAction("rename");
    try {
      await onRename(renameTarget.id, trimmedName);
      toast.success(text.renameSuccess);
      setRenameTarget(null);
      setDraftName("");
    } catch (error: any) {
      toast.error(error?.message || text.renameError);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setPendingAction("delete");
    try {
      await onDelete(deleteTarget.id);
      toast.success(text.deleteSuccess);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message || text.deleteError);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2 touch-pan-y [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] md:px-6 md:py-5">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-3 md:gap-3.5 xl:grid-cols-4 2xl:grid-cols-5">
              <CreateCollectionCard
                label={text.createCardLabel}
                onClick={handleCreateCardClick}
              />
              {Array.from({ length: 4 }).map((_, index) => (
                <CollectionSkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-3 md:gap-3.5 xl:grid-cols-4 2xl:grid-cols-5">
              <CreateCollectionCard
                label={text.createCardLabel}
                onClick={handleCreateCardClick}
              />

              {items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(item);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-[1.2rem] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,rgba(14,17,22,0.96)_0%,rgba(10,12,16,0.98)_100%)] text-left transition-colors hover:border-[color:var(--color-frost-border)] hover:bg-[linear-gradient(180deg,rgba(16,19,24,0.98)_0%,rgba(11,13,18,0.99)_100%)] md:rounded-[1.4rem]"
                >
                  <div className="relative flex aspect-[1/1] items-center justify-center overflow-hidden bg-white/[0.05] md:aspect-[1.02]">
                    {item.coverUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaWsrvThumbnail(item.coverUrl, "image", {
                            width: 800,
                          })}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/8 to-black/10" />
                      </>
                    ) : (
                      <FolderOpen className="size-11 text-white/28 md:size-16" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={item.name}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-2.5 top-2.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-black/35 text-white/70 opacity-100 backdrop-blur-md transition-all duration-200 hover:bg-black/55 hover:text-white md:right-3 md:top-3 md:size-8 md:min-h-0 md:min-w-0 md:opacity-0 group-hover:md:opacity-100 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-[1.2rem] border border-white/10 bg-[#1A1D20] p-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.38)]"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer rounded-[0.9rem] px-3 py-3 text-[15px] text-white/82 focus:bg-white/8 focus:text-white"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRenameTarget(item);
                          }}
                        >
                          <Pencil className="size-4 text-white/72" />
                          {text.renameAction}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer rounded-[0.9rem] px-3 py-3 text-[15px] focus:bg-red-500/10"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTarget(item);
                          }}
                        >
                          <Trash2 className="size-4" />
                          {text.deleteAction}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1 px-3 py-3 md:px-4 md:py-3.5">
                    <div className="line-clamp-2 text-[0.9rem] font-semibold tracking-[-0.03em] text-white md:line-clamp-1 md:text-[0.96rem]">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-medium tracking-[0.01em] text-white/42">
                      {item.assetCount} assets
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/10 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {text.createTitle}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {text.createDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium text-white/72">
              {text.nameLabel}
            </div>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreate();
                }
              }}
              maxLength={60}
              placeholder={text.namePlaceholder}
              className="h-11 rounded-[0.95rem] border-white/12 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/10"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-[0.95rem] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {text.cancelAction}
            </button>
            <button
              type="button"
              disabled={disableCreate}
              onClick={() => void handleCreate()}
              className={cn(
                "inline-flex items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-colors",
                disableCreate
                  ? "cursor-not-allowed bg-white/12 text-white/32"
                  : "bg-white text-black hover:bg-white/90",
              )}
            >
              {pendingAction === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                text.createAction
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setDraftName("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/10 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {text.renameTitle}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {text.renameDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium text-white/72">
              {text.nameLabel}
            </div>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleRename();
                }
              }}
              maxLength={60}
              placeholder={text.namePlaceholder}
              className="h-11 rounded-[0.95rem] border-white/12 bg-white/[0.04] text-white placeholder:text-white/25 focus-visible:ring-white/10"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setRenameTarget(null);
                setDraftName("");
              }}
              className="rounded-[0.95rem] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {text.cancelAction}
            </button>
            <button
              type="button"
              disabled={disableRename}
              onClick={() => void handleRename()}
              className={cn(
                "inline-flex items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-colors",
                disableRename
                  ? "cursor-not-allowed bg-white/12 text-white/32"
                  : "bg-white text-black hover:bg-white/90",
              )}
            >
              {pendingAction === "rename" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                text.renameAction
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/10 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {text.deleteTitle}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {deleteTarget
                ? text.deleteDescription.replace("{name}", deleteTarget.name)
                : text.deleteDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-[0.95rem] border border-white/10 px-4 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {text.cancelAction}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void handleDelete()}
              className={cn(
                "inline-flex items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-colors",
                pendingAction === "delete"
                  ? "bg-red-500/20 text-red-200"
                  : "bg-red-500 text-white hover:bg-red-400",
              )}
            >
              {pendingAction === "delete" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                text.deleteAction
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
