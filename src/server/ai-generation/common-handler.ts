import { respData, respErr } from "@/shared/lib/resp";
import {
  checkAndConsumeCredits,
  refundWavespeedCredits,
  CreditCheckOptions,
} from "@/app/api/utils";
import { getRemainingCredits } from "@/shared/models/credit";
import { findUserById, getUserInfo } from "@/shared/models/user";
import {
  calculateRequiredCredits,
  getFreeGenerationKey,
  getCreditConfig,
} from "@/config/credit-config";
import {
  findProviderForScenario,
  getWebhookConfig,
  getProviderForScenario,
  getScenarioPricingAsync,
  ProviderScenarioPricing,
  RequestParamMapping,
} from "@/config/pricing-config";
import {
  createAITask,
  updateAITaskById,
  NewAITask,
  UpdateAITask,
} from "@/shared/models/ai_task";
import { createPromptEnhanceLog } from "@/shared/models/prompt-enhance-log";
import { AITaskStatus } from "@/extensions/ai";
import { getUuid } from "@/shared/lib/hash";
import { detectDeviceType } from "@/shared/lib/device-detector";
import { envConfigs } from "@/config";
import { getAllConfigsDirectly } from "@/shared/models/config";
import { persistGeneratedOutputsToR2 } from "@/shared/lib/generated-output-r2";
import { persistSuccessfulOutputsToCreations } from "@/server/ai-generation/workbench-output";

/**
 * 辅助函数：将驼峰命名转换为下划线命名
 */
function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * 辅助函数：将下划线命名转换为驼峰命名
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 从参数组合配置中提取可用的参数名（排除 duration）
 */
function extractAvailableParamNames(
  paramCombinations: Record<string, any>,
): Set<string> {
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
  return availableParamNames;
}

/**
 * 匹配参数名（支持驼峰和下划线两种格式）
 */
function matchParamName(
  key: string,
  availableParamNames: Set<string>,
): string | null {
  // 1. 直接匹配
  if (availableParamNames.has(key)) {
    return key;
  }

  // 2. 尝试将驼峰转换为下划线后匹配
  const snakeCase = camelToSnake(key);
  if (availableParamNames.has(snakeCase)) {
    return snakeCase;
  }

  // 3. 尝试将下划线转换为驼峰后匹配
  const camelCase = snakeToCamel(key);
  if (availableParamNames.has(camelCase)) {
    return camelCase;
  }

  return null;
}

/**
 * 规范化参数值（用于生成参数组合 key）
 * 例如：将 "fast 720p" 转换为 "fast 720p"（仅统一大小写）
 *      当场景配置开启 normalizeSizeToX 时，将 "2048*2048" / "2048×2048" 统一转换为 "2048x2048"
 */
function normalizeParamValue(
  paramName: string,
  value: any,
  options?: { normalizeSizeToX?: boolean },
): any {
  if (typeof value !== "string") {
    return value;
  }

  let v = value.toLowerCase();

  // 尺寸相关参数归一化，仅在场景显式开启时生效
  if (options?.normalizeSizeToX) {
    if (
      paramName === "size" ||
      paramName === "resolution" ||
      paramName === "image_size" ||
      paramName.endsWith("_size") ||
      paramName.endsWith("_resolution")
    ) {
      v = v.replace(/×/g, "x").replace(/\*/g, "x");
    }
  }

  return v;
}

/**
 * 根据参数组合配置生成参数组合的 key
 */
