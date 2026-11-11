/**
 * 初始化 Grok Imagine 图生图场景的积分与价格配置
 * 运行后需在管理后台将 grok-imagine-image 的 apiEndpoint 改为实际上游 API 地址
 */

import {
    getCreditCostsConfigFromDB,
    saveCreditCostsConfigToDB,
    getPricingConfigFromDB,
    savePricingConfigToDB,
} from '@/shared/models/pricing-config';

const SCENE = 'grok-imagine-image';

async function initGrokImagineImagePricing() {
    console.log('开始初始化 Grok Imagine 图生图场景配置...');

    // 1. 添加场景到 credit_costs_config
    const creditCostsConfig = await getCreditCostsConfigFromDB();
    if (!creditCostsConfig) {
        console.error('未找到 credit_costs_config，请先初始化基础配置');
        process.exit(1);
    }

    if (creditCostsConfig.costs[SCENE]) {
        console.log(`场景 ${SCENE} 已存在于 credit_costs_config，跳过`);
    } else {
        creditCostsConfig.costs[SCENE] = {
            type: 'fixed',
            credits: 2,
            description: 'Grok Imagine image-to-image 单图转换',
            mediaType: 'image',
            saveTaskToDb: true,
        };
        await saveCreditCostsConfigToDB(creditCostsConfig);
        console.log(`✓ 已在 credit_costs_config 中添加场景 ${SCENE}`);
    }

    // 2. 添加场景到 pricing_config（wavespeed provider 下）
    const pricingConfig = await getPricingConfigFromDB();
    if (!pricingConfig) {
        console.error('未找到 pricing_config，请先初始化基础配置');
        process.exit(1);
    }

    if (!pricingConfig.providers.wavespeed) {
        pricingConfig.providers.wavespeed = {
            name: 'WaveSpeed',
            description: 'WaveSpeed AI Provider',
            scenarios: {},
        };
    }

    if (pricingConfig.providers.wavespeed.scenarios[SCENE]) {
        console.log(`场景 ${SCENE} 已存在于 pricing_config，跳过`);
    } else {
        pricingConfig.providers.wavespeed.scenarios[SCENE] = {
            costPrice: 0.02,
            profitMargin: 0.3,
            description: 'Grok Imagine image-to-image generation',
            apiEndpoint: process.env.GROK_IMAGINE_IMAGE_API_URL || 'https://api.example.com/grok-imagine/image',
            requestParams: [
                { name: 'image', source: 'body', required: true, type: 'string' },
                { name: 'prompt', source: 'body', required: true, type: 'string' },
            ],
            responseMapping: {
                format: 'json',
                requestIdPath: 'data.id',
                outputPath: 'data.outputs[0]',
                errorPath: 'message',
                statusPath: 'data.status',
                successStatus: ['completed', 'success'],
                failureStatus: ['failed', 'error'],
            },
            statusQueryEndpoint: process.env.GROK_IMAGINE_STATUS_QUERY_URL || 'https://api.example.com/status',
            statusQueryResponseMapping: {
                format: 'json',
                statusPath: 'status',
                outputPath: 'output',
                successStatus: ['completed', 'success'],
                failureStatus: ['failed', 'error'],
            },
        };
        await savePricingConfigToDB(pricingConfig);
        console.log(`✓ 已在 pricing_config (wavespeed) 中添加场景 ${SCENE}`);
    }

    console.log('\n初始化完成。');
    console.log('请在管理后台将 grok-imagine-image 的 apiEndpoint 与 statusQueryEndpoint 改为实际上游 API 地址。');
}

initGrokImagineImagePricing()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('初始化失败:', err);
        process.exit(1);
    });
