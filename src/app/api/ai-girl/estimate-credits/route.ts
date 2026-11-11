import { calculateRequiredCredits } from "@/config/credit-config";
import {
  AI_GIRL_GENERATION_RESOLUTION,
} from "@/shared/lib/ai-character";
import { respData, respErr } from "@/shared/lib/resp";

export async function POST() {
  try {
    const requiredCredits = await calculateRequiredCredits(
      "nano-banana-2-text-to-image",
      {
        resolution: AI_GIRL_GENERATION_RESOLUTION,
      },
    );

    return respData({ requiredCredits });
  } catch (e: any) {
    console.error("ai girl estimate credits failed", e);
    return respErr(e.message || "ai girl estimate credits failed");
  }
}
