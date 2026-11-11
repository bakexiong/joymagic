import {
  createWorkbenchCreation,
  findWorkbenchCreationByUserAndUrl,
} from "@/shared/models/workbench-creation";

export function humanizeSlug(value: string | null | undefined): string | null {
  const normalized = String(value || "")
    .trim()
    .replace(/[_/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return null;
  }

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function resolveCreationRecordsByUrls(
  userId: string,
  urls: string[],
) {
  const pairs = await Promise.all(
    urls.map(async (url) => {
      const creation = await findWorkbenchCreationByUserAndUrl(userId, url);
      return creation ? { url, creationRecordId: creation.id } : null;
    }),
  );

  return pairs.filter(
    (
      item,
    ): item is {
      url: string;
      creationRecordId: string;
    } => Boolean(item),
  );
}

function inferMediaTypeFromUrl(url: string): "image" | "video" | "audio" {
  const normalized = String(url || "")
    .toLowerCase()
    .split("?")[0]
    .split("#")[0];

  if (/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(normalized)) {
    return "audio";
  }

  if (/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(normalized)) {
    return "video";
  }

  return "image";
}

function inferMimeType(
  mediaType: "image" | "video" | "audio",
  url: string,
): string | null {
  const normalized = String(url || "")
    .toLowerCase()
    .split("?")[0]
    .split("#")[0];

  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    m4v: "video/x-m4v",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };

  const extension = normalized.split(".").pop() || "";
  if (mimeMap[extension]) {
    return mimeMap[extension];
  }

  if (mediaType === "video") return "video/mp4";
  if (mediaType === "audio") return "audio/mpeg";
  return "image/png";
}

function buildGeneratedFilename(
  mediaType: "image" | "video" | "audio",
  scene: string | null | undefined,
  index: number,
  url: string,
) {
  const normalizedUrl = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const extFromUrl = normalizedUrl.includes(".")
    ? normalizedUrl.split(".").pop()
    : "";
  const fallbackExt =
    mediaType === "video" ? "mp4" : mediaType === "audio" ? "mp3" : "png";
  const extension =
    extFromUrl && /^[a-z0-9]+$/i.test(extFromUrl) ? extFromUrl : fallbackExt;
  const baseName =
    String(scene || mediaType)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || mediaType;
  return `${baseName}-${index + 1}.${extension}`;
}

export async function persistSuccessfulOutputsToCreations(params: {
  userId: string;
  outputUrls: string[];
  sceneId?: string | null;
  providerName?: string | null;
  providerLabel?: string | null;
  prompt?: string | null;
  generationParams?: Record<string, any> | null;
  aspectRatio?: string | null;
}) {
  const sceneId = params.sceneId || null;
  const sceneLabel = humanizeSlug(sceneId) || sceneId || null;
  const actualModelUrl =
    typeof params.generationParams?.__modelUrl === "string" &&
    params.generationParams.__modelUrl.trim()
      ? params.generationParams.__modelUrl.trim()
      : null;
  const actualModelLabel =
    typeof params.generationParams?.__modelLabel === "string" &&
    params.generationParams.__modelLabel.trim()
      ? params.generationParams.__modelLabel.trim()
      : null;
  const modelUrl = actualModelUrl || params.providerName || null;
  const modelLabel =
    actualModelLabel ||
    humanizeSlug(actualModelUrl) ||
    params.providerLabel ||
    humanizeSlug(params.providerName) ||
    params.providerName ||
    null;

  const records = await Promise.all(
    params.outputUrls.map(async (url, index) => {
      if (!url) return null;

      const existing = await findWorkbenchCreationByUserAndUrl(
        params.userId,
        url,
      );
      if (existing) {
        return { url, creationRecordId: existing.id };
      }

      const mediaType = inferMediaTypeFromUrl(url);
      const creation = await createWorkbenchCreation({
        userId: params.userId,
        mediaType,
        sceneId,
        sceneLabel,
        modelUrl,
        modelLabel,
        filename: buildGeneratedFilename(mediaType, sceneId, index, url),
        url,
        mimeType: inferMimeType(mediaType, url),
        prompt: params.prompt || null,
        params: params.generationParams || null,
        aspectRatio: params.aspectRatio || null,
      });
      return { url, creationRecordId: creation.id };
    }),
  );

  return records.filter(
    (
      item,
    ): item is {
      url: string;
      creationRecordId: string;
    } => Boolean(item),
  );
}
