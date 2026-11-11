/**
 * 测试通用参数组合定价系统
 */

import {
    generateParamCombinationKey,
    isUnsupportedCombination,
} from '@/config/credit-config';

console.log('=== 测试参数组合 key 生成 ===\n');

// 测试 1: 基本参数组合
const params1 = {
    resolution: '720p',
    duration: 5,
    generate_audio: false
};
const key1 = generateParamCombinationKey(params1);
console.log('参数:', params1);
console.log('生成的 key:', key1);
console.log('预期:', 'duration=5&generate_audio=false&resolution=720p');
console.log('✓ 通过:', key1 === 'duration=5&generate_audio=false&resolution=720p');
console.log();

// 测试 2: 不同顺序的参数应该生成相同的 key
const params2 = {
    generate_audio: false,
    resolution: '720p',
    duration: 5
};
const key2 = generateParamCombinationKey(params2);
console.log('参数（不同顺序）:', params2);
console.log('生成的 key:', key2);
console.log('✓ 通过:', key1 === key2);
console.log();

// 测试 3: 有音频的组合
const params3 = {
    resolution: '1080p',
    duration: 8,
    generate_audio: true
};
const key3 = generateParamCombinationKey(params3);
console.log('参数:', params3);
console.log('生成的 key:', key3);
console.log('预期:', 'duration=8&generate_audio=true&resolution=1080p');
console.log('✓ 通过:', key3 === 'duration=8&generate_audio=true&resolution=1080p');
console.log();

console.log('=== 测试不支持组合检查 ===\n');

const unsupportedCombinations = ['duration=10&resolution=1080p'];

// 测试 4: 不支持的组合
const key4 = 'duration=10&generate_audio=false&resolution=1080p';
const isUnsupported4 = isUnsupportedCombination(unsupportedCombinations, key4);
console.log('参数组合 key:', key4);
console.log('是否不支持:', isUnsupported4);
console.log('✓ 通过:', isUnsupported4 === true);
console.log();

// 测试 5: 支持的组合
const key5 = 'duration=8&generate_audio=false&resolution=1080p';
const isUnsupported5 = isUnsupportedCombination(unsupportedCombinations, key5);
console.log('参数组合 key:', key5);
console.log('是否不支持:', isUnsupported5);
console.log('✓ 通过:', isUnsupported5 === false);
console.log();

// 测试 6: 1080p + 10秒 + 有音频（也应该不支持）
const key6 = 'duration=10&generate_audio=true&resolution=1080p';
const isUnsupported6 = isUnsupportedCombination(unsupportedCombinations, key6);
console.log('参数组合 key:', key6);
console.log('是否不支持:', isUnsupported6);
console.log('✓ 通过:', isUnsupported6 === true);
console.log();

console.log('=== 所有测试完成 ===');
