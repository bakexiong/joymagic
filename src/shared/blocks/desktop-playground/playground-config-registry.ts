import type { PlaygroundConfig } from "./types/playground-config";
import { isCreemReviewMode } from "@/shared/lib/creem-review";

/**
 * 使用静态注册表避免 dev/HMR 下异步 chunk 初始化不稳定，
 * 优先保证画布页在客户端可稳定读取配置。
 */

/**
 * URL 路径到 registry key 的映射表。
 * 源：FORM_COMPONENTS (ai-image-generator-shared.tsx) 的 key，
 * 目标：configs 文件的命名导出名。
 */
export const REGISTRY_KEY_BY_URL: Record<string, string> = {
  // Text to Image
  "/text-to-image/z-image-turbo": "zImageTurboTextToImageConfig",
  "/text-to-image/yoga-v1": "yogaV1TextToImageConfig",
  "/text-to-image/nano-banana": "nanoBananaTextToImageConfig",
  "/text-to-image/nano-banana-pro": "nanoBananaProTextToImageConfig",
  "/text-to-image/nano-banana-2": "nanoBanana2TextToImageConfig",
  "/text-to-image/flux-2-klein": "flux2KleinTextToImageConfig",
  "/text-to-image/gpt-image-1": "gptImage1TextToImageConfig",
  "/text-to-image/gpt-image-2": "gptImage2TextToImageConfig",
  "/text-to-image/qwen-image-202512": "qwen202512TextToImageConfig",
  "/text-to-image/wan-2-7": "wan27TextToImageConfig",
  "/text-to-image/seedream-4-5": "seedreamV45TextToImageConfig",
  "/text-to-image/seedream-5-0-lite": "seedream50LiteTextToImageConfig",
  "/text-to-image/midjourney": "midjourneyTextToImageConfig",
  // Image to Image
  "/image-to-image": "gptImage2ImageToImageConfig",
  "/image-to-image/flux-2-klein": "flux2KleinImageToImageConfig",
  "/image-to-image/soul": "soulImageToImageConfig",
  "/image-to-image/z-image-turbo": "zImageTurboImageToImageConfig",
  "/image-to-image/grok-imagine-image": "grokImagineImageToImageConfig",
  "/image-to-image/seedream-5-0-lite": "seedream50LiteImageToImageConfig",
  "/image-to-image/qwen-image-max": "qwenImageMaxImageToImageConfig",
  "/image-to-image/gpt-image-2": "gptImage2ImageToImageConfig",
  "/image-to-image/wan-2-7": "wan27ImageToImageConfig",
  "/image-to-image/wan-2-7-image-edit-pro": "wan27ImageEditProConfig",
  "/image-to-image/nano-banana": "nanoBananaImageToImageConfig",
  "/image-to-image/nano-banana-2": "nanoBanana2ImageToImageConfig",
  "/image-to-image/nano-banana-pro-edit-ultra":
    "nanoBananaProEditUltraImageToImageConfig",
  "/qwen-image-layered": "qwenImageLayeredConfig",
  "/image-eraser": "imageEraserConfig",
  "/image-background-remover": "imageBackgroundRemoverConfig",
  "/image-upscaler": "imageUpscalerConfig",
  // Video
  "/text-to-video/wan-2-7": "wan27TextToVideoConfig",
  "/text-to-video/wan-2-6": "wan26TextToVideoConfig",
  "/text-to-video/veo-3-1": "veo31TextToVideoConfig",
  "/text-to-video/seedance-1-5-pro": "seedance15ProTextToVideoConfig",
  "/text-to-video/seedance-2-0": "seedance20TextToVideoConfig",
  "/text-to-video/pixverse-5-6": "pixverse56TextToVideoConfig",
  "/text-to-video/ltx2-fast": "ltx2FastTextToVideoConfig",
  "/text-to-video/happyhorse-1-0": "happyhorse10TextToVideoConfig",
  "/image-to-video/wan-2-7": "wan27ImageToVideoConfig",
  "/image-to-video/vidu-q3": "viduQ3ImageToVideoConfig",
  "/image-to-video/veo-3-1": "veo31ImageToVideoConfig",
  "/image-to-video/seedance-1-5-pro": "seedance15ProImageToVideoConfig",
  "/image-to-video/seedance-2-0": "seedance20ImageToVideoConfig",
  "/image-to-video/pixverse-5-6": "pixverse56ImageToVideoConfig",
  "/image-to-video/ltx2-fast": "ltx2FastImageToVideoConfig",
  "/image-to-video/happyhorse-1-0": "happyhorse10ImageToVideoConfig",
  "/image-to-video/midjourney": "midjourneyImageToVideoConfig",
  "/reference-to-video/wan-2-7": "wan27ReferenceToVideoConfig",
  "/reference-to-video/kling-video-o3-4k":
    "klingVideoO34kReferenceToVideoConfig",
  "/reference-to-video/kling-video-o1-std":
    "klingVideoO1StdReferenceToVideoConfig",
  "/reference-to-video/kling-video-o3-pro":
    "klingVideoO3ProReferenceToVideoConfig",
  "/reference-to-video/kling-video-o3-std":
    "klingVideoO3StdReferenceToVideoConfig",
  "/reference-to-video/grok-imagine-video":
    "grokImagineVideoReferenceToVideoConfig",
  "/video-extend/wan-2-7": "wan27VideoExtendConfig",
  "/motion-control/kling-2-6-pro": "kling26ProMotionControlConfig",
  "/longcat-avatar": "longcatAvatarConfig",
  "/video-face-swap": "videoFaceSwapConfig",
};

