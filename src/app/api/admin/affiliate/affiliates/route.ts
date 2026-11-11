import { NextRequest } from "next/server";

import { PermissionDeniedError } from "@/core/rbac";
import { respData, respErr } from "@/shared/lib/resp";
import {
  AffiliateProfileStatus,
  AffiliateTier,
  createAffiliateProfileByAdmin,
  getAffiliateProfiles,
} from "@/shared/models/affiliate";

import {
  parseIntValue,
  requireAffiliateAdminRead,
  requireAffiliateAdminWrite,
} from "../_lib";

export async function GET(req: NextRequest) {
  try {
    await requireAffiliateAdminRead();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || "all";

    const [items, allItems] = await Promise.all([
      getAffiliateProfiles({ query, status }),
      getAffiliateProfiles({ query }),
    ]);

    return respData({
      items,
      counts: {
        all: allItems.length,
        active: allItems.filter(
          (item) => item.status === AffiliateProfileStatus.ACTIVE,
        ).length,
        suspended: allItems.filter(
          (item) => item.status === AffiliateProfileStatus.SUSPENDED,
        ).length,
        blacklisted: allItems.filter(
          (item) => item.status === AffiliateProfileStatus.BLACKLISTED,
        ).length,
      },
    });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to get affiliate profiles");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAffiliateAdminWrite();
    const body = await req.json();

    const profile = await createAffiliateProfileByAdmin({
      adminUserId: admin.id,
      email: String(body?.email || "").trim(),
      name: String(body?.name || "").trim(),
      password: String(body?.password || "").trim(),
      tier:
        String(body?.tier || "") === AffiliateTier.KOL
          ? AffiliateTier.KOL
          : AffiliateTier.STANDARD,
      paypalEmail: String(body?.paypalEmail || "").trim(),
      socialPlatform: String(body?.socialPlatform || "").trim(),
      socialAccount: String(body?.socialAccount || "").trim(),
      channelSummary: String(body?.channelSummary || "").trim(),
      profileNote: String(body?.profileNote || "").trim(),
    });

    return respData({ profile });
  } catch (error: any) {
    if (error instanceof PermissionDeniedError) {
      return respErr(error.message);
    }
    return respErr(error?.message || "failed to create affiliate profile");
  }
}