function generateParamCombinationKey(
  scenarioPricing: ProviderScenarioPricing,
  validatedParams: Record<string, any>,
): string | null {
  if (
    !scenarioPricing.paramCombinations ||
    Object.keys(scenarioPricing.paramCombinations).length === 0
  ) {
    return null;
  }

  const availableParamNames = extractAvailableParamNames(
    scenarioPricing.paramCombinations,
  );
  const normalizeSizeToX = Boolean((scenarioPricing as any).normalizeSizeToX);

  // 构建参数组合的 key（排除 duration 参数）
  const paramsForKey: Record<string, any> = {};
  if (validatedParams) {
    Object.keys(validatedParams).forEach((key) => {
      if (key === "duration") return;

      const dbParamName = matchParamName(key, availableParamNames);
      if (dbParamName) {
        const value = validatedParams[key];
        // 规范化参数值（统一转换为小写；当场景开启 normalizeSizeToX 时，额外处理分辨率分隔符）
        paramsForKey[dbParamName] = normalizeParamValue(dbParamName, value, {
          normalizeSizeToX,
        });
      }
    });
  }

  // 生成参数组合的 key（按字母顺序排序）
  const paramKey = Object.entries(paramsForKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return paramKey || null;
}

/**
 * 根据参数组合配置查找对应的 API endpoint
 */
function findApiEndpointFromParamCombinations(
  scenarioPricing: ProviderScenarioPricing,
  validatedParams: Record<string, any>,
): string | undefined {
  const paramKey = generateParamCombinationKey(
    scenarioPricing,
    validatedParams,
  );
  if (!paramKey) {
    return undefined;
  }

  // 查找参数组合级别的 apiEndpoint
  return scenarioPricing.paramCombinations?.[paramKey]?.apiEndpoint;
}

/**
 * 根据参数组合配置查找对应的参数组合配置对象
 */
function findParamCombinationConfig(
  scenarioPricing: ProviderScenarioPricing,
  validatedParams: Record<string, any>,
): any | null {
  const paramKey = generateParamCombinationKey(
    scenarioPricing,
    validatedParams,
  );
  if (!paramKey) {
    return null;
  }

  return scenarioPricing.paramCombinations?.[paramKey] || null;
}

/**
 * 确定 API endpoint（按优先级查找，不包括参数组合级别）
 */
function resolveApiEndpoint(
  scenarioPricing: ProviderScenarioPricing | null,
  provider: any,
  defaultEndpoint: string | undefined,
): string | null {
  // 1. 使用场景级别的配置
  if (scenarioPricing?.apiEndpoint) {
    return scenarioPricing.apiEndpoint;
  }

  // 2. 使用 provider 级别的配置
  if (provider?.apiEndpoint) {
    return provider.apiEndpoint;
  }

  // 3. 使用默认 endpoint
  if (defaultEndpoint) {
    return defaultEndpoint;
  }

  return null;
}

/**
 * 构建完整的 API URL
 */
function buildApiUrl(apiEndpoint: string, provider: any): string {
  if (apiEndpoint.startsWith("http://") || apiEndpoint.startsWith("https://")) {
    return apiEndpoint;
  }

  const baseUrl = provider?.baseUrl || "https://api.wavespeed.ai";
  return `${baseUrl}${apiEndpoint.startsWith("/") ? "" : "/"}${apiEndpoint}`;
}

export interface WavespeedAPIHandlerOptions {
  /** API 标识键（对应数据库中的 credit costs 配置的 key） */
  apiKey: string;
  /** API 端点（如果场景配置中没有，则使用此值） */
  endpoint?: string;
  /** 请求体构建函数 */
  buildPayload: (body: any, validatedParams?: any) => Record<string, any>;
  /** 参数验证函数 */
  validateParams?: (body: any) => {
    valid: boolean;
    params?: any;
    error?: string;
  };
  /** 自定义积分计算函数（可选，覆盖配置文件） */
  customCreditCalculator?: (params: Record<string, any>) => number;
  /** 场景名称（用于积分记录） */
  scene?: string;
  /** 描述（用于积分记录） */
  description?: string;
  /** 元数据构建函数 */
  buildMetadata?: (body: any, params?: any) => Record<string, any>;
  /** 是否支持免费生成次数 */
  supportFreeGeneration?: boolean;
  /** 自定义 API Key（可选，覆盖 provider 配置） */
  customApiKey?: string;
  /** 自定义 API Endpoint（可选，覆盖 provider 配置） */
  customEndpoint?: string;
  /** @deprecated 是否保存 task 到数据库（已弃用，现在从 credit_costs_config 中读取 saveTaskToDb 配置） */
  saveTask?: boolean;
  /** 构建 task 数据的函数（当需要保存 task 时使用，由 saveTaskToDb 配置决定） */
  buildTaskData?: (
    body: any,
    validatedParams: any,
    providerName: string,
  ) => {
    mediaType: string;
    model: string;
    prompt: string;
    options?: any; // 可以是任何类型，会在保存时转换为 JSON 字符串
  };
  /** 为 true 时在 buildRequest 前调用 prompt-optimizer 并写回 validatedParams */
  enablePromptOptimizer?: boolean;
  /** 调用上游前的预检查，可用于审核、拦截等 */
  preExternalApiCheck?: (context: {
    user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>;
    body: any;
    validatedParams: any;
    apiKey: string;
    scene?: string;
    providerName: string;
    requiredCredits: number;
    freeUsed: boolean;
  }) => Promise<Response | null>;
}

const PROMPT_PARAM_KEYS = [
  "prompt",
  "text",
  "input",
  "query",
  "description",
] as const;

function extractPromptFromValidatedParams(params: Record<string, any>): string {
  if (!params) return "";
  const v =
    params.prompt ??
    params.text ??
    params.input ??
    params.query ??
    params.description;
  return typeof v === "string" ? v.trim() : "";
}

function extractImageUrlFromParams(
  params: Record<string, any>,
): string | undefined {
  if (!params) return undefined;
  const raw =
    params.image ??
    params.image_url ??
    params.input_image ??
    params.reference_image;
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const s = raw.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return undefined;
}

/**
 * 调用 Wavespeed prompt-optimizer，返回优化后的文本；失败时返回 null（调用方回退为原 prompt）
 */
async function callPromptOptimizer(options: {
  baseUrl: string;
  apiKey: string;
  text: string;
  mode: "image" | "video";
  image?: string;
}): Promise<string | null> {
  const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/prompt-optimizer";
  const body: Record<string, unknown> = {
    enable_sync_mode: true,
    text: options.text,
    mode: options.mode,
    style: "default",
  };
  if (options.image) body.image = options.image;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        "[prompt-optimizer] API non-OK:",
        options.apiKey,
        res.status,
        errText,
      );
      return null;
    }
    const data = (await res.json()) as Record<string, any>;
    console.log(
      "[prompt-optimizer] response data:",
      JSON.stringify(data, null, 2),
    );
    // 优先解析 Wavespeed prompt-optimizer 的 outputs 数组，其次兼容其他字段
    const outputs = data?.data?.outputs;
    const optimized =
      (Array.isArray(outputs)
        ? outputs.find((v: any) => typeof v === "string" && v.trim())
        : undefined) ??
      data?.data?.text ??
      data?.data?.output ??
      data?.result?.optimized_prompt ??
      data?.text ??
      data?.output ??
      data?.optimized_prompt;
    if (typeof optimized === "string" && optimized.trim())
      return optimized.trim();
    console.warn(
      "[prompt-optimizer] No optimized text in response:",
      Object.keys(data || {}),
    );
    return null;
  } catch (e: any) {
    console.warn("[prompt-optimizer] Request failed:", e?.message || e);
    return null;
  }
}

function writeOptimizedPromptToParams(
  params: Record<string, any>,
  optimizedText: string,
): void {
  for (const key of PROMPT_PARAM_KEYS) {
    params[key] = optimizedText;
  }
}

/**
 * 用户认证和请求解析结果
 */
interface AuthAndValidationResult {
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>;
  body: any;
  validatedParams: any;
}

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

/**
 * 类型守卫：检查是否为错误响应
 */
function isErrorResponse(value: any): value is Response {
  return value instanceof Response;
}

/**
 * 认证用户并解析验证请求参数
 */
async function authenticateAndValidateRequest(
  req: Request,
  validateParams?: (body: any) => {
    valid: boolean;
    params?: any;
    error?: string;
  },
): Promise<AuthAndValidationResult | Response> {
  const user = await getUserInfo();
  if (!user) {
    return respErr("no auth, please sign in");
  }

  let body: any;
  try {
    body = await req.json();
  } catch (error) {
    if (isClientAbortError(error)) {
      console.warn("[API Handler] request body parsing aborted by client");
      return respErr("request aborted");
    }
    throw error;
  }
  let validatedParams: any = body;

  if (validateParams) {
    const validation = validateParams(body);
    if (!validation.valid) {
      return respErr(validation.error || "Invalid parameters");
    }
    validatedParams = validation.params || body;
  }

  return { user, body, validatedParams };
}

/**
 * 积分消费结果
 */
interface CreditConsumptionResult {
  freeUsed: boolean;
  requiredCredits: number;
}

/**
 * 计算所需积分
 */
async function calculateCredits(
  apiKey: string,
  validatedParams: any,
  customCreditCalculator?: (params: Record<string, any>) => number,
): Promise<number | Response> {
  if (customCreditCalculator) {
    return customCreditCalculator(validatedParams);
  }

  try {
    return await calculateRequiredCredits(apiKey, validatedParams);
  } catch (e: any) {
    console.error(`Failed to calculate credits for ${apiKey}:`, e);
    return respErr(e.message || "Failed to calculate credits");
  }
}

/**
 * 检查并消费积分（支持免费生成次数）
 */
