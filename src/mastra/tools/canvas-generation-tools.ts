import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { auditCanvasAgentToolCall } from "@/shared/services/canvas-agent/canvas-agent-audit";
import { buildCanvasWorkflowGenerationContext } from "@/shared/services/canvas-agent/canvas-agent-generation-context";
import { submitCanvasWorkflowGeneration } from "@/shared/services/canvas-agent/canvas-agent-generation-submit";

const canvasAgentRequestContextSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  threadId: z.string(),
  resourceId: z.string(),
  selectedNodeIds: z.array(z.string()).optional(),
  requestBaseUrl: z.string().optional(),
  requestCookieHeader: z.string().optional(),
});

function resolveCanvasScope(context: any, inputProjectId?: string) {
  const userId = context.requestContext?.get("userId") as string | undefined;
  const projectId =
    inputProjectId ||
    (context.requestContext?.get("projectId") as string | undefined);

  if (!userId || !projectId) {
    throw new Error("canvas tool missing required request context");
  }

  return { userId, projectId };
}

export const prepareCanvasWorkflowGenerationTool = createTool({
  id: "prepare-canvas-workflow-generation",
  description:
    "读取指定 workflow 节点的生成执行上下文，整理 prompt、settings、references 和 model 信息，供后续正式生成链路消费。",
  inputSchema: z.object({
    projectId: z.string().optional(),
    workflowNodeId: z.string(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    executionMode: z.literal("client-deferred"),
    projectId: z.string(),
    workflowNodeId: z.string(),
    mediaIntent: z.enum(["image", "video"]),
    subtype: z.enum([
      "text-to-image",
      "image-to-image",
      "text-to-video",
      "image-to-video",
    ]),
    sceneId: z.string(),
    sceneLabel: z.string(),
    modelUrl: z.string(),
    modelLabel: z.string(),
    prompt: z.string(),
    settings: z.record(z.string(), z.any()),
    references: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(["image", "video", "audio"]),
        url: z.string(),
        label: z.string().optional(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const generation = await buildCanvasWorkflowGenerationContext({
        userId: scope.userId,
        projectId: scope.projectId,
        workflowNodeId: inputData.workflowNodeId,
      });
      auditCanvasAgentToolCall({
        toolName: "prepare-canvas-workflow-generation",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
        metadata: { workflowNodeId: inputData.workflowNodeId },
      });

      return {
        executionMode: "client-deferred" as const,
        ...generation,
      };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "prepare-canvas-workflow-generation",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "error",
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      });
      throw error;
    }
  },
});

export const submitCanvasWorkflowGenerationTool = createTool({
  id: "submit-canvas-workflow-generation",
  description:
    "为指定 workflow 节点复用现有图片/视频生成链路，在服务端提交正式生成任务，并返回 requestId、scenario 或直接输出。",
  inputSchema: z.object({
    projectId: z.string().optional(),
    workflowNodeId: z.string(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    workflowNodeId: z.string(),
    executionMode: z.enum(["server-submitted", "client-deferred"]),
    accepted: z.boolean(),
    mediaIntent: z.enum(["image", "video"]),
    subtype: z.enum([
      "text-to-image",
      "image-to-image",
      "text-to-video",
      "image-to-video",
    ]),
    sceneId: z.string(),
    modelUrl: z.string(),
    requestId: z.string().optional(),
    taskId: z.string().optional(),
    scenario: z.string().optional(),
    directUrl: z.string().optional(),
    outputs: z.array(z.string()).optional(),
    error: z.string().optional(),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const result = await submitCanvasWorkflowGeneration({
        userId: scope.userId,
        projectId: scope.projectId,
        workflowNodeId: inputData.workflowNodeId,
        baseUrl: context.requestContext?.get("requestBaseUrl") as
          | string
          | undefined,
        cookieHeader: context.requestContext?.get("requestCookieHeader") as
          | string
          | undefined,
      });
      auditCanvasAgentToolCall({
        toolName: "submit-canvas-workflow-generation",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: result.accepted ? "success" : "error",
        metadata: {
          workflowNodeId: inputData.workflowNodeId,
          executionMode: result.executionMode,
          taskId: result.taskId || null,
        },
      });
      return result;
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "submit-canvas-workflow-generation",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "error",
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      });
      throw error;
    }
  },
});

export const canvasGenerationTools = {
  prepareCanvasWorkflowGenerationTool,
  submitCanvasWorkflowGenerationTool,
};
