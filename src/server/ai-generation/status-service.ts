import { respData, respErr } from "@/shared/lib/resp";
import { calculateRequiredCredits } from "@/config/credit-config";
import {
  findProviderForScenario,
  getStatusQueryConfig,
  getProviderConfigAsync,
} from "@/config/pricing-config";
import { getAllConfigs } from "@/shared/models/config";
import { getOrdersCount, OrderStatus } from "@/shared/models/order";
import { getPricingConfigFromDB } from "@/shared/models/pricing-config";
import { getCurrentSubscription } from "@/shared/models/subscription";
import { refundWavespeedCredits } from "@/app/api/utils";
import { updateAITaskById } from "@/shared/models/ai_task";
import { updateAICharacterByProviderTaskId } from "@/shared/models/ai_character";
import { updateAICharacterHistorySnapshot } from "@/shared/models/ai_character_history";
import { updateAICharacterPerspectiveByProviderTaskId } from "@/shared/models/ai_character_perspective";
import { findUserById, getUserInfo } from "@/shared/models/user";
import { AITaskStatus } from "@/extensions/ai";
import { db } from "@/core/db";
import { aiTask } from "@/config/db/schema";
import { eq } from "drizzle-orm";
import {
  getNestedValue,
  isFailureStatus,
  isSuccessStatus,
  normalizeStatusForClient,
  parseTaskOptions,
  parseTaskResult,
} from "@/server/ai-generation/result-mapping";
import {
  humanizeSlug,
  persistSuccessfulOutputsToCreations,
  resolveCreationRecordsByUrls,
} from "@/server/ai-generation/workbench-output";
import {
  checkOutputsForNsfw,
  isImageLikeUrl,
  isVideoLikeUrl,
} from "@/shared/lib/nsfw-output-check";
import { shouldRunOutputNsfwCheck } from "@/shared/lib/nsfw-policy";
import { persistGeneratedOutputsToR2 } from "@/shared/lib/generated-output-r2";

const NSFW_BLOCKED_ERROR_CODE = "NSFW_BLOCKED";
const RETRIABLE_NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function mapStatusScenario(scene?: string | null) {
  if (!scene) {
    return scene;
  }

  if (scene === "video-effect-ai-bikini") {
    return "image-to-video-wan-2-7";
  }

  return scene;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: any): string | undefined {
  return error?.code || error?.cause?.code;
}

function isRetriableNetworkError(error: any): boolean {
  if (!error) return false;

  const code = getErrorCode(error);
  if (code && RETRIABLE_NETWORK_ERROR_CODES.has(code)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  const causeMessage = String(error?.cause?.message || "").toLowerCase();
  const combined = `${message} ${causeMessage}`;

  return (
    combined.includes("fetch failed") ||
    combined.includes("network socket disconnected") ||
    combined.includes("tls connection was established") ||
    combined.includes("socket hang up")
  );
}

function extractFallbackErrorMessage(result: any) {
  return (
    result?.error?.message ||
    result?.error ||
    result?.message ||
    result?.data?.error?.message ||
    result?.data?.error ||
    result?.data?.message ||
    result?.data?.data?.error?.message ||
    result?.data?.data?.error ||
    result?.data?.data?.message ||
    "Task failed"
  );
}

function stringifyDebugPayload(payload: unknown) {
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      payload,
      (_key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }

        if (value && typeof value === "object") {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }

        return value;
      },
      2,
    );
  } catch (error) {
    return `[Unserializable payload: ${String(error)}]`;
  }
}

async function buildTerminalResponseFromTask(task: typeof aiTask.$inferSelect) {
  const parsedResult = parseTaskResult(task.taskResult);

  if (task.status === AITaskStatus.SUCCESS) {
    const outputs = Array.isArray(parsedResult?.outputs)
      ? parsedResult.outputs.filter((item: unknown) => typeof item === "string")
      : [];
    const output =
      typeof parsedResult?.output === "string"
        ? parsedResult.output
        : outputs[0] || null;

    const outputUrls = outputs.length > 0 ? outputs : output ? [output] : [];
    const parsedOptions = parseTaskOptions(task.options);
    void persistGeneratedOutputsToR2({
      taskDbId: task.id,
      userId: task.userId,
      outputUrls,
      sceneId: task.scene,
      providerName: task.provider,
      providerLabel: humanizeSlug(task.provider) || task.provider,
      prompt: task.prompt || null,
      generationParams:
        parsedOptions && typeof parsedOptions === "object"
          ? (parsedOptions as Record<string, any>)
          : null,
    }).catch((error) => {
      console.error("[AI Status] persist R2 outputs failed", {
        taskDbId: task.id,
        sceneId: task.scene,
        error,
      });
    });
    const creationRecords = await resolveCreationRecordsByUrls(
      task.userId,
      outputUrls,
    );

    return respData({
      status: "completed",
      output,
      outputs: outputUrls,
      creationRecords,
    });
  }

  if (task.status === AITaskStatus.FAILED) {
    return respData({
      status: "failed",
      error: parsedResult?.error || "Task failed",
    });
  }

  return null;
}

