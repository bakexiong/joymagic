import { cookies, headers } from "next/headers";
import { and, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/core/db";
import {
  account,
  affiliateApplication,
  affiliateCommission,
  affiliatePayout,
  affiliateProfile,
  affiliateProgram,
  affiliateReferral,
  affiliateReferralVisit,
  order,
  subscription,
  user,
} from "@/config/db/schema";
import { emailService } from "@/shared/lib/email";
import { getSnowId, getUniSeq, getUuid } from "@/shared/lib/hash";
import {
  deleteAffiliateDiscountCodeFromCreem,
  syncAffiliateDiscountCodeToCreem,
} from "@/shared/services/creem-discounts";
import {
  AFFILIATE_COOKIE_NAME,
  AffiliateAttributionCookie,
} from "@/shared/types/affiliate";

import { getAllConfigs } from "./config";
import {
  findUserByEmailIdentity,
  findUserById,
  getUserByUserIds,
  normalizeEmail,
  User,
} from "./user";

export enum AffiliateApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELED = "canceled",
}

export enum AffiliateProfileStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  BLACKLISTED = "blacklisted",
  CLOSED = "closed",
}

export enum AffiliateTier {
  STANDARD = "standard",
  KOL = "kol",
}

export enum AffiliateCommissionStatus {
  PENDING = "pending",
  AVAILABLE = "available",
  LOCKED = "locked",
  PAYOUT_REQUESTED = "payout_requested",
  PAID = "paid",
  REJECTED = "rejected",
  REVERSED = "reversed",
}

export enum AffiliateCommissionType {
  FIRST_ORDER = "first_order",
  RENEWAL = "renewal",
  MANUAL_ADJUSTMENT = "manual_adjustment",
  REVERSAL = "reversal",
}

export enum AffiliatePayoutStatus {
  REQUESTED = "requested",
  APPROVED = "approved",
  PAID = "paid",
  REJECTED = "rejected",
  CANCELED = "canceled",
}

export type AffiliateApplication = typeof affiliateApplication.$inferSelect;
export type AffiliateProfile = typeof affiliateProfile.$inferSelect;
export type AffiliateCommission = typeof affiliateCommission.$inferSelect;
export type AffiliatePayout = typeof affiliatePayout.$inferSelect;
export type AffiliateProgram = typeof affiliateProgram.$inferSelect;
export type AffiliateReferral = typeof affiliateReferral.$inferSelect;

export interface AffiliateApplicationWithUser extends AffiliateApplication {
  user?: User;
}

export interface AffiliateProfileWithUser extends AffiliateProfile {
  user?: User;
}

export interface AffiliateCommissionWithUsers extends AffiliateCommission {
  affiliateUser?: User;
  referredUser?: User;
  sourceOrder?: typeof order.$inferSelect | null;
  sourceSubscription?: typeof subscription.$inferSelect | null;
}

export interface AffiliatePayoutWithUser extends AffiliatePayout {
  affiliateUser?: User;
}

export interface AffiliateReferralDetailItem extends AffiliateReferral {
  referredUser?: User;
  firstOrder?: typeof order.$inferSelect | null;
  firstSubscription?: typeof subscription.$inferSelect | null;
}

export interface AffiliateConversionDetailItem extends AffiliateCommission {
  referredUser?: User;
  sourceOrder?: typeof order.$inferSelect | null;
  sourceSubscription?: typeof subscription.$inferSelect | null;
}

export interface AffiliateProfileAttributionDetails {
  registrations: AffiliateReferralDetailItem[];
  conversions: AffiliateConversionDetailItem[];
}

export interface AffiliateOverviewData {
  totalAffiliates: number;
  pendingApplications: number;
  monthlyCommissionCents: number;
  pendingPayoutAmountCents: number;
  clicksThisMonth: number;
  signups: number;
  firstOrders: number;
  recentCommissions: AffiliateCommissionWithUsers[];
  latestActivities: Array<{
    type: "payout" | "application" | "commission";
    text: string;
    createdAt: Date;
  }>;
}

export interface AffiliateUserDashboardData {
  program: AffiliateProgram;
  profile: AffiliateProfile | null;
  latestApplication: AffiliateApplication | null;
  recentCommissions: AffiliateCommission[];
  recentPayouts: AffiliatePayout[];
  pendingPayout: AffiliatePayout | null;
  dailyStats: Array<{
    date: string;
    visitors: number;
    registers: number;
    payments: number;
    earningsCents: number;
    currency: string;
  }>;
}

export interface AffiliateProgramInput {
  defaultFirstOrderRateBps: number;
  defaultRenewalRateBps: number;
  defaultDiscountRateBps: number;
  minimumPayoutAmountCents: number;
  cookieTtlDays: number;
  commissionConfirmDays: number;
  antiFraudWindowMinutes: number;
  maxClicksPerIp: number;
  agreementText?: string;
  updatedBy?: string;
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getDefaultAffiliateDiscountExpiresAt(baseDate = new Date()) {
  return addDays(baseDate, 30);
}

function normalizeAffiliateDiscountExpiresAt(value?: string | Date | null) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("discount expiry is invalid");
  }

  return parsed;
}

function parseAffiliateCookie(
  value?: string | null,
): AffiliateAttributionCookie | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = (() => {
      try {
        return Buffer.from(value, "base64url").toString("utf8");
      } catch {
        return decodeURIComponent(value);
      }
    })();
    const parsed = JSON.parse(decoded);
    if (!parsed?.affiliateCode || !parsed?.expiresAt) {
      return null;
    }

    const expiresAt = new Date(parsed.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return null;
    }

    return parsed as AffiliateAttributionCookie;
  } catch {
    return null;
  }
}

async function mapUsers(userIds: string[]) {
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniq.length) {
    return new Map<string, User>();
  }
  const users = await getUserByUserIds(uniq);
  return new Map(users.map((item) => [item.id, item]));
}

async function findActiveAffiliateProfileByCode(code: string) {
  const [profile] = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.code, code.trim()),
        eq(affiliateProfile.status, AffiliateProfileStatus.ACTIVE),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  return profile;
}

async function findActiveAffiliateProfileByDiscountCode(code: string) {
  const normalizedCode = normalizeAffiliateDiscountCode(code);
  if (!normalizedCode) {
    return null;
  }

  const [profile] = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.discountCode, normalizedCode),
        eq(affiliateProfile.discountEnabled, true),
        eq(affiliateProfile.status, AffiliateProfileStatus.ACTIVE),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  return profile;
}

async function hashCredentialPassword(password: string) {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(password).digest("hex");
}

async function generateUniqueAffiliateCode(name?: string | null) {
  for (let index = 0; index < 6; index += 1) {
    const code = getAffiliateCode(name);
    const [existing] = await db()
      .select({ id: affiliateProfile.id })
      .from(affiliateProfile)
      .where(eq(affiliateProfile.code, code))
      .limit(1);

    if (!existing) {
      return code;
    }
  }

  return `${getAffiliateCode(name)}-${Date.now().toString().slice(-4)}`;
}

async function generateUniqueAffiliateDiscountCode(name?: string | null) {
  for (let index = 0; index < 8; index += 1) {
    const code = getAffiliateDiscountCode(name);
    const [existing] = await db()
      .select({ id: affiliateProfile.id })
      .from(affiliateProfile)
      .where(eq(affiliateProfile.discountCode, code))
      .limit(1);

    if (!existing) {
      return code;
    }
  }

  return `${getAffiliateDiscountCode(name)}${Date.now().toString().slice(-4)}`;
}

async function sendAffiliateNotificationEmail(opts: {
  email?: string | null;
  title: string;
  message: string;
}) {
  if (!opts.email) {
    return;
  }

  try {
    const configs = await getAllConfigs();
    await emailService.sendNotificationEmail(
      opts.email,
      opts.title,
      opts.message,
      configs,
    );
  } catch (error) {
    console.error("[affiliate] send notification email failed:", error);
  }
}

