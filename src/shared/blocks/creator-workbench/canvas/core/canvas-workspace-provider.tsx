"use client";

import type { PropsWithChildren } from "react";

import { CanvasGraphProvider } from "./canvas-graph-store";
import type { CanvasGraph } from "./canvas-types";

export function CanvasWorkspaceProvider({
  initialGraph,
  children,
}: PropsWithChildren<{ initialGraph: CanvasGraph }>) {
  return <CanvasGraphProvider initialGraph={initialGraph}>{children}</CanvasGraphProvider>;
}