function isWebhookModeTask(task: typeof aiTask.$inferSelect | undefined) {
  if (!task) {
    return false;
  }

  const parsedOptions = parseTaskOptions(task.options);
  return parsedOptions?.__webhook?.enabled === true;
}

async function isPaidUser(userId: string) {
  const [paidOrderCount, currentSubscription] = await Promise.all([
    getOrdersCount({
      userId,
      status: OrderStatus.PAID,
    }),
    getCurrentSubscription(userId),
  ]);

  return paidOrderCount > 0 || Boolean(currentSubscription);
}

/**
 * 根据 taskId（requestId）查找任务并退还积分
 */
async function refundCredits(
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>,
  requiredCredits: number,
  apiKey: string,
  providerName: string,
  reason: string,
): Promise<void> {
  await refundWavespeedCredits({
    userId: user.id,
    userEmail: user.email,
    freeUsed: false,
    refundCredits: requiredCredits,
    description: `Refund for failed ${apiKey} request (${providerName}): ${reason}`,
  });
}

async function resolveRefundCreditsForTask(
  task: typeof aiTask.$inferSelect,
  taskUser: Awaited<ReturnType<typeof findUserById>>,
) {
  const parsedOptions = parseTaskOptions(task.options);
  const billingInfo = parsedOptions?.__billing;
  const billingRefundableCredits = Number(billingInfo?.refundableCredits);

  if (
    Number.isFinite(billingRefundableCredits) &&
    billingRefundableCredits > 0
  ) {
    return {
      amount: billingRefundableCredits,
      source: "__billing.refundableCredits",
    };
  }

  if (task.costCredits > 0) {
    return {
      amount: task.costCredits,
      source: "task.costCredits",
    };
  }

  if (!taskUser) {
    return {
      amount: 0,
      source: "missing-task-user",
    };
  }

  const userIsPaid = await isPaidUser(taskUser.id);
  if (userIsPaid) {
    return {
      amount: 0,
      source: "paid-user-no-refund-fallback",
    };
  }

  const creditCalcParams =
    parsedOptions && typeof parsedOptions === "object"
      ? Object.fromEntries(
          Object.entries(parsedOptions).filter(
            ([key]) => !key.startsWith("__"),
          ),
        )
      : {};

  try {
    const calculatedCredits = await calculateRequiredCredits(
      task.scene,
      creditCalcParams,
    );
    return {
      amount:
        Number.isFinite(calculatedCredits) && calculatedCredits > 0
          ? calculatedCredits
          : 0,
      source: "recalculated-from-scene",
    };
  } catch (error) {
    console.warn(
      `[API] Failed to calculate refund credits for task ${task.id}:`,
      error,
    );
    return {
      amount: 0,
      source: "recalculate-failed",
    };
  }
}

