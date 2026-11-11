"use client";

import { useMemo } from "react";

import { useCanvasGraphStore } from "./canvas-graph-store";

export function useCanvasGraphState() {
  return useCanvasGraphStore().state;
}

export function useCanvasGraphActions() {
  const { state: _state, ...actions } = useCanvasGraphStore();
  return actions;
}

export function useSelectedNode() {
  const { state } = useCanvasGraphStore();
  return useMemo(
    () => state.nodes.find((node) => node.id === state.selection.nodeId) ?? null,
    [state.nodes, state.selection.nodeId],
  );
}

export function useSelectedWorkflowNode() {
  const node = useSelectedNode();
  return node?.kind === "workflow" ? node : null;
}

export function useCanvasCommandMenu() {
  return useCanvasGraphStore().state.commandMenu;
}
