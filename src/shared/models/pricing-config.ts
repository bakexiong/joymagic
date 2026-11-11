import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { config } from '@/config/db/schema';

const PRICING_CONFIG_KEY = 'pricing_config';
const CREDIT_COSTS_CONFIG_KEY = 'credit_costs_config';
const TOPUP_AMOUNTS_CONFIG_KEY = 'topup_amounts_config';

/**
 * 层级定价配置接口
 */
export interface TierPricing {
    [tier: number]: {
        costPrice: number;
        profitMargin?: number;
        apiEndpoint?: string;
        requestParams?: any[];
        responseMapping?: any;
        statusQueryEndpoint?: string;
        statusQueryParams?: any[];
        statusQueryResponseMapping?: any;
    };
}

export interface StepBasedPricing {
    paramName: string;
    stepSize: number;
    costPerStep: number;
    minSteps?: number;
}

export interface PricingConfigData {
    pricing: {
        creditUnitPrice: number;
        defaultProfitMargin: number;
        currency: string;
        description?: string;
        defaultProvider?: string;
    };
    providers: Record<string, {
        name: string;
        description?: string;
        /** 结果获取方式：async 表示返回任务 ID 通过 Status 轮询，sync 表示直接返回最终结果 */
        resultMode?: 'sync' | 'async';
        scenarios: Record<string, {
            costPrice: number;
            profitMargin?: number;
            description?: string;
            // API 配置字段
            apiEndpoint?: string;
            requestParams?: any[];
            responseMapping?: any;
            statusQueryEndpoint?: string;
            statusQueryParams?: any[];
            statusQueryResponseMapping?: any;
            // 动态成本参数
            costPerLayer?: number;
            costPerSecond?: number;
            costPer5Seconds?: number;
            stepBasedPricing?: StepBasedPricing;
            paramCombinations?: Record<string, any>;
            // 层级定价配置
            tierPricing?: TierPricing;
            [key: string]: any;
        }>;
        // Provider 级别的 API 配置
        baseUrl?: string;
        apiEndpoint?: string;
        apiKey?: string;
        timeout?: number;
        defaultHeaders?: Record<string, string>;
        // Provider 级别的主请求配置（用于同步模式或作为场景默认值）
        requestParams?: any[];
        responseMapping?: any;
        statusQueryEndpoint?: string;
        statusQueryParams?: any[];
        statusQueryResponseMapping?: any;
        [key: string]: any;
    }>;
}

export interface FixedCreditConfig {
    type: 'fixed';
    credits: number;
    description: string;
    freeGenerationKey?: 'freeImageGenerations' | 'freeVideoGenerations' | 'freeFaceSwapGenerations';
    url?: string;
    /** 是否需要保存 task 信息到数据库，默认 true */
    saveTaskToDb?: boolean;
    /** 媒体类型（用于保存 task 信息） */
    mediaType?: 'image' | 'video' | 'music' | 'text' | 'speech';
}

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
        rows?: string; // 行参数名（仅 matrix）
        columns?: string; // 列参数名（仅 matrix）
        cells?: string; // 单元格参数名（仅 matrix）
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

export interface CreditCostsConfigData {
    costs: Record<string, CreditConfig>;
    calculators: Record<string, CalculatorConfig>;
}

/**
 * 从数据库获取价格配置
 */
export async function getPricingConfigFromDB(): Promise<PricingConfigData | null> {
    try {
        const [configRecord] = await db()
            .select()
            .from(config)
            .where(eq(config.name, PRICING_CONFIG_KEY))
            .limit(1);

        if (!configRecord || !configRecord.value) {
            return null;
        }

        return JSON.parse(configRecord.value) as PricingConfigData;
    } catch (error) {
        console.error('Failed to get pricing config from database:', error);
        return null;
    }
}

/**
 * 保存价格配置到数据库
 */