async function syncAffiliateProfileStats(affiliateProfileId: string) {
  const [commissions, referrals] = await Promise.all([
    db()
      .select()
      .from(affiliateCommission)
      .where(eq(affiliateCommission.affiliateProfileId, affiliateProfileId)),
    db()
      .select()
      .from(affiliateReferral)
      .where(eq(affiliateReferral.affiliateProfileId, affiliateProfileId)),
  ]);

  const pendingCommissionCents = commissions
    .filter((item) => item.status === AffiliateCommissionStatus.PENDING)
    .reduce((sum, item) => sum + item.commissionAmountCents, 0);
  const availableCommissionCents = commissions
    .filter((item) => item.status === AffiliateCommissionStatus.AVAILABLE)
    .reduce((sum, item) => sum + item.commissionAmountCents, 0);
  const paidCommissionCents = commissions
    .filter((item) => item.status === AffiliateCommissionStatus.PAID)
    .reduce((sum, item) => sum + item.commissionAmountCents, 0);
  const convertedOrdersCount = commissions.filter((item) =>
    [
      AffiliateCommissionType.FIRST_ORDER,
      AffiliateCommissionType.RENEWAL,
    ].includes(item.commissionType as AffiliateCommissionType),
  ).length;

  const lastReferredAt =
    referrals
      .map((item) => item.convertedAt || item.lastVisitedAt || item.createdAt)
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  await db()
    .update(affiliateProfile)
    .set({
      pendingCommissionCents,
      availableCommissionCents,
      paidCommissionCents,
      referredUsersCount: referrals.length,
      convertedOrdersCount,
      lastReferredAt,
    })
    .where(eq(affiliateProfile.id, affiliateProfileId));
}

export async function getOrCreateAffiliateProgram() {
  const [program] = await db()
    .select()
    .from(affiliateProgram)
    .where(eq(affiliateProgram.code, "default"))
    .limit(1);

  if (program) {
    return program;
  }

  const [created] = await db()
    .insert(affiliateProgram)
    .values({
      id: getUuid(),
      code: "default",
      status: "active",
    })
    .returning();

  return created;
}

export async function updateAffiliateProgram(input: AffiliateProgramInput) {
  const program = await getOrCreateAffiliateProgram();
  const [updated] = await db()
    .update(affiliateProgram)
    .set({
      defaultFirstOrderRateBps: input.defaultFirstOrderRateBps,
      defaultRenewalRateBps: input.defaultRenewalRateBps,
      defaultDiscountRateBps: input.defaultDiscountRateBps,
      minimumPayoutAmountCents: input.minimumPayoutAmountCents,
      cookieTtlDays: input.cookieTtlDays,
      commissionConfirmDays: input.commissionConfirmDays,
      antiFraudWindowMinutes: input.antiFraudWindowMinutes,
      maxClicksPerIp: input.maxClicksPerIp,
      agreementText: input.agreementText,
      updatedBy: input.updatedBy,
    })
    .where(eq(affiliateProgram.id, program.id))
    .returning();

  if (program.defaultDiscountRateBps !== input.defaultDiscountRateBps) {
    const profiles = await db()
      .select()
      .from(affiliateProfile)
      .where(
        and(
          isNull(affiliateProfile.deletedAt),
          eq(affiliateProfile.status, AffiliateProfileStatus.ACTIVE),
          eq(affiliateProfile.discountEnabled, true),
          isNull(affiliateProfile.customDiscountRateBps),
        ),
      );

    await Promise.all(
      profiles.map((profile) =>
        syncAffiliateDiscountForProfile(profile).catch((error) => {
          console.error(
            "[affiliate] failed to sync default discount to creem",
            profile.id,
            error,
          );
        }),
      ),
    );
  }

  return updated;
}

export async function getAffiliateProfiles(opts?: {
  status?: string;
  query?: string;
}) {
  const rows = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        isNull(affiliateProfile.deletedAt),
        opts?.status && opts.status !== "all"
          ? eq(affiliateProfile.status, opts.status)
          : undefined,
      ),
    )
    .orderBy(desc(affiliateProfile.createdAt));

  const userMap = await mapUsers(rows.map((item) => item.userId));
  const query = opts?.query?.trim().toLowerCase();

  return rows
    .map((item) => ({
      ...item,
      user: userMap.get(item.userId),
    }))
    .filter((item) => {
      if (!query) {
        return true;
      }
      const haystack = [
        item.user?.name,
        item.user?.email,
        item.code,
        item.discountCode,
        item.socialAccount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }) as AffiliateProfileWithUser[];
}

export async function getAffiliateProfileById(profileId: string) {
  const [item] = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.id, profileId),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  if (!item) {
    return null;
  }

  const userMap = await mapUsers([item.userId]);
  return {
    ...item,
    user: userMap.get(item.userId),
  } as AffiliateProfileWithUser;
}

