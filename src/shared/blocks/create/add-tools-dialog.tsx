"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X, Video, Image as ImageIcon, Volume2, User, Pin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { SmartIcon } from "@/shared/blocks/common";
import { toCdnUrl } from "@/shared/lib/cdn";
import type { NavItem } from "@/shared/types/blocks/common";

type ToolCategory = "VIDEO" | "IMAGE" | "AUDIO" | "CHARACTER";

type CategorizedTool = {
  category: ToolCategory;
  tool: NavItem;
  isPinned: boolean;
};

interface AddToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allTools: NavItem[];
  pinnedToolUrls: string[];
  onToggleTool: (toolUrl: string) => void;
  sidebarWidth: number;
}

const CATEGORY_CONFIG: Record<
  ToolCategory,
  { icon: typeof Video; label: string }
> = {
  VIDEO: {
    icon: Video,
    label: "VIDEO",
  },
  IMAGE: {
    icon: ImageIcon,
    label: "IMAGE",
  },
  AUDIO: {
    icon: Volume2,
    label: "AUDIO",
  },
  CHARACTER: {
    icon: User,
    label: "CHARACTER",
  },
};

function categorizeTool(tool: NavItem): ToolCategory {
  const url = tool.url?.toLowerCase() || "";
  const title = tool.title?.toLowerCase() || tool.name?.toLowerCase() || "";

  if (
    url.includes("video") ||
    url.includes("motion") ||
    url.includes("avatar") ||
    title.includes("video") ||
    title.includes("motion")
  ) {
    return "VIDEO";
  }

  if (url.includes("audio") || url.includes("voice") || url.includes("sound")) {
    return "AUDIO";
  }

  if (
    url.includes("character") ||
    url.includes("avatar") ||
    title.includes("character")
  ) {
    return "CHARACTER";
  }

  return "IMAGE";
}

function getToolUrl(tool: NavItem): string {
  return tool.url || tool.children?.[0]?.url || "";
}

function withOssResizeParams(imageSrc: string, width: number, height: number) {
  const ossProcess = `image/resize,m_fill,w_${width},h_${height}`;

  try {
    const url = new URL(imageSrc);
    url.searchParams.delete("w");
    url.searchParams.delete("q");

    const currentProcess = url.searchParams.get("x-oss-process");
    if (!currentProcess) {
      url.searchParams.set("x-oss-process", ossProcess);
      return url.toString();
    }

    const replacedProcess = currentProcess.match(/image\/resize,m_fill,w_\d+,h_\d+/)
      ? currentProcess.replace(/image\/resize,m_fill,w_\d+,h_\d+/, ossProcess)
      : `${currentProcess}/resize,m_fill,w_${width},h_${height}`;

    url.searchParams.set("x-oss-process", replacedProcess);
    return url.toString();
  } catch {
    return imageSrc;
  }
}

