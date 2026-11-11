"use server";

import { revalidatePath } from "next/cache.js";

import { PERMISSIONS, requirePermission } from "@/core/rbac";
import {
  AffiliateTier,
  createAffiliateProfileByAdmin,
  reviewAffiliateApplication,
  reviewAffiliatePayout,
  updateAffiliateProfileRates,
  updateAffiliateProfileState,
  updateAffiliateProgram,
} from "@/shared/models/affiliate";
import { getSignUser } from "@/shared/models/user";

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function revalidateAffiliatePaths() {
  revalidatePath("/admin/affiliate");
  revalidatePath("/admin/affiliate/overview");
  revalidatePath("/admin/affiliate/affiliates");
  revalidatePath("/admin/affiliate/applications");
  revalidatePath("/admin/affiliate/commissions");
  revalidatePath("/admin/affiliate/payouts");
  revalidatePath("/admin/affiliate/settings");
}

async function requireAdminUser() {
  await requirePermission({ code: PERMISSIONS.AFFILIATE_WRITE });
  const user = await getSignUser();
  if (!user) {
    throw new Error("no auth");
  }
  return user;
}

export async function reviewAffiliateApplicationAction(formData: FormData) {
  const admin = await requireAdminUser();
  await reviewAffiliateApplication({
    applicationId: String(formData.get("applicationId") || ""),
    decision: String(formData.get("decision") || "") as
      | "approve"
      | "approve_kol"
      | "reject",
    rejectReason: String(formData.get("rejectReason") || ""),
    adminUserId: admin.id,
  });
  revalidateAffiliatePaths();
}

export async function createAffiliateProfileByAdminAction(formData: FormData) {
  const admin = await requireAdminUser();
  await createAffiliateProfileByAdmin({
    adminUserId: admin.id,
    email: String(formData.get("email") || ""),
    name: String(formData.get("name") || ""),
    password: String(formData.get("password") || ""),
    tier:
      String(formData.get("tier") || "") === AffiliateTier.KOL
        ? AffiliateTier.KOL
        : AffiliateTier.STANDARD,
    paypalEmail: String(formData.get("paypalEmail") || ""),
    socialPlatform: String(formData.get("socialPlatform") || ""),
    socialAccount: String(formData.get("socialAccount") || ""),
    channelSummary: String(formData.get("channelSummary") || ""),
    profileNote: String(formData.get("profileNote") || ""),
  });
  revalidateAffiliatePaths();
}

export async function updateAffiliateProfileStateAction(formData: FormData) {
  await requireAdminUser();
  await updateAffiliateProfileState({
    profileId: String(formData.get("profileId") || ""),
    action: String(formData.get("action") || "") as
      | "suspend"
      | "resume"
      | "blacklist"
      | "upgrade_kol"
      | "downgrade_standard",
  });
  revalidateAffiliatePaths();
}

export async function updateAffiliateProfileRatesAction(formData: FormData) {
  await requireAdminUser();
  await updateAffiliateProfileRates({
    profileId: String(formData.get("profileId") || ""),
    firstOrderRateBps: toInt(formData.get("firstOrderRate")) * 100,
    renewalRateBps: toInt(formData.get("renewalRate")) * 100,
  });
  revalidateAffiliatePaths();
}

export async function reviewAffiliatePayoutAction(formData: FormData) {
  const admin = await requireAdminUser();
  await reviewAffiliatePayout({
    payoutId: String(formData.get("payoutId") || ""),
    decision: String(formData.get("decision") || "") as
      | "approve"
      | "reject"
      | "mark_paid",
    note: String(formData.get("note") || ""),
    adminUserId: admin.id,
  });
  revalidateAffiliatePaths();
}

export async function updateAffiliateProgramAction(formData: FormData) {
  const admin = await requireAdminUser();
  await updateAffiliateProgram({
    defaultFirstOrderRateBps:
      toInt(formData.get("defaultFirstOrderRate")) * 100,
    defaultRenewalRateBps: toInt(formData.get("defaultRenewalRate")) * 100,
    defaultDiscountRateBps: toInt(formData.get("defaultDiscountRate")) * 100,
    minimumPayoutAmountCents: toInt(formData.get("minimumPayoutAmount")) * 100,
    cookieTtlDays: toInt(formData.get("cookieTtlDays")),
    commissionConfirmDays: toInt(formData.get("commissionConfirmDays")),
    antiFraudWindowMinutes: toInt(formData.get("antiFraudWindowMinutes")),
    maxClicksPerIp: toInt(formData.get("maxClicksPerIp")),
    agreementText: String(formData.get("agreementText") || ""),
    updatedBy: admin.id,
  });
  revalidateAffiliatePaths();
}
