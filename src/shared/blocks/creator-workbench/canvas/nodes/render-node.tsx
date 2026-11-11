"use client";

import type { getCanvasCopy } from "../canvas-copy";
import type { CanvasNode } from "../core/canvas-types";
import { getAudioNodePresentation } from "./audio-node";
import { getCommandNodePresentation } from "./command-node";
import { getImageNodePresentation } from "./image-node";
import { getResultNodePresentation } from "./result-node";
import { getTemplateNodePresentation } from "./template-node";
import { getTextNodePresentation } from "./text-node";
import { getVideoNodePresentation } from "./video-node";
import { getWorkflowNodePresentation } from "./workflow-node";

export type CanvasNodePresentation = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  chips: string[];
  accent: string;
  thumbnailUrl?: string;
  tone?: "workflow" | "media" | "utility" | "text";
};

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getCanvasNodePresentation(
  node: CanvasNode,
  copy: CanvasCopy,
): CanvasNodePresentation {
  switch (node.kind) {
    case "workflow":
      return getWorkflowNodePresentation(node, copy);
    case "result":
      return getResultNodePresentation(node, copy);
    case "command":
      return getCommandNodePresentation(node, copy);
    case "text":
      return getTextNodePresentation(node);
    case "template":
      return getTemplateNodePresentation(node, copy);
    case "input":
      return node.data.mediaKind === "audio"
        ? getAudioNodePresentation(node, copy)
        : node.data.mediaKind === "video"
        ? getVideoNodePresentation(node, copy)
        : getImageNodePresentation(node, copy);
    default:
      return {
        eyebrow: copy.nodes.defaultEyebrow,
        title: copy.nodes.defaultTitle,
        description: "",
        badge: "NODE",
        chips: [],
        accent: "#f2f4f8",
        tone: "utility",
      };
  }
}