export function AddToolsDialog({
  isOpen,
  onClose,
  allTools,
  pinnedToolUrls,
  onToggleTool,
  sidebarWidth,
}: AddToolsDialogProps) {
  if (!isOpen) return null;

  const tc = useTranslations("creator");
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("IMAGE");
  const getToolLabel = (tool: NavItem): string => {
    return tool.title || tool.name || tc("tools.untitled");
  };

  const toolsByCategory = useMemo(() => {
    const categorizedTools: CategorizedTool[] = allTools.map((tool) => ({
      category: categorizeTool(tool),
      tool,
      isPinned: pinnedToolUrls.includes(getToolUrl(tool)),
    }));

    return categorizedTools.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<ToolCategory, CategorizedTool[]>,
    );
  }, [allTools, pinnedToolUrls]);

  // 计算面板左侧位置：侧边栏宽度 + 间距
  const panelLeft = sidebarWidth + 16; // 16px 间距

  const getCardThumbnailUrl = (iconUrl?: string) => {
    const cdnUrl = toCdnUrl(iconUrl);
    if (!cdnUrl) return undefined;
    return withOssResizeParams(cdnUrl, 640, 640);
  };

  return (
    <div
      className={cn(
        "fixed top-[140px] z-[121] flex w-[860px] max-h-[calc(100vh-160px)] transform flex-col overflow-hidden rounded-[28px] border border-[color:var(--color-frost-border)] bg-black/95 shadow-[var(--shadow-ring-frost),0_30px_90px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 ease-out",
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
      style={{ left: `${panelLeft}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-frost-border-alt)] px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-[-0.02em] text-white/92 md:text-base">
            {tc("addToolsDialog.title")}
          </h2>
          <div className="hidden h-5 w-px bg-white/10 md:block" />
          <div className="hidden items-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] p-1 md:flex">
            {(
              [
                {
                  key: "VIDEO" as const,
                  label: tc("addToolsDialog.categories.video"),
                  icon: Video,
                },
                {
                  key: "IMAGE" as const,
                  label: tc("addToolsDialog.categories.image"),
                  icon: ImageIcon,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveCategory(item.key)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-3 text-[12px] font-semibold transition-all duration-150",
                    isActive
                      ? "border border-white/20 bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full border border-[color:var(--color-frost-border-alt)] bg-white/[0.02] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white md:size-8"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 md:px-6 md:pb-6">
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = CATEGORY_CONFIG[activeCategory].icon;
              return <Icon className="size-4 text-white/80" />;
            })()}
            <p className="text-sm font-semibold text-white/90">
              {activeCategory === "IMAGE"
                ? tc("addToolsDialog.categories.image")
                : tc("addToolsDialog.categories.video")}
            </p>
          </div>
          <div className="flex items-center rounded-[14px] border border-white/10 bg-white/[0.03] p-1">
              {(
                [
                {
                  key: "VIDEO" as const,
                  label: tc("addToolsDialog.categories.video"),
                },
                {
                  key: "IMAGE" as const,
                  label: tc("addToolsDialog.categories.image"),
                },
              ] as const
            ).map((item) => {
              const isActive = activeCategory === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveCategory(item.key)}
                  className={cn(
                    "flex h-9 items-center rounded-full px-3 text-[12px] font-semibold transition-all duration-150",
                    isActive
                      ? "border border-white/20 bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
          {(toolsByCategory[activeCategory] || []).map(({ tool, isPinned }) => {
            const label = getToolLabel(tool);
            const toolUrl = getToolUrl(tool);
            const thumb = getCardThumbnailUrl(tool.icon_url);

            return (
              <button
                key={toolUrl}
                type="button"
                onClick={() => onToggleTool(toolUrl)}
                className={cn(
                  "group relative overflow-hidden rounded-[22px] border text-left transition-all duration-200",
                  "border-[color:var(--color-frost-border-alt)] bg-white/[0.02] hover:border-[color:var(--color-frost-border)] hover:bg-white/[0.035]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  "active:scale-[0.99] motion-reduce:transform-none",
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full overflow-hidden rounded-[18px] rounded-b-none bg-gradient-to-br from-white/[0.055] via-white/[0.02] to-transparent">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={label}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 45vw, (max-width: 1024px) 220px, 240px"
                      quality={85}
                      className="object-cover object-center"
                    />
                  ) : typeof tool.icon === "string" ? (
                    <div className="flex size-full items-center justify-center">
                      <SmartIcon name={tool.icon} className="size-10 text-white/60" />
                    </div>
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <span className="text-[28px] font-semibold text-white/45">
                        {label.trim().slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Pin */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleTool(toolUrl);
                    }}
                    aria-label={
                      isPinned
                        ? tc("sidebar.pin.ariaUnpin", { label })
                        : tc("sidebar.pin.ariaPin", { label })
                    }
                    className={cn(
                      "absolute right-3 top-3 flex size-10 items-center justify-center rounded-[14px] border transition-all duration-150",
                      isPinned
                        ? "border-white/16 bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                        : "border-[color:var(--color-frost-border-alt)] bg-black/45 text-white/70 hover:bg-black/60 hover:text-white",
                    )}
                  >
                    <Pin className="size-4" />
                  </button>
                </div>

                {/* Title */}
                <div className="px-4 pb-4 pt-3">
                  <p className="line-clamp-2 text-[13px] font-semibold tracking-[-0.015em] text-white/90">
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
