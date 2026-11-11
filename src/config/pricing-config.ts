import { getPricingConfigFromDB, savePricingConfigToDB, getCreditCostsConfigFromDB } from '@/shared/models/pricing-config';
import { getCreditCostsConfig } from '@/config/credit-config';

/**
 * 价格配置接口
 */
export interface PricingConfig {
    creditUnitPrice: number; // 每个积分折合的价格（USD）
    defaultProfitMargin: number; // 默认利润率（0-1之间，如0.3表示30%）
    currency: string;
    description?: string;
    defaultProvider?: string; // 默认 Provider 名称
    /**
     * 场景级默认 Provider 映射
     * key 为场景名称（如 'seedream-v4-5-text-to-image'）
     * value 为在管理端下拉中选择的 Provider 名称（provider.name）
     */
    scenarioDefaultProviders?: Record<string, string>;
}

/**
 * 参数组合的价格配置
 */
export interface ParamCombinationPricing {
    costPrice: number; // 成本价格（USD）
    profitMargin?: number; // 利润率（0-1之间），如果不设置则使用场景的利润率
    description?: string;
    /** API 端点（参数组合级别，覆盖场景的 apiEndpoint） */
    apiEndpoint?: string;
    /** 请求参数映射配置（参数组合级别，覆盖场景的 requestParams） */
    requestParams?: RequestParamMapping[];
    /** 响应解析配置（参数组合级别，覆盖场景的 responseMapping） */
    responseMapping?: ResponseMapping;
    /** 状态查询 API 端点（参数组合级别，覆盖场景的 statusQueryEndpoint） */
    statusQueryEndpoint?: string;
    /** 状态查询请求参数映射配置（参数组合级别，覆盖场景的 statusQueryParams） */
    statusQueryParams?: RequestParamMapping[];
    /** 状态查询响应解析配置（参数组合级别，覆盖场景的 statusQueryResponseMapping） */
    statusQueryResponseMapping?: ResponseMapping;
    /** 请求体模板（参数组合级别，覆盖场景的 requestBodyTemplate） */
    requestBodyTemplate?: Record<string, any>;
    /** webhook 配置（参数组合级别，覆盖场景 / provider） */
    webhookConfig?: WebhookConfig;
    /** 最小时长（秒），小于此时长按最小时长计算积分 */
    minDuration?: number;
    /** 最小时长对应的积分（当 duration <= minDuration 时使用） */
    minDurationCredits?: number;
    /** 超过最小时长后，每秒的积分（当 duration > minDuration 时使用） */
    creditsPerSecond?: number;
}

export interface StepBasedPricing {
    paramName: string;
    stepSize: number;
    costPerStep: number;
    minSteps?: number;
}

/**
 * API 请求参数映射配置
 */
export interface RequestParamMapping {
    /** 参数名称（在 API 请求中的字段名） */
    name: string;
    /** 参数来源：'body' | 'query' | 'header' | 'path' | 'static' */
    source: 'body' | 'query' | 'header' | 'path' | 'static';
    /** 参数值（当 source 为 'static' 时使用）或从验证后的参数中获取的字段名 */
    value?: string;
    /** 是否必需 */
    required?: boolean;
    /** 参数类型转换：'string' | 'number' | 'boolean' | 'json' */
    type?: 'string' | 'number' | 'boolean' | 'json';
    /** 默认值 */
    defaultValue?: any;
}

/**
 * API 响应解析配置
 */
export interface ResponseMapping {
    /** 响应格式：'json' | 'text' | 'binary' */
    format: 'json' | 'text' | 'binary';
    /** 请求 ID 的提取路径（如 'data.id' 或 'id'） */
    requestIdPath?: string;
    /** 输出 URL 的提取路径（如 'data.outputs[0]' 或 'image_url'） */
    outputPath?: string;
    /** 错误信息的提取路径（如 'error.message' 或 'message'） */
    errorPath?: string;
    /** 状态字段的提取路径（如 'data.status' 或 'status'） */
    statusPath?: string;
    /** 成功状态值（如 'completed' | 'success' | 'done'） */
    successStatus?: string[];
    /** 失败状态值（如 'failed' | 'error' | 'cancelled'） */
    failureStatus?: string[];
}

export interface WebhookConfig {
    /** 当前 provider / scene 是否支持 webhook */
    enabled?: boolean;
    /** webhook 地址应注入到哪里 */
    source?: 'body' | 'query' | 'header';
    /** webhook 参数名或 header 名 */
    paramName?: string;
    /** webhook 回调结果的响应映射；未配置时回退到 statusQueryResponseMapping / responseMapping */
    responseMapping?: ResponseMapping;
}

/**
 * Provider 场景价格配置
 */
