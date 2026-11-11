import { randomUUID } from "crypto";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import {
  workbenchCanvasChatMessage,
  workbenchCanvasChatMessageAttachment,
  workbenchCanvasChatMessageReference,
  workbenchCanvasChatThread,
  workbenchCanvasProject,
  workbenchCreation,
} from "@/config/db/schema";
import { db } from "@/core/db";
import { listWorkbenchCreations } from "@/shared/models/workbench-creation";
import { listWorkbenchCanvasProjectCreations } from "@/shared/models/workbench-canvas-project";

export type CanvasAgentMessageAttachmentInput = {
  assetId: string;
  kind: "image";
  source: "upload" | "canvas-node" | "history";
  nodeId?: string;
  name?: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

export type CanvasMentionedReference = {
  id: string;
  mentionText: string;
  mentionKey: string;
  targetType: "canvas-node" | "creation-asset" | "uploaded-attachment";
  targetNodeId?: string;
  targetAssetId?: string;
  relation: "reference" | "control";
  resolveStatus: "resolved" | "ambiguous" | "missing";
  resolveStrategy?: "exact-id" | "exact-name" | "recent-upload" | "manual-pick";
  startOffset?: number;
  endOffset?: number;
  snapshot?: {
    label: string;
    thumbnailUrl?: string;
    mediaKind?: "image" | "video";
  };
};

export type CanvasChatBillingSummary = {
  chatCredits: number;
  charged: boolean;
  refunded: boolean;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd?: number;
  creditUnitPriceUsd?: number;
  appliedProfitMargin?: number;
  minimumCredits?: number;
  pricingStrategy?: "token-usage" | "minimum-charge";
};

export type CanvasChatGenerationSummary = {
  status: "idle" | "submitted" | "completed" | "failed" | "partial";
  taskId?: string;
  scenario?: string;
  errorMessage?: string;
  tasks?: Array<{
    taskId: string;
    workflowNodeId?: string;
    scenario?: string;
    status: "submitted" | "completed" | "failed";
    outputs?: string[];
    creationRecordIds?: string[];
    errorMessage?: string;
    updatedAt: string;
  }>;
};

export type CreateCanvasChatMessageInput = {
  userId: string;
  projectId: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  clientMessageId?: string | null;
  status?: "pending" | "completed" | "failed";
  parts?: unknown[];
  attachments?: CanvasAgentMessageAttachmentInput[];
  mentionedReferences?: CanvasMentionedReference[];
  operations?: unknown[];
  billing?: CanvasChatBillingSummary | null;
  generation?: CanvasChatGenerationSummary | null;
  errorMessage?: string | null;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildDefaultParts(content: string) {
  return [{ type: "text", text: content }];
}

function normalizeMentionKey(value: string) {
  return value.trim().toLowerCase();
}

function extractMentions(content: string) {
  const matches = [...content.matchAll(/@([^\s@]+)/g)];
  return matches.map((match) => ({
    mentionText: match[0],
    mentionKey: match[1] || "",
    startOffset: typeof match.index === "number" ? match.index : undefined,
    endOffset:
      typeof match.index === "number"
        ? match.index + match[0].length
        : undefined,
  }));
}

export async function getWorkbenchCanvasProjectForChat(
  projectId: string,
  userId: string,
) {
  const [project] = await db()
    .select()
    .from(workbenchCanvasProject)
    .where(
      and(
        eq(workbenchCanvasProject.id, projectId),
        eq(workbenchCanvasProject.userId, userId),
      ),
    )
    .limit(1);

  return project || null;
}

export async function listAccessibleWorkbenchCreationsByIds(
  userId: string,
  assetIds: string[],
) {
  if (assetIds.length === 0) return [];

  return db()
    .select()
    .from(workbenchCreation)
    .where(
      and(
        eq(workbenchCreation.userId, userId),
        inArray(workbenchCreation.id, assetIds),
      ),
    );
}

export async function getLatestCanvasChatThreadByProject(
  projectId: string,
  userId: string,
) {
  const [thread] = await db()
    .select()
    .from(workbenchCanvasChatThread)
    .where(
      and(
        eq(workbenchCanvasChatThread.projectId, projectId),
        eq(workbenchCanvasChatThread.userId, userId),
        eq(workbenchCanvasChatThread.status, "active"),
      ),
    )
    .orderBy(
      desc(workbenchCanvasChatThread.lastMessageAt),
      desc(workbenchCanvasChatThread.updatedAt),
      desc(workbenchCanvasChatThread.createdAt),
    )
    .limit(1);

  return thread || null;
}

export async function listCanvasChatThreadsByProject(
  projectId: string,
  userId: string,
) {
  return db()
    .select()
    .from(workbenchCanvasChatThread)
    .where(
      and(
        eq(workbenchCanvasChatThread.projectId, projectId),
        eq(workbenchCanvasChatThread.userId, userId),
        eq(workbenchCanvasChatThread.status, "active"),
      ),
    )
    .orderBy(
      desc(workbenchCanvasChatThread.lastMessageAt),
      desc(workbenchCanvasChatThread.updatedAt),
      desc(workbenchCanvasChatThread.createdAt),
    );
}

export async function getCanvasChatThreadById(
  threadId: string,
  userId: string,
) {
  const [thread] = await db()
    .select()
    .from(workbenchCanvasChatThread)
    .where(
      and(
        eq(workbenchCanvasChatThread.id, threadId),
        eq(workbenchCanvasChatThread.userId, userId),
      ),
    )
    .limit(1);

  return thread || null;
}

export async function createCanvasChatThread(input: {
  userId: string;
  projectId: string;
}) {
  const now = new Date();
  const [thread] = await db()
    .insert(workbenchCanvasChatThread)
    .values({
      id: randomUUID(),
      userId: input.userId,
      projectId: input.projectId,
      sessionId: randomUUID(),
      resourceId: `canvas-project:${input.projectId}`,
      status: "active",
      title: "",
      lastMessageAt: now,
    })
    .returning();

  return thread;
}

export async function createOrReuseCanvasChatThread(input: {
  userId: string;
  projectId: string;
  threadId?: string | null;
}) {
  if (input.threadId) {
    const existing = await getCanvasChatThreadById(
      input.threadId,
      input.userId,
    );
    if (existing) {
      if (existing.projectId !== input.projectId) {
        throw new Error("chat thread does not belong to this canvas project");
      }
      return existing;
    }
  }

  const latest = await getLatestCanvasChatThreadByProject(
    input.projectId,
    input.userId,
  );
  if (latest) return latest;

  return createCanvasChatThread(input);
}

export async function touchCanvasChatThread(threadId: string, userId: string) {
  const now = new Date();
  await db()
    .update(workbenchCanvasChatThread)
    .set({
      lastMessageAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(workbenchCanvasChatThread.id, threadId),
        eq(workbenchCanvasChatThread.userId, userId),
      ),
    );
}

export async function createCanvasChatMessage(
  input: CreateCanvasChatMessageInput,
) {
  const now = new Date();

  const normalizeThreadTitle = (content: string) => {
    const normalized = content.replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    return normalized.length > 28
      ? `${normalized.slice(0, 28).trim()}...`
      : normalized;
  };

  const result = await db().transaction(async (tx) => {
    const [message] = await tx
      .insert(workbenchCanvasChatMessage)
      .values({
        id: randomUUID(),
        userId: input.userId,
        projectId: input.projectId,
        threadId: input.threadId,
        clientMessageId: input.clientMessageId || null,
        role: input.role,
        status: input.status || "completed",
        content: input.content,
        partsJson: JSON.stringify(
          input.parts || buildDefaultParts(input.content),
        ),
        attachmentsJson:
          input.attachments && input.attachments.length > 0
            ? JSON.stringify(input.attachments)
            : null,
        mentionedReferencesJson:
          input.mentionedReferences && input.mentionedReferences.length > 0
            ? JSON.stringify(input.mentionedReferences)
            : null,
        operationsJson:
          input.operations && input.operations.length > 0
            ? JSON.stringify(input.operations)
            : null,
        billingJson: input.billing ? JSON.stringify(input.billing) : null,
        generationJson: input.generation
          ? JSON.stringify(input.generation)
          : null,
        errorMessage: input.errorMessage || null,
      })
      .returning();

    if (!message) {
      throw new Error("failed to create canvas chat message");
    }

    if (input.attachments && input.attachments.length > 0) {
      await tx.insert(workbenchCanvasChatMessageAttachment).values(
        input.attachments.map((attachment, index) => ({
          id: randomUUID(),
          userId: input.userId,
          projectId: input.projectId,
          threadId: input.threadId,
          messageId: message.id,
          assetId: attachment.assetId,
          kind: attachment.kind,
          orderIndex: index,
          source: attachment.source,
          nodeId: attachment.nodeId || null,
          label: attachment.name || null,
          metadataJson: JSON.stringify({
            url: attachment.url,
            mimeType: attachment.mimeType,
            width: attachment.width,
            height: attachment.height,
          }),
        })),
      );
    }

    if (input.mentionedReferences && input.mentionedReferences.length > 0) {
      await tx.insert(workbenchCanvasChatMessageReference).values(
        input.mentionedReferences.map((reference) => ({
          id: reference.id || randomUUID(),
          userId: input.userId,
          projectId: input.projectId,
          threadId: input.threadId,
          messageId: message.id,
          mentionText: reference.mentionText,
          mentionKey: reference.mentionKey,
          targetType: reference.targetType,
          targetNodeId: reference.targetNodeId || null,
          targetAssetId: reference.targetAssetId || null,
          relation: reference.relation,
          resolveStatus: reference.resolveStatus,
          resolveStrategy: reference.resolveStrategy || null,
          startOffset: reference.startOffset ?? null,
          endOffset: reference.endOffset ?? null,
          snapshotJson: reference.snapshot
            ? JSON.stringify(reference.snapshot)
            : null,
        })),
      );
    }

    const [thread] = await tx
      .select({
        id: workbenchCanvasChatThread.id,
        title: workbenchCanvasChatThread.title,
      })
      .from(workbenchCanvasChatThread)
      .where(
        and(
          eq(workbenchCanvasChatThread.id, input.threadId),
          eq(workbenchCanvasChatThread.userId, input.userId),
        ),
      )
      .limit(1);

    await tx
      .update(workbenchCanvasChatThread)
      .set({
        lastMessageAt: now,
        updatedAt: now,
        title:
          input.role === "user" &&
          thread &&
          !thread.title.trim() &&
          normalizeThreadTitle(input.content)
            ? normalizeThreadTitle(input.content)
            : thread?.title || "",
      })
      .where(
        and(
          eq(workbenchCanvasChatThread.id, input.threadId),
          eq(workbenchCanvasChatThread.userId, input.userId),
        ),
      );

    return message;
  });

  return result;
}

export async function updateCanvasChatMessageGeneration(input: {
  userId: string;
  messageId: string;
  threadId?: string;
  projectId?: string;
  generation: {
    status: "submitted" | "completed" | "failed";
    taskId: string;
    workflowNodeId?: string;
    scenario?: string;
    outputs?: string[];
    creationRecordIds?: string[];
    errorMessage?: string;
  };
}) {
  const [message] = await db()
    .select()
    .from(workbenchCanvasChatMessage)
    .where(
      and(
        eq(workbenchCanvasChatMessage.id, input.messageId),
        eq(workbenchCanvasChatMessage.userId, input.userId),
        input.threadId
          ? eq(workbenchCanvasChatMessage.threadId, input.threadId)
          : undefined,
        input.projectId
          ? eq(workbenchCanvasChatMessage.projectId, input.projectId)
          : undefined,
      ),
    )
    .limit(1);

  if (!message) {
    throw new Error("canvas chat message not found");
  }

  const existingGeneration = parseJson<CanvasChatGenerationSummary | null>(
    message.generationJson,
    null,
  );
  const existingTasks = Array.isArray(existingGeneration?.tasks)
    ? existingGeneration.tasks
    : [];
  const nextTask = {
    taskId: input.generation.taskId,
    workflowNodeId: input.generation.workflowNodeId,
    scenario: input.generation.scenario,
    status: input.generation.status,
    outputs: input.generation.outputs,
    creationRecordIds: input.generation.creationRecordIds,
    errorMessage: input.generation.errorMessage,
    updatedAt: new Date().toISOString(),
  };

  const nextTasks = [
    ...existingTasks.filter((task) => task.taskId !== input.generation.taskId),
    nextTask,
  ];
  const taskStatuses = new Set(nextTasks.map((task) => task.status));
  const mergedStatus: CanvasChatGenerationSummary["status"] =
    taskStatuses.size === 0
      ? "idle"
      : taskStatuses.size === 1
        ? taskStatuses.has("submitted")
          ? "submitted"
          : taskStatuses.has("completed")
            ? "completed"
            : "failed"
        : taskStatuses.has("failed") && taskStatuses.has("completed")
          ? "partial"
          : taskStatuses.has("submitted")
            ? "submitted"
            : "partial";

  const nextGeneration: CanvasChatGenerationSummary = {
    status: mergedStatus,
    taskId: input.generation.taskId,
    scenario: input.generation.scenario || existingGeneration?.scenario,
    errorMessage:
      input.generation.status === "failed"
        ? input.generation.errorMessage
        : undefined,
    tasks: nextTasks.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)),
  };

  const [updated] = await db()
    .update(workbenchCanvasChatMessage)
    .set({
      generationJson: JSON.stringify(nextGeneration),
      errorMessage:
        input.generation.status === "failed"
          ? input.generation.errorMessage || null
          : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workbenchCanvasChatMessage.id, input.messageId),
        eq(workbenchCanvasChatMessage.userId, input.userId),
      ),
    )
    .returning();

  return updated;
}

