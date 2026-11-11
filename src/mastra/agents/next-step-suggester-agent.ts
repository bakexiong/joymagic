import { Agent } from "@mastra/core/agent";

import { createCanvasAgentRequestContext } from "../request-context/canvas-agent-request-context";
import { canvasReadTools } from "../tools/canvas-read-tools";
import { getCanvasAgentMemory } from "../memory/canvas-agent-memory";
import { createCanvasAgentWorkspace } from "../workspace/canvas-agent-workspace";
import { logCanvasAgentMessageSummary } from "../debug/canvas-agent-debug";
import {
  createCanvasAgentOpenRouterChatModel,
  getCanvasAgentOpenRouterModelId,
} from "../openrouter/canvas-openrouter";
import type { CanvasIntentPlannerResult } from "./intent-planner-agent";
import {
  normalizeCanvasAgentTokenUsage,
  type CanvasAgentTokenUsage,
} from "./agent-usage";
import { createCanvasAgentAbortSignal } from "./agent-abort";
import { resolveCanvasAgentOutputLanguage } from "./output-language";

export type CanvasNextStepSuggesterInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  message: string;
  refinedPrompt: string;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
  }>;
  plan: Omit<CanvasIntentPlannerResult, "usage">;
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type CanvasNextStepSuggesterResult = {
  title?: string;
  description?: string;
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
  }>;
  usage: CanvasAgentTokenUsage;
};

export async function createCanvasNextStepSuggesterAgent() {
  return new Agent({
    id: "next-step-suggester-agent",
    name: "next-step-suggester-agent",
    description: "负责为当前画布创作结果生成下一步可执行建议。",
    instructions: `
You are the next-step suggestion agent for Create Canvas.

Return strict JSON:
{
  "title"?: string,
  "description"?: string,
  "suggestions": Array<{
    "id": string,
    "title": string,
    "description": string,
    "prompt": string
  }>
}

Rules:
- You MUST write every user-visible field in responseLanguage
- If plan.needsClarification=true, return an empty suggestions array
- Otherwise return 2 to 4 suggestions
- Suggestions must be concrete follow-up actions, not generic advice
- title should be short enough to work like a button label
- description should explain the direction in one short sentence
- prompt should be directly reusable as the user's next message
- Stay tightly aligned with the current request, workflow subtype, and whether references are present
- Favor actions like restyling, motion, color changes, variants, continuation, camera changes, or scene extension
- Do not output extra fields
    `.trim(),
    model: await createCanvasAgentOpenRouterChatModel(),
    tools: {
      ...canvasReadTools,
    },
    memory: getCanvasAgentMemory(),
    workspace: createCanvasAgentWorkspace(),
  });
}

export async function runCanvasNextStepSuggesterAgent(
  input: CanvasNextStepSuggesterInput,
): Promise<CanvasNextStepSuggesterResult> {
  const agent = await createCanvasNextStepSuggesterAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();
  const prompt = JSON.stringify({
    projectId: input.projectId,
    message: input.message,
    refinedPrompt: input.refinedPrompt,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
    references: input.references,
    plan: input.plan,
  });

  logCanvasAgentMessageSummary({
    agentName: "next-step-suggester-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [...Object.keys(canvasReadTools)],
    structuredOutputKeys: ["title", "description", "suggestions"],
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
      maxSteps: 4,
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
            title: { type: "string" },
            description: { type: "string" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  prompt: { type: "string" },
                },
                required: ["id", "title", "description", "prompt"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    });

    const object = (result.object ?? {}) as Partial<
      Omit<CanvasNextStepSuggesterResult, "usage">
    >;
    const suggestions = Array.isArray(object.suggestions)
      ? object.suggestions.filter(
          (item): item is CanvasNextStepSuggesterResult["suggestions"][number] =>
            Boolean(
              item &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.prompt === "string",
            ),
        )
      : [];

    return {
      title: typeof object.title === "string" ? object.title : undefined,
      description:
        typeof object.description === "string"
          ? object.description
          : undefined,
      suggestions,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    console.error("[next-step-suggester-agent] failed to build suggestions", {
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      error,
    });
    return {
      title: undefined,
      description: undefined,
      suggestions: [],
      usage: normalizeCanvasAgentTokenUsage(undefined),
    };
  }
}
