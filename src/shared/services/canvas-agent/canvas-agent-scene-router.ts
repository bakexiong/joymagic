import {
  DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
  DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
} from "@/shared/lib/video-model-defaults";
import type { CanvasWorkflowSubtype } from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";

export const DEFAULT_TEXT_TO_IMAGE_MODEL_URL = "/text-to-image/gpt-image-2";
export const DEFAULT_IMAGE_TO_IMAGE_MODEL_URL = "/image-to-image/gpt-image-2";

export type CanvasAgentSceneRoute = {
  subtype: CanvasWorkflowSubtype;
  preferredModelUrl: string;
  reasoning: string;
};

export function routeCanvasAgentScene(input: {
  subtype: CanvasWorkflowSubtype;
  preferredModelUrl?: string | null;
}) {
  if (input.preferredModelUrl) {
    return {
      subtype: input.subtype,
      preferredModelUrl: input.preferredModelUrl,
      reasoning: "沿用智能体已推荐的模型。",
    } satisfies CanvasAgentSceneRoute;
  }

  const preferredModelUrl =
    input.subtype === "text-to-video"
      ? DEFAULT_TEXT_TO_VIDEO_MODEL_URL
      : input.subtype === "image-to-video"
        ? DEFAULT_IMAGE_TO_VIDEO_MODEL_URL
        : input.subtype === "image-to-image"
          ? DEFAULT_IMAGE_TO_IMAGE_MODEL_URL
          : DEFAULT_TEXT_TO_IMAGE_MODEL_URL;

  return {
    subtype: input.subtype,
    preferredModelUrl,
    reasoning: "使用当前产品默认的场景模型映射。",
  } satisfies CanvasAgentSceneRoute;
}
