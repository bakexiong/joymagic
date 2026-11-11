import { Agent } from "@mastra/core/agent";
import type { CanvasAgentResolvedSkillContext } from "@/shared/services/canvas-agent/canvas-agent-skill";

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

export type CanvasSupervisorAgentInput = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  executionMode: "ask" | "auto";
  skillId?: string | null;
  skillContext?: CanvasAgentResolvedSkillContext | null;
  message: string;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
    url?: string;
  }>;
  selectedNodeIds?: string[];
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
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type CanvasSupervisorAgentResult = {
  assistantMessage: string;
  needsClarification: boolean;
  mediaIntent: "image" | "video";
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  refinedPrompt: string;
  preferredModelUrl:
    | "/text-to-image/gpt-image-2"
    | "/image-to-image/gpt-image-2"
    | "/text-to-video/seedance-1-5-pro"
    | "/image-to-video/seedance-1-5-pro";
  planningReasoning: string;
  promptRefinementReasoning: string;
  sceneRoutingReasoning: string;
  executionTarget: "create-new" | "continue-existing";
  targetWorkflowNodeId?: string;
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
  nextStepTitle?: string;
  nextStepDescription?: string;
  nextStepOptions?: Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
  }>;
  usage: CanvasAgentTokenUsage;
};

function derivePreferredModelUrl(
  subtype: CanvasSupervisorAgentResult["subtype"],
): CanvasSupervisorAgentResult["preferredModelUrl"] {
  if (subtype === "image-to-image") return "/image-to-image/gpt-image-2";
  if (subtype === "text-to-video") return "/text-to-video/seedance-1-5-pro";
  if (subtype === "image-to-video") return "/image-to-video/seedance-1-5-pro";
  return "/text-to-image/gpt-image-2";
}

export const CANVAS_SUPERVISOR_CONTRACT = {
  input:
    "projectId、threadId、resourceId、executionMode、skillId、可选 skillContext、message、references、selectedNodeIds、contextMessages",
  output:
    "assistantMessage、needsClarification、mediaIntent、subtype、refinedPrompt、preferredModelUrl、planningReasoning、promptRefinementReasoning、sceneRoutingReasoning、executionTarget、可选 targetWorkflowNodeId、可选 promptGuideOptions、可选 uiLabels、可选 nextStepTitle/nextStepDescription/nextStepOptions 的严格 JSON 结果。",
};

