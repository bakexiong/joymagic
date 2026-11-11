import { v4 as uuidv4 } from "uuid";

import { NSFW_BLOCKED_ERROR_CODE } from "@/shared/lib/api-error";
import { checkOutputsForNsfw } from "@/shared/lib/nsfw-output-check";
import { shouldSkipNsfwCheck } from "@/shared/lib/nsfw-policy";
import { respData, respErr } from "@/shared/lib/resp";
import { getAllConfigsDirectly } from "@/shared/models/config";
import { createWorkbenchCreation } from "@/shared/models/workbench-creation";
import { getSignUser } from "@/shared/models/user";
import { getStorageService } from "@/shared/services/storage";

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const sceneId = String(formData.get("sceneId") || "");
    const sceneLabel = String(formData.get("sceneLabel") || "");
    const modelUrl = String(formData.get("modelUrl") || "");
    const modelLabel = String(formData.get("modelLabel") || "");
    const configs = await getAllConfigsDirectly();

    if (!files || files.length === 0) {
      return respErr("No files provided");
    }

    const results = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return respErr(`File ${file.name} is not an image`);
      }

      const ext = file.name.split(".").pop();
      const key = `uploads/${Date.now()}-${uuidv4()}.${ext}`;
      const storageService = await getStorageService();
      const uploadResult = await storageService.uploadFile({
        body: file.stream(),
        key,
        contentType: file.type,
        contentLength: file.size,
        disposition: "inline",
      });

      if (!uploadResult.success || !uploadResult.url) {
        return respErr(uploadResult.error || "Upload failed");
      }

      const persistedUrl = uploadResult.url;
      if (!(await shouldSkipNsfwCheck({
        userId: user.id,
        email: user.email,
        whitelistValue: configs.nsfw_whitelist_emails,
      }))) {
        const nsfwResult = await checkOutputsForNsfw([persistedUrl], "image");
        if (nsfwResult?.data?.is_nsfw) {
          return Response.json({
            code: -1,
            message: NSFW_BLOCKED_ERROR_CODE,
            errorCode: NSFW_BLOCKED_ERROR_CODE,
            data: {
              errorCode: NSFW_BLOCKED_ERROR_CODE,
            },
          });
        }
      }

      const creation = await createWorkbenchCreation({
        userId: user.id,
        mediaType: "image",
        sceneId: sceneId || null,
        sceneLabel: sceneLabel || null,
        modelUrl: modelUrl || null,
        modelLabel: modelLabel || null,
        filename: file.name,
        url: persistedUrl,
        mimeType: file.type,
        fileSize: file.size,
      });

      results.push({
        assetId: creation.id,
        url: creation.url,
        filename: creation.filename,
        mimeType: creation.mimeType,
        fileSize: creation.fileSize,
        sceneId: creation.sceneId,
        modelUrl: creation.modelUrl,
      });
    }

    return respData({
      items: results,
    });
  } catch (error: any) {
    return respErr(error?.message || "upload image failed");
  }
}
