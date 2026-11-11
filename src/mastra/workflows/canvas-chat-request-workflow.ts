import { z } from "zod";
import { createStep, createWorkflow } from "@mastra/core/workflows";

import { buildCanvasAgentExecution } from "@/shared/services/canvas-agent/canvas-agent-executor";
import { buildCanvasWorkflowGenerationContext } from "@/shared/services/canvas-agent/canvas-agent-generation-context";
import { submitCanvasWorkflowGeneration } from "@/shared/services/canvas-agent/canvas-agent-generation-submit";
import type { CanvasAgentResolvedSkillContext } from "@/shared/services/canvas-agent/canvas-agent-skill";
import { applyCanvasAgentOperationsToProject } from "@/shared/services/canvas-agent/canvas-agent-write-context";
import type { CanvasAgentOperation } from "@/shared/services/canvas-agent/canvas-agent-plan";

import { runCanvasSupervisorAgent } from "../agents/canvas-supervisor-agent";
import { addCanvasAgentTokenUsage } from "../agents/agent-usage";

const canvasChatRequestInputSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  threadId: z.string(),
  resourceId: z.string(),
  executionMode: z.enum(["ask", "auto"]).default("auto"),
  isFirstTextMessage: z.boolean().optional(),
  skillId: z.string().nullable().optional(),
  skillContext: z
    .object({
      requestedSkillId: z.string().nullable().optional(),
      resolvedSkillId: z.enum([
        "template",
        "commerce-set",
        "poster-design",
        "brand-design",
        "interior-design",
        "social-media",
        "story-short",
        "marketing-video",
        "smart-comic",
        "marketing-poster",
        "product-image-edit",
        "story-video",
      ]),
      routeStrategy: z.enum([
        "explicit",
        "auto-disabled",
        "auto-matched",
        "auto-template",
      ]),
      routeReason: z.string(),
      title: z.string(),
      description: z.string(),
      instructions: z.string(),
    })
    .nullable()
    .optional(),
  message: z.string(),
  requestBaseUrl: z.string().optional(),
  requestCookieHeader: z.string().optional(),
  selectedNodeIds: z.array(z.string()).optional(),
  selectedWorkflowNodes: z
    .array(
      z.object({
        nodeId: z.string(),
        label: z.string(),
        subtype: z.enum([
          "text-to-image",
          "image-to-image",
          "text-to-video",
          "image-to-video",
        ]),
        prompt: z.string().optional(),
      }),
    )
    .optional(),
  editableWorkflowNodes: z
    .array(
      z.object({
        nodeId: z.string(),
        label: z.string(),
        subtype: z.enum([
          "text-to-image",
          "image-to-image",
          "text-to-video",
          "image-to-video",
        ]),
        prompt: z.string().optional(),
      }),
    )
    .optional(),
  contextMessages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  references: z.array(
    z.object({
      assetId: z.string(),
      nodeId: z.string().optional(),
      label: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
});

const canvasChatRequestOutputSchema = z.object({
  assistantMessage: z.string(),
  promptGuideOptions: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        prompt: z.string(),
      }),
    )
    .optional(),
  uiLabels: z
    .object({
      groupLabel: z.string().optional(),
      promptTextLabel: z.string().optional(),
      promptGuideTitle: z.string().optional(),
      promptGuideDescription: z.string().optional(),
      promptGuideCustomLabel: z.string().optional(),
    })
    .optional(),
  needsClarification: z.boolean(),
  mediaIntent: z.enum(["image", "video"]),
  subtype: z.enum([
    "text-to-image",
    "image-to-image",
    "text-to-video",
    "image-to-video",
  ]),
  refinedPrompt: z.string(),
  executionTarget: z.enum(["create-new", "continue-existing"]),
  targetWorkflowNodeId: z.string().optional(),
});

const canvasAgentTokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  reasoningTokens: z.number(),
  totalTokens: z.number(),
});

