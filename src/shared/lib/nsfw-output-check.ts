import { getMediaWsrvThumbnail } from "@/shared/lib/wsrv";

const NSFW_CHECK_URL = process.env.NSFW_CHECK_URL?.trim();
const NSFW_CHECK_TOKEN = process.env.NSFW_CHECK_TOKEN?.trim();
const NSFW_CHECK_TIMEOUT = Number(process.env.NSFW_CHECK_TIMEOUT || "10000");
const NSFW_CHECK_PORN_THRESHOLD = Number(process.env.NSFW_CHECK_PORN_THRESHOLD || "0.8");

export type NsfwScores = {
  sexy?: number;
  neutral?: number;
  porn?: number;
  hentai?: number;
  drawing?: number;
};

export type NsfwCheckApiResponse = {
  code?: number;
  msg?: string;
  data?: NsfwScores & {
    sfw?: number;
    nsfw?: number;
    is_nsfw?: boolean;
    qr_status?: string;
  };
} & NsfwScores;

function getNsfwScores(result: NsfwCheckApiResponse | null | undefined): NsfwScores | null {
  if (!result) {
    return null;
  }

  if (typeof result.porn === "number") {
    return result;
  }

  if (result.data && typeof result.data.porn === "number") {
    return result.data;
  }

  return null;
}

export function getPornScore(result: NsfwCheckApiResponse | null | undefined) {
  return getNsfwScores(result)?.porn ?? 0;
}

export function isPornDetected(result: NsfwCheckApiResponse | null | undefined) {
  return getPornScore(result) >= NSFW_CHECK_PORN_THRESHOLD;
}

export async function checkOutputForNsfw(outputUrl: string) {
  if (!NSFW_CHECK_URL) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NSFW_CHECK_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (NSFW_CHECK_TOKEN) {
      headers.Authorization = `Bearer ${NSFW_CHECK_TOKEN}`;
    }

    const response = await fetch(NSFW_CHECK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: outputUrl,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`NSFW check failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as NsfwCheckApiResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkOutputsForNsfw(
  outputUrls: string[],
  mediaType: "image" | "video" = "image",
) {
  for (const outputUrl of outputUrls) {
    const candidateUrls = [
      getMediaWsrvThumbnail(outputUrl, mediaType, {
        width: 400,
        quality: 80,
        format: "webp",
        fit: "contain",
      }),
    ].filter(Boolean);

    for (const candidateUrl of candidateUrls) {
      const result = await checkOutputForNsfw(candidateUrl);
      if (isPornDetected(result)) {
        return result;
      }
    }
  }

  return null;
}

export function isImageLikeUrl(url: string) {
  const normalized = url.toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif"].some((ext) =>
    normalized.includes(ext),
  );
}

export function isVideoLikeUrl(url: string) {
  const normalized = url.toLowerCase();
  return [".mp4", ".mov", ".webm", ".m4v", ".avi"].some((ext) =>
    normalized.includes(ext),
  );
}