export async function resolveCanvasAgentMentionedReferences(input: {
  userId: string;
  projectId: string;
  content: string;
  attachments?: CanvasAgentMessageAttachmentInput[];
}) {
  const mentions = extractMentions(input.content);
  if (mentions.length === 0) return [];

  const [projectCreations, recentCreations] = await Promise.all([
    listWorkbenchCanvasProjectCreations(input.projectId, input.userId),
    listWorkbenchCreations({
      userId: input.userId,
      mediaType: "image",
      limit: 20,
      offset: 0,
    }),
  ]);

  return mentions.map((mention) => {
    const normalizedKey = normalizeMentionKey(mention.mentionKey);

    const attachmentMatch = (input.attachments || []).find((item) => {
      const label = normalizeMentionKey(item.name || "");
      return (
        label === normalizedKey ||
        item.assetId === mention.mentionKey ||
        (normalizedKey === "参考图" && (input.attachments || []).length === 1)
      );
    });

    if (attachmentMatch) {
      return {
        id: randomUUID(),
        mentionText: mention.mentionText,
        mentionKey: mention.mentionKey,
        targetType: "uploaded-attachment" as const,
        targetNodeId: attachmentMatch.nodeId,
        targetAssetId: attachmentMatch.assetId,
        relation: "reference" as const,
        resolveStatus: "resolved" as const,
        resolveStrategy:
          normalizedKey === "参考图"
            ? ("recent-upload" as const)
            : ("exact-name" as const),
        startOffset: mention.startOffset,
        endOffset: mention.endOffset,
        snapshot: {
          label: attachmentMatch.name || "参考图",
          thumbnailUrl: attachmentMatch.url,
          mediaKind: "image" as const,
        },
      };
    }

    const projectCreationMatch = projectCreations.find((item) => {
      return (
        item.sourceNodeId === mention.mentionKey ||
        item.creationId === mention.mentionKey
      );
    });

    if (projectCreationMatch) {
      return {
        id: randomUUID(),
        mentionText: mention.mentionText,
        mentionKey: mention.mentionKey,
        targetType: "canvas-node" as const,
        targetNodeId: projectCreationMatch.sourceNodeId || undefined,
        targetAssetId: projectCreationMatch.creationId,
        relation: "reference" as const,
        resolveStatus: "resolved" as const,
        resolveStrategy: "exact-id" as const,
        startOffset: mention.startOffset,
        endOffset: mention.endOffset,
        snapshot: {
          label: projectCreationMatch.prompt || projectCreationMatch.creationId,
          thumbnailUrl: projectCreationMatch.url,
          mediaKind:
            projectCreationMatch.mediaType === "video"
              ? ("video" as const)
              : ("image" as const),
        },
      };
    }

    const recentCreationMatch = recentCreations.find((item) => {
      const filenameKey = normalizeMentionKey(item.filename || "");
      return filenameKey === normalizedKey || item.id === mention.mentionKey;
    });

    if (recentCreationMatch) {
      return {
        id: randomUUID(),
        mentionText: mention.mentionText,
        mentionKey: mention.mentionKey,
        targetType: "creation-asset" as const,
        targetAssetId: recentCreationMatch.id,
        relation: "reference" as const,
        resolveStatus: "resolved" as const,
        resolveStrategy: "exact-name" as const,
        startOffset: mention.startOffset,
        endOffset: mention.endOffset,
        snapshot: {
          label: recentCreationMatch.filename || recentCreationMatch.id,
          thumbnailUrl: recentCreationMatch.url,
          mediaKind:
            recentCreationMatch.mediaType === "video"
              ? ("video" as const)
              : ("image" as const),
        },
      };
    }

    return {
      id: randomUUID(),
      mentionText: mention.mentionText,
      mentionKey: mention.mentionKey,
      targetType: "creation-asset" as const,
      relation: "reference" as const,
      resolveStatus: "missing" as const,
      startOffset: mention.startOffset,
      endOffset: mention.endOffset,
      snapshot: {
        label: mention.mentionKey,
      },
    };
  });
}

