"use client";

import type { CanvasEdge, CanvasGraph, CanvasNode } from "../core/canvas-types";

export type CanvasAgentAdapter = {
  readCanvasGraph: () => CanvasGraph;
  readCanvasNodes: () => CanvasNode[];
  createNode: (node: CanvasNode) => void;
  updateNode: (nodeId: string, updater: (node: CanvasNode) => CanvasNode) => void;
  createEdge: (edge: CanvasEdge) => void;
  layoutNodes: () => void;
  groupNodes: () => void;
  focusNode: (nodeId: string) => void;
};
