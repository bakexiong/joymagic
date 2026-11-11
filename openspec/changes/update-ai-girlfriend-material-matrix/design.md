## 上下文
当前 AI Girlfriend 真人素材体系已具备：
- `Ethnicity` 单独素材
- `Hair Style` 单独素材
- `Hair Style × Hair Color` 局部组合素材

但页面对“真实人像应保持人种、发型、发色一致”的要求越来越高，单一 base 图和单轴素材不再足够。

## 目标
- 让 `Ethnicity` 成为所有真人素材的基础维度
- 让所有 section 都基于对应 `Ethnicity` 生成与读取
- 让 `Hair Color` 等组合素材基于对应 `Ethnicity` 和对应 `Hair Style` 生成
- 让页面读取逻辑具备稳定命中多维组合素材的能力

## 非目标
- 忽略生成规模与批处理成本，直接无控制地全量生成

## 方案
### 1. 素材 key 设计
建议采用稳定的多维 key：

`ethnicityId__sectionId__variantId`

对于 `Hair Color` 这种组合项：

`ethnicityId__hairColor__hairStyleId__hairColorId`

### 2. 输入底图策略
- `Ethnicity` 负责决定基础真人底图
- `Hair Style` 负责提供局部结构稳定的发型底图
- `Hair Color` 组合项应优先使用 `Ethnicity + Hair Style` 对应的真人图作为输入

### 3. 全维度落地范围
所有真人素材都应以 `Ethnicity` 为基础维度，包括但不限于：
- `Ethnicity × Hair`
- `Ethnicity × Hair Style × Hair Color`
- `Ethnicity × Skin`
- `Ethnicity × Eyes`
- `Ethnicity × Lips`
- `Ethnicity × Body`
- `Ethnicity × Vibe`
- `Ethnicity × Age`
- `Ethnicity × Makeup`
- `Ethnicity × Accessories`

其中 `Hair Color` 由于依赖发型结构，必须以 `Ethnicity + Hair Style` 对应真人图作为输入底图。

### 4. 页面命中规则
页面预览优先级：
1. `Ethnicity + section + variant` 组合真人图
2. `Ethnicity + Hair Style` 真人图
3. 单独 `Ethnicity` 真人图
4. 最后才退回前端占位 avatar

## 风险
- 组合数量增长过快，可能导致生成成本和时间显著增加
- 不同维度组合之间如果底图链路不统一，仍会出现人物漂移
- 如果索引 key 设计不稳定，前端会出现大量“ready 但取不到”的问题
