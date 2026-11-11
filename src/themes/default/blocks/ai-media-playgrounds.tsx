"use client";

import { DesktopMediaAiWorkbench } from "@/shared/blocks/common/desktop-media-ai-workbench";
import {
  flux2KleinImageToImageConfig,
  flux2KleinTextToImageConfig,
  gptImage1TextToImageConfig,
  gptImage2ImageToImageConfig,
  gptImage2TextToImageConfig,
  grokImagineImageToImageConfig,
  imageBackgroundRemoverConfig,
  imageEraserConfig,
  imageToImageConfig,
  imageUpscalerConfig,
  happyhorse10ImageToVideoConfig,
  happyhorse10TextToVideoConfig,
  kling26ProMotionControlConfig,
  ltx2FastImageToVideoConfig,
  ltx2FastTextToVideoConfig,
  longcatAvatarConfig,
  midjourneyTextToImageConfig,
  midjourneyImageToVideoConfig,
  nanoBanana2ImageToImageConfig,
  nanoBanana2TextToImageConfig,
  nanoBananaImageToImageConfig,
  nanoBananaProEditUltraImageToImageConfig,
  nanoBananaProTextToImageConfig,
  nanoBananaTextToImageConfig,
  pixverse56ImageToVideoConfig,
  pixverse56TextToVideoConfig,
  qwen202512TextToImageConfig,
  qwenImageLayeredConfig,
  qwenImageMaxImageToImageConfig,
  seedance20TextToVideoConfig,
  seedance20ImageToVideoConfig,
  seedance15ProImageToVideoConfig,
  seedance15ProTextToVideoConfig,
  seedream50LiteImageToImageConfig,
  seedream50LiteTextToImageConfig,
  seedreamV45TextToImageConfig,
  soulImageToImageConfig,
  veo31ImageToVideoConfig,
  veo31TextToVideoConfig,
  videoFaceSwapConfig,
  viduQ3ImageToVideoConfig,
  wan26TextToVideoConfig,
  yogaV1TextToImageConfig,
  zImageTurboImageToImageConfig,
} from "@/shared/blocks/desktop-playground";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import type { NavItem } from "@/shared/types/blocks/common";

type UnifiedPlaygroundProps = {
  className?: string;
  headerNavItems?: NavItem[];
  onGenerationComplete?: (result: {
    url: string;
    type: "image" | "video";
    prompt: string;
    parameters: Record<string, any>;
  }) => void;
};

function createUnifiedPlayground(playgroundConfig: PlaygroundConfig) {
  return function UnifiedPlayground({
    headerNavItems,
  }: UnifiedPlaygroundProps) {
    return (
      <DesktopMediaAiWorkbench
        headerNavItems={headerNavItems}
        playgroundConfig={playgroundConfig}
      />
    );
  };
}

export const YogaV1TextToImagePlayground =
  createUnifiedPlayground(yogaV1TextToImageConfig);
export const NanoBananaTextToImagePlayground =
  createUnifiedPlayground(nanoBananaTextToImageConfig);
export const NanoBananaProTextToImagePlayground =
  createUnifiedPlayground(nanoBananaProTextToImageConfig);
export const NanoBanana2TextToImagePlayground =
  createUnifiedPlayground(nanoBanana2TextToImageConfig);
export const SeedreamV45TextToImagePlayground =
  createUnifiedPlayground(seedreamV45TextToImageConfig);
export const Seedream50LiteTextToImagePlayground =
  createUnifiedPlayground(seedream50LiteTextToImageConfig);
export const Flux2KleinTextToImagePlayground =
  createUnifiedPlayground(flux2KleinTextToImageConfig);
export const GptImage1TextToImagePlayground =
  createUnifiedPlayground(gptImage1TextToImageConfig);
export const GptImage2TextToImagePlayground =
  createUnifiedPlayground(gptImage2TextToImageConfig);
export const Qwen202512TextToImagePlayground =
  createUnifiedPlayground(qwen202512TextToImageConfig);
export const MidjourneyTextToImageUnifiedPlayground =
  createUnifiedPlayground(midjourneyTextToImageConfig);

export const ImageToImagePlayground =
  createUnifiedPlayground(imageToImageConfig);
export const Flux2KleinImageToImagePlayground =
  createUnifiedPlayground(flux2KleinImageToImageConfig);
export const SoulImageToImagePlayground =
  createUnifiedPlayground(soulImageToImageConfig);
export const ZImageTurboImageToImagePlayground =
  createUnifiedPlayground(zImageTurboImageToImageConfig);
export const GrokImagineImageToImagePlayground =
  createUnifiedPlayground(grokImagineImageToImageConfig);
export const Seedream50LiteImageToImagePlayground =
  createUnifiedPlayground(seedream50LiteImageToImageConfig);
