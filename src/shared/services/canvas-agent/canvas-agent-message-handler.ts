import type { CanvasAgentTokenUsage } from "@/mastra/agents/agent-usage";
import { buildCanvasAgentAssistantParts } from "@/shared/lib/canvas-agent-message-cards";
import { respData, respErr } from "@/shared/lib/resp";
import {
  createCanvasChatMessage,
  createOrReuseCanvasChatThread,
  getCanvasChatThreadMessages,
  getWorkbenchCanvasProjectForChat,
  listAccessibleWorkbenchCreationsByIds,
  resolveCanvasAgentMentionedReferences,
  type CanvasAgentMessageAttachmentInput,
} from "@/shared/models/workbench-canvas-chat";
import type {
  CanvasAgentExecutionMode,
  CanvasAgentOperation,
} from "@/shared/services/canvas-agent/canvas-agent-plan";
import {
  type CanvasAgentChatBillingResult,
  consumeCanvasAgentChatCredits,
  refundCanvasAgentChatCredits,
} from "./canvas-agent-billing";
import type { buildCanvasAgentExecution } from "./canvas-agent-executor";
import { isCanvasAgentMastraEnabled } from "./canvas-agent-runtime";
import {
  buildCanvasAgentResolvedSkillContext,
  resolveCanvasAgentSkillSelection,
} from "./canvas-agent-skill";
import { applyCanvasAgentOperationsToProject } from "./canvas-agent-write-context";
import {
  getCanvasAgentSelectionContext,
  listCanvasAgentEditableWorkflowNodes,
} from "./canvas-agent-read-context";

type CanvasAgentRequester = {
  id: string;
  email?: string | null;
};

type HandleCanvasAgentMessageInput = {
  request: Request;
  requester: CanvasAgentRequester;
  body?: unknown;
  requestBaseUrl?: string;
  requestCookieHeader?: string;
  acceptLanguage?: string;
};

async function loadCanvasMastraModule() {
  return import("@/mastra");
}

async function loadCanvasResponseComposerModule() {
  return import("@/mastra/agents/response-composer-agent");
}

function normalizeAttachments(
  value: unknown,
): CanvasAgentMessageAttachmentInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.assetId !== "string" || !candidate.assetId.trim()) {
      return [];
    }

    return [
      {
        assetId: candidate.assetId.trim(),
        kind: "image",
        source:
          candidate.source === "canvas-node" || candidate.source === "history"
            ? candidate.source
            : "upload",
        nodeId:
          typeof candidate.nodeId === "string" ? candidate.nodeId : undefined,
        name: typeof candidate.name === "string" ? candidate.name : undefined,
        url: typeof candidate.url === "string" ? candidate.url : undefined,
        mimeType:
          typeof candidate.mimeType === "string"
            ? candidate.mimeType
            : undefined,
        width:
          typeof candidate.width === "number" ? candidate.width : undefined,
        height:
          typeof candidate.height === "number" ? candidate.height : undefined,
      },
    ];
  });
}

function extractCanvasAgentUpstreamErrorMessage(
  error: unknown,
  isZh: boolean,
): string | null {
  if (!error || typeof error !== "object") return null;

  const candidate = error as {
    message?: unknown;
    statusCode?: unknown;
    responseBody?: unknown;
    cause?: unknown;
  };

  const directMessage =
    typeof candidate.message === "string" ? candidate.message : "";
  const responseBody =
    typeof candidate.responseBody === "string" ? candidate.responseBody : "";
  const normalized = `${directMessage}\n${responseBody}`;

  if (!normalized.trim()) return null;

  const invalidSkillMetadata =
    /Invalid skill metadata|Expected string, received undefined|WorkspaceSkills/i.test(
      normalized,
    );
  if (invalidSkillMetadata) {
    return isZh
      ? "智能体技能配置无效，当前会话已回退到基础流程，请稍后修复技能配置后再试。"
      : "The agent skill configuration is invalid. The request fell back to the basic flow. Please fix the skill configuration and try again.";
  }

  const tosViolation = /Terms Of Service|violation of provider Terms/i.test(
    normalized,
  );
  if (tosViolation) {
    return isZh
      ? "上游模型服务拒绝了这次请求，原因是触发了服务方的使用策略限制。"
      : "The upstream model service rejected this request due to provider usage policy restrictions.";
  }

  if (/403/.test(normalized)) {
    return isZh
      ? "上游模型服务拒绝了这次请求，请稍后重试或调整输入内容。"
      : "The upstream model service rejected this request. Please try again later or adjust the input.";
  }

  return isZh
    ? `上游模型服务异常：${directMessage || "请求失败"}`
    : `Upstream model service error: ${directMessage || "Request failed"}`;
}