type PlaygroundConfigLoader = () => Promise<PlaygroundConfig | undefined>;

const CONFIG_LOADER_BY_URL: Record<string, PlaygroundConfigLoader> = {
  "/text-to-image/z-image-turbo": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.zImageTurboTextToImageConfig,
    ),
  "/text-to-image/yoga-v1": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.yogaV1TextToImageConfig,
    ),
  "/text-to-image/nano-banana": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.nanoBananaTextToImageConfig,
    ),
  "/text-to-image/nano-banana-pro": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.nanoBananaProTextToImageConfig,
    ),
  "/text-to-image/nano-banana-2": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.nanoBanana2TextToImageConfig,
    ),
  "/text-to-image/flux-2-klein": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.flux2KleinTextToImageConfig,
    ),
  "/text-to-image/gpt-image-1": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.gptImage1TextToImageConfig,
    ),
  "/text-to-image/gpt-image-2": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.gptImage2TextToImageConfig,
    ),
  "/text-to-image/qwen-image-202512": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.qwen202512TextToImageConfig,
    ),
  "/text-to-image/wan-2-7": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.wan27TextToImageConfig,
    ),
  "/text-to-image/seedream-4-5": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.seedreamV45TextToImageConfig,
    ),
  "/text-to-image/seedream-5-0-lite": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.seedream50LiteTextToImageConfig,
    ),
  "/text-to-image/midjourney": () =>
    import("./configs/text-to-image-configs").then(
      (mod) => mod.midjourneyTextToImageConfig,
    ),
  "/image-to-image": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.imageToImageConfig,
    ),
  "/image-to-image/flux-2-klein": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.flux2KleinImageToImageConfig,
    ),
  "/image-to-image/soul": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.soulImageToImageConfig,
    ),
  "/image-to-image/z-image-turbo": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.zImageTurboImageToImageConfig,
    ),
  "/image-to-image/grok-imagine-image": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.grokImagineImageToImageConfig,
    ),
  "/image-to-image/seedream-5-0-lite": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.seedream50LiteImageToImageConfig,
    ),
  "/image-to-image/qwen-image-max": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.qwenImageMaxImageToImageConfig,
    ),
  "/image-to-image/gpt-image-2": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.gptImage2ImageToImageConfig,
    ),
  "/image-to-image/wan-2-7": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.wan27ImageToImageConfig,
    ),
  "/image-to-image/wan-2-7-image-edit-pro": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.wan27ImageEditProConfig,
    ),
  "/image-to-image/nano-banana": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.nanoBananaImageToImageConfig,
    ),
  "/image-to-image/nano-banana-2": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.nanoBanana2ImageToImageConfig,
    ),
  "/image-to-image/nano-banana-pro-edit-ultra": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.nanoBananaProEditUltraImageToImageConfig,
    ),
  "/qwen-image-layered": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.qwenImageLayeredConfig,
    ),
  "/image-eraser": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.imageEraserConfig,
    ),
  "/image-background-remover": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.imageBackgroundRemoverConfig,
    ),
  "/image-upscaler": () =>
    import("./configs/image-to-image-configs").then(
      (mod) => mod.imageUpscalerConfig,
    ),
  "/text-to-video/wan-2-7": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.wan27TextToVideoConfig,
    ),
  "/text-to-video/wan-2-6": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.wan26TextToVideoConfig,
    ),
  "/text-to-video/veo-3-1": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.veo31TextToVideoConfig,
    ),
  "/text-to-video/seedance-1-5-pro": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.seedance15ProTextToVideoConfig,
    ),
  "/text-to-video/seedance-2-0": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.seedance20TextToVideoConfig,
    ),
  "/text-to-video/pixverse-5-6": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.pixverse56TextToVideoConfig,
    ),
  "/text-to-video/ltx2-fast": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.ltx2FastTextToVideoConfig,
    ),
  "/text-to-video/happyhorse-1-0": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.happyhorse10TextToVideoConfig,
    ),
  "/image-to-video/wan-2-7": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.wan27ImageToVideoConfig,
    ),
  "/image-to-video/vidu-q3": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.viduQ3ImageToVideoConfig,
    ),
  "/image-to-video/veo-3-1": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.veo31ImageToVideoConfig,
    ),
  "/image-to-video/seedance-1-5-pro": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.seedance15ProImageToVideoConfig,
    ),
  "/image-to-video/seedance-2-0": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.seedance20ImageToVideoConfig,
    ),
  "/image-to-video/pixverse-5-6": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.pixverse56ImageToVideoConfig,
    ),
  "/image-to-video/ltx2-fast": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.ltx2FastImageToVideoConfig,
    ),
  "/image-to-video/happyhorse-1-0": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.happyhorse10ImageToVideoConfig,
    ),
  "/image-to-video/midjourney": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.midjourneyImageToVideoConfig,
    ),
  "/reference-to-video/wan-2-7": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.wan27ReferenceToVideoConfig,
    ),
  "/reference-to-video/kling-video-o3-4k": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.klingVideoO34kReferenceToVideoConfig,
    ),
  "/reference-to-video/kling-video-o1-std": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.klingVideoO1StdReferenceToVideoConfig,
    ),
  "/reference-to-video/kling-video-o3-pro": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.klingVideoO3ProReferenceToVideoConfig,
    ),
  "/reference-to-video/kling-video-o3-std": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.klingVideoO3StdReferenceToVideoConfig,
    ),
  "/reference-to-video/grok-imagine-video": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.grokImagineVideoReferenceToVideoConfig,
    ),
  "/video-extend/wan-2-7": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.wan27VideoExtendConfig,
    ),
  "/motion-control/kling-2-6-pro": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.kling26ProMotionControlConfig,
    ),
  "/longcat-avatar": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.longcatAvatarConfig,
    ),
  "/video-face-swap": () =>
    import("./configs/video-generation-configs").then(
      (mod) => mod.videoFaceSwapConfig,
    ),
};

