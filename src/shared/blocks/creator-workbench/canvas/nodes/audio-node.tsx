"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasInputNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getAudioNodePresentation(node: CanvasInputNode, copy: CanvasCopy) {
  return {
    eyebrow: "Audio",
    title: node.data.label,
    description: node.data.prompt || copy.nodes.audioDescription,
    badge: "AUD",
    chips: ["音频", "参考"],
    accent: "#9ad8ff",
    tone: "utility" as const,
  };
}