export interface ProviderScenarioPricing {
    costPrice: number; // 成本价格（USD）- 用于固定类型或作为默认值
    profitMargin?: number; // 利润率（0-1之间），如果不设置则使用默认利润率
    description?: string;
    costPerLayer?: number; // 每层成本（用于动态计算）
    costPerSecond?: number; // 每秒成本（用于动态计算）
    stepBasedPricing?: StepBasedPricing; // 通用步长计费配置
    paramCombinations?: Record<string, ParamCombinationPricing>; // 参数组合的价格配置，key 为参数组合的字符串表示（如 "1024*1024-low"）
    /** 层级定价配置（用于 tier-based 计算器） */
    tierPricing?: Record<number, {
        costPrice: number;
        profitMargin?: number;
        apiEndpoint?: string;
        requestParams?: RequestParamMapping[];
        responseMapping?: ResponseMapping;
        statusQueryEndpoint?: string;
        statusQueryParams?: RequestParamMapping[];
        statusQueryResponseMapping?: ResponseMapping;
    }>;
    /** API 端点（场景级别，覆盖 provider 的 apiEndpoint） */
    apiEndpoint?: string;
    /** 请求参数映射配置 */
    requestParams?: RequestParamMapping[];
    /** 响应解析配置 */
    responseMapping?: ResponseMapping;
    /** 状态查询 API 端点（如 '/api/v3/predictions/{taskId}/result'，{taskId} 会被替换为实际的 taskId） */
    statusQueryEndpoint?: string;
    /** 状态查询请求参数映射配置（通常只需要 taskId/requestId） */
    statusQueryParams?: RequestParamMapping[];
    /** 状态查询响应解析配置 */
    statusQueryResponseMapping?: ResponseMapping;
    /** webhook 配置（场景级别，覆盖 provider） */
    webhookConfig?: WebhookConfig;
    /** 最小时长（秒），小于此时长按最小时长计算积分 */
    minDuration?: number;
    /** 最小时长对应的积分（当 duration <= minDuration 时使用） */
    minDurationCredits?: number;
    /** 超过最小时长后，每秒的积分（当 duration > minDuration 时使用） */
    creditsPerSecond?: number;
    /** 是否在参数组合匹配时，将尺寸参数里的 "*" / "×" 归一化为 "x"（如 2048*2048 -> 2048x2048） */
    normalizeSizeToX?: boolean;
    /**
     * 请求体模板（用于构建嵌套结构的请求体）
     * 当配置了此字段时，优先使用模板构建请求体，忽略 requestParams 中的 body 类型映射。
     *
     * 模板语法：
     * - "{{paramName}}" → 替换为 validatedParams[paramName] 的值
     * - { "$spread": "paramName", "$wrap": "keyName" } → 将数组展开为 [{keyName: item1}, {keyName: item2}, ...]
     *
     * 示例（通义万相 qwen-image-edit）：
     * {
     *   "model": "qwen-image-edit",
     *   "input": {
     *     "messages": [{
     *       "role": "user",
     *       "content": [
     *         { "$spread": "images", "$wrap": "image" },
     *         { "text": "{{prompt}}" }
     *       ]
     *     }]
     *   },
     *   "parameters": { "n": 1, "size": "1536*1024" }
     * }
     */
    requestBodyTemplate?: Record<string, any>;
    [key: string]: any; // 允许其他动态成本参数
}

/**
 * Provider 配置
 */
export interface ProviderConfig {
    name: string;
    description?: string;
    /** 结果获取方式：async 表示返回任务 ID 通过 Status 轮询，sync 表示直接返回最终结果 */
    resultMode?: 'sync' | 'async';
    scenarios: Record<string, ProviderScenarioPricing>;
    /** API 基础 URL（如 'https://api.wavespeed.ai'） */
    baseUrl?: string;
    /** API 基础端点（可选，如果场景没有单独配置则使用此值） */
    apiEndpoint?: string;
    /** API Key（直接存储 API Key 值，不存储环境变量名） */
    apiKey?: string;
    /** 默认请求头配置 */
    defaultHeaders?: Record<string, string>;
    /** 请求超时时间（毫秒） */
    timeout?: number;
    /** Provider 级别的主请求参数映射配置（场景未配置时使用） */
    requestParams?: RequestParamMapping[];
    /** Provider 级别的主响应解析配置（场景未配置时使用，含同步/异步共用的输出映射） */
    responseMapping?: ResponseMapping;
    /** 通用状态查询 API 端点（场景未配置时使用） */
    statusQueryEndpoint?: string;
    /** 通用状态查询请求参数映射配置（场景未配置时使用） */
    statusQueryParams?: RequestParamMapping[];
    /** 通用状态查询响应解析配置（场景未配置时使用） */
    statusQueryResponseMapping?: ResponseMapping;
    /** Provider 级别 webhook 配置 */
    webhookConfig?: WebhookConfig;
}

/**
 * 价格配置结构
 */
export interface PricingConfigs {
    pricing: PricingConfig;
    providers: Record<string, ProviderConfig>;
}

// 缓存数据库配置（避免每次调用都查询数据库）
let cachedDbConfig: PricingConfigs | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 缓存 60 秒

/**
 * 获取价格配置（只从数据库读取）
 * 如果数据库中没有配置，直接抛出异常
 */