async function refundCreditsForFailedTask(
  taskId: string,
  providerName: string,
  apiKey: string,
  reason: string,
) {
  try {
    console.log("[API] refundCreditsForFailedTask start", {
      taskId,
      providerName,
      apiKey,
      reason,
    });

    // 根据 taskId 查找任务记录
    const [task] = await db()
      .select()
      .from(aiTask)
      .where(eq(aiTask.taskId, taskId))
      .limit(1);

    if (!task) {
      console.warn("[API] refundCreditsForFailedTask task not found", {
        taskId,
        providerName,
        apiKey,
      });
      return;
    }

    console.log("[API] refundCreditsForFailedTask task loaded", {
      dbTaskId: task.id,
      taskId: task.taskId,
      userId: task.userId,
      status: task.status,
      scene: task.scene,
      provider: task.provider,
      costCredits: task.costCredits,
      hasOptions: Boolean(task.options),
    });

    // 如果任务已经是失败状态，不需要重复处理
    if (task.status === AITaskStatus.FAILED) {
      console.log(
        `[API] Task ${task.id} already marked as FAILED, skipping refund`,
      );
      return;
    }

    const taskUser = await findUserById(task.userId);
    if (!taskUser) {
      console.warn("[API] refundCreditsForFailedTask task user not found", {
        taskId,
        dbTaskId: task.id,
        userId: task.userId,
      });
      return;
    }

    console.log("[API] refundCreditsForFailedTask task user loaded", {
      taskId,
      dbTaskId: task.id,
      userId: taskUser.id,
      email: taskUser.email,
    });

    const refundResolution = await resolveRefundCreditsForTask(task, taskUser);
    console.log("[API] refundCreditsForFailedTask refund resolved", {
      taskId,
      dbTaskId: task.id,
      amount: refundResolution.amount,
      source: refundResolution.source,
      costCredits: task.costCredits,
    });

    if (refundResolution.amount <= 0) {
      console.warn(
        "[API] refundCreditsForFailedTask no refundable credits resolved, skipping refund",
        {
          taskId,
          dbTaskId: task.id,
          reason,
          source: refundResolution.source,
        },
      );
    } else {
      // 这里改为显式返还积分，避免和 creditId 自动回滚叠加造成双倍返还
      await refundCredits(
        taskUser,
        refundResolution.amount,
        apiKey,
        providerName,
        reason,
      );

      console.log("[API] refundCreditsForFailedTask refund executed", {
        taskId,
        dbTaskId: task.id,
        userId: taskUser.id,
        amount: refundResolution.amount,
        source: refundResolution.source,
        providerName,
        apiKey,
      });
    }

    await updateAITaskById(task.id, {
      status: AITaskStatus.FAILED,
    });

    console.log("[API] refundCreditsForFailedTask completed", {
      taskId,
      dbTaskId: task.id,
      finalStatus: AITaskStatus.FAILED,
    });
  } catch (e: any) {
    console.error("[API] refundCreditsForFailedTask failed", {
      taskId,
      providerName,
      apiKey,
      reason,
      error: e,
    });
  }
}

/**
 * 更新任务状态和结果到 ai_task 表
 */
async function updateTaskStatusAndResult(
  taskId: string,
  status: string,
  responseMapping?: any,
  outputs?: string[],
  output?: string,
  error?: string,
  rawResponse?: any,
) {
  try {
    // 根据 taskId 查找任务记录
    const [task] = await db()
      .select()
      .from(aiTask)
      .where(eq(aiTask.taskId, taskId))
      .limit(1);

    if (!task) {
      return;
    }

    // 映射状态到 AITaskStatus
    let taskStatus: string;
    if (isSuccessStatus(status, responseMapping)) {
      taskStatus = AITaskStatus.SUCCESS;
    } else if (isFailureStatus(status, responseMapping)) {
      taskStatus = AITaskStatus.FAILED;
    } else if (
      status === "processing" ||
      status === "running" ||
      status === "in_progress"
    ) {
      taskStatus = AITaskStatus.PROCESSING;
    } else if (status === "pending" || status === "queued") {
      taskStatus = AITaskStatus.PENDING;
    } else {
      // 保持当前状态，不更新未知状态
      taskStatus = task.status;
    }

    // 如果任务已经是失败状态，不需要重复处理（避免重复退还积分）
    if (
      taskStatus === AITaskStatus.FAILED &&
      task.status === AITaskStatus.FAILED
    ) {
      console.log(
        `[API] Task ${task.id} already marked as FAILED, skipping update`,
      );
      return;
    }

    // 构建更新数据
    const updateData: any = {
      status: taskStatus,
    };

    // 保存结果
    if (isSuccessStatus(status, responseMapping)) {
      // 优先使用 outputs 数组，如果没有则使用 output
      const resultData =
        outputs && outputs.length > 0
          ? { outputs, output: output || outputs[0] }
          : output
            ? { outputs: [output], output }
            : null;

      if (resultData) {
        updateData.taskResult = JSON.stringify(resultData);
      }
    } else if (isFailureStatus(status, responseMapping)) {
      // 保存错误信息
      const errorData = {
        error: error || "Task failed",
        status: status,
      };
      updateData.taskResult = JSON.stringify(errorData);
    }

    // 保存原始响应信息（用于调试）
    if (rawResponse) {
      updateData.taskInfo = JSON.stringify(rawResponse);
    }

    // 更新任务（如果是失败状态，这会自动触发积分退还）
    await updateAITaskById(task.id, updateData);
    if (isSuccessStatus(status, responseMapping)) {
      const finalImageUrl = output || outputs?.[0] || null;
      const updatedCharacter = await updateAICharacterByProviderTaskId(taskId, {
        status: "completed",
        imageUrl: finalImageUrl,
        completedAt: finalImageUrl ? new Date() : undefined,
        errorMessage: null,
      });
      if (updatedCharacter) {
        try {
          const snapshot = JSON.stringify({
            dna: JSON.parse(updatedCharacter.dna),
            extraDescription: updatedCharacter.extraDescription || "",
            imageUrl: finalImageUrl,
            aspectRatio: updatedCharacter.aspectRatio,
            resolution: updatedCharacter.resolution,
          });
          await updateAICharacterHistorySnapshot(
            updatedCharacter.id,
            updatedCharacter.currentVersion,
            snapshot,
          );
        } catch (e) {
          console.error(
            "[API] Failed to sync ai_character_history snapshot:",
            e,
          );
        }
      }
      await updateAICharacterPerspectiveByProviderTaskId(taskId, {
        status: "completed",
        imageUrl: finalImageUrl,
        completedAt: finalImageUrl ? new Date() : undefined,
        errorMessage: null,
      });
    } else if (isFailureStatus(status, responseMapping)) {
      await updateAICharacterByProviderTaskId(taskId, {
        status: "failed",
        errorMessage: error || "Task failed",
      });
      await updateAICharacterPerspectiveByProviderTaskId(taskId, {
        status: "failed",
        errorMessage: error || "Task failed",
      });
    } else if (
      status === "processing" ||
      status === "running" ||
      status === "in_progress" ||
      status === "pending" ||
      status === "queued"
    ) {
      await updateAICharacterByProviderTaskId(taskId, {
        status: "pending",
      });
      await updateAICharacterPerspectiveByProviderTaskId(taskId, {
        status: "pending",
      });
    }
    console.log("[API] Task update completed", {
      taskId: task.id,
      providerTaskId: taskId,
      status: taskStatus,
      hasResult: !!updateData.taskResult,
      taskResult: updateData.taskResult
        ? stringifyDebugPayload(JSON.parse(updateData.taskResult))
        : null,
      rawResponse: rawResponse ? stringifyDebugPayload(rawResponse) : null,
    });
  } catch (e: any) {
    console.error(
      `[API] Failed to update task status for taskId ${taskId}:`,
      e,
    );
  }
}

