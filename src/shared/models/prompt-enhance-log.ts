import { db } from '@/core/db';
import { promptEnhanceLog } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';

export type PromptEnhanceLog = typeof promptEnhanceLog.$inferSelect;
type NewPromptEnhanceLogBase = typeof promptEnhanceLog.$inferInsert;
export type NewPromptEnhanceLog = Omit<NewPromptEnhanceLogBase, 'id' | 'createdAt'>;

export async function createPromptEnhanceLog(
  payload: NewPromptEnhanceLog
): Promise<PromptEnhanceLog> {
  const [result] = await db()
    .insert(promptEnhanceLog)
    .values({
      id: getUuid(),
      ...payload,
    })
    .returning();

  return result;
}