async function checkAndConsumeCreditsForRequest(
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>,
  apiKey: string,
  requiredCredits: number,
  options: {
    supportFreeGeneration?: boolean;
    scene?: string;
    description?: string;
    buildMetadata?: (body: any, params?: any) => Record<string, any>;
    body: any;
    validatedParams: any;
    providerName: string;
  },
): Promise<CreditConsumptionResult | Response> {
  const {
    supportFreeGeneration = false,
    scene,
    description,
    buildMetadata,
    body,
    validatedParams,
    providerName,
  } = options;

  // 获取免费次数类型（如果支持）
  const freeGenerationKey = supportFreeGeneration
    ? await getFreeGenerationKey(apiKey)
    : undefined;

  // 统一由 checkAndConsumeCredits 处理免费次数和积分消费，避免重复扣费
  const creditCheckResult = await checkAndConsumeCredits({
    requiredCredits,
    scene: scene || apiKey,
    description: description || `${apiKey} request`,
    metadata: buildMetadata
      ? {
          ...buildMetadata(body, validatedParams),
          provider: providerName,
        }
      : ({
          type: apiKey,
          provider: providerName,
        } as Record<string, any>),
    freeGenerationKey: freeGenerationKey as any,
  });

  if (creditCheckResult.code !== 0) {
    return respErr(creditCheckResult.message);
  }

  const creditData = creditCheckResult.data;
  if (!creditData || !creditData.success) {
    return respData({
      success: false,
      hasEnoughCredits: false,
      remainingCredits: creditData?.remainingCredits || 0,
      requiredCredits,
      message: creditData?.message || "Failed to consume credits",
    });
  }

  return {
    freeUsed: creditData.usedFreeGeneration || false,
    requiredCredits,
  };
}

/**
 * API 配置信息
 */
interface ApiConfig {
  provider: any;
  providerName: string;
  scenarioPricing: ProviderScenarioPricing | null;
  apiEndpoint: string;
  apiKey: string;
  paramCombinationConfig: any;
  responseMapping: any;
}

/**
 * 解析并获取 API 配置
 */
async function resolveApiConfig(
  apiKey: string,
  endpoint: string | undefined,
  validatedParams: any,
  options: {
    customEndpoint?: string;
    customApiKey?: string;
  },
): Promise<ApiConfig | Response> {
  const { customEndpoint, customApiKey } = options;

  // 获取 Provider 配置
  const provider = await getProviderForScenario(apiKey);
  const providerName = provider
    ? await findProviderForScenario(apiKey)
    : "wavespeed";

  // 获取场景价格配置
  const scenarioPricing = provider
    ? await getScenarioPricingAsync(providerName, apiKey)
    : null;

  // 从 credit_costs_config 读取 saveTaskToDb 配置并合并到 scenarioPricing
  if (scenarioPricing) {
    const creditConfig = await getCreditConfig(apiKey);
    if (creditConfig && creditConfig.saveTaskToDb !== undefined) {
      scenarioPricing.saveTaskToDb = creditConfig.saveTaskToDb;
    }
  }

  // 确定 API endpoint（按优先级查找）
  let apiEndpoint: string | null = null;

  if (customEndpoint) {
    apiEndpoint = customEndpoint;
  } else if (scenarioPricing) {
    const paramEndpoint = findApiEndpointFromParamCombinations(
      scenarioPricing,
      validatedParams,
    );
    if (paramEndpoint) {
      apiEndpoint = paramEndpoint;
    } else {
      apiEndpoint = resolveApiEndpoint(scenarioPricing, provider, endpoint);
    }
  } else {
    apiEndpoint = resolveApiEndpoint(null, provider, endpoint);
  }

  if (!apiEndpoint) {
    return respErr(`No API endpoint configured for scenario ${apiKey}`);
  }

  // 确定 API Key
  const resolvedApiKey = customApiKey || provider?.apiKey;
  if (!resolvedApiKey) {
    return respErr(`No API key configured for provider ${providerName}`);
  }

  // 查找参数组合配置
  const paramCombinationConfig = scenarioPricing
    ? findParamCombinationConfig(scenarioPricing, validatedParams)
    : null;

  // 获取响应映射配置（参数组合级别 > 场景级别 > Provider 级别）
  const responseMapping =
    paramCombinationConfig?.responseMapping ??
    scenarioPricing?.responseMapping ??
    provider?.responseMapping;

  return {
    provider,
    providerName,
    scenarioPricing,
    apiEndpoint,
    apiKey: resolvedApiKey,
    paramCombinationConfig,
    responseMapping,
  };
}

/**
 * 请求构建结果
 */
interface RequestBuildResult {
  url: string;
  headers: Record<string, string>;
  requestBody: any;
}

interface WebhookRuntimeConfig {
  enabled: boolean;
  callbackUrl: string;
  source: "body" | "query" | "header";
  paramName: string;
}

function getWebhookProviderSlug(providerName: string) {
  return providerName.toLowerCase().includes("wavespeed")
    ? "wavespeed"
    : providerName;
}

function shouldEnableWebhookMode(body: any): boolean {
  if (
    body?.enable_webhook === false ||
    body?.enableWebhook === false ||
    body?.webhook_mode === false
  ) {
    return false;
  }

  return true;
}

async function resolveWebhookRuntimeConfig(params: {
  req: Request;
  body: any;
  providerName: string;
  scenarioName: string;
  paramCombinationKey?: string | null;
}): Promise<WebhookRuntimeConfig | null> {
  const webhookRequested = shouldEnableWebhookMode(params.body);
  if (!webhookRequested) {
    console.log("[API Handler] webhook disabled by request body", {
      providerName: params.providerName,
      scenarioName: params.scenarioName,
    });
    return null;
  }

  const runtimeConfigs = await getAllConfigsDirectly();
  const callbackBaseUrl = (
    runtimeConfigs.ai_webhook_base_url ||
    runtimeConfigs.app_url ||
    envConfigs.ai_webhook_base_url ||
    envConfigs.app_url ||
    new URL(params.req.url).origin ||
    ""
  ).replace(/\/+$/, "");
  if (!callbackBaseUrl) {
    return null;
  }

  const webhookConfig = await getWebhookConfig(
    params.providerName,
    params.scenarioName,
    params.paramCombinationKey || undefined,
  );

  console.log("[API Handler] webhook config resolved", {
    providerName: params.providerName,
    scenarioName: params.scenarioName,
    paramCombinationKey: params.paramCombinationKey || null,
    webhookRequested,
    callbackBaseUrl,
    webhookConfig,
  });

  if (!webhookConfig?.enabled) {
    console.log("[API Handler] webhook not enabled for provider/scenario", {
      providerName: params.providerName,
      scenarioName: params.scenarioName,
      webhookConfig,
    });
    return null;
  }

  const callbackUrl = new URL(
    `/api/ai/notify/${encodeURIComponent(getWebhookProviderSlug(params.providerName))}`,
    callbackBaseUrl,
  );

  return {
    enabled: true,
    callbackUrl: callbackUrl.toString(),
    source: webhookConfig.source || "query",
    paramName: webhookConfig.paramName || "webhook",
  };
}

/**
 * 转换参数值类型
 */