function convertStatusParamValue(value: any, type?: string) {
  if (value === undefined || value === null || !type) {
    return value;
  }

  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return Boolean(value);
    case "json":
      return typeof value === "string" ? JSON.parse(value) : value;
    case "string":
    default:
      return String(value);
  }
}

function buildStatusRequest(params: {
  req: Request;
  searchParams: URLSearchParams;
  requestId: string;
  statusConfig: any;
  providerConfig: any;
}) {
  const { req, searchParams, requestId, statusConfig, providerConfig } = params;
  let url = statusConfig.endpoint
    .replace(/{taskId}/g, requestId)
    .replace(/:taskId/g, requestId)
    .replace(/{requestId}/g, requestId)
    .replace(/:requestId/g, requestId);

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const baseUrl = providerConfig.baseUrl || "https://api.wavespeed.ai";
    url = `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  const headers: Record<string, string> = {
    ...providerConfig.defaultHeaders,
  };

  if (providerConfig.apiKey) {
    headers.Authorization = `Bearer ${providerConfig.apiKey}`;
  }

  const queryParams: Record<string, string> = {};
  if (statusConfig.params && Array.isArray(statusConfig.params)) {
    statusConfig.params.forEach((param: any) => {
      let value: any = param.defaultValue;

      if (param.source === "query") {
        const queryValue = searchParams.get(param.value || param.name);
        if (queryValue !== null) {
          value = queryValue;
        } else if (
          param.name === "taskId" ||
          param.name === "requestId" ||
          param.value === "taskId" ||
          param.value === "requestId"
        ) {
          value = requestId;
        }
      } else if (param.source === "static") {
        value = param.value;
      } else if (param.source === "header") {
        if (param.value) {
          const requestHeaderName = param.value.toLowerCase();
          value =
            req.headers.get(param.value) ||
            req.headers.get(requestHeaderName) ||
            param.value ||
            param.defaultValue;
        }

        if (value !== undefined && value !== null) {
          headers[param.name] = String(
            convertStatusParamValue(value, param.type),
          );
        }
        return;
      } else if (param.source === "path") {
        return;
      }

      if (param.required && (value === undefined || value === null)) {
        value = requestId;
      }

      value = convertStatusParamValue(value, param.type);
      if (value !== undefined && value !== null) {
        if (url.includes(`{${param.name}}`) || url.includes(`:${param.name}`)) {
          url = url
            .replace(`{${param.name}}`, String(value))
            .replace(`:${param.name}`, String(value));
        } else {
          queryParams[param.name] = String(value);
        }
      }
    });
  } else {
    queryParams.taskId = requestId;
  }

  if (Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(queryParams).toString();
    url += (url.includes("?") ? "&" : "?") + queryString;
  }

  return { url, headers };
}

async function fetchStatusResponse(params: {
  url: string;
  headers: Record<string, string>;
  timeout: number;
  requestId: string;
}) {
  const { url, headers, timeout, requestId } = params;
  const maxFetchAttempts = 3;
  const baseRetryDelayMs = 500;
  let response: Response | null = null;
  let lastFetchError: any = null;

  for (let attempt = 1; attempt <= maxFetchAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      break;
    } catch (e: any) {
      clearTimeout(timeoutId);
      lastFetchError = e;

      const isTimeout = e?.name === "AbortError";
      const canRetry = isTimeout || isRetriableNetworkError(e);

      if (!canRetry || attempt === maxFetchAttempts) {
        break;
      }

      const delayMs = baseRetryDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[API] Status query transient error, retrying (${attempt}/${maxFetchAttempts}) in ${delayMs}ms:`,
        {
          url,
          code: getErrorCode(e),
          message: e?.message || String(e),
        },
      );
      await sleep(delayMs);
    }
  }

  if (response) {
    return { response };
  }

  if (lastFetchError?.name === "AbortError") {
    return {
      transientResponse: respData({
        status: "processing",
        requestId,
        transientError: `Status query timeout after ${timeout}ms, client should continue polling`,
      }),
    };
  }

  if (isRetriableNetworkError(lastFetchError)) {
    return {
      transientResponse: respData({
        status: "processing",
        requestId,
        transientError: `Transient network error (${getErrorCode(lastFetchError) || "fetch_failed"}), client should continue polling`,
      }),
    };
  }

  throw lastFetchError;
}

