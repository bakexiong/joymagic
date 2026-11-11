"use client";

import { Image as ImageIcon, Video } from "lucide-react";
import { useLocale } from "next-intl";

import { getCanvasCopy } from "../canvas-copy";
import type { CanvasReferenceItem } from "../core/canvas-types";

export function CanvasContextChip({ item }: { item: CanvasReferenceItem }) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/72">
      {item.kind === "video" ? <Video className="size-3.5" /> : <ImageIcon className="size-3.5" />}
      <span className="max-w-[10rem] truncate">
        {item.label || copy.common.referenceNode}
      </span>
    </div>
  );
}
