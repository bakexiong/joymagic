"use client";

import type { CanvasCommandType, CanvasNode } from "../core/canvas-types";
import type { getCanvasCopy } from "../canvas-copy";

export type CanvasCommandDefinition = {
  id: CanvasCommandType;
  label: string;
  description: string;
};

type CanvasCopy = ReturnType<typeof getCanvasCopy>;

export function getCanvasCommandDefinition(
  command: CanvasCommandType,
  copy: CanvasCopy,
): CanvasCommandDefinition {
  const definition = copy.commands[command];
  return {
    id: command,
    label: definition.label,
    description: definition.description,
  };
}

export function getAvailableCommandsForNode(node: CanvasNode): CanvasCommandType[] {
  if (node.kind === "text") {
    return ["text-to-image", "text-to-video"];
  }

  if (
    (node.kind === "workflow" &&
      (node.subtype === "text-to-image" || node.subtype === "image-to-image")) ||
    (node.kind === "result" && node.data.mediaKind === "image") ||
    (node.kind === "input" &&
      (node.data.mediaKind === "image" ||
        (!node.data.mediaKind && node.subtype !== "audio")))
  ) {
    return ["image-to-image", "image-to-video"];
  }

  if (node.kind === "result" && node.data.mediaKind === "video") {
    return ["text-to-video"];
  }

  if (
    node.kind === "workflow" &&
    (node.subtype === "text-to-video" || node.subtype === "image-to-video")
  ) {
    return ["text-to-video"];
  }

  return ["text-to-image", "text-to-video", "apply-template"];
}
