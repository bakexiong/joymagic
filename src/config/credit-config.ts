import {
    getScenarioPricingAsync,
    getPricingConfigAsync,
    calculateCreditsFromCost,
    findProviderForScenario,
} from '@/config/pricing-config';
import {
    getCreditCostsConfigFromDB,
    saveCreditCostsConfigToDB,
    CreditCostsConfigData,
} from '@/shared/models/pricing-config';

export type CreditCostType = 'fixed' | 'dynamic';
export type CreditCalculator =
    | 'gpt-image-1'
    | 'per-layer'
    | 'duration-based'
    | 'duration-block'
    | 'duration-block-resolved'
    | 'step-based'
    | 'seedance-duration'
    | 'tier-based'
    | 'param-combination-pricing'; // 通用参数组合定价计算器

/**
 * 层级配置接口
 */
export interface TierConfig {
    /** 需要按层级计费的参数名（如 'num_images', 'duration'） */
    paramName: string;
    /** 层级列表（如 [5, 10, 15, 30]） */
    tiers: number[];
    /** 最小值（可选） */
    min?: number;
    /** 最大值（可选） */
    max?: number;
}

export interface FixedCreditConfig {
    type: 'fixed';
    /** @deprecated 积分值已废弃，现在通过成本价格和利润率自动计算 */
    credits?: number;
    description: string;
    freeGenerationKey?: 'freeImageGenerations' | 'freeVideoGenerations' | 'freeFaceSwapGenerations';
    url?: string;
    /** 是否需要保存 task 信息到数据库，默认 true */
    saveTaskToDb?: boolean;
    /** 媒体类型（用于保存 task 信息） */
    mediaType?: 'image' | 'video' | 'music' | 'text' | 'speech';
}

export interface DynamicCreditConfig {
    type: 'dynamic';
    description: string;
    calculator: CreditCalculator;
    params: Record<string, any>;
    url?: string;
    /** 是否需要保存 task 信息到数据库，默认 true */
    saveTaskToDb?: boolean;
    /** 媒体类型（用于保存 task 信息） */
    mediaType?: 'image' | 'video' | 'music' | 'text' | 'speech';
    /** UI 布局配置（用于 param-combination-pricing 计算器） */
    uiLayout?: {
        type: 'matrix' | 'list';
        rows?: string;
        columns?: string;
        cells?: string;
    };
    /** 不支持的参数组合列表（用于 param-combination-pricing 计算器） */
    unsupportedCombinations?: string[];
}

export type CreditConfig = FixedCreditConfig | DynamicCreditConfig;

export interface CalculatorConfig {
    description: string;
    url?: string | null;
    rules?: Record<string, any>;
    default?: Record<string, any>;
}

export interface CreditCostsConfig {
    costs: Record<string, CreditConfig>;
    calculators: Record<string, CalculatorConfig>;
}

/**
 * 内部工具：按块计费时的块数（向上取整）
 * 例如：duration=6, blockSize=5 => 2 blocks
 */
export function __internal_calculateDurationBlocks(duration: number, blockSize: number): number {
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    if (!Number.isFinite(blockSize) || blockSize <= 0) return 0;
    return Math.ceil(duration / blockSize);
}

// 缓存数据库配置（避免每次调用都查询数据库）
let cachedCreditCostsConfig: CreditCostsConfigData | null = null;
let creditCostsCacheTimestamp = 0;
const CREDIT_COSTS_CACHE_TTL = 60000; // 缓存 60 秒

/**
 * 生成参数组合 key（用于 param-combination-pricing 计算器）
 * 按参数名称字母顺序排序，格式：param1=value1&param2=value2
 * @param params 参数对象
 * @returns 参数组合 key
 */
export function generateParamCombinationKey(params: Record<string, any>): string {
    return Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
            // 处理不同类型的值
            if (typeof value === 'boolean') {
                return `${key}=${value}`;
            } else if (typeof value === 'number') {
                return `${key}=${value}`;
            } else {
                return `${key}=${String(value)}`;
            }
        })
        .join('&');
}

/**
 * 检查参数组合是否不支持（用于 param-combination-pricing 计算器）
 * 支持部分匹配，例如 "duration=10&resolution=1080p" 可以匹配任何包含这两个参数的组合
 * @param unsupportedCombinations 不支持的组合列表
 * @param paramKey 参数组合 key
 * @returns 是否不支持
 */
export function isUnsupportedCombination(
    unsupportedCombinations: string[] | undefined,
    paramKey: string
): boolean {
    if (!unsupportedCombinations || unsupportedCombinations.length === 0) {
        return false;
    }

    // 检查是否有任何不支持的组合模式匹配当前参数组合
    return unsupportedCombinations.some(pattern => {
        // 将模式拆分为参数对
        const patternPairs = pattern.split('&');
        const paramPairs = paramKey.split('&');

        // 检查模式中的所有参数对是否都在当前参数组合中
        return patternPairs.every(patternPair => paramPairs.includes(patternPair));
    });
}

