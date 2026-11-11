import { envConfigs } from "@/config";

import {
  buildCanvasWorkflowGenerationContext,
  type CanvasWorkflowGenerationContext,
} from "./canvas-agent-generation-context";

export type CanvasAgentGenerationExecutionMode =
  | "server-submitted"
  | "client-deferred";

export type CanvasAgentGenerationSubmission = {
  workflowNodeId: string;
  executionMode: CanvasAgentGenerationExecutionMode;
  accepted: boolean;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowGenerationContext["subtype"];
  sceneId: string;
  modelUrl: string;
  requestId?: string;
  taskId?: string;
  scenario?: string;
  directUrl?: string;
  outputs?: string[];
  error?: string;
};

const CANVAS_AGENT_GENERATION_SUBMIT_TIMEOUT_MS = 12000;

function normalizeBaseUrl(baseUrl?: string) {
  const normalized = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (normalized) return normalized;
  return envConfigs.app_url;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function extractResponsePayload(payload: any) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  return payload;
}

function extractDirectUrl(data: any) {
  const directUrl =
    data?.output ||
    data?.imageUrl ||
    data?.videoUrl ||
    data?.url ||
    data?.image_url ||
    data?.output_url ||
    data?.outputs?.[0];

  return typeof directUrl === "string" ? directUrl : undefined;
}

function buildGenerateRequestBody(context: CanvasWorkflowGenerationContext) {
  const aspectRatio =
    typeof context.settings.aspectRatio === "string" &&
    context.settings.aspectRatio.trim().length > 0
      ? context.settings.aspectRatio.trim()
      : context.subtype === "text-to-video" ||
          context.subtype === "image-to-video"
        ? "16:9"
        : "1:1";

  if (context.modelUrl === "/text-to-image/gpt-image-2") {
    return {
      sceneId: "gpt-image-2-text-to-image",
      scenario: "gpt-image-2-text-to-image",
      body: {
        mediaType: "image",
        prompt: context.prompt.trim(),
        enable_base64_output: false,
        enable_sync_mode: false,
        aspect_ratio: aspectRatio,
      },
    };
  }

  if (context.modelUrl === "/image-to-image/gpt-image-2") {
    const images = context.references
      .filter((reference) => reference.kind === "image")
      .map((reference) => reference.url)
      .filter(
        (url): url is string => typeof url === "string" && url.length > 0,
      );

    if (images.length === 0) {
      throw new Error("图生图工作流缺少可用参考图");
    }

    return {
      sceneId: "gpt-image-2-image-to-image",
      scenario: "gpt-image-2-image-to-image",
      body: {
        mediaType: "image",
        images,
        prompt: context.prompt.trim(),
        aspect_ratio: aspectRatio,
      },
    };
  }

  if (context.modelUrl === "/text-to-video/seedance-1-5-pro") {
    const duration =
      Number.parseInt(String(context.settings.duration), 10) || 5;
    const resolution =
      typeof context.settings.resolution === "string" &&
      context.settings.resolution.trim().length > 0
        ? context.settings.resolution.trim()
        : "fast 720p";
    const seedRaw = String(context.settings.seed ?? "-1").trim();

    return {
      sceneId: "text-to-video-seedance-1-5-pro",
      scenario: "text-to-video/seedance-1-5-pro",
      body: {
        mediaType: "video",
        prompt: context.prompt.trim(),
        aspect_ratio: aspectRatio,
        duration,
        resolution,
        generate_audio: Boolean(context.settings.generateAudio),
        camera_fixed: Boolean(context.settings.cameraFixed),
        seed: seedRaw === "-1" ? -1 : Number.parseInt(seedRaw, 10) || -1,
      },
    };
  }

  if (context.modelUrl === "/image-to-video/seedance-1-5-pro") {
    const image = context.references.find(
      (reference) => reference.kind === "image",
    )?.url;
    if (!image) {
      throw new Error("图生视频工作流缺少可用参考图");
    }

    const duration =
      Number.parseInt(String(context.settings.duration), 10) || 5;
    const resolution =
      typeof context.settings.resolution === "string" &&
      context.settings.resolution.trim().length > 0
        ? context.settings.resolution.trim()
        : "fast 720p";
    const seedRaw = String(context.settings.seed ?? "-1").trim();

    return {
      sceneId: "image-to-video-seedance-1-5-pro",
      scenario: "image-to-video-seedance-1-5-pro",
      body: {
        mediaType: "video",
        prompt: context.prompt.trim(),
        image,
        aspect_ratio: aspectRatio === "auto" ? undefined : aspectRatio,
        duration,
        resolution,
        generate_audio: Boolean(context.settings.generateAudio),
        camera_fixed: Boolean(context.settings.cameraFixed),
        seed: seedRaw === "-1" ? -1 : Number.parseInt(seedRaw, 10) || -1,
      },
    };
  }

  return null;
}

export async function submitCanvasWorkflowGeneration(input: {
  userId: string;
  projectId: string;
  workflowNodeId: string;
  baseUrl?: string;
  cookieHeader?: string;
}) {
  const generationContext = await buildCanvasWorkflowGenerationContext({
    userId: input.userId,
    projectId: input.projectId,
    workflowNodeId: input.workflowNodeId,
  });

  const requestConfig = buildGenerateRequestBody(generationContext);
  if (!requestConfig) {
    return {
      workflowNodeId: generationContext.workflowNodeId,
      executionMode: "client-deferred",
      accepted: false,
      mediaIntent: generationContext.mediaIntent,
      subtype: generationContext.subtype,
      sceneId: generationContext.sceneId,
      modelUrl: generationContext.modelUrl,
      error: `当前模型暂未接入服务端提交：${generationContext.modelUrl}`,
    } satisfies CanvasAgentGenerationSubmission;
  }

  const endpoint = `${normalizeBaseUrl(input.baseUrl)}/api/ai/${requestConfig.sceneId}/generate`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CANVAS_AGENT_GENERATION_SUBMIT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(input.cookieHeader ? { cookie: input.cookieHeader } : {}),
      },
      body: JSON.stringify(requestConfig.body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        /aborted|timeout/i.test(error.message))
    ) {
      throw new Error("服务端生成提交超时");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => null);
  const data = extractResponsePayload(payload);
  if (!response.ok || payload?.code !== 0 || !data) {
    throw new Error(payload?.message || "服务端生成提交失败");
  }

  const requestId =
    typeof data.requestId === "string"
      ? data.requestId
      : typeof data.taskId === "string"
        ? data.taskId
        : undefined;
  const outputs = normalizeStringArray(data.outputs);
  const directUrl = extractDirectUrl(data);

  return {
    workflowNodeId: generationContext.workflowNodeId,
    executionMode: requestId ? "server-submitted" : "client-deferred",
    accepted: Boolean(requestId || directUrl || outputs.length > 0),
    mediaIntent: generationContext.mediaIntent,
    subtype: generationContext.subtype,
    sceneId: requestConfig.sceneId,
    modelUrl: generationContext.modelUrl,
    requestId,
    taskId: requestId,
    scenario: requestConfig.scenario,
    directUrl,
    outputs: outputs.length > 0 ? outputs : undefined,
  } satisfies CanvasAgentGenerationSubmission;
}
