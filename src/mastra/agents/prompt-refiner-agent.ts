import { Agent } from "@mastra/core/agent";
import type { CanvasIntentPlannerResult } from "./intent-planner-agent";
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

export type CanvasPromptRefinerInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  message: string;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
    url?: string;
  }>;
  plan: Omit<CanvasIntentPlannerResult, "usage">;
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type CanvasPromptRefinerResult = {
  refinedPrompt: string;
  reasoning: string;
  usage: CanvasAgentTokenUsage;
};

export const CANVAS_PROMPT_REFINER_CONTRACT = {
  input:
    "projectId、threadId、resourceId、message、references、plan、contextMessages",
  output: "refinedPrompt、reasoning，全部为严格 JSON 字段。",
};

export async function createCanvasPromptRefinerAgent() {
  return new Agent({
    id: "prompt-refiner-agent",
    name: "prompt-refiner-agent",
    description:
      "负责把用户原始诉求和参考图上下文整理为可直接执行的生成提示词。",
    instructions: `
You are the prompt refinement agent for Create Canvas.

Your job:
1. Preserve the user's original creative goal and do not change the subject matter on your own
2. Rewrite the user request into a clearer prompt that is easier for image/video models to execute
3. If there are reference images, use them only as references for composition, subject, or style, and do not invent specific brands or text that are not present
4. Return one very short reasoning sentence describing what you improved

If needed, you may inspect the current canvas snapshot, selected nodes, and referenced assets before composing refinedPrompt.

Return strict JSON:
{
  "refinedPrompt": string,
  "reasoning": string
}

Rules:
- You MUST write both refinedPrompt and reasoning in responseLanguage
- Do not mix responseLanguage with other languages unless the user explicitly asks for bilingual output
- Keep it concise, usually 1 to 3 sentences
- Do not output markdown
- Do not output a negative prompt
- Do not output extra fields
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

export async function runCanvasPromptRefinerAgent(
  input: CanvasPromptRefinerInput,
): Promise<CanvasPromptRefinerResult> {
  const agent = await createCanvasPromptRefinerAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();
  const prompt = JSON.stringify({
    projectId: input.projectId,
    message: input.message,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
    references: input.references,
    plan: input.plan,
  });

  logCanvasAgentMessageSummary({
    agentName: "prompt-refiner-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [
      ...Object.keys(canvasReadTools),
      ...Object.keys(canvasAssetTools),
    ],
    structuredOutputKeys: ["refinedPrompt", "reasoning"],
    extra: {
      projectId: input.projectId,
      threadId: input.threadId,
      referenceCount: input.references.length,
      subtype: input.plan.subtype,
      mediaIntent: input.plan.mediaIntent,
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
            refinedPrompt: { type: "string" },
            reasoning: { type: "string" },
          },
          required: ["refinedPrompt", "reasoning"],
          additionalProperties: false,
        },
      },
    });

    const parsed = result.object as Partial<CanvasPromptRefinerResult> | null;
    if (!parsed?.refinedPrompt || !parsed?.reasoning) {
      throw new Error("Prompt refiner agent returned an invalid response");
    }

    return {
      refinedPrompt: parsed.refinedPrompt,
      reasoning: parsed.reasoning,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    console.error("[prompt-refiner-agent] failed to refine prompt", {
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      error,
    });
    throw error;
  }
}
