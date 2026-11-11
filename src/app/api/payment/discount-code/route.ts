import { NextRequest } from "next/server";

import { respData, respErr } from "@/shared/lib/resp";
import {
  assertUserCanUseAffiliateDiscountCode,
  validateAffiliateDiscountCode,
} from "@/shared/models/affiliate";
import { getUserInfo } from "@/shared/models/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const discountCode = String(body?.code || "");
    const result = await validateAffiliateDiscountCode(discountCode);
    const user = await getUserInfo();

    if (user?.id) {
      await assertUserCanUseAffiliateDiscountCode({
        userId: user.id,
        discountCode,
      });
    }

    return respData({
      valid: true,
      ...result,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to validate discount code");
  }
}