/**
 * 获取积分消耗配置（从数据库读取）
 * 如果数据库中没有配置，自动从 JSON 文件初始化
 * 会自动同步 JSON 文件中的场景配置更改到数据库
 */
export async function getCreditCostsConfig(): Promise<CreditCostsConfigData> {
    const now = Date.now();

    // 如果缓存有效，直接返回
    if (cachedCreditCostsConfig && (now - creditCostsCacheTimestamp) < CREDIT_COSTS_CACHE_TTL) {
        return cachedCreditCostsConfig;
    }

    // 从数据库读取
    let dbConfig = await getCreditCostsConfigFromDB();

    // 如果数据库中没有配置，直接抛出异常
    if (!dbConfig) {
        throw new Error('Credit costs config not found in database. Please initialize the configuration first.');
    }

    cachedCreditCostsConfig = dbConfig;
    creditCostsCacheTimestamp = now;
    return dbConfig;
}

/**
 * 清除积分消耗配置缓存（在更新配置后调用）
 */
export function clearCreditCostsConfigCache() {
    cachedCreditCostsConfig = null;
    creditCostsCacheTimestamp = 0;
}

/**
 * 获取积分消耗配置（异步版本）
 */
export async function getCreditConfig(apiKey: string): Promise<CreditConfig | null> {
    const config = await getCreditCostsConfig();
    return config.costs[apiKey] || null;
}

/**
 * 获取积分消耗配置（同步版本，从缓存读取）
 * 注意：如果缓存中没有配置，会返回 null。建议使用异步版本
 */
export function getCreditConfigSync(apiKey: string): CreditConfig | null {
    if (cachedCreditCostsConfig) {
        return cachedCreditCostsConfig.costs[apiKey] || null;
    }
    return null;
}

/**
 * 计算固定积分消耗（异步版本）
 * 现在通过成本价格和利润率计算，不再使用配置的积分值
 */
export async function calculateFixedCredits(apiKey: string): Promise<number> {
    // 使用统一的积分计算函数，通过成本价格和利润率计算
    return await calculateRequiredCredits(apiKey);
}

/**
 * 计算动态积分消耗（异步版本）
 */
export async function calculateDynamicCredits(
    apiKey: string,
    params: Record<string, any>
): Promise<number> {
    const creditConfig = await getCreditConfig(apiKey);
    if (!creditConfig || creditConfig.type !== 'dynamic') {
        throw new Error(`No dynamic credit config found for ${apiKey}`);
    }

    const { calculator, params: configParams } = creditConfig;
    const config = await getCreditCostsConfig();

    switch (calculator) {
        case 'gpt-image-1':
            return calculateGptImage1Credits(params, configParams, config);
        case 'per-layer':
            return calculatePerLayerCredits(params, configParams);
        case 'duration-based':
            return calculateDurationBasedCredits(params, configParams);
        case 'duration-block':
            return calculateDurationBlockCredits(params, configParams);
        case 'duration-block-resolved':
            // duration-block-resolved 现在使用定价配置，不再使用硬编码的 creditsPer5Seconds
            // 需要通过 calculateRequiredCredits 统一计算
            throw new Error('duration-block-resolved calculator should use calculateRequiredCredits instead');
        case 'step-based':
            throw new Error('step-based calculator should use calculateRequiredCredits instead');
        case 'seedance-duration':
            return calculateSeedanceDurationCredits(params, configParams);
        case 'tier-based':
            return calculateTierBasedCredits(params, configParams);
        case 'param-combination-pricing':
            // 通用参数组合定价计算器
            return calculateParamCombinationCredits(apiKey, params, creditConfig);
        default:
            throw new Error(`Unknown calculator: ${calculator}`);
    }
}

/**
 * 层级匹配算法
 * 根据实际值找到对应的层级
 * @param value 实际值
 * @param tiers 层级列表
 * @returns 匹配的层级值
 */
function findMatchingTier(value: number, tiers: number[]): number {
    // 排序层级（从小到大）
    const sortedTiers = [...tiers].sort((a, b) => a - b);

    // 如果值小于等于最小层级，返回最小层级
    if (value <= sortedTiers[0]) {
        return sortedTiers[0];
    }

    // 如果值大于等于最大层级，返回最大层级
    if (value >= sortedTiers[sortedTiers.length - 1]) {
        return sortedTiers[sortedTiers.length - 1];
    }

    // 找到第一个大于等于 value 的层级
    for (const tier of sortedTiers) {
        if (value <= tier) {
            return tier;
        }
    }

    // 默认返回最大层级
    return sortedTiers[sortedTiers.length - 1];
}

/**
 * Tier-based 积分计算
 * 根据参数值匹配到对应的层级
 * @param params 请求参数
 * @param configParams 配置参数
 * @returns 匹配的层级值
 */
