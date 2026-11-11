import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { auditCanvasAgentToolCall } from "@/shared/services/canvas-agent/canvas-agent-audit";
import {
  listCanvasAgentRecentCreations,
  listCanvasAgentRecentUploads,
  listCanvasAgentTemplateCatalog,
  resolveCanvasAgentReferences,
} from "@/shared/services/canvas-agent/canvas-agent-asset-context";

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
  const threadId = context.requestContext?.get("threadId") as
    | string
    | undefined;

  if (!userId || !projectId) {
    throw new Error("canvas tool missing required request context");
  }

  return { userId, projectId, threadId };
}

const attachmentSchema = z.object({
  assetId: z.string(),
  kind: z.literal("image"),
  source: z.enum(["upload", "canvas-node", "history"]),
  nodeId: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const listRecentCanvasCreationsTool = createTool({
  id: "list-recent-canvas-creations",
  description:
    "列出当前用户最近生成的作品资产，供智能体选择历史参考图或结果素材。",
  inputSchema: z.object({
    mediaType: z.enum(["image", "video"]).optional(),
    limit: z.number().min(1).max(30).optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        mediaType: z.string(),
        sceneId: z.string().nullable(),
        sceneLabel: z.string().nullable(),
        modelUrl: z.string().nullable(),
        modelLabel: z.string().nullable(),
        filename: z.string(),
        url: z.string(),
        prompt: z.string().nullable(),
        aspectRatio: z.string().nullable(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context);
    try {
      const items = await listCanvasAgentRecentCreations({
        userId: scope.userId,
        mediaType: inputData.mediaType,
        limit: inputData.limit,
      });
      auditCanvasAgentToolCall({
        toolName: "list-recent-canvas-creations",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "success",
        metadata: {
          count: items.length,
          mediaType: inputData.mediaType || null,
        },
      });
      return { items };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "list-recent-canvas-creations",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "error",
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      });
      throw error;
    }
  },
});

export const listRecentCanvasUploadsTool = createTool({
  id: "list-recent-canvas-uploads",
  description:
    "列出当前用户最近上传的素材，供智能体理解可复用的上传图片或视频。",
  inputSchema: z.object({
    mediaType: z.enum(["image", "video"]).optional(),
    limit: z.number().min(1).max(30).optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        mediaType: z.string(),
        sceneId: z.string().nullable(),
        sceneLabel: z.string().nullable(),
        modelUrl: z.string().nullable(),
        modelLabel: z.string().nullable(),
        filename: z.string(),
        url: z.string(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context);
    try {
      const items = await listCanvasAgentRecentUploads({
        userId: scope.userId,
        mediaType: inputData.mediaType,
        limit: inputData.limit,
      });
      auditCanvasAgentToolCall({
        toolName: "list-recent-canvas-uploads",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "success",
        metadata: {
          count: items.length,
          mediaType: inputData.mediaType || null,
        },
      });
      return { items };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "list-recent-canvas-uploads",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "error",
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      });
      throw error;
    }
  },
});

export const listCanvasTemplateCatalogTool = createTool({
  id: "list-canvas-template-catalog",
  description:
    "读取指定 modelUrl 下可用的模板样例目录，供智能体复用现有模板和默认参数。",
  inputSchema: z.object({
    modelUrl: z.string(),
    sceneId: z.string().optional(),
    sceneLabel: z.string().optional(),
    modelLabel: z.string().optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        mediaType: z.enum(["image", "video"]),
        sceneId: z.string().optional(),
        sceneLabel: z.string().optional(),
        modelUrl: z.string().optional(),
        modelLabel: z.string().optional(),
        aspectRatio: z.string().optional(),
        previewUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        referencePreviewUrls: z.array(z.string()),
        params: z.record(z.string(), z.any()),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context);
    try {
      const items = await listCanvasAgentTemplateCatalog(inputData);
      auditCanvasAgentToolCall({
        toolName: "list-canvas-template-catalog",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "success",
        metadata: { modelUrl: inputData.modelUrl, count: items.length },
      });
      return { items };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "list-canvas-template-catalog",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "error",
        metadata: {
          modelUrl: inputData.modelUrl,
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      throw error;
    }
  },
});

export const resolveMentionedReferencesTool = createTool({
  id: "resolve-mentioned-references",
  description:
    "统一解析消息中的 @参考图 引用，兼容上传图片、画布节点和历史资产。",
  inputSchema: z.object({
    projectId: z.string().optional(),
    content: z.string(),
    attachments: z.array(attachmentSchema).optional(),
  }),
  requestContextSchema: canvasAgentRequestContextSchema,
  outputSchema: z.object({
    references: z.array(
      z.object({
        id: z.string(),
        mentionText: z.string(),
        mentionKey: z.string(),
        targetType: z.enum([
          "canvas-node",
          "creation-asset",
          "uploaded-attachment",
        ]),
        targetNodeId: z.string().optional(),
        targetAssetId: z.string().optional(),
        relation: z.enum(["reference", "control"]),
        resolveStatus: z.enum(["resolved", "ambiguous", "missing"]),
        resolveStrategy: z
          .enum(["exact-id", "exact-name", "recent-upload", "manual-pick"])
          .optional(),
      }),
    ),
  }),
  execute: async (inputData, context) => {
    const scope = resolveCanvasScope(context, inputData.projectId);
    try {
      const references = await resolveCanvasAgentReferences({
        userId: scope.userId,
        projectId: scope.projectId,
        content: inputData.content,
        attachments: inputData.attachments,
      });
      auditCanvasAgentToolCall({
        toolName: "resolve-mentioned-references",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "success",
        metadata: { count: references.length },
      });
      return { references };
    } catch (error) {
      auditCanvasAgentToolCall({
        toolName: "resolve-mentioned-references",
        userId: scope.userId,
        projectId: scope.projectId,
        threadId: scope.threadId,
        status: "error",
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      });
      throw error;
    }
  },
});

export const canvasAssetTools = {
  listRecentCanvasCreationsTool,
  listRecentCanvasUploadsTool,
  listCanvasTemplateCatalogTool,
  resolveMentionedReferencesTool,
};
