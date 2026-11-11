export type ModelNarrativePromise =
  | "fast-generalist"
  | "commercial-stills"
  | "prompt-ideation"
  | "typography-concepts"
  | "multi-ref-editing"
  | "precision-editing"
  | "cinematic-image"
  | "cinematic-video"
  | "social-video"
  | "camera-control"
  | "cleanup"
  | "cutout"
  | "upscale"
  | "avatar-video"
  | "face-swap"
  | "layered-edit"
  | "character-restyle";

export type ModelNarrativeStage =
  | "exploration"
  | "art-direction"
  | "asset-polish"
  | "motion-previs"
  | "delivery-prep"
  | "utility";

export type ModelNarrativeProof =
  | "speed"
  | "control"
  | "consistency"
  | "cinematic"
  | "typography"
  | "cleanup"
  | "resolution"
  | "character"
  | "camera";

export type ModelNarrativeCta =
  | "create"
  | "direct"
  | "polish"
  | "animate"
  | "clean";

export type ModelLandingNarrativeConfig = {
  promise: ModelNarrativePromise;
  stage: ModelNarrativeStage;
  proof: ModelNarrativeProof;
  cta: ModelNarrativeCta;
};

const MODEL_LANDING_NARRATIVE_CONFIG: Record<
  string,
  ModelLandingNarrativeConfig
> = {
  nanobana: {
    promise: "precision-editing",
    stage: "art-direction",
    proof: "consistency",
    cta: "polish",
  },
  "nanobanana-2": {
    promise: "multi-ref-editing",
    stage: "asset-polish",
    proof: "control",
    cta: "polish",
  },
  "wan-2-7": {
    promise: "cinematic-video",
    stage: "motion-previs",
    proof: "cinematic",
    cta: "animate",
  },
  "flux-2-klein": {
    promise: "commercial-stills",
    stage: "exploration",
    proof: "control",
    cta: "create",
  },
  "gpt-image-1": {
    promise: "prompt-ideation",
    stage: "exploration",
    proof: "speed",
    cta: "create",
  },
  "gpt-image-2": {
    promise: "prompt-ideation",
    stage: "exploration",
    proof: "speed",
    cta: "create",
  },
  "grok-imagine-image": {
    promise: "character-restyle",
    stage: "art-direction",
    proof: "character",
    cta: "polish",
  },
  "image-background-remover": {
    promise: "cutout",
    stage: "utility",
    proof: "cleanup",
    cta: "clean",
  },
  "image-eraser": {
    promise: "cleanup",
    stage: "utility",
    proof: "cleanup",
    cta: "clean",
  },
  "image-upscaler": {
    promise: "upscale",
    stage: "delivery-prep",
    proof: "resolution",
    cta: "polish",
  },
  "kling-2-6-pro": {
    promise: "camera-control",
    stage: "motion-previs",
    proof: "camera",
    cta: "direct",
  },
  "longcat-avatar": {
    promise: "avatar-video",
    stage: "motion-previs",
    proof: "character",
    cta: "animate",
  },
  "ltx-2-fast": {
    promise: "social-video",
    stage: "motion-previs",
    proof: "speed",
    cta: "animate",
  },
  midjourney: {
    promise: "commercial-stills",
    stage: "exploration",
    proof: "cinematic",
    cta: "create",
  },
  "nano-banana-pro": {
    promise: "typography-concepts",
    stage: "exploration",
    proof: "typography",
    cta: "create",
  },
  "nano-banana-pro-edit-ultra": {
    promise: "multi-ref-editing",
    stage: "asset-polish",
    proof: "control",
    cta: "polish",
  },
  "pixverse-5-6": {
    promise: "social-video",
    stage: "motion-previs",
    proof: "cinematic",
    cta: "animate",
  },
  "qwen-image-202512": {
    promise: "typography-concepts",
    stage: "exploration",
    proof: "typography",
    cta: "create",
  },
  "qwen-image-layered": {
    promise: "layered-edit",
    stage: "asset-polish",
    proof: "control",
    cta: "polish",
  },
  "qwen-image-max": {
    promise: "precision-editing",
    stage: "asset-polish",
    proof: "control",
    cta: "polish",
  },
  "seedance-1-5-pro": {
    promise: "cinematic-video",
    stage: "motion-previs",
    proof: "character",
    cta: "animate",
  },
  "seedance-2-0": {
    promise: "cinematic-video",
    stage: "motion-previs",
    proof: "cinematic",
    cta: "animate",
  },
  "seedream-4-5": {
    promise: "commercial-stills",
    stage: "art-direction",
    proof: "cinematic",
    cta: "create",
  },
  "seedream-5-0-lite": {
    promise: "fast-generalist",
    stage: "exploration",
    proof: "speed",
    cta: "create",
  },
  soul: {
    promise: "character-restyle",
    stage: "art-direction",
    proof: "character",
    cta: "polish",
  },
  "veo-3-1": {
    promise: "cinematic-video",
    stage: "motion-previs",
    proof: "cinematic",
    cta: "animate",
  },
  "video-face-swap": {
    promise: "face-swap",
    stage: "utility",
    proof: "character",
    cta: "clean",
  },
  "vidu-q3": {
    promise: "social-video",
    stage: "motion-previs",
    proof: "speed",
    cta: "animate",
  },
  "wan-2-6": {
    promise: "cinematic-video",
    stage: "motion-previs",
    proof: "speed",
    cta: "animate",
  },
  "wan-2-7-image-edit-pro": {
    promise: "precision-editing",
    stage: "asset-polish",
    proof: "control",
    cta: "polish",
  },
  "yoga-v1": {
    promise: "fast-generalist",
    stage: "exploration",
    proof: "speed",
    cta: "create",
  },
  "z-image-turbo": {
    promise: "fast-generalist",
    stage: "exploration",
    proof: "speed",
    cta: "create",
  },
};

const DEFAULT_MODEL_LANDING_NARRATIVE_CONFIG: ModelLandingNarrativeConfig = {
  promise: "fast-generalist",
  stage: "exploration",
  proof: "speed",
  cta: "create",
};

export function getModelLandingNarrativeConfig(slug: string) {
  return (
    MODEL_LANDING_NARRATIVE_CONFIG[slug] ||
    DEFAULT_MODEL_LANDING_NARRATIVE_CONFIG
  );
}
