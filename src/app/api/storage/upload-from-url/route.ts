import { respData, respErr } from "@/shared/lib/resp";
import { getVideoThumbnailUrl } from "@/shared/lib/oss-video-thumbnail";
import { transferMediaFromUrl } from "@/server/upload-service/client";
import { updateAITaskMediaUrls } from "@/server/upload-service/ai-task-result";

/**
 * 从 URL 下载文件并上传到 OSS
 * 支持图片和视频，自动生成缩略图
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, type, taskDbId, taskResult } = body;

    if (!url || !type) {
      return respErr("Missing url or type parameter");
    }

    if (type !== "image" && type !== "video") {
      return respErr('Invalid type, must be "image" or "video"');
    }

    console.log("[API] Uploading from URL through upload-service:", {
      url,
      type,
    });

    const uploadResult = await transferMediaFromUrl({
      url,
      mediaType: type,
      targetPrefix: `explore/${type}s`,
      idempotencyKey: `${type}:${url}`,
    });

    console.log("[API] Upload success:", uploadResult.url);

    // 生成缩略图 URL
    let thumbnailUrl: string | undefined;

    if (type === "image") {
      // R2 自身不提供 OSS 图片处理参数，这里返回原图 URL 作为兼容缩略图。
      thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url;
    } else if (type === "video") {
      // 仅当公网域名支持 OSS 处理参数时会得到真实缩略图，否则工具函数会降级返回原视频 URL。
      thumbnailUrl = getVideoThumbnailUrl(uploadResult.url, {
        type: "webp",
        width: 400,
        duration: 3,
      });
    }

    if (typeof taskDbId === "string" && taskDbId) {
      await updateAITaskMediaUrls({
        taskDbId,
        sourceUrls: [url],
        r2Urls: [uploadResult.url],
        existingResult: taskResult,
      });
    }

    return respData({
      url: uploadResult.url,
      thumbnailUrl,
      key: uploadResult.key,
      type,
    });
  } catch (e: any) {
    console.error("[API] Upload from URL failed:", e);
    return respErr(e?.message || "Upload from URL failed");
  }
}