async function getPricingConfigs(): Promise<PricingConfigs> {
    const now = Date.now();

    // 如果缓存有效，直接返回
    if (cachedDbConfig && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedDbConfig;
    }

    // 从数据库读取
    const dbConfig = await getPricingConfigFromDB();
    // 如果数据库中没有配置，直接抛出异常
    if (!dbConfig) {
        throw new Error('Pricing config not found in database. Please initialize the configuration first.');
    }

    cachedDbConfig = dbConfig;
    cacheTimestamp = now;
    return dbConfig;
}

/**
 * 清除价格配置缓存（在更新配置后调用）
 */
export function clearPricingConfigCache() {
    cachedDbConfig = null;
    cacheTimestamp = 0;
}

/**
 * 获取价格配置（同步版本，从缓存读取）
 * 注意：如果缓存中没有配置，会抛出错误。建议使用异步版本 getPricingConfigAsync
 */
export function getPricingConfig(): PricingConfig {
    // 如果有缓存，使用缓存
    if (cachedDbConfig) {
        return cachedDbConfig.pricing;
    }

    // 如果没有缓存，抛出错误
    throw new Error('Pricing configuration not loaded. Please use getPricingConfigAsync() or ensure configuration is loaded first.');
}

/**
 * 异步获取价格配置（优先从数据库读取）
 */
export async function getPricingConfigAsync(): Promise<PricingConfig> {
    const configs = await getPricingConfigs();
    return configs.pricing;
}

/**
 * 获取 Provider 配置（同步版本，从缓存读取）
 * 注意：如果缓存中没有配置，会返回 null。建议使用异步版本 getProviderConfigAsync
 */
export function getProviderConfig(providerName: string): ProviderConfig | null {
    // 如果有缓存，使用缓存
    if (cachedDbConfig) {
        return cachedDbConfig.providers[providerName] || null;
    }

    // 如果没有缓存，返回 null
    return null;
}

/**
 * 异步获取 Provider 配置（优先从数据库读取）
 */
export async function getProviderConfigAsync(providerName: string): Promise<ProviderConfig | null> {
    const configs = await getPricingConfigs();
    return configs.providers[providerName] || null;
}

/**
 * 获取场景价格配置（同步版本）
 */
export function getScenarioPricing(
    providerName: string,
    scenarioName: string
): ProviderScenarioPricing | null {
    const provider = getProviderConfig(providerName);
    if (!provider) {
        return null;
    }
    return provider.scenarios[scenarioName] || null;
}

/**
 * 异步获取场景价格配置（优先从数据库读取）
 */
export async function getScenarioPricingAsync(
    providerName: string,
    scenarioName: string
): Promise<ProviderScenarioPricing | null> {
    const provider = await getProviderConfigAsync(providerName);
    if (!provider) {
        return null;
    }
    return provider.scenarios[scenarioName] || null;
}

/**
 * 根据场景名称查找对应的 Provider
 * @param scenarioName 场景名称
 * @returns Provider 名称，如果找不到则返回默认 Provider 或 'wavespeed'
 */
export async function findProviderForScenario(scenarioName: string): Promise<string> {
    const configs = await getPricingConfigs();

    // 1. 优先使用场景级默认 Provider（如果在定价配置中显式指定）
    const scenarioDefaults = configs.pricing.scenarioDefaultProviders;
    if (scenarioDefaults && scenarioDefaults[scenarioName]) {
        const preferredName = scenarioDefaults[scenarioName];

        // 支持通过 provider 的 key 或 name 匹配
        for (const [providerKey, provider] of Object.entries(configs.providers)) {
            if (
                provider.scenarios &&
                provider.scenarios[scenarioName] &&
                (providerKey === preferredName || provider.name === preferredName)
            ) {
                return providerKey;
            }
        }
    }

    // 2. 遍历所有 providers，查找包含该场景的 provider
    for (const [providerKey, provider] of Object.entries(configs.providers)) {
        if (provider.scenarios && provider.scenarios[scenarioName]) {
            return providerKey;
        }
    }

    // 3. 如果找不到场景对应的 provider，回退到全局默认 provider（若存在且已配置）
    const globalDefault = configs.pricing.defaultProvider;
    if (globalDefault && configs.providers[globalDefault]) {
        return globalDefault;
    }

    // 4. 最后兜底：返回任意一个已配置的 provider key，避免返回不存在的 key
    const firstProviderKey = Object.keys(configs.providers)[0];
    if (firstProviderKey) {
        return firstProviderKey;
    }

    // 理论上不会走到这里，如果没有任何 provider，则回退到内置 wavespeed
    return 'wavespeed';
}

/**
 * 获取场景对应的 Provider 配置
 * @param scenarioName 场景名称
 * @returns Provider 配置，如果找不到则返回 null
 */
export async function getProviderForScenario(scenarioName: string): Promise<ProviderConfig | null> {
    const providerName = await findProviderForScenario(scenarioName);
    return await getProviderConfigAsync(providerName);
}

