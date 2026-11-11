/**
 * AI 图片/视频生成通用工具函数
 *
 * 提供统一的生成流程：
 * 1. 访问权限检查（登录 + 地理位置）
 * 2. 积分检查
 * 3. 提交生成任务
 * 4. 轮询任务状态
 * 5. 返回结果
 */

import type { AccessCheckResult } from "@/shared/hooks/use-user-access-check";
import { resolveApiErrorMessage } from "@/shared/lib/api-error";

/**
 * 生成任务的配置参数
 */
export interface GenerationConfig {
  /** API 端点路径，例如 '/api/ai/flux-2-klein-text-to-image/generate' */
  apiEndpoint: string;
  /** 场景标识，用于查询任务状态，例如 'flux-2-klein-text-to-image' */
  scenario: string;
  /** 提交给 API 的请求体 */
  requestBody: Record<string, any>;
  /** 所需积分数（用于客户端快速检查） */
  requiredCredits: number | null;
  /** 用户剩余积分 */
  remainingCredits: number;
  /** 最大轮询次数，默认 120 次（4分钟，每次间隔2秒） */
  maxPollingAttempts?: number;
  /** 轮询间隔（毫秒），默认 2000ms */
  pollingInterval?: number;
  /** 自定义状态查询地址构造器 */
  buildStatusEndpoint?: (requestId: string) => string;
}

/**
 * 生成任务的回调函数
 */
export interface GenerationCallbacks {
  /** 访问权限检查函数 */
  checkAccess: () => AccessCheckResult;
  /** 当前模型路由 URL，用于持久化真实模型标识 */
  modelUrl?: string;
  /** 当前模型展示名，用于持久化真实模型标签 */
  modelLabel?: string;
  /** 显示支付弹窗 */
  showPricingModal: () => void;
  /** 显示登录弹窗 */
  showSignModal: () => void;
  /** 刷新用户信息（成功后调用） */
  fetchUserInfo: () => Promise<void>;
  /** 状态更新回调 */
  onStatusUpdate: (status: string) => void;
  /** 异步任务提交成功后的回调，可用于提前创建占位节点 */
  onTaskSubmitted?: (payload: {
    requestId: string;
    scenario: string;
  }) => void | Promise<void>;
  /** 是否把后续轮询交给调用方处理 */
  deferPolling?: boolean;
  /** 错误回调 */
  onError: (error: string) => void;
  /** API 业务错误码翻译 */
  translateApiError?: (
    translationKey: string,
    errorCode: string,
  ) => string | undefined;
}

/**
 * 生成结果
 */
export interface GenerationResult {
  /** 是否成功 */
  success: boolean;
  /** 是否仅提交成功、尚未轮询完成 */
  accepted?: boolean;
  /** 生成的图片/视频 URL */
  url?: string;
  /** 批量输出 URL */
  outputs?: string[];
  /** 错误消息 */
  error?: string;
  /** 任务 ID */
  requestId?: string;
  /** 场景标识 */
  scenario?: string;
  /** 原始数据 */
  data?: any;
}

/**
 * 翻译函数类型
 */
export type TranslationFunction = (
  key: string,
  params?: Record<string, any>,
) => string;

const CANVAS_TASK_SUBMITTED_EVENT = "z-image:canvas-task-submitted";

function extractTaskData(payload: any) {
  if (!payload) return null;
  if (payload.data?.data) return payload.data.data;
  if (payload.data) return payload.data;
  return payload;
}

function extractDirectResultUrl(payload: any): string | undefined {
  const taskData = extractTaskData(payload);

  const directUrl =
    taskData?.output ||
    taskData?.imageUrl ||
    taskData?.url ||
    taskData?.image_url ||
    taskData?.output_url ||
    taskData?.outputs?.[0];

  return typeof directUrl === "string" ? directUrl : undefined;
}

function extractDirectResultOutputs(payload: any): string[] | undefined {
  const taskData = extractTaskData(payload);
  const outputs = taskData?.outputs;

  if (!Array.isArray(outputs)) {
    return undefined;
  }

  return outputs.filter(
    (item: unknown): item is string => typeof item === "string",
  );
}

function extractRequestId(payload: any): string | undefined {
  const taskData = extractTaskData(payload);
  const requestId =
    taskData?.requestId ||
    taskData?.taskId ||
    taskData?.id ||
    taskData?.request_id ||
    taskData?.task_id;

  return typeof requestId === "string" ? requestId : undefined;
}

