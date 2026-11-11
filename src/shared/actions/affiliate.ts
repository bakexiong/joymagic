"use server";

import { revalidatePath } from "next/cache.js";

import { redirect } from "@/core/i18n/navigation";
import {
  AffiliateTier,
  createAffiliatePayoutRequest,
  submitAffiliateApplication,
} from "@/shared/models/affiliate";
import { getSignUser } from "@/shared/models/user";

async function requireUser() {
  const user = await getSignUser();
  if (!user) {
    throw new Error("no auth");
  }
  return user;
}

function revalidateAffiliatePage(locale: string) {
  revalidatePath("/settings/affiliate");
  revalidatePath(`/${locale}/settings/affiliate`);
  revalidatePath("/affiliate");
  revalidatePath(`/${locale}/affiliate`);
}

export async function submitAffiliateApplicationAction(formData: FormData) {
  const user = await requireUser();
  const locale = String(formData.get("locale") || "en");
  const redirectTo = String(
    formData.get("redirectTo") || "/settings/affiliate",
  );
  const fullName = String(formData.get("fullName") || "").trim();
  const rawApplicationNote = String(
    formData.get("applicationNote") || "",
  ).trim();
  const agreeToTerms = formData.get("agreeToTerms");

  const applicationNote = [
    fullName ? `Applicant name: ${fullName}` : null,
    rawApplicationNote || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (formData.has("agreeToTerms") && !agreeToTerms) {
    throw new Error("affiliate agreement is required");
  }

  await submitAffiliateApplication({
    userId: user.id,
    paypalEmail: String(formData.get("paypalEmail") || "").trim() || null,
    socialAccount: String(formData.get("socialAccount") || "").trim() || null,
    socialPlatform: String(formData.get("socialPlatform") || "").trim() || null,
    channelSummary: String(formData.get("channelSummary") || "").trim() || null,
    applicationNote: applicationNote || null,
    desiredTier:
      String(formData.get("desiredTier") || "") === AffiliateTier.KOL
        ? AffiliateTier.KOL
        : AffiliateTier.STANDARD,
  });

  revalidateAffiliatePage(locale);
  redirect({ href: redirectTo, locale });
}

export async function createAffiliatePayoutRequestAction(formData: FormData) {
  const user = await requireUser();
  const locale = String(formData.get("locale") || "en");
  const affiliateProfileId = String(formData.get("affiliateProfileId") || "");

  await createAffiliatePayoutRequest({
    affiliateProfileId,
    affiliateUserId: user.id,
    paypalEmail: String(formData.get("paypalEmail") || "").trim() || null,
    note: String(formData.get("note") || "").trim() || undefined,
  });

  revalidateAffiliatePage(locale);
  redirect({ href: "/settings/affiliate", locale });
}
