const HIDDEN_STUDIO_TOOL_PATH_PREFIXES = [
  "/tool/longcat-avatar",
  "/tool/reference-to-video",
  "/tool/video-extend",
  "/tools/longcat-avatar",
  "/tools/reference-to-video",
  "/tools/video-extend",
  "/longcat-avatar",
  "/reference-to-video",
  "/video-extend",
] as const;

export function isStudioToolHidden(url: string) {
  return HIDDEN_STUDIO_TOOL_PATH_PREFIXES.some((prefix) =>
    url.startsWith(prefix),
  );
}