export async function savePricingConfigToDB(data: PricingConfigData): Promise<void> {
    try {
        await db()
            .insert(config)
            .values({
                name: PRICING_CONFIG_KEY,
                value: JSON.stringify(data),
            })
            .onConflictDoUpdate({
                target: config.name,
                set: {
                    value: JSON.stringify(data),
                },
            });
    } catch (error) {
        console.error('Failed to save pricing config to database:', error);
        throw error;
    }
}

/**
 * 更新价格配置的部分字段
 */
export async function updatePricingConfigInDB(
    updates: Partial<PricingConfigData>
): Promise<PricingConfigData> {
    const existing = await getPricingConfigFromDB();
    const updated: PricingConfigData = existing
        ? { ...existing, ...updates }
        : {
            pricing: {
                creditUnitPrice: 0.01,
                defaultProfitMargin: 0.3,
                currency: 'USD',
            },
            providers: {},
            ...updates,
        };

    await savePricingConfigToDB(updated);
    return updated;
}

/**
 * 从数据库获取积分消耗配置
 */
export async function getCreditCostsConfigFromDB(): Promise<CreditCostsConfigData | null> {
    try {
        const [configRecord] = await db()
            .select()
            .from(config)
            .where(eq(config.name, CREDIT_COSTS_CONFIG_KEY))
            .limit(1);

        if (!configRecord || !configRecord.value) {
            return null;
        }

        return JSON.parse(configRecord.value) as CreditCostsConfigData;
    } catch (error) {
        console.error('Failed to get credit costs config from database:', error);
        return null;
    }
}

/**
 * 保存积分消耗配置到数据库
 */
export async function saveCreditCostsConfigToDB(data: CreditCostsConfigData): Promise<void> {
    try {
        await db()
            .insert(config)
            .values({
                name: CREDIT_COSTS_CONFIG_KEY,
                value: JSON.stringify(data),
            })
            .onConflictDoUpdate({
                target: config.name,
                set: {
                    value: JSON.stringify(data),
                },
            });
    } catch (error) {
        console.error('Failed to save credit costs config to database:', error);
        throw error;
    }
}


/**
 * 从数据库获取充值价格配置
 */
export async function getTopupAmountsConfigFromDB(): Promise<TopupAmountsConfigData | null> {
    try {
        const [configRecord] = await db()
            .select()
            .from(config)
            .where(eq(config.name, TOPUP_AMOUNTS_CONFIG_KEY))
            .limit(1);

        if (!configRecord || !configRecord.value) {
            return null;
        }

        return JSON.parse(configRecord.value) as TopupAmountsConfigData;
    } catch (error) {
        console.error('Failed to get topup amounts config from database:', error);
        return null;
    }
}

/**
 * 保存充值价格配置到数据库
 */
export async function saveTopupAmountsConfigToDB(data: TopupAmountsConfigData): Promise<void> {
    try {
        await db()
            .insert(config)
            .values({
                name: TOPUP_AMOUNTS_CONFIG_KEY,
                value: JSON.stringify(data),
            })
            .onConflictDoUpdate({
                target: config.name,
                set: {
                    value: JSON.stringify(data),
                },
            });
    } catch (error) {
        console.error('Failed to save topup amounts config to database:', error);
        throw error;
    }
}

/**
 * 充值价格配置项
 */
export interface TopupAmountItem {
    name: string;
    productId: string;
    amount: number; // 金额（美元）
    enabled?: boolean; // 是否启用，默认 true
    order?: number; // 排序顺序
  }
  
  /** 新用户同步到 NewAPI 时赠送的额度（美元），默认 3 */
  const DEFAULT_NEW_USER_GRANT_QUOTA = 3;
  
  /**
  * 充值价格配置数据
  */
  export interface TopupAmountsConfigData {
    amounts: TopupAmountItem[];
    /** 新用户同步到 NewAPI 时赠送的额度（美元），默认 3 */
    newUserGrantQuota?: number;
  }
  
  export { DEFAULT_NEW_USER_GRANT_QUOTA };