function extractCanvasAgentVisibleErrorMessage(error: unknown, isZh: boolean) {
  const normalizedUpstream = extractCanvasAgentUpstreamErrorMessage(
    error,
    isZh,
  );
  if (normalizedUpstream) return normalizedUpstream;

  if (!error || typeof error !== "object") {
    return isZh
      ? "智能体执行失败，请稍后再试。"
      : "The agent failed to run. Please try again.";
  }

  const candidate = error as {
    message?: unknown;
  };
  const directMessage =
    typeof candidate.message === "string" ? candidate.message.trim() : "";

  if (!directMessage) {
    return isZh
      ? "智能体执行失败，请稍后再试。"
      : "The agent failed to run. Please try again.";
  }

  if (/ZodError|validation failed|Expected .* received/i.test(directMessage)) {
    return isZh
      ? `智能体返回的数据格式不符合预期：${directMessage}`
      : `The agent returned data in an unexpected format: ${directMessage}`;
  }

  return directMessage;
}

function isCanvasAgentContextEligibleMessage(input: {
  role: string;
  content: string;
  status?: string;
  errorMessage?: string;
}) {
  const content = input.content.trim();
  if (!content) return false;

  if (input.role !== "assistant") {
    return (
      input.role === "user" ||
      input.role === "system" ||
      input.role === "assistant"
    );
  }

  if (input.status === "failed" || Boolean(input.errorMessage?.trim())) {
    return false;
  }

  return true;
}

function buildCanvasAgentContextMessages(
  messages:
    | Array<{
        role: string;
        content: string;
        status?: string;
        errorMessage?: string;
      }>
    | null
    | undefined,
) {
  return (messages || [])
    .filter((historyMessage) =>
      isCanvasAgentContextEligibleMessage({
        role: historyMessage.role,
        content: historyMessage.content,
        status: historyMessage.status,
        errorMessage: historyMessage.errorMessage,
      }),
    )
    .slice(-12)
    .map((historyMessage) => ({
      role: historyMessage.role as "system" | "user" | "assistant",
      content: historyMessage.content,
    }));
}

function buildCanvasAgentNodeSummaries(input: {
  operations: CanvasAgentOperation[];
  tempNodeIdMap: Record<string, string>;
}): Array<{
  nodeId: string;
  label: string;
  kind: "text" | "input" | "workflow";
  badge?: string;
}> {
  return input.operations.flatMap<{
    nodeId: string;
    label: string;
    kind: "text" | "input" | "workflow";
    badge?: string;
  }>((operation) => {
    if (operation.type === "create-text") {
      const nodeId = input.tempNodeIdMap[operation.tempId];
      if (!nodeId) return [];
      return [
        {
          nodeId,
          label: operation.label,
          kind: "text" as const,
          badge: "文生文",
        },
      ];
    }

    if (operation.type === "create-input") {
      const nodeId = input.tempNodeIdMap[operation.tempId];
      if (!nodeId) return [];
      return [
        {
          nodeId,
          label: operation.label,
          kind: "input" as const,
          badge: "文生图",
        },
      ];
    }

    if (operation.type === "create-workflow") {
      const nodeId = input.tempNodeIdMap[operation.tempId];
      if (!nodeId) return [];
      return [
        {
          nodeId,
          label:
            operation.subtype === "text-to-video"
              ? "视频工作流"
              : operation.subtype === "image-to-video"
                ? "图生视频工作流"
                : operation.subtype === "image-to-image"
                  ? "图生图工作流"
                  : "图片工作流",
          kind: "workflow" as const,
          badge:
            operation.subtype === "text-to-video" ||
            operation.subtype === "image-to-video"
              ? "文生视频"
              : "文生图",
        },
      ];
    }

    if (operation.type === "update-workflow") {
      return [
        {
          nodeId: operation.nodeId,
          label:
            operation.subtype === "text-to-video"
              ? "继续编辑视频工作流"
              : operation.subtype === "image-to-video"
                ? "继续编辑图生视频工作流"
                : operation.subtype === "image-to-image"
                  ? "继续编辑图生图工作流"
                  : "继续编辑图片工作流",
          kind: "workflow" as const,
          badge: "继续编辑",
        },
      ];
    }

    return [];
  });
}

function createCanvasAgentEventStream() {
  const encoder = new TextEncoder();

  return new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk));
    },
  });
}

