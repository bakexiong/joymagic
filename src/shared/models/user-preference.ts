import { eq, and } from 'drizzle-orm';
import { db } from '@/core/db';
import { userPreference } from '@/config/db/schema';

export type UserPreference = typeof userPreference.$inferSelect;
export type NewUserPreference = typeof userPreference.$inferInsert;

/**
 * 获取用户的特定配置项
 */
export async function getUserPreference(userId: string, key: string): Promise<string | null> {
  const [result] = await db()
    .select()
    .from(userPreference)
    .where(and(eq(userPreference.userId, userId), eq(userPreference.key, key)));

  return result?.value || null;
}

/**
 * 设置用户的配置项
 */
export async function setUserPreference(userId: string, key: string, value: string): Promise<UserPreference> {
  // 先查询是否存在
  const existing = await db()
    .select()
    .from(userPreference)
    .where(and(eq(userPreference.userId, userId), eq(userPreference.key, key)));

  if (existing.length > 0) {
    // 更新现有配置
    const [updated] = await db()
      .update(userPreference)
      .set({ value, updatedAt: new Date() })
      .where(and(eq(userPreference.userId, userId), eq(userPreference.key, key)))
      .returning();
    return updated;
  } else {
    // 创建新配置
    const [created] = await db()
      .insert(userPreference)
      .values({
        id: `${userId}_${key}_${Date.now()}`,
        userId,
        key,
        value,
      })
      .returning();
    return created;
  }
}

/**
 * 删除用户的配置项
 */
export async function deleteUserPreference(userId: string, key: string): Promise<void> {
  await db()
    .delete(userPreference)
    .where(and(eq(userPreference.userId, userId), eq(userPreference.key, key)));
}

/**
 * 获取用户的所有配置项
 */
export async function getAllUserPreferences(userId: string): Promise<Record<string, string>> {
  const results = await db()
    .select()
    .from(userPreference)
    .where(eq(userPreference.userId, userId));

  return results.reduce((acc, item) => {
    acc[item.key] = item.value || '';
    return acc;
  }, {} as Record<string, string>);
}
