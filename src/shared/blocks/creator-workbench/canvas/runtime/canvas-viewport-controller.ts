"use client";

import type { CanvasPoint, CanvasViewportState } from "../core/canvas-types";

export function clampCanvasScale(scale: number) {
  return Math.min(2.2, Math.max(0.42, scale));
}

export function worldToScreen(
  viewport: CanvasViewportState,
  point: CanvasPoint,
): CanvasPoint {
  return {
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y,
  };
}

export function screenToWorld(
  viewport: CanvasViewportState,
  point: CanvasPoint,
): CanvasPoint {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  };
}

export function zoomViewportAt(
  viewport: CanvasViewportState,
  point: CanvasPoint,
  nextScale: number,
): CanvasViewportState {
  const scale = clampCanvasScale(nextScale);
  const world = screenToWorld(viewport, point);
  return {
    scale,
    x: point.x - world.x * scale,
    y: point.y - world.y * scale,
  };
}
