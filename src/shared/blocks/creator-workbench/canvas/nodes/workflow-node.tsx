"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasWorkflowNode } from "../core/canvas-types";

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getWorkflowNodePresentation(
  node: CanvasWorkflowNode,
  copy: CanvasCopy,
) {
  const titleMap = {
    "text-to-image": "Image",
    "image-to-image": "Image",
    "text-to-video": "Video",
    "image-to-video": "Video",
  } as const;

  return {
    eyebrow: copy.nodes.workflowEyebrow,
    title: titleMap[node.subtype],
    description:
      node.data.prompt?.trim() || copy.nodes.workflowDescription,
    badge:
      node.subtype === "text-to-video" || node.subtype === "image-to-video"
        ? "VID"
        : "IMG",
    chips: [
      node.data.modelLabel,
      node.data.aspectRatio || "Auto",
      node.data.count ? `${node.data.count}x` : "1x",
    ].filter(Boolean),
    accent:
      node.data.status === "error"
        ? "#ff8b8b"
        : node.data.status === "success"
          ? "#7dd3fc"
          : "#f2f4f8",
    tone: "workflow" as const,
  };
}