function calculateTierBasedCredits(
    params: Record<string, any>,
    configParams: Record<string, any>
): number {
    // 从配置中提取层级参数配置
    const tierConfig = configParams.tiers;
    if (!tierConfig) {
        throw new Error('Tier configuration not found in params');
    }

    const { paramName, tiers } = tierConfig;
    if (!paramName || !tiers || !Array.isArray(tiers) || tiers.length === 0) {
        throw new Error('Invalid tier configuration: paramName and tiers array are required');
    }

    // 从请求参数中获取实际值
    const actualValue = params[paramName];
    if (actualValue === undefined || actualValue === null) {
        throw new Error(`Parameter ${paramName} not found in request params`);
    }

    // 确保实际值是数字
    const numericValue = typeof actualValue === 'number' ? actualValue : parseFloat(actualValue);
    if (isNaN(numericValue)) {
        throw new Error(`Parameter ${paramName} must be a number, got: ${actualValue}`);
    }

    // 调用 findMatchingTier 找到匹配的层级
    const matchedTier = findMatchingTier(numericValue, tiers);

    return matchedTier;
}

/**
 * GPT Image 1 积分计算
 */
function calculateGptImage1Credits(
    params: Record<string, any>,
    configParams: Record<string, any>,
    creditCostsConfig: CreditCostsConfigData
): number {
    const size = String(params.size || configParams.size?.default || '1024*1024').toLowerCase();
    const quality = String(params.quality || configParams.quality?.default || 'medium').toLowerCase();

    const calculatorConfig = creditCostsConfig.calculators['gpt-image-1'];
    if (!calculatorConfig || !calculatorConfig.rules) {
        throw new Error('GPT Image 1 calculator config not found in database');
    }

    const sizeRules = calculatorConfig.rules[size];
    if (sizeRules && sizeRules[quality]) {
        return sizeRules[quality];
    }

    // Fallback to default
    const defaultRules = calculatorConfig.default;
    if (defaultRules && defaultRules[quality]) {
        return defaultRules[quality];
    }
    return defaultRules?.medium || 17;
}

/**
 * 按层数计算积分（如 qwen-image-layered）
 */
function calculatePerLayerCredits(
    params: Record<string, any>,
    configParams: Record<string, any>
): number {
    const numLayersParam = configParams.num_layers;
    const numLayers = params.num_layers || numLayersParam?.default || 8;

    // Validate num_layers
    if (typeof numLayers !== 'number' || numLayers < (numLayersParam?.min || 1) || numLayers > (numLayersParam?.max || 8)) {
        throw new Error(`num_layers must be between ${numLayersParam?.min || 1} and ${numLayersParam?.max || 8}`);
    }

    const creditsPerUnit = numLayersParam?.creditsPerUnit || 20;
    return numLayers * creditsPerUnit;
}

/**
 * 基于时长计算积分（如 text-to-video）
 */
function calculateDurationBasedCredits(
    params: Record<string, any>,
    configParams: Record<string, any>
): number {
    const durationParam = configParams.duration;
    const duration = params.duration || durationParam?.default || 8;

    // Validate duration
    if (durationParam?.validValues && !durationParam.validValues.includes(duration)) {
        throw new Error(`Duration must be one of: ${durationParam.validValues.join(', ')}`);
    }

    // Check if creditsPerSecond is dynamic based on another parameter
    let creditsPerSecond: number;

    if (configParams.generate_audio) {
        const generateAudio = params.generate_audio || configParams.generate_audio?.default || false;
        const audioCreditsMap = configParams.generate_audio?.creditsPerSecond;
        if (audioCreditsMap) {
            creditsPerSecond = audioCreditsMap[String(generateAudio)] || audioCreditsMap.false || 80;
        } else {
            creditsPerSecond = configParams.creditsPerSecond || 80;
        }
    } else {
        creditsPerSecond = configParams.creditsPerSecond || 80;
    }

    return duration * creditsPerSecond;
}

/**
 * 基于时长块计算积分（如 wan-2-6，按5秒块计费）
 */
function calculateDurationBlockCredits(
    params: Record<string, any>,
    configParams: Record<string, any>
): number {
    const durationParam = configParams.duration;
    const duration = params.duration || durationParam?.default || 5;
    const step = durationParam?.step || 5;
    const creditsPerBlock = configParams.creditsPer5Seconds || 200;

    // Round up to nearest block
    const blocks = Math.ceil(duration / step);
    return blocks * creditsPerBlock;
}

/**
 * 计算积分消耗（统一入口）
 * 只从数据库的价格配置中计算积分
 */
