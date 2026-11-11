import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import {
  AffiliatePayoutStatus,
  getAffiliatePayouts,
} from "@/shared/models/affiliate";

import { requireAffiliateAdminRead } from "../_lib";

export async function GET(req: NextRequest) {
  try {
    await requireAffiliateAdminRead();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || "all";

    const [items, allItems] = await Promise.all([
      getAffiliatePayouts({ query, status }),
      getAffiliatePayouts({ query }),
    ]);

    return respData({
      items,
      counts: {
        all: allItems.length,
        requested: allItems.filter(
          (item) => item.status === AffiliatePayoutStatus.REQUESTED,
        ).length,
        approved: allItems.filter(
          (item) => item.status === AffiliatePayoutStatus.APPROVED,
        ).length,
        paid: allItems.filter(
          (item) => item.status === AffiliatePayoutStatus.PAID,
        ).length,
        rejected: allItems.filter(
          (item) => item.status === AffiliatePayoutStatus.REJECTED,
        ).length,
      },
    });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate payouts");
  }
}
