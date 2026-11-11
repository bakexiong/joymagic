import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import { reviewAffiliateApplication } from "@/shared/models/affiliate";

import { requireAffiliateAdminWrite } from "../../../_lib";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const admin = await requireAffiliateAdminWrite();
    const { applicationId } = await params;
    const body = await req.json();

    const result = await reviewAffiliateApplication({
      applicationId,
      decision: String(body?.decision || "") as
        | "approve"
        | "approve_kol"
        | "reject",
      rejectReason: String(body?.rejectReason || "").trim(),
      adminUserId: admin.id,
    });

    return respData({ result });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to review affiliate application");
  }
}