export async function calculateRequiredCredits(
    apiKey: string,
    params?: Record<string, any>
): Promise<number> {
    const creditConfig = await getCreditConfig(apiKey);
    if (!creditConfig) {
        throw new Error(`No credit config found for ${apiKey} in database`);
    }

    // 从数据库的价格配置中获取场景价格配置
    // 动态查找场景对应的 provider
    const providerName = await findProviderForScenario(apiKey);
    const scenarioPricing = await getScenarioPricingAsync(providerName, apiKey);
    const pricingConfig = await getPricingConfigAsync();

    if (!scenarioPricing) {
        throw new Error(`No pricing configuration found for ${apiKey} in database. Please configure pricing in admin panel.`);
    }
    if (creditConfig.type === 'fixed') {
        // 基于成本价格和利润率计算积分
        const margin = scenarioPricing.profitMargin ?? pricingConfig.defaultProfitMargin;
        const credits = calculateCreditsFromCost(
            scenarioPricing.costPrice,
            margin,
            pricingConfig.creditUnitPrice
        );
        return credits;
    } else {
        const hasDeclaredDynamicParams =
            creditConfig.params && Object.keys(creditConfig.params).length > 0;
        const hasParamCombinationPricing =
            scenarioPricing.paramCombinations &&
            Object.keys(scenarioPricing.paramCombinations).length > 0;

        // 检查是否是 param-combination-pricing 计算器（需要特殊处理，duration 参与组合 key）
        if (
            creditConfig.calculator === 'param-combination-pricing' ||
            (!creditConfig.calculator &&
                hasDeclaredDynamicParams &&
                hasParamCombinationPricing)
        ) {
            return calculateParamCombinationCredits(apiKey, params || {}, creditConfig);
        }

        // 检查是否是 tier-based 计算器
        if (creditConfig.calculator === 'tier-based') {
            // 获取匹配的层级
            const matchedTier = calculateTierBasedCredits(params || {}, creditConfig.params);

            // 从 tierPricing 中获取该层级的定价配置
            const tierPricing = (scenarioPricing as any).tierPricing;
            if (!tierPricing || !tierPricing[matchedTier]) {
                throw new Error(`No pricing configuration found for tier ${matchedTier} in ${apiKey}`);
            }

            const tierConfig = tierPricing[matchedTier];
            const margin = tierConfig.profitMargin ?? pricingConfig.defaultProfitMargin;
            const totalCost = tierConfig.costPrice;

            if (totalCost <= 0) {
                throw new Error(`Invalid cost configuration for tier ${matchedTier} in ${apiKey}. Cost must be greater than 0.`);
            }

            return calculateCreditsFromCost(
                totalCost,
                margin,
                pricingConfig.creditUnitPrice
            );
        }

        // 动态计算：使用数据库配置
        let margin = scenarioPricing.profitMargin ?? pricingConfig.defaultProfitMargin;
        let totalCost = scenarioPricing.costPrice || 0;

        if (creditConfig.calculator === 'step-based') {
            const stepBasedPricing = (scenarioPricing as any).stepBasedPricing;
            if (!stepBasedPricing) {
                throw new Error(`No step-based pricing configuration found for ${apiKey}`);
            }

            const actualValue = params?.[stepBasedPricing.paramName];
            if (actualValue === undefined || actualValue === null) {
                throw new Error(`Parameter ${stepBasedPricing.paramName} not found in request params`);
            }

            const numericValue =
                typeof actualValue === 'number' ? actualValue : parseFloat(actualValue);
            if (!Number.isFinite(numericValue) || numericValue < 0) {
                throw new Error(
                    `Parameter ${stepBasedPricing.paramName} must be a non-negative number, got: ${actualValue}`
                );
            }

            const stepSize = Number(stepBasedPricing.stepSize);
            const costPerStep = Number(stepBasedPricing.costPerStep);
            const minSteps = Math.max(0, Number(stepBasedPricing.minSteps ?? 0));

            if (!Number.isFinite(stepSize) || stepSize <= 0) {
                throw new Error(`Invalid stepSize configuration for ${apiKey}`);
            }
            if (!Number.isFinite(costPerStep) || costPerStep <= 0) {
                throw new Error(`Invalid costPerStep configuration for ${apiKey}`);
            }

            const calculatedSteps = Math.ceil(numericValue / stepSize);
            const billableSteps = Math.max(calculatedSteps, minSteps);
            const totalCost = billableSteps * costPerStep;

            if (totalCost <= 0) {
                throw new Error(`Invalid total cost for ${apiKey}. Total cost must be greater than 0.`);
            }

            return calculateCreditsFromCost(
                totalCost,
                margin,
                pricingConfig.creditUnitPrice
            );
        }

        // 检查是否有参数组合配置（用于 duration-based 或 seedance-duration 场景）
        let costPerSecond: number | undefined;
        if (scenarioPricing.paramCombinations && Object.keys(scenarioPricing.paramCombinations).length > 0) {
            // 辅助函数：将驼峰命名转换为下划线命名
            const camelToSnake = (str: string): string => {
                return str.replace(/([A-Z])/g, '_$1').toLowerCase();
            };

            // 辅助函数：将下划线命名转换为驼峰命名
            const snakeToCamel = (str: string): string => {
                return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            };

            /**
             * 归一化 size 参数：1280*720 与 720*1280 视为同一种规格，积分相同。
             * 统一为「宽≥高」格式，即 1280*720，便于与 admin 价格配置的 key 匹配。
             */
            const normalizeSizeForLookup = (val: string): string => {
                const s = String(val).trim();
                const m = /^(\d+)\s*\*\s*(\d+)$/.exec(s);
                if (!m) return s.toLowerCase();
                const a = parseInt(m[1], 10);
                const b = parseInt(m[2], 10);
                const [w, h] = a >= b ? [a, b] : [b, a];
                return `${w}*${h}`;
            };

            // 从 paramCombinations 的 key 中提取所有参数名
            // 例如：从 "resolution=1k" 和 "resolution=2k&size=1024" 中提取出 ["resolution", "size"]
            const availableParamNames = new Set<string>();
            Object.keys(scenarioPricing.paramCombinations).forEach(key => {
                const parts = key.split('&');
                parts.forEach(part => {
                    const [paramName] = part.split('=');
                    if (paramName && paramName !== 'duration') {
                        availableParamNames.add(paramName);
                    }
                });
            });

            // 只使用 paramCombinations 中存在的参数来构建 key（排除 duration 参数）
            // 支持驼峰和下划线两种参数名格式
            const paramsForKey: Record<string, any> = {};
            if (params) {
                Object.keys(params).forEach(key => {
                    if (key === 'duration') return;

                    // 尝试匹配参数名（支持驼峰和下划线两种格式）
                    let dbParamName: string | null = null;
                    // 兼容常见拼写错误：后台价格配置里如果写成 resoluation/resoulation，
                    // 这里允许前端传 resolution 也能命中对应 paramCombinations。
                    // 反之亦然：若前端传错，也尽量映射到后台的 resolution。
                    const RESOLUTION_ALIASES: Record<string, string[]> = {
                        resolution: ['resoluation', 'resoulation'],
                        resoluation: ['resolution', 'resoulation'],
                        resoulation: ['resolution', 'resoluation'],
                    };

                    // 1. 直接匹配
                    if (availableParamNames.has(key)) {
                        dbParamName = key;
                    } else {
                        // 1.1 特殊别名匹配（主要用于 resolution 的常见拼写错误）
                        const aliases = RESOLUTION_ALIASES[key];
                        if (aliases) {
                            const hit = aliases.find((alias) => availableParamNames.has(alias));
                            if (hit) {
                                dbParamName = hit;
                            }
                        }
                    }

                    if (!dbParamName) {
                        // 2. 尝试将驼峰转换为下划线后匹配
                        const snakeCase = camelToSnake(key);
                        if (availableParamNames.has(snakeCase)) {
                            dbParamName = snakeCase;
                        } else {
                            // 3. 尝试将下划线转换为驼峰后匹配
                            const camelCase = snakeToCamel(key);
                            if (availableParamNames.has(camelCase)) {
                                dbParamName = camelCase;
                            }
                        }
                    }

                    // 如果找到了匹配的参数名，添加到 paramsForKey
                    if (dbParamName) {
                        const value = params[key];
                        if (typeof value === 'string') {
                            // size 参数归一化：1280*720 与 720*1280 同价，统一为 1280*720 便于匹配
                            if (dbParamName === 'size') {
                                paramsForKey[dbParamName] = normalizeSizeForLookup(value);
                            } else {
                                paramsForKey[dbParamName] = value.toLowerCase();
                            }
                        } else {
                            paramsForKey[dbParamName] = value;
                        }
                    }
                });
            }
            // 将参数组合转换为 key（按字母顺序排序）
            const paramKey = Object.entries(paramsForKey)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            /**
             * 参数组合 key 归一化：
             * - 兼容后台 paramCombinations key 里的拼写错误（resoluation/resoulation -> resolution）
             * - value 统一小写
             * - 参数顺序统一按字母排序
             *
             * 目的：避免「后台配置是 32，但请求返回 16」这种因 key 不匹配导致的回落默认档问题。
             */
            const canonicalizeParamName = (name: string) => {
                const n = String(name || '').trim();
                if (n === 'resoluation' || n === 'resoulation') return 'resolution';
                return n;
            };

            const normalizeCombinationKey = (key: string) => {
                const pairs = String(key || '')
                    .split('&')
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .map((part) => {
                        const [rawName, rawVal = ''] = part.split('=');
                        const name = canonicalizeParamName(rawName);
                        const val = String(rawVal).trim().toLowerCase();
                        return [name, val] as const;
                    })
                    .sort(([a], [b]) => a.localeCompare(b));
                return pairs.map(([k, v]) => `${k}=${v}`).join('&');
            };

            const normalizedParamKey = normalizeCombinationKey(paramKey);
            const normalizedParamCombinations = new Map<string, any>();
            Object.entries(scenarioPricing.paramCombinations).forEach(([k, v]) => {
                normalizedParamCombinations.set(normalizeCombinationKey(k), v);
            });

            const paramPricing =
                scenarioPricing.paramCombinations[paramKey] ??
                scenarioPricing.paramCombinations[normalizedParamKey] ??
                normalizedParamCombinations.get(normalizedParamKey);

            if (paramPricing) {
                // 检查是否是最小时长计算方式（minDuration + costPerSecond）
                // 如果配置了 minDuration 和 costPerSecond，则通过成本价格计算积分
                if (paramPricing.minDuration !== undefined && (paramPricing as any).costPerSecond !== undefined) {
                    // 获取 duration 参数（支持 duration 和 video_duration_seconds）
                    const duration = params?.duration ?? params?.video_duration_seconds;
                    if (duration !== undefined && typeof duration === 'number') {
                        const costPerSecond = (paramPricing as any).costPerSecond;
                        const paramMargin = paramPricing.profitMargin ?? margin;

                        // 使用新的计算逻辑：小于最小时长按最小时长计算，大于最小时长按每秒计算
                        let totalCost: number;
                        if (duration <= paramPricing.minDuration) {
                            // 小于最小时长，按最小时长计算成本
                            totalCost = costPerSecond * paramPricing.minDuration;
                        } else {
                            // 大于最小时长，按实际时长计算成本
                            totalCost = costPerSecond * duration;
                        }

                        // 通过成本价格和利润率计算积分
                        return calculateCreditsFromCost(
                            totalCost,
                            paramMargin,
                            pricingConfig.creditUnitPrice
                        );
                    }
                    margin = paramPricing.profitMargin ?? margin;
                }
                // 检查是否是 duration-block-resolved 场景（每5秒成本）
                else if ((paramPricing as any).costPer5Seconds !== undefined) {
                    // duration-block-resolved 场景：使用每5秒成本
                    const costPer5Seconds = (paramPricing as any).costPer5Seconds;
                    if (params?.duration) {
                        const blocks = __internal_calculateDurationBlocks(params.duration, 5);
                        totalCost = costPer5Seconds * blocks;
                    }
                    margin = paramPricing.profitMargin ?? margin;
                } else if ((paramPricing as any).costPerSecond !== undefined) {
                    // duration-based 场景：使用每秒成本
                    const costPerSecondValue = (paramPricing as any).costPerSecond;
                    costPerSecond = costPerSecondValue;
                    margin = paramPricing.profitMargin ?? margin;
                    // 立即计算总成本：每秒成本 × 时长
                    if (params?.duration) {
                        totalCost = costPerSecondValue * params.duration;
                    }
                } else {
                    // 对于其他参数组合，检查是否是按秒计费的场景
                    // 如果是 seedance-duration 或 duration-based 类型，且没有 costPerSecond，
                    // 则 costPrice 应该是每秒成本，需要乘以 duration
                    const isSeedanceDuration = creditConfig.type === 'dynamic' &&
                        (creditConfig as DynamicCreditConfig).calculator === 'seedance-duration';
                    const isDurationBased = creditConfig.type === 'dynamic' &&
                        (creditConfig as DynamicCreditConfig).calculator === 'duration-based';

                    if ((isSeedanceDuration || isDurationBased) && params?.duration && paramPricing.costPrice) {
                        // 对于按秒计费的场景，costPrice 是每秒成本，需要乘以 duration
                        totalCost = paramPricing.costPrice * params.duration;
                    } else {
                        // 对于其他场景，直接使用 costPrice 作为总成本
                        totalCost = paramPricing.costPrice;
                    }
                    margin = paramPricing.profitMargin ?? margin;
                }
            }
        }

        // 检查场景级别的最小时长计算方式（minDuration + costPerSecond）
        // 如果配置了 minDuration 和 costPerSecond，则通过成本价格计算积分
        if (scenarioPricing.minDuration !== undefined) {
            // 获取 duration 参数（支持 duration 和 video_duration_seconds）
            const duration = params?.duration ?? params?.video_duration_seconds;
            if (duration !== undefined && typeof duration === 'number') {
                // 1) 优先走成本配置：minDuration + costPerSecond（成本/秒）
                if ((scenarioPricing as any).costPerSecond !== undefined) {
                    const costPerSecond = Number((scenarioPricing as any).costPerSecond);
                    const billableSeconds = duration <= scenarioPricing.minDuration
                        ? scenarioPricing.minDuration
                        : duration;
                    const totalCost = costPerSecond * billableSeconds;

                    return calculateCreditsFromCost(
                        totalCost,
                        margin,
                        pricingConfig.creditUnitPrice
                    );
                }

                // 2) 兼容旧字段：minDuration + creditsPerSecond（积分/秒）
                if ((scenarioPricing as any).creditsPerSecond !== undefined) {
                    const creditsPerSecond = Number((scenarioPricing as any).creditsPerSecond);
                    const billableSeconds = duration <= scenarioPricing.minDuration
                        ? scenarioPricing.minDuration
                        : duration;

                    // 若显式提供 minDurationCredits，短时长直接用它，否则用 creditsPerSecond 推导
                    if (
                        duration <= scenarioPricing.minDuration &&
                        (scenarioPricing as any).minDurationCredits !== undefined
                    ) {
                        return Number((scenarioPricing as any).minDurationCredits);
                    }

                    // 向上取整，避免小数积分
                    return Math.ceil(billableSeconds * creditsPerSecond);
                }
            }
        }

        // 处理动态成本参数
        // 按层数计算（如 qwen-image-layered）
        // costPrice 是单个layer的价格，需要乘以 num_layers 得到总成本
        // 统一使用：先计算单个layer的积分，然后乘以层数
        // 这样可以确保积分计算的准确性（避免先计算总成本再转换积分时的精度问题）
        if (params?.num_layers) {
            // 获取单个layer的成本
            // 优先使用 costPerLayer，如果没有则使用 costPrice（costPrice 本身就是单个layer的价格）
            const costPerLayer = scenarioPricing.costPerLayer ?? scenarioPricing.costPrice ?? 0;

            if (costPerLayer <= 0) {
                throw new Error(`Invalid cost configuration for ${apiKey}. costPerLayer or costPrice must be greater than 0.`);
            }

            // 先计算单个layer的积分
            const singleLayerCredits = calculateCreditsFromCost(
                costPerLayer,
                margin,
                pricingConfig.creditUnitPrice
            );
            // 然后乘以层数
            const layerCredits = singleLayerCredits * params.num_layers;

            // 当存在 num_layers 参数时，只按层数计算
            return layerCredits;
        }

        // 按秒数计算（如视频生成）
        // 优先使用参数组合的 costPerSecond，否则使用场景级别的 costPerSecond
        // 如果 totalCost 还没有被计算（仍然是初始值），则使用 costPerSecond 计算
        const finalCostPerSecond = costPerSecond ?? scenarioPricing.costPerSecond;
        if (finalCostPerSecond && params?.duration && totalCost === (scenarioPricing.costPrice || 0)) {
            totalCost = finalCostPerSecond * params.duration;
        }

        // 按5秒块计算（如 wan-2-6，duration-block-resolved）
        // 如果还没有计算总成本，检查场景级别的 costPer5Seconds
        if (totalCost === (scenarioPricing.costPrice || 0) && (scenarioPricing as any).costPer5Seconds && params?.duration) {
            const blocks = __internal_calculateDurationBlocks(params.duration, 5);
            totalCost = (scenarioPricing as any).costPer5Seconds * blocks;
        }

        // 如果总成本为0，抛出错误
        if (totalCost <= 0) {
            throw new Error(`Invalid cost configuration for ${apiKey}. Total cost must be greater than 0.`);
        }

        return calculateCreditsFromCost(
            totalCost,
            margin,
            pricingConfig.creditUnitPrice
        );
    }
}


