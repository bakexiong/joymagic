"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CanvasProjectListItem = {
  id: string;
  name: string;
  coverUrl: string | null;
  updatedAt: Date | string;
};

export function CanvasProjectsGrid({
  locale,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  createHref,
  pageTitle,
  initialProjects,
  copy,
}: {
  locale: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  createHref: string;
  pageTitle: string;
  initialProjects: CanvasProjectListItem[];
  copy: {
    deleteConfirm: string;
    deleteSuccess: string;
    deleteError: string;
    duplicateSuccess: string;
    duplicateError: string;
    updatedAtPrefix: string;
    duplicateAria: string;
    deleteAria: string;
  };
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string, projectName: string) => {
    const confirmed = window.confirm(
      copy.deleteConfirm.replace("{name}", projectName),
    );
    if (!confirmed) return;

    try {
      setDeletingId(projectId);
      const response = await fetch(
        `/api/workbench/canvas-projects/${projectId}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || copy.deleteError);
      }

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      toast.success(copy.deleteSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      setDuplicatingId(projectId);
      const response = await fetch(
        `/api/workbench/canvas-projects/${projectId}/duplicate`,
        {
          method: "POST",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.project) {
        throw new Error(result?.message || copy.duplicateError);
      }

      setProjects((prev) => [result.data.project, ...prev]);
      toast.success(copy.duplicateSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.duplicateError);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href={createHref}
          className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-dashed border-[color:var(--color-frost-border)] bg-[linear-gradient(180deg,rgba(18,22,29,0.98)_0%,rgba(10,12,16,0.98)_100%)] shadow-[var(--shadow-ring-frost),0_24px_70px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:shadow-[var(--shadow-ring-frost),0_30px_80px_rgba(0,0,0,0.3)]"
        >
          <div className="flex aspect-[16/10] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/88 transition duration-300 group-hover:scale-105 group-hover:bg-white/[0.1]">
                <Plus className="size-6" />
              </span>
              <div className="space-y-1">
                <div className="text-base font-semibold text-white/92">
                  {emptyActionLabel}
                </div>
                <div className="text-xs tracking-[0.12em] text-white/38 uppercase">
                  {pageTitle}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-start justify-between gap-3 px-5 py-4 lg:px-5 lg:py-4.5">
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-white/92">
                {emptyTitle}
              </div>
              <div className="mt-2 text-xs text-white/42">
                {emptyDescription}
              </div>
            </div>
          </div>
        </Link>

        {projects.map((project) => (
          <div
            key={project.id}
            className="group overflow-hidden rounded-[24px] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,rgba(14,17,22,0.98)_0%,rgba(10,12,16,0.98)_100%)] shadow-[var(--shadow-ring-frost),0_24px_70px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-frost-border)] hover:shadow-[var(--shadow-ring-frost),0_30px_80px_rgba(0,0,0,0.3)]"
          >
            <Link
              href={`/${locale}/create/canvas/${project.id}`}
              className="block"
            >
              <div className="aspect-[16/10] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]">
                {project.coverUrl ? (
                  <img
                    src={project.coverUrl}
                    alt={project.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-medium tracking-[0.08em] text-white/26 uppercase">
                    {pageTitle}
                  </div>
                )}
              </div>
            </Link>
            <div className="flex items-start justify-between gap-3 px-5 py-4 lg:px-5 lg:py-4.5">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${locale}/create/canvas/${project.id}`}
                  className="block truncate text-base font-semibold text-white/92"
                >
                  {project.name}
                </Link>
                <div className="mt-2 text-xs text-white/42">
                  {copy.updatedAtPrefix}{" "}
                  {new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(project.updatedAt))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDuplicate(project.id)}
                  disabled={duplicatingId === project.id}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] text-white/55 transition hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={copy.duplicateAria}
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(project.id, project.name)}
                  disabled={deletingId === project.id}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] text-white/55 transition hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={copy.deleteAria}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
