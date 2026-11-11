import { authenticateApiKey } from "@/shared/lib/api-auth";
import { forbiddenResponse, verifyOpenApiKey } from "@/shared/lib/api-security";
import { getGooglePlayEntitlements } from "@/shared/services/google-play-iap";

export async function GET(req: Request) {
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
    const entitlements = await getGooglePlayEntitlements(user!.id);

    return Response.json({
      code: 0,
      message: "ok",
      data: {
        entitlements,
      },
    });
  } catch (error) {
    console.error("[OpenAPI entitlements] failed:", error);
    return Response.json({
      code: -1,
      message: error instanceof Error ? error.message : "get entitlements failed",
    });
  }
}
