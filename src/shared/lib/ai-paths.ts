import { isCreemReviewMode } from "@/shared/lib/creem-review";

export function isImageAiPath(pathname: string) {
  return (
    pathname === "/ai-image-generator" ||
    pathname.startsWith("/text-to-image") ||
    pathname.startsWith("/image-to-image") ||
    pathname === "/image-eraser" ||
    pathname === "/image-background-remover" ||
    pathname === "/image-upscaler" ||
    pathname === "/qwen-image-layered"
  );
}

export function isVideoAiPath(pathname: string) {
  if (isCreemReviewMode() && pathname.startsWith("/video-face-swap")) {
    return false;
  }
  return (
    pathname === "/ai-video-generator" ||
    pathname.startsWith("/text-to-video") ||
    pathname.startsWith("/image-to-video") ||
    pathname.startsWith("/reference-to-video") ||
    pathname.startsWith("/video-extend") ||
    pathname.startsWith("/motion-control") ||
    pathname === "/longcat-avatar" ||
    pathname === "/video-face-swap"
  );
}

export function isMobileAiWorkbenchPath(pathname: string) {
  return isImageAiPath(pathname) || isVideoAiPath(pathname);
}