export async function getAffiliateApplications(opts?: {
  status?: string;
  query?: string;
}) {
  const rows = await db()
    .select()
    .from(affiliateApplication)
    .where(
      opts?.status && opts.status !== "all"
        ? eq(affiliateApplication.status, opts.status)
        : undefined,
    )
    .orderBy(desc(affiliateApplication.createdAt));

  const userMap = await mapUsers(rows.map((item) => item.userId));
  const query = opts?.query?.trim().toLowerCase();

  return rows
    .map((item) => ({
      ...item,
      user: userMap.get(item.userId),
    }))
    .filter((item) => {
      if (!query) {
        return true;
      }
      const haystack = [
        item.user?.name,
        item.user?.email,
        item.socialAccount,
        item.channelSummary,
        item.paypalEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }) as AffiliateApplicationWithUser[];
}

export async function getAffiliateCommissions(opts?: {
  status?: string;
  query?: string;
}) {
  let rows = await db()
    .select()
    .from(affiliateCommission)
    .orderBy(
      desc(affiliateCommission.occurredAt),
      desc(affiliateCommission.createdAt),
    );

  if (opts?.status && opts.status !== "all") {
    if (opts.status === "renewal") {
      rows = rows.filter(
        (item) => item.commissionType === AffiliateCommissionType.RENEWAL,
      );
    } else if (opts.status === "mixed") {
      rows = rows.filter((item) =>
        [
          AffiliateCommissionType.FIRST_ORDER,
          AffiliateCommissionType.RENEWAL,
        ].includes(item.commissionType as AffiliateCommissionType),
      );
    } else {
      rows = rows.filter((item) => item.status === opts.status);
    }
  }

  const userMap = await mapUsers([
    ...rows.map((item) => item.affiliateUserId),
    ...rows.map((item) => item.referredUserId || ""),
  ]);

  const orderIds = Array.from(
    new Set(rows.map((item) => item.sourceOrderId).filter(Boolean)),
  ) as string[];
  const subscriptionIds = Array.from(
    new Set(rows.map((item) => item.sourceSubscriptionId).filter(Boolean)),
  ) as string[];

  const orders =
    orderIds.length > 0
      ? await db().select().from(order).where(inArray(order.id, orderIds))
      : [];
  const subscriptions =
    subscriptionIds.length > 0
      ? await db()
          .select()
          .from(subscription)
          .where(inArray(subscription.id, subscriptionIds))
      : [];

  const orderMap = new Map(orders.map((item) => [item.id, item]));
  const subscriptionMap = new Map(subscriptions.map((item) => [item.id, item]));

  const query = opts?.query?.trim().toLowerCase();

  return rows
    .map((item) => ({
      ...item,
      affiliateUser: userMap.get(item.affiliateUserId),
      referredUser: item.referredUserId
        ? userMap.get(item.referredUserId)
        : undefined,
      sourceOrder: item.sourceOrderId ? orderMap.get(item.sourceOrderId) : null,
      sourceSubscription: item.sourceSubscriptionId
        ? subscriptionMap.get(item.sourceSubscriptionId)
        : null,
    }))
    .filter((item) => {
      if (!query) {
        return true;
      }
      const haystack = [
        item.affiliateUser?.name,
        item.affiliateUser?.email,
        item.referredUser?.name,
        item.referredUser?.email,
        item.sourceOrder?.orderNo,
        item.sourceSubscription?.subscriptionNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }) as AffiliateCommissionWithUsers[];
}

export async function getAffiliateProfileAttributionDetails(profileId: string) {
  const [profile] = await db()
    .select({ id: affiliateProfile.id })
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.id, profileId),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  if (!profile) {
    throw new Error("profile not found");
  }

  const [referrals, commissions] = await Promise.all([
    db()
      .select()
      .from(affiliateReferral)
      .where(eq(affiliateReferral.affiliateProfileId, profileId))
      .orderBy(desc(affiliateReferral.createdAt)),
    db()
      .select()
      .from(affiliateCommission)
      .where(eq(affiliateCommission.affiliateProfileId, profileId))
      .orderBy(
        desc(affiliateCommission.occurredAt),
        desc(affiliateCommission.createdAt),
      ),
  ]);

  const userMap = await mapUsers([
    ...referrals.map((item) => item.referredUserId),
    ...commissions.map((item) => item.referredUserId || ""),
  ]);

  const orderIds = Array.from(
    new Set([
      ...referrals.map((item) => item.firstOrderId).filter(Boolean),
      ...commissions.map((item) => item.sourceOrderId).filter(Boolean),
    ]),
  ) as string[];

  const subscriptionIds = Array.from(
    new Set([
      ...referrals.map((item) => item.firstSubscriptionId).filter(Boolean),
      ...commissions.map((item) => item.sourceSubscriptionId).filter(Boolean),
    ]),
  ) as string[];

  const [orders, subscriptions] = await Promise.all([
    orderIds.length > 0
      ? db().select().from(order).where(inArray(order.id, orderIds))
      : Promise.resolve([]),
    subscriptionIds.length > 0
      ? db()
          .select()
          .from(subscription)
          .where(inArray(subscription.id, subscriptionIds))
      : Promise.resolve([]),
  ]);

  const orderMap = new Map(orders.map((item) => [item.id, item]));
  const subscriptionMap = new Map(subscriptions.map((item) => [item.id, item]));

  return {
    registrations: referrals.map((item) => ({
      ...item,
      referredUser: userMap.get(item.referredUserId),
      firstOrder: item.firstOrderId ? orderMap.get(item.firstOrderId) : null,
      firstSubscription: item.firstSubscriptionId
        ? subscriptionMap.get(item.firstSubscriptionId)
        : null,
    })),
    conversions: commissions.map((item) => ({
      ...item,
      referredUser: item.referredUserId
        ? userMap.get(item.referredUserId)
        : undefined,
      sourceOrder: item.sourceOrderId ? orderMap.get(item.sourceOrderId) : null,
      sourceSubscription: item.sourceSubscriptionId
        ? subscriptionMap.get(item.sourceSubscriptionId)
        : null,
    })),
  } satisfies AffiliateProfileAttributionDetails;
}

export async function getAffiliatePayouts(opts?: {
  status?: string;
  query?: string;
}) {
  const rows = await db()
    .select()
    .from(affiliatePayout)
    .where(
      opts?.status && opts.status !== "all"
        ? eq(affiliatePayout.status, opts.status)
        : undefined,
    )
    .orderBy(
      desc(affiliatePayout.requestedAt),
      desc(affiliatePayout.createdAt),
    );

  const userMap = await mapUsers(rows.map((item) => item.affiliateUserId));
  const query = opts?.query?.trim().toLowerCase();

  return rows
    .map((item) => ({
      ...item,
      affiliateUser: userMap.get(item.affiliateUserId),
    }))
    .filter((item) => {
      if (!query) {
        return true;
      }
      const haystack = [
        item.affiliateUser?.name,
        item.affiliateUser?.email,
        item.paypalEmail,
        item.payoutNo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }) as AffiliatePayoutWithUser[];
}

export async function getAffiliateOverview() {
  const monthStart = startOfMonth();

  const [profiles, applications, commissions, payouts, referrals, visits] =
    await Promise.all([
      db()
        .select()
        .from(affiliateProfile)
        .where(and(isNull(affiliateProfile.deletedAt))),
      db()
        .select()
        .from(affiliateApplication)
        .where(
          eq(affiliateApplication.status, AffiliateApplicationStatus.PENDING),
        ),
      db().select().from(affiliateCommission),
      db().select().from(affiliatePayout),
      db().select().from(affiliateReferral),
      db().select().from(affiliateReferralVisit),
    ]);

  const recentCommissions = await getAffiliateCommissions({ status: "all" });
  const recentPayouts = await getAffiliatePayouts({ status: "all" });
  const recentApplications = await getAffiliateApplications({
    status: "pending",
  });

  const latestActivities = [
    ...recentPayouts.slice(0, 5).map((item) => ({
      type: "payout" as const,
      createdAt: item.requestedAt || item.createdAt,
      text: `${item.affiliateUser?.name || "推广者"} 提交了提现申请 ${formatCents(item.requestedAmountCents, item.currency)}`,
    })),
    ...recentApplications.slice(0, 5).map((item) => ({
      type: "application" as const,
      createdAt: item.createdAt,
      text: `${item.user?.name || item.user?.email || "用户"} 申请成为推广者`,
    })),
    ...recentCommissions.slice(0, 5).map((item) => ({
      type: "commission" as const,
      createdAt: item.occurredAt,
      text: `${item.affiliateUser?.name || "推广者"} 带来 1 笔${item.commissionType === AffiliateCommissionType.RENEWAL ? "续订" : "首订"}，佣金 ${formatCents(item.commissionAmountCents, item.currency)}`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    totalAffiliates: profiles.length,
    pendingApplications: applications.length,
    monthlyCommissionCents: commissions
      .filter((item) => item.occurredAt >= monthStart)
      .reduce((sum, item) => sum + item.commissionAmountCents, 0),
    pendingPayoutAmountCents: payouts
      .filter((item) => item.status === AffiliatePayoutStatus.REQUESTED)
      .reduce((sum, item) => sum + item.requestedAmountCents, 0),
    clicksThisMonth: visits.filter(
      (item) => item.createdAt && item.createdAt >= monthStart,
    ).length,
    signups: referrals.length,
    firstOrders: commissions.filter(
      (item) => item.commissionType === AffiliateCommissionType.FIRST_ORDER,
    ).length,
    recentCommissions: recentCommissions.slice(0, 4),
    latestActivities,
  } satisfies AffiliateOverviewData;
}

export async function getAffiliateDashboardForUser(userId: string) {
  const program = await getOrCreateAffiliateProgram();

  const [profile, latestApplication, payouts] = await Promise.all([
    db()
      .select()
      .from(affiliateProfile)
      .where(
        and(
          eq(affiliateProfile.userId, userId),
          isNull(affiliateProfile.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] || null),
    db()
      .select()
      .from(affiliateApplication)
      .where(eq(affiliateApplication.userId, userId))
      .orderBy(desc(affiliateApplication.createdAt))
      .limit(1)
      .then((rows) => rows[0] || null),
    db()
      .select()
      .from(affiliatePayout)
      .where(eq(affiliatePayout.affiliateUserId, userId))
      .orderBy(
        desc(affiliatePayout.requestedAt),
        desc(affiliatePayout.createdAt),
      )
      .limit(10),
  ]);

  const dailyStats = profile
    ? await (async () => {
        const [visits, referrals, commissionStats] = await Promise.all([
          db()
            .select({
              createdAt: affiliateReferralVisit.createdAt,
              sessionId: affiliateReferralVisit.sessionId,
            })
            .from(affiliateReferralVisit)
            .where(
              and(
                eq(affiliateReferralVisit.affiliateProfileId, profile.id),
                eq(affiliateReferralVisit.isValid, true),
              ),
            )
            .orderBy(desc(affiliateReferralVisit.createdAt))
            .limit(120),
          db()
            .select({
              createdAt: affiliateReferral.createdAt,
              referredUserId: affiliateReferral.referredUserId,
            })
            .from(affiliateReferral)
            .where(eq(affiliateReferral.affiliateProfileId, profile.id))
            .orderBy(desc(affiliateReferral.createdAt))
            .limit(180),
          db()
            .select({
              occurredAt: affiliateCommission.occurredAt,
              commissionAmountCents: affiliateCommission.commissionAmountCents,
              currency: affiliateCommission.currency,
            })
            .from(affiliateCommission)
            .where(eq(affiliateCommission.affiliateProfileId, profile.id))
            .orderBy(
              desc(affiliateCommission.occurredAt),
              desc(affiliateCommission.createdAt),
            )
            .limit(180),
        ]);

        const dailyMap = new Map<
          string,
          {
            date: string;
            visitors: number;
            visitorSessions: Set<string>;
            registers: number;
            registerUsers: Set<string>;
            payments: number;
            earningsCents: number;
            currency: string;
          }
        >();

        function ensureDay(dateKey: string) {
          const existing = dailyMap.get(dateKey);
          if (existing) {
            return existing;
          }

          const created = {
            date: dateKey,
            visitors: 0,
            visitorSessions: new Set<string>(),
            registers: 0,
            registerUsers: new Set<string>(),
            payments: 0,
            earningsCents: 0,
            currency: "USD",
          };
          dailyMap.set(dateKey, created);
          return created;
        }

        for (const visit of visits) {
          const dateKey = visit.createdAt.toISOString().slice(0, 10);
          const day = ensureDay(dateKey);
          const sessionKey =
            visit.sessionId?.trim() ||
            `visit:${visit.createdAt.getTime()}:${day.visitors}`;
          if (!day.visitorSessions.has(sessionKey)) {
            day.visitorSessions.add(sessionKey);
            day.visitors += 1;
          }
        }

        for (const referral of referrals) {
          const dateKey = referral.createdAt.toISOString().slice(0, 10);
          const day = ensureDay(dateKey);
          if (!day.registerUsers.has(referral.referredUserId)) {
            day.registerUsers.add(referral.referredUserId);
            day.registers += 1;
          }
        }

        for (const commission of commissionStats) {
          const dateKey = commission.occurredAt.toISOString().slice(0, 10);
          const day = ensureDay(dateKey);
          day.payments += 1;
          day.earningsCents += commission.commissionAmountCents || 0;
          day.currency = commission.currency || day.currency;
        }

        return Array.from(dailyMap.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30)
          .map((item) => ({
            date: item.date,
            visitors: item.visitors,
            registers: item.registers,
            payments: item.payments,
            earningsCents: item.earningsCents,
            currency: item.currency,
          }));
      })()
    : [];

  const pendingPayout =
    payouts.find((item) =>
      [
        AffiliatePayoutStatus.REQUESTED,
        AffiliatePayoutStatus.APPROVED,
      ].includes(item.status as AffiliatePayoutStatus),
    ) || null;

  return {
    program,
    profile,
    latestApplication,
    recentCommissions: [],
    recentPayouts: [],
    pendingPayout,
    dailyStats,
  } satisfies AffiliateUserDashboardData;
}

export async function getAffiliateCommissionsForUser(
  userId: string,
  limit = 20,
) {
  return db()
    .select({
      id: affiliateCommission.id,
      commissionType: affiliateCommission.commissionType,
      status: affiliateCommission.status,
      commissionAmountCents: affiliateCommission.commissionAmountCents,
      currency: affiliateCommission.currency,
      occurredAt: affiliateCommission.occurredAt,
      createdAt: affiliateCommission.createdAt,
    })
    .from(affiliateCommission)
    .where(eq(affiliateCommission.affiliateUserId, userId))
    .orderBy(
      desc(affiliateCommission.occurredAt),
      desc(affiliateCommission.createdAt),
    )
    .limit(Math.max(1, Math.min(limit, 100)));
}

export async function getAffiliatePayoutsForUser(userId: string, limit = 20) {
  return db()
    .select({
      id: affiliatePayout.id,
      payoutNo: affiliatePayout.payoutNo,
      status: affiliatePayout.status,
      requestedAmountCents: affiliatePayout.requestedAmountCents,
      currency: affiliatePayout.currency,
      requestedAt: affiliatePayout.requestedAt,
      createdAt: affiliatePayout.createdAt,
    })
    .from(affiliatePayout)
    .where(eq(affiliatePayout.affiliateUserId, userId))
    .orderBy(desc(affiliatePayout.requestedAt), desc(affiliatePayout.createdAt))
    .limit(Math.max(1, Math.min(limit, 100)));
}

export function formatCents(
  cents: number | null | undefined,
  currency = "USD",
) {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function bpsToPercent(bps: number | null | undefined) {
  if (!bps) {
    return "0%";
  }
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export function getAffiliateCode(name?: string | null) {
  const prefix = (name || "rk")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  return `${prefix || "rk"}-${getUniSeq("").slice(-6)}`;
}

export function normalizeAffiliateDiscountCode(code?: string | null) {
  return (code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

export function getAffiliateDiscountCode(_seed?: string | null) {
  const suffix = getUniSeq("")
    .replace(/[^A-Za-z0-9]+/g, "")
    .toUpperCase()
    .slice(-6);

  return `ZX${suffix || Date.now().toString().slice(-6)}`;
}

export async function validateAffiliateDiscountCode(code?: string | null) {
  const normalizedCode = normalizeAffiliateDiscountCode(code);
  if (!normalizedCode) {
    throw new Error("discount code is required");
  }

  const profile =
    await findActiveAffiliateProfileByDiscountCode(normalizedCode);
  if (!profile) {
    throw new Error("discount code is invalid");
  }

  if (profile.discountExpiresAt && profile.discountExpiresAt <= new Date()) {
    throw new Error("discount code is expired");
  }

  const userInfo = await findUserById(profile.userId);
  const program = await getOrCreateAffiliateProgram();
  const discountRateBps =
    profile.customDiscountRateBps ?? program.defaultDiscountRateBps ?? 0;

  return {
    code: normalizedCode,
    affiliateProfileId: profile.id,
    affiliateCode: profile.code,
    affiliateUserId: profile.userId,
    affiliateName: userInfo?.name || userInfo?.email || profile.code,
    discountRateBps,
  };
}

async function hasUserUsedAffiliateDiscountCode(opts: {
  userId: string;
  discountCode: string;
}) {
  const normalizedCode = normalizeAffiliateDiscountCode(opts.discountCode);
  if (!opts.userId || !normalizedCode) {
    return false;
  }

  const [existingPaidOrder] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, opts.userId),
        eq(order.affiliateDiscountCode, normalizedCode),
        eq(order.status, "paid"),
      ),
    )
    .limit(1);

  return !!existingPaidOrder;
}

export async function assertUserCanUseAffiliateDiscountCode(opts: {
  userId: string;
  discountCode: string;
}) {
  const alreadyUsed = await hasUserUsedAffiliateDiscountCode(opts);
  if (alreadyUsed) {
    throw new Error("affiliate_discount_code_already_used");
  }
}

async function syncAffiliateDiscountForProfile(profile: AffiliateProfile) {
  if (!profile.discountCode) {
    return;
  }

  const program = await getOrCreateAffiliateProgram();
  const discountRateBps =
    profile.customDiscountRateBps ?? program.defaultDiscountRateBps ?? 0;

  await syncAffiliateDiscountCodeToCreem({
    code: profile.discountCode,
    name: `Affiliate ${profile.code}`,
    percentage: discountRateBps / 100,
    expiryDate: profile.discountExpiresAt?.toISOString() || null,
    enabled:
      profile.discountEnabled &&
      profile.status === AffiliateProfileStatus.ACTIVE &&
      (!profile.discountExpiresAt || profile.discountExpiresAt > new Date()) &&
      discountRateBps > 0,
  });
}

async function syncAffiliateBalance(affiliateProfileId: string) {
  await syncAffiliateProfileStats(affiliateProfileId);
}

export async function reviewAffiliateApplication(opts: {
  applicationId: string;
  decision: "approve" | "approve_kol" | "reject";
  adminUserId: string;
  rejectReason?: string;
}) {
  const [application] = await db()
    .select()
    .from(affiliateApplication)
    .where(eq(affiliateApplication.id, opts.applicationId))
    .limit(1);

  if (!application) {
    throw new Error("application not found");
  }

  const userInfo = await findUserById(application.userId);
  if (!userInfo) {
    throw new Error("user not found");
  }

  const now = new Date();
  const rejectReason =
    opts.decision === "reject" ? opts.rejectReason || "管理员拒绝" : null;

  const [updatedApplication] = await db()
    .update(affiliateApplication)
    .set({
      status:
        opts.decision === "reject"
          ? AffiliateApplicationStatus.REJECTED
          : AffiliateApplicationStatus.APPROVED,
      reviewedBy: opts.adminUserId,
      reviewedAt: now,
      rejectReason,
    })
    .where(eq(affiliateApplication.id, application.id))
    .returning();

  if (opts.decision === "reject") {
    await sendAffiliateNotificationEmail({
      email: userInfo.email,
      title: "Affiliate application update",
      message: `Your affiliate application has been rejected.${
        rejectReason ? ` Reason: ${rejectReason}` : ""
      }`,
    });
    return updatedApplication;
  }

  const tier =
    opts.decision === "approve_kol"
      ? AffiliateTier.KOL
      : application.desiredTier === AffiliateTier.KOL
        ? AffiliateTier.KOL
        : AffiliateTier.STANDARD;

  const [existingProfile] = await db()
    .select()
    .from(affiliateProfile)
    .where(eq(affiliateProfile.userId, application.userId))
    .limit(1);

  if (existingProfile) {
    const [updatedProfile] = await db()
      .update(affiliateProfile)
      .set({
        applicationId: application.id,
        status: AffiliateProfileStatus.ACTIVE,
        tier,
        paypalEmail: application.paypalEmail,
        socialAccount: application.socialAccount,
        socialPlatform: application.socialPlatform,
        channelSummary: application.channelSummary,
        profileNote: application.applicationNote,
        code:
          existingProfile.code ||
          (await generateUniqueAffiliateCode(userInfo.name)),
        discountCode:
          existingProfile.discountCode ||
          (await generateUniqueAffiliateDiscountCode(
            existingProfile.code || userInfo.name,
          )),
        discountExpiresAt:
          existingProfile.discountExpiresAt ||
          getDefaultAffiliateDiscountExpiresAt(now),
        discountEnabled: existingProfile.discountEnabled ?? true,
        approvedBy: opts.adminUserId,
        approvedAt: now,
      })
      .where(eq(affiliateProfile.id, existingProfile.id))
      .returning();

    await sendAffiliateNotificationEmail({
      email: userInfo.email,
      title: "Affiliate application approved",
      message: `Your affiliate application has been approved. Your affiliate code is ${updatedProfile.code}.`,
    });

    await syncAffiliateDiscountForProfile(updatedProfile).catch((error) => {
      console.error(
        "[affiliate] failed to sync updated affiliate discount to creem",
        updatedProfile.id,
        error,
      );
    });

    return updatedProfile;
  }

  const affiliateCode = await generateUniqueAffiliateCode(userInfo.name);
  const discountCode = await generateUniqueAffiliateDiscountCode(affiliateCode);
  const [createdProfile] = await db()
    .insert(affiliateProfile)
    .values({
      id: getUuid(),
      userId: application.userId,
      applicationId: application.id,
      code: affiliateCode,
      discountCode,
      discountExpiresAt: getDefaultAffiliateDiscountExpiresAt(now),
      discountEnabled: true,
      status: AffiliateProfileStatus.ACTIVE,
      tier,
      paypalEmail: application.paypalEmail,
      socialAccount: application.socialAccount,
      socialPlatform: application.socialPlatform,
      channelSummary: application.channelSummary,
      profileNote: application.applicationNote,
      approvedBy: opts.adminUserId,
      approvedAt: now,
    })
    .returning();

  await sendAffiliateNotificationEmail({
    email: userInfo.email,
    title: "Affiliate application approved",
    message: `Your affiliate application has been approved. Your affiliate code is ${createdProfile.code}.`,
  });

  await syncAffiliateDiscountForProfile(createdProfile).catch((error) => {
    console.error(
      "[affiliate] failed to sync created affiliate discount to creem",
      createdProfile.id,
      error,
    );
  });

  return createdProfile;
}

export async function createAffiliateProfileByAdmin(opts: {
  adminUserId: string;
  email: string;
  name?: string | null;
  password?: string | null;
  tier?: AffiliateTier;
  paypalEmail?: string | null;
  socialAccount?: string | null;
  socialPlatform?: string | null;
  channelSummary?: string | null;
  profileNote?: string | null;
}) {
  const normalizedEmail = normalizeEmail(opts.email);
  if (!normalizedEmail) {
    throw new Error("email is required");
  }

  const existingUser = await findUserByEmailIdentity(normalizedEmail);
  const userName =
    opts.name?.trim() || existingUser?.name || normalizedEmail.split("@")[0];
  const now = new Date();

  const targetUser =
    existingUser ||
    (await db().transaction(async (tx) => {
      const password = opts.password?.trim();
      if (!password) {
        throw new Error("password is required for new users");
      }

      const createdUserId = getUuid();
      const createdAccountId = getUuid();

      const [createdUser] = await tx
        .insert(user)
        .values({
          id: createdUserId,
          name: userName,
          email: normalizedEmail,
          emailVerified: true,
          source: "admin_affiliate",
        })
        .returning();

      await tx.insert(account).values({
        id: createdAccountId,
        accountId: createdUserId,
        providerId: "credential",
        userId: createdUserId,
        password: await hashCredentialPassword(password),
      });

      return createdUser;
    }));

  const [existingProfile] = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.userId, targetUser.id),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  if (existingProfile) {
    throw new Error("affiliate profile already exists");
  }

  const affiliateCode = await generateUniqueAffiliateCode(userName);
  const discountCode = await generateUniqueAffiliateDiscountCode(affiliateCode);
  const [createdProfile] = await db()
    .insert(affiliateProfile)
    .values({
      id: getUuid(),
      userId: targetUser.id,
      code: affiliateCode,
      discountCode,
      discountExpiresAt: getDefaultAffiliateDiscountExpiresAt(now),
      discountEnabled: true,
      status: AffiliateProfileStatus.ACTIVE,
      tier: opts.tier || AffiliateTier.STANDARD,
      paypalEmail: opts.paypalEmail || null,
      socialAccount: opts.socialAccount || null,
      socialPlatform: opts.socialPlatform || null,
      channelSummary: opts.channelSummary || null,
      profileNote: opts.profileNote || null,
      approvedBy: opts.adminUserId,
      approvedAt: now,
    })
    .returning();

  await sendAffiliateNotificationEmail({
    email: targetUser.email,
    title: "Affiliate account created",
    message: `An affiliate account has been created for you. Your affiliate code is ${createdProfile.code}.`,
  });

  await syncAffiliateDiscountForProfile(createdProfile).catch((error) => {
    console.error(
      "[affiliate] failed to sync admin-created affiliate discount to creem",
      createdProfile.id,
      error,
    );
  });

  return createdProfile;
}

export async function updateAffiliateProfileState(opts: {
  profileId: string;
  action:
    | "suspend"
    | "resume"
    | "blacklist"
    | "upgrade_kol"
    | "downgrade_standard";
}) {
  const [profile] = await db()
    .select()
    .from(affiliateProfile)
    .where(eq(affiliateProfile.id, opts.profileId))
    .limit(1);

  if (!profile) {
    throw new Error("profile not found");
  }

  const now = new Date();
  const patch: Partial<typeof affiliateProfile.$inferInsert> = {};

  if (opts.action === "suspend") {
    patch.status = AffiliateProfileStatus.SUSPENDED;
    patch.suspendedAt = now;
  } else if (opts.action === "resume") {
    patch.status = AffiliateProfileStatus.ACTIVE;
    patch.suspendedAt = null;
  } else if (opts.action === "blacklist") {
    patch.status = AffiliateProfileStatus.BLACKLISTED;
    patch.blacklistedAt = now;
  } else if (opts.action === "upgrade_kol") {
    patch.tier = AffiliateTier.KOL;
    patch.status = AffiliateProfileStatus.ACTIVE;
  } else if (opts.action === "downgrade_standard") {
    patch.tier = AffiliateTier.STANDARD;
  }

  const [updated] = await db()
    .update(affiliateProfile)
    .set(patch)
    .where(eq(affiliateProfile.id, profile.id))
    .returning();

  await syncAffiliateDiscountForProfile(updated).catch((error) => {
    console.error(
      "[affiliate] failed to sync profile state change discount to creem",
      updated.id,
      error,
    );
  });

  return updated;
}

export async function updateAffiliateProfileRates(opts: {
  profileId: string;
  firstOrderRateBps?: number | null;
  renewalRateBps?: number | null;
}) {
  const normalizedFirstOrderRateBps =
    opts.firstOrderRateBps && opts.firstOrderRateBps > 0
      ? opts.firstOrderRateBps
      : null;
  const normalizedRenewalRateBps =
    opts.renewalRateBps && opts.renewalRateBps > 0 ? opts.renewalRateBps : null;

  const [updated] = await db()
    .update(affiliateProfile)
    .set({
      customFirstOrderRateBps: normalizedFirstOrderRateBps,
      customRenewalRateBps: normalizedRenewalRateBps,
    })
    .where(eq(affiliateProfile.id, opts.profileId))
    .returning();

  return updated;
}

export async function updateAffiliateProfileDiscount(opts: {
  profileId: string;
  discountCode?: string | null;
  discountEnabled?: boolean;
  customDiscountRateBps?: number | null;
  discountExpiresAt?: string | Date | null;
}) {
  const [profile] = await db()
    .select()
    .from(affiliateProfile)
    .where(eq(affiliateProfile.id, opts.profileId))
    .limit(1);

  if (!profile) {
    throw new Error("affiliate profile not found");
  }

  const normalizedCode =
    opts.discountCode !== undefined
      ? normalizeAffiliateDiscountCode(opts.discountCode)
      : profile.discountCode;

  if (!normalizedCode) {
    throw new Error("discount code is required");
  }

  const normalizedExpiresAt =
    opts.discountExpiresAt !== undefined
      ? normalizeAffiliateDiscountExpiresAt(opts.discountExpiresAt)
      : profile.discountExpiresAt;

  if (!normalizedExpiresAt) {
    throw new Error("discount expiry is required");
  }

  const [exists] = await db()
    .select({ id: affiliateProfile.id })
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.discountCode, normalizedCode),
        sql`${affiliateProfile.id} <> ${opts.profileId}`,
      ),
    )
    .limit(1);

  if (exists) {
    throw new Error("discount code already exists");
  }

  const previousDiscountCode = profile.discountCode;
  const [updated] = await db()
    .update(affiliateProfile)
    .set({
      discountCode: normalizedCode,
      discountEnabled: opts.discountEnabled ?? profile.discountEnabled ?? true,
      discountExpiresAt: normalizedExpiresAt,
      customDiscountRateBps:
        opts.customDiscountRateBps !== undefined
          ? opts.customDiscountRateBps
          : profile.customDiscountRateBps,
    })
    .where(eq(affiliateProfile.id, opts.profileId))
    .returning();

  if (
    previousDiscountCode &&
    updated.discountCode &&
    previousDiscountCode !== updated.discountCode
  ) {
    await deleteAffiliateDiscountCodeFromCreem(previousDiscountCode).catch(
      (error) => {
        console.error(
          "[affiliate] failed to delete old creem discount code",
          previousDiscountCode,
          error,
        );
      },
    );
  }

  await syncAffiliateDiscountForProfile(updated).catch((error) => {
    console.error(
      "[affiliate] failed to sync updated affiliate discount to creem",
      updated.id,
      error,
    );
  });

  return updated;
}

export async function reviewAffiliatePayout(opts: {
  payoutId: string;
  decision: "approve" | "reject" | "mark_paid";
  adminUserId: string;
  note?: string;
}) {
  const [payout] = await db()
    .select()
    .from(affiliatePayout)
    .where(eq(affiliatePayout.id, opts.payoutId))
    .limit(1);

  if (!payout) {
    throw new Error("payout not found");
  }

  const now = new Date();
  const patch: Partial<typeof affiliatePayout.$inferInsert> = {
    reviewedBy: opts.adminUserId,
    note: opts.note || payout.note,
  };

  if (opts.decision === "approve") {
    patch.status = AffiliatePayoutStatus.APPROVED;
    patch.reviewedAt = now;
    patch.approvedAmountCents =
      payout.approvedAmountCents || payout.requestedAmountCents;
    await db()
      .update(affiliateCommission)
      .set({ status: AffiliateCommissionStatus.LOCKED, payoutId: payout.id })
      .where(
        and(
          eq(affiliateCommission.affiliateProfileId, payout.affiliateProfileId),
          or(
            eq(
              affiliateCommission.status,
              AffiliateCommissionStatus.PAYOUT_REQUESTED,
            ),
            eq(affiliateCommission.payoutId, payout.id),
          ),
        ),
      );
  } else if (opts.decision === "reject") {
    patch.status = AffiliatePayoutStatus.REJECTED;
    patch.reviewedAt = now;
    patch.rejectReason = opts.note || "管理员拒绝";
    await db()
      .update(affiliateCommission)
      .set({
        status: AffiliateCommissionStatus.AVAILABLE,
        payoutId: null as any,
      })
      .where(eq(affiliateCommission.payoutId, payout.id));
  } else if (opts.decision === "mark_paid") {
    patch.status = AffiliatePayoutStatus.PAID;
    patch.paidAt = now;
    patch.reviewedAt = payout.reviewedAt || now;
    patch.paidAmountCents =
      payout.approvedAmountCents || payout.requestedAmountCents;
    patch.paymentReference = opts.note || payout.paymentReference;
    await db()
      .update(affiliateCommission)
      .set({ status: AffiliateCommissionStatus.PAID, settledAt: now })
      .where(eq(affiliateCommission.payoutId, payout.id));
  }

  const [updated] = await db()
    .update(affiliatePayout)
    .set(patch)
    .where(eq(affiliatePayout.id, payout.id))
    .returning();

  await syncAffiliateBalance(payout.affiliateProfileId);
  return updated;
}

export async function submitAffiliateApplication(opts: {
  userId: string;
  paypalEmail?: string | null;
  socialAccount?: string | null;
  socialPlatform?: string | null;
  channelSummary?: string | null;
  applicationNote?: string | null;
  desiredTier?: AffiliateTier;
}) {
  const [existingProfile, latestApplication] = await Promise.all([
    db()
      .select()
      .from(affiliateProfile)
      .where(
        and(
          eq(affiliateProfile.userId, opts.userId),
          isNull(affiliateProfile.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] || null),
    db()
      .select()
      .from(affiliateApplication)
      .where(eq(affiliateApplication.userId, opts.userId))
      .orderBy(desc(affiliateApplication.createdAt))
      .limit(1)
      .then((rows) => rows[0] || null),
  ]);

  if (existingProfile) {
    throw new Error("affiliate profile already exists");
  }

  if (
    latestApplication &&
    latestApplication.status === AffiliateApplicationStatus.PENDING
  ) {
    throw new Error("affiliate application already pending");
  }

  const [created] = await db()
    .insert(affiliateApplication)
    .values({
      id: getUuid(),
      userId: opts.userId,
      status: AffiliateApplicationStatus.PENDING,
      desiredTier: opts.desiredTier || AffiliateTier.STANDARD,
      paypalEmail: opts.paypalEmail || null,
      socialAccount: opts.socialAccount || null,
      socialPlatform: opts.socialPlatform || null,
      channelSummary: opts.channelSummary || null,
      applicationNote: opts.applicationNote || null,
    })
    .returning();

  return created;
}

export async function createAffiliatePayoutRequest(opts: {
  affiliateProfileId: string;
  affiliateUserId: string;
  paypalEmail?: string | null;
  note?: string;
}) {
  const program = await getOrCreateAffiliateProgram();

  const [profile, existingPendingPayout] = await Promise.all([
    db()
      .select()
      .from(affiliateProfile)
      .where(eq(affiliateProfile.id, opts.affiliateProfileId))
      .limit(1)
      .then((rows) => rows[0] || null),
    db()
      .select()
      .from(affiliatePayout)
      .where(
        and(
          eq(affiliatePayout.affiliateProfileId, opts.affiliateProfileId),
          or(
            eq(affiliatePayout.status, AffiliatePayoutStatus.REQUESTED),
            eq(affiliatePayout.status, AffiliatePayoutStatus.APPROVED),
          ),
        ),
      )
      .orderBy(desc(affiliatePayout.createdAt))
      .limit(1)
      .then((rows) => rows[0] || null),
  ]);

  if (!profile) {
    throw new Error("profile not found");
  }

  if (profile.userId !== opts.affiliateUserId) {
    throw new Error("affiliate profile mismatch");
  }

  if (existingPendingPayout) {
    throw new Error("payout already in progress");
  }

  if (profile.availableCommissionCents < program.minimumPayoutAmountCents) {
    throw new Error("amount below minimum payout");
  }

  const amount = profile.availableCommissionCents;
  const [created] = await db()
    .insert(affiliatePayout)
    .values({
      id: getUuid(),
      payoutNo: getSnowId(),
      affiliateProfileId: profile.id,
      affiliateUserId: opts.affiliateUserId,
      requestedAmountCents: amount,
      approvedAmountCents: amount,
      currency: "USD",
      paypalEmail: opts.paypalEmail || profile.paypalEmail,
      note: opts.note,
    })
    .returning();

  await db()
    .update(affiliateCommission)
    .set({
      status: AffiliateCommissionStatus.PAYOUT_REQUESTED,
      payoutId: created.id,
    })
    .where(
      and(
        eq(affiliateCommission.affiliateProfileId, profile.id),
        eq(affiliateCommission.status, AffiliateCommissionStatus.AVAILABLE),
      ),
    );

  await syncAffiliateBalance(profile.id);
  return created;
}

export async function getAffiliateAttributionFromCookie() {
  const cookieStore = await cookies();
  return parseAffiliateCookie(cookieStore.get(AFFILIATE_COOKIE_NAME)?.value);
}

export async function bindAffiliateReferralOnUserRegistration(userId: string) {
  const attribution = await getAffiliateAttributionFromCookie();
  if (!attribution) {
    return null;
  }

  return ensureAffiliateReferralForUser({
    userId,
    attribution,
  });
}

export async function captureAffiliateVisitFromRequest() {
  const headerStore = await headers();
  const affiliateCode = headerStore.get("x-affiliate-code");
  const sessionId = headerStore.get("x-affiliate-session-id");
  const requestUrl = headerStore.get("x-url");

  if (!affiliateCode || !sessionId || !requestUrl) {
    return null;
  }

  const url = new URL(requestUrl);
  return trackAffiliateVisit({
    code: affiliateCode,
    sessionId,
    ip:
      headerStore.get("cf-connecting-ip") ||
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null,
    userAgent: headerStore.get("user-agent"),
    referrer: headerStore.get("referer"),
    landingPage: url.toString(),
    utmSource: url.searchParams.get("utm_source"),
    utmMedium: url.searchParams.get("utm_medium"),
    utmCampaign: url.searchParams.get("utm_campaign"),
    utmContent: url.searchParams.get("utm_content"),
    utmTerm: url.searchParams.get("utm_term"),
  });
}

export async function trackAffiliateVisit(opts: {
  code: string;
  sessionId?: string | null;
  visitorUserId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}) {
  const profile = await findActiveAffiliateProfileByCode(opts.code);
  if (!profile) {
    throw new Error("affiliate profile not found");
  }

  const program = await getOrCreateAffiliateProgram();
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - program.antiFraudWindowMinutes * 60 * 1000,
  );

  const [sameSessionVisit, recentIpVisits] = await Promise.all([
    opts.sessionId
      ? db()
          .select()
          .from(affiliateReferralVisit)
          .where(
            and(
              eq(affiliateReferralVisit.affiliateProfileId, profile.id),
              eq(affiliateReferralVisit.sessionId, opts.sessionId),
            ),
          )
          .orderBy(desc(affiliateReferralVisit.createdAt))
          .limit(1)
      : Promise.resolve([]),
    opts.ip
      ? db()
          .select()
          .from(affiliateReferralVisit)
          .where(
            and(
              eq(affiliateReferralVisit.affiliateProfileId, profile.id),
              eq(affiliateReferralVisit.ip, opts.ip),
              gte(affiliateReferralVisit.createdAt, windowStart),
              eq(affiliateReferralVisit.isValid, true),
            ),
          )
      : Promise.resolve([]),
  ]);

  if (sameSessionVisit[0]) {
    return {
      profile,
      visit: sameSessionVisit[0],
      attribution: {
        affiliateCode: profile.code,
        affiliateProfileId: profile.id,
        visitId: sameSessionVisit[0].id,
        firstVisitId: sameSessionVisit[0].id,
        sessionId: opts.sessionId || null,
        expiresAt: addDays(now, program.cookieTtlDays).toISOString(),
      } satisfies AffiliateAttributionCookie,
    };
  }

  const isUnique = sameSessionVisit.length === 0;
  const isValid = recentIpVisits.length < program.maxClicksPerIp;
  const invalidReason = isValid ? null : "ip_frequency_limited";

  const [visit] = await db()
    .insert(affiliateReferralVisit)
    .values({
      id: getUuid(),
      affiliateProfileId: profile.id,
      affiliateUserId: profile.userId,
      affiliateCode: profile.code,
      visitorUserId: opts.visitorUserId || null,
      sessionId: opts.sessionId || null,
      ip: opts.ip || null,
      userAgent: opts.userAgent || null,
      referrer: opts.referrer || null,
      landingPage: opts.landingPage || null,
      utmSource: opts.utmSource || null,
      utmMedium: opts.utmMedium || null,
      utmCampaign: opts.utmCampaign || null,
      utmContent: opts.utmContent || null,
      utmTerm: opts.utmTerm || null,
      isUnique,
      isValid,
      invalidReason,
    })
    .returning();

  if (!visit.isValid) {
    return {
      profile,
      visit,
      attribution: null,
    };
  }

  return {
    profile,
    visit,
    attribution: {
      affiliateCode: profile.code,
      affiliateProfileId: profile.id,
      visitId: visit.id,
      firstVisitId: visit.id,
      sessionId: opts.sessionId || null,
      expiresAt: addDays(now, program.cookieTtlDays).toISOString(),
    } satisfies AffiliateAttributionCookie,
  };
}

export async function ensureAffiliateReferralForUser(opts: {
  userId: string;
  attribution: AffiliateAttributionCookie;
}) {
  const profile =
    (opts.attribution.affiliateProfileId
      ? await db()
          .select()
          .from(affiliateProfile)
          .where(
            and(
              eq(affiliateProfile.id, opts.attribution.affiliateProfileId),
              eq(affiliateProfile.status, AffiliateProfileStatus.ACTIVE),
              isNull(affiliateProfile.deletedAt),
            ),
          )
          .limit(1)
          .then((rows) => rows[0])
      : null) ||
    (await findActiveAffiliateProfileByCode(opts.attribution.affiliateCode));

  if (!profile) {
    return null;
  }

  const [existingReferral] = await db()
    .select()
    .from(affiliateReferral)
    .where(eq(affiliateReferral.referredUserId, opts.userId))
    .limit(1);

  const [lastVisit] = opts.attribution.visitId
    ? await db()
        .select()
        .from(affiliateReferralVisit)
        .where(eq(affiliateReferralVisit.id, opts.attribution.visitId))
        .limit(1)
    : [];

  const firstVisitId =
    opts.attribution.firstVisitId || opts.attribution.visitId || null;
  const cookieExpiresAt = new Date(opts.attribution.expiresAt);
  const lastVisitedAt = lastVisit?.createdAt || new Date();

  if (existingReferral) {
    if (existingReferral.affiliateProfileId !== profile.id) {
      return existingReferral;
    }

    const [updated] = await db()
      .update(affiliateReferral)
      .set({
        lastVisitId: opts.attribution.visitId || existingReferral.lastVisitId,
        lastVisitedAt,
        cookieExpiresAt,
        status:
          existingReferral.status === "expired"
            ? "pending"
            : existingReferral.status,
      })
      .where(eq(affiliateReferral.id, existingReferral.id))
      .returning();

    await syncAffiliateProfileStats(profile.id);
    return updated;
  }

  const [created] = await db()
    .insert(affiliateReferral)
    .values({
      id: getUuid(),
      affiliateProfileId: profile.id,
      affiliateUserId: profile.userId,
      referredUserId: opts.userId,
      firstVisitId,
      lastVisitId: opts.attribution.visitId || null,
      attributionModel: "first_touch_7d",
      status: "pending",
      cookieExpiresAt,
      firstVisitedAt: lastVisit?.createdAt || new Date(),
      lastVisitedAt,
    })
    .returning();

  await syncAffiliateProfileStats(profile.id);
  return created;
}

async function findEffectiveAffiliateReferralForUser(userId: string) {
  const [referral] = await db()
    .select()
    .from(affiliateReferral)
    .where(eq(affiliateReferral.referredUserId, userId))
    .limit(1);

  return referral || null;
}

export async function attachAffiliateAttributionToCheckout(opts: {
  userId: string;
  discountCode?: string | null;
}) {
  const attribution = await getAffiliateAttributionFromCookie();
  if (attribution) {
    const referral = await ensureAffiliateReferralForUser({
      userId: opts.userId,
      attribution,
    });

    if (referral) {
      return {
        affiliateProfileId: referral.affiliateProfileId,
        affiliateReferralId: referral.id,
        affiliateReferralVisitId:
          attribution.visitId || referral.lastVisitId || referral.firstVisitId,
        affiliateCode: attribution.affiliateCode,
        affiliateDiscountCode: null,
      };
    }
  }

  if (opts.discountCode) {
    const discountMatch = await validateAffiliateDiscountCode(
      opts.discountCode,
    );
    return {
      affiliateDiscountCode: discountMatch.code,
    };
  }

  const referral = await findEffectiveAffiliateReferralForUser(opts.userId);
  if (!referral) {
    return {};
  }

  const [profile] = await db()
    .select()
    .from(affiliateProfile)
    .where(
      and(
        eq(affiliateProfile.id, referral.affiliateProfileId),
        eq(affiliateProfile.status, AffiliateProfileStatus.ACTIVE),
        isNull(affiliateProfile.deletedAt),
      ),
    )
    .limit(1);

  if (!profile) {
    return {};
  }

  return {
    affiliateProfileId: referral.affiliateProfileId,
    affiliateReferralId: referral.id,
    affiliateReferralVisitId: referral.lastVisitId || referral.firstVisitId,
    affiliateCode: profile.code,
    affiliateDiscountCode: profile.discountCode || null,
  };
}

export async function getAffiliateDiscountForCheckout(opts: {
  discountCode?: string | null;
  amountCents: number;
  currency?: string | null;
}) {
  if (!opts.discountCode) {
    return null;
  }

  const matched = await validateAffiliateDiscountCode(opts.discountCode);
  const rateBps = Math.max(0, matched.discountRateBps || 0);
  const discountAmountCents = Math.max(
    0,
    Math.floor((Math.max(0, opts.amountCents) * rateBps) / 10000),
  );

  return {
    code: matched.code,
    affiliateProfileId: matched.affiliateProfileId,
    affiliateCode: matched.affiliateCode,
    discountRateBps: rateBps,
    discountAmountCents,
    finalAmountCents: Math.max(1, opts.amountCents - discountAmountCents),
    currency: opts.currency || "USD",
  };
}

export async function createAffiliateCommissionFromPaidOrder(opts: {
  order: typeof order.$inferSelect;
  subscription?: typeof subscription.$inferSelect | null;
}) {
  if (!opts.order.affiliateProfileId || !opts.order.affiliateReferralId) {
    return null;
  }

  const [profile, existingByOrder, existingFirstOrder] = await Promise.all([
    db()
      .select()
      .from(affiliateProfile)
      .where(eq(affiliateProfile.id, opts.order.affiliateProfileId))
      .limit(1)
      .then((rows) => rows[0]),
    db()
      .select()
      .from(affiliateCommission)
      .where(
        and(
          eq(affiliateCommission.sourceOrderId, opts.order.id),
          eq(
            affiliateCommission.commissionType,
            AffiliateCommissionType.FIRST_ORDER,
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
    db()
      .select()
      .from(affiliateCommission)
      .where(
        and(
          eq(affiliateCommission.referralId, opts.order.affiliateReferralId),
          eq(
            affiliateCommission.commissionType,
            AffiliateCommissionType.FIRST_ORDER,
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  if (
    !profile ||
    profile.status !== AffiliateProfileStatus.ACTIVE ||
    existingByOrder ||
    existingFirstOrder
  ) {
    return existingByOrder || existingFirstOrder || null;
  }

  const program = await getOrCreateAffiliateProgram();
  const baseAmountCents = opts.order.paymentAmount || opts.order.amount || 0;
  const commissionRateBps =
    profile.customFirstOrderRateBps && profile.customFirstOrderRateBps > 0
      ? profile.customFirstOrderRateBps
      : program.defaultFirstOrderRateBps;

  if (baseAmountCents <= 0 || commissionRateBps <= 0) {
    return null;
  }

  const occurredAt = opts.order.paidAt || opts.order.createdAt || new Date();
  const commissionAmountCents = Math.floor(
    (baseAmountCents * commissionRateBps) / 10000,
  );

  const [commission] = await db()
    .insert(affiliateCommission)
    .values({
      id: getUuid(),
      affiliateProfileId: profile.id,
      affiliateUserId: profile.userId,
      referredUserId: opts.order.userId,
      referralId: opts.order.affiliateReferralId,
      sourceOrderId: opts.order.id,
      sourceSubscriptionId: opts.subscription?.id || null,
      commissionType: AffiliateCommissionType.FIRST_ORDER,
      sourceType: opts.subscription ? "subscription" : "order",
      status: AffiliateCommissionStatus.PENDING,
      baseAmountCents,
      commissionRateBps,
      commissionAmountCents,
      currency: opts.order.paymentCurrency || opts.order.currency || "USD",
      occurredAt,
      availableAt: addDays(occurredAt, program.commissionConfirmDays),
      description: "Affiliate first order commission",
    })
    .returning();

  await db()
    .update(affiliateReferral)
    .set({
      status: "converted",
      convertedAt: occurredAt,
      firstOrderId: opts.order.id,
      firstSubscriptionId: opts.subscription?.id || null,
    })
    .where(eq(affiliateReferral.id, opts.order.affiliateReferralId));

  await syncAffiliateProfileStats(profile.id);
  return commission;
}

export async function createAffiliateCommissionFromRenewal(opts: {
  subscription: typeof subscription.$inferSelect;
  order: typeof order.$inferSelect;
}) {
  if (!opts.subscription.affiliateProfileId) {
    return null;
  }

  const [profile, existing] = await Promise.all([
    db()
      .select()
      .from(affiliateProfile)
      .where(eq(affiliateProfile.id, opts.subscription.affiliateProfileId))
      .limit(1)
      .then((rows) => rows[0]),
    db()
      .select()
      .from(affiliateCommission)
      .where(
        and(
          eq(affiliateCommission.sourceOrderId, opts.order.id),
          eq(
            affiliateCommission.commissionType,
            AffiliateCommissionType.RENEWAL,
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  if (
    !profile ||
    profile.status !== AffiliateProfileStatus.ACTIVE ||
    existing
  ) {
    return existing || null;
  }

  const program = await getOrCreateAffiliateProgram();
  const baseAmountCents = opts.order.paymentAmount || opts.order.amount || 0;
  const commissionRateBps =
    profile.customRenewalRateBps && profile.customRenewalRateBps > 0
      ? profile.customRenewalRateBps
      : program.defaultRenewalRateBps;

  if (baseAmountCents <= 0 || commissionRateBps <= 0) {
    return null;
  }

  const occurredAt = opts.order.paidAt || opts.order.createdAt || new Date();
  const commissionAmountCents = Math.floor(
    (baseAmountCents * commissionRateBps) / 10000,
  );

  const [commission] = await db()
    .insert(affiliateCommission)
    .values({
      id: getUuid(),
      affiliateProfileId: profile.id,
      affiliateUserId: profile.userId,
      referredUserId: opts.subscription.userId,
      referralId: opts.subscription.affiliateReferralId || null,
      sourceOrderId: opts.order.id,
      sourceSubscriptionId: opts.subscription.id,
      commissionType: AffiliateCommissionType.RENEWAL,
      sourceType: "subscription",
      status: AffiliateCommissionStatus.PENDING,
      baseAmountCents,
      commissionRateBps,
      commissionAmountCents,
      currency: opts.order.paymentCurrency || opts.order.currency || "USD",
      occurredAt,
      availableAt: addDays(occurredAt, program.commissionConfirmDays),
      description: "Affiliate renewal commission",
    })
    .returning();

  await syncAffiliateProfileStats(profile.id);
  return commission;
}

export async function releaseMatureAffiliateCommissions(opts?: { now?: Date }) {
  const now = opts?.now || new Date();
  const rows = await db()
    .select()
    .from(affiliateCommission)
    .where(
      and(
        eq(affiliateCommission.status, AffiliateCommissionStatus.PENDING),
        gte(sql`${now}`, affiliateCommission.availableAt),
      ),
    );

  if (!rows.length) {
    return 0;
  }

  await db()
    .update(affiliateCommission)
    .set({ status: AffiliateCommissionStatus.AVAILABLE })
    .where(
      inArray(
        affiliateCommission.id,
        rows.map((item) => item.id),
      ),
    );

  await Promise.all(
    Array.from(new Set(rows.map((item) => item.affiliateProfileId))).map(
      (profileId) => syncAffiliateProfileStats(profileId),
    ),
  );

  return rows.length;
}
