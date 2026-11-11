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
import type { CanvasIntentPlannerResult } from "./intent-planner-agent";
import {
  normalizeCanvasAgentTokenUsage,
  type CanvasAgentTokenUsage,
} from "./agent-usage";
import { createCanvasAgentAbortSignal } from "./agent-abort";
import { resolveCanvasAgentOutputLanguage } from "./output-language";

export type CanvasResponseComposerInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  message: string;
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
  selectedWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
  editableWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
};

export const CANVAS_RESPONSE_COMPOSER_CONTRACT = {
  input:
    "message、references、plan、contextMessages、selectedWorkflowNodes、editableWorkflowNodes 以及当前项目级 request context。",
  output:
    "assistantMessage、可选 promptGuideOptions 和可选 uiLabels，全部为严格 JSON 字段。",
};

export type CanvasResponseComposerResult = {
  assistantMessage: string;
  promptGuideOptions?: Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
  }>;
  uiLabels?: {
    groupLabel?: string;
    promptTextLabel?: string;
    promptGuideTitle?: string;
    promptGuideDescription?: string;
    promptGuideCustomLabel?: string;
  };
  usage: CanvasAgentTokenUsage;
};

export async function createCanvasResponseComposerAgent() {
  return new Agent({
    id: "response-composer-agent",
    name: "response-composer-agent",
    description: "负责生成用户可见的短回复，解释当前会创建哪种画布工作流。",
    instructions: `
You are the response composition agent for Create Canvas.

You will receive:
- the user message
- the planning result (mediaIntent, subtype, reasoning)
- whether reference images are present
- responseLanguage, which explicitly tells you what language to use

If needed, you may inspect the current canvas project and selected-node context so the reply matches the current editing state.

Return strict JSON:
{
  "assistantMessage": string,
  "promptGuideOptions"?: Array<{
    "id": string,
    "title": string,
    "description": string,
    "prompt": string
  }>,
  "uiLabels"?: {
    "groupLabel"?: string,
    "promptTextLabel"?: string,
    "promptGuideTitle"?: string,
    "promptGuideDescription"?: string,
    "promptGuideCustomLabel"?: string
  }
}

Rules:
- You MUST write all user-visible fields in responseLanguage, including assistantMessage, promptGuideOptions, and uiLabels
- Do not mix responseLanguage with other languages unless the user explicitly asks for bilingual output
- If plan.needsClarification=true, ask a follow-up question for more creative detail instead of pretending the workflow has already started
- If plan.needsClarification=false, use one short sentence to explain what workflow will be created
- If reference images are present, explicitly mention "参考图"
- If plan.needsClarification=true, you must return 2 to 4 promptGuideOptions to help the user refine the request
- promptGuideOptions must stay tightly aligned with the current user input and must not sound generic
- title should be short, description should feel like directional guidance, and prompt should be usable as the user's next, more complete message
- If helpful, you may also return uiLabels for naming the group, text node, and guidance card
- uiLabels must also stay specific to the current request and must not sound generic
- Do not explain the reasoning process
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

export async function runCanvasResponseComposerAgent(
  input: CanvasResponseComposerInput,
): Promise<CanvasResponseComposerResult> {
  const agent = await createCanvasResponseComposerAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();
  const prompt = JSON.stringify({
    projectId: input.projectId,
    message: input.message,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
    references: input.references,
    plan: input.plan,
    selectedWorkflowNodes: input.selectedWorkflowNodes || [],
    editableWorkflowNodes: input.editableWorkflowNodes || [],
  });

  logCanvasAgentMessageSummary({
    agentName: "response-composer-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [
      ...Object.keys(canvasReadTools),
      ...Object.keys(canvasAssetTools),
    ],
    structuredOutputKeys: [
      "assistantMessage",
      "promptGuideOptions",
      "uiLabels",
    ],
      extra: {
        projectId: input.projectId,
        threadId: input.threadId,
        referenceCount: input.references.length,
        subtype: input.plan.subtype,
        mediaIntent: input.plan.mediaIntent,
        selectedWorkflowCount: input.selectedWorkflowNodes?.length || 0,
        editableWorkflowCount: input.editableWorkflowNodes?.length || 0,
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
            assistantMessage: { type: "string" },
            promptGuideOptions: {
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
            uiLabels: {
              type: "object",
              properties: {
                groupLabel: { type: "string" },
                promptTextLabel: { type: "string" },
                promptGuideTitle: { type: "string" },
                promptGuideDescription: { type: "string" },
                promptGuideCustomLabel: { type: "string" },
              },
              additionalProperties: false,
            },
          },
          required: ["assistantMessage"],
          additionalProperties: false,
        },
      },
    });

    const parsed = result.object as {
      assistantMessage?: string;
      promptGuideOptions?: Array<{
        id?: string;
        title?: string;
        description?: string;
        prompt?: string;
      }>;
      uiLabels?: {
        groupLabel?: string;
        promptTextLabel?: string;
        promptGuideTitle?: string;
        promptGuideDescription?: string;
        promptGuideCustomLabel?: string;
      };
    } | null;
    if (!parsed?.assistantMessage) {
      throw new Error("Response composer agent returned an invalid response");
    }

    return {
      assistantMessage: parsed.assistantMessage,
      promptGuideOptions: Array.isArray(parsed.promptGuideOptions)
        ? parsed.promptGuideOptions.flatMap((option) => {
            if (
              !option ||
              typeof option.id !== "string" ||
              typeof option.title !== "string" ||
              typeof option.description !== "string" ||
              typeof option.prompt !== "string"
            ) {
              return [];
            }

            return [
              {
                id: option.id,
                title: option.title,
                description: option.description,
                prompt: option.prompt,
              },
            ];
          })
        : undefined,
      uiLabels:
        parsed.uiLabels && typeof parsed.uiLabels === "object"
          ? {
              groupLabel:
                typeof parsed.uiLabels.groupLabel === "string"
                  ? parsed.uiLabels.groupLabel
                  : undefined,
              promptTextLabel:
                typeof parsed.uiLabels.promptTextLabel === "string"
                  ? parsed.uiLabels.promptTextLabel
                  : undefined,
              promptGuideTitle:
                typeof parsed.uiLabels.promptGuideTitle === "string"
                  ? parsed.uiLabels.promptGuideTitle
                  : undefined,
              promptGuideDescription:
                typeof parsed.uiLabels.promptGuideDescription === "string"
                  ? parsed.uiLabels.promptGuideDescription
                  : undefined,
              promptGuideCustomLabel:
                typeof parsed.uiLabels.promptGuideCustomLabel === "string"
                  ? parsed.uiLabels.promptGuideCustomLabel
                  : undefined,
            }
          : undefined,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    console.error("[response-composer-agent] failed to compose response", {
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      error,
    });
    throw error;
  }
}
