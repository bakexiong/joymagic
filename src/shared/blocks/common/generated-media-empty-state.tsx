"use client";

import {
  ChevronDown,
  CopyPlus,
  Filter,
  FolderOpen,
  Grid2X2,
  History,
  Image as ImageIcon,
  Search,
  Shield,
  Star,
  Video,
  Volume2,
  Wand2,
} from "lucide-react";

import { useAppContext } from "@/shared/contexts/app";
import { cn } from "@/shared/lib/utils";

type PreviewItem = {
  label: string;
  iconUrl?: string;
};

interface GeneratedMediaEmptyStateProps {
  mediaType?: "image" | "video";
  title: string;
  description: string;
  chips?: string[];
  previewItems?: PreviewItem[];
  ctaLabel?: string;
  showWorkbenchChrome?: boolean;
  rounded?: boolean;
}

export function GeneratedMediaEmptyState({
  mediaType = "image",
  showWorkbenchChrome = true,
  rounded = true,
}: GeneratedMediaEmptyStateProps) {
  const { user } = useAppContext();
  const defaultTabLabel = user ? "Creations" : "Templates";

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[18rem] flex-col overflow-hidden border border-[rgba(214,235,253,0.19)] bg-[#030303] shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.3)] md:h-[calc(100vh-12rem)] max-md:border-0 max-md:shadow-none",
        rounded ? "rounded-[2rem] max-md:rounded-none" : "rounded-none",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.015)_24%,rgba(0,0,0,0)_56%)]" />

      {showWorkbenchChrome ? (
        <>
          <div className="relative border-b border-[rgba(214,235,253,0.12)] px-2 py-2.5 md:hidden">
            <button className="inline-flex min-h-[38px] items-center whitespace-nowrap rounded-full border border-[rgba(214,235,253,0.19)] bg-white px-3 py-2 text-[11px] font-semibold tracking-[0.35px] text-black shadow-[0_12px_28px_rgba(255,255,255,0.08)]">
              {defaultTabLabel}
            </button>
          </div>

          <div className="relative hidden border-b border-[rgba(214,235,253,0.12)] px-2.5 py-3 md:block md:px-4 md:py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 2xl:flex-nowrap">
              <div className="flex min-w-0 flex-wrap items-center gap-1 lg:gap-1.5 2xl:flex-nowrap">
                <button
                  className={cn(
                    "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.35px] shadow-[0_14px_32px_rgba(255,255,255,0.1)]",
                    defaultTabLabel === "Creations"
                      ? "border-[rgba(214,235,253,0.19)] bg-white text-black"
                      : "border-transparent bg-transparent text-[#A1A4A5] shadow-none transition-colors hover:text-[#F0F0F0]",
                  )}
                >
                  <History className="size-3" />
                  Creations
                  <ChevronDown className="size-3" />
                </button>
                <button className="inline-flex min-h-[40px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-1.5 py-2 text-[11px] font-medium tracking-[0.35px] text-[#A1A4A5] transition-colors hover:text-[#F0F0F0]">
                  <FolderOpen className="size-3" />
                  Collections
                </button>
                <button
                  className={cn(
                    "inline-flex min-h-[40px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-2 text-[11px] font-medium tracking-[0.35px] transition-colors",
                    defaultTabLabel === "Templates"
                      ? "border-[rgba(214,235,253,0.19)] bg-white px-3 text-black shadow-[0_14px_32px_rgba(255,255,255,0.1)]"
                      : "border-transparent text-[#A1A4A5] hover:text-[#F0F0F0]",
                  )}
                >
                  <CopyPlus className="size-3" />
                  Templates
                </button>
              </div>

              <div className="hidden shrink-0 items-center gap-1.5 2xl:flex">
                <div className="flex items-center gap-1.5 rounded-full px-1">
                  <div className="h-1 w-20 rounded-full bg-white/8">
                    <div className="h-full w-1/2 rounded-full bg-white/16" />
                  </div>
                  <div className="size-4 rounded-full bg-white shadow-[0_10px_24px_rgba(255,255,255,0.18)]" />
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1 2xl:flex-nowrap">
                <div className="hidden shrink-0 items-center gap-1 rounded-[14px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] p-1 xl:flex">
                  {[ImageIcon, Video, Volume2, Wand2].map((Icon, index) => (
                    <button
                      key={index}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-[10px] text-[#A1A4A5] transition-colors hover:bg-white/[0.08] hover:text-[#F0F0F0]",
                        index === 3 && "bg-white/10 text-[#F0F0F0]",
                      )}
                    >
                      <Icon className="size-3" />
                    </button>
                  ))}
                  <button className="flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-white px-2.5 text-[11px] font-semibold tracking-[0.35px] text-black">
                    All
                  </button>
                </div>

                {[Star, Shield, Filter, Grid2X2, Search].map((Icon, index) => (
                  <button
                    key={index}
                    className="flex size-8 items-center justify-center rounded-[12px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] text-[#A1A4A5] transition-colors hover:bg-white/[0.08] hover:text-[#F0F0F0]"
                  >
                    <Icon className="size-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="relative flex-1" />
    </div>
  );
}
