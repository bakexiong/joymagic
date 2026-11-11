import { randomUUID } from "crypto";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { workbenchCreation } from "@/config/db/schema";
import { db } from "@/core/db";

export type CreateWorkbenchCreationInput = {
  userId: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
  prompt?: string | null;
  params?: Record<string, any> | null;
  aspectRatio?: string | null;
};

export type ListWorkbenchCreationsInput = {
  userId: string;
  mediaType?: string;
  assetCategory?: string;
  sceneId?: string;
  modelUrl?: string;
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

function buildAssetCategoryCondition(assetCategory?: string) {
  if (!assetCategory || assetCategory === "all") {
    return null;
  }

  const sceneId = sql`coalesce(${workbenchCreation.sceneId}, '')`;
  const isEffectScene = sql`(${sceneId} ilike 'image-effect-%' or ${sceneId} ilike 'video-effect-%')`;

  if (assetCategory === "effect") {
    return isEffectScene;
  }

  if (assetCategory === "voice") {
    return sql`${workbenchCreation.mediaType} in ('audio', 'voice', 'speech', 'music')`;
  }

  if (assetCategory === "video") {
    return sql`${workbenchCreation.mediaType} = 'video' and not ${isEffectScene}`;
  }

  if (assetCategory === "photo") {
    return sql`${workbenchCreation.mediaType} = 'image' and not ${isEffectScene}`;
  }

  return null;
}

function buildKeywordText(input: CreateWorkbenchCreationInput) {
  return [
    input.filename,
    input.sceneLabel,
    input.modelLabel,
    input.mediaType,
    input.prompt,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function createWorkbenchCreation(
  input: CreateWorkbenchCreationInput,
) {
  const [created] = await db()
    .insert(workbenchCreation)
    .values({
      id: randomUUID(),
      userId: input.userId,
      mediaType: input.mediaType,
      sceneId: input.sceneId || null,
      sceneLabel: input.sceneLabel || null,
      modelUrl: input.modelUrl || null,
      modelLabel: input.modelLabel || null,
      filename: input.filename,
      url: input.url,
      mimeType: input.mimeType || null,
      fileSize: input.fileSize ?? null,
      prompt: input.prompt || null,
      params: input.params ? JSON.stringify(input.params) : null,
      aspectRatio: input.aspectRatio || null,
      keywordText: buildKeywordText(input),
    })
    .returning();

  return created;
}

export async function findWorkbenchCreationByUserAndUrl(
  userId: string,
  url: string,
) {
  const [result] = await db()
    .select()
    .from(workbenchCreation)
    .where(
      and(eq(workbenchCreation.userId, userId), eq(workbenchCreation.url, url)),
    )
    .limit(1);

  return result;
}

export async function listWorkbenchCreations(
  input: ListWorkbenchCreationsInput,
) {
  const conditions = [eq(workbenchCreation.userId, input.userId)];

  if (input.mediaType && input.mediaType !== "all") {
    conditions.push(eq(workbenchCreation.mediaType, input.mediaType));
  }

  const assetCategoryCondition = buildAssetCategoryCondition(
    input.assetCategory,
  );
  if (assetCategoryCondition) {
    conditions.push(assetCategoryCondition);
  }

  if (input.sceneId && input.sceneId !== "all") {
    conditions.push(eq(workbenchCreation.sceneId, input.sceneId));
  }

  if (input.modelUrl && input.modelUrl !== "all") {
    conditions.push(eq(workbenchCreation.modelUrl, input.modelUrl));
  }

  if (input.startDate) {
    conditions.push(gte(workbenchCreation.createdAt, input.startDate));
  }

  if (input.endDate) {
    conditions.push(lte(workbenchCreation.createdAt, input.endDate));
  }

  if (input.keyword) {
    const keyword = `%${input.keyword.trim()}%`;
    conditions.push(
      or(
        ilike(workbenchCreation.filename, keyword),
        ilike(workbenchCreation.sceneLabel, keyword),
        ilike(workbenchCreation.modelLabel, keyword),
        ilike(workbenchCreation.prompt, keyword),
        ilike(workbenchCreation.keywordText, keyword),
      )!,
    );
  }

  return db()
    .select()
    .from(workbenchCreation)
    .where(and(...conditions))
    .orderBy(desc(workbenchCreation.createdAt))
    .offset(input.offset ?? 0)
    .limit(input.limit ?? 100);
}

export async function deleteWorkbenchCreationById(id: string, userId: string) {
  const [deleted] = await db()
    .delete(workbenchCreation)
    .where(
      and(eq(workbenchCreation.id, id), eq(workbenchCreation.userId, userId)),
    )
    .returning();

  return deleted;
}
