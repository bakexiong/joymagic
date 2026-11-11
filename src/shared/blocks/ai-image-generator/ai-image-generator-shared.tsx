"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

import type { NavItem } from "@/shared/types/blocks/common";
import { withGenerationCapture } from "@/shared/hoc/with-generation-capture";

import {
  type GeneratorBlockProps,
  type SceneNode,
  type ModelNode,
  WORKBENCH_SHELL_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_FIELD_SURFACE_CLASS,
  WORKBENCH_SCENE_SELECT_CONTENT_CLASS,
  WORKBENCH_SCENE_TRIGGER_CLASS,
  WORKBENCH_SELECT_CONTENT_CLASS,
  WORKBENCH_MUTED_TEXT_CLASS,
  WORKBENCH_FORM_OVERRIDE_CLASS,
  DynamicBlockLoading,
  ScenePickerControl,
  SceneSelectTriggerValue,
  extractAiScenes,
  findFirstSceneWithWorkspace,
  preloadFormComponent,
  renderSceneSelectItems,
  AiGeneratorWorkbench as AiImageGeneratorWorkbench,
  type AiGeneratorWorkbenchProps as AiImageGeneratorWorkbenchProps,
} from "@/shared/blocks/common/ai-generator-shared";

export {
  type GeneratorBlockProps,
  type SceneNode,
  type ModelNode,
  WORKBENCH_SHELL_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_FIELD_SURFACE_CLASS,
  WORKBENCH_SCENE_SELECT_CONTENT_CLASS,
  WORKBENCH_SCENE_TRIGGER_CLASS,
  WORKBENCH_SELECT_CONTENT_CLASS,
  WORKBENCH_MUTED_TEXT_CLASS,
  WORKBENCH_FORM_OVERRIDE_CLASS,
  DynamicBlockLoading,
  ScenePickerControl,
  SceneSelectTriggerValue,
  findFirstSceneWithWorkspace,
  renderSceneSelectItems,
  AiImageGeneratorWorkbench,
  type AiImageGeneratorWorkbenchProps,
};

type PreloadableGeneratorComponent = ComponentType<{
  className?: string;
  onGenerationComplete?: (result: {
    url: string;
    type: "image" | "video";
    prompt: string;
    parameters: Record<string, any>;
  }) => void;
}> & {
  preload?: () => Promise<unknown>;
};

