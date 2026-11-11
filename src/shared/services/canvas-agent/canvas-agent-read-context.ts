import type {
  CanvasEdge,
  CanvasGraph,
  CanvasNode,
} from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import { getWorkbenchCanvasProjectById } from "@/shared/models/workbench-canvas-project";

export type CanvasAgentReferenceableNode = {
  nodeId: string;
  kind: CanvasNode["kind"];
  subtype?: string;
  label: string;
  mediaKind?: "image" | "video" | "audio";
  assetId?: string;
  url?: string;
  prompt?: string;
};

export type CanvasAgentSelectionContext = {
  selectedNodeIds: string[];
  nodes: CanvasAgentReferenceableNode[];
  upstreamNodeIds: string[];
};

export type CanvasAgentEditableWorkflowNode = {
  nodeId: string;
  label: string;
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  prompt?: string;
};

function normalizeNodeLabel(node: CanvasNode) {
  if (
    "title" in node.data &&
    typeof node.data.title === "string" &&
    node.data.title.trim()
  ) {
    return node.data.title.trim();
  }

  if (node.kind === "workflow") {
    return node.data.sceneLabel || node.data.modelLabel || "工作流节点";
  }
  if (node.kind === "result") {
    return node.data.prompt || node.data.title || "结果节点";
  }
  if (node.kind === "input") {
    return node.data.label || node.data.title || "参考输入";
  }
  if (node.kind === "text") {
    return node.data.label || node.data.content || "文本节点";
  }
  if (node.kind === "template") {
    return node.data.label || node.data.title || "模板节点";
  }

  return "画布节点";
}

function toReferenceableNode(node: CanvasNode): CanvasAgentReferenceableNode {
  if (node.kind === "result") {
    return {
      nodeId: node.id,
      kind: node.kind,
      subtype: node.subtype,
      label: normalizeNodeLabel(node),
      mediaKind: node.data.mediaKind,
      assetId: node.data.creationRecordId,
      url: node.data.url,
      prompt: node.data.prompt,
    };
  }

  if (node.kind === "input") {
    return {
      nodeId: node.id,
      kind: node.kind,
      subtype: node.subtype,
      label: normalizeNodeLabel(node),
      mediaKind: node.data.mediaKind,
      assetId: node.data.creationRecordId,
      url: node.data.url,
      prompt: node.data.prompt,
    };
  }

  if (node.kind === "workflow") {
    return {
      nodeId: node.id,
      kind: node.kind,
      subtype: node.subtype,
      label: normalizeNodeLabel(node),
      mediaKind: node.subtype?.includes("video") ? "video" : "image",
      url: node.data.generatedVideoUrl || node.data.generatedImageUrl,
      assetId: node.data.generatedCreationRecordId,
      prompt: node.data.prompt,
    };
  }

  return {
    nodeId: node.id,
    kind: node.kind,
    subtype: node.subtype,
    label: normalizeNodeLabel(node),
  };
}

function collectUpstreamNodeIds(
  edges: CanvasEdge[],
  selectedNodeIds: string[],
) {
  const selected = new Set(selectedNodeIds);
  return Array.from(
    new Set(
      edges
        .filter((edge) => selected.has(edge.target))
        .map((edge) => edge.source)
        .filter(Boolean),
    ),
  );
}

function listReferenceableNodesFromGraph(graph: CanvasGraph) {
  return graph.nodes
    .filter((node) => {
      if (node.kind === "result") return true;
      if (node.kind === "input") return true;
      if (node.kind === "workflow") return true;
      return false;
    })
    .map(toReferenceableNode);
}

export async function getCanvasAgentProjectContext(input: {
  userId: string;
  projectId: string;
}) {
  const projectBundle = await getWorkbenchCanvasProjectById(
    input.projectId,
    input.userId,
  );

  if (!projectBundle) {
    throw new Error("canvas project not found");
  }

  return projectBundle;
}

export async function getCanvasAgentSnapshotContext(input: {
  userId: string;
  projectId: string;
}) {
  const projectBundle = await getCanvasAgentProjectContext(input);
  return projectBundle.snapshot;
}

export async function listCanvasAgentReferenceableNodes(input: {
  userId: string;
  projectId: string;
}) {
  const snapshot = await getCanvasAgentSnapshotContext(input);
  if (!snapshot) return [];
  return listReferenceableNodesFromGraph(snapshot.graph);
}

export async function getCanvasAgentSelectionContext(input: {
  userId: string;
  projectId: string;
  selectedNodeIds?: string[];
}) {
  const snapshot = await getCanvasAgentSnapshotContext(input);
  if (!snapshot) {
    return {
      selectedNodeIds: [],
      nodes: [],
      upstreamNodeIds: [],
    } satisfies CanvasAgentSelectionContext;
  }

  const selectedNodeIds =
    input.selectedNodeIds && input.selectedNodeIds.length > 0
      ? input.selectedNodeIds
      : snapshot.graph.selection.nodeId
        ? [snapshot.graph.selection.nodeId]
        : [];

  const selectedNodeSet = new Set(selectedNodeIds);
  const nodes = snapshot.graph.nodes
    .filter((node) => selectedNodeSet.has(node.id))
    .map(toReferenceableNode);

  return {
    selectedNodeIds,
    nodes,
    upstreamNodeIds: collectUpstreamNodeIds(
      snapshot.graph.edges,
      selectedNodeIds,
    ),
  } satisfies CanvasAgentSelectionContext;
}

export async function listCanvasAgentEditableWorkflowNodes(input: {
  userId: string;
  projectId: string;
}) {
  const snapshot = await getCanvasAgentSnapshotContext(input);
  if (!snapshot) return [] satisfies CanvasAgentEditableWorkflowNode[];

  return snapshot.graph.nodes.flatMap<CanvasAgentEditableWorkflowNode>(
    (node) => {
      if (node.kind !== "workflow") return [];
      const hasGeneratedOutput = Boolean(
        node.data.generatedCreationRecordId ||
        node.data.generatedImageUrl ||
        node.data.generatedVideoUrl,
      );
      if (!hasGeneratedOutput) return [];

      return [
        {
          nodeId: node.id,
          label: normalizeNodeLabel(node),
          subtype: node.subtype,
          prompt: node.data.prompt,
        },
      ];
    },
  );
}
