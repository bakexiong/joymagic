"use client";

import { useLocale } from "next-intl";

import { getCanvasCopy } from "../canvas-copy";

export function CanvasReferencePicker({
  onPickHistory,
  onPickTemplate,
}: {
  onPickHistory: () => void;
  onPickTemplate: () => void;
}) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onPickHistory}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/68 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
      >
        {copy.referencePicker.pickHistory}
      </button>
      <button
        type="button"
        onClick={onPickTemplate}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/68 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
      >
        {copy.referencePicker.applyTemplateNode}
      </button>
    </div>
  );
}