export async function getCanvasChatThreadMessages(
  threadId: string,
  userId: string,
) {
  const thread = await getCanvasChatThreadById(threadId, userId);
  if (!thread) return null;

  const messages = await db()
    .select()
    .from(workbenchCanvasChatMessage)
    .where(
      and(
        eq(workbenchCanvasChatMessage.threadId, threadId),
        eq(workbenchCanvasChatMessage.userId, userId),
      ),
    )
    .orderBy(asc(workbenchCanvasChatMessage.createdAt));

  const messageIds = messages.map((message) => message.id);
  const [attachments, references] =
    messageIds.length > 0
      ? await Promise.all([
          db()
            .select()
            .from(workbenchCanvasChatMessageAttachment)
            .where(
              and(
                eq(workbenchCanvasChatMessageAttachment.userId, userId),
                inArray(
                  workbenchCanvasChatMessageAttachment.messageId,
                  messageIds,
                ),
              ),
            )
            .orderBy(
              asc(workbenchCanvasChatMessageAttachment.messageId),
              asc(workbenchCanvasChatMessageAttachment.orderIndex),
            ),
          db()
            .select()
            .from(workbenchCanvasChatMessageReference)
            .where(
              and(
                eq(workbenchCanvasChatMessageReference.userId, userId),
                inArray(
                  workbenchCanvasChatMessageReference.messageId,
                  messageIds,
                ),
              ),
            )
            .orderBy(asc(workbenchCanvasChatMessageReference.createdAt)),
        ])
      : [[], []];

  const attachmentsByMessageId = new Map<string, typeof attachments>();
  attachments.forEach((item) => {
    const bucket = attachmentsByMessageId.get(item.messageId) || [];
    bucket.push(item);
    attachmentsByMessageId.set(item.messageId, bucket);
  });

  const referencesByMessageId = new Map<string, typeof references>();
  references.forEach((item) => {
    const bucket = referencesByMessageId.get(item.messageId) || [];
    bucket.push(item);
    referencesByMessageId.set(item.messageId, bucket);
  });

  return {
    thread,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      status: message.status,
      content: message.content,
      errorMessage: message.errorMessage || undefined,
      parts: parseJson(message.partsJson, [] as unknown[]),
      attachments:
        attachmentsByMessageId.get(message.id)?.map((attachment) => {
          const metadata = parseJson(
            attachment.metadataJson,
            {} as Record<string, unknown>,
          );
          return {
            assetId: attachment.assetId,
            kind: attachment.kind,
            source: attachment.source,
            nodeId: attachment.nodeId || undefined,
            name: attachment.label || undefined,
            url:
              typeof metadata.url === "string"
                ? (metadata.url as string)
                : undefined,
            mimeType:
              typeof metadata.mimeType === "string"
                ? (metadata.mimeType as string)
                : undefined,
            width:
              typeof metadata.width === "number"
                ? (metadata.width as number)
                : undefined,
            height:
              typeof metadata.height === "number"
                ? (metadata.height as number)
                : undefined,
          };
        }) || parseJson(message.attachmentsJson, [] as unknown[]),
      mentionedReferences:
        referencesByMessageId.get(message.id)?.map((reference) => ({
          id: reference.id,
          mentionText: reference.mentionText,
          mentionKey: reference.mentionKey,
          targetType: reference.targetType,
          targetNodeId: reference.targetNodeId || undefined,
          targetAssetId: reference.targetAssetId || undefined,
          relation: reference.relation,
          resolveStatus: reference.resolveStatus,
          resolveStrategy: reference.resolveStrategy || undefined,
          startOffset: reference.startOffset ?? undefined,
          endOffset: reference.endOffset ?? undefined,
          snapshot: parseJson(reference.snapshotJson, undefined),
        })) || parseJson(message.mentionedReferencesJson, [] as unknown[]),
      billing: parseJson(message.billingJson, null),
      generation: parseJson(message.generationJson, null),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
  };
}