/**
 * Seedance 1.5 Pro 积分计算（基于分辨率、时长和音频）
 */
function calculateSeedanceDurationCredits(
    params: Record<string, any>,
    configParams: Record<string, any>
): number {
    const durationParam = configParams.duration;
    const duration = params.duration || durationParam?.default || 5;

    // Validate duration
    if (duration < (durationParam?.min || 5) || duration > (durationParam?.max || 12)) {
        throw new Error(`Duration must be between ${durationParam?.min || 5} and ${durationParam?.max || 12}`);
    }

    const resolution = params.resolution || configParams.resolution?.default || 'fast 720p';
    const generateAudio = params.generate_audio || configParams.generate_audio?.default || false;

    // Calculate credits per second based on resolution and audio
    let creditsPerSecond: number;

    if (resolution === 'fast 720p') {
        creditsPerSecond = generateAudio ? 16 : 8;
    } else if (resolution === 'fast 1080p') {
        creditsPerSecond = generateAudio ? 24 : 12;
    } else if (resolution === '720p') {
        creditsPerSecond = generateAudio ? 21 : 11;
    } else if (resolution === '480p') {
        creditsPerSecond = generateAudio ? 10 : 5;
    } else {
        throw new Error(`Invalid resolution: ${resolution}`);
    }

    return Math.ceil(duration * creditsPerSecond);
}

