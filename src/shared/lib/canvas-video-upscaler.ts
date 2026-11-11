export const CANVAS_VIDEO_UPSCALER_SCENE = "canvas-video-upscaler";

export type CanvasVideoUpscaleTargetResolution = "1080p" | "2k" | "4k";

export type CanvasVideoUpscaleRequestBody = {
  video: string;
  target_resolution: CanvasVideoUpscaleTargetResolution;
  duration: number;
};

export type CanvasVideoUpscaleInvocation = {
  videoUrl: string;
  targetResolution: CanvasVideoUpscaleTargetResolution;
  duration: number;
};
