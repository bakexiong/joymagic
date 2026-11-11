import { randomUUID } from "crypto";

import type {
  CanvasEdge,
  CanvasGraph,
  CanvasInputNode,
  CanvasNode,
  CanvasTextNode,
  CanvasWorkflowNode,
  CanvasWorkflowSubtype,
} from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import {
  getWorkbenchCanvasProjectById,
  saveWorkbenchCanvasSnapshot,
} from "@/shared/models/workbench-canvas-project";

import type {
  CanvasAgentCreateEdgeOperation,
  CanvasAgentCreateGroupOperation,
  CanvasAgentCreateInputOperation,
  CanvasAgentCreateTextOperation,
  CanvasAgentCreateWorkflowOperation,
  CanvasAgentLayoutOperation,
  CanvasAgentOperation,
  CanvasAgentUpdateWorkflowOperation,
} from "./canvas-agent-plan";

function deriveModelLabel(modelUrl: string) {
  const segment = modelUrl.split("/").filter(Boolean).at(-1) || modelUrl;
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function deriveSceneLabel(subtype: CanvasWorkflowSubtype) {
  if (subtype === "image-to-image") return "图生图";
  if (subtype === "text-to-video") return "文生视频";
  if (subtype === "image-to-video") return "图生视频";
  return "文生图";
}

function deriveSceneId(
  subtype: CanvasWorkflowSubtype,
  preferredModelUrl?: string,
) {
  const suffix = (preferredModelUrl || subtype).replace(/[^\w-]+/g, "-");
  return `canvas-agent-${suffix}`;
}

function createWorkflowNodeFromOperation(
  operation: CanvasAgentCreateWorkflowOperation,
  position: { x: number; y: number },
): CanvasWorkflowNode {
  const modelUrl =
    operation.preferredModelUrl ||
    (operation.subtype === "text-to-video"
      ? "/text-to-video/seedance-1-5-pro"
      : operation.subtype === "image-to-video"
        ? "/image-to-video/seedance-1-5-pro"
        : operation.subtype === "image-to-image"
          ? "/image-to-image/gpt-image-2"
          : "/text-to-image/gpt-image-2");

  return {
    id: `workflow-${randomUUID().slice(0, 8)}`,
    kind: "workflow",
    subtype: operation.subtype,
    position,
    size: { width: 228, height: 228 },
    data: {
      sceneId: deriveSceneId(operation.subtype, operation.preferredModelUrl),
      sceneLabel: deriveSceneLabel(operation.subtype),
      modelUrl,
      modelLabel: deriveModelLabel(modelUrl),
      prompt: operation.prompt,
      aspectRatio: "1:1",
      count: 1,
      settings: {
        prompt: operation.prompt,
        aspectRatio: "1:1",
        count: 1,
      },
      status: "idle",
    },
  };
}

function createInputNodeFromOperation(
  operation: CanvasAgentCreateInputOperation,
  position: { x: number; y: number },
): CanvasInputNode {
  return {
    id: `input-${randomUUID().slice(0, 8)}`,
    kind: "input",
    subtype: "upload",
    position,
    size: { width: 270, height: 270 },
    data: {
      label: operation.label,
      prompt: operation.label,
      mediaKind: operation.mediaKind,
      url: operation.url,
      creationRecordId: operation.assetId,
      status: "success",
    },
  };
}

function createTextNodeFromOperation(
  operation: CanvasAgentCreateTextOperation,
  position: { x: number; y: number },
): CanvasTextNode {
  return {
    id: `text-${randomUUID().slice(0, 8)}`,
    kind: "text",
    subtype: "copy",
    position,
    size: { width: 308, height: 188 },
    data: {
      label: operation.label,
      content: operation.content,
      backgroundColor: "#143022",
    },
  };
}

function addEdgeIfMissing(graph: CanvasGraph, edge: CanvasEdge) {
  const exists = graph.edges.some(
    (item) =>
      item.source === edge.source &&
      item.target === edge.target &&
      item.semantic === edge.semantic,
  );
  if (!exists) {
    graph.edges.push(edge);
  }
}

function findContinueExistingAnchorNodeId(
  operations: CanvasAgentOperation[],
  workflowTempId: string,
) {
  const createsGroupForWorkflow = operations.some(
    (operation) =>
      operation.type === "create-group" &&
      operation.nodeTempIds.includes(workflowTempId),
  );
  if (createsGroupForWorkflow) return null;

  const anchorEdge = operations.find(
    (operation): operation is CanvasAgentCreateEdgeOperation =>
      operation.type === "create-edge" &&
      operation.target.tempId === workflowTempId &&
      typeof operation.source.nodeId === "string" &&
      operation.semantic === "reference",
  );

  return anchorEdge?.source.nodeId || null;
}

export async function applyCanvasAgentOperationsToProject(input: {
  userId: string;
  projectId: string;
  operations: CanvasAgentOperation[];
}) {
  const bundle = await getWorkbenchCanvasProjectById(
    input.projectId,
    input.userId,
  );
  if (!bundle?.snapshot) {
    throw new Error("canvas snapshot not found");
  }

  const nextGraph: CanvasGraph = JSON.parse(
    JSON.stringify(bundle.snapshot.graph),
  );
  const layoutByTempId = new Map<string, { x: number; y: number }>();
  const tempNodeIdMap = new Map<string, string>();
  const tempGroupIdMap = new Map<string, string>();
  const runtimePositionedTempIds = new Set<string>();

  input.operations.forEach((operation) => {
    if (operation.type === "layout") {
      (operation as CanvasAgentLayoutOperation).items.forEach((item) => {
        layoutByTempId.set(item.tempId, item.position);
      });
    }
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "create-workflow") return;

    const workflowOperation = operation as CanvasAgentCreateWorkflowOperation;
    const anchorNodeId = findContinueExistingAnchorNodeId(
      input.operations,
      workflowOperation.tempId,
    );
    const anchorNode = anchorNodeId
      ? nextGraph.nodes.find(
          (node): node is CanvasWorkflowNode =>
            node.id === anchorNodeId && node.kind === "workflow",
        )
      : null;
    const position = anchorNode
      ? {
          x: anchorNode.position.x + anchorNode.size.width + 188,
          y: anchorNode.position.y + 46,
        }
      : layoutByTempId.get(workflowOperation.tempId) || {
          x: 320,
          y: 220,
        };
    const node = createWorkflowNodeFromOperation(workflowOperation, position);
    nextGraph.nodes.push(node);
    tempNodeIdMap.set(workflowOperation.tempId, node.id);
    if (anchorNode) {
      runtimePositionedTempIds.add(workflowOperation.tempId);
    }
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "update-workflow") return;

    const workflowOperation = operation as CanvasAgentUpdateWorkflowOperation;
    const modelUrl =
      workflowOperation.preferredModelUrl ||
      (workflowOperation.subtype === "text-to-video"
        ? "/text-to-video/seedance-1-5-pro"
        : workflowOperation.subtype === "image-to-video"
          ? "/image-to-video/seedance-1-5-pro"
          : workflowOperation.subtype === "image-to-image"
            ? "/image-to-image/gpt-image-2"
            : "/text-to-image/gpt-image-2");

    nextGraph.nodes = nextGraph.nodes.map((node) => {
      if (node.id !== workflowOperation.nodeId || node.kind !== "workflow") {
        return node;
      }

      return {
        ...node,
        subtype: workflowOperation.subtype,
        data: {
          ...node.data,
          sceneId: deriveSceneId(
            workflowOperation.subtype,
            workflowOperation.preferredModelUrl,
          ),
          sceneLabel: deriveSceneLabel(workflowOperation.subtype),
          modelUrl,
          modelLabel: deriveModelLabel(modelUrl),
          prompt: workflowOperation.prompt,
          settings: {
            ...node.data.settings,
            prompt: workflowOperation.prompt,
          },
          status: "idle",
          errorMessage: undefined,
        },
      };
    });
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "create-text") return;

    const textOperation = operation as CanvasAgentCreateTextOperation;
    const workflowTempId = input.operations.find(
      (candidate): candidate is CanvasAgentCreateWorkflowOperation =>
        candidate.type === "create-workflow",
    )?.tempId;
    const anchorNodeId = workflowTempId
      ? findContinueExistingAnchorNodeId(input.operations, workflowTempId)
      : null;
    const anchorNode = anchorNodeId
      ? nextGraph.nodes.find(
          (node): node is CanvasWorkflowNode =>
            node.id === anchorNodeId && node.kind === "workflow",
        )
      : null;
    const position = anchorNode
      ? {
          x: anchorNode.position.x + anchorNode.size.width - 238,
          y: anchorNode.position.y,
        }
      : layoutByTempId.get(textOperation.tempId) || {
          x: 32,
          y: 160,
        };
    const node = createTextNodeFromOperation(textOperation, position);
    nextGraph.nodes.push(node);
    tempNodeIdMap.set(textOperation.tempId, node.id);
    if (anchorNode) {
      runtimePositionedTempIds.add(textOperation.tempId);
    }
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "create-input") return;

    const inputOperation = operation as CanvasAgentCreateInputOperation;
    const existingNode = nextGraph.nodes.find((node) => {
      if (node.kind === "input" || node.kind === "result") {
        return node.data.creationRecordId === inputOperation.assetId;
      }
      return false;
    });

    if (existingNode) {
      tempNodeIdMap.set(inputOperation.tempId, existingNode.id);
      return;
    }

    const position = layoutByTempId.get(inputOperation.tempId) || {
      x: 0,
      y: 0,
    };
    const node = createInputNodeFromOperation(inputOperation, position);
    nextGraph.nodes.push(node);
    tempNodeIdMap.set(inputOperation.tempId, node.id);
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "create-edge") return;

    const edgeOperation = operation as CanvasAgentCreateEdgeOperation;
    const sourceId =
      edgeOperation.source.nodeId ||
      (edgeOperation.source.tempId
        ? tempNodeIdMap.get(edgeOperation.source.tempId)
        : undefined);
    const targetId =
      edgeOperation.target.nodeId ||
      (edgeOperation.target.tempId
        ? tempNodeIdMap.get(edgeOperation.target.tempId)
        : undefined);

    if (!sourceId || !targetId) return;

    addEdgeIfMissing(nextGraph, {
      id: `edge-${randomUUID().slice(0, 8)}`,
      source: sourceId,
      target: targetId,
      semantic: edgeOperation.semantic,
    });
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "layout") return;

    const layoutOperation = operation as CanvasAgentLayoutOperation;
    layoutOperation.items.forEach((item) => {
      if (runtimePositionedTempIds.has(item.tempId)) return;
      const resolvedNodeId = tempNodeIdMap.get(item.tempId);
      if (!resolvedNodeId) return;
      nextGraph.nodes = nextGraph.nodes.map((node) =>
        node.id === resolvedNodeId
          ? {
              ...node,
              position: item.position,
            }
          : node,
      );
    });
  });

  input.operations.forEach((operation) => {
    if (operation.type !== "create-group") return;

    const groupOperation = operation as CanvasAgentCreateGroupOperation;
    const persistedGroupId =
      tempGroupIdMap.get(groupOperation.tempId) ||
      `group-${randomUUID().slice(0, 8)}`;
    tempGroupIdMap.set(groupOperation.tempId, persistedGroupId);
    const resolvedNodeIds = groupOperation.nodeTempIds
      .map((tempId) => tempNodeIdMap.get(tempId))
      .filter((nodeId): nodeId is string => Boolean(nodeId));

    if (resolvedNodeIds.length < 2) return;

    nextGraph.groups = [
      ...(Array.isArray(nextGraph.groups) ? nextGraph.groups : []).filter(
        (group) => group.id !== persistedGroupId,
      ),
      {
        id: persistedGroupId,
        label: groupOperation.label,
        nodeIds: resolvedNodeIds,
      },
    ];

    nextGraph.nodes = nextGraph.nodes.map((node) =>
      resolvedNodeIds.includes(node.id)
        ? {
            ...node,
            groupId: persistedGroupId,
            groupLabel: groupOperation.label,
          }
        : node,
    );
  });

  const lastCreatedWorkflowId = Array.from(tempNodeIdMap.entries())
    .filter(([tempId]) => tempId.startsWith("workflow:"))
    .map(([, nodeId]) => nodeId)
    .at(-1);

  const lastUpdatedWorkflowId = input.operations
    .filter(
      (operation): operation is CanvasAgentUpdateWorkflowOperation =>
        operation.type === "update-workflow",
    )
    .map((operation) => operation.nodeId)
    .at(-1);

  const activeWorkflowNodeId = lastCreatedWorkflowId || lastUpdatedWorkflowId;

  if (activeWorkflowNodeId) {
    nextGraph.selection = { nodeId: activeWorkflowNodeId, edgeId: null };
    nextGraph.composer = {
      ...nextGraph.composer,
      nodeId: activeWorkflowNodeId,
    };
  }

  const snapshot = await saveWorkbenchCanvasSnapshot({
    projectId: input.projectId,
    userId: input.userId,
    graph: nextGraph,
    expectedVersion: bundle.snapshot.version,
    meta:
      bundle.snapshot.meta && typeof bundle.snapshot.meta === "object"
        ? bundle.snapshot.meta
        : undefined,
  });

  return {
    snapshot,
    tempNodeIdMap: Object.fromEntries(tempNodeIdMap.entries()),
  };
}

export async function createCanvasAgentWorkflowFromExecution(input: {
  userId: string;
  projectId: string;
  operations: CanvasAgentOperation[];
}) {
  return applyCanvasAgentOperationsToProject(input);
}