/**
 * 获取免费生成次数键（异步版本）
 */
export async function getFreeGenerationKey(apiKey: string): Promise<string | undefined> {
    const creditConfig = await getCreditConfig(apiKey);
    if (creditConfig && creditConfig.type === 'fixed') {
        return creditConfig.freeGenerationKey;
    }
    return undefined;
}

/**
 * 获取免费生成次数键（同步版本，从缓存读取）
 */
export function getFreeGenerationKeySync(apiKey: string): string | undefined {
    const creditConfig = getCreditConfigSync(apiKey);
    if (creditConfig && creditConfig.type === 'fixed') {
        return creditConfig.freeGenerationKey;
    }
    return undefined;
}

/**
 * 获取接口的 URL 路径（异步版本）
 */
export async function getApiUrl(apiKey: string): Promise<string | undefined> {
    const creditConfig = await getCreditConfig(apiKey);
    return creditConfig?.url;
}

/**
 * 获取接口的 URL 路径（同步版本，从缓存读取）
 */
export function getApiUrlSync(apiKey: string): string | undefined {
    const creditConfig = getCreditConfigSync(apiKey);
    return creditConfig?.url;
}

/**
 * 根据 URL 路径获取 API Key（异步版本）
 */
export async function getApiKeyByUrl(url: string): Promise<string | null> {
    const creditCostsConfig = await getCreditCostsConfig();
    for (const [key, creditConfig] of Object.entries(creditCostsConfig.costs)) {
        if (creditConfig.url === url) {
            return key;
        }
    }
    return null;
}