const canvasChatRequestFinalOutputSchema = canvasChatRequestOutputSchema.extend(
  {
    nextStepTitle: z.string().optional(),
    nextStepDescription: z.string().optional(),
    nextStepOptions: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          prompt: z.string(),
        }),
      )
      .optional(),
    tokenUsage: canvasAgentTokenUsageSchema,
    plan: z.object({
      executionMode: z.enum(["ask", "auto"]),
      mediaIntent: z.enum(["image", "video"]),
      subtype: z.enum([
        "text-to-image",
        "image-to-image",
        "text-to-video",
        "image-to-video",
      ]),
      preferredModelUrl: z.string().optional(),
      executionTarget: z.enum(["create-new", "continue-existing"]).optional(),
      targetWorkflowNodeId: z.string().optional(),
    }),
    operations: z.array(z.any()),
    snapshot: z
      .object({
        id: z.string(),
        version: z.number(),
        graph: z.any(),
      })
      .nullable(),
    tempNodeIdMap: z.record(z.string(), z.string()),
    createdWorkflowNodeIds: z.array(z.string()),
    generationSubmissions: z.array(
      z.object({
        workflowNodeId: z.string(),
        executionMode: z.enum(["server-submitted", "client-deferred"]),
        accepted: z.boolean(),
        mediaIntent: z.enum(["image", "video"]),
        subtype: z.enum([
          "text-to-image",
          "image-to-image",
          "text-to-video",
          "image-to-video",
        ]),
        sceneId: z.string(),
        modelUrl: z.string(),
        requestId: z.string().optional(),
        taskId: z.string().optional(),
        scenario: z.string().optional(),
        directUrl: z.string().optional(),
        outputs: z.array(z.string()).optional(),
        error: z.string().optional(),
      }),
    ),
    preferredModelUrl: z.string().optional(),
    promptRefinementReasoning: z.string(),
    sceneRoutingReasoning: z.string(),
  },
);

const canvasSupervisorStep = createStep({
  id: "canvas-supervisor-step",
  inputSchema: canvasChatRequestInputSchema,
  outputSchema: canvasChatRequestOutputSchema.extend({
    nextStepTitle: z.string().optional(),
    nextStepDescription: z.string().optional(),
    nextStepOptions: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          prompt: z.string(),
        }),
      )
      .optional(),
    tokenUsage: canvasAgentTokenUsageSchema,
    preferredModelUrl: z.string(),
    planningReasoning: z.string(),
    promptRefinementReasoning: z.string(),
    sceneRoutingReasoning: z.string(),
    executionTarget: z.enum(["create-new", "continue-existing"]),
    targetWorkflowNodeId: z.string().optional(),
    userId: z.string(),
    projectId: z.string(),
    threadId: z.string(),
    resourceId: z.string(),
    message: z.string(),
    requestBaseUrl: z.string().optional(),
    requestCookieHeader: z.string().optional(),
    contextMessages: z
      .array(
        z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        }),
      )
      .optional(),
    references: z.array(
      z.object({
        assetId: z.string(),
        nodeId: z.string().optional(),
        label: z.string().optional(),
        url: z.string().optional(),
      }),
    ),
    selectedNodeIds: z.array(z.string()).optional(),
    selectedWorkflowNodes: z
      .array(
        z.object({
          nodeId: z.string(),
          label: z.string(),
          subtype: z.enum([
            "text-to-image",
            "image-to-image",
            "text-to-video",
            "image-to-video",
          ]),
          prompt: z.string().optional(),
        }),
      )
      .optional(),
    editableWorkflowNodes: z
      .array(
        z.object({
          nodeId: z.string(),
          label: z.string(),
          subtype: z.enum([
            "text-to-image",
            "image-to-image",
            "text-to-video",
            "image-to-video",
          ]),
          prompt: z.string().optional(),
        }),
      )
      .optional(),
  }),
  execute: async ({ inputData, writer }) => {
    const result = await runCanvasSupervisorAgent({
      userId: inputData.userId,
      projectId: inputData.projectId,
      threadId: inputData.threadId,
      resourceId: inputData.resourceId,
      executionMode: inputData.executionMode,
      skillId: inputData.skillId || undefined,
      skillContext:
        (inputData.skillContext as CanvasAgentResolvedSkillContext | null) ||
        undefined,
      message: inputData.message,
      references: inputData.references,
      selectedNodeIds: inputData.selectedNodeIds || [],
      selectedWorkflowNodes: inputData.selectedWorkflowNodes || [],
      editableWorkflowNodes: inputData.editableWorkflowNodes || [],
      contextMessages: inputData.contextMessages || [],
    });

    await writer?.write({
      type: "canvas-thinking",
      phase: "supervision",
      reasoning: result.planningReasoning,
      promptRefinementReasoning: result.promptRefinementReasoning,
      sceneRoutingReasoning: result.sceneRoutingReasoning,
      needsClarification: result.needsClarification,
      mediaIntent: result.mediaIntent,
      subtype: result.subtype,
      preferredModelUrl: result.preferredModelUrl,
    });

    return {
      assistantMessage: result.assistantMessage,
      promptGuideOptions: result.promptGuideOptions,
      uiLabels: result.uiLabels,
      needsClarification: result.needsClarification,
      mediaIntent: result.mediaIntent,
      subtype: result.subtype,
      refinedPrompt: result.refinedPrompt,
      nextStepTitle: result.nextStepTitle,
      nextStepDescription: result.nextStepDescription,
      nextStepOptions: result.nextStepOptions,
      tokenUsage: result.usage,
      preferredModelUrl: result.preferredModelUrl,
      executionTarget: result.executionTarget,
      targetWorkflowNodeId: result.targetWorkflowNodeId,
      planningReasoning: result.planningReasoning,
      promptRefinementReasoning: result.promptRefinementReasoning,
      sceneRoutingReasoning: result.sceneRoutingReasoning,
      userId: inputData.userId,
      projectId: inputData.projectId,
      threadId: inputData.threadId,
      resourceId: inputData.resourceId,
      message: inputData.message,
      requestBaseUrl: inputData.requestBaseUrl,
      requestCookieHeader: inputData.requestCookieHeader,
      contextMessages: inputData.contextMessages || [],
      references: inputData.references,
      selectedNodeIds: inputData.selectedNodeIds || [],
      selectedWorkflowNodes: inputData.selectedWorkflowNodes || [],
      editableWorkflowNodes: inputData.editableWorkflowNodes || [],
    };
  },
});

