import { desc, eq } from "drizzle-orm";

import { aiCharacterPerspective } from "@/config/db/schema";
import { db } from "@/core/db";

export type AICharacterPerspective = typeof aiCharacterPerspective.$inferSelect;
export type NewAICharacterPerspective = typeof aiCharacterPerspective.$inferInsert;
export type UpdateAICharacterPerspective = Partial<
  Omit<NewAICharacterPerspective, "id" | "createdAt">
>;

export async function createAICharacterPerspective(
  newPerspective: NewAICharacterPerspective,
) {
  const [result] = await db()
    .insert(aiCharacterPerspective)
    .values(newPerspective)
    .returning();

  return result;
}

export async function updateAICharacterPerspectiveByProviderTaskId(
  providerTaskId: string,
  updatePerspective: UpdateAICharacterPerspective,
) {
  const [result] = await db()
    .update(aiCharacterPerspective)
    .set(updatePerspective)
    .where(eq(aiCharacterPerspective.providerTaskId, providerTaskId))
    .returning();

  return result;
}

export async function getAICharacterPerspectives(characterId: string) {
  return db()
    .select()
    .from(aiCharacterPerspective)
    .where(eq(aiCharacterPerspective.characterId, characterId))
    .orderBy(desc(aiCharacterPerspective.createdAt));
}