export const FORM_COMPONENTS: Record<string, PreloadableGeneratorComponent> = {
  "/text-to-image/z-image-turbo": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/wavespeed-image-generator").then(
          (mod) => ({
            default: mod.WavespeedImageGenerator,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "WavespeedImageGenerator",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/yoga-v1": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/wavespeed-image-generator").then(
          (mod) => ({
            default: mod.WavespeedImageGenerator,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "WavespeedImageGenerator",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/nano-banana": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBananaTextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBananaTextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/nano-banana-pro": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBananaProTextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBananaProTextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/nano-banana-2": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBanana2TextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBanana2TextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/seedream-4-5": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.SeedreamV45TextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "SeedreamV45TextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/seedream-5-0-lite": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.Seedream50LiteTextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "Seedream50LiteTextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/flux-2-klein": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.Flux2KleinTextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "Flux2KleinTextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/gpt-image-1": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.GptImage1TextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "GptImage1TextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/gpt-image-2": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.GptImage2TextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "GptImage2TextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/qwen-image-202512": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.Qwen202512TextToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "Qwen202512TextToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/text-to-image/midjourney": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.MidjourneyTextToImageUnifiedPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "MidjourneyTextToImageUnifiedPlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/flux-2-klein": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.Flux2KleinImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "Flux2KleinImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/soul": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.SoulImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "SoulImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/z-image-turbo": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ZImageTurboImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ZImageTurboImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/grok-imagine-image": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.GrokImagineImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "GrokImagineImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/seedream-5-0-lite": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.Seedream50LiteImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "Seedream50LiteImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/qwen-image-max": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.QwenImageMaxImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "QwenImageMaxImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/gpt-image-2": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.GptImage2ImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "GptImage2ImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/nano-banana": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBananaImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBananaImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/nano-banana-2": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBanana2ImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBanana2ImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/image-to-image/nano-banana-pro-edit-ultra": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.NanoBananaProEditUltraImageToImagePlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "NanoBananaProEditUltraImageToImagePlayground",
  ) as PreloadableGeneratorComponent,
  "/qwen-image-layered": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.QwenImageLayeredPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "QwenImageLayeredPlayground",
  ) as PreloadableGeneratorComponent,
  "/image-eraser": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageEraserPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageEraserPlayground",
  ) as PreloadableGeneratorComponent,
  "/image-background-remover": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageBackgroundRemoverPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageBackgroundRemoverPlayground",
  ) as PreloadableGeneratorComponent,
  "/image-upscaler": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageUpscalerPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageUpscalerPlayground",
  ) as PreloadableGeneratorComponent,
  // Video generation components
  "/text-to-video/wan-2-6": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/text-to-video/wan-2-6/text-to-video").then(
          (mod) => ({
            default: mod.TextToVideoWan26,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoWan26",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/veo-3-1": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/text-to-video/veo-3-1/text-to-video").then(
          (mod) => ({
            default: mod.TextToVideoVeo31,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoVeo31",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/seedance-1-5-pro": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/text-to-video/seedance-1-5-pro/text-to-video").then(
          (mod) => ({
            default: mod.TextToVideoSeedance15Pro,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoSeedance15Pro",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/seedance-2-0": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
          default: mod.TextToVideoSeedance20,
        })),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoSeedance20",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/pixverse-5-6": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/text-to-video/pixverse-v5-6/text-to-video").then(
          (mod) => ({
            default: mod.TextToVideoPixverse56,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoPixverse56",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/ltx2-fast": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/text-to-video/ltx-2-fast/text-to-video").then(
          (mod) => ({
            default: mod.TextToVideoLtx2Fast,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoLtx2Fast",
  ) as PreloadableGeneratorComponent,
  "/text-to-video/happyhorse-1-0": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.TextToVideoHappyHorse10,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "TextToVideoHappyHorse10",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/vidu-q3": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/image-to-video/vidu-q3/image-to-video").then(
          (mod) => ({
            default: mod.ImageToVideoViduQ3,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoViduQ3",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/veo-3-1": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/image-to-video/veo-3-1/image-to-video").then(
          (mod) => ({
            default: mod.ImageToVideoVeo31,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoVeo31",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/seedance-1-5-pro": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/image-to-video/seedance-1-5-pro/image-to-video").then(
          (mod) => ({
            default: mod.ImageToVideoSeedance15Pro,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoSeedance15Pro",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/seedance-2-0": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
          default: mod.ImageToVideoSeedance20,
        })),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoSeedance20",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/pixverse-5-6": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/image-to-video/pixverse-v5-6/image-to-video").then(
          (mod) => ({
            default: mod.ImageToVideoPixverse56,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoPixverse56",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/ltx2-fast": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageToVideoLtx2Fast,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoLtx2Fast",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/happyhorse-1-0": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageToVideoHappyHorse10,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoHappyHorse10",
  ) as PreloadableGeneratorComponent,
  "/image-to-video/midjourney": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then(
          (mod) => ({
            default: mod.ImageToVideoMidjourneyPlayground,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "ImageToVideoMidjourneyPlayground",
  ) as PreloadableGeneratorComponent,
  "/motion-control/kling-2-6-pro": withGenerationCapture(
    dynamic(
      () =>
        import("@/shared/blocks/kling-v2.6-pro/motion-control/motion-control").then(
          (mod) => ({
            default: mod.KlingV26ProMotionControl,
          }),
        ),
      { loading: DynamicBlockLoading },
    ),
    "KlingV26ProMotionControl",
  ) as PreloadableGeneratorComponent,
  "/longcat-avatar": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
          default: mod.LongcatAvatarUnifiedPlayground,
        })),
      { loading: DynamicBlockLoading },
    ),
    "LongcatAvatarUnifiedPlayground",
  ) as PreloadableGeneratorComponent,
  "/video-face-swap": withGenerationCapture(
    dynamic(
      () =>
        import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
          default: mod.VideoFaceSwapUnifiedPlayground,
        })),
      { loading: DynamicBlockLoading },
    ),
    "VideoFaceSwapUnifiedPlayground",
  ) as PreloadableGeneratorComponent,
};

export function extractImageAiScenes(navItems: NavItem[]) {
  return extractAiScenes(navItems); // 不传 filter，显示所有 Image 和 Video 选项
}

export function preloadImageFormComponent(url?: string) {
  preloadFormComponent(url, FORM_COMPONENTS);
}
