import { refundWavespeedCredits } from "@/app/api/utils";
import { handleWavespeedAPIRequest } from "@/server/ai-generation/common-handler";
import { getCreditConfig, getCreditCostsConfig } from "@/config/credit-config";
import {
  findProviderForScenario,
  getProviderForScenario,
  getScenarioPricingAsync,
} from "@/config/pricing-config";
import { AITaskStatus } from "@/extensions/ai";
import { NSFW_BLOCKED_ERROR_CODE } from "@/shared/lib/api-error";
import { detectDeviceType } from "@/shared/lib/device-detector";
import { getUuid } from "@/shared/lib/hash";
import { shouldSkipNsfwCheck } from "@/shared/lib/nsfw-policy";
import { isCreemReviewMode } from "@/shared/lib/creem-review";
import {
  extractPromptForModeration,
  screenPromptWithCreem,
} from "@/shared/lib/prompt-moderation";
import { respErr } from "@/shared/lib/resp";
import { createAITask, NewAITask } from "@/shared/models/ai_task";
import { getAllConfigs } from "@/shared/models/config";
import { consumeCredits } from "@/shared/models/credit";

type TaskData = {
  mediaType: string;
  model: string;
  prompt: string;
  options?: Record<string, any>;
};

type BuildTaskData = (
  body: any,
  validatedParams: any,
  providerName: string,
) => TaskData;

function isClientAbortError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    cause?: { code?: unknown; message?: unknown } | unknown;
  };

  const message = String(candidate.message || "").toLowerCase();
  const name = String(candidate.name || "");
  const code = String(candidate.code || "");
  const causeCode =
    candidate.cause && typeof candidate.cause === "object"
      ? String((candidate.cause as any).code || "")
      : "";
  const causeMessage =
    candidate.cause && typeof candidate.cause === "object"
      ? String((candidate.cause as any).message || "").toLowerCase()
      : "";

  return (
    name === "AbortError" ||
    code === "ECONNRESET" ||
    causeCode === "ECONNRESET" ||
    message.includes("aborted") ||
    causeMessage.includes("aborted") ||
    message.includes("request aborted")
  );
}

function buildValidateParamsFromRequestParams(
  requestParams: any[],
): (body: any) => { valid: boolean; params?: any; error?: string } {
  return (body: any) => {
    const params: any = {};

    for (const param of requestParams) {
      if (param.required && param.source === "body") {
        const paramName = param.value || param.name;
        const value = body[paramName];

        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && !value.trim())
        ) {
          return { valid: false, error: `${paramName} is required` };
        }
      }
    }

    for (const param of requestParams) {
      if (param.source === "body") {
        const paramName = param.value || param.name;
        const value = body[paramName];

        if (value !== undefined) {
          let convertedValue = value;
          if (param.type === "number") {
            convertedValue = Number(value);
          } else if (param.type === "boolean") {
            convertedValue = Boolean(value);
          } else if (param.type === "string") {
            convertedValue = String(value);
          }
          params[paramName] = convertedValue;
        } else if (param.defaultValue !== undefined) {
          params[paramName] = param.defaultValue;
        }
      }
    }

    return { valid: true, params: { ...body, ...params } };
  };
}

function normalizeSeedance20ImageToVideoBody(body: any) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const rawImageWithRoles = Array.isArray(body.image_with_roles)
    ? body.image_with_roles
    : [];
  const normalizedImageWithRoles = rawImageWithRoles.filter(
    (item: any) =>
      item &&
      typeof item === "object" &&
      typeof item.url === "string" &&
      item.url.trim(),
  );
  const hasFirstFrame = normalizedImageWithRoles.some(
    (item: any) => item.role === "first_frame",
  );

  if (!hasFirstFrame) {
    const fallbackFirstFrame =
      (typeof body.first_frame === "string" && body.first_frame.trim()) ||
      (typeof body.image === "string" && body.image.trim()) ||
      (Array.isArray(body.image_urls) &&
      typeof body.image_urls[0] === "string" &&
      body.image_urls[0].trim()
        ? body.image_urls[0]
        : "");

    if (fallbackFirstFrame) {
      normalizedImageWithRoles.unshift({
        url: fallbackFirstFrame,
        role: "first_frame",
      });
    }
  }

  return {
    ...body,
    image_with_roles: normalizedImageWithRoles,
  };
}

