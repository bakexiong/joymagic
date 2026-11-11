/**
 * 初始化 PixVerse 视频生成场景的配置和价格
 * 这是通用参数组合定价系统的首个应用示例
 */

import { db } from '@/core/db';
import { config } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

const CREDIT_COSTS_CONFIG_KEY = 'credit_costs_config';
const PRICING_CONFIG_KEY = 'pricing_config';

async function initPixVersePricing() {
    console.log('开始初始化 PixVerse 场景配置...');

    // 1. 添加场景配置到 credit_costs_config
    const [creditCostsRecord] = await db()
        .select()
        .from(config)
        .where(eq(config.name, CREDIT_COSTS_CONFIG_KEY))
        .limit(1);

    if (!creditCostsRecord || !creditCostsRecord.value) {
        console.error('未找到 credit_costs_config，请先初始化基础配置');
        return;
    }

    const creditCostsConfig = JSON.parse(creditCostsRecord.value);

    // 添加 PixVerse 场景配置
    creditCostsConfig.costs['pixverse-video'] = {
        type: 'dynamic',
        description: 'PixVerse 视频生成',
        calculator: 'param-combination-pricing',
        params: {
            resolution: {
                type: 'string',
                validValues: ['360p', '540p', '720p', '1080p'],
                default: '720p',
                displayName: '分辨率'
            },
            duration: {
                type: 'number',
                validValues: [5, 8, 10],
                default: 5,
                displayName: '时长（秒）'
            },
            generate_audio: {
                type: 'boolean',
                default: false,
                displayName: '生成音频'
            }
        },
        uiLayout: {
            type: 'matrix',
            rows: 'resolution',
            columns: 'duration',
            cells: 'generate_audio'
        },
        unsupportedCombinations: [
            'duration=10&resolution=1080p' // 1080p 不支持 10 秒
        ],
        mediaType: 'video',
        saveTaskToDb: true
    };

    // 保存更新后的配置
    await db()
        .update(config)
        .set({ value: JSON.stringify(creditCostsConfig) })
        .where(eq(config.name, CREDIT_COSTS_CONFIG_KEY));

    console.log('✓ PixVerse 场景配置已添加');

    // 2. 添加价格配置到 pricing_config
    const [pricingRecord] = await db()
        .select()
        .from(config)
        .where(eq(config.name, PRICING_CONFIG_KEY))
        .limit(1);

    if (!pricingRecord || !pricingRecord.value) {
        console.error('未找到 pricing_config，请先初始化基础配置');
        return;
    }

    const pricingConfig = JSON.parse(pricingRecord.value);

    // 确保 wavespeed provider 存在
    if (!pricingConfig.providers.wavespeed) {
        pricingConfig.providers.wavespeed = {
            name: 'WaveSpeed',
            description: 'WaveSpeed AI Provider',
            scenarios: {}
        };
    }

    // 添加 PixVerse 场景的价格配置
    // 基础价格（仅视频）
    const basePrices: Record<string, Record<number, number>> = {
        '360p': { 5: 0.35, 8: 0.70, 10: 0.77 },
        '540p': { 5: 0.35, 8: 0.70, 10: 0.77 },
        '720p': { 5: 0.45, 8: 0.90, 10: 0.99 },
        '1080p': { 5: 0.75, 8: 1.50 } // 1080p 不支持 10 秒
    };

    // 音频附加费
    const audioAddons: Record<string, Record<number, number>> = {
        '360p': { 5: 0.45, 8: 0.45, 10: 0.45 },
        '540p': { 5: 0.45, 8: 0.45, 10: 0.45 },
        '720p': { 5: 0.35, 8: 0.45, 10: 0.45 },
        '1080p': { 5: 0.75, 8: 0.45 }
    };

    // 生成所有参数组合的价格配置
    const paramCombinations: Record<string, any> = {};
    const resolutions = ['360p', '540p', '720p', '1080p'];
    const durations = [5, 8, 10];
    const audioOptions = [false, true];

    for (const resolution of resolutions) {
        for (const duration of durations) {
            // 跳过不支持的组合
            if (resolution === '1080p' && duration === 10) {
                continue;
            }

            for (const generateAudio of audioOptions) {
                // 生成参数组合 key（按字母顺序）
                const key = `duration=${duration}&generate_audio=${generateAudio}&resolution=${resolution}`;

                // 计算成本价格
                const basePrice = basePrices[resolution][duration];
                const audioAddon = generateAudio ? (audioAddons[resolution][duration] || 0) : 0;
                const costPrice = basePrice + audioAddon;

                paramCombinations[key] = {
                    costPrice,
                    profitMargin: 0.3, // 默认 30% 利润率
                    description: `${resolution} ${duration}秒 ${generateAudio ? '有音频' : '无音频'}`
                };
            }
        }
    }

    pricingConfig.providers.wavespeed.scenarios['pixverse-video'] = {
        costPrice: 0.45, // 默认价格（720p, 5秒, 无音频）
        profitMargin: 0.3,
        description: 'PixVerse 视频生成',
        paramCombinations
    };

    // 保存更新后的配置
    await db()
        .update(config)
        .set({ value: JSON.stringify(pricingConfig) })
        .where(eq(config.name, PRICING_CONFIG_KEY));

    console.log(`✓ PixVerse 价格配置已添加（${Object.keys(paramCombinations).length} 个参数组合）`);
    console.log('\n初始化完成！');
    console.log('\n参数组合列表：');
    Object.keys(paramCombinations).forEach(key => {
        console.log(`  - ${key}: $${paramCombinations[key].costPrice}`);
    });
}

// 执行初始化
initPixVersePricing()
    .then(() => {
        console.log('\n✓ 初始化成功');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ 初始化失败:', error);
        process.exit(1);
    });
