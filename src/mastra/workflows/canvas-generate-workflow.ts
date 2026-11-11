import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";

import { submitCanvasWorkflowGeneration } from "@/shared/services/canvas-agent/canvas-agent-generation-submit";

const canvasGenerateWorkflowInputSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  requestBaseUrl: z.string().optional(),
  requestCookieHeader: z.string().optional(),
  workflowNodeIds: z.array(z.string()).min(1),
});

const canvasGenerateWorkflowOutputSchema = z.object({
  submissions: z.array(
    z.object({
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
  ),
});

const canvasGenerateStep = createStep({
  id: "canvas-generate-step",
  inputSchema: canvasGenerateWorkflowInputSchema,
  outputSchema: canvasGenerateWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    const submissions = await Promise.all(
      inputData.workflowNodeIds.map(async (workflowNodeId) => {
        try {
          return await submitCanvasWorkflowGeneration({
            userId: inputData.userId,
            projectId: inputData.projectId,
            workflowNodeId,
            baseUrl: inputData.requestBaseUrl,
            cookieHeader: inputData.requestCookieHeader,
          });
        } catch (error) {
          return {
            workflowNodeId,
            executionMode: "client-deferred" as const,
            accepted: false,
            mediaIntent: "image" as const,
            subtype: "text-to-image" as const,
            sceneId: "unknown",
            modelUrl: "unknown",
            error:
              error instanceof Error ? error.message : "服务端生成提交失败",
          };
        }
      }),
    );

    return { submissions };
  },
});

export const canvasGenerateWorkflow = createWorkflow({
  id: "canvas-generate-workflow",
  description: "为一个或多个画布 workflow 节点独立提交正式生成任务。",
  inputSchema: canvasGenerateWorkflowInputSchema,
  outputSchema: canvasGenerateWorkflowOutputSchema,
})
  .then(canvasGenerateStep)
  .commit();
