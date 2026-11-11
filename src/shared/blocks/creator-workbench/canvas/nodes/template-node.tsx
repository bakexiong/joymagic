"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasTemplateNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getTemplateNodePresentation(
  node: CanvasTemplateNode,
  copy: CanvasCopy,
) {
  return {
    eyebrow: "Template",
    title: node.data.label,
    description: node.data.prompt || copy.nodes.templateDescription,
    badge: "TPL",
    chips: Object.keys(node.data.params).slice(0, 3),
    accent: "#ffdca8",
    tone: "utility" as const,
  };
}