export async function createCanvasSupervisorAgent() {
  return new Agent({
    id: "canvas-supervisor-agent",
    name: "canvas-supervisor-agent",
    description:
      "统一完成 Canvas 聊天请求的意图判断、提示词整理、回复撰写、模型路由和后续建议生成。",
    instructions: `
You are the server-side orchestration agent for Create Canvas.

You will receive:
- current executionMode ("ask" or "auto")
- the user message
- optional skillContext with the resolved skill title, description, route reason, and detailed instructions
- optional references
- optional selected node ids
- optional selected workflow nodes
- optional editable workflow nodes already present on the canvas
- recent context messages
- responseLanguage, which explicitly tells you what language to use

Your job in one pass:
1. Decide whether clarification is needed
2. Decide mediaIntent and subtype
3. Rewrite the request into a refinedPrompt if the request is specific enough
4. Choose the preferredModelUrl from the allowed list
5. Write the user-facing assistantMessage
6. Optionally provide promptGuideOptions, uiLabels, and next-step suggestions when helpful
7. Decide whether to continue editing an existing workflow node or create a new node group
8. Return short reasoning fields for planning, prompt refinement, and scene routing

Allowed preferredModelUrl values:
- /text-to-image/gpt-image-2
- /image-to-image/gpt-image-2
- /text-to-video/seedance-1-5-pro
- /image-to-video/seedance-1-5-pro

Return strict JSON:
{
  "assistantMessage": string,
  "needsClarification": boolean,
  "mediaIntent": "image" | "video",
  "subtype": "text-to-image" | "image-to-image" | "text-to-video" | "image-to-video",
  "refinedPrompt": string,
  "preferredModelUrl": "/text-to-image/gpt-image-2" | "/image-to-image/gpt-image-2" | "/text-to-video/seedance-1-5-pro" | "/image-to-video/seedance-1-5-pro",
  "planningReasoning": string,
  "promptRefinementReasoning": string,
  "sceneRoutingReasoning": string,
  "executionTarget": "create-new" | "continue-existing",
  "targetWorkflowNodeId"?: string,
  "promptGuideOptions": Array<{
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
  },
  "nextStepTitle"?: string,
  "nextStepDescription"?: string,
  "nextStepOptions": Array<{
    "id": string,
    "title": string,
    "description": string,
    "prompt": string
  }>
}

Rules:
- You MUST write every user-visible field and every reasoning field in responseLanguage
- Do not mix responseLanguage with other languages unless the user explicitly asks for bilingual output
- Treat the user's message as the primary intent signal, and use skillContext as structured domain guidance to refine, constrain, and strengthen the result
- If skillContext is present, follow it as high-priority domain guidance for creative framing, clarification prompts, and prompt rewriting
- Use skillContext to make follow-up suggestions more specific, but never mention internal skill names or route logic to the user
- Respect the user's original prompt language. Do not silently translate the user's prompt into another language.
- You must infer from the user's wording whether they want the prompt preserved as-is, lightly organized, or actively optimized.
- Do NOT substantially rewrite, optimize, expand, translate, or embellish the user's prompt unless the user clearly asks for that or clearly signals they want help improving the prompt itself.
- If the user's prompt is already usable and they did not clearly ask for prompt improvement, refinedPrompt should stay very close to the original wording.
- If skillContext suggests stronger structure or missing details but the user's intent about rewriting is ambiguous, ask for permission or clarification instead of silently changing the prompt.
- Decide needsClarification, mediaIntent, subtype, refinedPrompt, and preferredModelUrl from the request, references, and context
- Decide whether this request should continue editing an existing workflow node or create a new node group
- Always include promptGuideOptions and nextStepOptions in the JSON output
- Use [] for any suggestion array that is not applicable
- If executionMode="ask" and there are selectedWorkflowNodes or editableWorkflowNodes on the canvas, you should strongly prefer clarification before executing unless the user has already made the target explicit
- If there are editable workflow nodes on the canvas and the user intent is ambiguous about whether to continue editing an existing node or create a new one, ask a clarification question before executing
- If selectedWorkflowNodes is non-empty, treat it as the strongest candidate for continue-existing
- If needsClarification=true:
  - assistantMessage should ask for the missing creative details
  - refinedPrompt should be an empty string
  - promptGuideOptions should contain 2 to 4 concrete follow-up prompts that the user can tap immediately
  - promptGuideOptions is required even for broad greetings, first-turn requests, or underspecified requests
  - nextStepOptions should be []
- If the clarification is specifically about continue-existing vs create-new:
  - promptGuideOptions must include an option to continue editing the selected or current workflow
  - promptGuideOptions must include an option to create a new canvas node group
  - executionTarget should reflect the best current guess
- If both kinds of clarification apply at the same time:
  - the same promptGuideOptions array should include edit-target disambiguation and creative refinement suggestions together
  - include 1 to 2 options for continue-existing / create-new
  - include 1 to 2 options that make the content itself more specific, such as style, scene, lighting, composition, or mood
  - do not return only the edit-target options when the content is still too vague
- If needsClarification=false:
  - assistantMessage should briefly explain what will be created
  - refinedPrompt should be directly usable for the workflow
  - uiLabels.groupLabel should be a short, concrete title for the generated canvas group
  - promptGuideOptions should usually be []
  - nextStepOptions may contain 2 to 4 concrete follow-up prompts when helpful, otherwise []
- If executionTarget="continue-existing":
  - targetWorkflowNodeId is required
  - reuse the selected workflow node when appropriate
- If executionTarget="create-new":
  - targetWorkflowNodeId should usually be omitted
- The highest-priority fields are assistantMessage, needsClarification, mediaIntent, and subtype
- Keep planningReasoning, promptRefinementReasoning, and sceneRoutingReasoning very short
- Use only the allowed preferredModelUrl values
- Do not output markdown
- Do not output extra fields
    `.trim(),
    model: await createCanvasAgentOpenRouterChatModel(),
  });
}

