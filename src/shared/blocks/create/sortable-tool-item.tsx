"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SmartIcon } from "@/shared/blocks/common";
import { toCdnUrl } from "@/shared/lib/cdn";
import type { NavItem } from "@/shared/types/blocks/common";

interface SortableToolItemProps {
  tool: NavItem;
  label: string;
  tone: {
    surface: string;
    glow: string;
    accent: string;
    pill: string;
  };
  isActive: boolean;
  isSidebarExpanded: boolean;
  onToolClick: () => void;
  onRemove: () => void;
}

export function SortableToolItem({
  tool,
  label,
  tone,
  isActive,
  isSidebarExpanded,
  onToolClick,
  onRemove,
}: SortableToolItemProps) {
  const toolUrl = tool.url || tool.children?.[0]?.url || "";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: toolUrl });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center",
        isSidebarExpanded ? "w-full" : "w-11 justify-center",
        isDragging && "z-50",
      )}
    >
      <button
        type="button"
        onClick={onToolClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className={cn(
          "flex min-h-[56px] w-full rounded-xl text-left transition-all duration-200 active:scale-95",
          isSidebarExpanded
            ? "items-center gap-2.5 py-1.5"
            : "h-[56px] w-11 items-center justify-center px-0 py-1.5",
          isActive ? "bg-accent shadow-sm" : "hover:bg-accent",
          isDragging && "opacity-50 shadow-lg",
          isSidebarExpanded ? "pl-1.5 pr-1.5 group-hover:pl-7" : "",
        )}
        title={isSidebarExpanded ? undefined : label}
      >
        {/* 拖拽手柄 - 仅在展开且 hover 时显示 */}
        {isSidebarExpanded && (
          <div
            {...attributes}
            {...listeners}
            className="absolute left-1.5 flex size-5 cursor-grab items-center justify-center rounded opacity-0 transition-all duration-200 group-hover:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
          </div>
        )}

        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm transition-all duration-200",
            tone.surface,
            tone.accent,
            isActive && "shadow-md",
          )}
        >
          {toCdnUrl(tool.icon_url) ? (
            <img
              src={toCdnUrl(tool.icon_url)!}
              alt={label}
              className="block size-full rounded-full object-cover object-center"
            />
          ) : typeof tool.icon === "string" ? (
            <SmartIcon name={tool.icon} className="size-4.5 text-white/85" />
          ) : tool.icon ? (
            tool.icon
          ) : (
            label
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word.charAt(0))
              .join("")
              .toUpperCase()
          )}
        </span>
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden transition-opacity duration-300",
            isSidebarExpanded ? "opacity-100" : "opacity-0",
          )}
        >
          <p className="truncate text-[11px] font-medium leading-tight text-foreground">
            {label}
          </p>
        </div>
      </button>
    </div>
  );
}