async function readStatusResponse(response: Response, responseMapping: any) {
  if (responseMapping) {
    if (responseMapping.format === "json") {
      return response.json();
    }

    if (responseMapping.format === "text") {
      return { text: await response.text() };
    }

    const buffer = await response.arrayBuffer();
    return { data: Buffer.from(buffer).toString("base64") };
  }

  return response.json();
}

function extractOutputFromMappedPath(result: any, outputPath: string) {
  let extractedOutput: any;

  if (outputPath.includes("[") && outputPath.includes("]")) {
    const arrayPath = outputPath.replace(/\[\d+\]/g, "");
    const arrayValue = getNestedValue(result, arrayPath);
    extractedOutput = Array.isArray(arrayValue)
      ? arrayValue
      : getNestedValue(result, outputPath);
  } else {
    extractedOutput = getNestedValue(result, outputPath);
  }

  if (Array.isArray(extractedOutput)) {
    const outputs = extractedOutput.filter(
      (item: any) => typeof item === "string",
    );
    return {
      output: outputs[0],
      outputs,
    };
  }

  if (typeof extractedOutput === "string") {
    return {
      output: extractedOutput,
      outputs: [extractedOutput],
    };
  }

  return {
    output: extractedOutput,
    outputs: undefined,
  };
}

function extractProviderStatusResult(result: any, responseMapping: any) {
  let status: string | undefined;
  let output: string | string[] | undefined;
  let outputs: string[] | undefined;
  let error: string | undefined;

  if (responseMapping) {
    status = responseMapping.statusPath
      ? getNestedValue(result, responseMapping.statusPath)
      : result.data?.data?.status ||
        result.data?.status ||
        result.status ||
        result.state;

    const taskCompleted = isSuccessStatus(status, responseMapping);
    const taskFailed = isFailureStatus(status, responseMapping);

    if (responseMapping.outputPath && taskCompleted) {
      const extracted = extractOutputFromMappedPath(
        result,
        responseMapping.outputPath,
      );
      output = extracted.output;
      outputs = extracted.outputs;
    }

    if (taskFailed) {
      error = responseMapping.errorPath
        ? getNestedValue(result, responseMapping.errorPath)
        : undefined;
      error = error || extractFallbackErrorMessage(result);
    }
  } else {
    const statusData = result.data?.data || result.data || result;
    status = statusData?.status || statusData?.state;

    if (isSuccessStatus(status)) {
      if (Array.isArray(statusData?.outputs)) {
        const filteredOutputs = statusData.outputs.filter(
          (item: any) => typeof item === "string",
        );
        outputs = filteredOutputs;
        output = filteredOutputs.length > 0 ? filteredOutputs[0] : undefined;
      } else {
        const singleOutput =
          statusData?.outputs?.[0] ||
          statusData?.image_url ||
          statusData?.url ||
          statusData?.output_url ||
          statusData?.image ||
          null;
        if (singleOutput && typeof singleOutput === "string") {
          output = singleOutput;
          outputs = [singleOutput];
        }
      }
    }

    if (isFailureStatus(status)) {
      error = statusData?.error || statusData?.message || "Task failed";
    }
  }

  if (!status) {
    console.warn(
      "[API] Failed to extract status from response. Full response:",
      JSON.stringify(result, null, 2),
    );
    console.warn(
      "[API] Response mapping:",
      JSON.stringify(responseMapping, null, 2),
    );

    status =
      result.status ||
      result.state ||
      result.data?.status ||
      result.data?.state ||
      result.data?.data?.status ||
      result.data?.data?.state ||
      result.result?.status ||
      result.result?.state ||
      "unknown";
    console.warn("[API] Attempted fallback status extraction, result:", status);
  }

  return {
    status,
    output,
    outputs,
    error,
  };
}