let _registry: Record<string, PlaygroundConfig> | null = null;

/**
 * 根据 URL 路径查找对应的 PlaygroundConfig。
 * 如果 URL 不在映射表中，返回 undefined。
 */
export function getPlaygroundConfigByUrl(
  url: string,
): Promise<PlaygroundConfig | undefined> {
  const loader = CONFIG_LOADER_BY_URL[url];
  return loader ? loader() : Promise.resolve(undefined);
}

/**
 * 同步占位——用于 TypeScript 类型标注和默认值；实际值在异步加载后生效
 */
export const PLAYGROUND_CONFIG_BY_MODEL_URL: Record<string, PlaygroundConfig> =
  {};

export async function getPlaygroundConfigRegistry(): Promise<
  Record<string, PlaygroundConfig>
> {
  if (_registry) {
    return _registry;
  }

  const blockedUrls = isCreemReviewMode()
    ? new Set<string>(["/video-face-swap", "/ai-clothes-remover"])
    : null;

  const pairs = await Promise.all(
    Object.entries(REGISTRY_KEY_BY_URL)
      .filter(([url]) => !blockedUrls?.has(url))
      .map(async ([url, key]) => {
      const config = await getPlaygroundConfigByUrl(url);
      return config ? ([key, config] as const) : null;
    }),
  );

  _registry = Object.fromEntries(
    pairs.filter((pair): pair is readonly [string, PlaygroundConfig] =>
      Boolean(pair),
    ),
  );

  return _registry;
}
