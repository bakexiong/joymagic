# 提案：添加层级计费方式

## 概述

在 admin pricing 页面实现一个新的层级计费（tier-based）计算方式，允许管理员为场景配置多个层级阈值，系统根据实际数值自动向上取整到最近的层级进行计费。

## 背景

当前系统支持多种计费方式：
- `fixed`: 固定积分
- `per-layer`: 按层数计费（如 qwen-image-layered）
- `duration-based`: 按时长计费（按秒）
- `duration-block`: 按时长块计费（按5秒块）
- `duration-block-resolved`: 按时长块计费（已解析）
- `seedance-duration`: Seedance 时长计费
- `gpt-image-1`: GPT Image 1 计费

但目前缺少一种通用的层级计费方式，无法满足以下需求：
- 当实际值小于最小层级时，按最小层级计费
- 当实际值在两个层级之间时，按较大的层级计费
- 当实际值超过最大层级时，按最大层级计费

## 目标

1. 添加新的计算器类型 `tier-based`，支持层级计费
2. 在场景配置中支持自定义层级列表（如 [5, 10, 15, 30]）
3. 在 provider 中为每个层级配置独立的成本、利润率和 API 配置
4. 前端 admin pricing 页面支持层级的添加、编辑和删除
5. 计费逻辑自动根据实际值匹配到对应的层级

## 用例

### 示例 1：图像生成按层级计费

场景：某个图像生成 API 按生成数量计费，配置层级为 [5, 10, 15, 30]

- 用户生成 3 张图片 → 按 5 张计费
- 用户生成 7 张图片 → 按 10 张计费
- 用户生成 12 张图片 → 按 15 张计费
- 用户生成 20 张图片 → 按 30 张计费
- 用户生成 35 张图片 → 按 30 张计费（最大层级）

### 示例 2：视频时长按层级计费

场景：某个视频生成 API 按时长计费，配置层级为 [5, 10, 15, 30]（秒）

- 用户生成 3 秒视频 → 按 5 秒计费
- 用户生成 8 秒视频 → 按 10 秒计费
- 用户生成 18 秒视频 → 按 30 秒计费

## 实现范围

### 1. 后端实现

#### 1.1 添加新的计算器类型
- 在 `CreditCalculator` 类型中添加 `tier-based`
- 实现 `calculateTierBasedCredits` 函数

#### 1.2 场景配置支持
- 在场景配置的 `params` 中支持 `tiers` 参数
- `tiers` 参数格式：
  ```typescript
  {
    paramName: string;  // 需要按层级计费的参数名（如 'num_images', 'duration'）
    tiers: number[];    // 层级列表（如 [5, 10, 15, 30]）
    min?: number;       // 最小值（可选）
    max?: number;       // 最大值（可选）
  }
  ```

#### 1.3 Provider 层级配置
- 在 provider 的场景配置中支持 `tierPricing` 字段
- `tierPricing` 格式：
  ```typescript
  {
    [tier: number]: {
      costPrice: number;
      profitMargin?: number;
      apiEndpoint?: string;
      requestParams?: any[];
      responseMapping?: any;
      statusQueryEndpoint?: string;
      statusQueryParams?: any[];
      statusQueryResponseMapping?: any;
    }
  }
  ```

### 2. 前端实现

#### 2.1 场景配置界面
- 在添加/编辑场景时，如果选择 `tier-based` 计算器，显示层级配置界面
- 支持添加层级参数名称
- 支持添加/删除层级值
- 支持设置最小值和最大值

#### 2.2 Provider 层级定价界面
- 在 provider 的场景配置中，如果场景使用 `tier-based` 计算器，显示层级定价表格
- 每个层级显示一行，包含：
  - 层级值
  - 成本价格
  - 利润率
  - API 配置（可选）
- 支持批量编辑和单独编辑

### 3. 数据库 Schema
- 无需修改数据库 schema，使用现有的 JSON 字段存储配置

## 技术决策

### 层级匹配算法

```typescript
function findMatchingTier(value: number, tiers: number[]): number {
  // 排序层级（从小到大）
  const sortedTiers = [...tiers].sort((a, b) => a - b);

  // 如果值小于最小层级，返回最小层级
  if (value <= sortedTiers[0]) {
    return sortedTiers[0];
  }

  // 如果值大于最大层级，返回最大层级
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
```

### 积分计算逻辑

1. 从请求参数中获取需要计费的参数值（如 `num_images`）
2. 使用层级匹配算法找到对应的层级
3. 从 provider 的 `tierPricing` 配置中获取该层级的定价信息
4. 使用 `calculateCreditsFromCost` 计算积分

## 非目标

- 不支持多个参数同时按层级计费（如果需要，可以在后续迭代中添加）
- 不支持层级之间的线性插值计费
- 不支持动态层级（层级必须在配置时确定）

## 风险和缓解

### 风险 1：层级配置错误
- **风险**：管理员配置层级时可能出错（如层级不连续、重复等）
- **缓解**：前端添加验证，确保层级列表有序且无重复

### 风险 2：向后兼容性
- **风险**：添加新的计算器类型可能影响现有场景
- **缓解**：新计算器类型仅在明确配置时使用，不影响现有场景

### 风险 3：性能影响
- **风险**：层级匹配算法可能影响性能
- **缓解**：层级列表通常很小（< 10 个），性能影响可忽略

## 验收标准

1. 管理员可以在场景配置中选择 `tier-based` 计算器
2. 管理员可以为场景配置层级参数和层级列表
3. 管理员可以在 provider 中为每个层级配置成本和利润率
4. 系统能够根据实际参数值正确匹配到对应的层级
5. 系统能够根据层级配置正确计算积分
6. 前端界面友好，支持层级的添加、编辑和删除
7. 所有配置能够正确保存到数据库并在重启后恢复

## 时间线

本提案不包含时间估算，具体实施时间由开发团队评估。

## 参考

- 现有计算器实现：`src/config/credit-config.ts`
- Pricing 配置：`src/config/pricing-config.ts`
- Admin Pricing 页面：`src/app/[locale]/(admin)/admin/pricing/page.tsx`