/**
 * 获取计算器的配置（异步版本）
 */
export async function getCalculatorConfig(calculatorName: string): Promise<CalculatorConfig | null> {
    const creditCostsConfig = await getCreditCostsConfig();
    return creditCostsConfig.calculators[calculatorName] || null;
}

/**
 * 获取计算器的配置（同步版本，从缓存读取）
 */
export function getCalculatorConfigSync(calculatorName: string): CalculatorConfig | null {
    if (cachedCreditCostsConfig) {
        return cachedCreditCostsConfig.calculators[calculatorName] || null;
    }
    return null;
}

/**
 * 获取计算器的 URL 路径（异步版本）
 */
export async function getCalculatorUrl(calculatorName: string): Promise<string | null | undefined> {
    const calculatorConfig = await getCalculatorConfig(calculatorName);
    return calculatorConfig?.url;
}

/**
 * 获取计算器的 URL 路径（同步版本，从缓存读取）
 */
export function getCalculatorUrlSync(calculatorName: string): string | null | undefined {
    const calculatorConfig = getCalculatorConfigSync(calculatorName);
    return calculatorConfig?.url;
}

/**
 * 根据 URL 路径获取计算器名称（异步版本）
 */
export async function getCalculatorByUrl(url: string): Promise<string | null> {
    const creditCostsConfig = await getCreditCostsConfig();
    for (const [name, calculatorConfig] of Object.entries(creditCostsConfig.calculators)) {
        if (calculatorConfig.url === url) {
            return name;
        }
    }
    return null;
}

