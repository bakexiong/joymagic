export type WavespeedModelMapping = {
  currentModelUrl: string;
  currentModelLabel: string;
  mediaType: "image" | "video";
  wavespeedExamplePath?: string;
  wavespeedModelId?: string;
  wavespeedExampleCandidates?: string[];
};

export const WAVESPEED_MODEL_MAPPINGS: WavespeedModelMapping[] = [
  {
    currentModelUrl: "/text-to-image/nano-banana-2",
    currentModelLabel: "Nano Banana 2",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana-2/text-to-image",
    wavespeedModelId: "google/nano-banana-2/text-to-image",
    wavespeedExampleCandidates: [
      "google/nano-banana-2/text-to-image",
      "google/nano-banana-2/text-to-image-fast",
    ],
  },
  {
    currentModelUrl: "/text-to-image/nano-banana-pro",
    currentModelLabel: "Nano Banana Pro",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana-pro/text-to-image",
    wavespeedModelId: "google/nano-banana-pro/text-to-image",
    wavespeedExampleCandidates: [
      "google/nano-banana-pro/text-to-image",
      "google/nano-banana-pro/text-to-image-ultra",
      "google/nano-banana-pro/text-to-image-multi",
    ],
  },
  {
    currentModelUrl: "/text-to-image/nano-banana",
    currentModelLabel: "Nano Banana",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana/text-to-image",
    wavespeedModelId: "google/nano-banana/text-to-image",
    wavespeedExampleCandidates: ["google/nano-banana/text-to-image"],
  },
  {
    currentModelUrl: "/text-to-image/seedream-5-0-lite",
    currentModelLabel: "Seedream 5.0 Lite",
    mediaType: "image",
    wavespeedExamplePath: "bytedance/seedream-v5.0-lite",
    wavespeedModelId: "bytedance/seedream-v5.0-lite",
  },
  {
    currentModelUrl: "/text-to-image/seedream-4-5",
    currentModelLabel: "Seedream V4.5",
    mediaType: "image",
    wavespeedExamplePath: "bytedance/seedream-v4.5",
    wavespeedModelId: "bytedance/seedream-v4.5",
    wavespeedExampleCandidates: [
      "bytedance/seedream-v4.5",
      "bytedance/seedream-v4.5/sequential",
    ],
  },
  {
    currentModelUrl: "/text-to-image/gpt-image-1",
    currentModelLabel: "GPT Image 1",
    mediaType: "image",
    wavespeedExamplePath: "openai/gpt-image-1/text-to-image",
    wavespeedModelId: "openai/gpt-image-1/text-to-image",
    wavespeedExampleCandidates: [
      "openai/gpt-image-1/text-to-image",
      "openai/gpt-image-1.5/text-to-image",
      "openai/gpt-image-1-mini/text-to-image",
    ],
  },
  {
    currentModelUrl: "/text-to-image/gpt-image-2",
    currentModelLabel: "GPT Image 2",
    mediaType: "image",
    wavespeedExamplePath: "openai/gpt-image-1.5/text-to-image",
    wavespeedModelId: "openai/gpt-image-1.5/text-to-image",
    wavespeedExampleCandidates: [
      "openai/gpt-image-1.5/text-to-image",
      "openai/gpt-image-1/text-to-image",
      "openai/gpt-image-1-mini/text-to-image",
    ],
  },
  {
    currentModelUrl: "/text-to-image/qwen-image-202512",
    currentModelLabel: "Qwen Image 202512",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/qwen-image/text-to-image-2512",
    wavespeedModelId: "wavespeed-ai/qwen-image/text-to-image-2512",
    wavespeedExampleCandidates: [
      "wavespeed-ai/qwen-image/text-to-image-2512",
      "wavespeed-ai/qwen-image-2.0/text-to-image",
      "wavespeed-ai/qwen-image/text-to-image",
    ],
  },
  {
    currentModelUrl: "/text-to-image/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "image",
    wavespeedExamplePath: "alibaba/wan-2.7/text-to-image",
    wavespeedModelId: "alibaba/wan-2.7/text-to-image",
    wavespeedExampleCandidates: [
      "alibaba/wan-2.7/text-to-image",
      "alibaba/wan-2.7/text-to-image-pro",
    ],
  },
  {
    currentModelUrl: "/text-to-image/flux-2-klein",
    currentModelLabel: "Flux 2 Klein",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/flux-2-klein-9b/text-to-image",
    wavespeedModelId: "wavespeed-ai/flux-2-klein-9b/text-to-image",
    wavespeedExampleCandidates: [
      "wavespeed-ai/flux-2-klein-9b/text-to-image",
      "wavespeed-ai/flux-2-klein-4b/text-to-image",
    ],
  },
  {
    currentModelUrl: "/text-to-image/z-image-turbo",
    currentModelLabel: "Z Image Turbo",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/z-image/turbo",
    wavespeedModelId: "wavespeed-ai/z-image/turbo",
    wavespeedExampleCandidates: ["wavespeed-ai/z-image/turbo"],
  },
  {
    currentModelUrl: "/text-to-image/yoga-v1",
    currentModelLabel: "Yoga V1",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/z-image/turbo",
    wavespeedModelId: "wavespeed-ai/z-image/turbo",
    wavespeedExampleCandidates: ["wavespeed-ai/z-image/turbo"],
  },
  {
    currentModelUrl: "/image-to-image/nano-banana-2",
    currentModelLabel: "Nano Banana 2",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana-2/edit",
    wavespeedModelId: "google/nano-banana-2/edit",
    wavespeedExampleCandidates: [
      "google/nano-banana-2/edit",
      "google/nano-banana-2/edit-fast",
    ],
  },
  {
    currentModelUrl: "/image-to-image/nano-banana",
    currentModelLabel: "Nano Banana",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana/edit",
    wavespeedModelId: "google/nano-banana/edit",
    wavespeedExampleCandidates: ["google/nano-banana/edit"],
  },
  {
    currentModelUrl: "/image-to-image/seedream-5-0-lite",
    currentModelLabel: "Seedream 5.0 Lite",
    mediaType: "image",
    wavespeedExamplePath: "bytedance/seedream-v5.0-lite/edit",
    wavespeedModelId: "bytedance/seedream-v5.0-lite/edit",
    wavespeedExampleCandidates: [
      "bytedance/seedream-v5.0-lite/edit",
      "bytedance/seedream-v5.0-lite/edit-sequential",
    ],
  },
  {
    currentModelUrl: "/image-to-image/flux-2-klein",
    currentModelLabel: "Flux 2 Klein",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/flux-2-klein-9b/edit",
    wavespeedModelId: "wavespeed-ai/flux-2-klein-9b/edit",
    wavespeedExampleCandidates: [
      "wavespeed-ai/flux-2-klein-9b/edit",
      "wavespeed-ai/flux-2-klein-4b/edit",
    ],
  },
  {
    currentModelUrl: "/text-to-image/midjourney",
    currentModelLabel: "Midjourney",
    mediaType: "image",
    wavespeedExamplePath: "midjourney/text-to-image",
    wavespeedModelId: "midjourney/text-to-image",
    wavespeedExampleCandidates: ["midjourney/text-to-image"],
  },
  {
    currentModelUrl: "/image-to-image/soul",
    currentModelLabel: "Soul",
    mediaType: "image",
    wavespeedExamplePath: "higgsfield/soul/image-to-image",
    wavespeedModelId: "higgsfield/soul/image-to-image",
    wavespeedExampleCandidates: ["higgsfield/soul/image-to-image"],
  },
  {
    currentModelUrl: "/image-to-image/z-image-turbo",
    currentModelLabel: "Z Image Turbo",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/z-image-turbo/image-to-image",
    wavespeedModelId: "wavespeed-ai/z-image-turbo/image-to-image",
    wavespeedExampleCandidates: ["wavespeed-ai/z-image-turbo/image-to-image"],
  },
  {
    currentModelUrl: "/image-to-image/grok-imagine-image",
    currentModelLabel: "Grok Imagine",
    mediaType: "image",
    wavespeedExamplePath: "x-ai/grok-imagine-image/edit",
    wavespeedModelId: "x-ai/grok-imagine-image/edit",
    wavespeedExampleCandidates: ["x-ai/grok-imagine-image/edit"],
  },
  {
    currentModelUrl: "/image-to-image/qwen-image-max",
    currentModelLabel: "Qwen Image Max",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/qwen-image-max/edit",
    wavespeedModelId: "wavespeed-ai/qwen-image-max/edit",
    wavespeedExampleCandidates: ["wavespeed-ai/qwen-image-max/edit"],
  },
  {
    currentModelUrl: "/image-to-image/gpt-image-2",
    currentModelLabel: "GPT Image 2",
    mediaType: "image",
    wavespeedExamplePath: "openai/gpt-image-1.5/edit",
    wavespeedModelId: "openai/gpt-image-1.5/edit",
    wavespeedExampleCandidates: [
      "openai/gpt-image-1.5/edit",
      "openai/gpt-image-1-mini/edit",
    ],
  },
  {
    currentModelUrl: "/image-to-image/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "image",
    wavespeedExamplePath: "alibaba/wan-2.7/image-edit",
    wavespeedModelId: "alibaba/wan-2.7/image-edit",
    wavespeedExampleCandidates: [
      "alibaba/wan-2.7/image-edit",
      "alibaba/wan-2.7/image-edit-pro",
    ],
  },
  {
    currentModelUrl: "/image-to-image/wan-2-7-image-edit-pro",
    currentModelLabel: "Wan 2.7 Image Edit Pro",
    mediaType: "image",
    wavespeedExamplePath: "alibaba/wan-2.7/image-edit-pro",
    wavespeedModelId: "alibaba/wan-2.7/image-edit-pro",
    wavespeedExampleCandidates: [
      "alibaba/wan-2.7/image-edit-pro",
      "alibaba/wan-2.7/image-edit",
    ],
  },
  {
    currentModelUrl: "/image-to-image/nano-banana-pro-edit-ultra",
    currentModelLabel: "Nano Banana Pro Edit Ultra",
    mediaType: "image",
    wavespeedExamplePath: "google/nano-banana-pro/edit-ultra",
    wavespeedModelId: "google/nano-banana-pro/edit-ultra",
    wavespeedExampleCandidates: [
      "google/nano-banana-pro/edit-ultra",
      "google/nano-banana-pro/edit",
    ],
  },
  {
    currentModelUrl: "/qwen-image-layered",
    currentModelLabel: "Qwen Image Layered",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/qwen-image/layered",
    wavespeedModelId: "wavespeed-ai/qwen-image/layered",
    wavespeedExampleCandidates: ["wavespeed-ai/qwen-image/layered"],
  },
  {
    currentModelUrl: "/image-eraser",
    currentModelLabel: "Image Eraser",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/image-eraser",
    wavespeedModelId: "wavespeed-ai/image-eraser",
    wavespeedExampleCandidates: ["wavespeed-ai/image-eraser", "bria/eraser"],
  },
  {
    currentModelUrl: "/image-background-remover",
    currentModelLabel: "Background Remover",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/image-background-remover",
    wavespeedModelId: "wavespeed-ai/image-background-remover",
    wavespeedExampleCandidates: ["wavespeed-ai/image-background-remover"],
  },
  {
    currentModelUrl: "/image-upscaler",
    currentModelLabel: "Image Upscaler",
    mediaType: "image",
    wavespeedExamplePath: "wavespeed-ai/image-upscaler",
    wavespeedModelId: "wavespeed-ai/image-upscaler",
    wavespeedExampleCandidates: [
      "wavespeed-ai/image-upscaler",
      "wavespeed-ai/ultimate-image-upscaler",
    ],
  },
  {
    currentModelUrl: "/text-to-video/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/wan-2.7/text-to-video",
    wavespeedModelId: "alibaba/wan-2.7/text-to-video",
    wavespeedExampleCandidates: ["alibaba/wan-2.7/text-to-video"],
  },
  {
    currentModelUrl: "/text-to-video/wan-2-6",
    currentModelLabel: "Wan 2.6",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/wan-2.6/text-to-video",
    wavespeedModelId: "alibaba/wan-2.6/text-to-video",
    wavespeedExampleCandidates: ["alibaba/wan-2.6/text-to-video"],
  },
  {
    currentModelUrl: "/text-to-video/veo-3-1",
    currentModelLabel: "Veo 3.1",
    mediaType: "video",
    wavespeedExamplePath: "google/veo3.1/text-to-video",
    wavespeedModelId: "google/veo3.1/text-to-video",
    wavespeedExampleCandidates: [
      "google/veo3.1/text-to-video",
      "google/veo3.1-fast/text-to-video",
    ],
  },
  {
    currentModelUrl: "/text-to-video/seedance-1-5-pro",
    currentModelLabel: "Seedance 1.5 Pro",
    mediaType: "video",
    wavespeedExamplePath: "bytedance/seedance-v1.5-pro/text-to-video",
    wavespeedModelId: "bytedance/seedance-v1.5-pro/text-to-video",
    wavespeedExampleCandidates: [
      "bytedance/seedance-v1.5-pro/text-to-video",
      "bytedance/seedance-v1.5-pro/text-to-video-fast",
    ],
  },
  {
    currentModelUrl: "/text-to-video/seedance-2-0",
    currentModelLabel: "Seedance 2.0",
    mediaType: "video",
    wavespeedExamplePath: "bytedance/seedance-2.0/text-to-video",
    wavespeedModelId: "bytedance/seedance-2.0/text-to-video",
    wavespeedExampleCandidates: ["bytedance/seedance-2.0/text-to-video"],
  },
  {
    currentModelUrl: "/text-to-video/pixverse-5-6",
    currentModelLabel: "PixVerse v5.6",
    mediaType: "video",
    wavespeedExamplePath: "pixverse/pixverse-v5.6/text-to-video",
    wavespeedModelId: "pixverse/pixverse-v5.6/text-to-video",
    wavespeedExampleCandidates: ["pixverse/pixverse-v5.6/text-to-video"],
  },
  {
    currentModelUrl: "/text-to-video/ltx2-fast",
    currentModelLabel: "LTX-2 Fast",
    mediaType: "video",
    wavespeedExamplePath: "lightricks/ltx-2-fast/text-to-video",
    wavespeedModelId: "lightricks/ltx-2-fast/text-to-video",
    wavespeedExampleCandidates: ["lightricks/ltx-2-fast/text-to-video"],
  },
  {
    currentModelUrl: "/text-to-video/happyhorse-1-0",
    currentModelLabel: "HappyHorse 1.0",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/happyhorse-1.0/text-to-video",
    wavespeedModelId: "alibaba/happyhorse-1.0/text-to-video",
    wavespeedExampleCandidates: ["alibaba/happyhorse-1.0/text-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/wan-2.7/image-to-video",
    wavespeedModelId: "alibaba/wan-2.7/image-to-video",
    wavespeedExampleCandidates: ["alibaba/wan-2.7/image-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/vidu-q3",
    currentModelLabel: "Vidu Q3",
    mediaType: "video",
    wavespeedExamplePath: "vidu/q3/image-to-video",
    wavespeedModelId: "vidu/q3/image-to-video",
    wavespeedExampleCandidates: [
      "vidu/q3/image-to-video",
      "vidu/q3/image-to-video-pro",
    ],
  },
  {
    currentModelUrl: "/image-to-video/veo-3-1",
    currentModelLabel: "Veo 3.1",
    mediaType: "video",
    wavespeedExamplePath: "google/veo3.1/image-to-video",
    wavespeedModelId: "google/veo3.1/image-to-video",
    wavespeedExampleCandidates: [
      "google/veo3.1/image-to-video",
      "google/veo3.1-fast/image-to-video",
    ],
  },
  {
    currentModelUrl: "/image-to-video/seedance-1-5-pro",
    currentModelLabel: "Seedance 1.5 Pro",
    mediaType: "video",
    wavespeedExamplePath: "bytedance/seedance-v1.5-pro/image-to-video",
    wavespeedModelId: "bytedance/seedance-v1.5-pro/image-to-video",
    wavespeedExampleCandidates: [
      "bytedance/seedance-v1.5-pro/image-to-video",
      "bytedance/seedance-v1.5-pro/image-to-video-fast",
    ],
  },
  {
    currentModelUrl: "/image-to-video/seedance-2-0",
    currentModelLabel: "Seedance 2.0",
    mediaType: "video",
    wavespeedExamplePath: "bytedance/seedance-2.0/image-to-video",
    wavespeedModelId: "bytedance/seedance-2.0/image-to-video",
    wavespeedExampleCandidates: ["bytedance/seedance-2.0/image-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/pixverse-5-6",
    currentModelLabel: "PixVerse v5.6",
    mediaType: "video",
    wavespeedExamplePath: "pixverse/pixverse-v5.6/image-to-video",
    wavespeedModelId: "pixverse/pixverse-v5.6/image-to-video",
    wavespeedExampleCandidates: ["pixverse/pixverse-v5.6/image-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/ltx2-fast",
    currentModelLabel: "LTX-2 Fast",
    mediaType: "video",
    wavespeedExamplePath: "lightricks/ltx-2-fast/image-to-video",
    wavespeedModelId: "lightricks/ltx-2-fast/image-to-video",
    wavespeedExampleCandidates: ["lightricks/ltx-2-fast/image-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/happyhorse-1-0",
    currentModelLabel: "HappyHorse 1.0",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/happyhorse-1.0/image-to-video",
    wavespeedModelId: "alibaba/happyhorse-1.0/image-to-video",
    wavespeedExampleCandidates: ["alibaba/happyhorse-1.0/image-to-video"],
  },
  {
    currentModelUrl: "/image-to-video/midjourney",
    currentModelLabel: "Midjourney",
    mediaType: "video",
    wavespeedExamplePath: "midjourney/image-to-video",
    wavespeedModelId: "midjourney/image-to-video",
    wavespeedExampleCandidates: ["midjourney/image-to-video"],
  },
  {
    currentModelUrl: "/reference-to-video/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/wan-2.7/reference-to-video",
    wavespeedModelId: "alibaba/wan-2.7/reference-to-video",
    wavespeedExampleCandidates: ["alibaba/wan-2.7/reference-to-video"],
  },
  {
    currentModelUrl: "/reference-to-video/kling-video-o3-4k",
    currentModelLabel: "Kling Video O3 4K",
    mediaType: "video",
    wavespeedExamplePath: "kwaivgi/kling-video-o3-4k/reference-to-video",
    wavespeedModelId: "kwaivgi/kling-video-o3-4k/reference-to-video",
    wavespeedExampleCandidates: [
      "kwaivgi/kling-video-o3-4k/reference-to-video",
    ],
  },
  {
    currentModelUrl: "/reference-to-video/kling-video-o1-std",
    currentModelLabel: "Kling Video O1 Std",
    mediaType: "video",
    wavespeedExamplePath: "kwaivgi/kling-video-o1-std/reference-to-video",
    wavespeedModelId: "kwaivgi/kling-video-o1-std/reference-to-video",
    wavespeedExampleCandidates: [
      "kwaivgi/kling-video-o1-std/reference-to-video",
    ],
  },
  {
    currentModelUrl: "/reference-to-video/kling-video-o3-pro",
    currentModelLabel: "Kling Video O3 Pro",
    mediaType: "video",
    wavespeedExamplePath: "kwaivgi/kling-video-o3-pro/reference-to-video",
    wavespeedModelId: "kwaivgi/kling-video-o3-pro/reference-to-video",
    wavespeedExampleCandidates: [
      "kwaivgi/kling-video-o3-pro/reference-to-video",
    ],
  },
  {
    currentModelUrl: "/reference-to-video/kling-video-o3-std",
    currentModelLabel: "Kling Video O3 Std",
    mediaType: "video",
    wavespeedExamplePath: "kwaivgi/kling-video-o3-std/reference-to-video",
    wavespeedModelId: "kwaivgi/kling-video-o3-std/reference-to-video",
    wavespeedExampleCandidates: [
      "kwaivgi/kling-video-o3-std/reference-to-video",
    ],
  },
  {
    currentModelUrl: "/reference-to-video/grok-imagine-video",
    currentModelLabel: "Grok Imagine Video",
    mediaType: "video",
    wavespeedExamplePath: "x-ai/grok-imagine-video/reference-to-video",
    wavespeedModelId: "x-ai/grok-imagine-video/reference-to-video",
    wavespeedExampleCandidates: ["x-ai/grok-imagine-video/reference-to-video"],
  },
  {
    currentModelUrl: "/video-extend/wan-2-7",
    currentModelLabel: "Wan 2.7",
    mediaType: "video",
    wavespeedExamplePath: "alibaba/wan-2.7/video-extend",
    wavespeedModelId: "alibaba/wan-2.7/video-extend",
    wavespeedExampleCandidates: ["alibaba/wan-2.7/video-extend"],
  },
  {
    currentModelUrl: "/motion-control/kling-2-6-pro",
    currentModelLabel: "Kling 2.6 Pro",
    mediaType: "video",
    wavespeedExamplePath: "kwaivgi/kling-v2.6-pro/motion-control",
    wavespeedModelId: "kwaivgi/kling-v2.6-pro/motion-control",
    wavespeedExampleCandidates: [
      "kwaivgi/kling-v2.6-pro/motion-control",
      "kwaivgi/kling-v2.6-std/motion-control",
    ],
  },
  {
    currentModelUrl: "/longcat-avatar",
    currentModelLabel: "Longcat Avatar",
    mediaType: "video",
    wavespeedExamplePath: "wavespeed-ai/longcat-avatar",
    wavespeedModelId: "wavespeed-ai/longcat-avatar",
    wavespeedExampleCandidates: ["wavespeed-ai/longcat-avatar"],
  },
  {
    currentModelUrl: "/video-face-swap",
    currentModelLabel: "Video Face Swap",
    mediaType: "video",
    wavespeedExamplePath: "wavespeed-ai/video-face-swap",
    wavespeedModelId: "wavespeed-ai/video-face-swap",
    wavespeedExampleCandidates: [
      "wavespeed-ai/video-face-swap",
      "akool/video-face-swap",
    ],
  },
];

export const WAVESPEED_MODEL_MAPPING_BY_CURRENT_URL = Object.fromEntries(
  WAVESPEED_MODEL_MAPPINGS.map((item) => [item.currentModelUrl, item]),
) as Record<string, WavespeedModelMapping>;

export const WAVESPEED_MODEL_MAPPING_BY_EXAMPLE_PATH = Object.fromEntries(
  WAVESPEED_MODEL_MAPPINGS.filter((item) => item.wavespeedExamplePath).map(
    (item) => [item.wavespeedExamplePath!, item],
  ),
) as Record<string, WavespeedModelMapping>;

export function getWavespeedModelMappingByCurrentUrl(currentModelUrl: string) {
  return WAVESPEED_MODEL_MAPPING_BY_CURRENT_URL[currentModelUrl];
}

export function getWavespeedExampleCandidatesByCurrentUrl(
  currentModelUrl: string,
) {
  const mapping = getWavespeedModelMappingByCurrentUrl(currentModelUrl);

  if (!mapping) {
    return [];
  }

  return Array.from(
    new Set(
      [
        mapping.wavespeedExamplePath,
        ...(mapping.wavespeedExampleCandidates || []),
        mapping.wavespeedModelId,
      ].filter(Boolean) as string[],
    ),
  );
}
