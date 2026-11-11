import type {
  CanvasGraph,
  CanvasReferenceItem,
  CanvasTemplateNode,
  CanvasWorkflowNode,
} from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import { getWorkbenchCanvasProjectById } from "@/shared/models/workbench-canvas-project";

function getReferenceItemsFromGraph(
  workflowNode: CanvasWorkflowNode,
  graph: CanvasGraph,
) {
  const selfReferences: CanvasReferenceItem[] = [];

  if (workflowNode.data.uploadedImageUrl) {
    selfReferences.push({
      id: `${workflowNode.id}-uploaded-image`,
      kind: "image",
      url: workflowNode.data.uploadedImageUrl,
      label: workflowNode.data.uploadedImageName || "上传图片",
    });
  }

  if (workflowNode.data.uploadedVideoUrl) {
    selfReferences.push({
      id: `${workflowNode.id}-uploaded-video`,
      kind: "video",
      url: workflowNode.data.uploadedVideoUrl,
      label: workflowNode.data.uploadedVideoName || "上传视频",
    });
  }

  const edgeReferences = graph.edges
    .filter(
      (edge) =>
        edge.target === workflowNode.id && edge.semantic === "reference",
    )
    .map((edge) => graph.nodes.find((node) => node.id === edge.source))
    .filter(Boolean)
    .flatMap((node) => {
      if (!node) return [];
      if (node.kind === "result") {
        return [
          {
            id: node.id,
            kind: node.data.mediaKind,
            url: node.data.url,
            label: node.data.title || node.data.prompt || "生成结果",
          } satisfies CanvasReferenceItem,
        ];
      }
      if (node.kind === "input" && node.data.url && node.data.mediaKind) {
        return [
          {
            id: node.id,
            kind: node.data.mediaKind,
            url: node.data.url,
            label: node.data.title || node.data.label,
          } satisfies CanvasReferenceItem,
        ];
      }
      if (node.kind === "workflow") {
        const workflowReferenceUrl =
          node.data.generatedVideoUrl ||
          node.data.generatedImageUrl ||
          node.data.uploadedVideoUrl ||
          node.data.uploadedImageUrl;
        const workflowReferenceKind =
          node.data.generatedVideoUrl || node.data.uploadedVideoUrl
            ? "video"
            : node.data.generatedImageUrl || node.data.uploadedImageUrl
              ? "image"
              : null;

        if (workflowReferenceUrl && workflowReferenceKind) {
          return [
            {
              id: node.id,
              kind: workflowReferenceKind,
              url: workflowReferenceUrl,
              label: node.data.title || node.data.sceneLabel || node.data.modelLabel || "工作流节点",
            } satisfies CanvasReferenceItem,
          ];
        }
      }
      return [];
    });

  return [...selfReferences, ...edgeReferences];
}

function getControlParamsFromGraph(
  workflowNode: CanvasWorkflowNode,
  graph: CanvasGraph,
) {
  return graph.edges
    .filter(
      (edge) => edge.target === workflowNode.id && edge.semantic === "control",
    )
    .map((edge) => graph.nodes.find((node) => node.id === edge.source))
    .filter((node): node is CanvasTemplateNode =>
      Boolean(node && node.kind === "template"),
    )
    .reduce<Record<string, any>>(
      (acc, node) => ({ ...acc, ...node.data.params }),
      {},
    );
}

export type CanvasWorkflowGenerationContext = Awaited<
  ReturnType<typeof buildCanvasWorkflowGenerationContext>
>;

export async function buildCanvasWorkflowGenerationContext(input: {
  userId: string;
  projectId: string;
  workflowNodeId: string;
}) {
  const bundle = await getWorkbenchCanvasProjectById(
    input.projectId,
    input.userId,
  );
  if (!bundle?.snapshot) {
    throw new Error("canvas snapshot not found");
  }

  const workflowNode = bundle.snapshot.graph.nodes.find(
    (node): node is CanvasWorkflowNode =>
      node.id === input.workflowNodeId && node.kind === "workflow",
  );

  if (!workflowNode) {
    throw new Error("workflow node not found");
  }

  const mediaIntent: "image" | "video" =
    workflowNode.subtype === "text-to-video" ||
    workflowNode.subtype === "image-to-video"
      ? "video"
      : "image";

  return {
    projectId: input.projectId,
    workflowNodeId: workflowNode.id,
    mediaIntent,
    subtype: workflowNode.subtype,
    sceneId: workflowNode.data.sceneId,
    sceneLabel: workflowNode.data.sceneLabel,
    modelUrl: workflowNode.data.modelUrl,
    modelLabel: workflowNode.data.modelLabel,
    prompt: workflowNode.data.prompt,
    settings: {
      ...getControlParamsFromGraph(workflowNode, bundle.snapshot.graph),
      ...workflowNode.data.settings,
    },
    references: getReferenceItemsFromGraph(workflowNode, bundle.snapshot.graph),
  };
}