function resolveGenerationErrorMessage(params: {
  payload?: any;
  fallback: string;
  translate?: (translationKey: string, errorCode: string) => string | undefined;
}) {
  return resolveApiErrorMessage({
    payload: params.payload,
    fallback: params.fallback,
    translate: params.translate,
  });
}

/**
 * 执行 AI 生成任务的通用函数
 *
 * @param config 生成配置
 * @param callbacks 回调函数
 * @param t 翻译函数
 * @returns 生成结果
 *
 * @example
 * ```tsx
 * const result = await executeGeneration(
 *   {
 *     apiEndpoint: '/api/ai/flux-2-klein-text-to-image/generate',
 *     scenario: 'flux-2-klein-text-to-image',
 *     requestBody: { prompt, size: `${width}*${height}`, seed },
 *     requiredCredits,
 *     remainingCredits: user?.credits?.remainingCredits ?? 0,
 *   },
 *   {
 *     checkAccess,
 *     showPricingModal: () => setShowPricingModal(true),
 *     showSignModal: () => setIsShowSignModal(true),
 *     fetchUserInfo,
 *     onStatusUpdate: (status) => setStatus(status),
 *     onError: (error) => setError(error),
 *   },
 *   t
 * );
 *
 * if (result.success) {
 *   setImageUrl(result.url!);
 * }
 * ```
 */
