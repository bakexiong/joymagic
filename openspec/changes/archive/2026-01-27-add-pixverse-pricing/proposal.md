# 提案：添加通用参数组合定价系统

## 概述

在 admin pricing 页面实现通用的参数组合定价系统，支持基于多个参数（如分辨率、时长、音频等）组合的灵活定价方式。该系统可以被多个 AI 模型服务复用。

## 背景

许多 AI 视频/图像生成服务的计费方式不是单一维度的，而是基于多个参数的组合。例如：

**PixVerse 视频生成**：
1. **分辨率（Resolution）**：360p、540p、720p、1080p
2. **时长（Duration）**：5秒、8秒、10秒（固定值）
3. **音频（Audio）**：是否启用音频生成

**其他潜在场景**：
- 图像生成：分辨率 × 质量等级 × 风格类型
- 视频生成：分辨率 × 时长 × 帧率
- 音频生成：时长 × 质量 × 语言

当前系统的 `duration-based`、`per-layer` 等计算器都是针对特定场景的，缺少一个通用的参数组合定价机制。

## 目标

1. 实现通用的参数组合定价计算器（`param-combination-pricing`）
2. 支持任意参数的组合定价配置
3. Admin UI 能够根据参数定义动态生成配置界面
4. 首个应用场景：PixVerse 视频生成
5. 为未来其他需要组合定价的服务提供可复用的基础设施

## 核心概念

### 参数组合定价（Param Combination Pricing）

**定义**：根据多个参数的不同组合，为每个组合设置独立的价格。

**特点**：
- 支持任意数量的参数
- 每个参数可以有不同的类型（字符串、数字、布尔）
- 每个参数可以有固定的有效值列表
- 某些组合可以标记为不支持

**示例：PixVerse 价格表**

基础价格（仅视频）：

| 分辨率 | 5秒 | 8秒 | 10秒 |
|--------|-----|-----|------|
| 360p   | $0.35 | $0.70 | $0.77 |
| 540p   | $0.35 | $0.70 | $0.77 |
| 720p   | $0.45 | $0.90 | $0.99 |
| 1080p  | $0.75 | $1.50 | — |

音频附加费（当 generate_audio 启用时）：

| 分辨率 | 5秒 | 8秒 | 10秒 |
|--------|-----|-----|------|
| 360p/540p | +$0.45 | +$0.45 | +$0.45 |
| 720p   | +$0.35 | +$0.45 | +$0.45 |
| 1080p  | +$0.75 | +$0.45 | — |

## 实现方案

### 1. 通用计算器类型

添加新的计算器类型 `param-combination-pricing`：

```typescript
type CreditCalculator =
  | 'gpt-image-1'
  | 'per-layer'
  | 'duration-based'
  | 'tier-based'
  | 'param-combination-pricing'; // 新增
```

**特性**：
- 支持任意参数组合
- 自动生成参数组合 key
- 查找对应的价格配置
- 支持不支持的组合（返回错误或使用默认价格）

### 2. 场景配置（以 PixVerse 为例）

在 `credit-config.ts` 中添加场景：

```typescript
'pixverse-video': {
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
      displayName: '时长'
    },
    generate_audio: {
      type: 'boolean',
      default: false,
      displayName: '音频'
    }
  },
  // 定义 UI 展示方式（可选）
  uiLayout: {
    type: 'matrix', // 矩阵表格
    rows: 'resolution', // 行参数
    columns: 'duration', // 列参数
    cells: 'generate_audio' // 单元格内的参数（布尔值显示为两行）
  },
  // 不支持的组合
  unsupportedCombinations: [
    'duration=10&resolution=1080p' // 1080p 不支持 10 秒
  ],
  mediaType: 'video'
}
```

### 3. 参数组合配置

在 pricing 配置中，为每个参数组合设置价格：

