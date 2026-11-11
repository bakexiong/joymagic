import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import {
  getOrCreateAffiliateProgram,
  updateAffiliateProgram,
} from "@/shared/models/affiliate";

import {
  parseIntValue,
  requireAffiliateAdminRead,
  requireAffiliateAdminWrite,
} from "../_lib";

export async function GET() {
  try {
    await requireAffiliateAdminRead();
    const program = await getOrCreateAffiliateProgram();
    return respData({ program });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate settings");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAffiliateAdminWrite();
    const body = await req.json();

    const program = await updateAffiliateProgram({
      defaultFirstOrderRateBps:
        parseIntValue(body?.defaultFirstOrderRate) * 100,
      defaultRenewalRateBps: parseIntValue(body?.defaultRenewalRate) * 100,
      defaultDiscountRateBps: parseIntValue(body?.defaultDiscountRate) * 100,
      minimumPayoutAmountCents: parseIntValue(body?.minimumPayoutAmount) * 100,
      cookieTtlDays: parseIntValue(body?.cookieTtlDays),
      commissionConfirmDays: parseIntValue(body?.commissionConfirmDays),
      antiFraudWindowMinutes: parseIntValue(body?.antiFraudWindowMinutes),
      maxClicksPerIp: parseIntValue(body?.maxClicksPerIp),
      agreementText: String(body?.agreementText || ""),
      updatedBy: admin.id,
    });

    return respData({ program });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to update affiliate settings");
  }
}