function normalizeCompletedOutputs(output: any, outputs?: string[]) {
  if (outputs && outputs.length > 0) {
    return {
      output: typeof output === "string" ? output : outputs[0],
      outputs,
      outputUrls: outputs,
    };
  }

  if (!output) {
    return {
      output: null,
      outputs: [],
      outputUrls: [],
    };
  }

  const outputStr =
    typeof output === "string"
      ? output
      : Array.isArray(output)
        ? output[0]
        : String(output);

  return {
    output: outputStr,
    outputs: [outputStr],
    outputUrls: outputStr ? [outputStr] : [],
  };
}

function buildGenerationParams(
  taskOptions?: string | null,
): Record<string, any> | null {
  const parsedTaskOptions = parseTaskOptions(taskOptions);

  if (!parsedTaskOptions || typeof parsedTaskOptions !== "object") {
    return null;
  }

  return {
    ...Object.fromEntries(
      Object.entries(parsedTaskOptions).filter(
        ([key]) => !key.startsWith("__"),
      ),
    ),
    ...(typeof parsedTaskOptions.__modelUrl === "string" &&
    parsedTaskOptions.__modelUrl.trim()
      ? { __modelUrl: parsedTaskOptions.__modelUrl.trim() }
      : {}),
    ...(typeof parsedTaskOptions.__modelLabel === "string" &&
    parsedTaskOptions.__modelLabel.trim()
      ? { __modelLabel: parsedTaskOptions.__modelLabel.trim() }
      : {}),
  };
}

async function handleCompletedStatus(params: {
  requestId: string;
  resolvedStatus: string;
  responseMapping: any;
  output: any;
  outputs?: string[];
  result: any;
  task: typeof aiTask.$inferSelect | undefined;
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>;
  scenario?: string | null;
  provider?: string | null;
  providerConfig: any;
  shouldRunNsfwCheck: boolean;
}) {
  const {
    requestId,
    resolvedStatus,
    responseMapping,
    output,
    outputs,
    result,
    task,
    user,
    scenario,
    provider,
    providerConfig,
    shouldRunNsfwCheck,
  } = params;
  const normalized = normalizeCompletedOutputs(output, outputs);
  const outputUrlsToCheck = normalized.outputUrls;
  const detectedMediaType: "image" | "video" =
    task?.mediaType === "video" || outputUrlsToCheck.some(isVideoLikeUrl)
      ? "video"
      : "image";
  const shouldCheckNsfw =
    task?.mediaType === "image" ||
    task?.mediaType === "video" ||
    outputUrlsToCheck.some(isImageLikeUrl) ||
    outputUrlsToCheck.some(isVideoLikeUrl);

  if (shouldRunNsfwCheck && shouldCheckNsfw && outputUrlsToCheck.length > 0) {
    const nsfwResult = await checkOutputsForNsfw(
      outputUrlsToCheck,
      detectedMediaType,
    );
    if (nsfwResult?.data?.is_nsfw) {
      console.warn(
        "[API] NSFW content detected, marking task failed without refund",
        {
          requestId,
          taskId: task?.id,
          scene: scenario || task?.scene || "status",
          provider: provider || task?.provider || "unknown",
          mediaType: detectedMediaType,
          outputCount: outputUrlsToCheck.length,
        },
      );

      await updateTaskStatusAndResult(
        requestId,
        "failed",
        {
          ...responseMapping,
          failureStatus: ["failed"],
        },
        undefined,
        undefined,
        "Generated content was flagged as NSFW",
        {
          ...result,
          nsfwCheck: nsfwResult,
        },
      );

      return {
        blockedResponse: Response.json({
          code: -1,
          message: NSFW_BLOCKED_ERROR_CODE,
          errorCode: NSFW_BLOCKED_ERROR_CODE,
          data: {
            errorCode: NSFW_BLOCKED_ERROR_CODE,
          },
        }),
      };
    }
  }

  await updateTaskStatusAndResult(
    requestId,
    resolvedStatus,
    responseMapping,
    normalized.outputs,
    typeof normalized.output === "string" ? normalized.output : undefined,
    undefined,
    result,
  );

  const generationParams = buildGenerationParams(task?.options);
  const sceneId =
    typeof generationParams?.sceneId === "string" &&
    generationParams.sceneId.trim()
      ? generationParams.sceneId.trim()
      : scenario;
  const aspectRatio =
    typeof generationParams?.aspectRatio === "string"
      ? generationParams.aspectRatio
      : null;

  const creationRecords = await persistSuccessfulOutputsToCreations({
    userId: user.id,
    outputUrls: outputUrlsToCheck,
    sceneId,
    providerName: provider,
    providerLabel: providerConfig.name,
    prompt: task?.prompt || null,
    generationParams,
    aspectRatio,
  });

  void persistGeneratedOutputsToR2({
    taskDbId: task?.id,
    userId: user.id,
    outputUrls: outputUrlsToCheck,
    workbenchCreationRecords: creationRecords,
    sceneId,
    providerName: provider,
    providerLabel: providerConfig.name,
    prompt: task?.prompt || null,
    generationParams,
    aspectRatio,
  }).catch((error) => {
    console.error("[AI Status] persist R2 outputs failed", {
      taskDbId: task?.id,
      sceneId,
      error,
    });
  });

  return {
    responsePatch: {
      output: normalized.output,
      outputs: normalized.outputs,
      creationRecords,
    },
  };
}

