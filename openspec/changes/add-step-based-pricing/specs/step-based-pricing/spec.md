# step-based-pricing 规范

## 新增需求

### 需求：通用按步长计费计算器

系统必须提供独立的 `step-based` 计费计算器，用于对指定数值参数按固定步长向上取整计费。

#### 场景：实际值小于一个步长

- **当** 场景使用 `step-based` 计算器
- **并且** `paramName=duration`、`stepSize=5`、`costPerStep=0.01`
- **并且** 请求参数 `duration=3`
- **那么** 系统必须按 1 个步长计费

#### 场景：实际值跨越多个步长

- **当** 场景使用 `step-based` 计算器
- **并且** `paramName=duration`、`stepSize=5`、`costPerStep=0.01`
- **并且** 请求参数 `duration=12`
- **那么** 系统必须按 3 个步长计费

#### 场景：配置最少计费步数

- **当** 场景使用 `step-based` 计算器
- **并且** `paramName=duration`、`stepSize=5`、`costPerStep=0.01`、`minSteps=2`
- **并且** 请求参数 `duration=3`
- **那么** 系统必须按 2 个步长计费

### 需求：统一积分估算与真实扣费

系统必须让 `/api/ai/estimate-credits` 与真实生成扣费逻辑使用同一套 `step-based` 计费规则。

#### 场景：积分估算与实际扣费一致

- **当** 前端调用 `/api/ai/estimate-credits`
- **并且** 场景使用 `step-based` 计算器
- **那么** 返回积分必须与真实生成时的扣费结果一致

### 需求：管理端独立配置 UI

系统必须在 admin pricing 页面为 `step-based` 提供独立配置界面，不得复用参数组合价格表。

#### 场景：管理员配置 step-based 场景

- **当** 管理员在 pricing 页面选择 `step-based` 计算器
- **那么** 页面必须显示步长计费专用配置项
- **并且** 页面不得显示参数组合价格表

### 需求：保留 duration-block-resolved 兼容性

系统必须保留现有 `duration-block-resolved` 的配置和行为，不得因为新增 `step-based` 而改变旧场景的计算结果或管理端展示。

#### 场景：旧场景继续使用 duration-block-resolved

- **当** 已有场景继续配置为 `duration-block-resolved`
- **那么** 系统必须继续按旧逻辑计算
- **并且** 管理端必须继续按旧方式展示
