import type {
  GenerationCallbacks,
  GenerationConfig,
  GenerationResult,
  TranslationFunction,
} from "./generation-contract";

const NSFW_BLOCKED_ERROR_CODE = "NSFW_BLOCKED";

const ERROR_TRANSLATION_KEY_MAP: Record<string, string> = {
  [NSFW_BLOCKED_ERROR_CODE]: "nsfw_blocked",
};

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

function getApiErrorCode(payload: any): string | undefined {
  const errorCode =
    payload?.errorCode ||
    payload?.data?.errorCode ||
    payload?.message;

  return typeof errorCode === "string" ? errorCode : undefined;
}

function resolveGenerationErrorMessage(params: {
  payload?: any;
  fallback: string;
  translate?: (translationKey: string, errorCode: string) => string | undefined;
}) {
  const errorCode = getApiErrorCode(params.payload);

  if (!errorCode) {
    return params.fallback;
  }

  const translationKey = ERROR_TRANSLATION_KEY_MAP[errorCode];
  if (translationKey && params.translate) {
    const translatedMessage = params.translate(translationKey, errorCode);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  return params.fallback || errorCode;
}

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
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        onError(accessResult.errorMessage);
      }
      return { success: false, error: accessResult.errorMessage };
    }

    if (requiredCredits !== null && remainingCredits < requiredCredits) {
      onError("Insufficient credits. Please upgrade to continue.");
      showPricingModal();
      return { success: false, error: "Insufficient credits" };
    }

    onStatusUpdate(t("status.submitting", { defaultValue: "Submitting..." }));

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

    if (!generateResponse.ok) {
      throw new Error(`Failed to generate: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();

    if (generateResult.code !== 0) {
      if (
        generateResult.message?.includes("no auth") ||
        generateResult.message?.includes("sign in")
      ) {
        showSignModal();
        return { success: false, error: "Authentication required" };
      }

      const { success, hasEnoughCredits } = generateResult.data || {};
      if (
        (success === false || hasEnoughCredits === false) &&
        requiredCredits !== null &&
        remainingCredits < requiredCredits
      ) {
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
      void fetchUserInfo();
      return {
        success: true,
        accepted: true,
        requestId,
        scenario,
        data: extractTaskData(generateResult),
      };
    }

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
      }

      if (taskStatus === "failed") {
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
      }

      onStatusUpdate(
        t("status.processing", {
          status: taskStatus,
          defaultValue: `Processing: ${taskStatus}`,
        }),
      );
      attempts++;
    }

    const timeoutMsg = t("errors.request_timeout", {
      defaultValue: "Request timeout",
    });
    onError(timeoutMsg);
    return { success: false, error: timeoutMsg };
  } catch (err) {
    const rawErrorMessage =
      err instanceof Error ? err.message : unknownErrorText;
    const errorMsg = rawErrorMessage || t("errors.generationFailed");
    onError(errorMsg);
    return { success: false, error: errorMsg };
  }
}
