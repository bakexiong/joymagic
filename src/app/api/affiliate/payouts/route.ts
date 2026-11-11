import { NextRequest } from "next/server";

import { respData, respErr } from "@/shared/lib/resp";
import {
  createAffiliatePayoutRequest,
  getAffiliatePayoutsForUser,
} from "@/shared/models/affiliate";
import { getUserInfo } from "@/shared/models/user";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 20);
    const items = await getAffiliatePayoutsForUser(user.id, limit);

    return respData({ items });
  } catch (error: any) {
    return respErr(error?.message || "failed to get affiliate payouts");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json();
    const affiliateProfileId = String(body?.affiliateProfileId || "");
    if (!affiliateProfileId) {
      return respErr("affiliateProfileId is required");
    }

    const payout = await createAffiliatePayoutRequest({
      affiliateProfileId,
      affiliateUserId: user.id,
      paypalEmail: String(body?.paypalEmail || "").trim() || null,
      note: String(body?.note || "").trim() || undefined,
    });

    return respData({ payout });
  } catch (error: any) {
    return respErr(error?.message || "failed to create affiliate payout");
  }
}
