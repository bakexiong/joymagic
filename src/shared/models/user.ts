import { headers } from "next/headers";
import { count, desc, eq, inArray, sql } from "drizzle-orm";

import { getAuth } from "@/core/auth";
import { db } from "@/core/db";
import { user } from "@/config/db/schema";

import { Permission, Role } from "../services/rbac";
import { getRemainingCredits } from "./credit";

// Permanent free image generations (one-time grant)
const PERMANENT_FREE_IMAGE_GENERATIONS = 2;

export interface UserCredits {
  remainingCredits: number;
  expiresAt: Date | null;
}

export type User = typeof user.$inferSelect & {
  isAdmin?: boolean;
  credits?: UserCredits;
  roles?: Role[];
  permissions?: Permission[];
  // 未配置过时为 undefined；用户显式清空后可能为 []
  pinnedTools?: string[];
};
export type NewUser = typeof user.$inferInsert;
export type UpdateUser = Partial<Omit<NewUser, "id" | "createdAt" | "email">>;

export async function updateUser(userId: string, updatedUser: UpdateUser) {
  const [result] = await db()
    .update(user)
    .set(updatedUser)
    .where(eq(user.id, userId))
    .returning();

  return result;
}

export async function findUserById(userId: string) {
  const [result] = await db().select().from(user).where(eq(user.id, userId));

  return result;
}

export async function isUserNsfwWhitelisted(userId: string) {
  const currentUser = await findUserById(userId);
  return Boolean(currentUser?.nsfwWhitelisted);
}

export async function grantUserNsfwWhitelist(userId: string) {
  const [result] = await db()
    .update(user)
    .set({
      nsfwWhitelisted: true,
    })
    .where(eq(user.id, userId))
    .returning();

  return result;
}

export async function findUserByEmail(email: string) {
  const [result] = await db().select().from(user).where(eq(user.email, email));

  return result;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeEmailIdentity(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const [localPart, domainPart] = normalizedEmail.split("@");

  if (!localPart || !domainPart) {
    return normalizedEmail;
  }

  if (domainPart === "gmail.com" || domainPart === "googlemail.com") {
    const gmailLocalPart = localPart.split("+")[0].replace(/\./g, "");
    return `${gmailLocalPart}@gmail.com`;
  }

  return normalizedEmail;
}

export async function findUserByEmailIdentity(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const [exactMatch] = await db()
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedIdentity = normalizeEmailIdentity(normalizedEmail);

  if (normalizedIdentity === normalizedEmail) {
    return undefined;
  }

  const candidates = await db()
    .select()
    .from(user)
    .where(
      sql`lower(${user.email}) like '%@gmail.com' or lower(${user.email}) like '%@googlemail.com'`,
    );

  return candidates.find(
    (candidate) =>
      normalizeEmailIdentity(candidate.email) === normalizedIdentity,
  );
}

export async function getUsers({
  page = 1,
  limit = 30,
  email,
}: {
  email?: string;
  page?: number;
  limit?: number;
} = {}): Promise<User[]> {
  const result = await db()
    .select()
    .from(user)
    .where(email ? eq(user.email, email) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return result;
}

export async function getUsersCount({ email }: { email?: string }) {
  const [result] = await db()
    .select({ count: count() })
    .from(user)
    .where(email ? eq(user.email, email) : undefined);
  return result?.count || 0;
}

export async function getUserByUserIds(userIds: string[]) {
  const result = await db()
    .select()
    .from(user)
    .where(inArray(user.id, userIds));

  return result;
}

export async function getUserInfo() {
  const signUser = await getSignUser();

  return signUser;
}

export async function getUserCredits(userId: string) {
  const remainingCredits = await getRemainingCredits(userId);

  return { remainingCredits };
}

export async function getSignUser() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user;
}

export async function appendUserToResult(result: any) {
  if (!result || !result.length) {
    return result;
  }

  const userIds = result.map((item: any) => item.userId);
  const users = await getUserByUserIds(userIds);
  result = result.map((item: any) => {
    const user = users.find((user: any) => user.id === item.userId);
    return { ...item, user };
  });

  return result;
}

/**
 * Check and grant permanent free image generations
 * Grants 2 free generations once per user (permanent, no daily reset)
 * Returns the updated user or null if user not found
 */
export async function checkAndGrantDailyFreeGenerations(userId: string) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    return null;
  }

  // Only grant if user has never received free generations before
  // Check if freeImageGenerationsLastReset is null (never granted) or if freeImageGenerations is 0 and never reset
  const hasNeverReceived = !currentUser.freeImageGenerationsLastReset;
  const needsInitialGrant =
    hasNeverReceived &&
    (currentUser.freeImageGenerations === 0 ||
      currentUser.freeImageGenerations === null);

  if (needsInitialGrant) {
    const now = new Date();
    const [updated] = await db()
      .update(user)
      .set({
        freeImageGenerations: PERMANENT_FREE_IMAGE_GENERATIONS,
        freeImageGenerationsLastReset: now, // Mark as granted (but won't reset daily)
      })
      .where(eq(user.id, userId))
      .returning();

    return updated || currentUser;
  }

  return currentUser;
}

/**
 * Consume one free image generation.
 * Returns true if consumed successfully, false if no free generations available.
 */
export async function consumeFreeImageGeneration(
  userId: string,
): Promise<boolean> {
  // Only consume existing free generations; do not auto-grant.
  const currentUser = await findUserById(userId);

  if (!currentUser || currentUser.freeImageGenerations <= 0) {
    return false;
  }

  // Update in a single operation
  const [updated] = await db()
    .update(user)
    .set({
      freeImageGenerations: currentUser.freeImageGenerations - 1,
    })
    .where(eq(user.id, userId))
    .returning();

  return !!updated;
}
