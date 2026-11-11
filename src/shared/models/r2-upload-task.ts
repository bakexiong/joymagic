import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";

import { r2UploadTask } from "@/config/db/schema";
import { db } from "@/core/db";
import { getUuid } from "@/shared/lib/hash";

export const R2UploadTaskStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type R2UploadTaskStatusValue =
  (typeof R2UploadTaskStatus)[keyof typeof R2UploadTaskStatus];

export type R2UploadTask = typeof r2UploadTask.$inferSelect;

export type R2UploadPayload = {
  sceneId?: string | null;
  providerName?: string | null;
  providerLabel?: string | null;
  prompt?: string | null;
  generationParams?: Record<string, any> | null;
  aspectRatio?: string | null;
};

export async function enqueueR2UploadTask(input: {
  aiTaskId?: string | null;
  userId?: string | null;
  sourceUrl: string;
  workbenchCreationId?: string | null;
  payload?: R2UploadPayload | null;
}) {
  const sourceUrl = input.sourceUrl.trim();

  if (!sourceUrl) {
    return null;
  }

  const row = {
    id: getUuid(),
    aiTaskId: input.aiTaskId || null,
    userId: input.userId || null,
    status: R2UploadTaskStatus.PENDING,
    sourceUrl,
    sourceUrls: JSON.stringify([sourceUrl]),
    workbenchCreationId: input.workbenchCreationId || null,
    workbenchCreationIds: JSON.stringify([input.workbenchCreationId || null]),
    payload: input.payload ? JSON.stringify(input.payload) : null,
    attempts: 0,
    maxAttempts: 5,
    nextRunAt: new Date(),
  };

  if (!input.aiTaskId) {
    const [created] = await db().insert(r2UploadTask).values(row).returning();
    return created;
  }

  const [existing] = await db()
    .select()
    .from(r2UploadTask)
    .where(
      and(
        eq(r2UploadTask.aiTaskId, input.aiTaskId),
        eq(r2UploadTask.sourceUrl, sourceUrl),
      ),
    )
    .limit(1);

  if (
    existing &&
    (existing.status === R2UploadTaskStatus.PENDING ||
      existing.status === R2UploadTaskStatus.PROCESSING ||
      existing.status === R2UploadTaskStatus.SUCCESS)
  ) {
    return existing;
  }

  const [created] = await db()
    .insert(r2UploadTask)
    .values(row)
    .onConflictDoUpdate({
      target: [r2UploadTask.aiTaskId, r2UploadTask.sourceUrl],
      set: {
        status: R2UploadTaskStatus.PENDING,
        sourceUrl: row.sourceUrl,
        sourceUrls: row.sourceUrls,
        workbenchCreationId: row.workbenchCreationId,
        workbenchCreationIds: row.workbenchCreationIds,
        payload: row.payload,
        resultUrl: null,
        resultUrls: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        nextRunAt: new Date(),
      },
    })
    .returning();

  return created;
}

export async function claimPendingR2UploadTasks(input: {
  limit: number;
  workerId: string;
}) {
  const rows = await db()
    .select()
    .from(r2UploadTask)
    .where(
      and(
        inArray(r2UploadTask.status, [
          R2UploadTaskStatus.PENDING,
          R2UploadTaskStatus.FAILED,
        ]),
        lte(r2UploadTask.nextRunAt, new Date()),
        sql`${r2UploadTask.attempts} < ${r2UploadTask.maxAttempts}`,
      ),
    )
    .orderBy(asc(r2UploadTask.nextRunAt), asc(r2UploadTask.createdAt))
    .limit(input.limit);

  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);
  return db()
    .update(r2UploadTask)
    .set({
      status: R2UploadTaskStatus.PROCESSING,
      lockedAt: new Date(),
      lockedBy: input.workerId,
    })
    .where(inArray(r2UploadTask.id, ids))
    .returning();
}

export async function markR2UploadTaskSuccess(input: {
  id: string;
  resultUrl: string;
}) {
  const [updated] = await db()
    .update(r2UploadTask)
    .set({
      status: R2UploadTaskStatus.SUCCESS,
      resultUrl: input.resultUrl,
      resultUrls: JSON.stringify([input.resultUrl]),
      lastError: null,
      lockedAt: null,
      completedAt: new Date(),
    })
    .where(eq(r2UploadTask.id, input.id))
    .returning();

  return updated;
}

export async function markR2UploadTaskFailed(input: {
  id: string;
  attempts: number;
  maxAttempts: number;
  error: string;
}) {
  const nextAttempts = input.attempts + 1;
  const finalFailed = nextAttempts >= input.maxAttempts;
  const retryDelayMs = Math.min(30 * 60_000, 2 ** nextAttempts * 60_000);

  const [updated] = await db()
    .update(r2UploadTask)
    .set({
      status: finalFailed
        ? R2UploadTaskStatus.FAILED
        : R2UploadTaskStatus.PENDING,
      attempts: nextAttempts,
      lastError: input.error,
      lockedAt: null,
      nextRunAt: new Date(Date.now() + retryDelayMs),
    })
    .where(eq(r2UploadTask.id, input.id))
    .returning();

  return updated;
}
