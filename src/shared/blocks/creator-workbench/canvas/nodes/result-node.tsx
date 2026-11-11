"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasResultNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getResultNodePresentation(node: CanvasResultNode, copy: CanvasCopy) {
  return {
    eyebrow: node.data.mediaKind === "video" ? "Video" : "Image",
    title: node.data.prompt || copy.nodes.resultTitle,
    description:
      node.data.mediaKind === "video"
        ? "这个结果可以继续作为视频工作流的输入。"
        : "这个结果可以继续作为参考图或派生起点。",
    badge: node.data.mediaKind === "video" ? "VID" : "IMG",
    chips: [node.data.aspectRatio || "Auto", "继续创作"],
    accent: "#d8e1ff",
    thumbnailUrl: node.data.url,
    tone: "media" as const,
  };
}