function convertParamType(value: any, type?: string): any {
  if (value === undefined || !type) {
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

/**
 * 从请求头获取参数值
 */
function getHeaderValue(
  req: Request,
  param: RequestParamMapping,
): string | undefined {
  if (!param.value) {
    return param.defaultValue;
  }

  const requestHeaderName = param.value.toLowerCase();
  const requestHeaderValue =
    req.headers.get(param.value) || req.headers.get(requestHeaderName);

  return requestHeaderValue !== null
    ? requestHeaderValue
    : param.value || param.defaultValue;
}

/**
 * 处理 requestBodyTemplate 模板，将模板中的占位符替换为实际参数值
 *
 * 支持的语法：
 * - "{{paramName}}" → 替换为 validatedParams[paramName]
 * - { "$spread": "paramName", "$wrap": "keyName" } → 数组展开为 [{keyName: item1}, ...]
 */
function resolveTemplate(template: any, params: Record<string, any>): any {
  if (template === null || template === undefined) {
    return template;
  }

  // 字符串：替换 {{paramName}} 占位符
  if (typeof template === "string") {
    // 完全匹配 "{{paramName}}" → 直接返回原始值（保留类型）
    const exactMatch = template.match(/^\{\{(.+?)\}\}$/);
    if (exactMatch) {
      const paramName = exactMatch[1].trim();
      const value = params[paramName];
      return value === "" || value === null || value === undefined
        ? undefined
        : value;
    }
    // 部分匹配：字符串内嵌 {{paramName}} → 替换为字符串值
    return template.replace(/\{\{(.+?)\}\}/g, (_, paramName) => {
      const value = params[paramName.trim()];
      return value === "" || value === null || value === undefined
        ? ""
        : String(value);
    });
  }

  // 数组：递归处理每个元素，遇到 $spread 指令则展开
  if (Array.isArray(template)) {
    const result: any[] = [];
    for (const item of template) {
      if (
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        item.$spread
      ) {
        const arr = params[item.$spread];
        if (Array.isArray(arr)) {
          const wrapKey = item.$wrap;
          for (const val of arr) {
            result.push(wrapKey ? { [wrapKey]: val } : val);
          }
        }
      } else {
        result.push(resolveTemplate(item, params));
      }
    }
    return result;
  }

  // 对象：递归处理每个属性值
  if (typeof template === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = resolveTemplate(value, params);
    }
    return result;
  }

  // 其他基本类型（number、boolean）直接返回
  return template;
}

/**
 * 递归移除请求体中的空字段
 * - 对象字段值为 '' / null / undefined 时不传
 * - 数组中的空项也一并移除
 */
function pruneEmptyRequestBodyFields(value: any): any {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const result = value
      .map((item) => pruneEmptyRequestBodyFields(item))
      .filter((item) => item !== undefined);

    return result.length > 0 ? result : undefined;
  }

  if (typeof value === "object") {
    const result: Record<string, any> = {};

    Object.entries(value).forEach(([key, item]) => {
      const cleaned = pruneEmptyRequestBodyFields(item);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    });

    return Object.keys(result).length > 0 ? result : undefined;
  }

  return value;
}

/**
 * 构建请求（URL、headers、body）
 */
function buildRequest(
  req: Request,
  apiEndpoint: string,
  provider: any,
  validatedParams: any,
  body: any,
  buildPayload: (body: any, validatedParams?: any) => Record<string, any>,
  scenarioPricing: ProviderScenarioPricing | null,
  paramCombinationConfig: any,
): RequestBuildResult {
  const requestParams =
    paramCombinationConfig?.requestParams ??
    scenarioPricing?.requestParams ??
    provider?.requestParams;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(provider?.defaultHeaders || {}),
  };

  let requestBody: any = null;
  const queryParams: Record<string, string> = {};
  const pathParams: Record<string, string> = {};
  let url = buildApiUrl(apiEndpoint, provider);

  // 优先使用 requestBodyTemplate 构建嵌套请求体
  const requestBodyTemplate =
    paramCombinationConfig?.requestBodyTemplate ??
    scenarioPricing?.requestBodyTemplate;

  if (requestBodyTemplate) {
    requestBody = resolveTemplate(
      requestBodyTemplate,
      validatedParams || body || {},
    );

    // 仍然处理 header / path / query 类型的 requestParams
    if (requestParams && requestParams.length > 0) {
      requestParams.forEach((param: RequestParamMapping) => {
        if (param.source === "header") {
          const value = getHeaderValue(req, param);
          if (value !== undefined && value !== null) {
            headers[param.name] = String(value);
          }
        } else if (param.source === "path") {
          const paramKey = param.value || param.name;
          const pathValue = validatedParams?.[paramKey] || param.defaultValue;
          if (pathValue !== undefined) {
            pathParams[param.name] = String(pathValue);
          }
        } else if (param.source === "query") {
          const paramKey = param.value || param.name;
          const value = validatedParams?.[paramKey] ?? param.defaultValue;
          if (value !== undefined && value !== null) {
            queryParams[param.name] = String(value);
          }
        }
      });

      // 替换 URL 中的路径参数占位符
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value).replace(`:${key}`, value);
      });

      // 添加查询参数
      if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString();
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
  } else if (requestParams && requestParams.length > 0) {
    const processedParamNames = new Set<string>();
    const processedParamValues = new Set<string>();

    requestParams.forEach((param: RequestParamMapping) => {
      let value: any = param.defaultValue;

      if (param.source === "static") {
        // 场景级固定参数：总是使用配置中的静态值
        value = param.value ?? param.defaultValue;
      } else if (param.source === "body" || param.source === "query") {
        const paramKey = param.value || param.name;
        processedParamNames.add(param.name);
        processedParamValues.add(paramKey);
        const sourceValue = validatedParams?.[paramKey];
        value = sourceValue !== undefined ? sourceValue : param.defaultValue;
      } else if (param.source === "header") {
        value = getHeaderValue(req, param);
        if (value !== undefined && value !== null) {
          headers[param.name] = String(value);
        }
        return; // header 参数不继续处理
      } else if (param.source === "path") {
        const paramKey = param.value || param.name;
        processedParamNames.add(param.name);
        processedParamValues.add(paramKey);
        const pathValue = validatedParams?.[paramKey] || param.defaultValue;
        if (pathValue !== undefined) {
          pathParams[param.name] = String(pathValue);
        }
        return; // path 参数单独处理
      }

      // 类型转换
      value = convertParamType(value, param.type);

      // 根据 source 分配到不同的位置
      if (param.source === "body" || param.source === "static") {
        if (value !== undefined && value !== null) {
          if (!requestBody) requestBody = {};
          requestBody[param.name] = value;
        }
      } else if (param.source === "query") {
        if (url.includes(`{${param.name}}`) || url.includes(`:${param.name}`)) {
          pathParams[param.name] = String(value);
        } else {
          queryParams[param.name] = String(value);
        }
      }
    });

    // 合并未配置的 body 参数
    if (validatedParams && requestBody) {
      Object.keys(validatedParams).forEach((key) => {
        if (!processedParamValues.has(key) && !processedParamNames.has(key)) {
          const value = validatedParams[key];
          if (value !== undefined && value !== null) {
            requestBody[key] = value;
          }
        }
      });
    }

    // 替换 URL 中的路径参数占位符
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value).replace(`:${key}`, value);
    });

    // 添加查询参数
    const remainingQueryParams: Record<string, string> = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (!pathParams[key]) {
        remainingQueryParams[key] = value;
      }
    });
    if (Object.keys(remainingQueryParams).length > 0) {
      const queryString = new URLSearchParams(remainingQueryParams).toString();
      url += (url.includes("?") ? "&" : "?") + queryString;
    }

    // 如果没有 body 参数，使用 buildPayload 作为后备
    if (
      !requestBody &&
      Object.keys(queryParams).length === 0 &&
      Object.keys(pathParams).length === 0
    ) {
      requestBody = buildPayload(body, validatedParams);
    }
  } else {
    requestBody = buildPayload(body, validatedParams);
  }

  // 如果场景开启了尺寸归一化开关，则对实际请求体中的尺寸参数做 "*" / "×" → "x" 的转换
  if (
    scenarioPricing?.normalizeSizeToX &&
    requestBody &&
    typeof requestBody === "object"
  ) {
    Object.keys(requestBody).forEach((key) => {
      const val = requestBody[key];
      if (
        typeof val === "string" &&
        (key === "size" ||
          key === "resolution" ||
          key === "image_size" ||
          key.endsWith("_size") ||
          key.endsWith("_resolution"))
      ) {
        requestBody[key] = val.replace(/×/g, "x").replace(/\*/g, "x");
      }
    });
  }

  if (
    requestBody &&
    typeof requestBody === "object" &&
    !Array.isArray(requestBody)
  ) {
    delete requestBody.enable_webhook;
    delete requestBody.enableWebhook;
    delete requestBody.webhook_mode;
  }

  requestBody = pruneEmptyRequestBodyFields(requestBody) ?? null;

  return { url, headers, requestBody };
}