const canvasPersistOperationsStep = createStep({
  id: "canvas-persist-operations-step",
  inputSchema: canvasChatRequestOutputSchema.extend({
    nextStepTitle: z.string().optional(),
    nextStepDescription: z.string().optional(),
    nextStepOptions: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          prompt: z.string(),
        }),
      )
      .optional(),
    tokenUsage: canvasAgentTokenUsageSchema,
    preferredModelUrl: z.string(),
    planningReasoning: z.string(),
    promptRefinementReasoning: z.string(),
    sceneRoutingReasoning: z.string(),
    executionTarget: z.enum(["create-new", "continue-existing"]),
    targetWorkflowNodeId: z.string().optional(),
  }),
  outputSchema: canvasChatRequestFinalOutputSchema,
  execute: async ({ inputData, getInitData }) => {
    const initData = getInitData() as z.infer<
      typeof canvasChatRequestInputSchema
    >;
    const effectiveExecutionMode = initData.executionMode;

    if (inputData.needsClarification) {
      return {
        assistantMessage: inputData.assistantMessage,
        promptGuideOptions: inputData.promptGuideOptions,
        uiLabels: inputData.uiLabels,
        nextStepTitle: inputData.nextStepTitle,
        nextStepDescription: inputData.nextStepDescription,
        nextStepOptions: inputData.nextStepOptions,
        needsClarification: true,
        mediaIntent: inputData.mediaIntent,
        subtype: inputData.subtype,
        refinedPrompt: "",
        executionTarget: inputData.executionTarget,
        targetWorkflowNodeId: inputData.targetWorkflowNodeId,
        tokenUsage: inputData.tokenUsage,
        plan: {
          executionMode: effectiveExecutionMode,
          mediaIntent: inputData.mediaIntent,
          subtype: inputData.subtype,
          preferredModelUrl: inputData.preferredModelUrl,
          executionTarget: inputData.executionTarget,
          targetWorkflowNodeId: inputData.targetWorkflowNodeId,
        },
        operations: [],
        snapshot: null,
        tempNodeIdMap: {},
        createdWorkflowNodeIds: [],
        generationSubmissions: [],
        preferredModelUrl: inputData.preferredModelUrl,
        promptRefinementReasoning: inputData.promptRefinementReasoning,
        sceneRoutingReasoning: inputData.sceneRoutingReasoning,
      };
    }

    const execution = await buildCanvasAgentExecution({
      mediaIntent: inputData.mediaIntent,
      subtype: inputData.subtype,
      prompt: inputData.refinedPrompt,
      preferredModelUrl: inputData.preferredModelUrl,
      references: initData.references,
      executionMode: effectiveExecutionMode,
      includePromptTextNode: Boolean(inputData.refinedPrompt.trim()),
      groupLabel:
        inputData.uiLabels?.groupLabel ||
        (initData.references.length > 0 ? "创作分组" : "生成分组"),
      promptTextLabel: inputData.uiLabels?.promptTextLabel || "提示词",
      executionTarget: inputData.executionTarget,
      targetWorkflowNodeId: inputData.targetWorkflowNodeId,
    });

    const persistedExecution = await applyCanvasAgentOperationsToProject({
      userId: initData.userId,
      projectId: initData.projectId,
      operations: execution.operations,
    });

    const createdWorkflowNodeIds = Object.entries(
      persistedExecution.tempNodeIdMap,
    )
      .filter(([tempId]) => tempId.startsWith("workflow:"))
      .map(([, nodeId]) => nodeId);

    const generationSubmissions: Array<{
      workflowNodeId: string;
      executionMode: "server-submitted" | "client-deferred";
      accepted: boolean;
      mediaIntent: "image" | "video";
      subtype:
        | "text-to-image"
        | "image-to-image"
        | "text-to-video"
        | "image-to-video";
      sceneId: string;
      modelUrl: string;
      requestId?: string;
      taskId?: string;
      scenario?: string;
      directUrl?: string;
      outputs?: string[];
      error?: string;
    }> = [];

    if (
      execution.plan.executionMode === "auto" &&
      createdWorkflowNodeIds.length > 0
    ) {
      const submissions = await Promise.all(
        createdWorkflowNodeIds.map(async (workflowNodeId) => {
          try {
            return await submitCanvasWorkflowGeneration({
              userId: initData.userId,
              projectId: initData.projectId,
              workflowNodeId,
              baseUrl: initData.requestBaseUrl,
              cookieHeader: initData.requestCookieHeader,
            });
          } catch (error) {
            try {
              const context = await buildCanvasWorkflowGenerationContext({
                userId: initData.userId,
                projectId: initData.projectId,
                workflowNodeId,
              });
              return {
                workflowNodeId,
                executionMode: "client-deferred" as const,
                accepted: false,
                mediaIntent: context.mediaIntent,
                subtype: context.subtype,
                sceneId: context.sceneId,
                modelUrl: context.modelUrl,
                error:
                  error instanceof Error ? error.message : "服务端生成提交失败",
              };
            } catch (contextError) {
              return {
                workflowNodeId,
                executionMode: "client-deferred" as const,
                accepted: false,
                mediaIntent: execution.plan.mediaIntent,
                subtype: execution.plan.subtype,
                sceneId: "",
                modelUrl: execution.plan.preferredModelUrl || "",
                error:
                  error instanceof Error
                    ? error.message
                    : contextError instanceof Error
                      ? contextError.message
                      : "服务端生成提交失败",
              };
            }
          }
        }),
      );
      generationSubmissions.push(...submissions);
    }

    return {
      assistantMessage: inputData.assistantMessage,
      promptGuideOptions: inputData.promptGuideOptions,
      uiLabels: inputData.uiLabels,
      nextStepTitle: inputData.nextStepTitle,
      nextStepDescription: inputData.nextStepDescription,
      nextStepOptions: inputData.nextStepOptions,
      needsClarification: inputData.needsClarification,
      mediaIntent: inputData.mediaIntent,
      subtype: inputData.subtype,
      refinedPrompt: inputData.refinedPrompt,
      executionTarget: inputData.executionTarget,
      targetWorkflowNodeId: inputData.targetWorkflowNodeId,
      tokenUsage: addCanvasAgentTokenUsage(inputData.tokenUsage, {
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
      }),
      plan: execution.plan,
      operations: execution.operations,
      snapshot: {
        id: persistedExecution.snapshot.id,
        version: persistedExecution.snapshot.version,
        graph: persistedExecution.snapshot.graph,
      },
      tempNodeIdMap: persistedExecution.tempNodeIdMap,
      createdWorkflowNodeIds,
      generationSubmissions,
      preferredModelUrl: inputData.preferredModelUrl,
      promptRefinementReasoning: inputData.promptRefinementReasoning,
      sceneRoutingReasoning: inputData.sceneRoutingReasoning,
    };
  },
});

export const canvasChatRequestWorkflow = createWorkflow({
  id: "canvas-chat-request-workflow",
  description:
    "Interprets a canvas chat request into one unified model decision and persists the resulting workflow plan.",
  inputSchema: canvasChatRequestInputSchema,
  outputSchema: canvasChatRequestFinalOutputSchema,
})
  .then(canvasSupervisorStep)
  .then(canvasPersistOperationsStep)
  .commit();
