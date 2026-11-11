import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/core/db";
import { iapGoogleEvent, iapGooglePurchase } from "@/config/db/schema";

export type GooglePlayPurchase = typeof iapGooglePurchase.$inferSelect;
export type NewGooglePlayPurchase = typeof iapGooglePurchase.$inferInsert;
export type UpdateGooglePlayPurchase = Partial<
  Omit<NewGooglePlayPurchase, "id" | "serverOrderNo" | "purchaseToken" | "createdAt">
>;

export type GooglePlayEvent = typeof iapGoogleEvent.$inferSelect;
export type NewGooglePlayEvent = typeof iapGoogleEvent.$inferInsert;
export type UpdateGooglePlayEvent = Partial<Omit<NewGooglePlayEvent, "id" | "createdAt">>;

export async function findGooglePlayPurchaseByToken(purchaseToken: string) {
  const [result] = await db()
    .select()
    .from(iapGooglePurchase)
    .where(eq(iapGooglePurchase.purchaseToken, purchaseToken))
    .limit(1);

  return result;
}

export async function findGooglePlayPurchaseByServerOrderNo(serverOrderNo: string) {
  const [result] = await db()
    .select()
    .from(iapGooglePurchase)
    .where(eq(iapGooglePurchase.serverOrderNo, serverOrderNo))
    .limit(1);

  return result;
}

export async function createGooglePlayPurchase(newPurchase: NewGooglePlayPurchase) {
  const [result] = await db()
    .insert(iapGooglePurchase)
    .values(newPurchase)
    .returning();

  return result;
}

export async function updateGooglePlayPurchaseByToken(
  purchaseToken: string,
  updatePurchase: UpdateGooglePlayPurchase
) {
  const [result] = await db()
    .update(iapGooglePurchase)
    .set(updatePurchase)
    .where(eq(iapGooglePurchase.purchaseToken, purchaseToken))
    .returning();

  return result;
}

export async function saveGooglePlayPurchase(
  newPurchase: NewGooglePlayPurchase,
  existingPurchase?: GooglePlayPurchase | null
) {
  if (existingPurchase) {
    return updateGooglePlayPurchaseByToken(existingPurchase.purchaseToken, {
      userId: newPurchase.userId,
      platform: newPurchase.platform,
      packageName: newPurchase.packageName,
      productId: newPurchase.productId,
      productType: newPurchase.productType,
      orderId: newPurchase.orderId,
      purchaseState: newPurchase.purchaseState,
      verifyStatus: newPurchase.verifyStatus,
      entitlementCode: newPurchase.entitlementCode,
      entitlementStatus: newPurchase.entitlementStatus,
      acknowledgementState: newPurchase.acknowledgementState,
      purchaseTime: newPurchase.purchaseTime,
      startAt: newPurchase.startAt,
      expireAt: newPurchase.expireAt,
      lastVerifiedAt: newPurchase.lastVerifiedAt,
      lastNotificationType: newPurchase.lastNotificationType,
      lastNotificationAt: newPurchase.lastNotificationAt,
      restoreTaskId: newPurchase.restoreTaskId,
      linkedOrderNo: newPurchase.linkedOrderNo,
      linkedSubscriptionNo: newPurchase.linkedSubscriptionNo,
      clientTraceId: newPurchase.clientTraceId,
      idempotencyKey: newPurchase.idempotencyKey,
      googlePayload: newPurchase.googlePayload,
      deletedAt: null,
    });
  }

  return createGooglePlayPurchase(newPurchase);
}

export async function getGooglePlayPurchasesByUserId(
  userId: string,
  options?: {
    packageName?: string;
    includeExpired?: boolean;
  }
) {
  const now = new Date();

  return db()
    .select()
    .from(iapGooglePurchase)
    .where(
      and(
        eq(iapGooglePurchase.userId, userId),
        options?.packageName
          ? eq(iapGooglePurchase.packageName, options.packageName)
          : undefined,
        options?.includeExpired
          ? undefined
          : or(
              eq(iapGooglePurchase.entitlementStatus, "ACTIVE"),
              and(
                eq(iapGooglePurchase.entitlementStatus, "EXPIRED"),
                sql`${iapGooglePurchase.expireAt} > ${now}`,
              )
            ),
        isNull(iapGooglePurchase.deletedAt)
      )
    )
    .orderBy(desc(iapGooglePurchase.updatedAt));
}

export async function getGooglePlayEntitlementsByUserId(userId: string) {
  const now = new Date();

  return db()
    .select()
    .from(iapGooglePurchase)
    .where(
      and(
        eq(iapGooglePurchase.userId, userId),
        inArray(iapGooglePurchase.entitlementStatus, ["ACTIVE", "GRACE_PERIOD"]),
        or(isNull(iapGooglePurchase.expireAt), sql`${iapGooglePurchase.expireAt} > ${now}`),
        isNull(iapGooglePurchase.deletedAt)
      )
    )
    .orderBy(desc(iapGooglePurchase.updatedAt));
}

export async function createGooglePlayEvent(newEvent: NewGooglePlayEvent) {
  const [result] = await db().insert(iapGoogleEvent).values(newEvent).returning();
  return result;
}

export async function updateGooglePlayEvent(id: string, updateEvent: UpdateGooglePlayEvent) {
  const [result] = await db()
    .update(iapGoogleEvent)
    .set(updateEvent)
    .where(eq(iapGoogleEvent.id, id))
    .returning();

  return result;
}
