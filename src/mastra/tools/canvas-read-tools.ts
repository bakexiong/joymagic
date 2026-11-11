import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { auditCanvasAgentToolCall } from "@/shared/services/canvas-agent/canvas-agent-audit";
import {
  getCanvasAgentProjectContext,
  getCanvasAgentSelectionContext,
  getCanvasAgentSnapshotContext,
  listCanvasAgentReferenceableNodes,
} from "@/shared/services/canvas-agent/canvas-agent-read-context";

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

  return {
    userId,
    projectId,
    selectedNodeIds:
      (context.requestContext?.get("selectedNodeIds") as
        | string[]
        | undefined) || [],
  };
}

export const getCanvasProjectTool = createTool({
  id: "get-canvas-project",
  description:
    "读取当前 Create Canvas 项目的基础信息，包括名称、入口模型、状态和关联快照元信息。",
  inputSchema: z.object({
    projectId: z.string().optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      mode: z.string(),
      entrySceneId: z.string().nullable().optional(),
      entryModelUrl: z.string().nullable().optional(),
      coverUrl: z.string().nullable().optional(),
    }),
    snapshot: z
      .object({
        id: z.string(),
        version: z.number(),
        nodeCount: z.number(),
        edgeCount: z.number(),
      })
      .nullable(),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const bundle = await getCanvasAgentProjectContext(scope);
      auditCanvasAgentToolCall({
        toolName: "get-canvas-project",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
      });

      return {
        project: {
          id: bundle.project.id,
          name: bundle.project.name,
          status: bundle.project.status,
          mode: bundle.project.mode,
          entrySceneId: bundle.project.entrySceneId,
          entryModelUrl: bundle.project.entryModelUrl,
          coverUrl: bundle.project.coverUrl,
        },
        snapshot: bundle.snapshot
          ? {
              id: bundle.snapshot.id,
              version: bundle.snapshot.version,
              nodeCount: bundle.snapshot.graph.nodes.length,
              edgeCount: bundle.snapshot.graph.edges.length,
            }
          : null,
      };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "get-canvas-project",
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

export const getCanvasSnapshotTool = createTool({
  id: "get-canvas-snapshot",
  description:
    "读取当前画布快照摘要，包括节点、边、当前选择和 composer references，用于理解画布状态。",
  inputSchema: z.object({
    projectId: z.string().optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    snapshot: z
      .object({
        id: z.string(),
        version: z.number(),
        nodeCount: z.number(),
        edgeCount: z.number(),
        selection: z.object({
          nodeId: z.string().nullable(),
          edgeId: z.string().nullable(),
        }),
        composer: z.object({
          nodeId: z.string().nullable(),
          referenceCount: z.number(),
        }),
      })
      .nullable(),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const snapshot = await getCanvasAgentSnapshotContext(scope);
      auditCanvasAgentToolCall({
        toolName: "get-canvas-snapshot",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
      });

      return {
        snapshot: snapshot
          ? {
              id: snapshot.id,
              version: snapshot.version,
              nodeCount: snapshot.graph.nodes.length,
              edgeCount: snapshot.graph.edges.length,
              selection: snapshot.graph.selection,
              composer: {
                nodeId: snapshot.graph.composer.nodeId,
                referenceCount: snapshot.graph.composer.references.length,
              },
            }
          : null,
      };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "get-canvas-snapshot",
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

export const getCanvasSelectionContextTool = createTool({
  id: "get-canvas-selection-context",
  description:
    "读取当前选中节点和其上游节点摘要，帮助智能体理解用户当前正在操作的局部画布上下文。",
  inputSchema: z.object({
    projectId: z.string().optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    selectedNodeIds: z.array(z.string()),
    upstreamNodeIds: z.array(z.string()),
    nodes: z.array(
      z.object({
        nodeId: z.string(),
        kind: z.string(),
        subtype: z.string().optional(),
        label: z.string(),
        mediaKind: z.enum(["image", "video", "audio"]).optional(),
        assetId: z.string().optional(),
        url: z.string().optional(),
        prompt: z.string().optional(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const result = await getCanvasAgentSelectionContext(scope);
      auditCanvasAgentToolCall({
        toolName: "get-canvas-selection-context",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
        metadata: { selectedNodeIds: result.selectedNodeIds },
      });
      return result;
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "get-canvas-selection-context",
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

export const listReferenceableNodesTool = createTool({
  id: "list-referenceable-nodes",
  description:
    "列出当前画布中可被当作参考图或参考结果引用的节点，包括 workflow、input 和 result 节点。",
  inputSchema: z.object({
    projectId: z.string().optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    nodes: z.array(
      z.object({
        nodeId: z.string(),
        kind: z.string(),
        subtype: z.string().optional(),
        label: z.string(),
        mediaKind: z.enum(["image", "video", "audio"]).optional(),
        assetId: z.string().optional(),
        url: z.string().optional(),
        prompt: z.string().optional(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const nodes = await listCanvasAgentReferenceableNodes(scope);
      auditCanvasAgentToolCall({
        toolName: "list-referenceable-nodes",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: context.requestContext?.get("threadId") as string | undefined,
        status: "success",
        metadata: { count: nodes.length },
      });
      return { nodes };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "list-referenceable-nodes",
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

export const canvasReadTools = {
  getCanvasProjectTool,
  getCanvasSnapshotTool,
  getCanvasSelectionContextTool,
  listReferenceableNodesTool,
};