/**
 * 处理请求体中的特殊参数（如 resolution）
 */
function normalizeRequestBody(requestBody: any): any {
  if (requestBody && typeof requestBody.resolution === "string") {
    const resolution = requestBody.resolution.toLowerCase();
    if (resolution.startsWith("fast ")) {
      requestBody.resolution = resolution.replace("fast ", "");
    }
  }
  return requestBody;
}

/**
 * API 调用结果
 */
interface ApiCallResult {
  success: boolean;
  response?: Response;
  error?: Response;
}

function summarizeHeaders(response: Response) {
  const headerNames = [
    "content-type",
    "content-length",
    "transfer-encoding",
    "inference-id",
    "x-request-id",
    "x-inference-id",
  ];

  const summary: Record<string, string> = {};
  headerNames.forEach((name) => {
    const value = response.headers.get(name);
    if (value) {
      summary[name] = value;
    }
  });

  return summary;
}

function safeSerializeForLog(value: unknown, maxLength: number = 1200) {
  try {
    const text =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return text.length > maxLength
      ? `${text.slice(0, maxLength)}...<truncated>`
      : text;
  } catch {
    return String(value);
  }
}

function summarizeResultForLog(result: any) {
  return {
    topLevelKeys:
      result && typeof result === "object" ? Object.keys(result) : [],
    status:
      result?.data?.status ?? result?.status ?? result?.data?.data?.status,
    requestId:
      result?.data?.id ??
      result?.data?.requestId ??
      result?.requestId ??
      result?.id,
    outputCount: Array.isArray(result?.data?.outputs)
      ? result.data.outputs.length
      : Array.isArray(result?.outputs)
        ? result.outputs.length
        : 0,
    fallbackSource: result?._fallback?.source,
    preview: safeSerializeForLog(result),
  };
}

/**
 * 调用外部 API
 */
