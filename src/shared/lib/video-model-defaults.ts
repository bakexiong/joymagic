export const DEFAULT_TEXT_TO_VIDEO_MODEL_URL =
  "/text-to-video/seedance-1-5-pro";
export const DEFAULT_IMAGE_TO_VIDEO_MODEL_URL =
  "/image-to-video/seedance-2-0";
export const DEFAULT_REFERENCE_TO_VIDEO_MODEL_URL =
  "/reference-to-video/kling-video-o3-std";

type SceneLike = {
  url?: string;
  children?: Array<{ url: string }>;
};

function pickFirstAvailable(candidates: string[], preferred: string) {
  return candidates.find((url) => url === preferred) || "";
}

export function resolveDefaultVideoModelUrl(scene?: SceneLike | null) {
  if (!scene) {
    return "";
  }

  const candidates = [...(scene.children?.map((child) => child.url) ?? [])]
    .concat(scene.url ? [scene.url] : [])
    .filter(Boolean);

  const isTextToVideoScene =
    scene.url?.startsWith("/text-to-video") ||
    candidates.some((url) => url.startsWith("/text-to-video/"));
  if (isTextToVideoScene) {
    return (
      pickFirstAvailable(candidates, DEFAULT_TEXT_TO_VIDEO_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  const isImageToVideoScene =
    scene.url?.startsWith("/image-to-video") ||
    candidates.some((url) => url.startsWith("/image-to-video/"));
  if (isImageToVideoScene) {
    return (
      pickFirstAvailable(candidates, DEFAULT_IMAGE_TO_VIDEO_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  const isReferenceToVideoScene =
    scene.url?.startsWith("/reference-to-video") ||
    candidates.some((url) => url.startsWith("/reference-to-video/"));
  if (isReferenceToVideoScene) {
    return (
      pickFirstAvailable(candidates, DEFAULT_REFERENCE_TO_VIDEO_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  return scene.children?.[0]?.url || scene.url || "";
}
