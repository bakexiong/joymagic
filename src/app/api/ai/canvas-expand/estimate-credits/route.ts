import { calculateRequiredCredits } from "@/config/credit-config";
import {
  CANVAS_EXPAND_PROVIDER_SCENARIO,
  CANVAS_EXPAND_SCENE,
} from "@/shared/lib/canvas-expand";
import { respData, respErr } from "@/shared/lib/resp";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const aspectRatio =
      typeof body?.aspectRatio === "string" && body.aspectRatio.trim()
        ? body.aspectRatio.trim()
        : "16:9";
    const resolution =
      typeof body?.resolution === "string" && body.resolution.trim()
        ? body.resolution.trim()
        : "4k";

    const requiredCredits = await calculateRequiredCredits(
      CANVAS_EXPAND_PROVIDER_SCENARIO,
      {
        aspect_ratio: aspectRatio,
        resolution,
      },
    );

    return respData({
      sceneId: CANVAS_EXPAND_SCENE,
      requiredCredits,
    });
  } catch (e: any) {
    console.error("canvas expand estimate credits failed", e);
    return respErr(e.message || "canvas expand estimate credits failed");
  }
}
