"use client";

import { nanoid } from "nanoid";

import type { GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import type { CanvasInputNode } from "../core/canvas-types";

export function mapHistoryItemToCanvasNode(
  item: GeneratedMediaItem,
  position: { x: number; y: number },
): CanvasInputNode {
  return {
    id: `history-${nanoid(6)}`,
    kind: "input",
    subtype: "history",
    position,
    size: { width: 220, height: 140 },
    data: {
      label: item.prompt || "历史结果",
      prompt: item.prompt,
      mediaKind: item.mediaKind === "video" ? "video" : "image",
      url: item.url,
    },
  };
}