async function callExternalApi(
  url: string,
  headers: Record<string, string>,
  requestBody: any,
  apiKey: string,
  timeout: number = 30000,
): Promise<ApiCallResult> {
  headers["Authorization"] = `Bearer ${apiKey}`;

  const normalizedBody = normalizeRequestBody(requestBody);
  const fetchOptions: RequestInit = {
    method: "POST",
    headers,
  };

  if (normalizedBody) {
    if (headers["Content-Type"]?.includes("application/json")) {
      fetchOptions.body = JSON.stringify(normalizedBody);
    } else {
      fetchOptions.body = normalizedBody;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    console.log("[API Call] upstream response summary:", {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: summarizeHeaders(response),
    });
    clearTimeout(timeoutId);
    return { success: true, response };
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.error("[API Call] upstream fetch failed:", {
      url,
      message: e?.message,
      name: e?.name,
      cause: e?.cause
        ? {
            name: e.cause.name,
            message: e.cause.message,
            code: e.cause.code,
          }
        : undefined,
    });
    if (e.name === "AbortError") {
      return {
        success: false,
        error: respErr(`Request timeout after ${timeout}ms`),
      };
    }
    throw e;
  }
}

/**
 * 返还积分的辅助函数
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

/**
 * 解析 API 响应
 */
function buildResponseHeaderFallback(response: Response) {
  const inferenceId =
    response.headers.get("inference-id") ||
    response.headers.get("x-request-id") ||
    response.headers.get("x-inference-id");

  if (!inferenceId) {
    return null;
  }

  return {
    id: inferenceId,
    requestId: inferenceId,
    status: "created",
    outputs: [],
    data: {
      id: inferenceId,
      requestId: inferenceId,
      status: "created",
      outputs: [],
    },
    _fallback: {
      source: "response-headers",
    },
  };
}

async function parseApiResponse(
  response: Response,
  responseMapping: any,
): Promise<any> {
  try {
    if (!responseMapping) {
      return await response.json();
    }

    if (responseMapping.format === "json") {
      return await response.json();
    } else if (responseMapping.format === "text") {
      const text = await response.text();
      return { text };
    } else {
      // binary 格式，返回 base64
      const buffer = await response.arrayBuffer();
      return { data: Buffer.from(buffer).toString("base64") };
    }
  } catch (error) {
    const fallbackResult = buildResponseHeaderFallback(response);

    if (response.ok && fallbackResult) {
      console.warn(
        "[API Handler] Failed to read response body, falling back to response headers:",
        {
          error: error instanceof Error ? error.message : String(error),
          headers: summarizeHeaders(response),
          fallback: summarizeResultForLog(fallbackResult),
        },
      );
      return fallbackResult;
    }

    console.error("[API Handler] Failed to parse upstream response body:", {
      error: error instanceof Error ? error.message : String(error),
      headers: summarizeHeaders(response),
    });
    throw error;
  }
}

/**
 * 验证响应状态
 */
async function validateResponseStatus(
  result: any,
  response: Response,
  responseMapping: any,
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>,
  freeUsed: boolean,
  requiredCredits: number,
  apiKey: string,
  providerName: string,
): Promise<Response | null> {
  if (!responseMapping?.statusPath) {
    return null;
  }

  const status = getNestedValue(result, responseMapping.statusPath);
  const isSuccess = responseMapping.successStatus?.includes(status);
  const isFailure = responseMapping.failureStatus?.includes(status);

  if (isFailure || (!isSuccess && status && !response.ok)) {
    const errorMessage = responseMapping.errorPath
      ? getNestedValue(result, responseMapping.errorPath) || "Request failed"
      : "Request failed";

    await refundCredits(
      user,
      requiredCredits,
      apiKey,
      providerName,
      errorMessage,
    );
    return respErr(errorMessage);
  }

  return null;
}

/**
 * 提取请求 ID
 */
function extractRequestId(
  result: any,
  responseMapping: any,
): string | undefined {
  if (responseMapping?.requestIdPath) {
    const extracted = getNestedValue(result, responseMapping.requestIdPath);
    if (extracted !== null && extracted !== undefined) {
      return String(extracted).trim();
    }
  }

  // 尝试默认路径
  const defaultId =
    result.data?.id ||
    result.data?.task_id ||
    result.data?.request_id ||
    result.id ||
    result.task_id ||
    result.request_id;

  if (defaultId !== null && defaultId !== undefined) {
    return String(defaultId).trim();
  }

  return undefined;
}

function extractSyncOutputs(result: any, responseMapping: any) {
  let outputUrl: string | undefined;
  let outputs: string[] | undefined;

  if (responseMapping?.outputPath) {
    const extracted = getNestedValue(result, responseMapping.outputPath);
    if (Array.isArray(extracted)) {
      outputs = extracted.filter((item: any) => typeof item === "string");
      outputUrl = outputs[0];
    } else if (typeof extracted === "string") {
      outputUrl = extracted;
      outputs = [extracted];
    } else if (extracted != null) {
      const str = String(extracted);
      outputUrl = str;
      outputs = [str];
    }
  }

  if (!outputUrl) {
    if (Array.isArray(result?.data) && result.data.length > 0) {
      const first = result.data[0] || {};
      const candidate =
        first.url || first.image_url || first.output_url || first.image;
      if (typeof candidate === "string" && candidate.trim()) {
        outputUrl = candidate.trim();
      }
    }

    if (!outputUrl && result?.data && !Array.isArray(result.data)) {
      const candidate =
        result.data.url ||
        result.data.image_url ||
        result.data.output_url ||
        result.data.image;
      if (typeof candidate === "string" && candidate.trim()) {
        outputUrl = candidate.trim();
      }
    }

    if (!outputUrl) {
      const candidate =
        result?.url || result?.image_url || result?.output_url || result?.image;
      if (typeof candidate === "string" && candidate.trim()) {
        outputUrl = candidate.trim();
      }
    }

    if (outputUrl) {
      outputs = [outputUrl];
    }
  }

  return {
    outputUrl,
    outputs,
  };
}

async function markSavedTaskFailed(
  savedTaskId: string | null,
  taskInfo: unknown,
) {
  if (!savedTaskId) {
    return;
  }

  try {
    await updateAITaskById(savedTaskId, {
      status: AITaskStatus.FAILED,
      taskInfo: taskInfo ? JSON.stringify(taskInfo) : null,
    });
  } catch (e: any) {
    console.error("Failed to update AI task status:", e);
  }
}

async function handleSyncResult(params: {
  result: any;
  responseMapping: any;
  savedTaskId: string | null;
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>;
  apiKey: string;
  scene?: string;
  providerName: string;
  validatedParams: any;
}) {
  const {
    result,
    responseMapping,
    savedTaskId,
    user,
    apiKey,
    scene,
    providerName,
    validatedParams,
  } = params;
  const { outputUrl, outputs } = extractSyncOutputs(result, responseMapping);

  if (savedTaskId) {
    try {
      const updateData: UpdateAITask = {
        status: AITaskStatus.SUCCESS,
        taskInfo: result ? JSON.stringify(result) : null,
        taskResult:
          outputUrl || (outputs && outputs.length > 0)
            ? JSON.stringify({
                output: outputUrl || outputs?.[0],
                outputs: outputs || (outputUrl ? [outputUrl] : []),
              })
            : null,
      };
      await updateAITaskById(savedTaskId, updateData);
    } catch (e: any) {
      console.error("Failed to update AI task in sync mode:", e);
    }
  }

  const syncOutputUrls = outputs || (outputUrl ? [outputUrl] : []);
  if (syncOutputUrls.length > 0) {
    const generationParams =
      validatedParams && typeof validatedParams === "object"
        ? validatedParams
        : null;
    const creationRecords = await persistSuccessfulOutputsToCreations({
      userId: user.id,
      outputUrls: syncOutputUrls,
      sceneId: scene || apiKey,
      providerName,
      providerLabel: providerName,
      prompt:
        typeof validatedParams?.prompt === "string"
          ? validatedParams.prompt
          : null,
      generationParams,
      aspectRatio:
        typeof validatedParams?.aspectRatio === "string"
          ? validatedParams.aspectRatio
          : null,
    });

    void persistGeneratedOutputsToR2({
      taskDbId: savedTaskId,
      userId: user.id,
      outputUrls: syncOutputUrls,
      workbenchCreationRecords: creationRecords,
      sceneId: scene || apiKey,
      providerName,
      providerLabel: providerName,
      prompt:
        typeof validatedParams?.prompt === "string"
          ? validatedParams.prompt
          : null,
      generationParams,
      aspectRatio:
        typeof validatedParams?.aspectRatio === "string"
          ? validatedParams.aspectRatio
          : null,
    }).catch((error) => {
      console.error("[AI Generate] persist R2 outputs failed", {
        taskDbId: savedTaskId,
        sceneId: scene || apiKey,
        error,
      });
    });
  }

  return respData({
    output: outputUrl || null,
    outputs: outputs || (outputUrl ? [outputUrl] : []),
  });
}

async function saveInitialTask(params: {
  req: Request;
  apiKey: string;
  scene?: string;
  shouldSaveTask: boolean;
  buildTaskData?: WavespeedAPIHandlerOptions["buildTaskData"];
  body: any;
  validatedParams: any;
  providerName: string;
  requestBody: any;
  promptOptimizationRecord: {
    originalPrompt: string;
    optimizedPrompt: string;
  } | null;
  webhookRuntimeConfig: Awaited<ReturnType<typeof resolveWebhookRuntimeConfig>>;
  requiredCredits: number;
  freeUsed: boolean;
  user: NonNullable<Awaited<ReturnType<typeof getUserInfo>>>;
}) {
  const {
    req,
    apiKey,
    scene,
    shouldSaveTask,
    buildTaskData,
    body,
    validatedParams,
    providerName,
    requestBody,
    promptOptimizationRecord,
    webhookRuntimeConfig,
    requiredCredits,
    freeUsed,
    user,
  } = params;

  if (!shouldSaveTask) {
    console.log(
      `[API Handler] ${apiKey}: saveTaskToDb is false, skipping task save`,
    );
    return null;
  }

  if (!buildTaskData) {
    console.warn(
      "[API Handler] saveTaskToDb is true but buildTaskData is not provided, skipping task save",
    );
    return null;
  }

  try {
    const taskData = buildTaskData(body, validatedParams, providerName);
    if (!taskData.mediaType || !taskData.model) {
      console.warn(
        "[API Handler] buildTaskData returned invalid task data:",
        taskData,
      );
      return null;
    }

    const optionsPayload: Record<string, any> =
      requestBody && Object.keys(requestBody).length > 0
        ? { ...requestBody }
        : {};
    if (promptOptimizationRecord) {
      optionsPayload.originalPrompt = promptOptimizationRecord.originalPrompt;
      optionsPayload.optimizedPrompt = promptOptimizationRecord.optimizedPrompt;
    }
    optionsPayload.__billing = {
      refundableCredits: requiredCredits,
      chargedCredits: freeUsed ? 0 : requiredCredits,
    };
    if (webhookRuntimeConfig) {
      optionsPayload.__webhook = {
        enabled: true,
        source: webhookRuntimeConfig.source,
        paramName: webhookRuntimeConfig.paramName,
        callbackUrl: webhookRuntimeConfig.callbackUrl,
      };
    }

    const userAgent = req.headers.get("user-agent");
    const deviceType = detectDeviceType(userAgent);
    const newTask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType: taskData.mediaType,
      provider: providerName,
      model: taskData.model,
      prompt: promptOptimizationRecord?.optimizedPrompt || taskData.prompt,
      options:
        Object.keys(optionsPayload).length > 0
          ? JSON.stringify(optionsPayload)
          : null,
      status: AITaskStatus.PENDING,
      costCredits: freeUsed ? 0 : requiredCredits,
      scene: scene || apiKey,
      deviceType,
      userAgent: userAgent || undefined,
    };
    const createdTask = await createAITask(newTask, {
      creditsAlreadyConsumed: true,
    });
    console.log(
      `[API Handler] ${apiKey}: Task saved successfully with id ${createdTask.id}`,
    );
    return createdTask.id;
  } catch (e: any) {
    console.error(`[API Handler] ${apiKey}: Failed to save AI task:`, e);
    return null;
  }
}

