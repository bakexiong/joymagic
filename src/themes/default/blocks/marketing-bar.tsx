"use client";

import { Sparkles } from "lucide-react";

import { Link } from "@/core/i18n/navigation";
import { cn } from "@/shared/lib/utils";

export function MarketingBar({ className }: { className?: string }) {
  return (
    <div
      data-marketing-bar
      className={cn(
        "fixed inset-x-0 top-0 z-[1100] h-12 border-b border-fuchsia-400/30 bg-[radial-gradient(circle_at_20%_50%,rgba(236,72,153,0.28),transparent_28%),radial-gradient(circle_at_80%_50%,rgba(251,191,36,0.24),transparent_30%),linear-gradient(90deg,#08080c_0%,#10111a_45%,#120a16_100%)] text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:h-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_25%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.01)_75%,rgba(255,255,255,0.04)_100%)]" />
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-center px-3 sm:px-4 md:px-6">
        <Link
          href="/creator?scene=%2Ftext-to-video&model=happyhorse-1-0"
          className="group relative inline-flex w-full max-w-full min-w-0 items-center justify-center gap-2 rounded-full border border-white/14 bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white transition duration-200 hover:border-white/22 hover:bg-white/[0.07] sm:w-auto sm:gap-2.5 sm:px-3 sm:text-[12px]"
        >
          <span className="inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] text-black shadow-[0_0_18px_rgba(251,191,36,0.35)] sm:px-2 sm:text-[10px]">
            20% OFF
          </span>
          <Sparkles className="hidden size-3.5 text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)] sm:block" />
          <span className="min-w-0">
            <span className="block truncate font-extrabold text-white">
              Happy Horse 1.0
            </span>
            <span className="block truncate text-[9px] font-medium leading-tight text-white/76 sm:hidden">
              Cinematic 16:9 AI video
            </span>
            <span className="hidden text-white/82 sm:inline">
              {" "}
              for cinematic 16:9 video, image animation, and faster motion-led
              storytelling
            </span>
          </span>
          <span className="shrink-0 text-amber-300 transition group-hover:translate-x-0.5 group-hover:text-amber-200">
            <span className="sm:hidden">Try</span>
            <span className="hidden sm:inline">Try now</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
