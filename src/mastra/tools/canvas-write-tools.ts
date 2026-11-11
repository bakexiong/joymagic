import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { auditCanvasAgentToolCall } from "@/shared/services/canvas-agent/canvas-agent-audit";
import { buildCanvasAgentExecution } from "@/shared/services/canvas-agent/canvas-agent-executor";
import { applyCanvasAgentOperationsToProject } from "@/shared/services/canvas-agent/canvas-agent-write-context";

const canvasAgentRequestContextSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  threadId: z.string(),
  resourceId: z.string(),
  selectedNodeIds: z.array(z.string()).optional(),
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

const canvasReferenceSchema = z.object({
  assetId: z.string(),
  nodeId: z.string().optional(),
  label: z.string().optional(),
  url: z.string().optional(),
});

const canvasOperationSchema: z.ZodType<any> = z.union([
  z.object({
    type: z.literal("create-input"),
    tempId: z.string(),
    subtype: z.literal("upload"),
    assetId: z.string(),
    label: z.string(),
    url: z.string().optional(),
    mediaKind: z.literal("image"),
  }),
  z.object({
    type: z.literal("create-workflow"),
    tempId: z.string(),
    mediaIntent: z.enum(["image", "video"]),
    subtype: z.enum([
      "text-to-image",
      "image-to-image",
      "text-to-video",
      "image-to-video",
    ]),
    prompt: z.string(),
    preferredModelUrl: z.string().optional(),
  }),
  z.object({
    type: z.literal("create-edge"),
    source: z.object({
      tempId: z.string().optional(),
      nodeId: z.string().optional(),
    }),
    target: z.object({
      tempId: z.string().optional(),
      nodeId: z.string().optional(),
    }),
    semantic: z.enum([
      "reference",
      "derivation",
      "result",
      "control",
      "command",
    ]),
  }),
  z.object({
    type: z.literal("layout"),
    items: z.array(
      z.object({
        tempId: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      }),
    ),
  }),
]);

export const applyCanvasOperationsTool = createTool({
  id: "apply-canvas-operations",
  description:
    "将结构化 CanvasAgent operations 正式写入当前画布快照，包括创建节点、连边和布局。",
  inputSchema: z.object({
    projectId: z.string().optional(),
    operations: z.array(canvasOperationSchema),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    snapshotId: z.string(),
    snapshotVersion: z.number(),
    tempNodeIdMap: z.record(z.string(), z.string()),
    nodeCount: z.number(),
    edgeCount: z.number(),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const result = await applyCanvasAgentOperationsToProject({
        userId: scope.userId,
        projectId: scope.projectId,
        operations: inputData.operations,
      });
      auditCanvasAgentToolCall({
        toolName: "apply-canvas-operations",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
        metadata: { operationCount: inputData.operations.length },
      });

      return {
        snapshotId: result.snapshot.id,
        snapshotVersion: result.snapshot.version,
        tempNodeIdMap: result.tempNodeIdMap,
        nodeCount: result.snapshot.graph.nodes.length,
        edgeCount: result.snapshot.graph.edges.length,
      };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "apply-canvas-operations",
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

export const createCanvasWorkflowFromRequestTool = createTool({
  id: "create-canvas-workflow-from-request",
  description:
    "根据媒体意图、subtype、prompt 和参考图自动生成画布 operations，并立即写入当前 canvas 项目。",
  inputSchema: z.object({
    projectId: z.string().optional(),
    mediaIntent: z.enum(["image", "video"]),
    subtype: z.enum([
      "text-to-image",
      "image-to-image",
      "text-to-video",
      "image-to-video",
    ]),
    prompt: z.string(),
    preferredModelUrl: z.string().optional(),
    references: z.array(canvasReferenceSchema).optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    plan: z.object({
      mediaIntent: z.enum(["image", "video"]),
      subtype: z.enum([
        "text-to-image",
        "image-to-image",
        "text-to-video",
        "image-to-video",
      ]),
      preferredModelUrl: z.string().optional(),
    }),
    operationCount: z.number(),
    snapshotId: z.string(),
    snapshotVersion: z.number(),
    tempNodeIdMap: z.record(z.string(), z.string()),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const execution = await buildCanvasAgentExecution({
        executionMode: "auto",
        mediaIntent: inputData.mediaIntent,
        subtype: inputData.subtype,
        prompt: inputData.prompt,
        preferredModelUrl: inputData.preferredModelUrl,
        references: inputData.references,
      });

      const result = await applyCanvasAgentOperationsToProject({
        userId: scope.userId,
        projectId: scope.projectId,
        operations: execution.operations,
      });
      auditCanvasAgentToolCall({
        toolName: "create-canvas-workflow-from-request",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
        metadata: {
          mediaIntent: inputData.mediaIntent,
          subtype: inputData.subtype,
          operationCount: execution.operations.length,
        },
      });

      return {
        plan: execution.plan,
        operationCount: execution.operations.length,
        snapshotId: result.snapshot.id,
        snapshotVersion: result.snapshot.version,
        tempNodeIdMap: result.tempNodeIdMap,
      };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "create-canvas-workflow-from-request",
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

export const canvasWriteTools = {
  applyCanvasOperationsTool,
  createCanvasWorkflowFromRequestTool,
};
