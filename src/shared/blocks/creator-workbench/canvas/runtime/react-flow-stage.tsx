"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import type {
  CanvasEdge,
  CanvasImageToolRequest,
  CanvasNode,
  CanvasViewportState,
} from "../core/canvas-types";
import type {
  CanvasVideoSegmentationInvocation,
  CanvasVideoSegmentationResult,
} from "@/shared/lib/canvas-video-segmentation";
import type { CanvasVideoUpscaleInvocation } from "@/shared/lib/canvas-video-upscaler";
import { TapnowCanvasEdge, TapnowConnectionLine } from "./react-flow-edge";
import { TapnowCanvasNode, type TapnowNodeData } from "./react-flow-node";

type GroupFrameNodeData = {
  groupId: string;
  label: string;
};

type ReactFlowStageProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewportState;
  selectedNodeId: string | null;
  referenceSelection?: {
    active: boolean;
    anchorNodeId?: string;
    eligibleNodeIds: string[];
    pickedNodeIds: string[];
  } | null;
  onNodeSelect: (nodeId: string) => void;
  onPaneSelect: () => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onGroupMove: (groupId: string, delta: { x: number; y: number }) => void;
  onNodeCommand: (
    nodeId: string,
    side: "left" | "right",
    position: { x: number; y: number },
  ) => void;
  onNodeContextMenu: (
    nodeId: string,
    position: { x: number; y: number },
  ) => void;
  onNodeTitleChange: (nodeId: string, title: string) => void;
  onTextChange: (nodeId: string, content: string) => void;
  onTextBackgroundChange: (nodeId: string, backgroundColor?: string) => void;
  onImageUpload: (nodeId: string, file: File) => Promise<void>;
  onImageCrop: (nodeId: string, file: File) => Promise<void>;
  onVideoTrim: (
    nodeId: string,
    file: File,
    meta: { trimStart: number; trimEnd: number; duration: number },
  ) => Promise<void>;
  onVideoSegmentation: (
    nodeId: string,
    request: CanvasVideoSegmentationInvocation,
  ) => Promise<CanvasVideoSegmentationResult>;
  onVideoUpscale: (
    nodeId: string,
    request: CanvasVideoUpscaleInvocation,
  ) => Promise<void>;
  onImageToolAction: (request: CanvasImageToolRequest) => Promise<void>;
  onConnectNodes: (
    sourceId: string,
    targetId: string,
    handles?: {
      sourceHandle?: string | null;
      targetHandle?: string | null;
    },
  ) => void;
  isConnectionAllowed: (
    sourceId: string,
    targetId: string,
    handles?: {
      sourceHandle?: string | null;
      targetHandle?: string | null;
    },
  ) => boolean;
  onRemoveEdge: (edgeId: string) => void;
  onViewportChange: (viewport: CanvasViewportState) => void;
  onConnectionModeChange?: (active: boolean) => void;
};

const nodeTypes = {
  groupFrame: function GroupFrameNode({
    data,
    selected,
  }: NodeProps<Node<Record<string, unknown>>>) {
    const label =
      typeof data?.label === "string" && data.label.trim().length > 0
        ? data.label
        : "创作分组";
    return (
      <div
        className={[
          "pointer-events-none relative h-full w-full rounded-[28px] border bg-white/8 backdrop-blur-[1px]",
          selected
            ? "border-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.28)]"
            : "border-white/20",
        ].join(" ")}
      >
        <div className="absolute left-6 top-5 z-10 max-w-[calc(100%-3rem)] rounded-full border border-white/12 bg-black/28 px-3 py-1 text-[12px] font-medium text-white/82 backdrop-blur">
          <span className="truncate">{label}</span>
        </div>
      </div>
    );
  },
  image: TapnowCanvasNode,
  video: TapnowCanvasNode,
  text: TapnowCanvasNode,
  command: TapnowCanvasNode,
  template: TapnowCanvasNode,
  audio: TapnowCanvasNode,
};

const edgeTypes = {
  tapnowCanvasEdge: TapnowCanvasEdge,
};

