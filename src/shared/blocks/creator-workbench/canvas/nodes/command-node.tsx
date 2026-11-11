"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasCommandNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getCommandNodePresentation(
  node: CanvasCommandNode,
  copy: CanvasCopy,
) {
  return {
    eyebrow: copy.nodes.commandEyebrow,
    title: copy.nodes.commandTitle,
    description: copy.nodes.commandDescription,
    badge: "CMD",
    chips: node.data.commands.slice(0, 2).map((item) => item.replaceAll("-", " ")),
    accent: "#f8f1c6",
    tone: "utility" as const,
  };
}
