import { calculateRequiredCredits } from "@/config/credit-config";
import { respData, respErr } from "@/shared/lib/resp";

export async function POST() {
  try {
    const requiredCredits = await calculateRequiredCredits(
      "gpt-image-2-image-to-image",
      {},
    );

    return respData({ requiredCredits });
  } catch (e: any) {
    console.error("image effect estimate credits failed", e);
    return respErr(e.message || "image effect estimate credits failed");
  }
}
