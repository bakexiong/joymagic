import { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import {
    getAllPricingInfo,
    getPricingConfigAsync,
    calculateSellingPrice,
    calculateCreditsFromPrice,
    clearPricingConfigCache,
} from '@/config/pricing-config';
import {
    savePricingConfigToDB,
    updatePricingConfigInDB,
    getPricingConfigFromDB,
    getCreditCostsConfigFromDB,
    saveCreditCostsConfigToDB,
} from '@/shared/models/pricing-config';
import { clearCreditCostsConfigCache, getCreditCostsConfig } from '@/config/credit-config';

/**
 * GET - 获取所有价格配置信息
 * 支持查询参数 ?scenarios=true 来获取所有可用场景列表
 */
export async function GET(req: NextRequest) {
    try {
        await requirePermission({
            code: PERMISSIONS.SETTINGS_WRITE,
            redirectUrl: '/admin/no-permission',
            locale: 'zh',
        });

        const { searchParams } = new URL(req.url);
        const getScenarios = searchParams.get('scenarios') === 'true';
        const scenarioName = searchParams.get('scenario');
        const refreshConfig = searchParams.get('refresh') === 'true';

        // 如果请求刷新配置，清除缓存并重新加载
        if (refreshConfig) {
            clearPricingConfigCache();
            clearCreditCostsConfigCache();
        }

        if (getScenarios) {
            // 返回所有可用的场景列表（从 costs 中获取）
            const creditCostsConfigData = await getCreditCostsConfig();
            const scenarios = Object.keys(creditCostsConfigData.costs).map((scenarioName) => {
                const costConfig = creditCostsConfigData.costs[scenarioName];
                return {
                    name: scenarioName,
                    description: costConfig.description || scenarioName,
                    type: costConfig.type,
                };
            });
            return respData({ scenarios });
        }

        if (scenarioName) {
            const creditCostsConfigData = await getCreditCostsConfig();
            const costConfig = creditCostsConfigData.costs?.[scenarioName];
            if (!costConfig) {
                return respErr(`Scenario "${scenarioName}" not found`);
            }
            return respData({
                scenario: {
                    name: scenarioName,
                    ...costConfig,
                },
            });
        }

        const pricingInfo = await getAllPricingInfo();
        return respData(pricingInfo);
    } catch (e: any) {
        console.error('Failed to get pricing info:', e);
        return respErr(e.message || 'Failed to get pricing info');
    }
}

/**
 * POST - 更新价格配置
 */
export async function POST(req: NextRequest) {
    try {
        await requirePermission({
            code: PERMISSIONS.SETTINGS_WRITE,
            redirectUrl: '/admin/no-permission',
            locale: 'zh',
        });

        const body = await req.json();
        const { pricing, providers, newProvider, newScenario, updateScenario, deleteProvider, deleteScenario } = body;

        // 验证数据格式
        if (pricing) {
            if (typeof pricing.creditUnitPrice !== 'number' || pricing.creditUnitPrice <= 0) {
                return respErr('Invalid credit unit price');
            }
            if (
                typeof pricing.defaultProfitMargin !== 'number' ||
                pricing.defaultProfitMargin < 0 ||
                pricing.defaultProfitMargin >= 1
            ) {
                return respErr('Invalid profit margin (must be between 0 and 1)');
            }
        }

        // 获取当前配置（会自动初始化，如果数据库中没有配置）
        // 使用 getAllPricingInfo 来触发自动初始化
        await getAllPricingInfo();
        const currentDbConfig = await getPricingConfigFromDB();
        const baseConfig = currentDbConfig || {
            pricing: {
                creditUnitPrice: 0.01,
                defaultProfitMargin: 0.3,
                currency: 'USD',
            },
            providers: {},
        };

        // 删除 provider（持久化到数据库）
        if (deleteProvider) {
            const { name, providerKey } = deleteProvider as { name?: string; providerKey?: string };
            const keyToDelete =
                providerKey ||
                (name
                    ? Object.keys(baseConfig.providers || {}).find(
                        (k) => baseConfig.providers?.[k]?.name === name
                    )
                    : undefined);

            if (!keyToDelete) {
                return respErr('Provider name or providerKey is required');
            }
            if (!baseConfig.providers?.[keyToDelete]) {
                return respErr(`Provider "${keyToDelete}" not found`);
            }

            delete baseConfig.providers[keyToDelete];

            // 如果删除后没有 provider，则阻止（避免系统不可用）
            if (Object.keys(baseConfig.providers).length === 0) {
                return respErr('At least one provider must exist');
            }

            // 直接保存并返回，避免后续 providers 合并逻辑把删除的 provider 写回
            await savePricingConfigToDB(baseConfig);
            clearPricingConfigCache();
            return respData({
                message: 'Provider deleted successfully',
                config: baseConfig,
            });
        }

        // 删除场景（从 costs 配置和所有 provider 的场景中删除）
        if (deleteScenario) {
            const { name: scenarioName } = deleteScenario as { name?: string };
            if (!scenarioName) {
                return respErr('Scenario name is required');
            }

            // 检查场景是否存在于任何地方（credit-costs 配置或 provider 的场景中）
            const creditCostsConfigData = await getCreditCostsConfig();
            const existsInCosts = !!creditCostsConfigData.costs[scenarioName];
            const existsInProviders = Object.keys(baseConfig.providers).some((providerKey) => {
                return !!baseConfig.providers[providerKey]?.scenarios?.[scenarioName];
            });

            if (!existsInCosts && !existsInProviders) {
                return respErr(`Scenario "${scenarioName}" not found in credit costs config or any provider`);
            }

            // 如果场景存在于 credit-costs 配置中，则删除它
            if (existsInCosts) {
                delete creditCostsConfigData.costs[scenarioName];
                await saveCreditCostsConfigToDB(creditCostsConfigData);
                clearCreditCostsConfigCache();
            }

            // 从所有 provider 的场景中删除
            let hasDeletedFromProviders = false;
            Object.keys(baseConfig.providers).forEach((providerKey) => {
                const provider = baseConfig.providers[providerKey];
                if (provider?.scenarios?.[scenarioName]) {
                    delete provider.scenarios[scenarioName];
                    hasDeletedFromProviders = true;
                }
            });

            // 如果从 provider 中删除了场景，保存配置
            if (hasDeletedFromProviders) {
                await savePricingConfigToDB(baseConfig);
                clearPricingConfigCache();
            }

            return respData({
                message: `Scenario "${scenarioName}" deleted successfully`,
            });
        }

        // 如果添加新 provider，自动从 costs 中获取所有场景
        if (newProvider) {
            const { name, description, providerKey } = newProvider;
            if (!name || !providerKey) {
                return respErr('Provider name and key are required');
            }

            // 检查 provider 是否已存在
            if (baseConfig.providers[providerKey]) {
                return respErr(`Provider with key "${providerKey}" already exists`);
            }

            // 获取所有场景（从数据库）
            const creditCostsConfigData = await getCreditCostsConfig();

            const pricingConfig = baseConfig.pricing;
            const defaultMargin = pricingConfig.defaultProfitMargin;

            // 为所有场景创建默认价格配置
            const scenarios: Record<string, any> = {};
            Object.entries(creditCostsConfigData.costs).forEach(([scenarioName, costConfig]: [string, any]) => {
                let defaultCostPrice = 0.01; // 默认成本价格

                if (costConfig.type === 'fixed' && costConfig.credits) {
                    // 根据积分值反向计算成本价格
                    const sellingPrice = costConfig.credits * pricingConfig.creditUnitPrice;
                    defaultCostPrice = sellingPrice * (1 - defaultMargin);
                }

                scenarios[scenarioName] = {
                    costPrice: defaultCostPrice,
                    profitMargin: defaultMargin,
                    description: costConfig.description || `${scenarioName} cost price`,
                };
            });

            // 添加新 provider
            baseConfig.providers[providerKey] = {
                name,
                description: description || `${name} AI Provider`,
                scenarios,
            };
        }

        // 如果添加新场景，更新 costs 配置并为所有 provider 添加该场景
        if (newScenario) {
            const {
                name: scenarioName,
                type,
                description: scenarioDescription,
                url,
                credits,
                params,
                calculator,
                stepBasedPricing,
            } = newScenario;
            if (!scenarioName || !type) {
                return respErr('Scenario name and type are required');
            }

            // 获取 costs 配置
            const creditCostsConfigData = await getCreditCostsConfig();

            // 检查场景是否已存在
            if (creditCostsConfigData.costs[scenarioName]) {
                return respErr(`Scenario "${scenarioName}" already exists`);
            }

            // 创建新场景配置
            const newScenarioConfig: any = {
                type,
                description: scenarioDescription || scenarioName,
            };

            if (url) {
                newScenarioConfig.url = url;
            }

            if (type === 'fixed' && credits !== undefined) {
                newScenarioConfig.credits = credits;
            } else if (type === 'dynamic') {
                if (calculator) {
                    newScenarioConfig.calculator = calculator;
                }
                if (params) {
                    newScenarioConfig.params = params;
                }
            }

            // 添加到 costs 配置
            creditCostsConfigData.costs[scenarioName] = newScenarioConfig;

            // 保存 costs 配置到数据库
            await saveCreditCostsConfigToDB(creditCostsConfigData);
            clearCreditCostsConfigCache();

            // 为所有 provider 添加该场景的默认价格配置
            const pricingConfig = baseConfig.pricing;
            const defaultMargin = pricingConfig.defaultProfitMargin;
            let defaultCostPrice = 0.01;

            if (type === 'fixed' && credits !== undefined) {
                const sellingPrice = credits * pricingConfig.creditUnitPrice;
                defaultCostPrice = sellingPrice * (1 - defaultMargin);
            }

            Object.keys(baseConfig.providers).forEach((providerKey) => {
                if (!baseConfig.providers[providerKey].scenarios[scenarioName]) {
                    const scenarioConfig: any = {
                        costPrice: defaultCostPrice,
                        profitMargin: defaultMargin,
                        description: scenarioDescription || `${scenarioName} cost price`,
                    };

                    if (calculator === 'step-based' && stepBasedPricing) {
                        scenarioConfig.stepBasedPricing = stepBasedPricing;
                        if (typeof stepBasedPricing.costPerStep === 'number' && stepBasedPricing.costPerStep > 0) {
                            scenarioConfig.costPrice = stepBasedPricing.costPerStep;
                        }
                    }

                    // 如果是 tier-based 场景，初始化 tierPricing
                    if (calculator === 'tier-based' && params?.tiers?.tiers) {
                        const tiers = params.tiers.tiers;
                        scenarioConfig.tierPricing = {};
                        tiers.forEach((tier: number) => {
                            scenarioConfig.tierPricing[tier] = {
                                costPrice: defaultCostPrice,
                                profitMargin: defaultMargin,
                            };
                        });
                    }

                    baseConfig.providers[providerKey].scenarios[scenarioName] = scenarioConfig;
                }
            });

            // 保存更新后的 pricing config 到数据库
            await savePricingConfigToDB(baseConfig);
            clearPricingConfigCache();

            // 添加场景后直接返回，避免后续的 providers 处理逻辑覆盖新添加的场景
            // 注意：如果请求中还有 pricing 或 providers，它们会在后续逻辑中被处理，但会覆盖新添加的场景
            // 所以这里直接返回，确保新场景不会被覆盖
            return respData({
                message: 'Scenario added successfully and synced to all providers',
            });
        }

        // 如果更新已有场景，更新 costs 配置并同步更新所有 provider 的场景描述
        if (updateScenario) {
            const {
                name: scenarioName,
                type,
                description: scenarioDescription,
                url,
                credits,
                params,
                calculator,
                saveTaskToDb,
                mediaType,
                stepBasedPricing,
            } = updateScenario;

            if (!scenarioName) {
                return respErr('Scenario name is required');
            }
            if (!type) {
                return respErr('Scenario type is required');
            }

            const creditCostsConfigData = await getCreditCostsConfig();

            if (!creditCostsConfigData.costs?.[scenarioName]) {
                return respErr(`Scenario "${scenarioName}" does not exist`);
            }

            const updatedScenarioConfig: any = {
                ...(creditCostsConfigData.costs[scenarioName] || {}),
                type,
                description: scenarioDescription || scenarioName,
            };

            if (url) {
                updatedScenarioConfig.url = url;
            } else {
                delete updatedScenarioConfig.url;
            }

            // 保存 saveTaskToDb 到 creditCostsConfigData（明确设置，即使是 false 也要保存）
            if (saveTaskToDb !== undefined) {
                updatedScenarioConfig.saveTaskToDb = saveTaskToDb;
            } else {
                // 如果没有提供，保持原有值或默认 true
                updatedScenarioConfig.saveTaskToDb = updatedScenarioConfig.saveTaskToDb !== undefined
                    ? updatedScenarioConfig.saveTaskToDb
                    : true;
            }

            // 保存 mediaType 到 creditCostsConfigData
            if (mediaType !== undefined) {
                updatedScenarioConfig.mediaType = mediaType;
            } else {
                // 如果没有提供，保持原有值或默认 image
                updatedScenarioConfig.mediaType = updatedScenarioConfig.mediaType || 'image';
            }

            if (type === 'fixed') {
                if (typeof credits !== 'number' || credits <= 0) {
                    return respErr('Fixed scenario requires valid credits');
                }
                updatedScenarioConfig.credits = credits;
                delete updatedScenarioConfig.calculator;
                delete updatedScenarioConfig.params;
                delete updatedScenarioConfig.stepBasedPricing;
            } else if (type === 'dynamic') {
                delete updatedScenarioConfig.credits;
                if (calculator) {
                    updatedScenarioConfig.calculator = calculator;
                } else {
                    delete updatedScenarioConfig.calculator;
                }
                if (params) {
                    updatedScenarioConfig.params = params;
                } else {
                    delete updatedScenarioConfig.params;
                }
                if (stepBasedPricing) {
                    updatedScenarioConfig.stepBasedPricing = stepBasedPricing;
                } else if (calculator !== 'step-based') {
                    delete updatedScenarioConfig.stepBasedPricing;
                }
            }

            creditCostsConfigData.costs[scenarioName] = updatedScenarioConfig;
            await saveCreditCostsConfigToDB(creditCostsConfigData);
            clearCreditCostsConfigCache();

            // 同步更新所有 provider 的场景描述（保持 admin 页面一致）
            Object.keys(baseConfig.providers).forEach((providerKey) => {
                const p = baseConfig.providers[providerKey];
                if (p?.scenarios?.[scenarioName]) {
                    p.scenarios[scenarioName].description = scenarioDescription || scenarioName;
                }
            });
        }

        // 构建更新后的配置
        // 注意：如果添加了新 provider，baseConfig.providers 已经包含了新 provider
        let updatedProviders = { ...baseConfig.providers };

        // 如果 providers 是数组格式（从前端发送），转换为对象格式
        if (providers && Array.isArray(providers)) {
            providers.forEach((provider: any) => {
                // 找到对应的 provider key（通过 name 匹配）
                const providerKey = Object.keys(baseConfig.providers).find(
                    (key) => baseConfig.providers[key].name === provider.name
                ) || provider.name.toLowerCase().replace(/\s+/g, '-');

                const scenarios: Record<string, any> = {};

                // 转换 scenarios 数组为对象，并处理参数组合
                provider.scenarios?.forEach((scenario: any) => {
                    // 复制所有场景配置字段，包括 API 配置
                    const scenarioConfig: any = {
                        costPrice: scenario.costPrice,
                        profitMargin: scenario.profitMargin,
                        description: scenario.description,
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
                        // 最小时长积分计算字段
                        minDuration: scenario.minDuration,
                        minDurationCredits: scenario.minDurationCredits,
                        creditsPerSecond: scenario.creditsPerSecond,
                        // 尺寸归一化配置
                        normalizeSizeToX: scenario.normalizeSizeToX,
                        // 请求体模板
                        requestBodyTemplate: scenario.requestBodyTemplate,
                        // 层级定价配置
                        tierPricing: scenario.tierPricing,
                    };

                    // 移除 undefined 值
                    Object.keys(scenarioConfig).forEach(key => {
                        if (scenarioConfig[key] === undefined) {
                            delete scenarioConfig[key];
                        }
                    });

                    // 如果有参数组合，转换为 paramCombinations 对象
                    if (scenario.paramCombinations && Array.isArray(scenario.paramCombinations)) {
                        scenarioConfig.paramCombinations = {};
                        scenario.paramCombinations.forEach((paramComb: any) => {
                            scenarioConfig.paramCombinations[paramComb.key] = {
                                costPrice: paramComb.costPrice,
                                profitMargin: paramComb.profitMargin,
                                description: paramComb.description,
                                costPerSecond: paramComb.costPerSecond,
                                costPer5Seconds: paramComb.costPer5Seconds,
                                // API 配置字段
                                apiEndpoint: paramComb.apiEndpoint,
                                requestParams: paramComb.requestParams,
                                responseMapping: paramComb.responseMapping,
                                statusQueryEndpoint: paramComb.statusQueryEndpoint,
                                statusQueryParams: paramComb.statusQueryParams,
                                statusQueryResponseMapping: paramComb.statusQueryResponseMapping,
                                webhookConfig: paramComb.webhookConfig,
                                // 请求体模板
                                requestBodyTemplate: paramComb.requestBodyTemplate,
                                // 最小时长积分计算字段
                                minDuration: paramComb.minDuration,
                                minDurationCredits: paramComb.minDurationCredits,
                                creditsPerSecond: paramComb.creditsPerSecond,
                            };
                        });
                    }

                    scenarios[scenario.name] = scenarioConfig;
                });

                // 构建完整的 provider 配置，保留所有字段
                const providerConfig: any = {
                    name: provider.name,
                    description: provider.description,
                    scenarios,
                };

                // 添加所有 provider 级别的 API 配置字段（如果存在）
                if (provider.resultMode !== undefined) providerConfig.resultMode = provider.resultMode;
                if (provider.baseUrl !== undefined) providerConfig.baseUrl = provider.baseUrl;
                if (provider.apiEndpoint !== undefined) providerConfig.apiEndpoint = provider.apiEndpoint;
                if (provider.apiKey !== undefined) providerConfig.apiKey = provider.apiKey;
                if (provider.timeout !== undefined) providerConfig.timeout = provider.timeout;
                if (provider.defaultHeaders !== undefined) providerConfig.defaultHeaders = provider.defaultHeaders;
                // Provider 级别的主请求配置
                if (provider.requestParams !== undefined) providerConfig.requestParams = provider.requestParams;
                if (provider.responseMapping !== undefined) providerConfig.responseMapping = provider.responseMapping;
                // Provider 级别的状态查询配置
                if (provider.statusQueryEndpoint !== undefined) providerConfig.statusQueryEndpoint = provider.statusQueryEndpoint;
                if (provider.statusQueryParams !== undefined) providerConfig.statusQueryParams = provider.statusQueryParams;
                if (provider.statusQueryResponseMapping !== undefined) providerConfig.statusQueryResponseMapping = provider.statusQueryResponseMapping;
                if (provider.webhookConfig !== undefined) providerConfig.webhookConfig = provider.webhookConfig;

                updatedProviders[providerKey] = providerConfig;
            });
        } else if (providers && typeof providers === 'object') {
            // 如果已经是对象格式，直接合并
            updatedProviders = {
                ...baseConfig.providers,
                ...providers,
            };
        }

        const updatedConfig: any = {
            pricing: pricing
                ? {
                    ...baseConfig.pricing,
                    ...pricing,
                }
                : baseConfig.pricing,
            providers: updatedProviders,
        };

        // 重新计算所有场景的积分消耗（用于更新数据库中的固定积分值）
        const pricingConfig = updatedConfig.pricing;
        const providersConfig = updatedConfig.providers;

        if (pricing || providers) {
            Object.entries(providersConfig).forEach(([providerName, provider]: [string, any]) => {
                Object.entries(provider.scenarios || {}).forEach(([scenarioName, scenario]: [string, any]) => {
                    const margin = scenario.profitMargin ?? pricingConfig.defaultProfitMargin;
                    const sellingPrice = calculateSellingPrice(scenario.costPrice, margin);
                    const credits = calculateCreditsFromPrice(sellingPrice, pricingConfig.creditUnitPrice);

                    // 注意：这里不更新数据库中的固定积分值，因为积分计算逻辑已经改为从价格配置动态计算
                    // 如果需要更新数据库中的固定积分值，可以在这里添加逻辑
                });
            });
        }

        // 保存到数据库
        await savePricingConfigToDB(updatedConfig);

        // 清除缓存，确保下次读取时获取最新数据
        clearPricingConfigCache();

        // 调试日志：打印保存的配置结构
        console.log('[PricingConfig] Saved config structure:', {
            providers: Object.keys(updatedConfig.providers),
            providerDetails: Object.entries(updatedConfig.providers).map(([key, provider]: [string, any]) => ({
                key,
                name: provider.name,
                hasApiKey: !!provider.apiKey,
                hasBaseUrl: !!provider.baseUrl,
                scenariosCount: Object.keys(provider.scenarios || {}).length,
                firstScenario: Object.keys(provider.scenarios || {})[0] ? {
                    name: Object.keys(provider.scenarios || {})[0],
                    hasApiEndpoint: !!provider.scenarios[Object.keys(provider.scenarios || {})[0]]?.apiEndpoint,
                    hasRequestParams: !!provider.scenarios[Object.keys(provider.scenarios || {})[0]]?.requestParams,
                } : null,
            })),
        });

        return respData({
            message: 'Pricing configuration updated successfully',
            config: updatedConfig,
        });
    } catch (e: any) {
        console.error('Failed to update pricing config:', e);
        return respErr(e.message || 'Failed to update pricing config');
    }
}
