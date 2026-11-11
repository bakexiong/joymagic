import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import {
  DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
  DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
} from "@/shared/lib/video-model-defaults";
import {
  DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
  DEFAULT_TEXT_TO_IMAGE_MODEL_URL,
} from "@/shared/services/canvas-agent/canvas-agent-scene-router";

type TemplateMediaType = "image" | "video";
export type WorkbenchTemplateSamplePolicy =
  | "default"
  | "latin-only"
  | "ad-safe";

export type WorkbenchTemplateItem = {
  id: string;
  title?: string;
  prompt: string;
  mediaType: TemplateMediaType;
  sceneId?: string;
  sceneLabel?: string;
  modelUrl?: string;
  modelLabel?: string;
  aspectRatio?: string;
  previewClipUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  sourcePreviewUrl?: string;
  resultPreviewUrl?: string;
  resultPreviewUrls?: string[];
  referencePreviewUrls: string[];
  params: Record<string, any>;
};

function unwrapWsrvUrl(value: string) {
  if (!value.startsWith("https://wsrv.nl/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const originalUrl = parsed.searchParams.get("url");
    return originalUrl || value;
  } catch {
    return value;
  }
}

export function restoreOriginalMediaUrls<T>(value: T): T {
  if (typeof value === "string") {
    return unwrapWsrvUrl(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => restoreOriginalMediaUrls(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        restoreOriginalMediaUrls(item),
      ]),
    ) as T;
  }

  return value;
}

type WorkbenchTemplateSampleRecord = {
  title?: string;
  prompt?: string;
  params?: Record<string, any>;
  previewClipUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  generatedUrl?: string;
  generatedUrls?: string[];
};

type WorkbenchTemplateSampleMap = Record<
  string,
  WorkbenchTemplateSampleRecord[]
>;

export type { WorkbenchTemplateSampleRecord };

const CJK_TEXT_PATTERN =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const TEXT_HEAVY_PROMPT_PATTERN =
  /\b(text|sign|logo|slide|thumbnail|webinar|flowchart|livestream|screenshot|caption|subtitle|headline|typography|copy|word|words|letter|letters|title|name|names)\b/i;
const LANGUAGE_OR_PLATFORM_PATTERN =
  /\b(douyin|xiaohongshu|japanese|chinese|kanji|hiragana|katakana|korean)\b/i;
const BRAND_OR_IP_PATTERN =
  /\b(genshin|minecraft|raiden shogun|saint seiya|momotaro|liu yifei)\b/i;

let workbenchTemplateSamplesCache: WorkbenchTemplateSampleMap | null = null;
let workbenchTemplateSamplesPromise: Promise<WorkbenchTemplateSampleMap> | null =
  null;
const clientModelSamplesCache = new Map<
  string,
  WorkbenchTemplateSampleRecord[]
>();
const clientModelSamplesPromiseCache = new Map<
  string,
  Promise<WorkbenchTemplateSampleRecord[]>
>();
const clientSceneSamplesCache = new Map<
  string,
  WorkbenchTemplateSampleRecord[]
>();
const clientSceneSamplesPromiseCache = new Map<
  string,
  Promise<WorkbenchTemplateSampleRecord[]>
>();
const sceneTemplateSampleImporters: Record<
  string,
  () => Promise<{ default: WorkbenchTemplateSampleRecord[] }>
> = {
  "/text-to-image": () =>
    import("@/shared/lib/workbench-template-samples/text-to-image__gpt-image-2.json"),
  "/image-to-image": () =>
    import("@/shared/lib/workbench-template-samples/image-to-image.json"),
  "/text-to-video": () =>
    import("@/shared/lib/workbench-template-samples/text-to-video__meigen.json"),
  "/image-to-video": () =>
    import("@/shared/lib/workbench-template-samples/image-to-video__zencreator-library.json"),
  "/image-upscaler": () =>
    import("@/shared/lib/workbench-template-samples/image-upscaler.json"),
  "/image-background-remover": () =>
    import("@/shared/lib/workbench-template-samples/image-background-remover.json"),
  "/image-eraser": () =>
    import("@/shared/lib/workbench-template-samples/image-eraser.json"),
  "/longcat-avatar": () =>
    import("@/shared/lib/workbench-template-samples/longcat-avatar.json"),
  "/qwen-image-layered": () =>
    import("@/shared/lib/workbench-template-samples/qwen-image-layered.json"),
};