function resolveParamCombinationEndpoint(
  requestBody: any,
  paramCombinations: Record<string, any> | undefined,
) {
  if (!paramCombinations || Object.keys(paramCombinations).length === 0) {
    return undefined;
  }

  try {
    const camelToSnake = (str: string): string =>
      str.replace(/([A-Z])/g, "_$1").toLowerCase();
    const snakeToCamel = (str: string): string =>
      str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    const availableParamNames = new Set<string>();
    Object.keys(paramCombinations).forEach((key) => {
      const parts = key.split("&");
      parts.forEach((part) => {
        const [paramName] = part.split("=");
        if (paramName && paramName !== "duration") {
          availableParamNames.add(paramName);
        }
      });
    });

    const paramsForKey: Record<string, any> = {};
    if (requestBody) {
      Object.keys(requestBody).forEach((key) => {
        if (key === "duration") return;

        let dbParamName: string | null = null;
        if (availableParamNames.has(key)) {
          dbParamName = key;
        } else {
          const snakeCase = camelToSnake(key);
          if (availableParamNames.has(snakeCase)) {
            dbParamName = snakeCase;
          } else {
            const camelCase = snakeToCamel(key);
            if (availableParamNames.has(camelCase)) {
              dbParamName = camelCase;
            }
          }
        }

        if (dbParamName) {
          paramsForKey[dbParamName] = requestBody[key];
        }
      });
    }

    const paramKey = Object.entries(paramsForKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return paramCombinations[paramKey]?.apiEndpoint;
  } catch (e) {
    console.error("Failed to parse body for dynamic endpoint:", e);
    return undefined;
  }
}

async function prepareSceneRequest(req: Request, scene: string) {
  let requestBody: any = null;

  try {
    requestBody = await req.clone().json();

    if (scene === "image-to-video-seedance-2-0") {
      requestBody = normalizeSeedance20ImageToVideoBody(requestBody);
      const hasFirstFrame = Array.isArray(requestBody?.image_with_roles)
        ? requestBody.image_with_roles.some(
            (item: any) =>
              item?.role === "first_frame" &&
              typeof item?.url === "string" &&
              item.url.trim(),
          )
        : false;

      if (!hasFirstFrame) {
        return {
          error: respErr("first_frame is required"),
          requestBody,
          request: req,
        };
      }
    }

    return {
      requestBody,
      request: new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(requestBody),
      }),
    };
  } catch (e) {
    if (isClientAbortError(e)) {
      console.warn("[scene/generate] request body parsing aborted by client");
    } else {
      console.error("Failed to parse request body:", e);
    }

    return {
      requestBody,
      request: req,
    };
  }
}

function createTaskDataBuilder(
  scene: string,
  creditConfig: any,
): BuildTaskData {
  return (body: any, validatedParams: any) => {
    const allParams = validatedParams || body || {};
    const mediaType = creditConfig?.mediaType || allParams.mediaType;
    const model =
      allParams.model ||
      allParams.modelName ||
      allParams.model_id ||
      allParams.modelId ||
      scene;
    const prompt =
      allParams.prompt ||
      allParams.text ||
      allParams.input ||
      allParams.query ||
      allParams.description ||
      "";
    const options: Record<string, any> = {};
    const usedFields = new Set([
      "model",
      "modelName",
      "model_id",
      "modelId",
      "prompt",
      "text",
      "input",
      "query",
      "description",
    ]);

    Object.keys(allParams).forEach((key) => {
      if (!usedFields.has(key)) {
        options[key] = allParams[key];
      }
    });

    return {
      mediaType,
      model: String(model),
      prompt: String(prompt),
      options: Object.keys(options).length > 0 ? options : undefined,
    };
  };
}

function createPromptModerationCheck(params: {
  req: Request;
  scene: string;
  buildTaskData: BuildTaskData;
}) {
  const { req, scene, buildTaskData } = params;

  return async ({
    user,
    body,
    validatedParams,
    providerName,
    requiredCredits,
    freeUsed,
  }: {
    user: { id: string; email: string };
    body: any;
    validatedParams: any;
    providerName: string;
    requiredCredits: number;
    freeUsed: boolean;
  }) => {
    try {
      const prompt = extractPromptForModeration(body);
      if (!prompt) {
        return null;
      }

      const configs = await getAllConfigs();
      const isWhitelistUser = await shouldSkipNsfwCheck({
        userId: user.id,
        email: user.email,
        whitelistValue: configs.nsfw_whitelist_emails,
      });

      if (isWhitelistUser && !isCreemReviewMode()) {
        return null;
      }

      const moderationResult = await screenPromptWithCreem({
        prompt,
        apiKey: configs.creem_api_key,
        environment: configs.creem_environment,
        externalId: `${scene}:${user.id || "anonymous"}`,
      });

      if (
        !moderationResult?.decision ||
        moderationResult.decision === "allow"
      ) {
        return null;
      }

      const taskData = buildTaskData(body, validatedParams, providerName);
      await recordBlockedPromptTask({
        req,
        scene,
        user,
        providerName,
        taskData,
        prompt,
        moderationResult,
        requiredCredits,
      });
      await refundBlockedPromptCredits({
        scene,
        user,
        freeUsed,
        requiredCredits,
      });
      await chargePromptModerationCredit({
        scene,
        userId: user.id,
        promptLength: prompt.length,
        decision: moderationResult.decision,
      });

      return Response.json({
        code: -1,
        message: NSFW_BLOCKED_ERROR_CODE,
        errorCode: NSFW_BLOCKED_ERROR_CODE,
        data: {
          errorCode: NSFW_BLOCKED_ERROR_CODE,
        },
      });
    } catch (e) {
      console.error(
        "Prompt moderation failed, fallback to normal generation flow:",
        e,
      );
      return null;
    }
  };
}