```typescript
paramCombinations: {
  'duration=5&generate_audio=false&resolution=360p': { costPrice: 0.35 },
  'duration=5&generate_audio=false&resolution=540p': { costPrice: 0.35 },
  'duration=5&generate_audio=false&resolution=720p': { costPrice: 0.45 },
  'duration=5&generate_audio=false&resolution=1080p': { costPrice: 0.75 },
  'duration=5&generate_audio=true&resolution=360p': { costPrice: 0.80 },
  // ... 其他组合
}
```

### 4. 通用 Admin UI

Admin UI 根据场景配置动态生成界面：

**矩阵表格模式**（适用于 2-3 个参数）：
- 根据 `uiLayout` 配置自动生成表格
- 行和列由参数定义
- 单元格内显示其他参数的价格
- 自动标记不支持的组合

**列表模式**（适用于 4+ 个参数）：
- 显示所有参数组合的列表
- 每行一个组合，显示参数值和价格
- 支持搜索和过滤

### 5. 计算逻辑

```typescript
// 伪代码
function calculateCreditsForParamCombination(
  scenarioName: string,
  params: Record<string, any>
): number {
  // 1. 获取场景配置
  const scenario = getScenario(scenarioName);

  // 2. 检查是否为不支持的组合
  if (isUnsupportedCombination(scenario, params)) {
    throw new Error('Unsupported parameter combination');
  }

  // 3. 生成参数组合 key
  const key = generateParamCombinationKey(params);

  // 4. 查找价格配置
  const pricing = getPricingForCombination(scenarioName, key);

  // 5. 计算积分
  return calculateCreditsFromCost(
    pricing.costPrice,
    pricing.profitMargin
  );
}
```

## 扩展性设计

### 未来可支持的场景

1. **图像生成服务**：
```typescript
'service-x-image': {
  calculator: 'param-combination-pricing',
  params: {
    resolution: { validValues: ['512x512', '1024x1024', '2048x2048'] },
    quality: { validValues: ['standard', 'hd', 'ultra'] },
    style: { validValues: ['realistic', 'anime', 'abstract'] }
  },
  uiLayout: { type: 'matrix', rows: 'resolution', columns: 'quality', cells: 'style' }
}
```

2. **音频生成服务**：
```typescript
'service-y-audio': {
  calculator: 'param-combination-pricing',
  params: {
    duration: { validValues: [30, 60, 120, 300] },
    quality: { validValues: ['standard', 'premium'] },
    language: { validValues: ['en', 'zh', 'ja'] }
  },
  uiLayout: { type: 'list' } // 参数较多，使用列表模式
}
```

### UI 布局类型

- **matrix**：2D 表格，适合 2-3 个参数
- **list**：列表视图，适合 4+ 个参数
- **custom**：自定义布局（未来扩展）

## 非目标

- 不支持参数的动态范围（如任意时长），仅支持固定的有效值列表
- 不支持参数之间的依赖关系（如"当 A=x 时，B 只能是 y"）
- 不改变现有其他场景的计费逻辑

## 风险与考虑

1. **参数组合爆炸**：
   - 3个参数可能产生几十个组合
   - 4个参数可能产生上百个组合
   - 缓解措施：提供批量设置工具，支持公式计算

2. **UI 复杂度**：
   - 需要根据参数数量选择合适的展示方式
   - 矩阵表格适合 2-3 个参数
   - 列表视图适合更多参数

3. **数据一致性**：
   - 确保所有必需的组合都有价格配置
   - 提供验证工具检查缺失的组合

4. **性能考虑**：
   - 参数组合查找需要高效
   - 考虑使用缓存机制

## 成功标准

1. **通用性**：
   - 计算器可以被任意场景复用
   - 不需要为每个新场景编写专门的计算逻辑

2. **易用性**：
   - Admin UI 根据参数定义自动生成配置界面
   - 管理员可以直观地配置所有价格组合

3. **正确性**：
   - 价格配置正确保存到数据库
   - 积分计算使用正确的参数组合价格
   - 不支持的组合正确处理

4. **可扩展性**：
   - 添加新场景只需配置，无需修改代码
   - 支持不同的 UI 布局方式

## 时间线

本提案不包含时间估算，具体实施时间由开发团队评估。
