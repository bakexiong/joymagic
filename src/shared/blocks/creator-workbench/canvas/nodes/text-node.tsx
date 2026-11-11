"use client";

import type { CanvasTextNode } from "../core/canvas-types";

export function getTextNodePresentation(node: CanvasTextNode) {
  return {
    eyebrow: "Text",
    title: node.data.label || "Text",
    description: node.data.content || "",
    badge: "TXT",
    chips: [],
    accent: "#f4dcc1",
    tone: "text" as const,
  };
}