async function recordBlockedPromptTask(params: {
  req: Request;
  scene: string;
  user: { id: string; email: string };
  providerName: string;
  taskData: TaskData;
  prompt: string;
  moderationResult: any;
  requiredCredits: number;
}) {
  const {
    req,
    scene,
    user,
    providerName,
    taskData,
    prompt,
    moderationResult,
    requiredCredits,
  } = params;

  try {
    const userAgent = req.headers.get("user-agent");
    const deviceType = detectDeviceType(userAgent);
    const blockedTask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType: taskData.mediaType,
      provider: providerName,
      model: taskData.model,
      prompt: taskData.prompt,
      options: JSON.stringify({
        ...(taskData.options || {}),
        moderation: {
          provider: "creem",
          decision: moderationResult.decision,
          blockedAt: new Date().toISOString(),
          promptLength: prompt.length,
        },
        __billing: {
          refundableCredits: requiredCredits,
          chargedCredits: 0,
          moderationCredits: 1,
        },
      }),
      status: AITaskStatus.FAILED,
      costCredits: 0,
      scene,
      taskInfo: JSON.stringify({
        errorCode: NSFW_BLOCKED_ERROR_CODE,
        errorMessage: "Prompt was blocked by NSFW moderation",
        moderation: moderationResult,
      }),
      deviceType,
      userAgent: userAgent || undefined,
    };

    await createAITask(blockedTask, {
      creditsAlreadyConsumed: true,
    });
  } catch (taskError) {
    console.error(
      "[prompt-moderation] failed to record blocked prompt task:",
      taskError,
    );
  }
}

async function refundBlockedPromptCredits(params: {
  scene: string;
  user: { id: string; email: string };
  freeUsed: boolean;
  requiredCredits: number;
}) {
  const { scene, user, freeUsed, requiredCredits } = params;

  try {
    await refundWavespeedCredits({
      userId: user.id,
      userEmail: user.email,
      freeUsed,
      refundCredits: freeUsed ? 0 : requiredCredits,
      description: `Refund for blocked NSFW prompt in scene ${scene}`,
    });
  } catch (refundError) {
    console.error(
      "[prompt-moderation] failed to refund scene credits after NSFW block:",
      refundError,
    );
  }
}

async function chargePromptModerationCredit(params: {
  scene: string;
  userId: string;
  promptLength: number;
  decision: string;
}) {
  const { scene, userId, promptLength, decision } = params;

  try {
    await consumeCredits({
      userId,
      credits: 1,
      scene: "nsfw_prompt_moderation",
      description: `NSFW prompt moderation charge for scene ${scene}`,
      metadata: JSON.stringify({
        provider: "creem",
        scene,
        decision,
        promptLength,
      }),
    });
  } catch (creditError) {
    console.error(
      "[prompt-moderation] failed to deduct NSFW moderation credit:",
      creditError,
    );
  }
}

export async function submitSceneGeneration(req: Request, scene: string) {
  const provider = await getProviderForScenario(scene);
  if (!provider) {
    const creditCostsConfig = await getCreditCostsConfig();
    const allScenarios = Object.keys(creditCostsConfig.costs || {});
    return respErr(
      `Unsupported scenario: ${scene}. Supported scenarios: ${allScenarios.join(", ")}`,
    );
  }

  const providerName = await findProviderForScenario(scene);
  const scenarioPricing = await getScenarioPricingAsync(providerName, scene);

  if (!scenarioPricing) {
    return respErr(`No pricing configuration found for scenario: ${scene}`);
  }

  const creditConfig = await getCreditConfig(scene);
  const prepared = await prepareSceneRequest(req, scene);

  if (prepared.error) {
    return prepared.error;
  }

  const customEndpoint = resolveParamCombinationEndpoint(
    prepared.requestBody,
    scenarioPricing.paramCombinations,
  );
  const freeGenerationKey =
    creditConfig?.type === "fixed" ? creditConfig.freeGenerationKey : undefined;
  const validateParams =
    scenarioPricing.requestParams && scenarioPricing.requestParams.length > 0
      ? buildValidateParamsFromRequestParams(scenarioPricing.requestParams)
      : (body: any) => ({ valid: true, params: body });
  const buildTaskData = createTaskDataBuilder(scene, creditConfig);

  return handleWavespeedAPIRequest(prepared.request, {
    apiKey: scene,
    endpoint: scenarioPricing.apiEndpoint,
    supportFreeGeneration: freeGenerationKey !== undefined,
    scene,
    description: scenarioPricing.description || `${scene} request`,
    validateParams,
    buildPayload: (body: any) => body,
    buildMetadata: () => ({
      type: scene,
    }),
    buildTaskData,
    enablePromptOptimizer: false,
    preExternalApiCheck: createPromptModerationCheck({
      req: prepared.request,
      scene,
      buildTaskData,
    }),
    ...(customEndpoint ? { customEndpoint } : {}),
  } as any);
}
