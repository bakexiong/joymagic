## 上下文

项目当前同时存在多种动态计费模型：

- `duration-based`：按秒计费
- `duration-block`：旧版按块计费
- `duration-block-resolved`：按 5 秒块计费，并与特定 pricing 展示逻辑耦合
- `tier-based`：按预定义层级向上取整计费
- `param-combination-pricing`：按参数组合定价

其中 `duration-block-resolved` 可以满足“5 秒一块”的后端扣费，但它在管理端仍然以参数组合方式展示，导致配置者会看到 `duration: 5/6/7/8/9` 这类不符合“按步长块”心智的配置项。

## 目标

- 新增一个独立、通用的 `step-based` 计费方式
- 支持配置任意步长，而不局限于 5 秒
- 让管理端为该计费模型提供单独 UI
- 保持 `duration-block-resolved` 完全兼容，不迁移旧数据

## 非目标

- 不重构现有 `duration-block-resolved` 数据结构
- 不自动迁移历史 pricing 数据
- 不改变现有 `param-combination-pricing` 的行为

## 方案

### 1. 新增计算器类型

在共享类型和后端逻辑中增加：

- `step-based`

该类型用于表达“按某个数值参数，基于步长向上取整计费”。

### 2. 新增配置结构

为场景或参数组合增加独立的步长计费配置，建议包含：

- `paramName`: 需要计费的参数名，例如 `duration`
- `stepSize`: 每一步的大小，例如 `5`
- `costPerStep`: 每一步的成本价格（USD）
- `minSteps`: 可选，最少按多少步计费

示例：

```json
{
  "paramName": "duration",
  "stepSize": 5,
  "costPerStep": 0.01,
  "minSteps": 1
}
```

### 3. 计费规则

对输入值 `actualValue`：

1. 读取 `paramName`
2. 用 `stepSize` 向上取整为步数
3. 若配置了 `minSteps`，取 `max(calculatedSteps, minSteps)`
4. 总成本 = `steps * costPerStep`
5. 统一走已有 `calculateCreditsFromCost(...)`

### 4. 管理端 UI

`step-based` 场景不再显示“参数组合价格表”，而显示独立表单：

- 计费参数名
- 步长
- 每步成本
- 最少计费步数
- 利润率

如果该场景同时有 API 配置，仍沿用现有场景级 API 配置编辑，不额外引入参数组合 UI。

## 风险与兼容性

### 风险

- 管理端如果错误地将 `step-based` 仍归类到参数组合 UI，会继续出现配置歧义
- 估算接口和真实扣费若使用不同入口，会造成积分显示与实际扣费不一致

### 兼容性策略

- 不改动 `duration-block-resolved`
- 新能力完全通过新计算器类型启用
- 旧场景数据不需要迁移
