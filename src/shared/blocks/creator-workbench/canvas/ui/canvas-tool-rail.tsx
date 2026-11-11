"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  Image as ImageIcon,
  Music4,
  Plus,
  Type,
  Upload,
  Video,
} from "lucide-react";

import { getCanvasCopy } from "@/shared/blocks/creator-workbench/canvas/canvas-copy";
import { SignUser } from "@/shared/blocks/common";
import type { UserNav } from "@/shared/types/blocks/common";
import { cn } from "@/shared/lib/utils";
import { CanvasSidebarNav } from "./canvas-sidebar-nav";

type CanvasToolRailProps = {
  onCreateTextNode: () => void;
  onCreateImageNode: () => void;
  onCreateVideoNode: () => void;
  onCreateAudioNode: () => void;
  onCreateUploadNode: () => void;
  onOpenProjects: () => void;
  onOpenCreations: () => void;
  onOpenCollections: () => void;
  userNav?: UserNav;
};

type QuickAddItem = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Type;
  onClick: () => void;
  badge?: boolean;
};

export function CanvasToolRail({
  onCreateTextNode,
  onCreateImageNode,
  onCreateVideoNode,
  onCreateAudioNode,
  onCreateUploadNode,
  onOpenProjects,
  onOpenCreations,
  onOpenCollections,
  userNav,
}: CanvasToolRailProps) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = isPinnedOpen || isHovered || isMenuHovered;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
      setIsMenuHovered(false);
    }, 140);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const quickAddItems = useMemo<QuickAddItem[]>(
    () => [
      {
        id: "text",
        label: copy.toolRail.text,
        description: copy.toolRail.textDescription,
        icon: Type,
        onClick: onCreateTextNode,
      },
      {
        id: "image",
        label: copy.toolRail.image,
        icon: ImageIcon,
        onClick: onCreateImageNode,
      },
      {
        id: "video",
        label: copy.toolRail.video,
        icon: Video,
        onClick: onCreateVideoNode,
      },
      {
        id: "audio",
        label: copy.toolRail.audio,
        icon: Music4,
        onClick: onCreateAudioNode,
        badge: true,
      },
    ],
    [
      copy.toolRail.audio,
      copy.toolRail.image,
      copy.toolRail.text,
      copy.toolRail.textDescription,
      copy.toolRail.video,
      onCreateAudioNode,
      onCreateImageNode,
      onCreateTextNode,
      onCreateVideoNode,
    ],
  );
  return (
    <div className="absolute left-6 top-1/2 z-20 -translate-y-1/2">
      <div className="relative">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(22,23,27,0.92)] px-3 py-4 shadow-[0_18px_54px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative"
              onMouseEnter={() => {
                clearCloseTimer();
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                if (!isPinnedOpen) scheduleClose();
              }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsPinnedOpen((value) => !value)}
                className="group flex size-[3.25rem] items-center justify-center rounded-full bg-white text-[#0d1118] shadow-[0_10px_30px_rgba(255,255,255,0.14)] transition hover:scale-[1.02]"
              >
                <Plus
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isExpanded && "rotate-45",
                  )}
                />
              </button>

              <div
                className={cn(
                  "pointer-events-none absolute left-full top-0 ml-1 w-[15.5rem] rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(43,40,42,0.98),rgba(30,30,34,0.96))] p-2.5 opacity-0 shadow-[0_22px_64px_rgba(0,0,0,0.4)] backdrop-blur-xl transition duration-200",
                  isExpanded && "pointer-events-auto opacity-100",
                )}
                onMouseEnter={() => {
                  clearCloseTimer();
                  setIsMenuHovered(true);
                }}
                onMouseLeave={() => {
                  if (!isPinnedOpen) scheduleClose();
                }}
              >
                <div className="px-1.5 pb-2 text-[0.82rem] font-semibold text-white/78">
                  {copy.common.addNode}
                </div>

                <div className="space-y-2">
                  {quickAddItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          item.onClick();
                          setIsPinnedOpen(false);
                          setIsHovered(false);
                          setIsMenuHovered(false);
                        }}
                        className={cn(
                          "relative flex w-full items-center gap-2.5 rounded-[18px] border border-white/6 bg-white/[0.03] px-2.5 py-2.5 text-left transition hover:border-white/14 hover:bg-white/[0.08]",
                          index === 0 && "bg-white/[0.08]",
                        )}
                      >
                        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.06] text-white/88">
                          <Icon className="size-4.5" />
                          {item.badge ? (
                            <span className="absolute right-0 top-0 size-2.5 rounded-full bg-[#2eb1ff]" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.92rem] font-semibold leading-tight text-white">
                            {item.label}
                          </div>
                          {item.description ? (
                            <div className="mt-0.5 text-[0.72rem] leading-4 text-white/38">
                              {item.description}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-1.5 pb-2 pt-3 text-[0.82rem] font-semibold text-white/42">
                  {copy.common.addResource}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onCreateUploadNode();
                    setIsPinnedOpen(false);
                    setIsHovered(false);
                    setIsMenuHovered(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[18px] border border-white/6 bg-white/[0.03] px-2.5 py-2.5 text-left transition hover:border-white/14 hover:bg-white/[0.08]"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.06] text-white/88">
                    <Upload className="size-4.5" />
                  </div>
                  <div className="text-[0.92rem] font-semibold text-white">
                    {copy.common.upload}
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-3 h-px w-full bg-white/8" />

            <CanvasSidebarNav
              compact
              onOpenProjects={onOpenProjects}
              onOpenCreations={onOpenCreations}
              onOpenCollections={onOpenCollections}
            />

            <div className="h-px w-full bg-white/8" />

            <div className="flex items-center justify-center">
              <SignUser
                userNav={userNav}
                signButtonSize="sm"
                triggerClassName="h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(242,245,255,0.98),rgba(142,151,170,0.9))] p-0 shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
                buttonClassName="ml-0 h-11 rounded-full bg-white text-black hover:bg-white/92"
                containerClassName="w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
