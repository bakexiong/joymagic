import { NextRequest } from "next/server";

import { respData, respErr } from "@/shared/lib/resp";
import { getAffiliateCommissionsForUser } from "@/shared/models/affiliate";
import { getUserInfo } from "@/shared/models/user";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 20);
    const items = await getAffiliateCommissionsForUser(user.id, limit);

    return respData({ items });
  } catch (error: any) {
    return respErr(error?.message || "failed to get affiliate commissions");
  }
}
