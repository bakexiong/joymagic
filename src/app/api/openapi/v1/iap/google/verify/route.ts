import { authenticateApiKey } from "@/shared/lib/api-auth";
import { forbiddenResponse, verifyOpenApiKey } from "@/shared/lib/api-security";
import { respErr, respJson } from "@/shared/lib/resp";
import { verifyAndStoreGooglePlayPurchase } from "@/shared/services/google-play-iap";

type VerifyRequestBody = {
  platform: "google";
  packageName: string;
  productId: string;
  productType: "inapp" | "subs";
  purchaseToken: string;
  orderId?: string;
  purchaseTime?: string;
  clientTraceId?: string;
};

export async function POST(req: Request) {
  const { valid: keyValid, error: keyError } = verifyOpenApiKey(req);
  if (!keyValid) {
    return forbiddenResponse(keyError);
  }

  if (!req.headers.get("X-OpenAPI-Key")) {
    return forbiddenResponse("X-OpenAPI-Key header is required");
  }

  const { user, error: authError } = await authenticateApiKey(req);
  if (authError) {
    return authError;
  }

  try {
    const body = (await req.json()) as VerifyRequestBody;

    if (
      body.platform !== "google" ||
      !body.packageName ||
      !body.productId ||
      !body.purchaseToken ||
      !body.productType
    ) {
      return respErr("platform, packageName, productId, productType and purchaseToken are required");
    }

    if (!["inapp", "subs"].includes(body.productType)) {
      return respErr("productType must be inapp or subs");
    }

    const result = await verifyAndStoreGooglePlayPurchase({
      userId: user!.id,
      packageName: body.packageName,
      productId: body.productId,
      productType: body.productType,
      purchaseToken: body.purchaseToken,
      orderId: body.orderId,
      purchaseTime: body.purchaseTime,
      clientTraceId: body.clientTraceId,
      idempotencyKey: req.headers.get("Idempotency-Key"),
    });

    return respJson(0, result.alreadyProcessed ? "already_processed" : "ok", {
      verifyStatus: result.purchase.verifyStatus,
      serverOrderNo: result.purchase.serverOrderNo,
      productId: result.purchase.productId,
      productType: result.purchase.productType,
      purchaseToken: result.purchase.purchaseToken,
      entitlements: result.entitlements,
    });
  } catch (error) {
    console.error("[OpenAPI Google verify] failed:", error);
    return respErr(error instanceof Error ? error.message : "google verify failed");
  }
}