/**
 * 获取场景的状态查询配置（优先使用参数组合级别的配置，然后场景级别，最后 Provider 级别）
 * @param providerName Provider 名称
 * @param scenarioName 场景名称
 * @param paramCombinationKey 可选的参数组合 key（如 "resolution=720p&generate_audio=true"）
 * @returns 状态查询配置对象，包含 endpoint、params 和 responseMapping
 */
export async function getStatusQueryConfig(
    providerName: string,
    scenarioName: string,
    paramCombinationKey: string | undefined
): Promise<{
    endpoint?: string;
    params?: RequestParamMapping[];
    responseMapping?: ResponseMapping;
} | null> {
    const provider = await getProviderConfigAsync(providerName);
    if (!provider) {
        return null;
    }

    const scenarioPricing = provider.scenarios[scenarioName];
    if (!scenarioPricing) {
        return null;
    }

    if (paramCombinationKey && scenarioPricing.paramCombinations?.[paramCombinationKey]) {
        const paramCombinationConfig = scenarioPricing.paramCombinations[paramCombinationKey];

        if (
            paramCombinationConfig.statusQueryEndpoint ||
            paramCombinationConfig.statusQueryParams ||
            paramCombinationConfig.statusQueryResponseMapping
        ) {
            return {
                endpoint: paramCombinationConfig.statusQueryEndpoint ?? scenarioPricing.statusQueryEndpoint ?? provider.statusQueryEndpoint,
                params: paramCombinationConfig.statusQueryParams ?? scenarioPricing.statusQueryParams ?? provider.statusQueryParams,
                responseMapping: paramCombinationConfig.statusQueryResponseMapping ?? scenarioPricing.statusQueryResponseMapping ?? provider.statusQueryResponseMapping,
            };
        }
    }

    console.log("scenarioPricing", scenarioPricing.statusQueryEndpoint)
    console.log("provider", provider.name)
    // 优先使用场景级别的配置，否则使用 Provider 级别的通用配置
    return {
        endpoint: scenarioPricing.statusQueryEndpoint ?? provider.statusQueryEndpoint,
        params: scenarioPricing.statusQueryParams ?? provider.statusQueryParams,
        responseMapping: scenarioPricing.statusQueryResponseMapping ?? provider.statusQueryResponseMapping,
    };
}

/**
 * 获取场景的 webhook 配置（优先使用参数组合级别的配置，然后场景级别，最后 Provider 级别）
 */
export async function getWebhookConfig(
    providerName: string,
    scenarioName: string,
    paramCombinationKey?: string
): Promise<WebhookConfig | null> {
    const provider = await getProviderConfigAsync(providerName);
    if (!provider) {
        return null;
    }

    const scenarioPricing = provider.scenarios[scenarioName];
    if (!scenarioPricing) {
        return provider.webhookConfig || null;
    }

    const paramWebhookConfig =
        paramCombinationKey && scenarioPricing.paramCombinations?.[paramCombinationKey]
            ? scenarioPricing.paramCombinations[paramCombinationKey]?.webhookConfig
            : undefined;

    const resolvedConfig =
        paramWebhookConfig ??
        scenarioPricing.webhookConfig ??
        provider.webhookConfig;

    if (resolvedConfig) {
        return resolvedConfig;
    }

    const normalizedProviderKey = providerName.toLowerCase();
    const normalizedProviderName = String(provider.name || '').toLowerCase();

    // Wavespeed 默认支持通过 query 传 webhook 地址
    if (
        normalizedProviderKey.includes('wavespeed') ||
        normalizedProviderName.includes('wavespeed') ||
        String(provider.baseUrl || '').includes('api.wavespeed.ai')
    ) {
        return {
            enabled: true,
            source: 'query',
            paramName: 'webhook',
        };
    }

    return null;
}

/**
 * 根据成本价格和利润率计算售价
 * @param costPrice 成本价格（USD）
 * @param profitMargin 利润率（0-1之间）
 * @returns 售价（USD）
 */
export function calculateSellingPrice(
    costPrice: number,
    profitMargin: number
): number {
    if (costPrice <= 0) {
        return 0;
    }
    // 售价 = 成本 / (1 - 利润率)
    return costPrice / (1 - profitMargin);
}

/**
 * 根据售价和积分单价计算需要消耗的积分
 * @param sellingPrice 售价（USD）
 * @param creditUnitPrice 积分单价（USD/积分）
 * @returns 需要消耗的积分（向上取整）
 */
export function calculateCreditsFromPrice(
    sellingPrice: number,
    creditUnitPrice: number
): number {
    if (creditUnitPrice <= 0) {
        throw new Error('Credit unit price must be greater than 0');
    }
    // 积分 = 售价 / 积分单价，向上取整
    return Math.ceil(sellingPrice / creditUnitPrice);
}

/**
 * 根据成本价格、利润率和积分单价计算需要消耗的积分
 * @param costPrice 成本价格（USD）
 * @param profitMargin 利润率（0-1之间），如果不提供则使用默认利润率
 * @param creditUnitPrice 积分单价（USD/积分），如果不提供则从配置读取
 * @returns 需要消耗的积分
 */