/**
 * 通用参数组合定价积分计算（用于 param-combination-pricing 计算器）
 * @param apiKey 场景名称
 * @param params 请求参数
 * @param creditConfig 场景配置
 * @returns 需要消耗的积分
 */
async function calculateParamCombinationCredits(
    apiKey: string,
    params: Record<string, any>,
    creditConfig: DynamicCreditConfig
): Promise<number> {
    /**
     * 1) 生成参数组合 key
     *
     * 关键点：
     * - 只能使用该场景在 credit-config 中声明的参数名（creditConfig.params），否则会把多余参数拼进 key，导致无法命中 paramCombinations
     * - 严格按照配置中的参数名和类型进行匹配，不做任何别名映射
     * - 按声明类型做简单归一化（string/number/boolean）
     */
    const declaredParams = creditConfig.params || {};
    const normalizedParams: Record<string, any> = {};

    const normalizeBoolean = (v: any): boolean => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v !== 0;
        const s = String(v).trim().toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
        return Boolean(v);
    };

    const normalizeNumber = (v: any): number => {
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isFinite(n) ? n : NaN;
    };

    for (const [paramName, def] of Object.entries(declaredParams)) {
        const declaredType = (def as any)?.type as 'string' | 'number' | 'boolean' | undefined;
        // 严格按照配置中的参数名从 params 中取值，不做任何别名映射
        const raw = params?.[paramName];
        const value = raw !== undefined ? raw : (def as any)?.default;

        if (declaredType === 'boolean') {
            normalizedParams[paramName] = normalizeBoolean(value);
        } else if (declaredType === 'number') {
            const n = normalizeNumber(value);
            if (!Number.isFinite(n)) {
                throw new Error(`Parameter ${paramName} must be a number, got: ${value}`);
            }
            normalizedParams[paramName] = n;
        } else {
            // string 或未声明类型：统一转字符串
            normalizedParams[paramName] = String(value);
        }
    }

    const paramKey = generateParamCombinationKey(normalizedParams);

    // 2. 检查是否为不支持的组合
    if (isUnsupportedCombination(creditConfig.unsupportedCombinations, paramKey)) {
        throw new Error(`Unsupported parameter combination: ${paramKey}`);
    }

    // 3. 从定价配置中查找对应的价格
    const providerName = await findProviderForScenario(apiKey);
    const scenarioPricing = await getScenarioPricingAsync(providerName, apiKey);

    if (!scenarioPricing) {
        throw new Error(`No pricing config found for scenario: ${apiKey}`);
    }

    // 4. 查找参数组合的价格配置（严格按照配置中的参数名和类型生成的 key）
    const allCombinationPricing = scenarioPricing.paramCombinations || {};
    const paramCombinationPricing = allCombinationPricing[paramKey];

    if (!paramCombinationPricing) {
        // 如果找不到特定组合的价格：直接报错更容易定位配置问题（避免悄悄回退导致“没匹配到”不易发现）
        // 如需回退默认价格，可在此处改回 fallback 逻辑。
        throw new Error(
            `No pricing found for combination: ${paramKey}. Please ensure pricing_config.paramCombinations contains this key for scenario ${apiKey}.`
        );
    }

    // 5. 计算积分
    const pricingConfig = await getPricingConfigAsync();
    const margin = paramCombinationPricing.profitMargin ?? scenarioPricing.profitMargin ?? pricingConfig.defaultProfitMargin;

    return calculateCreditsFromCost(
        paramCombinationPricing.costPrice,
        margin,
        pricingConfig.creditUnitPrice
    );
}
