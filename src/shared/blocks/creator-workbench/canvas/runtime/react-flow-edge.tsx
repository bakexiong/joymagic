"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type ConnectionLineComponentProps,
  type EdgeProps,
} from "@xyflow/react";
import { Scissors } from "lucide-react";

import type { CanvasEdgeSemantic } from "../core/canvas-types";

const edgeStrokeBySemantic: Record<CanvasEdgeSemantic, string> = {
  reference: "rgba(255,255,255,0.64)",
  derivation: "rgba(255,255,255,0.42)",
  result: "rgba(255,255,255,0.68)",
  control: "rgba(255,255,255,0.42)",
  command: "rgba(255,255,255,0.46)",
};

const HANDLE_VISUAL_OFFSET = 48;
const EDGE_CURVATURE = 0.18;

function getAnchoredX(x: number, position: Position) {
  if (position === Position.Right) return x - HANDLE_VISUAL_OFFSET;
  if (position === Position.Left) return x + HANDLE_VISUAL_OFFSET;
  return x;
}

export function TapnowCanvasEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    data,
  } = props;
  const [isHovered, setIsHovered] = useState(false);
  const semantic = (data?.semantic || "derivation") as CanvasEdgeSemantic;
  const derivationLabel = String(
    (data as { cropLabel?: string } | undefined)?.cropLabel || "",
  )
    .trim()
    .toLowerCase();
  const isCropDerivation =
    semantic === "derivation" &&
    (derivationLabel === "cropped image" || derivationLabel === "trimmed video");
  const removeEdge =
    typeof (data as { onRemove?: unknown } | undefined)?.onRemove === "function"
      ? ((data as { onRemove: (edgeId: string) => void }).onRemove)
      : null;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: getAnchoredX(sourceX, sourcePosition),
    sourceY,
    sourcePosition,
    targetX: getAnchoredX(targetX, targetPosition),
    targetY,
    targetPosition,
    curvature: EDGE_CURVATURE,
  });
  const stroke = selected
    ? "#ffffff"
    : isCropDerivation
      ? "rgba(214,235,253,0.92)"
      : edgeStrokeBySemantic[semantic];
  const strokeOpacity = selected
    ? 1
    : semantic === "command"
      ? 0.42
      : isCropDerivation
        ? 0.92
        : 0.76;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeOpacity,
          strokeWidth: selected ? 2.6 : isCropDerivation ? 1.75 : 1.35,
          strokeLinecap: "round",
          fill: "none",
          transition: "stroke 0.22s ease, stroke-opacity 0.22s ease",
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        pointerEvents="stroke"
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {selected ? (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke="url(#tapnow-edge-flow)"
            strokeLinecap="round"
            strokeWidth={2.4}
            pointerEvents="none"
            className="tapnow-edge-selected-glow"
          />
          <path
            d={edgePath}
            fill="none"
            stroke="rgba(255,255,255,0.96)"
            strokeLinecap="round"
            strokeWidth={1.35}
            strokeDasharray="7 7"
            pointerEvents="none"
            className="tapnow-edge-selected-marquee"
          />
        </>
      ) : null}
      <EdgeLabelRenderer>
        <button
          type="button"
          className={[
            "tapnow-edge-delete-button nodrag nopan",
            isHovered || selected ? "tapnow-edge-delete-button-visible" : "",
          ].join(" ")}
          style={{
            left: labelX,
            top: labelY,
            transform: "translate(-50%, -50%)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            removeEdge?.(id);
          }}
          aria-label="删除连线"
        >
          <Scissors className="size-3.5" />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

export function TapnowConnectionLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) {
  const resolvedFromPosition = fromPosition ?? Position.Right;
  const resolvedToPosition = toPosition ?? Position.Left;
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: resolvedFromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: resolvedToPosition,
    curvature: EDGE_CURVATURE,
  });

  return (
    <path
      d={edgePath}
      fill="none"
      stroke="rgba(255,255,255,0.82)"
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  );
}