function getFlowNodeType(node: CanvasNode): Node["type"] {
  if (node.kind === "text") return "text";
  if (node.kind === "command") return "command";
  if (node.kind === "template") return "template";

  if (
    (node.kind === "workflow" &&
      (node.subtype === "text-to-video" ||
        node.subtype === "image-to-video")) ||
    (node.kind === "result" && node.data.mediaKind === "video") ||
    (node.kind === "input" && node.data.mediaKind === "video")
  ) {
    return "video";
  }

  if (node.kind === "input" && node.data.mediaKind === "audio") {
    return "audio";
  }

  return "image";
}

function isLeftHandleMenuNode(node: CanvasNode) {
  return getFlowNodeType(node) === "image";
}

function getFlowEdge(edge: CanvasEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: "right",
    targetHandle: "left",
    type: "tapnowCanvasEdge",
    selectable: true,
    data: {
      semantic: edge.semantic,
      cropLabel: edge.id.includes("edge-crop-")
        ? "Cropped image"
        : edge.id.includes("edge-trim-")
          ? "Trimmed video"
          : undefined,
    },
  };
}

function ReactFlowStageInner({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  referenceSelection,
  onNodeSelect,
  onPaneSelect,
  onNodeMove,
  onGroupMove,
  onNodeCommand,
  onNodeContextMenu,
  onNodeTitleChange,
  onTextChange,
  onTextBackgroundChange,
  onImageUpload,
  onImageCrop,
  onVideoTrim,
  onVideoSegmentation,
  onVideoUpscale,
  onImageToolAction,
  onConnectNodes,
  isConnectionAllowed,
  onRemoveEdge,
  onViewportChange,
  onConnectionModeChange,
}: ReactFlowStageProps) {
  const reactFlow = useReactFlow();
  const connectionStartRef = useRef<{
    nodeId: string | null;
    handleType: string | null;
    handleId: string | null;
  } | null>(null);
  const connectionSucceededRef = useRef(false);
  const viewportSyncRef = useRef(viewport);
  const isNodeDraggingRef = useRef(false);
  const activeGroupDragRef = useRef<{
    groupId: string;
    startPosition: { x: number; y: number };
    memberPositions: Map<string, { x: number; y: number }>;
  } | null>(null);
  const activeConnectionTargetIdRef = useRef<string | null>(null);
  const connectionDragStartPointRef = useRef<{ x: number; y: number } | null>(
    null,
  );
  const [activeConnectionTargetId, setActiveConnectionTargetId] = useState<
    string | null
  >(null);
  const [activeConnectionTargetSide, setActiveConnectionTargetSide] = useState<
    "left" | "right" | null
  >(null);
  const [connectionStartState, setConnectionStartState] = useState<{
    nodeId: string | null;
    handleType: string | null;
    handleId: string | null;
  } | null>(null);
  const suppressNextNodeSelectRef = useRef(false);

  const clearConnectionStart = useCallback(() => {
    connectionStartRef.current = null;
    activeConnectionTargetIdRef.current = null;
    connectionDragStartPointRef.current = null;
    setActiveConnectionTargetId(null);
    setActiveConnectionTargetSide(null);
    setConnectionStartState(null);
  }, []);

  const primeConnectionStart = useCallback(
    (
      nodeId: string,
      side: "left" | "right",
      point?: { x: number; y: number },
    ) => {
      suppressNextNodeSelectRef.current = true;
      connectionSucceededRef.current = false;
      const nextState = {
        nodeId,
        handleType: side === "left" ? "target" : "source",
        handleId: side,
      };
      connectionStartRef.current = nextState;
      connectionDragStartPointRef.current = point ?? null;
      setConnectionStartState(nextState);
    },
    [],
  );

  const handleNodeCommand = useCallback(
    (
      nodeId: string,
      side: "left" | "right",
      position: { x: number; y: number },
    ) => {
      clearConnectionStart();
      onNodeCommand(nodeId, side, position);
    },
    [clearConnectionStart, onNodeCommand],
  );

  const resolvePendingConnection = useCallback((hoveredNodeId: string) => {
    const start = connectionStartRef.current;
    if (!start?.nodeId || start.nodeId === hoveredNodeId) return null;

    return start.handleId === "left" || start.handleType === "target"
      ? {
          sourceId: hoveredNodeId,
          targetId: start.nodeId,
          handles: {
            sourceHandle: "right" as const,
            targetHandle: "left" as const,
          },
        }
      : {
          sourceId: start.nodeId,
          targetId: hoveredNodeId,
          handles: {
            sourceHandle: "right" as const,
            targetHandle: "left" as const,
          },
        };
  }, []);

  const shouldOpenMenuFromConnectionStart = useCallback(
    (
      start:
        | {
            nodeId: string | null;
            handleType: string | null;
            handleId: string | null;
          }
        | null
        | undefined,
    ) => {
      if (!start?.nodeId) return false;
      if (!(start.handleId === "left" || start.handleType === "target"))
        return false;
      const startNode = nodes.find((node) => node.id === start.nodeId);
      return Boolean(startNode && isLeftHandleMenuNode(startNode));
    },
    [nodes],
  );

  const getConnectionTargetSide = useCallback(() => {
    const start = connectionStartRef.current;
    return start?.handleId === "left" || start?.handleType === "target"
      ? "right"
      : "left";
  }, []);

  const isPointInsideHandleZone = useCallback(
    (
      point: { x: number; y: number },
      node: CanvasNode,
      side: "left" | "right",
    ) => {
      const handleZoneSize = 96;
      const half = handleZoneSize / 2;
      const centerX =
        side === "left"
          ? node.position.x - half
          : node.position.x + node.size.width + half;
      const centerY = node.position.y + node.size.height / 2;

      return (
        point.x >= centerX - half &&
        point.x <= centerX + half &&
        point.y >= centerY - half &&
        point.y <= centerY + half
      );
    },
    [],
  );

  useEffect(() => {
    viewportSyncRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    const current = reactFlow.getViewport();
    if (
      Math.abs(current.x - viewport.x) < 0.5 &&
      Math.abs(current.y - viewport.y) < 0.5 &&
      Math.abs(current.zoom - viewport.scale) < 0.005
    ) {
      return;
    }

    void reactFlow.setViewport(
      { x: viewport.x, y: viewport.y, zoom: viewport.scale },
      { duration: 0 },
    );
  }, [reactFlow, viewport]);

  const groupedNodes = useMemo(() => {
    const groups = new Map<string, { label: string; members: CanvasNode[] }>();

    nodes.forEach((node) => {
      if (!node.groupId || !node.groupLabel) return;
      const entry = groups.get(node.groupId);
      if (entry) {
        entry.members.push(node);
        return;
      }
      groups.set(node.groupId, {
        label: node.groupLabel,
        members: [node],
      });
    });

    return groups;
  }, [nodes]);

  const groupFrameMetrics = useMemo(() => {
    const metrics = new Map<
      string,
      {
        groupId: string;
        position: { x: number; y: number };
        size: { width: number; height: number };
        label: string;
      }
    >();

    groupedNodes.forEach((group, groupId) => {
      if (group.members.length < 2) return;

      const minX = Math.min(...group.members.map((node) => node.position.x));
      const minY = Math.min(...group.members.map((node) => node.position.y));
      const maxX = Math.max(
        ...group.members.map((node) => node.position.x + node.size.width),
      );
      const maxY = Math.max(
        ...group.members.map((node) => node.position.y + node.size.height),
      );

      const paddingX = 40;
      const paddingTop = 88;
      const paddingBottom = 28;

      metrics.set(`group-frame:${groupId}`, {
        groupId,
        label: group.label,
        position: {
          x: minX - paddingX,
          y: minY - paddingTop,
        },
        size: {
          width: maxX - minX + paddingX * 2,
          height: maxY - minY + paddingTop + paddingBottom,
        },
      });
    });

    return metrics;
  }, [groupedNodes]);

  const mappedFlowNodes = useMemo<Node<Record<string, unknown>>[]>(() => {
    const groupFrameNodes: Node<Record<string, unknown>>[] = Array.from(
      groupFrameMetrics.entries(),
    ).map(([frameId, frame]) => {
      return {
        id: frameId,
        type: "groupFrame",
        position: frame.position,
        data: {
          groupId: frame.groupId,
          label: frame.label,
        },
        draggable: true,
        selectable: false,
        focusable: false,
        deletable: false,
        style: {
          width: frame.size.width,
          height: frame.size.height,
          zIndex: 0,
        },
      } satisfies Node<Record<string, unknown>>;
    });

    const contentNodes: Node<Record<string, unknown>>[] = nodes.map((node) => ({
      data: (() => {
        const pendingConnection = connectionStartState?.nodeId
          ? resolvePendingConnection(node.id)
          : null;
        const isConnectionCandidate = pendingConnection
          ? isConnectionAllowed(
              pendingConnection.sourceId,
              pendingConnection.targetId,
              pendingConnection.handles,
            )
          : false;

        return {
          canvasNode: node,
          selectedNodeId,
          isReferenceSelectionActive: Boolean(referenceSelection?.active),
          isReferenceSelectionEligible: Boolean(
            referenceSelection?.eligibleNodeIds.includes(node.id),
          ),
          isReferenceSelectionPicked: Boolean(
            referenceSelection?.pickedNodeIds.includes(node.id),
          ),
          isReferenceSelectionAnchor:
            referenceSelection?.anchorNodeId === node.id,
          isConnectionModeActive: Boolean(connectionStartState?.nodeId),
          isConnectionAnchor: connectionStartState?.nodeId === node.id,
          isConnectionCandidate,
          isConnectionTargetActive: activeConnectionTargetId === node.id,
          connectionTargetSide:
            activeConnectionTargetId === node.id
              ? activeConnectionTargetSide
              : null,
          hasReferenceInput: edges.some(
            (edge) => edge.target === node.id && edge.semantic === "reference",
          ),
          onHandlePointerDown: primeConnectionStart,
          onNodeCommand: handleNodeCommand,
          onNodeTitleChange,
          onTextChange,
          onTextBackgroundChange,
          onImageUpload,
          onImageCrop,
          onVideoTrim,
          onVideoSegmentation,
          onVideoUpscale,
          onImageToolAction,
        };
      })(),
      id: node.id,
      type: getFlowNodeType(node),
      position: node.position,
      selected: selectedNodeId === node.id,
      draggable: true,
      selectable: true,
    }));

    return [...groupFrameNodes, ...contentNodes];
  }, [
    nodes,
    edges,
    connectionStartState,
    resolvePendingConnection,
    isConnectionAllowed,
    handleNodeCommand,
    onNodeTitleChange,
    onImageToolAction,
    onTextBackgroundChange,
    onTextChange,
    onImageCrop,
    onImageUpload,
    onVideoSegmentation,
    onVideoUpscale,
    onVideoTrim,
    primeConnectionStart,
    activeConnectionTargetId,
    activeConnectionTargetSide,
    groupFrameMetrics,
    referenceSelection?.active,
    referenceSelection?.eligibleNodeIds,
    referenceSelection?.pickedNodeIds,
    selectedNodeId,
  ]);

  useEffect(() => {
    onConnectionModeChange?.(Boolean(connectionStartState?.nodeId));
  }, [connectionStartState?.nodeId, onConnectionModeChange]);

  useEffect(() => {
    if (!connectionStartState?.nodeId) {
      activeConnectionTargetIdRef.current = null;
      setActiveConnectionTargetId(null);
      setActiveConnectionTargetSide(null);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const point = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const targetSide = getConnectionTargetSide();

      const hoveredNode = [...nodes].reverse().find((node) => {
        return isPointInsideHandleZone(point, node, targetSide);
      });

      if (!hoveredNode) {
        activeConnectionTargetIdRef.current = null;
        setActiveConnectionTargetId(null);
        setActiveConnectionTargetSide(null);
        return;
      }

      const pendingConnection = resolvePendingConnection(hoveredNode.id);
      if (!pendingConnection) {
        activeConnectionTargetIdRef.current = null;
        setActiveConnectionTargetId(null);
        setActiveConnectionTargetSide(null);
        return;
      }

      const isAllowed = isConnectionAllowed(
        pendingConnection.sourceId,
        pendingConnection.targetId,
        pendingConnection.handles,
      );
      activeConnectionTargetIdRef.current = isAllowed ? hoveredNode.id : null;
      setActiveConnectionTargetId(isAllowed ? hoveredNode.id : null);
      setActiveConnectionTargetSide(isAllowed ? targetSide : null);
    };

    const clearActiveTarget = (event: PointerEvent) => {
      const start = connectionStartRef.current;
      const dragStartPoint = connectionDragStartPointRef.current;
      const dragDistance = dragStartPoint
        ? Math.hypot(
            event.clientX - dragStartPoint.x,
            event.clientY - dragStartPoint.y,
          )
        : 0;
      const shouldForceMenu = shouldOpenMenuFromConnectionStart(start);
      const shouldOpenCommand =
        Boolean(start?.nodeId) &&
        !connectionSucceededRef.current &&
        dragDistance > 12 &&
        (shouldForceMenu || activeConnectionTargetIdRef.current === null);

      if (shouldOpenCommand && start?.nodeId) {
        const point = reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        connectionSucceededRef.current = true;
        handleNodeCommand(
          start.nodeId,
          start.handleId === "left" || start.handleType === "target"
            ? "left"
            : "right",
          point,
        );
        return;
      }

      activeConnectionTargetIdRef.current = null;
      setActiveConnectionTargetId(null);
      setActiveConnectionTargetSide(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", clearActiveTarget);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", clearActiveTarget);
    };
  }, [
    connectionStartState,
    getConnectionTargetSide,
    handleNodeCommand,
    isConnectionAllowed,
    isPointInsideHandleZone,
    nodes,
    reactFlow,
    resolvePendingConnection,
    shouldOpenMenuFromConnectionStart,
  ]);

  const mappedFlowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        ...getFlowEdge(edge),
        data: {
          ...getFlowEdge(edge).data,
          onRemove: onRemoveEdge,
        },
      })),
    [edges, onRemoveEdge],
  );
  const [flowNodes, setFlowNodes, onNodesChangeBase] =
    useNodesState<Node<Record<string, unknown>>>(mappedFlowNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] =
    useEdgesState(mappedFlowEdges);

  useEffect(() => {
    if (isNodeDraggingRef.current) return;
    setFlowNodes(mappedFlowNodes);
  }, [mappedFlowNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(mappedFlowEdges);
  }, [mappedFlowEdges, setFlowEdges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (shouldOpenMenuFromConnectionStart(connectionStartRef.current)) {
        return;
      }
      connectionSucceededRef.current = true;
      if (!connection.source || !connection.target) return;
      const handles = {
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      if (!isConnectionAllowed(connection.source, connection.target, handles))
        return;
      onConnectNodes(connection.source, connection.target, handles);
    },
    [isConnectionAllowed, onConnectNodes, shouldOpenMenuFromConnectionStart],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<Record<string, unknown>>>[]) => {
      let shouldClearSelectSuppression = false;
      const safeChanges = changes.filter((change) => {
        if (change.type === "remove") return false;
        if (
          suppressNextNodeSelectRef.current &&
          change.type === "select" &&
          change.selected
        ) {
          shouldClearSelectSuppression = true;
          return false;
        }
        return true;
      });
      if (shouldClearSelectSuppression) {
        suppressNextNodeSelectRef.current = false;
      }
      if (safeChanges.length === 0) return;
      onNodesChangeBase(safeChanges);
    },
    [onNodesChangeBase],
  );

  return (
    <div className="absolute inset-0 tapnow-flow">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.18}
        maxZoom={2.4}
        defaultViewport={{
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.scale,
        }}
        panOnDrag
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elevateNodesOnSelect
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineComponent={TapnowConnectionLine}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.id.startsWith("group-frame:")) {
            return;
          }
          if (suppressNextNodeSelectRef.current) {
            suppressNextNodeSelectRef.current = false;
            return;
          }
          onNodeSelect(node.id);
        }}
        onNodeContextMenu={(event, node) => {
          if (node.id.startsWith("group-frame:")) {
            return;
          }
          event.preventDefault();
          suppressNextNodeSelectRef.current = false;
          onNodeSelect(node.id);
          onNodeContextMenu(node.id, {
            x: event.clientX,
            y: event.clientY,
          });
        }}
        onPaneClick={() => {
          if (connectionStartRef.current) {
            return;
          }
          suppressNextNodeSelectRef.current = false;
          clearConnectionStart();
          onPaneSelect();
        }}
        onNodeDragStart={(_, node) => {
          isNodeDraggingRef.current = true;
          if (!node.id.startsWith("group-frame:")) {
            activeGroupDragRef.current = null;
            return;
          }
          const frame = groupFrameMetrics.get(node.id);
          if (!frame) {
            activeGroupDragRef.current = null;
            return;
          }
          const group = groupedNodes.get(frame.groupId);
          if (!group) {
            activeGroupDragRef.current = null;
            return;
          }
          activeGroupDragRef.current = {
            groupId: frame.groupId,
            startPosition: { ...frame.position },
            memberPositions: new Map(
              group.members.map((member) => [
                member.id,
                { ...member.position },
              ]),
            ),
          };
        }}
        onNodeDrag={(_, node) => {
          if (!node.id.startsWith("group-frame:")) {
            return;
          }
          const activeDrag = activeGroupDragRef.current;
          if (!activeDrag) {
            return;
          }
          const delta = {
            x: node.position.x - activeDrag.startPosition.x,
            y: node.position.y - activeDrag.startPosition.y,
          };
          if (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5) {
            return;
          }
          setFlowNodes((currentNodes) =>
            currentNodes.map((currentNode) => {
              if (currentNode.id === node.id) {
                return {
                  ...currentNode,
                  position: node.position,
                };
              }
              const baseMemberPosition = activeDrag.memberPositions.get(
                currentNode.id,
              );
              if (!baseMemberPosition) {
                return currentNode;
              }
              return {
                ...currentNode,
                position: {
                  x: baseMemberPosition.x + delta.x,
                  y: baseMemberPosition.y + delta.y,
                },
              };
            }),
          );
        }}
        onNodeDragStop={(_, node) => {
          isNodeDraggingRef.current = false;
          if (node.id.startsWith("group-frame:")) {
            const activeDrag = activeGroupDragRef.current;
            if (activeDrag) {
              const delta = {
                x: node.position.x - activeDrag.startPosition.x,
                y: node.position.y - activeDrag.startPosition.y,
              };
              if (Math.abs(delta.x) >= 0.5 || Math.abs(delta.y) >= 0.5) {
                onGroupMove(activeDrag.groupId, delta);
              }
            }
            activeGroupDragRef.current = null;
            return;
          }
          activeGroupDragRef.current = null;
          onNodeMove(node.id, node.position);
        }}
        onConnect={handleConnect}
        isValidConnection={(connection) =>
          Boolean(
            connection.source &&
            connection.target &&
            isConnectionAllowed(connection.source, connection.target, {
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
            }),
          )
        }
        onConnectStart={(_, params) => {
          connectionSucceededRef.current = false;
          setActiveConnectionTargetId(null);
          setActiveConnectionTargetSide(null);
          connectionStartRef.current = {
            nodeId: params.nodeId,
            handleType: params.handleType,
            handleId: params.handleId,
          };
          setConnectionStartState({
            nodeId: params.nodeId,
            handleType: params.handleType,
            handleId: params.handleId,
          });
        }}
        onConnectEnd={(event) => {
          const start = connectionStartRef.current;
          clearConnectionStart();
          if (!start?.nodeId || connectionSucceededRef.current) return;

          const pointSource =
            "changedTouches" in event && event.changedTouches?.length
              ? event.changedTouches[0]
              : event;
          if (!("clientX" in pointSource) || !("clientY" in pointSource))
            return;
          const point = reactFlow.screenToFlowPosition({
            x: pointSource.clientX,
            y: pointSource.clientY,
          });
          onNodeCommand(
            start.nodeId,
            start.handleId === "left" || start.handleType === "target"
              ? "left"
              : "right",
            point,
          );
        }}
        onMove={(_, nextViewport) => {
          const normalized = {
            x: nextViewport.x,
            y: nextViewport.y,
            scale: nextViewport.zoom,
          };
          const current = viewportSyncRef.current;
          if (
            Math.abs(current.x - normalized.x) < 0.5 &&
            Math.abs(current.y - normalized.y) < 0.5 &&
            Math.abs(current.scale - normalized.scale) < 0.005
          ) {
            return;
          }
          onViewportChange(normalized);
        }}
      >
        <svg width="0" height="0">
          <defs>
            <linearGradient
              id="tapnow-edge-flow"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>
        <Background
          id="tapnow-dot-grid"
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.4}
          color="rgba(255,255,255,0.13)"
        />
      </ReactFlow>
    </div>
  );
}

export function ReactFlowStage(props: ReactFlowStageProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowStageInner {...props} />
    </ReactFlowProvider>
  );
}
