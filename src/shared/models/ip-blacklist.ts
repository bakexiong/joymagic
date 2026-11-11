import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { ipBlacklist } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';

export type IPBlacklist = typeof ipBlacklist.$inferSelect;
type NewIPBlacklistBase = typeof ipBlacklist.$inferInsert;
// 调用方不需要传 id/createdAt/updatedAt，这些由服务端生成
export type NewIPBlacklist = Omit<
    NewIPBlacklistBase,
    'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateIPBlacklist = Partial<
    Omit<NewIPBlacklistBase, 'id' | 'createdAt'>
>;

/**
 * 创建 IP 黑名单记录
 */
export async function createIPBlacklist(
    newIPBlacklist: NewIPBlacklist
): Promise<IPBlacklist> {
    const [result] = await db()
        .insert(ipBlacklist)
        .values({
            id: getUuid(),
            ...newIPBlacklist,
        })
        .returning();

    return result;
}

/**
 * 更新 IP 黑名单记录
 */
export async function updateIPBlacklist(
    id: string,
    updateIPBlacklist: UpdateIPBlacklist
): Promise<IPBlacklist> {
    const [result] = await db()
        .update(ipBlacklist)
        .set(updateIPBlacklist)
        .where(eq(ipBlacklist.id, id))
        .returning();

    return result;
}

/**
 * 删除 IP 黑名单记录
 */
export async function deleteIPBlacklist(id: string): Promise<void> {
    await db().delete(ipBlacklist).where(eq(ipBlacklist.id, id));
}

/**
 * 根据 ID 查找 IP 黑名单记录
 */
export async function findIPBlacklistById(id: string): Promise<IPBlacklist | undefined> {
    const [result] = await db()
        .select()
        .from(ipBlacklist)
        .where(eq(ipBlacklist.id, id));

    return result;
}

/**
 * 根据 IP 地址查找黑名单记录
 */
export async function findIPBlacklistByIP(ip: string): Promise<IPBlacklist | undefined> {
    const [result] = await db()
        .select()
        .from(ipBlacklist)
        .where(eq(ipBlacklist.ip, ip));

    return result;
}

/**
 * 检查 IP 是否在黑名单中（仅检查活跃状态）
 */
export async function isIPBlacklisted(ip: string): Promise<boolean> {
    if (!ip) {
        return false;
    }

    const [result] = await db()
        .select()
        .from(ipBlacklist)
        .where(and(eq(ipBlacklist.ip, ip), eq(ipBlacklist.status, 'active')))
        .limit(1);

    return !!result;
}

/**
 * 获取 IP 黑名单列表
 */
export async function getIPBlacklists({
    page = 1,
    limit = 30,
    ip,
    status,
}: {
    page?: number;
    limit?: number;
    ip?: string;
    status?: string;
} = {}): Promise<IPBlacklist[]> {
    const conditions = [];

    if (ip) {
        conditions.push(eq(ipBlacklist.ip, ip));
    }

    if (status) {
        conditions.push(eq(ipBlacklist.status, status));
    }

    const result = await db()
        .select()
        .from(ipBlacklist)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(ipBlacklist.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

    return result;
}

/**
 * 获取 IP 黑名单总数
 */
export async function getIPBlacklistsCount({
    ip,
    status,
}: {
    ip?: string;
    status?: string;
} = {}): Promise<number> {
    const conditions = [];

    if (ip) {
        conditions.push(eq(ipBlacklist.ip, ip));
    }

    if (status) {
        conditions.push(eq(ipBlacklist.status, status));
    }

    const [result] = await db()
        .select({ count: count() })
        .from(ipBlacklist)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result?.count || 0;
}