async function optimizePromptIfNeeded(params: {
  enabled?: boolean;
  body: any;
  apiKey: string;
  scene?: string;
  validatedParams: any;
  resolvedProvider: any;
  userId: string;
}) {
  const {
    enabled,
    body,
    apiKey,
    scene,
    validatedParams,
    resolvedProvider,
    userId,
  } = params;

  if (!enabled || body?.skip_prompt_enhance === true) {
    return null;
  }

  console.log(
    "[prompt-optimizer] enabled for apiKey:",
    apiKey,
    "scene:",
    scene,
  );
  const rawPrompt = extractPromptFromValidatedParams(validatedParams);
  console.log(
    "[prompt-optimizer] extracted rawPrompt length:",
    rawPrompt?.length || 0,
    "preview:",
    typeof rawPrompt === "string" ? rawPrompt.slice(0, 80) : "",
  );

  if (!rawPrompt) {
    console.log("[prompt-optimizer] rawPrompt is empty, skip optimization");
    return null;
  }

  const creditConfig = await getCreditConfig(apiKey);
  const mode: "image" | "video" =
    creditConfig?.mediaType === "video" ? "video" : "image";
  const imageUrl = extractImageUrlFromParams(validatedParams);
  const baseUrl = resolvedProvider?.baseUrl || "https://api.wavespeed.ai";
  const optimized = await callPromptOptimizer({
    baseUrl,
    apiKey: process.env.PROMPT_OPTIMIZER_API_KEY || "",
    text: rawPrompt,
    mode,
    image: imageUrl,
  });

  if (!optimized) {
    return null;
  }

  writeOptimizedPromptToParams(validatedParams, optimized);
  try {
    await createPromptEnhanceLog({
      userId,
      source: "auto",
      mode,
      scene: scene || "",
      originalPrompt: rawPrompt,
      optimizedPrompt: optimized,
    });
  } catch (logError) {
    console.warn(
      "[prompt-optimizer] failed to save prompt enhance log:",
      logError,
    );
  }

  return {
    originalPrompt: rawPrompt,
    optimizedPrompt: optimized,
  };
}

/**
 * 通用 Wavespeed API 处理器
 * 统一处理认证、积分检查、API 调用、错误处理和积分返还
 */
