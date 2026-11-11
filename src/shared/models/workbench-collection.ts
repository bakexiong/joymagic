import { randomUUID } from "crypto";

import { and, count, desc, eq, ilike, inArray, ne } from "drizzle-orm";

import {
  workbenchCollection,
  workbenchCollectionCreation,
  workbenchCreation,
} from "@/config/db/schema";
import { db } from "@/core/db";

const MAX_COLLECTION_NAME_LENGTH = 60;

function normalizeCollectionName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error("collection name is required");
  }

  if (normalized.length > MAX_COLLECTION_NAME_LENGTH) {
    throw new Error(
      `collection name must be at most ${MAX_COLLECTION_NAME_LENGTH} characters`,
    );
  }

  return normalized;
}

async function ensureUniqueCollectionName(
  userId: string,
  name: string,
  excludeId?: string,
) {
  const conditions = [
    eq(workbenchCollection.userId, userId),
    ilike(workbenchCollection.name, name),
  ];

  if (excludeId) {
    conditions.push(ne(workbenchCollection.id, excludeId));
  }

  const [existing] = await db()
    .select({ id: workbenchCollection.id })
    .from(workbenchCollection)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new Error("collection name already exists");
  }
}

export async function listWorkbenchCollections(userId: string) {
  const collections = await db()
    .select({
      id: workbenchCollection.id,
      userId: workbenchCollection.userId,
      name: workbenchCollection.name,
      createdAt: workbenchCollection.createdAt,
      updatedAt: workbenchCollection.updatedAt,
    })
    .from(workbenchCollection)
    .where(eq(workbenchCollection.userId, userId))
    .orderBy(
      desc(workbenchCollection.updatedAt),
      desc(workbenchCollection.createdAt),
    );

  if (collections.length === 0) {
    return [];
  }

  const collectionIds = collections.map((collection) => collection.id);
  const assetCounts = await db()
    .select({
      collectionId: workbenchCollectionCreation.collectionId,
      assetCount: count(),
    })
    .from(workbenchCollectionCreation)
    .where(
      and(
        eq(workbenchCollectionCreation.userId, userId),
        inArray(workbenchCollectionCreation.collectionId, collectionIds),
      ),
    )
    .groupBy(workbenchCollectionCreation.collectionId);

  const assetCountMap = new Map(
    assetCounts.map((item) => [item.collectionId, item.assetCount]),
  );

  const coverRows = await db()
    .select({
      collectionId: workbenchCollectionCreation.collectionId,
      coverUrl: workbenchCreation.url,
    })
    .from(workbenchCollectionCreation)
    .innerJoin(
      workbenchCreation,
      eq(workbenchCreation.id, workbenchCollectionCreation.creationId),
    )
    .where(
      and(
        eq(workbenchCollectionCreation.userId, userId),
        inArray(workbenchCollectionCreation.collectionId, collectionIds),
        eq(workbenchCreation.mediaType, "image"),
      ),
    )
    .orderBy(desc(workbenchCollectionCreation.createdAt));

  const coverUrlMap = new Map<string, string>();
  for (const row of coverRows) {
    if (!coverUrlMap.has(row.collectionId)) {
      coverUrlMap.set(row.collectionId, row.coverUrl);
    }
  }

  return collections.map((collection) => ({
    ...collection,
    assetCount: assetCountMap.get(collection.id) ?? 0,
    coverUrl: coverUrlMap.get(collection.id) ?? null,
  }));
}

export async function listWorkbenchCollectionsBasic(userId: string) {
  const collections = await db()
    .select({
      id: workbenchCollection.id,
      userId: workbenchCollection.userId,
      name: workbenchCollection.name,
      createdAt: workbenchCollection.createdAt,
      updatedAt: workbenchCollection.updatedAt,
    })
    .from(workbenchCollection)
    .where(eq(workbenchCollection.userId, userId))
    .orderBy(
      desc(workbenchCollection.updatedAt),
      desc(workbenchCollection.createdAt),
    );

  if (collections.length === 0) {
    return [];
  }

  const collectionIds = collections.map((collection) => collection.id);
  const coverRows = await db()
    .select({
      collectionId: workbenchCollectionCreation.collectionId,
      coverUrl: workbenchCreation.url,
    })
    .from(workbenchCollectionCreation)
    .innerJoin(
      workbenchCreation,
      eq(workbenchCreation.id, workbenchCollectionCreation.creationId),
    )
    .where(
      and(
        eq(workbenchCollectionCreation.userId, userId),
        inArray(workbenchCollectionCreation.collectionId, collectionIds),
        eq(workbenchCreation.mediaType, "image"),
      ),
    )
    .orderBy(desc(workbenchCollectionCreation.createdAt));

  const coverUrlMap = new Map<string, string>();
  for (const row of coverRows) {
    if (!coverUrlMap.has(row.collectionId)) {
      coverUrlMap.set(row.collectionId, row.coverUrl);
    }
  }

  return collections.map((collection) => ({
    ...collection,
    coverUrl: coverUrlMap.get(collection.id) ?? null,
  }));
}

export async function createWorkbenchCollection(input: {
  userId: string;
  name: string;
}) {
  const name = normalizeCollectionName(input.name);
  await ensureUniqueCollectionName(input.userId, name);

  const [created] = await db()
    .insert(workbenchCollection)
    .values({
      id: randomUUID(),
      userId: input.userId,
      name,
    })
    .returning();

  return created;
}

export async function renameWorkbenchCollection(input: {
  id: string;
  userId: string;
  name: string;
}) {
  const name = normalizeCollectionName(input.name);
  await ensureUniqueCollectionName(input.userId, name, input.id);

  const [updated] = await db()
    .update(workbenchCollection)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workbenchCollection.id, input.id),
        eq(workbenchCollection.userId, input.userId),
      ),
    )
    .returning();

  return updated;
}

export async function deleteWorkbenchCollectionById(
  id: string,
  userId: string,
) {
  const [deleted] = await db()
    .delete(workbenchCollection)
    .where(
      and(
        eq(workbenchCollection.id, id),
        eq(workbenchCollection.userId, userId),
      ),
    )
    .returning();

  return deleted;
}