export async function executeGeneration(
  config: GenerationConfig,
  callbacks: GenerationCallbacks,
  t: TranslationFunction,
): Promise<GenerationResult> {
  const {
    apiEndpoint,
    scenario,
    requestBody,
    requiredCredits,
    remainingCredits,
    maxPollingAttempts = 120,
    pollingInterval = 2000,
    buildStatusEndpoint,
  } = config;

  const {
    checkAccess,
    modelUrl,
    modelLabel,
    showPricingModal,
    showSignModal,
    fetchUserInfo,
    onStatusUpdate,
    onTaskSubmitted,
    deferPolling,
    onError,
    translateApiError,
  } = callbacks;

  const unknownErrorText = "Unknown error";

  try {
    // 1. 检查用户访问权限（登录 + 地理位置）
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        onError(accessResult.errorMessage);
      }
      if (accessResult.reason === "not_logged_in") {
        onError("Please sign in to continue.");
      }
      return { success: false, error: accessResult.errorMessage };
    }

    // 2. 客户端快速积分检查
    if (requiredCredits !== null && remainingCredits < requiredCredits) {
      console.log(
        `[${scenario}] Insufficient credits locally, showing payment dialog`,
      );
      onError("Insufficient credits. Please upgrade to continue.");
      showPricingModal();
      return { success: false, error: "Insufficient credits" };
    }

    // 3. 提交生成任务
    onStatusUpdate(t("status.submitting", { defaultValue: "Submitting..." }));

    console.log(`[${scenario}] Calling ${apiEndpoint}...`);
    const generateResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestBody,
        ...(modelUrl ? { __modelUrl: modelUrl } : {}),
        ...(modelLabel ? { __modelLabel: modelLabel } : {}),
      }),
    });

    console.log(`[${scenario}] Response status:`, generateResponse.status);

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error(`[${scenario}] Response not OK:`, errorText);
      throw new Error(`Failed to generate: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    console.log(`[${scenario}] Generate result:`, generateResult);
    console.log(`[${scenario}] Extracted task data:`, extractTaskData(generateResult));

    if (generateResult.code !== 0) {
      // 检查是否需要登录
      if (
        generateResult.message?.includes("no auth") ||
        generateResult.message?.includes("sign in")
      ) {
        showSignModal();
        return { success: false, error: "Authentication required" };
      }

      // 检查积分是否不足
      const { success, hasEnoughCredits } = generateResult.data || {};
      if (
        (success === false || hasEnoughCredits === false) &&
        requiredCredits !== null &&
        remainingCredits < requiredCredits
      ) {
        console.log(`[${scenario}] Insufficient credits`);
        onError("Insufficient credits. Please upgrade to continue.");
        showPricingModal();
        return { success: false, error: "Insufficient credits" };
      }

      throw new Error(
        resolveGenerationErrorMessage({
          payload: generateResult,
          fallback: generateResult.message || "Failed to generate",
          translate: translateApiError,
        }),
      );
    }

    const directUrl = extractDirectResultUrl(generateResult);
    const directOutputs = extractDirectResultOutputs(generateResult);
    console.log(`[${scenario}] Parsed generate payload`, {
      directUrl,
      directOutputs,
      requestId: extractRequestId(generateResult),
    });
    if (directUrl) {
      onStatusUpdate(
        t("status.image_success", { defaultValue: "Generated successfully!" }),
      );
      void fetchUserInfo();
      return {
        success: true,
        url: directUrl,
        outputs: directOutputs,
        data: extractTaskData(generateResult),
      };
    }

    const requestId = extractRequestId(generateResult);
    if (!requestId) {
      throw new Error("Failed to get request ID");
    }

    onStatusUpdate(
      t("status.task_submitted", {
        id: requestId,
        defaultValue: `Task submitted: ${requestId}`,
      }),
    );
    console.log(`[${scenario}] task submitted`, {
      requestId,
      deferPolling: Boolean(deferPolling),
      hasOnTaskSubmitted: Boolean(onTaskSubmitted),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CANVAS_TASK_SUBMITTED_EVENT, {
          detail: {
            requestId,
            scenario,
            modelUrl,
            modelLabel,
          },
        }),
      );
    }

    await onTaskSubmitted?.({ requestId, scenario });

    if (deferPolling) {
      console.log(`[${scenario}] defer polling to caller`, { requestId });
      void fetchUserInfo();
      return {
        success: true,
        accepted: true,
        requestId,
        scenario,
        data: extractTaskData(generateResult),
      };
    }

    // 4. 轮询任务状态
    let attempts = 0;

    while (attempts < maxPollingAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));

      const resultResponse = await fetch(
        buildStatusEndpoint
          ? buildStatusEndpoint(requestId)
          : `/api/ai/status?taskId=${requestId}&scenario=${scenario}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error(`[${scenario}] Get result error:`, errorText);
        onError(
          t("errors.http_error", {
            code: resultResponse.status,
            defaultValue: `HTTP error: ${resultResponse.status}`,
          }),
        );
        return {
          success: false,
          error: `HTTP error: ${resultResponse.status}`,
        };
      }

      const resultData = await resultResponse.json();

      if (resultData.code !== 0) {
        const fallbackMessage =
          resultData.message ||
          t("errors.request_failed", { error: unknownErrorText });
        const errorMsg = resolveGenerationErrorMessage({
          payload: resultData,
          fallback: fallbackMessage,
          translate: translateApiError,
        });
        onError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const {
        status: taskStatus,
        imageUrl: resultUrl,
        error: taskError,
        output: outputUrl,
        outputs,
      } = resultData.data || {};

      if (taskStatus === "completed") {
        // 优先使用 output 字段，其次使用 outputs 数组的第一个，最后使用 imageUrl
        const finalUrl =
          outputUrl || (outputs && outputs.length > 0 ? outputs[0] : resultUrl);

        if (!finalUrl) {
          const errorMsg = t("errors.task_failed", {
            error: "Result URL not found",
            defaultValue: "Task failed: Result URL not found",
          });
          onError(errorMsg);
          return { success: false, error: errorMsg };
        }

        onStatusUpdate(
          t("status.image_success", {
            defaultValue: "Generated successfully!",
          }),
        );

        // 刷新用户信息以更新积分
        await fetchUserInfo();

        return {
          success: true,
          url: finalUrl,
          outputs:
            outputs?.filter(
              (item: unknown): item is string => typeof item === "string",
            ) || undefined,
          requestId,
          data: resultData.data || resultData,
        };
      } else if (taskStatus === "failed") {
        const resolvedTaskError = resolveGenerationErrorMessage({
          payload: {
            errorCode: taskError,
            message: taskError,
            data: {
              errorCode: taskError,
            },
          },
          fallback: taskError || unknownErrorText,
          translate: translateApiError,
        });
        const errorMsg = t("errors.task_failed", {
          error: resolvedTaskError,
        });
        onError(errorMsg);
        return { success: false, error: errorMsg };
      } else {
        onStatusUpdate(
          t("status.processing", {
            status: taskStatus,
            defaultValue: `Processing: ${taskStatus}`,
          }),
        );
      }

      attempts++;
    }

    // 超时
    const timeoutMsg = t("errors.request_timeout", {
      defaultValue: "Request timeout",
    });
    onError(timeoutMsg);
    return { success: false, error: timeoutMsg };
  } catch (err) {
    console.error(`[${scenario}] Error generating:`, err);
    const rawErrorMessage =
      err instanceof Error ? err.message : unknownErrorText;
    const errorMsg = rawErrorMessage || t("errors.generationFailed");
    onError(errorMsg);
    return { success: false, error: errorMsg };
  }
}
