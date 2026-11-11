import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import { getAffiliateOverview } from "@/shared/models/affiliate";

import { requireAffiliateAdminRead } from "../_lib";

export async function GET() {
  try {
    await requireAffiliateAdminRead();
    const overview = await getAffiliateOverview();
    return respData({ overview });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate overview");
  }
}