async function loadWorkbenchTemplateSamples() {
  if (workbenchTemplateSamplesCache) {
    return workbenchTemplateSamplesCache;
  }

  if (!workbenchTemplateSamplesPromise) {
    workbenchTemplateSamplesPromise =
      import("@/shared/lib/workbench-template-samples.json").then((module) => {
        workbenchTemplateSamplesCache =
          module.default as WorkbenchTemplateSampleMap;
        return workbenchTemplateSamplesCache;
      });
  }

  return workbenchTemplateSamplesPromise;
}

export async function getWorkbenchTemplateSamplesForModel(modelUrl?: string) {
  if (!modelUrl) {
    return [];
  }

  if (typeof window !== "undefined") {
    const cached = clientModelSamplesCache.get(modelUrl);
    if (cached) {
      return cached;
    }

    const pending = clientModelSamplesPromiseCache.get(modelUrl);
    if (pending) {
      return pending;
    }

    const request = fetch(
      `/api/workbench/template-samples?modelUrl=${encodeURIComponent(modelUrl)}`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load template samples for ${modelUrl}`);
        }

        const payload = (await response.json()) as {
          items?: WorkbenchTemplateSampleRecord[];
        };
        const items = Array.isArray(payload.items) ? payload.items : [];
        clientModelSamplesCache.set(modelUrl, items);
        return items;
      })
      .finally(() => {
        clientModelSamplesPromiseCache.delete(modelUrl);
      });

    clientModelSamplesPromiseCache.set(modelUrl, request);
    return request;
  }

  const sampleMap = await loadWorkbenchTemplateSamples();
  return Array.isArray(sampleMap[modelUrl]) ? sampleMap[modelUrl] : [];
}

export function getDefaultTemplateSourceModelUrlForScene(scenePath?: string) {
  const normalizedScenePath = `${scenePath || ""}`
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!normalizedScenePath) {
    return "";
  }

  if (normalizedScenePath === "text-to-image") {
    return DEFAULT_TEXT_TO_IMAGE_MODEL_URL;
  }

  if (normalizedScenePath === "image-to-image") {
    return DEFAULT_IMAGE_TO_IMAGE_MODEL_URL;
  }

  if (normalizedScenePath === "text-to-video") {
    return DEFAULT_TEXT_TO_VIDEO_MODEL_URL;
  }

  if (normalizedScenePath === "image-to-video") {
    return DEFAULT_IMAGE_TO_VIDEO_MODEL_URL;
  }

  return `/${normalizedScenePath}`;
}

export async function getWorkbenchTemplateSamplesForScene(scenePath?: string) {
  const normalizedScenePath = `/${`${scenePath || ""}`
    .trim()
    .replace(/^\/+|\/+$/g, "")}`;

  if (normalizedScenePath === "/") {
    return [];
  }

  const importer = sceneTemplateSampleImporters[normalizedScenePath];
  if (!importer) {
    return [];
  }

  if (typeof window !== "undefined") {
    const cached = clientSceneSamplesCache.get(normalizedScenePath);
    if (cached) {
      return cached;
    }

    const pending = clientSceneSamplesPromiseCache.get(normalizedScenePath);
    if (pending) {
      return pending;
    }

    const request = importer()
      .then((module) => {
        const items = Array.isArray(module.default) ? module.default : [];
        clientSceneSamplesCache.set(normalizedScenePath, items);
        return items;
      })
      .finally(() => {
        clientSceneSamplesPromiseCache.delete(normalizedScenePath);
      });

    clientSceneSamplesPromiseCache.set(normalizedScenePath, request);
    return request;
  }

  const module = await importer();
  return Array.isArray(module.default) ? module.default : [];
}

export function containsCjkText(value?: string | null) {
  if (!value) {
    return false;
  }

  return CJK_TEXT_PATTERN.test(value);
}

function containsAdLandingRiskPrompt(value?: string | null) {
  if (!value) {
    return false;
  }

  return (
    TEXT_HEAVY_PROMPT_PATTERN.test(value) ||
    LANGUAGE_OR_PLATFORM_PATTERN.test(value) ||
    BRAND_OR_IP_PATTERN.test(value)
  );
}

export function filterWorkbenchTemplateSamplesByPolicy<
  T extends { prompt?: string | null },
>(samples: T[], policy: WorkbenchTemplateSamplePolicy = "default") {
  switch (policy) {
    case "latin-only":
      return samples.filter((sample) => !containsCjkText(sample.prompt));
    case "ad-safe":
      return samples.filter(
        (sample) =>
          !containsCjkText(sample.prompt) &&
          !containsAdLandingRiskPrompt(sample.prompt),
      );
    default:
      return samples;
  }
}

function extractAspectRatio(params?: Record<string, any>) {
  if (!params || typeof params !== "object") {
    return undefined;
  }

  if (typeof params.aspectRatio === "string" && params.aspectRatio) {
    return params.aspectRatio;
  }

  const size = typeof params.size === "string" ? params.size : "";
  if (!size.includes("*")) {
    return undefined;
  }

  const [rawWidth, rawHeight] = size.split("*");
  const width = Number(rawWidth);
  const height = Number(rawHeight);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return undefined;
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);

  return `${width / divisor}:${height / divisor}`;
}

function getSamplePreview(
  record: WorkbenchTemplateSampleRecord,
  mediaType: TemplateMediaType,
) {
  if (mediaType === "video") {
    return record.previewClipUrl || record.previewUrl || record.thumbnailUrl;
  }

  if (typeof record.generatedUrl === "string" && record.generatedUrl) {
    return record.generatedUrl;
  }

  if (Array.isArray(record.generatedUrls) && record.generatedUrls[0]) {
    return record.generatedUrls[0];
  }

  return record.previewUrl || record.thumbnailUrl;
}

function getSampleSourcePreview(
  record: WorkbenchTemplateSampleRecord,
  mediaType: TemplateMediaType,
) {
  const referencePreviewUrls = extractReferencePreviewUrls(record.params);
  if (referencePreviewUrls[0]) {
    return referencePreviewUrls[0];
  }

  if (mediaType === "video") {
    return record.previewUrl || record.thumbnailUrl;
  }

  const generatedPreview = getSamplePreview(record, mediaType);
  const candidateSourcePreview = record.previewUrl || record.thumbnailUrl;

  if (
    candidateSourcePreview &&
    unwrapWsrvUrl(candidateSourcePreview) !==
      unwrapWsrvUrl(generatedPreview || "")
  ) {
    return candidateSourcePreview;
  }

  return undefined;
}

function collectUploadUrls(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (
        item &&
        typeof item === "object" &&
        typeof (item as { url?: unknown }).url === "string"
      ) {
        return (item as { url: string }).url;
      }

      return "";
    })
    .filter((url): url is string => Boolean(url));
}

function extractReferencePreviewUrls(params?: Record<string, any>) {
  if (!params || typeof params !== "object") {
    return [];
  }

  const candidates = [
    ...collectUploadUrls(params.referenceImages),
    ...collectUploadUrls(params.referenceImage),
    ...collectUploadUrls(params.firstFrameImage),
    ...collectUploadUrls(params.lastFrameImage),
    ...collectUploadUrls(params.referenceImagesExtra),
  ];

  return Array.from(new Set(candidates)).slice(0, 2);
}

export function getTemplateMediaType(
  scenarioType: PlaygroundConfig["scenarioType"],
): TemplateMediaType {
  return scenarioType === "text-to-video" || scenarioType === "image-to-video"
    ? "video"
    : "image";
}

export function getSceneTemplateMediaType(
  scenePath?: string,
): TemplateMediaType {
  const normalizedScenePath = `${scenePath || ""}`
    .trim()
    .replace(/^\/+|\/+$/g, "");

  return normalizedScenePath === "text-to-video" ||
    normalizedScenePath === "image-to-video"
    ? "video"
    : "image";
}

export function buildWorkbenchTemplateCatalogFromSamples({
  sceneId,
  sceneLabel,
  modelUrl,
  modelLabel,
  mediaType,
  fallbackModelName,
  samples,
}: {
  sceneId?: string;
  sceneLabel?: string;
  modelUrl?: string;
  modelLabel?: string;
  mediaType: TemplateMediaType;
  fallbackModelName?: string;
  samples: WorkbenchTemplateSampleRecord[];
}): WorkbenchTemplateItem[] {
  if (!modelUrl) {
    return [];
  }

  return samples
    .filter(
      (sample) => sample && sample.params && typeof sample.prompt === "string",
    )
    .map((sample, index) => {
      const resultPreviewUrl = getSamplePreview(sample, mediaType);
      const sourcePreviewUrl = getSampleSourcePreview(sample, mediaType);
      const previewUrl = resultPreviewUrl;
      const thumbnailUrl =
        mediaType === "video"
          ? sample.thumbnailUrl || sample.previewUrl || sample.previewClipUrl
          : sample.thumbnailUrl || previewUrl;

      return {
        id: `${modelUrl}-${index}`,
        title:
          typeof sample.title === "string" ? sample.title.trim() : undefined,
        prompt: String(sample.prompt || "").trim(),
        mediaType,
        sceneId,
        sceneLabel,
        modelUrl,
        modelLabel: modelLabel || fallbackModelName,
        aspectRatio: extractAspectRatio(sample.params),
        previewClipUrl: sample.previewClipUrl,
        previewUrl,
        thumbnailUrl,
        sourcePreviewUrl,
        resultPreviewUrl,
        referencePreviewUrls: extractReferencePreviewUrls(sample.params),
        params: { ...(sample.params || {}) },
      } satisfies WorkbenchTemplateItem;
    });
}

export async function buildWorkbenchTemplateCatalog({
  sceneId,
  sceneLabel,
  modelUrl,
  modelLabel,
  config,
}: {
  sceneId?: string;
  sceneLabel?: string;
  modelUrl?: string;
  modelLabel?: string;
  config?: PlaygroundConfig;
}): Promise<WorkbenchTemplateItem[]> {
  if (!config || !modelUrl) {
    return [];
  }

  const mediaType = getTemplateMediaType(config.scenarioType);
  const samples = await getWorkbenchTemplateSamplesForModel(modelUrl);

  return buildWorkbenchTemplateCatalogFromSamples({
    sceneId,
    sceneLabel,
    modelUrl,
    modelLabel,
    mediaType,
    fallbackModelName: config.model.name,
    samples,
  });
}

export async function buildWorkbenchSceneTemplateCatalog({
  sceneId,
  sceneLabel,
  scenePath,
  config,
}: {
  sceneId?: string;
  sceneLabel?: string;
  scenePath?: string;
  config?: PlaygroundConfig;
}): Promise<WorkbenchTemplateItem[]> {
  if (!scenePath) {
    return [];
  }

  const sourceModelUrl = getDefaultTemplateSourceModelUrlForScene(scenePath);
  if (!sourceModelUrl) {
    return [];
  }

  const mediaType = getSceneTemplateMediaType(scenePath);
  const samples = await getWorkbenchTemplateSamplesForScene(scenePath);

  return buildWorkbenchTemplateCatalogFromSamples({
    sceneId,
    sceneLabel,
    modelUrl: sourceModelUrl,
    modelLabel: config?.model.name,
    mediaType,
    fallbackModelName:
      config?.model.name || sourceModelUrl.split("/").pop() || "Template",
    samples,
  });
}
