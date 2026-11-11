import { Agent } from "@mastra/core/agent";
import type { CanvasWorkflowSubtype } from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import {
  DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
  DEFAULT_TEXT_TO_IMAGE_MODEL_URL,
} from "@/shared/services/canvas-agent/canvas-agent-scene-router";
import {
  DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
  DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
} from "@/shared/lib/video-model-defaults";
import { createCanvasAgentRequestContext } from "../request-context/canvas-agent-request-context";
import { canvasAssetTools } from "../tools/canvas-asset-tools";
import { canvasReadTools } from "../tools/canvas-read-tools";

import { getCanvasAgentMemory } from "../memory/canvas-agent-memory";
import { createCanvasAgentWorkspace } from "../workspace/canvas-agent-workspace";
import { logCanvasAgentMessageSummary } from "../debug/canvas-agent-debug";
import {
  createCanvasAgentOpenRouterChatModel,
  getCanvasAgentOpenRouterModelId,
} from "../openrouter/canvas-openrouter";
import {
  normalizeCanvasAgentTokenUsage,
  type CanvasAgentTokenUsage,
} from "./agent-usage";
import { mastraLogger } from "../logger";
import { resolveCanvasAgentOutputLanguage } from "./output-language";

export type CanvasSceneRouterInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  message: string;
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type CanvasSceneRouterResult = {
  preferredModelUrl: string;
  reasoning: string;
  usage: CanvasAgentTokenUsage;
};

export const CANVAS_SCENE_ROUTER_CONTRACT = {
  input:
    "projectId、threadId、resourceId、mediaIntent、subtype、message、contextMessages",
  output: "preferredModelUrl、reasoning，且 modelUrl 只能从允许列表中选择。",
};

export async function createCanvasSceneRouterAgent() {
  return new Agent({
    id: "scene-router-agent",
    name: "scene-router-agent",
    description:
      "负责为确定的 workflow subtype 选择允许列表中的首选 modelUrl。",
    instructions: `
You are the scene routing agent for Create Canvas.

Your job:
1. Choose the most appropriate default modelUrl based on mediaIntent and subtype
2. Return one very short reasoning sentence

You may only choose from the following modelUrl values:
- /text-to-image/gpt-image-2
- /image-to-image/gpt-image-2
- /text-to-video/seedance-1-5-pro
- /image-to-video/seedance-1-5-pro

Return strict JSON:
{
  "preferredModelUrl": string,
  "reasoning": string
}

Rules:
- text-to-image can only map to /text-to-image/gpt-image-2
- image-to-image can only map to /image-to-image/gpt-image-2
- text-to-video can only map to /text-to-video/seedance-1-5-pro
- image-to-video can only map to /image-to-video/seedance-1-5-pro
- You MUST write reasoning in responseLanguage
- Do not mix responseLanguage with other languages unless the user explicitly asks for bilingual output
- Do not output extra fields

If the current canvas context is helpful, you may inspect the project or selected-node summary first, but the final modelUrl must still come from the allowed list.
    `.trim(),
    model: await createCanvasAgentOpenRouterChatModel(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
    },
    memory: getCanvasAgentMemory(),
    workspace: createCanvasAgentWorkspace(),
  });
}

export async function runCanvasSceneRouterAgent(
  input: CanvasSceneRouterInput,
): Promise<CanvasSceneRouterResult> {
  const agent = await createCanvasSceneRouterAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();
  const prompt = JSON.stringify({
    mediaIntent: input.mediaIntent,
    subtype: input.subtype,
    message: input.message,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
  });

  logCanvasAgentMessageSummary({
    agentName: "scene-router-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [
      ...Object.keys(canvasReadTools),
      ...Object.keys(canvasAssetTools),
    ],
    structuredOutputKeys: ["preferredModelUrl", "reasoning"],
    extra: {
      projectId: input.projectId,
      threadId: input.threadId,
      subtype: input.subtype,
      mediaIntent: input.mediaIntent,
    },
  });

  try {
    const result = await agent.generate(prompt, {
      maxSteps: 6,
      requestContext: createCanvasAgentRequestContext({
        userId: input.userId,
        projectId: input.projectId,
        threadId: input.threadId,
        resourceId: input.resourceId,
      }),
      context: (input.contextMessages || []).map((message) => ({
        role: message.role,
        content: [{ type: "text", text: message.content }],
      })) as any,
      memory: {
        thread: { id: input.threadId },
        resource: input.resourceId,
      },
      structuredOutput: {
        schema: {
          type: "object",
          properties: {
            preferredModelUrl: {
              type: "string",
              enum: [
                DEFAULT_TEXT_TO_IMAGE_MODEL_URL,
                DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
                DEFAULT_TEXT_TO_VIDEO_MODEL_URL,
                DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
              ],
            },
            reasoning: { type: "string" },
          },
          required: ["preferredModelUrl", "reasoning"],
          additionalProperties: false,
        },
      },
    });

    const parsed = result.object as Partial<CanvasSceneRouterResult> | null;
    if (!parsed?.preferredModelUrl || !parsed?.reasoning) {
      throw new Error("Scene router agent returned an invalid response");
    }

    return {
      preferredModelUrl: parsed.preferredModelUrl,
      reasoning: parsed.reasoning,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    mastraLogger.error("[scene-router-agent] fallback triggered", {
      error,
      subtype: input.subtype,
      mediaIntent: input.mediaIntent,
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
    });
    throw error;
  }
}
