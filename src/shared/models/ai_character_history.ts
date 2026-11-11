import { and, desc, eq, max } from "drizzle-orm";

import { aiCharacterHistory } from "@/config/db/schema";
import { db } from "@/core/db";

export type AICharacterHistory = typeof aiCharacterHistory.$inferSelect;
export type NewAICharacterHistory = typeof aiCharacterHistory.$inferInsert;

export async function createAICharacterHistory(
  newHistory: NewAICharacterHistory,
) {
  const [result] = await db()
    .insert(aiCharacterHistory)
    .values(newHistory)
    .returning();

  return result;
}

export async function getAICharacterHistories(characterId: string, userId: string) {
  return db()
    .select()
    .from(aiCharacterHistory)
    .where(
      and(
        eq(aiCharacterHistory.characterId, characterId),
        eq(aiCharacterHistory.userId, userId),
      ),
    )
    .orderBy(desc(aiCharacterHistory.version), desc(aiCharacterHistory.createdAt));
}

export async function findAICharacterHistoryByVersion(
  characterId: string,
  userId: string,
  version: number,
) {
  const [result] = await db()
    .select()
    .from(aiCharacterHistory)
    .where(
      and(
        eq(aiCharacterHistory.characterId, characterId),
        eq(aiCharacterHistory.userId, userId),
        eq(aiCharacterHistory.version, version),
      ),
    );

  return result;
}

export async function getNextAICharacterHistoryVersion(characterId: string) {
  const [result] = await db()
    .select({
      version: max(aiCharacterHistory.version),
    })
    .from(aiCharacterHistory)
    .where(eq(aiCharacterHistory.characterId, characterId));

  return (result?.version || 0) + 1;
}

export async function updateAICharacterHistorySnapshot(
  characterId: string,
  version: number,
  snapshot: string,
  changes?: string | null,
) {
  const [result] = await db()
    .update(aiCharacterHistory)
    .set({
      snapshot,
      ...(changes !== undefined ? { changes } : {}),
    })
    .where(
      and(
        eq(aiCharacterHistory.characterId, characterId),
        eq(aiCharacterHistory.version, version),
      ),
    )
    .returning();

  return result;
}
