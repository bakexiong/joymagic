import { randomUUID } from "crypto";

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import {
  workbenchCollection,
  workbenchCollectionCreation,
  workbenchCreation,
} from "@/config/db/schema";
import { db } from "@/core/db";

export async function addCreationsToWorkbenchCollection(input: {
  userId: string;
  collectionId: string;
  creationIds: string[];
}) {
  const creationIds = Array.from(
    new Set(input.creationIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (creationIds.length === 0) {
    throw new Error("no creations selected");
  }

  const [collection] = await db()
    .select({ id: workbenchCollection.id })
    .from(workbenchCollection)
    .where(
      and(
        eq(workbenchCollection.id, input.collectionId),
        eq(workbenchCollection.userId, input.userId),
      ),
    )
    .limit(1);

  if (!collection) {
    throw new Error("collection not found");
  }

  const ownedCreations = await db()
    .select({ id: workbenchCreation.id })
    .from(workbenchCreation)
    .where(
      and(
        eq(workbenchCreation.userId, input.userId),
        inArray(workbenchCreation.id, creationIds),
      ),
    );

  if (ownedCreations.length !== creationIds.length) {
    throw new Error("some creations were not found");
  }

  await db()
    .insert(workbenchCollectionCreation)
    .values(
      creationIds.map((creationId) => ({
        id: randomUUID(),
        userId: input.userId,
        collectionId: input.collectionId,
        creationId,
      })),
    )
    .onConflictDoNothing();

  const [result] = await db()
    .select({ count: count() })
    .from(workbenchCollectionCreation)
    .where(eq(workbenchCollectionCreation.collectionId, input.collectionId));

  return {
    collectionId: input.collectionId,
    assetCount: Number(result?.count ?? 0),
  };
}

export async function listWorkbenchCollectionCreations(input: {
  userId: string;
  collectionId: string;
  mediaType?: string;
  assetCategory?: string;
  sceneId?: string;
  modelUrl?: string;
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const conditions = [
    eq(workbenchCollectionCreation.userId, input.userId),
    eq(workbenchCollectionCreation.collectionId, input.collectionId),
  ];

  if (input.mediaType && input.mediaType !== "all") {
    conditions.push(eq(workbenchCreation.mediaType, input.mediaType));
  }

  const sceneId = sql`coalesce(${workbenchCreation.sceneId}, '')`;
  const isEffectScene = sql`(${sceneId} ilike 'image-effect-%' or ${sceneId} ilike 'video-effect-%')`;
  if (input.assetCategory === "effect") {
    conditions.push(isEffectScene);
  } else if (input.assetCategory === "voice") {
    conditions.push(
      sql`${workbenchCreation.mediaType} in ('audio', 'voice', 'speech', 'music')`,
    );
  } else if (input.assetCategory === "video") {
    conditions.push(
      sql`${workbenchCreation.mediaType} = 'video' and not ${isEffectScene}`,
    );
  } else if (input.assetCategory === "photo") {
    conditions.push(
      sql`${workbenchCreation.mediaType} = 'image' and not ${isEffectScene}`,
    );
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
      )!,
    );
  }

  const [collection] = await db()
    .select({ id: workbenchCollection.id, name: workbenchCollection.name })
    .from(workbenchCollection)
    .where(
      and(
        eq(workbenchCollection.id, input.collectionId),
        eq(workbenchCollection.userId, input.userId),
      ),
    )
    .limit(1);

  if (!collection) {
    throw new Error("collection not found");
  }

  const items = await db()
    .select({
      id: workbenchCreation.id,
      mediaType: workbenchCreation.mediaType,
      sceneId: workbenchCreation.sceneId,
      sceneLabel: workbenchCreation.sceneLabel,
      modelUrl: workbenchCreation.modelUrl,
      modelLabel: workbenchCreation.modelLabel,
      filename: workbenchCreation.filename,
      url: workbenchCreation.url,
      mimeType: workbenchCreation.mimeType,
      prompt: workbenchCreation.prompt,
      params: workbenchCreation.params,
      aspectRatio: workbenchCreation.aspectRatio,
      createdAt: workbenchCreation.createdAt,
    })
    .from(workbenchCollectionCreation)
    .innerJoin(
      workbenchCreation,
      eq(workbenchCreation.id, workbenchCollectionCreation.creationId),
    )
    .where(and(...conditions))
    .orderBy(desc(workbenchCollectionCreation.createdAt))
    .offset(input.offset ?? 0)
    .limit(input.limit ?? 100);

  return {
    collection,
    items,
  };
}

export async function removeCreationsFromWorkbenchCollection(input: {
  userId: string;
  collectionId: string;
  creationIds: string[];
}) {
  const creationIds = Array.from(
    new Set(input.creationIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (creationIds.length === 0) {
    throw new Error("no creations selected");
  }

  const [collection] = await db()
    .select({ id: workbenchCollection.id })
    .from(workbenchCollection)
    .where(
      and(
        eq(workbenchCollection.id, input.collectionId),
        eq(workbenchCollection.userId, input.userId),
      ),
    )
    .limit(1);

  if (!collection) {
    throw new Error("collection not found");
  }

  await db()
    .delete(workbenchCollectionCreation)
    .where(
      and(
        eq(workbenchCollectionCreation.userId, input.userId),
        eq(workbenchCollectionCreation.collectionId, input.collectionId),
        inArray(workbenchCollectionCreation.creationId, creationIds),
      ),
    );

  const [result] = await db()
    .select({ count: count() })
    .from(workbenchCollectionCreation)
    .where(eq(workbenchCollectionCreation.collectionId, input.collectionId));

  return {
    collectionId: input.collectionId,
    assetCount: Number(result?.count ?? 0),
  };
}
