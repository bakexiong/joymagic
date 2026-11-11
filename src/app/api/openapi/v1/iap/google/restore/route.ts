import { authenticateApiKey } from "@/shared/lib/api-auth";
import { forbiddenResponse, verifyOpenApiKey } from "@/shared/lib/api-security";
import { respErr, respJson } from "@/shared/lib/resp";
import { restoreGooglePlayPurchases } from "@/shared/services/google-play-iap";

type RestoreRequestBody = {
  packageName: string;
  reason?: string;
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
    const body = (await req.json()) as RestoreRequestBody;
    if (!body.packageName) {
      return respErr("packageName is required");
    }

    const result = await restoreGooglePlayPurchases(user!.id, body.packageName);
    return respJson(0, "restore_task_accepted", result);
  } catch (error) {
    console.error("[OpenAPI Google restore] failed:", error);
    return respErr(error instanceof Error ? error.message : "restore failed");
  }
}
