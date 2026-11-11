import { randomUUID } from "crypto";

import {
  and,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
} from "drizzle-orm";

import { workbenchUpload } from "@/config/db/schema";
import { db } from "@/core/db";

export type CreateWorkbenchUploadInput = {
  userId: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  storageKey?: string | null;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

export type ListWorkbenchUploadsInput = {
  userId: string;
  mediaType?: string;
  sceneId?: string;
  modelUrl?: string;
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

function buildKeywordText(input: CreateWorkbenchUploadInput) {
  return [
    input.filename,
    input.sceneLabel,
    input.modelLabel,
    input.mediaType,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function createWorkbenchUpload(input: CreateWorkbenchUploadInput) {
  const [created] = await db()
    .insert(workbenchUpload)
    .values({
      id: randomUUID(),
      userId: input.userId,
      mediaType: input.mediaType,
      sceneId: input.sceneId || null,
      sceneLabel: input.sceneLabel || null,
      modelUrl: input.modelUrl || null,
      modelLabel: input.modelLabel || null,
      filename: input.filename,
      storageKey: input.storageKey || null,
      url: input.url,
      mimeType: input.mimeType || null,
      fileSize: input.fileSize ?? null,
      keywordText: buildKeywordText(input),
    })
    .returning();

  return created;
}

export async function listWorkbenchUploads(input: ListWorkbenchUploadsInput) {
  const conditions = [eq(workbenchUpload.userId, input.userId)];

  if (input.mediaType && input.mediaType !== "all") {
    conditions.push(eq(workbenchUpload.mediaType, input.mediaType));
  }

  if (input.sceneId && input.sceneId !== "all") {
    conditions.push(eq(workbenchUpload.sceneId, input.sceneId));
  }

  if (input.modelUrl && input.modelUrl !== "all") {
    conditions.push(eq(workbenchUpload.modelUrl, input.modelUrl));
  }

  if (input.startDate) {
    conditions.push(gte(workbenchUpload.createdAt, input.startDate));
  }

  if (input.endDate) {
    conditions.push(lte(workbenchUpload.createdAt, input.endDate));
  }

  if (input.keyword) {
    const keyword = `%${input.keyword.trim()}%`;
    conditions.push(
      or(
        ilike(workbenchUpload.filename, keyword),
        ilike(workbenchUpload.sceneLabel, keyword),
        ilike(workbenchUpload.modelLabel, keyword),
        ilike(workbenchUpload.keywordText, keyword),
      )!,
    );
  }

  return db()
    .select()
    .from(workbenchUpload)
    .where(and(...conditions))
    .orderBy(desc(workbenchUpload.createdAt))
    .offset(input.offset ?? 0)
    .limit(input.limit ?? 100);
}

export async function deleteWorkbenchUploadById(id: string, userId: string) {
  const [deleted] = await db()
    .delete(workbenchUpload)
    .where(and(eq(workbenchUpload.id, id), eq(workbenchUpload.userId, userId)))
    .returning();

  return deleted;
}