export function calculateCreditsFromCost(
    costPrice: number,
    profitMargin?: number,
    creditUnitPrice?: number
): number {
    const pricing = getPricingConfig();
    const margin = profitMargin ?? pricing.defaultProfitMargin;
    const unitPrice = creditUnitPrice ?? pricing.creditUnitPrice;

    if (costPrice <= 0) {
        return 0;
    }

    const sellingPrice = calculateSellingPrice(costPrice, margin);
    return calculateCreditsFromPrice(sellingPrice, unitPrice);
}

/**
 * 根据 Provider 和场景计算积分消耗（基于价格配置）
 * @param providerName Provider 名称
 * @param scenarioName 场景名称
 * @param dynamicParams 动态参数（如层数、时长等）
 * @returns 需要消耗的积分
 */
export function calculateCreditsByPricing(
    providerName: string,
    scenarioName: string,
    dynamicParams?: Record<string, any>
): number | null {
    const scenarioPricing = getScenarioPricing(providerName, scenarioName);
    if (!scenarioPricing) {
        return null;
    }

    const pricing = getPricingConfig();
    const margin = scenarioPricing.profitMargin ?? pricing.defaultProfitMargin;
    const unitPrice = pricing.creditUnitPrice;

    // 计算总成本
    let totalCost = scenarioPricing.costPrice || 0;

    // 处理动态成本参数
    if (dynamicParams) {
        // 按层数计算（如 qwen-image-layered）
        // costPrice 是单个layer的价格，需要乘以 num_layers 得到总成本
        // 统一使用：先计算单个layer的积分，然后乘以层数
        // 这样可以确保积分计算的准确性（避免先计算总成本再转换积分时的精度问题）
        if (dynamicParams.num_layers) {
            // 获取单个layer的成本
            // 优先使用 costPerLayer，如果没有则使用 costPrice（costPrice 本身就是单个layer的价格）
            const costPerLayer = scenarioPricing.costPerLayer ?? scenarioPricing.costPrice ?? 0;

            if (costPerLayer <= 0) {
                return null;
            }

            // 先计算单个layer的积分
            const singleLayerCredits = calculateCreditsFromCost(
                costPerLayer,
                margin,
                unitPrice
            );
            // 然后乘以层数
            const layerCredits = singleLayerCredits * dynamicParams.num_layers;

            // 当存在 num_layers 参数时，只按层数计算
            return layerCredits;
        }

        // 按秒数计算（如视频生成）
        if (scenarioPricing.costPerSecond && dynamicParams.duration) {
            totalCost += scenarioPricing.costPerSecond * dynamicParams.duration;
        }

        // 可以继续添加其他动态成本计算逻辑
    }

    return calculateCreditsFromCost(totalCost, margin, unitPrice);
}

/**
 * 验证价格配置的利润率
 * @param costPrice 成本价格
 * @param sellingPrice 售价
 * @returns 实际利润率
 */
export function calculateActualProfitMargin(
    costPrice: number,
    sellingPrice: number
): number {
    if (sellingPrice <= 0) {
        return 0;
    }
    // 利润率 = (售价 - 成本) / 售价
    return (sellingPrice - costPrice) / sellingPrice;
}

/**
 * 生成参数的所有组合
 */
function generateParamCombinations(params: Record<string, any>): Array<Record<string, any>> {
    const paramNames = Object.keys(params);
    if (paramNames.length === 0) {
        return [{}];
    }

    const combinations: Array<Record<string, any>> = [];

    function generate(index: number, current: Record<string, any>) {
        if (index === paramNames.length) {
            combinations.push({ ...current });
            return;
        }

        const paramName = paramNames[index];
        const paramConfig = params[paramName];

        if (paramConfig.validValues && Array.isArray(paramConfig.validValues)) {
            // 如果有有效值列表，遍历所有有效值
            paramConfig.validValues.forEach((value: any) => {
                current[paramName] = value;
                generate(index + 1, current);
            });
        } else if (paramConfig.type === 'boolean') {
            // 布尔值：同时生成 true/false 两种情况
            [true, false].forEach((value) => {
                current[paramName] = value;
                generate(index + 1, current);
            });
        } else if (paramConfig.type === 'number' && paramConfig.min !== undefined && paramConfig.max !== undefined) {
            // 如果是数字类型且有范围，生成几个示例值
            const min = paramConfig.min;
            const max = paramConfig.max;
            const step = paramConfig.step || 1;
            const sampleCount = Math.min(5, Math.floor((max - min) / step) + 1);

            for (let i = 0; i < sampleCount; i++) {
                const value = min + (i * step);
                if (value <= max) {
                    current[paramName] = value;
                    generate(index + 1, current);
                }
            }
        } else {
            // 使用默认值
            current[paramName] = paramConfig.default;
            generate(index + 1, current);
        }
    }

    generate(0, {});
    return combinations;
}

