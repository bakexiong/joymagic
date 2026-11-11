import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { getAllConfigs, getAllConfigsDirectly } from "@/shared/models/config";

const DEFAULT_CANVAS_AGENT_MODEL = "google/gemini-2.5-flash-lite";

type CanvasAgentReasoningEffort = "low" | "medium" | "high";

function resolveReasoningEnabled(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") return value > 0;
  return false;
}

function resolveReasoningEffort(value: unknown): CanvasAgentReasoningEffort {
  return value === "low" || value === "high" ? value : "medium";
}

export function resolveCanvasAgentOpenRouterModelId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : DEFAULT_CANVAS_AGENT_MODEL;
}

function resolveCanvasAgentConfiguredModelId(configs: Record<string, unknown>) {
  return resolveCanvasAgentOpenRouterModelId(
    configs.canvas_agent_model_id ?? configs.canvas_agent_openrouter_model_id,
  );
}

export function isCanvasAgentGeminiModelId(modelId: string) {
  return /^(google\/)?gemini\b/i.test(modelId.trim());
}

export function normalizeCanvasAgentGeminiModelId(modelId: string) {
  return modelId.trim().replace(/^google\//i, "");
}

function hasCanvasAgentCriticalConfig(configs: Record<string, unknown>) {
  const modelId = resolveCanvasAgentConfiguredModelId(configs);

  if (isCanvasAgentGeminiModelId(modelId)) {
    return typeof configs.gemini_api_key === "string" &&
      configs.gemini_api_key.trim().length > 0;
  }

  return typeof configs.openrouter_api_key === "string" &&
    configs.openrouter_api_key.trim().length > 0;
}

async function getCanvasAgentConfigs() {
  const cachedConfigs = await getAllConfigs();

  if (hasCanvasAgentCriticalConfig(cachedConfigs)) {
    return cachedConfigs;
  }

  return getAllConfigsDirectly();
}

export async function getCanvasAgentOpenRouterModelId() {
  const configs = await getCanvasAgentConfigs();
  return resolveCanvasAgentConfiguredModelId(configs);
}

export async function createCanvasAgentChatModel(modelId?: string) {
  const configs = await getCanvasAgentConfigs();
  const resolvedModelId =
    typeof modelId === "string" && modelId.trim().length > 0
      ? resolveCanvasAgentOpenRouterModelId(modelId)
      : resolveCanvasAgentConfiguredModelId(configs);

  if (isCanvasAgentGeminiModelId(resolvedModelId)) {
    const geminiApiKey = configs.gemini_api_key;

    if (!geminiApiKey) {
      throw new Error("gemini_api_key is not set");
    }

    const google = createGoogleGenerativeAI({
      apiKey: geminiApiKey,
      ...(typeof configs.gemini_api_url === "string" &&
      configs.gemini_api_url.trim().length > 0
        ? {
            baseURL: configs.gemini_api_url.trim(),
          }
        : {}),
    });

    return google.chat(normalizeCanvasAgentGeminiModelId(resolvedModelId));
  }

  const openrouterApiKey = configs.openrouter_api_key;

  if (!openrouterApiKey) {
    throw new Error("openrouter_api_key is not set");
  }

  const openrouter = createOpenRouter({
    apiKey: openrouterApiKey,
    ...(typeof configs.openrouter_api_url === "string" &&
    configs.openrouter_api_url.trim().length > 0
      ? {
          baseURL: configs.openrouter_api_url.trim(),
        }
      : {}),
  });

  const reasoningEnabled = resolveReasoningEnabled(
    configs.canvas_agent_openrouter_reasoning_enabled,
  );
  const reasoningEffort = resolveReasoningEffort(
    configs.canvas_agent_openrouter_reasoning_effort,
  );

  return openrouter.chat(resolvedModelId, {
    usage: {
      include: true,
    },
    ...(reasoningEnabled
      ? {
          reasoning: {
            enabled: true,
            effort: reasoningEffort,
          },
        }
      : {}),
  });
}

export async function createCanvasAgentOpenRouterChatModel(modelId?: string) {
  return createCanvasAgentChatModel(modelId);
}

export async function getCanvasAgentModelId() {
  return getCanvasAgentOpenRouterModelId();
}

export const CANVAS_AGENT_MODEL_ID = DEFAULT_CANVAS_AGENT_MODEL;
export const CANVAS_AGENT_OPENROUTER_MODEL_ID = CANVAS_AGENT_MODEL_ID;