/**
 * 查询任务状态（根据 Provider 动态调用对应的 status 接口）
 */
export async function getGenerationStatus(req: Request) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const configs = await getAllConfigs();
    const userIsPaid = await isPaidUser(user.id);
    const shouldRunNsfwCheck = await shouldRunOutputNsfwCheck({
      userId: user.id,
      email: user.email,
      whitelistValue: configs.nsfw_whitelist_emails,
      isPaidUser: userIsPaid,
    });

    const { searchParams } = new URL(req.url);
    const requestId =
      searchParams.get("requestId") || searchParams.get("taskId");
    let provider = searchParams.get("provider");
    let scenario = mapStatusScenario(searchParams.get("scenario"));

    if (!requestId) {
      return respErr("taskId or requestId is required");
    }

    const [task] = await db()
      .select()
      .from(aiTask)
      .where(eq(aiTask.taskId, requestId))
      .limit(1);

    if (task) {
      if (task.userId !== user.id) {
        return respErr("Unauthorized");
      }

      const terminalResponse = await buildTerminalResponseFromTask(task);
      if (terminalResponse) {
        return terminalResponse;
      }

      provider = task.provider || provider;
      scenario = mapStatusScenario(task.scene || scenario);
    }

    // 如果没有提供 provider 和 scenario，尝试自动推断或使用默认配置
    if (!provider || !scenario) {
      if (!provider && scenario) {
        provider = await findProviderForScenario(scenario);
      }

      // 尝试从所有 provider 中查找第一个有 statusQueryEndpoint 配置的
      const configs = await getPricingConfigFromDB();
      const providers = configs?.providers || {};

      // 优先根据场景名从当前配置中查找 provider
      if (!provider && scenario) {
        const matchedProviderKey = Object.keys(providers).find((providerKey) =>
          Boolean((providers[providerKey] as any).scenarios?.[scenario!]),
        );
        if (matchedProviderKey) {
          provider = matchedProviderKey;
        }
      }

      // 优先查找 wavespeed 相关的 provider（向后兼容）
      const wavespeedProviderKey = Object.keys(providers).find(
        (key) =>
          key.toLowerCase().includes("wavespeed") ||
          (providers[key] as any).name?.toLowerCase().includes("wavespeed"),
      );

      if (wavespeedProviderKey) {
        provider = wavespeedProviderKey;
        const wavespeedProvider = providers[wavespeedProviderKey] as any;

        // 尝试找到第一个有场景的
        const scenarioNames = Object.keys(wavespeedProvider.scenarios || {});
        if (scenarioNames.length > 0) {
          scenario = scenarioNames[0];
        }
      }

      // 如果还是没有找到，使用第一个有 statusQueryEndpoint 的 provider
      if (!provider || !scenario) {
        for (const [providerKey, providerConfig] of Object.entries(providers)) {
          const config = providerConfig as any;
          if (config.statusQueryEndpoint) {
            provider = providerKey;
            const scenarioNames = Object.keys(config.scenarios || {});
            if (scenarioNames.length > 0) {
              scenario = scenarioNames[0];
              break;
            }
          }

          // 检查场景级别的配置
          for (const [scenarioName, scenarioConfig] of Object.entries(
            config.scenarios || {},
          )) {
            const scenarioConfigData = scenarioConfig as any;
            if (scenarioConfigData.statusQueryEndpoint) {
              provider = providerKey;
              scenario = scenarioName;
              break;
            }
          }

          if (provider && scenario) break;
        }
      }

      // 如果还是找不到，返回错误
      if (!provider || !scenario) {
        return respErr(
          "provider and scenario are required. Please provide them as query parameters: ?provider=xxx&scenario=xxx",
        );
      }
    }

    // 获取状态查询配置
    const statusConfig = await getStatusQueryConfig(
      provider,
      scenario,
      undefined,
    );
    if (!statusConfig || !statusConfig.endpoint) {
      return respErr(
        `No status query endpoint configured for provider "${provider}" and scenario "${scenario}"`,
      );
    }

    // 获取 Provider 配置（用于 baseUrl 和 apiKey）
    const providerConfig = await getProviderConfigAsync(provider);
    if (!providerConfig) {
      return respErr(`Provider "${provider}" not found`);
    }

    const { url, headers } = buildStatusRequest({
      req,
      searchParams,
      requestId,
      statusConfig,
      providerConfig,
    });
    console.log("[API] Status query URL:", url);
    const statusFetch = await fetchStatusResponse({
      url,
      headers,
      timeout: providerConfig.timeout || 30000,
      requestId,
    });
    if (statusFetch.transientResponse) {
      return statusFetch.transientResponse;
    }
    const response = statusFetch.response!;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] Status query failed:", response.status, errorText);
      return respErr(`Status query failed: ${response.statusText}`);
    }

    const responseMapping = statusConfig.responseMapping;
    const result = await readStatusResponse(response, responseMapping);

    const { status, output, outputs, error } = extractProviderStatusResult(
      result,
      responseMapping,
    );
    if (isFailureStatus(status, responseMapping)) {
      await refundCreditsForFailedTask(
        requestId,
        provider || task?.provider || "unknown",
        scenario || task?.scene || "status",
        error || "Task failed",
      );
    }

    // 返回状态信息
    const taskCompleted = isSuccessStatus(status, responseMapping);
    const taskFailed = isFailureStatus(status, responseMapping);
    const resolvedStatus = status || "unknown";
    const clientStatus = normalizeStatusForClient(
      resolvedStatus,
      responseMapping,
    );

    // 返回给前端的状态统一标准化，兼容现有 completed/failed 判断
    const responseData: any = {
      status: clientStatus,
    };

    // 只在任务完成时包含输出
    if (taskCompleted) {
      const completedStatus = await handleCompletedStatus({
        requestId,
        resolvedStatus,
        responseMapping,
        output,
        outputs,
        result,
        task,
        user,
        scenario,
        provider,
        providerConfig,
        shouldRunNsfwCheck,
      });
      if (completedStatus.blockedResponse) {
        return completedStatus.blockedResponse;
      }
      Object.assign(responseData, completedStatus.responsePatch);
    }

    // 只在任务失败时包含错误
    if (taskFailed) {
      responseData.error = error || "Task failed";

      // 更新任务状态和结果到数据库（这会自动触发积分退还）
      await updateTaskStatusAndResult(
        requestId,
        resolvedStatus,
        responseMapping,
        undefined,
        undefined,
        error,
        result,
      );
    }

    // 如果状态是处理中或等待中，也更新状态
    if (
      resolvedStatus === "processing" ||
      resolvedStatus === "running" ||
      resolvedStatus === "in_progress" ||
      resolvedStatus === "pending" ||
      resolvedStatus === "queued"
    ) {
      await updateTaskStatusAndResult(
        requestId,
        resolvedStatus,
        responseMapping,
        undefined,
        undefined,
        undefined,
        result,
      );
    }

    // 如果状态是 unknown，返回原始响应以便调试
    if (clientStatus === "unknown") {
      responseData._debug = {
        rawResponse: result,
        rawStatus: resolvedStatus,
        responseMapping: responseMapping || null,
        message:
          "Status extraction failed. Please check response structure and mapping configuration.",
      };
    }

    return respData(responseData);
  } catch (e: any) {
    console.error("[API] Status query failed:", e);
    return respErr(e.message || "Failed to query task status");
  }
}
