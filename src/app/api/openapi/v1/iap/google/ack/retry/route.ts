import { respErr, respJson } from "@/shared/lib/resp";
import {
  retryGooglePlayAcknowledge,
  verifyGooglePlayInternalRequest,
} from "@/shared/services/google-play-iap";

type RetryAckRequestBody = {
  purchaseToken?: string;
  serverOrderNo?: string;
};

export async function POST(req: Request) {
  const { valid, error } = await verifyGooglePlayInternalRequest(req);
  if (!valid) {
    return Response.json({ code: -1, message: error }, { status: 403 });
  }

  try {
    const body = (await req.json()) as RetryAckRequestBody;
    if (!body.purchaseToken && !body.serverOrderNo) {
      return respErr("purchaseToken or serverOrderNo is required");
    }

    const result = await retryGooglePlayAcknowledge(body);
    return respJson(0, "ok", {
      acknowledged: result.acknowledged,
      serverOrderNo: result.purchase.serverOrderNo,
      purchaseToken: result.purchase.purchaseToken,
      acknowledgementState: result.purchase.acknowledgementState,
    });
  } catch (err) {
    console.error("[OpenAPI Google ack retry] failed:", err);
    return respErr(err instanceof Error ? err.message : "ack retry failed");
  }
}
