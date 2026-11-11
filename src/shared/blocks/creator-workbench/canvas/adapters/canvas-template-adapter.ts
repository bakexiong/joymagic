"use client";

import { nanoid } from "nanoid";

import type { WorkbenchTemplateItem } from "@/shared/lib/workbench-template-catalog";
import type { CanvasTemplateNode } from "../core/canvas-types";

export function mapTemplateToCanvasNode(
  template: WorkbenchTemplateItem,
  position: { x: number; y: number },
): CanvasTemplateNode {
  return {
    id: `template-${template.id}-${nanoid(4)}`,
    kind: "template",
    subtype: "template",
    position,
    size: { width: 250, height: 150 },
    data: {
      templateId: template.id,
      label: template.sceneLabel || "模板节点",
      prompt: template.prompt,
      params: template.params,
    },
  };
}