function writeCanvasAgentSseEvent(
  writer: WritableStreamDefaultWriter<string>,
  event: string,
  data: unknown,
) {
  return writer.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleCanvasAgentMessage(
  input: HandleCanvasAgentMessageInput,
) {
  let chargedBilling: CanvasAgentChatBillingResult | null = null;
  let chargedUserId = input.requester.id;
  let chargedUserEmail = input.requester.email;
  let chargedProjectId = "";
  let chargedThreadId = "";
  let chargedMessageId: string | undefined;
  let chargedSkillId: string | undefined;
  let assistantPersisted = false;

  try {
    const body =
      input.body ?? (await input.request.json().catch(() => ({}) as unknown));
    const isZh =
      input.acceptLanguage?.toLowerCase().includes("zh") ??
      input.request.headers
        .get("accept-language")
        ?.toLowerCase()
        .includes("zh") ??
      true;
    const projectId =
      typeof (body as any)?.projectId === "string"
        ? (body as any).projectId.trim()
        : "";
    const message =
      typeof (body as any)?.message === "string"
        ? (body as any).message.trim()
        : "";
    const requestedThreadId =
      typeof (body as any)?.threadId === "string"
        ? (body as any).threadId.trim()
        : "";
    const executionMode =
      (body as any)?.executionMode === "ask" ? "ask" : "auto";
    const clientMessageId =
      typeof (body as any)?.messageId === "string"
        ? (body as any).messageId.trim()
        : undefined;
    const skillId =
      typeof (body as any)?.skillId === "string"
        ? (body as any).skillId.trim()
        : undefined;
    const selectedNodeIds = Array.isArray((body as any)?.selection?.nodeIds)
      ? (body as any).selection.nodeIds.filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];
    const attachments = normalizeAttachments((body as any)?.attachments);
    const skillSelection = resolveCanvasAgentSkillSelection({
      requestedSkillId: skillId,
      message,
      referencesCount: attachments.length,
      autoRoutingEnabled: true,
    });
    const skillContext = buildCanvasAgentResolvedSkillContext({
      requestedSkillId: skillId,
      message,
      referencesCount: attachments.length,
      autoRoutingEnabled: true,
    });

    if (!projectId) {
      return respErr("projectId is required");
    }
    if (!message) {
      return respErr("message is required");
    }

    const project = await getWorkbenchCanvasProjectForChat(
      projectId,
      input.requester.id,
    );
    if (!project) {
      return respErr("canvas project not found");
    }

    const thread = await createOrReuseCanvasChatThread({
      userId: input.requester.id,
      projectId,
      threadId: requestedThreadId || null,
    });
    chargedProjectId = projectId;
    chargedThreadId = thread.id;
    chargedMessageId = clientMessageId;
    chargedSkillId = skillId;

    const assetIds = attachments.map((item) => item.assetId);
    const accessibleAssets = await listAccessibleWorkbenchCreationsByIds(
      input.requester.id,
      assetIds,
    );
    const accessibleAssetIds = new Set(accessibleAssets.map((item) => item.id));
    const invalidAsset = attachments.find(
      (item) => !accessibleAssetIds.has(item.assetId),
    );

    if (invalidAsset) {
      return respErr(`attachment asset not found: ${invalidAsset.assetId}`);
    }

    const resolvedReferences = await resolveCanvasAgentMentionedReferences({
      userId: input.requester.id,
      projectId,
      content: message,
      attachments,
    });
    const threadHistory = await getCanvasChatThreadMessages(
      thread.id,
      input.requester.id,
    );
    const selectionContext = await getCanvasAgentSelectionContext({
      userId: input.requester.id,
      projectId,
      selectedNodeIds,
    });
    const editableWorkflowNodes = await listCanvasAgentEditableWorkflowNodes({
      userId: input.requester.id,
      projectId,
    });
    const isFirstTextMessage = !(threadHistory?.messages || []).some(
      (item) => item.role === "user" && item.content.trim().length > 0,
    );

    const referenceTargets = [
      ...attachments.map((attachment) => ({
        assetId: attachment.assetId,
        nodeId: attachment.nodeId,
        label: attachment.name || "参考图",
        url: attachment.url,
      })),
      ...resolvedReferences
        .filter((reference) => reference.resolveStatus === "resolved")
        .map((reference) => ({
          assetId: reference.targetAssetId || "",
          nodeId: reference.targetNodeId,
          label: reference.snapshot?.label || reference.mentionText,
          url: reference.snapshot?.thumbnailUrl,
        })),
    ].filter((item) => item.assetId);

    const seenAssetIds = new Set<string>();
    const dedupedReferences = referenceTargets.filter((item) => {
      if (!item.assetId || seenAssetIds.has(item.assetId)) return false;
      seenAssetIds.add(item.assetId);
      return true;
    });

    const requestBaseUrl =
      input.requestBaseUrl || new URL(input.request.url).origin;
    const requestCookieHeader =
      input.requestCookieHeader ||
      input.request.headers.get("cookie") ||
      undefined;

    if (isCanvasAgentMastraEnabled()) {
      const { readable, writable } = createCanvasAgentEventStream();
      const writer = writable.getWriter();
      const streamDebugId = `canvas-agent-stream:${projectId}:${thread.id}:${Date.now()}`;

      void (async () => {
        try {
          console.time(streamDebugId);
          console.log("[canvas-agent][stream] start", {
            streamDebugId,
            projectId,
            threadId: thread.id,
            messageLength: message.length,
          });

          await writeCanvasAgentSseEvent(writer, "start", {
            threadId: thread.id,
            projectId,
          });

          const { streamCanvasAgentMessageWithMastra } =
            await loadCanvasMastraModule();
          const { stream, fullStream } =
            await streamCanvasAgentMessageWithMastra({
              userId: input.requester.id,
              projectId,
              threadId: thread.id,
              resourceId: `canvas-project:${projectId}`,
              skillId: skillSelection.resolvedSkillId || skillId,
              skillContext,
              message,
              requestBaseUrl,
              requestCookieHeader,
              contextMessages: buildCanvasAgentContextMessages(
                threadHistory?.messages,
              ),
              references: dedupedReferences,
              selectedNodeIds,
              selectedWorkflowNodes: selectionContext.nodes
                .filter((node) => node.kind === "workflow")
                .map((node) => ({
                  nodeId: node.nodeId,
                  label: node.label,
                  subtype:
                    node.subtype === "image-to-image" ||
                    node.subtype === "text-to-video" ||
                    node.subtype === "image-to-video"
                      ? node.subtype
                      : "text-to-image",
                  prompt: node.prompt,
                })),
              editableWorkflowNodes,
              executionMode,
              isFirstTextMessage,
            });

          const reader = fullStream.getReader();
          let readerCancelled = false;
          const readingPromise = (async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const event = value as
                  | {
                      type?: string;
                      payload?: {
                        output?: {
                          type?: string;
                          phase?: string;
                          reasoning?: string;
                          refinedPrompt?: string;
                          preferredModelUrl?: string;
                        };
                      };
                    }
                  | undefined;

                const output = event?.payload?.output;
                if (
                  event?.type === "workflow-step-output" &&
                  output?.type === "canvas-thinking"
                ) {
                  await writeCanvasAgentSseEvent(writer, "thinking", output);
                }
              }
            } finally {
              reader.releaseLock();
            }
          })();

          const streamResult = await (
            stream as ReadableStream<unknown> & {
              result?: Promise<
                | {
                    status: "success" | "failed" | "tripwire" | "suspended";
                    result?: {
                      assistantMessage: string;
                      promptGuideOptions?: Array<{
                        id: string;
                        title: string;
                        description: string;
                        prompt: string;
                      }>;
                      nextStepTitle?: string;
                      nextStepDescription?: string;
                      nextStepOptions?: Array<{
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
                      tokenUsage: CanvasAgentTokenUsage;
                      plan: {
                        executionMode: CanvasAgentExecutionMode;
                        mediaIntent: "image" | "video";
                        subtype:
                          | "text-to-image"
                          | "image-to-image"
                          | "text-to-video"
                          | "image-to-video";
                        preferredModelUrl?: string;
                      };
                      operations: Awaited<
                        ReturnType<typeof buildCanvasAgentExecution>
                      >["operations"];
                      snapshot: {
                        id: string;
                        version: number;
                        graph: unknown;
                      } | null;
                      tempNodeIdMap: Record<string, string>;
                      createdWorkflowNodeIds: string[];
                      generationSubmissions: Array<{
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
                      }>;
                    };
                    error?: Error;
                  }
                | undefined
              >;
            }
          ).result;

          if (!readerCancelled) {
            readerCancelled = true;
            try {
              await reader.cancel();
            } catch {}
          }

          await readingPromise.catch(() => {});

          if (
            !streamResult ||
            streamResult.status !== "success" ||
            !streamResult.result
          ) {
            throw new Error(
              streamResult?.error?.message ||
                "Mastra workflow failed to complete successfully",
            );
          }

          const mastraResult = streamResult.result;
          const assistantText = mastraResult.assistantMessage;
          const promptGuideOptions = mastraResult.promptGuideOptions;
          const nextStepTitle = mastraResult.nextStepTitle;
          const nextStepDescription = mastraResult.nextStepDescription;
          const nextStepOptions = mastraResult.nextStepOptions;
          const uiLabels = mastraResult.uiLabels;
          const tokenUsage = mastraResult.tokenUsage;
          const execution = {
            plan: mastraResult.plan,
            operations: mastraResult.operations,
          };
          const persistedSnapshot = mastraResult.snapshot;
          const tempNodeIdMap = mastraResult.tempNodeIdMap;
          const createdWorkflowNodeIds = mastraResult.createdWorkflowNodeIds;
          const generationSubmissions = mastraResult.generationSubmissions;

          chargedBilling = await consumeCanvasAgentChatCredits({
            userId: input.requester.id,
            userEmail: input.requester.email,
            projectId,
            threadId: thread.id,
            messageId: clientMessageId,
            skillId,
            selectedNodeIds,
            tokenUsage,
          });

          const nodeSummaries = buildCanvasAgentNodeSummaries({
            operations: execution.operations,
            tempNodeIdMap,
          });
          const promptGuideCard =
            Array.isArray(promptGuideOptions) && promptGuideOptions.length > 0
              ? {
                  kind: "prompt-guide" as const,
                  cardId: `prompt-guide:${execution.plan.mediaIntent}:${thread.id}`,
                  title: uiLabels?.promptGuideTitle || message.trim(),
                  description: uiLabels?.promptGuideDescription,
                  options: promptGuideOptions,
                  customPromptLabel: uiLabels?.promptGuideCustomLabel,
                }
              : Array.isArray(nextStepOptions) && nextStepOptions.length > 0
                ? {
                    kind: "prompt-guide" as const,
                    cardId: `next-step:${execution.plan.mediaIntent}:${thread.id}`,
                    title:
                      nextStepTitle ||
                      (isZh ? "接下来你还可以继续" : "You can continue with"),
                    description: nextStepDescription,
                    options: nextStepOptions,
                    customPromptLabel: isZh
                      ? "我有别的想法"
                      : "I have another idea",
                  }
                : null;
          const groupLabel =
            execution.operations.find(
              (operation) => operation.type === "create-group",
            )?.label || "";

          const userMessage = await createCanvasChatMessage({
            userId: input.requester.id,
            projectId,
            threadId: thread.id,
            role: "user",
            content: message,
            clientMessageId,
            attachments,
            mentionedReferences: resolvedReferences,
            billing: chargedBilling,
          });

          const assistantMessage = await createCanvasChatMessage({
            userId: input.requester.id,
            projectId,
            threadId: thread.id,
            role: "assistant",
            status: "completed",
            content: assistantText,
            parts: buildCanvasAgentAssistantParts({
              content: assistantText,
              executionMode: execution.plan.executionMode,
              mediaIntent: execution.plan.mediaIntent,
              subtype: execution.plan.subtype,
              preferredModelUrl: execution.plan.preferredModelUrl,
              prompt:
                execution.operations.find(
                  (
                    operation,
                  ): operation is Extract<
                    CanvasAgentOperation,
                    { type: "create-text" }
                  > => operation.type === "create-text",
                )?.content || message,
              workflowNodeIds: createdWorkflowNodeIds,
              groupLabel,
              nodeSummaries,
              promptGuideCard,
            }),
            attachments: [],
            mentionedReferences: resolvedReferences,
            operations: execution.operations,
            billing: chargedBilling,
            errorMessage: null,
            generation: {
              status: generationSubmissions.some((item) => item.accepted)
                ? "submitted"
                : "idle",
              taskId: generationSubmissions.find((item) => item.requestId)
                ?.requestId,
            },
          });
          assistantPersisted = true;

          const assistantParts = buildCanvasAgentAssistantParts({
            content: assistantText,
            executionMode: execution.plan.executionMode,
            mediaIntent: execution.plan.mediaIntent,
            subtype: execution.plan.subtype,
            preferredModelUrl: execution.plan.preferredModelUrl,
            prompt:
              execution.operations.find(
                (
                  operation,
                ): operation is Extract<
                  CanvasAgentOperation,
                  { type: "create-text" }
                > => operation.type === "create-text",
              )?.content || message,
            workflowNodeIds: createdWorkflowNodeIds,
            groupLabel,
            nodeSummaries,
            promptGuideCard,
          });

          await writeCanvasAgentSseEvent(writer, "final", {
            code: 0,
            data: {
              threadId: thread.id,
              projectId,
              skillId: skillSelection.resolvedSkillId || skillId || null,
              skillSelection,
              userMessageId: userMessage.id,
              assistantMessageId: assistantMessage.id,
              assistantMessage: assistantText,
              assistantParts,
              attachments,
              mentionedReferences: resolvedReferences,
              plan: execution.plan,
              operations: execution.operations,
              snapshot: persistedSnapshot
                ? {
                    id: persistedSnapshot.id,
                    version: persistedSnapshot.version,
                    graph: persistedSnapshot.graph,
                  }
                : null,
              tempNodeIdMap,
              createdWorkflowNodeIds,
              generation: {
                status: generationSubmissions.some((item) => item.accepted)
                  ? "submitted"
                  : "idle",
                submissions: generationSubmissions,
              },
              billing: chargedBilling,
            },
          });
        } catch (error: any) {
          if (
            chargedBilling?.charged &&
            !assistantPersisted &&
            chargedBilling.chatCredits > 0 &&
            chargedUserId &&
            chargedProjectId &&
            chargedThreadId
          ) {
            try {
              chargedBilling = await refundCanvasAgentChatCredits({
                userId: chargedUserId,
                userEmail: chargedUserEmail,
                projectId: chargedProjectId,
                threadId: chargedThreadId,
                messageId: chargedMessageId,
                skillId: chargedSkillId,
                chatCredits: chargedBilling.chatCredits,
                tokenUsage: chargedBilling.tokenUsage,
                estimatedCostUsd: chargedBilling.estimatedCostUsd,
                creditUnitPriceUsd: chargedBilling.creditUnitPriceUsd,
                appliedProfitMargin: chargedBilling.appliedProfitMargin,
                minimumCredits: chargedBilling.minimumCredits,
                pricingStrategy: chargedBilling.pricingStrategy,
                reason: "Refund for failed canvas agent chat request",
              });
            } catch (refundError) {
              console.error(
                "[canvas-agent] failed to refund chat credits after message failure:",
                refundError,
              );
            }
          }

          await writeCanvasAgentSseEvent(writer, "error", {
            message:
              extractCanvasAgentVisibleErrorMessage(error, isZh) ||
              "failed to send canvas agent message",
          });
        } finally {
          console.timeEnd(streamDebugId);
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    let assistantText = "";
    let execution: {
      plan: {
        executionMode: CanvasAgentExecutionMode;
        mediaIntent: "image" | "video";
        subtype:
          | "text-to-image"
          | "image-to-image"
          | "text-to-video"
          | "image-to-video";
        preferredModelUrl?: string;
      };
      operations: Awaited<
        ReturnType<typeof buildCanvasAgentExecution>
      >["operations"];
    };
    let persistedSnapshot: {
      id: string;
      version: number;
      graph: unknown;
    } | null = null;
    let tempNodeIdMap: Record<string, string> = {};
    let createdWorkflowNodeIds: string[] = [];
    let generationSubmissions: Array<{
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
    let shouldPersistExecutionLocally = true;
    let tokenUsage: CanvasAgentTokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    };
    let promptGuideOptions:
      | Array<{
          id: string;
          title: string;
          description: string;
          prompt: string;
        }>
      | undefined;
    let nextStepTitle: string | undefined;
    let nextStepDescription: string | undefined;
    let nextStepOptions:
      | Array<{
          id: string;
          title: string;
          description: string;
          prompt: string;
        }>
      | undefined;
    let uiLabels:
      | {
          groupLabel?: string;
          promptTextLabel?: string;
          promptGuideTitle?: string;
          promptGuideDescription?: string;
          promptGuideCustomLabel?: string;
        }
      | undefined;
    let upstreamWarningMessage: string | null = null;
    let shouldStopExecutionAfterUpstreamError = false;

    try {
      if (!isCanvasAgentMastraEnabled()) {
        throw new Error("Mastra is disabled by CANVAS_AGENT_ENABLE_MASTRA");
      }

      const { runCanvasAgentMessageWithMastra } =
        await loadCanvasMastraModule();
      const mastraResult = await runCanvasAgentMessageWithMastra({
        userId: input.requester.id,
        projectId,
        threadId: thread.id,
        resourceId: `canvas-project:${projectId}`,
        skillId: skillSelection.resolvedSkillId || skillId,
        skillContext,
        message,
        requestBaseUrl,
        requestCookieHeader,
        contextMessages: buildCanvasAgentContextMessages(
          threadHistory?.messages,
        ),
        references: dedupedReferences,
        selectedNodeIds,
        selectedWorkflowNodes: selectionContext.nodes
          .filter((node) => node.kind === "workflow")
          .map((node) => ({
            nodeId: node.nodeId,
            label: node.label,
            subtype:
              node.subtype === "image-to-image" ||
              node.subtype === "text-to-video" ||
              node.subtype === "image-to-video"
                ? node.subtype
                : "text-to-image",
            prompt: node.prompt,
          })),
        editableWorkflowNodes,
        executionMode,
        isFirstTextMessage,
      });
      assistantText = mastraResult.assistantMessage;
      promptGuideOptions = mastraResult.promptGuideOptions;
      nextStepTitle = mastraResult.nextStepTitle;
      nextStepDescription = mastraResult.nextStepDescription;
      nextStepOptions = mastraResult.nextStepOptions;
      uiLabels = mastraResult.uiLabels;
      tokenUsage = mastraResult.tokenUsage;
      execution = {
        plan: mastraResult.plan,
        operations: mastraResult.operations,
      };
      persistedSnapshot = mastraResult.snapshot;
      tempNodeIdMap = mastraResult.tempNodeIdMap;
      createdWorkflowNodeIds = mastraResult.createdWorkflowNodeIds;
      generationSubmissions = mastraResult.generationSubmissions;
      shouldPersistExecutionLocally = false;
    } catch (mastraError) {
      console.error(
        "[canvas-agent] mastra execution failed, fallback to local planner:",
        mastraError,
      );
      upstreamWarningMessage = extractCanvasAgentUpstreamErrorMessage(
        mastraError,
        isZh,
      );
      shouldStopExecutionAfterUpstreamError = true;
      assistantText =
        upstreamWarningMessage ||
        (isZh
          ? "智能体规划失败，未执行本地兜底推断，请稍后重试。"
          : "The agent planning step failed and no local heuristic fallback was executed. Please try again.");
      execution = {
        plan: {
          executionMode,
          mediaIntent: "image",
          subtype: "text-to-image",
        },
        operations: [],
      };
      shouldPersistExecutionLocally = false;
    }

    if (
      !shouldStopExecutionAfterUpstreamError &&
      execution.operations.length > 0 &&
      (!Array.isArray(promptGuideOptions) || promptGuideOptions.length === 0)
    ) {
      try {
        const { runCanvasResponseComposerAgent } =
          await loadCanvasResponseComposerModule();
        const ensuredResponseComposerResult =
          await runCanvasResponseComposerAgent({
            userId: input.requester.id,
            projectId,
            threadId: thread.id,
            resourceId: `canvas-project:${projectId}`,
            message,
            references: dedupedReferences,
            plan: {
              needsClarification: false,
              mediaIntent: execution.plan.mediaIntent,
              subtype: execution.plan.subtype,
              reasoning: "",
            },
            contextMessages: buildCanvasAgentContextMessages(
              threadHistory?.messages,
            ),
            selectedWorkflowNodes: selectionContext.nodes
              .filter((node) => node.kind === "workflow")
              .map((node) => ({
                nodeId: node.nodeId,
                label: node.label,
                subtype:
                  node.subtype === "image-to-image" ||
                  node.subtype === "text-to-video" ||
                  node.subtype === "image-to-video"
                    ? node.subtype
                    : "text-to-image",
                prompt: node.prompt,
              })),
            editableWorkflowNodes,
          });

        if (!assistantText.trim()) {
          assistantText = ensuredResponseComposerResult.assistantMessage;
        }
        if (
          Array.isArray(ensuredResponseComposerResult.promptGuideOptions) &&
          ensuredResponseComposerResult.promptGuideOptions.length > 0
        ) {
          promptGuideOptions = ensuredResponseComposerResult.promptGuideOptions;
        }
        uiLabels = {
          ...uiLabels,
          ...ensuredResponseComposerResult.uiLabels,
        };
      } catch {}
    }

    if (upstreamWarningMessage && !assistantText.trim()) {
      assistantText = upstreamWarningMessage;
    }

    chargedBilling = await consumeCanvasAgentChatCredits({
      userId: input.requester.id,
      userEmail: input.requester.email,
      projectId,
      threadId: thread.id,
      messageId: clientMessageId,
      skillId,
      selectedNodeIds,
      tokenUsage,
    });

    if (shouldPersistExecutionLocally) {
      const persistedExecution = await applyCanvasAgentOperationsToProject({
        userId: input.requester.id,
        projectId,
        operations: execution.operations,
      });
      persistedSnapshot = persistedExecution.snapshot;
      tempNodeIdMap = persistedExecution.tempNodeIdMap;
      createdWorkflowNodeIds = Object.entries(tempNodeIdMap)
        .filter(([tempId]) => tempId.startsWith("workflow:"))
        .map(([, nodeId]) => nodeId);
    }

    const nodeSummaries = buildCanvasAgentNodeSummaries({
      operations: execution.operations,
      tempNodeIdMap,
    });
    const promptGuideCard =
      Array.isArray(promptGuideOptions) && promptGuideOptions.length > 0
        ? {
            kind: "prompt-guide" as const,
            cardId: `prompt-guide:${execution.plan.mediaIntent}:${thread.id}`,
            title: uiLabels?.promptGuideTitle || message.trim(),
            description: uiLabels?.promptGuideDescription,
            options: promptGuideOptions,
            customPromptLabel: uiLabels?.promptGuideCustomLabel,
          }
        : Array.isArray(nextStepOptions) && nextStepOptions.length > 0
          ? {
              kind: "prompt-guide" as const,
              cardId: `next-step:${execution.plan.mediaIntent}:${thread.id}`,
              title:
                nextStepTitle ||
                (isZh ? "接下来你还可以继续" : "You can continue with"),
              description: nextStepDescription,
              options: nextStepOptions,
              customPromptLabel: isZh ? "我有别的想法" : "I have another idea",
            }
          : null;
    const groupLabel =
      execution.operations.find(
        (operation) => operation.type === "create-group",
      )?.label || "";

    const userMessage = await createCanvasChatMessage({
      userId: input.requester.id,
      projectId,
      threadId: thread.id,
      role: "user",
      content: message,
      clientMessageId,
      attachments,
      mentionedReferences: resolvedReferences,
      billing: chargedBilling,
    });

    const assistantMessage = await createCanvasChatMessage({
      userId: input.requester.id,
      projectId,
      threadId: thread.id,
      role: "assistant",
      status: shouldStopExecutionAfterUpstreamError ? "failed" : "completed",
      content: assistantText,
      parts: buildCanvasAgentAssistantParts({
        content: assistantText,
        executionMode: execution.plan.executionMode,
        mediaIntent: execution.plan.mediaIntent,
        subtype: execution.plan.subtype,
        preferredModelUrl: execution.plan.preferredModelUrl,
        prompt:
          execution.operations.find(
            (
              operation,
            ): operation is Extract<
              CanvasAgentOperation,
              { type: "create-text" }
            > => operation.type === "create-text",
          )?.content || message,
        workflowNodeIds: createdWorkflowNodeIds,
        groupLabel,
        nodeSummaries,
        promptGuideCard,
      }),
      attachments: [],
      mentionedReferences: resolvedReferences,
      operations: execution.operations,
      billing: chargedBilling,
      errorMessage: shouldStopExecutionAfterUpstreamError
        ? upstreamWarningMessage || assistantText
        : null,
      generation: {
        status: generationSubmissions.some((item) => item.accepted)
          ? "submitted"
          : "idle",
        taskId: generationSubmissions.find((item) => item.requestId)?.requestId,
      },
    });
    assistantPersisted = true;

    const assistantParts = buildCanvasAgentAssistantParts({
      content: assistantText,
      executionMode: execution.plan.executionMode,
      mediaIntent: execution.plan.mediaIntent,
      subtype: execution.plan.subtype,
      preferredModelUrl: execution.plan.preferredModelUrl,
      prompt:
        execution.operations.find(
          (
            operation,
          ): operation is Extract<
            CanvasAgentOperation,
            { type: "create-text" }
          > => operation.type === "create-text",
        )?.content || message,
      workflowNodeIds: createdWorkflowNodeIds,
      groupLabel,
      nodeSummaries,
      promptGuideCard,
    });

    return respData({
      threadId: thread.id,
      projectId,
      skillId: skillSelection.resolvedSkillId || skillId || null,
      skillSelection,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      assistantMessage: assistantText,
      assistantParts,
      attachments,
      mentionedReferences: resolvedReferences,
      plan: execution.plan,
      operations: execution.operations,
      snapshot: persistedSnapshot
        ? {
            id: persistedSnapshot.id,
            version: persistedSnapshot.version,
            graph: persistedSnapshot.graph,
          }
        : null,
      tempNodeIdMap,
      createdWorkflowNodeIds,
      generation: {
        status: generationSubmissions.some((item) => item.accepted)
          ? "submitted"
          : "idle",
        submissions: generationSubmissions,
      },
      billing: chargedBilling,
    });
  } catch (error: any) {
    if (
      chargedBilling?.charged &&
      !assistantPersisted &&
      chargedBilling.chatCredits > 0 &&
      chargedUserId &&
      chargedProjectId &&
      chargedThreadId
    ) {
      try {
        chargedBilling = await refundCanvasAgentChatCredits({
          userId: chargedUserId,
          userEmail: chargedUserEmail,
          projectId: chargedProjectId,
          threadId: chargedThreadId,
          messageId: chargedMessageId,
          skillId: chargedSkillId,
          chatCredits: chargedBilling.chatCredits,
          tokenUsage: chargedBilling.tokenUsage,
          estimatedCostUsd: chargedBilling.estimatedCostUsd,
          creditUnitPriceUsd: chargedBilling.creditUnitPriceUsd,
          appliedProfitMargin: chargedBilling.appliedProfitMargin,
          minimumCredits: chargedBilling.minimumCredits,
          pricingStrategy: chargedBilling.pricingStrategy,
          reason: "Refund for failed canvas agent chat request",
        });
      } catch (refundError) {
        console.error(
          "[canvas-agent] failed to refund chat credits after message failure:",
          refundError,
        );
      }
    }
    const isZh =
      input.acceptLanguage?.toLowerCase().includes("zh") ??
      input.request.headers
        .get("accept-language")
        ?.toLowerCase()
        .includes("zh") ??
      true;
    return respErr(
      extractCanvasAgentVisibleErrorMessage(error, isZh) ||
        "failed to send canvas agent message",
    );
  }
}
