import { NextRequest } from "next/server";

import { respData, respErr } from "@/shared/lib/resp";
import {
  AffiliateTier,
  submitAffiliateApplication,
} from "@/shared/models/affiliate";
import { getUserInfo } from "@/shared/models/user";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json();

    await submitAffiliateApplication({
      userId: user.id,
      paypalEmail: String(body?.paypalEmail || "").trim() || null,
      socialAccount: String(body?.socialAccount || "").trim() || null,
      socialPlatform: String(body?.socialPlatform || "").trim() || null,
      channelSummary: String(body?.channelSummary || "").trim() || null,
      applicationNote: String(body?.applicationNote || "").trim() || null,
      desiredTier:
        String(body?.desiredTier || "") === AffiliateTier.KOL
          ? AffiliateTier.KOL
          : AffiliateTier.STANDARD,
    });

    return respData({ success: true });
  } catch (error: any) {
    return respErr(error?.message || "failed to submit affiliate application");
  }
}