export const QwenImageMaxImageToImagePlayground =
  createUnifiedPlayground(qwenImageMaxImageToImageConfig);
export const GptImage2ImageToImagePlayground =
  createUnifiedPlayground(gptImage2ImageToImageConfig);
export const NanoBananaImageToImagePlayground =
  createUnifiedPlayground(nanoBananaImageToImageConfig);
export const NanoBanana2ImageToImagePlayground =
  createUnifiedPlayground(nanoBanana2ImageToImageConfig);
export const NanoBananaProEditUltraImageToImagePlayground =
  createUnifiedPlayground(nanoBananaProEditUltraImageToImageConfig);
export const QwenImageLayeredPlayground =
  createUnifiedPlayground(qwenImageLayeredConfig);
export const ImageEraserPlayground =
  createUnifiedPlayground(imageEraserConfig);
export const ImageBackgroundRemoverPlayground =
  createUnifiedPlayground(imageBackgroundRemoverConfig);
export const ImageUpscalerPlayground =
  createUnifiedPlayground(imageUpscalerConfig);

export const TextToVideoWan26Playground =
  createUnifiedPlayground(wan26TextToVideoConfig);
export const TextToVideoVeo31Playground =
  createUnifiedPlayground(veo31TextToVideoConfig);
export const TextToVideoSeedance15ProPlayground =
  createUnifiedPlayground(seedance15ProTextToVideoConfig);
export const TextToVideoSeedance20Playground =
  createUnifiedPlayground(seedance20TextToVideoConfig);
export const TextToVideoPixverse56Playground =
  createUnifiedPlayground(pixverse56TextToVideoConfig);
export const TextToVideoLtx2FastPlayground =
  createUnifiedPlayground(ltx2FastTextToVideoConfig);
export const TextToVideoHappyHorse10Playground =
  createUnifiedPlayground(happyhorse10TextToVideoConfig);

export const ImageToVideoViduQ3Playground =
  createUnifiedPlayground(viduQ3ImageToVideoConfig);
export const ImageToVideoVeo31Playground =
  createUnifiedPlayground(veo31ImageToVideoConfig);
export const ImageToVideoSeedance15ProPlayground =
  createUnifiedPlayground(seedance15ProImageToVideoConfig);
export const ImageToVideoSeedance20Playground =
  createUnifiedPlayground(seedance20ImageToVideoConfig);
export const ImageToVideoPixverse56Playground =
  createUnifiedPlayground(pixverse56ImageToVideoConfig);
export const ImageToVideoLtx2FastPlayground =
  createUnifiedPlayground(ltx2FastImageToVideoConfig);
export const ImageToVideoHappyHorse10Playground =
  createUnifiedPlayground(happyhorse10ImageToVideoConfig);
export const ImageToVideoMidjourneyPlayground =
  createUnifiedPlayground(midjourneyImageToVideoConfig);
export const Kling26ProMotionControlPlayground =
  createUnifiedPlayground(kling26ProMotionControlConfig);
export const LongcatAvatarUnifiedPlayground =
  createUnifiedPlayground(longcatAvatarConfig);
export const VideoFaceSwapUnifiedPlayground =
  createUnifiedPlayground(videoFaceSwapConfig);

export const TextToVideoWan26 = TextToVideoWan26Playground;
export const TextToVideoVeo31 = TextToVideoVeo31Playground;
export const TextToVideoSeedance15Pro = TextToVideoSeedance15ProPlayground;
export const TextToVideoSeedance20 = TextToVideoSeedance20Playground;
export const TextToVideoPixverse56 = TextToVideoPixverse56Playground;
export const TextToVideoLtx2Fast = TextToVideoLtx2FastPlayground;
export const TextToVideoHappyHorse10 = TextToVideoHappyHorse10Playground;

export const ImageToVideoViduQ3 = ImageToVideoViduQ3Playground;
export const ImageToVideoVeo31 = ImageToVideoVeo31Playground;
export const ImageToVideoSeedance15Pro =
  ImageToVideoSeedance15ProPlayground;
export const ImageToVideoSeedance20 = ImageToVideoSeedance20Playground;
export const ImageToVideoPixverse56 = ImageToVideoPixverse56Playground;
export const ImageToVideoLtx2Fast = ImageToVideoLtx2FastPlayground;
export const ImageToVideoHappyHorse10 = ImageToVideoHappyHorse10Playground;
export const ImageToVideoMidjourney = ImageToVideoMidjourneyPlayground;
export const Kling26ProMotionControl = Kling26ProMotionControlPlayground;
export const MidjourneyTextToImageUnified =
  MidjourneyTextToImageUnifiedPlayground;
export const LongcatAvatarUnified = LongcatAvatarUnifiedPlayground;
export const VideoFaceSwapUnified = VideoFaceSwapUnifiedPlayground;
