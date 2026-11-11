import { desc, eq } from "drizzle-orm";

import { aiCharacter } from "@/config/db/schema";
import { db } from "@/core/db";

export type AICharacter = typeof aiCharacter.$inferSelect;
export type NewAICharacter = typeof aiCharacter.$inferInsert;
export type UpdateAICharacter = Partial<Omit<NewAICharacter, "id" | "createdAt">>;

export async function createAICharacter(newAICharacter: NewAICharacter) {
  const [result] = await db()
    .insert(aiCharacter)
    .values(newAICharacter)
    .returning();

  return result;
}

export async function findAICharacterById(id: string) {
  const [result] = await db()
    .select()
    .from(aiCharacter)
    .where(eq(aiCharacter.id, id));

  return result;
}

export async function updateAICharacterById(
  id: string,
  updateAICharacter: UpdateAICharacter,
) {
  const [result] = await db()
    .update(aiCharacter)
    .set(updateAICharacter)
    .where(eq(aiCharacter.id, id))
    .returning();

  return result;
}

export async function updateAICharacterByProviderTaskId(
  providerTaskId: string,
  updateAICharacter: UpdateAICharacter,
) {
  const [result] = await db()
    .update(aiCharacter)
    .set(updateAICharacter)
    .where(eq(aiCharacter.providerTaskId, providerTaskId))
    .returning();

  return result;
}

export async function getAICharactersByUserId(userId: string) {
  return db()
    .select()
    .from(aiCharacter)
    .where(eq(aiCharacter.userId, userId))
    .orderBy(desc(aiCharacter.createdAt));
}

export async function getLatestAICharacterByUserId(userId: string) {
  const [result] = await db()
    .select()
    .from(aiCharacter)
    .where(eq(aiCharacter.userId, userId))
    .orderBy(desc(aiCharacter.updatedAt), desc(aiCharacter.createdAt))
    .limit(1);

  return result;
}