/**
 * 将参数组合转换为字符串键
 */
function paramCombinationToKey(params: Record<string, any>): string {
    return Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
}

/**
 * 将字符串键解析为参数组合对象
 */
function keyToParamCombination(key: string): Record<string, any> {
    const params: Record<string, any> = {};
    if (!key) return params;

    const pairs = key.split('&');
    for (const pair of pairs) {
        const [paramKey, ...valueParts] = pair.split('=');
        if (paramKey) {
            const value = valueParts.join('='); // 处理值中可能包含 = 的情况
            // 尝试解析为数字或布尔值
            if (value === 'true') {
                params[paramKey] = true;
            } else if (value === 'false') {
                params[paramKey] = false;
            } else if (!isNaN(Number(value)) && value !== '') {
                params[paramKey] = Number(value);
            } else {
                params[paramKey] = value;
            }
        }
    }
    return params;
}

/**
 * 获取所有 Provider 和场景的价格信息（异步版本，优先从数据库读取）
 */
export async function getAllPricingInfo(): Promise<{
    pricing: PricingConfig;
    providers: Array<{
        name: string;
        description?: string;
        scenarios: Array<{
            name: string;
            costPrice: number;
            profitMargin: number;
            sellingPrice: number;
            credits: number;
            description?: string;
            type?: string;
            normalizeSizeToX?: boolean;
            stepBasedPricing?: StepBasedPricing;
            paramCombinations?: Array<{
                key: string;
                params: Record<string, any>;
                costPrice: number;
                profitMargin: number;
                sellingPrice: number;
                credits: number;
            }>;
        }>;
    }>;
}> {
    const configs = await getPricingConfigs();
    const pricing = configs.pricing;
    const providers: Array<any> = [];

    // 获取场景配置信息（用于判断是否为动态类型和获取参数定义）
    // 使用 getCreditCostsConfig 会自动同步 JSON 文件的更改到数据库
    const creditCostsConfigData = await getCreditCostsConfig();
    const costsConfig = creditCostsConfigData.costs || {};

    if (configs.providers) {
        Object.entries(configs.providers).forEach(([providerName, provider]) => {
            const scenarios: Array<any> = [];

            if (provider.scenarios) {
                Object.entries(provider.scenarios).forEach(([scenarioName, scenario]) => {
                    const scenarioConfig: any = (costsConfig as any)[scenarioName];
                    const isDynamic = scenarioConfig?.type === 'dynamic';
                    const scenarioParams = scenarioConfig?.params;

                    const margin = scenario.profitMargin ?? pricing.defaultProfitMargin;
                    const sellingPrice = calculateSellingPrice(scenario.costPrice, margin);
                    const credits = calculateCreditsFromPrice(sellingPrice, pricing.creditUnitPrice);

                    const scenarioInfo: any = {
                        name: scenarioName,
                        costPrice: scenario.costPrice,
                        profitMargin: margin,
                        sellingPrice,
                        credits,
                        description: scenario.description,
                        type: scenarioConfig?.type || 'fixed',
                        calculator: scenarioConfig?.calculator, // 添加 calculator 信息用于前端识别计费方式
                        mediaType: scenarioConfig?.mediaType || scenario.mediaType || 'image', // 媒体类型
                        normalizeSizeToX: scenario.normalizeSizeToX,
                        // 请求体模板
                        requestBodyTemplate: scenario.requestBodyTemplate,
                        // API 配置字段
                        apiEndpoint: scenario.apiEndpoint,
                        requestParams: scenario.requestParams,
                        responseMapping: scenario.responseMapping,
                        statusQueryEndpoint: scenario.statusQueryEndpoint,
                        statusQueryParams: scenario.statusQueryParams,
                        statusQueryResponseMapping: scenario.statusQueryResponseMapping,
                        webhookConfig: scenario.webhookConfig,
                        // 动态成本参数
                        costPerLayer: scenario.costPerLayer,
                        costPerSecond: scenario.costPerSecond,
                        costPer5Seconds: scenario.costPer5Seconds,
                        stepBasedPricing: scenario.stepBasedPricing,
                        // 最小时长计算字段
                        minDuration: scenario.minDuration,
                        minDurationCredits: scenario.minDurationCredits,
                        creditsPerSecond: scenario.creditsPerSecond,
                        // 层级定价配置
                        tierPricing: scenario.tierPricing,
                    };

                    // 如果是动态类型且有参数定义，生成参数组合的价格配置
                    // 对于按 layer 计费的场景，不生成参数组合
                    // 对于 duration-based 场景，如果有 generate_audio 参数，需要生成参数组合以区分 true/false 的价格
                    // 对于 seedance-duration 场景，生成除 duration 之外的其他参数的组合
                    // 对于 duration-block-resolved 场景，生成除 duration 之外的其他参数的组合（以5秒为单位）
                    const calculatorType = scenarioConfig?.calculator;
                    const isPerLayerScenario = calculatorType === 'per-layer' || scenarioName === 'qwen-image-layered';
                    const isDurationBasedWithAudio = calculatorType === 'duration-based' && scenarioParams?.generate_audio;
                    const isSeedanceDuration = calculatorType === 'seedance-duration';
                    const isDurationBlockResolved = calculatorType === 'duration-block-resolved';
                    const isStepBased = calculatorType === 'step-based';
                    const skipParamCombinations =
                        isPerLayerScenario ||
                        isStepBased ||
                        (calculatorType === 'duration-based' && !isDurationBasedWithAudio);

                    if (isDynamic && scenarioParams && Object.keys(scenarioParams).length > 0 && !skipParamCombinations) {
                        // 对于 duration-based 且有 generate_audio 的场景，只生成 generate_audio=true/false 的组合
                        // 对于 seedance-duration 或 duration-block-resolved 场景，生成除 duration 之外的其他参数的组合
                        let paramCombinations: Array<Record<string, any>>;
                        if (isDurationBasedWithAudio) {
                            paramCombinations = [
                                { generate_audio: true },
                                { generate_audio: false },
                            ];
                        } else if (isSeedanceDuration || isDurationBlockResolved) {
                            // 排除 duration 参数，生成其他参数的组合
                            const paramsWithoutDuration = { ...scenarioParams };
                            delete paramsWithoutDuration.duration;
                            paramCombinations = generateParamCombinations(paramsWithoutDuration);
                        } else {
                            paramCombinations = generateParamCombinations(scenarioParams);
                        }
                        const paramCombinationPricings: Array<any> = [];

                        paramCombinations.forEach((params) => {
                            const key = paramCombinationToKey(params);
                            // 检查是否有该参数组合的价格配置
                            const paramPricing = scenario.paramCombinations?.[key];

                            if (paramPricing) {
                                // 使用配置的价格
                                const paramMargin = paramPricing.profitMargin ?? margin;
                                // 对于 duration-based 且有 generate_audio 的场景，costPrice 是每秒成本
                                // 对于 duration-block-resolved 场景，costPrice 是每5秒成本
                                const costPrice = paramPricing.costPrice;
                                let costPerSecond: number | undefined;
                                let costPer5Seconds: number | undefined;

                                if (isDurationBasedWithAudio) {
                                    costPerSecond = costPrice;
                                } else if (isDurationBlockResolved) {
                                    costPer5Seconds = costPrice; // 每5秒成本
                                }

                                const sellingPrice = calculateSellingPrice(costPrice, paramMargin);
                                const credits = calculateCreditsFromPrice(
                                    sellingPrice,
                                    pricing.creditUnitPrice
                                );

                                paramCombinationPricings.push({
                                    key,
                                    params,
                                    costPrice: costPrice,
                                    profitMargin: paramMargin,
                                    sellingPrice: sellingPrice,
                                    credits: credits,
                                    ...(costPerSecond !== undefined && { costPerSecond }),
                                    ...(costPer5Seconds !== undefined && { costPer5Seconds }),
                                    // API 配置字段
                                    apiEndpoint: paramPricing.apiEndpoint,
                                    requestParams: paramPricing.requestParams,
                                    responseMapping: paramPricing.responseMapping,
                                    statusQueryEndpoint: paramPricing.statusQueryEndpoint,
                                    statusQueryParams: paramPricing.statusQueryParams,
                                    statusQueryResponseMapping: paramPricing.statusQueryResponseMapping,
                                    webhookConfig: paramPricing.webhookConfig,
                                    // 请求体模板
                                    requestBodyTemplate: paramPricing.requestBodyTemplate,
                                    // 最小时长计算字段
                                    minDuration: paramPricing.minDuration,
                                    minDurationCredits: paramPricing.minDurationCredits,
                                    creditsPerSecond: paramPricing.creditsPerSecond,
                                });
                            } else {
                                // 使用场景的默认价格
                                let costPrice = scenario.costPrice;
                                let costPerSecond: number | undefined;
                                let costPer5Seconds: number | undefined;

                                if (isDurationBasedWithAudio) {
                                    costPerSecond = costPrice;
                                } else if (isDurationBlockResolved) {
                                    costPer5Seconds = costPrice; // 每5秒成本
                                }

                                paramCombinationPricings.push({
                                    key,
                                    params,
                                    costPrice: costPrice,
                                    profitMargin: margin,
                                    sellingPrice, // 售价
                                    credits, // 积分
                                    ...(costPerSecond !== undefined && { costPerSecond }),
                                    ...(costPer5Seconds !== undefined && { costPer5Seconds }),
                                });
                            }
                        });

                        // 添加数据库中已存在但不在 costsConfig 参数定义中的 paramCombinations
                        if (scenario.paramCombinations) {
                            const existingKeys = new Set(paramCombinationPricings.map((p: any) => p.key));

                            Object.entries(scenario.paramCombinations).forEach(([key, paramPricing]: [string, any]) => {
                                // 如果这个 key 已经在 paramCombinationPricings 中，跳过（已经处理过了）
                                if (existingKeys.has(key)) {
                                    return;
                                }

                                // 解析 key 为参数对象
                                const params = keyToParamCombination(key);

                                const paramMargin = paramPricing.profitMargin ?? margin;
                                const costPrice = paramPricing.costPrice;

                                // 判断是否为按秒或按5秒计费
                                let costPerSecond: number | undefined;
                                let costPer5Seconds: number | undefined;

                                if (isDurationBasedWithAudio || paramPricing.costPerSecond !== undefined) {
                                    costPerSecond = paramPricing.costPerSecond ?? costPrice;
                                } else if (isDurationBlockResolved || paramPricing.costPer5Seconds !== undefined) {
                                    costPer5Seconds = paramPricing.costPer5Seconds ?? costPrice;
                                }

                                const sellingPrice = calculateSellingPrice(costPrice, paramMargin);
                                const credits = calculateCreditsFromPrice(
                                    sellingPrice,
                                    pricing.creditUnitPrice
                                );

                                paramCombinationPricings.push({
                                    key,
                                    params,
                                    costPrice: costPrice,
                                    profitMargin: paramMargin,
                                    sellingPrice: sellingPrice,
                                    credits: credits,
                                    ...(costPerSecond !== undefined && { costPerSecond }),
                                    ...(costPer5Seconds !== undefined && { costPer5Seconds }),
                                    // API 配置字段
                                    apiEndpoint: paramPricing.apiEndpoint,
                                    requestParams: paramPricing.requestParams,
                                    responseMapping: paramPricing.responseMapping,
                                    statusQueryEndpoint: paramPricing.statusQueryEndpoint,
                                    statusQueryParams: paramPricing.statusQueryParams,
                                    statusQueryResponseMapping: paramPricing.statusQueryResponseMapping,
                                    webhookConfig: paramPricing.webhookConfig,
                                    // 最小时长计算字段
                                    minDuration: paramPricing.minDuration,
                                    minDurationCredits: paramPricing.minDurationCredits,
                                    creditsPerSecond: paramPricing.creditsPerSecond,
                                });
                            });
                        }

                        scenarioInfo.paramCombinations = paramCombinationPricings;
                    } else if (scenario.paramCombinations && Object.keys(scenario.paramCombinations).length > 0) {
                        // 如果不是动态场景，但数据库中有 paramCombinations，也要包含它们
                        const paramCombinationPricings: Array<any> = [];

                        Object.entries(scenario.paramCombinations).forEach(([key, paramPricing]: [string, any]) => {
                            const params = keyToParamCombination(key);
                            const paramMargin = paramPricing.profitMargin ?? margin;
                            const costPrice = paramPricing.costPrice;

                            const sellingPrice = calculateSellingPrice(costPrice, paramMargin);
                            const credits = calculateCreditsFromPrice(
                                sellingPrice,
                                pricing.creditUnitPrice
                            );

                            paramCombinationPricings.push({
                                key,
                                params,
                                costPrice: costPrice,
                                profitMargin: paramMargin,
                                sellingPrice: sellingPrice,
                                credits: credits,
                                costPerSecond: paramPricing.costPerSecond,
                                costPer5Seconds: paramPricing.costPer5Seconds,
                                // API 配置字段
                                apiEndpoint: paramPricing.apiEndpoint,
                                requestParams: paramPricing.requestParams,
                                responseMapping: paramPricing.responseMapping,
                                statusQueryEndpoint: paramPricing.statusQueryEndpoint,
                                statusQueryParams: paramPricing.statusQueryParams,
                                statusQueryResponseMapping: paramPricing.statusQueryResponseMapping,
                                webhookConfig: paramPricing.webhookConfig,
                                // 最小时长计算字段
                                minDuration: paramPricing.minDuration,
                                minDurationCredits: paramPricing.minDurationCredits,
                                creditsPerSecond: paramPricing.creditsPerSecond,
                            });
                        });

                        scenarioInfo.paramCombinations = paramCombinationPricings;
                    }

                    scenarios.push(scenarioInfo);
                });
            }

            providers.push({
                providerKey: providerName, // 添加 providerKey 用于保存时匹配
                name: provider.name || providerName,
                description: provider.description,
                resultMode: provider.resultMode,
                scenarios,
                // Provider 级别的 API 配置字段
                baseUrl: provider.baseUrl,
                apiEndpoint: provider.apiEndpoint,
                apiKey: provider.apiKey,
                timeout: provider.timeout,
                defaultHeaders: provider.defaultHeaders,
                // 主请求级别的默认配置
                requestParams: provider.requestParams,
                responseMapping: provider.responseMapping,
                // 状态查询级别的默认配置
                statusQueryEndpoint: provider.statusQueryEndpoint,
                statusQueryParams: provider.statusQueryParams,
                statusQueryResponseMapping: provider.statusQueryResponseMapping,
                webhookConfig: provider.webhookConfig,
            });
        });
    }

    return {
        pricing,
        providers,
    };
}
