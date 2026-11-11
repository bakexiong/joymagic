import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import { getAffiliateApplications } from "@/shared/models/affiliate";

import { requireAffiliateAdminRead } from "../_lib";

export async function GET(req: NextRequest) {
  try {
    await requireAffiliateAdminRead();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || "all";

    const items = await getAffiliateApplications({ query, status });
    return respData({ items });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate applications");
  }
}
