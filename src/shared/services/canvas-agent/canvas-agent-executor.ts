import {
  buildCanvasAgentPlan,
  type CanvasAgentExecutionMode,
  type CanvasAgentReferenceTarget,
} from "./canvas-agent-plan";

export async function buildCanvasAgentExecution(input: {
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  prompt: string;
  preferredModelUrl?: string;
  references?: CanvasAgentReferenceTarget[];
  includePromptTextNode?: boolean;
  groupLabel?: string;
  promptTextLabel?: string;
  executionTarget?: "create-new" | "continue-existing";
  targetWorkflowNodeId?: string;
}) {
  const plan = buildCanvasAgentPlan({
    executionMode: input.executionMode,
    mediaIntent: input.mediaIntent,
    subtype: input.subtype,
    prompt: input.prompt,
    preferredModelUrl: input.preferredModelUrl,
    references: input.references,
    includePromptTextNode: input.includePromptTextNode,
    groupLabel: input.groupLabel,
    promptTextLabel: input.promptTextLabel,
    executionTarget: input.executionTarget,
    targetWorkflowNodeId: input.targetWorkflowNodeId,
  });

  return {
    plan: {
      executionMode: plan.executionMode,
      mediaIntent: plan.mediaIntent,
      subtype: plan.subtype,
      preferredModelUrl: plan.preferredModelUrl,
      executionTarget: plan.executionTarget,
      targetWorkflowNodeId: plan.targetWorkflowNodeId,
    },
    operations: plan.operations,
  };
}
