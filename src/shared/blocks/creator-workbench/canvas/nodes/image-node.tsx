"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasInputNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getImageNodePresentation(node: CanvasInputNode, copy: CanvasCopy) {
  return {
    eyebrow: "Input",
    title: node.data.label,
    description: node.data.prompt || copy.nodes.imageDescription,
    badge: "IMG",
    chips: ["Reference"],
    accent: "#d3f4ea",
    thumbnailUrl: node.data.url,
    tone: "media" as const,
  };
}
