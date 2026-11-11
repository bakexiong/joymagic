import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import {
  getAffiliateProfileAttributionDetails,
  updateAffiliateProfileDiscount,
  updateAffiliateProfileRates,
  updateAffiliateProfileState,
} from "@/shared/models/affiliate";

import {
  parseNullableIntValue,
  requireAffiliateAdminRead,
  requireAffiliateAdminWrite,
} from "../../_lib";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    await requireAffiliateAdminWrite();
    const { profileId } = await params;
    const body = await req.json();
    const mode = String(body?.mode || "");

    if (mode === "rates") {
      const firstOrderRate = parseNullableIntValue(body?.firstOrderRate);
      const renewalRate = parseNullableIntValue(body?.renewalRate);

      const profile = await updateAffiliateProfileRates({
        profileId,
        firstOrderRateBps:
          firstOrderRate === null ? null : firstOrderRate * 100,
        renewalRateBps: renewalRate === null ? null : renewalRate * 100,
      });

      return respData({ profile });
    }

    if (mode === "state") {
      const profile = await updateAffiliateProfileState({
        profileId,
        action: String(body?.action || "") as
          | "suspend"
          | "resume"
          | "blacklist"
          | "upgrade_kol"
          | "downgrade_standard",
      });

      return respData({ profile });
    }

    if (mode === "discount") {
      const profile = await updateAffiliateProfileDiscount({
        profileId,
        discountCode: String(body?.discountCode || ""),
        discountExpiresAt:
          body?.discountExpiresAt === undefined
            ? undefined
            : String(body.discountExpiresAt || ""),
        customDiscountRateBps:
          body?.customDiscountRateBps === undefined
            ? undefined
            : Number(body.customDiscountRateBps),
        discountEnabled:
          body?.discountEnabled === undefined
            ? undefined
            : Boolean(body.discountEnabled),
      });

      return respData({ profile });
    }

    return respErr("unsupported update mode");
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to update affiliate profile");
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    await requireAffiliateAdminRead();
    const { profileId } = await params;
    const details = await getAffiliateProfileAttributionDetails(profileId);
    return respData({ details });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate profile details");
  }
}