export async function runCanvasSupervisorAgent(
  input: CanvasSupervisorAgentInput,
): Promise<CanvasSupervisorAgentResult> {
  const agent = await createCanvasSupervisorAgent();
  const modelId = await getCanvasAgentOpenRouterModelId();

  const prompt = JSON.stringify({
    projectId: input.projectId,
    threadId: input.threadId,
    resourceId: input.resourceId,
    executionMode: input.executionMode,
    skillId: input.skillId || null,
    skillContext: input.skillContext || null,
    message: input.message,
    responseLanguage: resolveCanvasAgentOutputLanguage(input.message),
    selectedNodeIds: input.selectedNodeIds || [],
    selectedWorkflowNodes: input.selectedWorkflowNodes || [],
    editableWorkflowNodes: input.editableWorkflowNodes || [],
    references: input.references,
  });

  logCanvasAgentMessageSummary({
    agentName: "canvas-supervisor-agent",
    modelId,
    userPrompt: prompt,
    contextMessages: input.contextMessages || [],
    toolNames: [],
    structuredOutputKeys: [
      "assistantMessage",
      "needsClarification",
      "mediaIntent",
      "subtype",
      "refinedPrompt",
      "preferredModelUrl",
      "planningReasoning",
      "promptRefinementReasoning",
      "sceneRoutingReasoning",
      "executionTarget",
      "targetWorkflowNodeId",
      "promptGuideOptions",
      "uiLabels",
      "nextStepTitle",
      "nextStepDescription",
      "nextStepOptions",
    ],
    extra: {
      projectId: input.projectId,
      threadId: input.threadId,
      executionMode: input.executionMode,
      referenceCount: input.references.length,
      selectedNodeCount: input.selectedNodeIds?.length || 0,
      editableWorkflowCount: input.editableWorkflowNodes?.length || 0,
      resolvedSkillId:
        input.skillContext?.resolvedSkillId || input.skillId || null,
    },
  });

  try {
    const result = await agent.generate(prompt, {
      maxSteps: 1,
      abortSignal: createCanvasAgentAbortSignal(),
      context: (input.contextMessages || []).map((message) => ({
        role: message.role,
        content: [{ type: "text", text: message.content }],
      })) as any,
      structuredOutput: {
        schema: {
          type: "object",
          properties: {
            assistantMessage: { type: "string" },
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
            refinedPrompt: { type: "string" },
            preferredModelUrl: {
              type: "string",
              enum: [
                "/text-to-image/gpt-image-2",
                "/image-to-image/gpt-image-2",
                "/text-to-video/seedance-1-5-pro",
                "/image-to-video/seedance-1-5-pro",
              ],
            },
            planningReasoning: { type: "string" },
            promptRefinementReasoning: { type: "string" },
            sceneRoutingReasoning: { type: "string" },
            executionTarget: {
              type: "string",
              enum: ["create-new", "continue-existing"],
            },
            targetWorkflowNodeId: { type: "string" },
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
            nextStepTitle: { type: "string" },
            nextStepDescription: { type: "string" },
            nextStepOptions: {
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
          required: [
            "assistantMessage",
            "needsClarification",
            "mediaIntent",
            "subtype",
            "promptGuideOptions",
            "nextStepOptions",
            "executionTarget",
          ],
          additionalProperties: false,
        },
      },
    });

    const parsed = result.object as Partial<CanvasSupervisorAgentResult> | null;
    if (
      !parsed?.assistantMessage ||
      typeof parsed?.needsClarification !== "boolean" ||
      !parsed?.mediaIntent ||
      !parsed?.subtype ||
      !parsed?.executionTarget
    ) {
      console.error("[canvas-supervisor-agent] invalid structured output", {
        projectId: input.projectId,
        threadId: input.threadId,
        resourceId: input.resourceId,
        object: result.object,
        usage: result.usage,
      });
      throw new Error("Canvas supervisor agent returned an invalid response");
    }

    const normalizeOptions = (
      value: unknown,
    ): NonNullable<CanvasSupervisorAgentResult["promptGuideOptions"]> => {
      if (!Array.isArray(value)) return [];
      return value.flatMap((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          typeof (item as any).id !== "string" ||
          typeof (item as any).title !== "string" ||
          typeof (item as any).description !== "string" ||
          typeof (item as any).prompt !== "string"
        ) {
          return [];
        }

        return [
          {
            id: (item as any).id,
            title: (item as any).title,
            description: (item as any).description,
            prompt: (item as any).prompt,
          },
        ];
      });
    };

    const promptGuideOptions = normalizeOptions(parsed.promptGuideOptions);
    const nextStepOptions = normalizeOptions(parsed.nextStepOptions);
    const effectivePromptGuideOptions = parsed.needsClarification
      ? promptGuideOptions.length > 0
        ? promptGuideOptions
        : nextStepOptions
      : promptGuideOptions;
    const effectiveNextStepOptions = parsed.needsClarification
      ? undefined
      : nextStepOptions;

    if (
      parsed.needsClarification &&
      (!effectivePromptGuideOptions || effectivePromptGuideOptions.length === 0)
    ) {
      console.warn(
        "[canvas-supervisor-agent] clarification response missing prompt suggestions; continuing without suggestion cards",
        {
          projectId: input.projectId,
          threadId: input.threadId,
          resourceId: input.resourceId,
          object: result.object,
          usage: result.usage,
        },
      );
    }

    const normalizedUiLabels =
      parsed.uiLabels && typeof parsed.uiLabels === "object"
        ? {
            groupLabel:
              typeof parsed.uiLabels.groupLabel === "string"
                ? parsed.uiLabels.groupLabel.trim()
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
        : undefined;

    if (!parsed.needsClarification && !normalizedUiLabels?.groupLabel) {
      console.error(
        "[canvas-supervisor-agent] generation response missing group label",
        {
          projectId: input.projectId,
          threadId: input.threadId,
          resourceId: input.resourceId,
          object: result.object,
          usage: result.usage,
        },
      );
      throw new Error(
        "Canvas supervisor agent returned a generation response without a group label",
      );
    }

    if (
      !parsed.needsClarification &&
      parsed.executionTarget === "continue-existing" &&
      typeof parsed.targetWorkflowNodeId !== "string"
    ) {
      throw new Error(
        "Canvas supervisor agent returned continue-existing without targetWorkflowNodeId",
      );
    }

    return {
      assistantMessage: parsed.assistantMessage,
      needsClarification: parsed.needsClarification,
      mediaIntent: parsed.mediaIntent,
      subtype: parsed.subtype,
      refinedPrompt:
        typeof parsed.refinedPrompt === "string"
          ? parsed.refinedPrompt
          : parsed.needsClarification
            ? ""
            : input.message.trim(),
      preferredModelUrl:
        typeof parsed.preferredModelUrl === "string"
          ? (parsed.preferredModelUrl as CanvasSupervisorAgentResult["preferredModelUrl"])
          : derivePreferredModelUrl(parsed.subtype),
      planningReasoning:
        typeof parsed.planningReasoning === "string"
          ? parsed.planningReasoning
          : "",
      promptRefinementReasoning:
        typeof parsed.promptRefinementReasoning === "string"
          ? parsed.promptRefinementReasoning
          : "",
      sceneRoutingReasoning:
        typeof parsed.sceneRoutingReasoning === "string"
          ? parsed.sceneRoutingReasoning
          : "",
      executionTarget:
        parsed.executionTarget === "continue-existing"
          ? "continue-existing"
          : "create-new",
      targetWorkflowNodeId:
        typeof parsed.targetWorkflowNodeId === "string"
          ? parsed.targetWorkflowNodeId
          : undefined,
      promptGuideOptions: effectivePromptGuideOptions,
      uiLabels: normalizedUiLabels,
      nextStepTitle:
        typeof parsed.nextStepTitle === "string"
          ? parsed.nextStepTitle
          : undefined,
      nextStepDescription:
        typeof parsed.nextStepDescription === "string"
          ? parsed.nextStepDescription
          : undefined,
      nextStepOptions: effectiveNextStepOptions,
      usage: normalizeCanvasAgentTokenUsage(result.usage),
    };
  } catch (error) {
    console.error("[canvas-supervisor-agent] failed to orchestrate", {
      projectId: input.projectId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      error,
    });
    throw error;
  }
}
