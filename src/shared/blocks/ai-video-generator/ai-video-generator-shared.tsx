"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

import type { NavItem } from "@/shared/types/blocks/common";

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
  AiGeneratorWorkbench as AiVideoGeneratorWorkbench,
  type AiGeneratorWorkbenchProps as AiVideoGeneratorWorkbenchProps,
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
  AiVideoGeneratorWorkbench,
  type AiVideoGeneratorWorkbenchProps,
};

type PreloadableGeneratorComponent = ComponentType<{ className?: string }> & {
  preload?: () => Promise<unknown>;
};

export const FORM_COMPONENTS: Record<string, PreloadableGeneratorComponent> = {
  "/text-to-video/wan-2-6": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoWan26,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/veo-3-1": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoVeo31,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/seedance-1-5-pro": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoSeedance15Pro,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/seedance-2-0": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoSeedance20,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/pixverse-5-6": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoPixverse56,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/ltx2-fast": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoLtx2Fast,
        }),
    ),
    { loading: DynamicBlockLoading },
  ),
  "/text-to-video/happyhorse-1-0": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.TextToVideoHappyHorse10,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/vidu-q3": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoViduQ3,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/veo-3-1": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoVeo31,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/seedance-1-5-pro": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoSeedance15Pro,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/seedance-2-0": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoSeedance20,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/pixverse-5-6": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoPixverse56,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/ltx2-fast": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoLtx2Fast,
        }),
    ),
    { loading: DynamicBlockLoading },
  ),
  "/image-to-video/happyhorse-1-0": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.ImageToVideoHappyHorse10,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/motion-control/kling-2-6-pro": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then(
        (mod) => ({
          default: mod.Kling26ProMotionControlPlayground,
        }),
      ),
    { loading: DynamicBlockLoading },
  ),
  "/longcat-avatar": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
        default: mod.LongcatAvatarUnifiedPlayground,
      })),
    { loading: DynamicBlockLoading },
  ),
  "/video-face-swap": dynamic(
    () =>
      import("@/themes/default/blocks/ai-media-playgrounds").then((mod) => ({
        default: mod.VideoFaceSwapUnifiedPlayground,
      })),
    { loading: DynamicBlockLoading },
  ),
};

export function extractVideoAiScenes(navItems: NavItem[]) {
  return extractAiScenes(navItems); // 不传 filter，显示所有 Image 和 Video 选项
}

export function preloadVideoFormComponent(url?: string) {
  preloadFormComponent(url, FORM_COMPONENTS);
}
