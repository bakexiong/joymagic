import type {
  CanvasEdgeSemantic,
  CanvasWorkflowSubtype,
} from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";

import {
  buildCanvasAgentLayout,
  type CanvasAgentLayoutItem,
} from "./canvas-agent-layout";

export type CanvasAgentReferenceTarget = {
  assetId: string;
  nodeId?: string;
  label?: string;
  url?: string;
};

export type CanvasAgentExecutionMode = "ask" | "auto";

export type CanvasAgentCreateTextOperation = {
  type: "create-text";
  tempId: string;
  label: string;
  content: string;
};

export type CanvasAgentCreateInputOperation = {
  type: "create-input";
  tempId: string;
  subtype: "upload";
  assetId: string;
  label: string;
  url?: string;
  mediaKind: "image";
};

export type CanvasAgentCreateWorkflowOperation = {
  type: "create-workflow";
  tempId: string;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  prompt: string;
  preferredModelUrl?: string;
};

export type CanvasAgentUpdateWorkflowOperation = {
  type: "update-workflow";
  nodeId: string;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  prompt: string;
  preferredModelUrl?: string;
};

export type CanvasAgentCreateEdgeOperation = {
  type: "create-edge";
  source: {
    tempId?: string;
    nodeId?: string;
  };
  target: {
    tempId?: string;
    nodeId?: string;
  };
  semantic: CanvasEdgeSemantic;
};

export type CanvasAgentLayoutOperation = {
  type: "layout";
  items: CanvasAgentLayoutItem[];
};

export type CanvasAgentCreateGroupOperation = {
  type: "create-group";
  tempId: string;
  label: string;
  nodeTempIds: string[];
};

export type CanvasAgentOperation =
  | CanvasAgentCreateTextOperation
  | CanvasAgentCreateInputOperation
  | CanvasAgentCreateWorkflowOperation
  | CanvasAgentUpdateWorkflowOperation
  | CanvasAgentCreateEdgeOperation
  | CanvasAgentLayoutOperation
  | CanvasAgentCreateGroupOperation;

export type CanvasAgentPlan = {
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  prompt: string;
  preferredModelUrl?: string;
  executionTarget?: "create-new" | "continue-existing";
  targetWorkflowNodeId?: string;
  operations: CanvasAgentOperation[];
};

export function buildCanvasAgentPlan(input: {
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  prompt: string;
  preferredModelUrl?: string;
  references?: CanvasAgentReferenceTarget[];
  includePromptTextNode?: boolean;
  groupLabel?: string;
  promptTextLabel?: string;
  executionTarget?: "create-new" | "continue-existing";
  targetWorkflowNodeId?: string;
}) {
  const workflowTempId = "workflow:primary";
  const operations: CanvasAgentOperation[] = [];
  const inputTempIds: string[] = [];
  const groupNodeTempIds: string[] = [];
  const shouldCreateNewGroup =
    input.executionTarget !== "continue-existing" ||
    !input.targetWorkflowNodeId;
  let textTempId: string | undefined;

  if (input.includePromptTextNode && input.prompt.trim()) {
    textTempId = "text:prompt";
    groupNodeTempIds.push(textTempId);
    operations.push({
      type: "create-text",
      tempId: textTempId,
      label: input.promptTextLabel || "优化提示词",
      content: input.prompt.trim(),
    });
    operations.push({
      type: "create-edge",
      source: { tempId: textTempId },
      target: { tempId: workflowTempId },
      semantic: "control",
    });
  }

  if (
    input.executionTarget === "continue-existing" &&
    input.targetWorkflowNodeId
  ) {
    operations.push({
      type: "create-edge",
      source: { nodeId: input.targetWorkflowNodeId },
      target: { tempId: workflowTempId },
      semantic: "reference",
    });
  }

  (input.references ?? []).forEach((reference, index) => {
    if (reference.nodeId) {
      operations.push({
        type: "create-edge",
        source: { nodeId: reference.nodeId },
        target: { tempId: workflowTempId },
        semantic: "reference",
      });
      return;
    }

    const tempId = `input:${index + 1}`;
    inputTempIds.push(tempId);
    groupNodeTempIds.push(tempId);

    operations.push({
      type: "create-input",
      tempId,
      subtype: "upload",
      assetId: reference.assetId,
      label: reference.label || "参考图",
      url: reference.url,
      mediaKind: "image",
    });
    operations.push({
      type: "create-edge",
      source: { tempId },
      target: { tempId: workflowTempId },
      semantic: "reference",
    });
  });

  groupNodeTempIds.push(workflowTempId);
  operations.unshift({
    type: "create-workflow",
    tempId: workflowTempId,
    mediaIntent: input.mediaIntent,
    subtype: input.subtype,
    prompt: input.prompt,
    preferredModelUrl: input.preferredModelUrl,
  });

  operations.push({
    type: "layout",
    items: buildCanvasAgentLayout({
      workflowTempId,
      textTempId,
      inputTempIds,
    }),
  });

  if (shouldCreateNewGroup && groupNodeTempIds.length > 1) {
    operations.push({
      type: "create-group",
      tempId: "group:primary",
      label: input.groupLabel || "智能体画布组",
      nodeTempIds: groupNodeTempIds,
    });
  }

  return {
    executionMode: input.executionMode,
    mediaIntent: input.mediaIntent,
    subtype: input.subtype,
    prompt: input.prompt,
    preferredModelUrl: input.preferredModelUrl,
    executionTarget: input.executionTarget,
    targetWorkflowNodeId: input.targetWorkflowNodeId,
    operations,
  } satisfies CanvasAgentPlan;
}
