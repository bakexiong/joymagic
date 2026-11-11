"use client";

import { HelpCircle, LocateFixed, PanelsTopLeft } from "lucide-react";

type CanvasBottomControlsProps = {
  scale: number;
  onZoomChange: (scale: number) => void;
};

export function CanvasBottomControls({
  scale,
  onZoomChange,
}: CanvasBottomControlsProps) {
  return (
    <div className="absolute bottom-5 left-6 z-20 flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(20,22,27,0.92)] px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full bg-white/[0.04] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
        >
          <PanelsTopLeft className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full bg-white/[0.04] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
        >
          <LocateFixed className="size-4" />
        </button>
        <input
          type="range"
          min={0.42}
          max={2.2}
          step={0.02}
          value={scale}
          onChange={(event) => onZoomChange(Number(event.target.value))}
        />
      </div>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(20,22,27,0.92)] text-white/60 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl transition hover:border-white/18 hover:text-white"
      >
        <HelpCircle className="size-4" />
      </button>
    </div>
  );
}
