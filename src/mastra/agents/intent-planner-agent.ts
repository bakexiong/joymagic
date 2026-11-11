import { Agent } from "@mastra/core/agent";
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
import { createCanvasAgentAbortSignal } from "./agent-abort";
import { resolveCanvasAgentOutputLanguage } from "./output-language";

export type CanvasIntentPlannerInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  skillId?: string | null;
  message: string;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
  }>;
  selectedNodeIds?: string[];
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type CanvasIntentPlannerResult = {
  needsClarification: boolean;
  mediaIntent: "image" | "video";
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  reasoning: string;
  usage: CanvasAgentTokenUsage;
};

export const CANVAS_INTENT_PLANNER_CONTRACT = {
  input:
    "projectId、threadId、resourceId、skillId、message、references、selectedNodeIds、contextMessages",
  output:
    "needsClarification、mediaIntent、subtype、reasoning，全部为严格 JSON 字段，不允许附带额外属性。",
};

export async function createCanvasIntentPlannerAgent() {
  return new Agent({
    id: "intent-planner-agent",
    name: "intent-planner-agent",
    description:
      "负责把 Canvas 聊天请求解析为媒体意图和工作流 subtype，可读取画布上下文辅助判断。",
    instructions: `
You are the intent planning agent for Create Canvas.

Your job:
1. Decide whether the user wants to create an image or a video
2. Decide whether the workflow should be text-based or reference-based
3. Return one short reasoning sentence that explains the decision

If needed, you may first inspect the current canvas project, snapshot, selected nodes, and referenced assets before deciding.

Return strict JSON:
{
  "needsClarification": boolean,
  "mediaIntent": "image" | "video",
  "subtype": "text-to-image" | "image-to-image" | "text-to-video" | "image-to-video",
  "reasoning": string
}

Rules:
- You MUST write reasoning in responseLanguage
- Do not mix responseLanguage with other languages unless the user explicitly asks for bilingual output
- Keep reasoning short, one sentence is enough
- Decide needsClarification, mediaIntent, and subtype from the user's request, references, and any helpful canvas context
- Do not output any extra fields
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

export async function runCanvasIntentPlannerAgent(
  input: CanvasIntentPlannerInput,
): Promise<CanvasIntentPlannerResult> {
  const agent = await createCanvasIntentPlannerAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();
  const prompt = JSON.stringify({
    projectId: input.projectId,
    threadId: input.threadId,
    resourceId: input.resourceId,
    skillId: input.skillId || null,
    message: input.message,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
    selectedNodeIds: input.selectedNodeIds || [],
    references: input.references,
  });

  logCanvasAgentMessageSummary({
    agentName: "intent-planner-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [
      ...Object.keys(canvasReadTools),
      ...Object.keys(canvasAssetTools),
    ],
    structuredOutputKeys: [
      "needsClarification",
      "mediaIntent",
      "subtype",
      "reasoning",
    ],
    extra: {
      projectId: input.projectId,
      threadId: input.threadId,
      referenceCount: input.references.length,
      selectedNodeCount: input.selectedNodeIds?.length || 0,
    },
  });

  try {
    const result = await agent.generate(prompt, {
      maxSteps: 6,
      abortSignal: createCanvasAgentAbortSignal(),
      requestContext: createCanvasAgentRequestContext({
        userId: input.userId,
        projectId: input.projectId,
        threadId: input.threadId,
        resourceId: input.resourceId,
        selectedNodeIds: input.selectedNodeIds || [],
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
            needsClarification: { type: "boolean" },
            mediaIntent: { type: "string", enum: ["image", "video"] },
            subtype: {
              type: "string",
              enum: [
                "text-to-image",
                "image-to-image",
                "text-to-video",
                "image-to-video",
              ],
            },
            reasoning: { type: "string" },
          },
          required: [
            "needsClarification",
            "mediaIntent",
            "subtype",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    });

    const parsed = result.object as Partial<CanvasIntentPlannerResult> | null;
    if (
      typeof parsed?.needsClarification !== "boolean" ||
      !parsed?.mediaIntent ||
      !parsed?.subtype ||
      !parsed?.reasoning
    ) {
      throw new Error("Intent planner agent returned an invalid plan");
    }

    return {
      needsClarification: parsed.needsClarification,
      mediaIntent: parsed.mediaIntent,
      subtype: parsed.subtype,
      reasoning: parsed.reasoning,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    console.error("[intent-planner-agent] failed to plan intent", {
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      error,
    });
    throw error;
  }
}
