import { respErr, respJson } from "@/shared/lib/resp";
import {
  processGooglePlayRtdn,
  verifyGooglePlayWebhookRequest,
} from "@/shared/services/google-play-iap";

export async function POST(req: Request) {
  const { valid, error } = await verifyGooglePlayWebhookRequest(req);
  if (!valid) {
    return Response.json({ code: -1, message: error }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = await processGooglePlayRtdn(body);
    return respJson(0, "accepted", result);
  } catch (err) {
    console.error("[OpenAPI Google RTDN] failed:", err);
    return respErr(err instanceof Error ? err.message : "rtdn failed");
  }
}
