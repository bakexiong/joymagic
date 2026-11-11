import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import { reviewAffiliatePayout } from "@/shared/models/affiliate";

import { requireAffiliateAdminWrite } from "../../../_lib";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const admin = await requireAffiliateAdminWrite();
    const { payoutId } = await params;
    const body = await req.json();

    const payout = await reviewAffiliatePayout({
      payoutId,
      decision: String(body?.decision || "") as
        | "approve"
        | "reject"
        | "mark_paid",
      note: String(body?.note || "").trim(),
      adminUserId: admin.id,
    });

    return respData({ payout });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to review affiliate payout");
  }
}
