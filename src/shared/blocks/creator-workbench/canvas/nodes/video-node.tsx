"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasInputNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getVideoNodePresentation(node: CanvasInputNode, copy: CanvasCopy) {
  return {
    eyebrow: "Input",
    title: node.data.label,
    description: node.data.prompt || copy.nodes.videoDescription,
    badge: "VID",
    chips: ["Reference"],
    accent: "#d8d6ff",
    thumbnailUrl: node.data.url,
    tone: "media" as const,
  };
}