export async function handleWavespeedAPIRequest(
  req: Request,
  options: WavespeedAPIHandlerOptions,
) {
  try {
    const {
      apiKey,
      endpoint,
      buildPayload,
      validateParams,
      customCreditCalculator,
      scene,
      description,
      buildMetadata,
      supportFreeGeneration = false,
      customApiKey,
      enablePromptOptimizer,
      preExternalApiCheck,
    } = options;

    // 1. 认证用户并验证参数
    const authResult = await authenticateAndValidateRequest(
      req,
      validateParams,
    );
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    const { user, body, validatedParams } = authResult;

    // 2. 获取 Provider 配置
    const provider = await getProviderForScenario(apiKey);
    const providerName = provider
      ? await findProviderForScenario(apiKey)
      : "wavespeed";

    // 3. 计算所需积分
    const creditsResult = await calculateCredits(
      apiKey,
      validatedParams,
      customCreditCalculator,
    );
    if (isErrorResponse(creditsResult)) {
      return creditsResult;
    }
    const requiredCredits = creditsResult;

    // 4. 检查并消费积分
    const creditConsumptionResult = await checkAndConsumeCreditsForRequest(
      user,
      apiKey,
      requiredCredits,
      {
        supportFreeGeneration,
        scene,
        description,
        buildMetadata,
        body,
        validatedParams,
        providerName,
      },
    );
    if (isErrorResponse(creditConsumptionResult)) {
      return creditConsumptionResult;
    }
    const { freeUsed } = creditConsumptionResult;

    // 4.5 调用上游前的预检查（复用已完成的积分校验/扣费结果）
    if (preExternalApiCheck) {
      const preCheckResponse = await preExternalApiCheck({
        user,
        body,
        validatedParams,
        apiKey,
        scene,
        providerName,
        requiredCredits,
        freeUsed,
      });
      if (preCheckResponse) {
        return preCheckResponse;
      }
    }

    // 5. 解析 API 配置
    const apiConfigResult = await resolveApiConfig(
      apiKey,
      endpoint,
      validatedParams,
      {
        customEndpoint: options.customEndpoint,
        customApiKey,
      },
    );
    if (isErrorResponse(apiConfigResult)) {
      return apiConfigResult;
    }
    const {
      provider: resolvedProvider,
      apiEndpoint,
      apiKey: resolvedApiKey,
      responseMapping,
      scenarioPricing,
    } = apiConfigResult;
    const paramCombinationKey = scenarioPricing
      ? generateParamCombinationKey(scenarioPricing, validatedParams)
      : null;

    const promptOptimizationRecord = await optimizePromptIfNeeded({
      enabled: enablePromptOptimizer,
      body,
      apiKey,
      scene,
      validatedParams,
      resolvedProvider,
      userId: user.id,
    });

    // 6. 构建请求
    const requestBuildResult = buildRequest(
      req,
      apiEndpoint,
      resolvedProvider,
      validatedParams,
      body,
      buildPayload,
      scenarioPricing,
      apiConfigResult.paramCombinationConfig,
    );
    const webhookRuntimeConfig = await resolveWebhookRuntimeConfig({
      req,
      body,
      providerName: apiConfigResult.providerName,
      scenarioName: scene || apiKey,
      paramCombinationKey,
    });
    let { url, headers, requestBody } = requestBuildResult;

    if (webhookRuntimeConfig) {
      if (webhookRuntimeConfig.source === "query") {
        const targetUrl = new URL(url);
        targetUrl.searchParams.set(
          webhookRuntimeConfig.paramName,
          webhookRuntimeConfig.callbackUrl,
        );
        url = targetUrl.toString();
      } else if (webhookRuntimeConfig.source === "header") {
        headers[webhookRuntimeConfig.paramName] =
          webhookRuntimeConfig.callbackUrl;
      } else {
        requestBody = {
          ...(requestBody && typeof requestBody === "object"
            ? requestBody
            : {}),
          [webhookRuntimeConfig.paramName]: webhookRuntimeConfig.callbackUrl,
        };
      }
    }

    console.log("[API Handler] upstream request resolved", {
      providerName: apiConfigResult.providerName,
      scene: scene || apiKey,
      webhookRuntimeConfig,
      finalUrl: url,
    });

    console.log("[API Handler] requestBody:", requestBody);
    const savedTaskId = await saveInitialTask({
      req,
      apiKey,
      scene,
      shouldSaveTask:
        scenarioPricing?.saveTaskToDb !== undefined
          ? scenarioPricing.saveTaskToDb
          : true,
      buildTaskData: options.buildTaskData,
      body,
      validatedParams,
      providerName: apiConfigResult.providerName,
      requestBody,
      promptOptimizationRecord,
      webhookRuntimeConfig,
      requiredCredits,
      freeUsed,
      user,
    });

    // 7. 调用外部 API
    const timeout = resolvedProvider?.timeout || 30000;
    const apiCallResult = await callExternalApi(
      url,
      headers,
      requestBody,
      resolvedApiKey,
      timeout,
    );

    if (!apiCallResult.success || !apiCallResult.response) {
      await markSavedTaskFailed(savedTaskId, {
        error: "Failed to call external API",
      });
      return apiCallResult.error || respErr("Failed to call external API");
    }

    const response = apiCallResult.response;

    console.log("[API Handler] upstream response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: summarizeHeaders(response),
    });
    // 8. 处理 API 错误响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[${apiConfigResult.providerName} API] ${apiEndpoint} failed:`,
        response.status,
        errorText,
      );
      // 打印整个请求体和请求头，便于排查问题
      try {
        console.error(
          `[${apiConfigResult.providerName} API] ${apiEndpoint} request body:`,
          requestBody ? JSON.stringify(requestBody, null, 2) : null,
        );
        console.error(
          `[${apiConfigResult.providerName} API] ${apiEndpoint} request headers:`,
          headers ? JSON.stringify(headers, null, 2) : null,
        );
      } catch (e) {
        console.error(
          `[${apiConfigResult.providerName} API] ${apiEndpoint} request body (raw):`,
          requestBody,
        );
        console.error(
          `[${apiConfigResult.providerName} API] ${apiEndpoint} request headers (raw):`,
          headers,
        );
      }

      await markSavedTaskFailed(savedTaskId, {
        error: errorText,
        status: response.status,
      });

      await refundCredits(
        user,
        requiredCredits,
        apiKey,
        apiConfigResult.providerName,
        `HTTP ${response.status}`,
      );

      return respErr(
        `Request failed and your credits have been refunded. (status: ${response.status})`,
      );
    }

    // 9. 解析响应
    const result = await parseApiResponse(response, responseMapping);
    console.log(
      "[API Handler] parsed upstream result:",
      summarizeResultForLog(result),
    );

    // 根据 Provider 配置判断是同步模式还是异步模式
    const resultMode = resolvedProvider?.resultMode || "async";
    const isSyncMode = resultMode === "sync";

    // 10. 验证响应状态（仅在异步模式下强依赖 status / requestId）
    const statusValidationResult = await validateResponseStatus(
      result,
      response,
      responseMapping,
      user,
      freeUsed,
      requiredCredits,
      apiKey,
      apiConfigResult.providerName,
    );
    if (statusValidationResult) {
      await markSavedTaskFailed(savedTaskId, result);
      return statusValidationResult;
    }

    // 11. 提取请求 ID（仅异步模式必须）
    const requestId = extractRequestId(result, responseMapping);

    if (isSyncMode) {
      return handleSyncResult({
        result,
        responseMapping,
        savedTaskId,
        user,
        apiKey,
        scene,
        providerName: apiConfigResult.providerName,
        validatedParams,
      });
    }

    // 异步模式：仍然强制要求 requestId
    if (!requestId || requestId === "") {
      await markSavedTaskFailed(savedTaskId, {
        error: "Failed to get request ID from API response",
      });

      await refundCredits(
        user,
        requiredCredits,
        apiKey,
        apiConfigResult.providerName,
        "no request ID",
      );
      return respErr("Failed to get request ID from API response");
    }

    // 11.5. 如果保存了 task，更新 taskId 和状态
    if (savedTaskId) {
      try {
        const updateData: UpdateAITask = {
          taskId: requestId,
          status: AITaskStatus.PROCESSING,
          taskInfo: result ? JSON.stringify(result) : null,
        };
        await updateAITaskById(savedTaskId, updateData);
      } catch (e: any) {
        console.error(`Failed to update AI task with requestId:`, e);
        // 更新失败不影响响应，继续执行
      }
    }

    // 12. 构建成功响应（异步模式：返回轮询所需的 requestId）
    return respData({
      taskId: requestId,
      requestId,
      webhookEnabled: Boolean(webhookRuntimeConfig),
    });
  } catch (e: any) {
    if (isClientAbortError(e)) {
      console.warn(`[API Handler] ${options.apiKey} aborted by client`);
    } else {
      console.error(`[API Handler] ${options.apiKey} failed:`, e);
    }
    return respErr(e.message || "Request failed");
  }
}

/**
 * 从嵌套对象中获取值（支持路径如 'data.id' 或 'data.outputs[0]'）
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;

  const parts = path.split(/[\.\[\]]/).filter(Boolean);
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}
