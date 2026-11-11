# 变更：升级 AI Girlfriend 素材矩阵为基于 Ethnicity 的全排列体系

## 为什么
当前 `/ai-girl` 的真人素材链路以单一 base profile 或单轴组合为主，导致不同维度之间存在错位。例如 `Hair Style × Hair Color` 如果不以对应人种与对应发型底图为输入，生成结果会偏离真实目标，出现“选的是编发，结果还是波浪发”的问题。

随着 `Ethnicity` 被定义为角色基础维度，现有素材体系已经不足以支撑稳定的真人预览。需要将素材生成、索引和页面读取全面升级为“先确定 Ethnicity，再生成和读取所有其他维度组合”的矩阵方案。

## 变更内容
- 将 `Ethnicity` 升级为所有真人素材的基础维度
- 将所有维度素材升级为基于 `Ethnicity` 的组合素材
- 将 `Hair Color` 组合素材升级为 `Ethnicity × Hair Style × Hair Color`
- 将 `Skin / Eyes / Body / Vibe / Age / Makeup / Accessories / Lips / Hair` 等维度统一纳入基于 `Ethnicity` 的组合素材体系
- 更新素材索引结构，使页面可以基于 `ethnicity + section + variant` 精准取图
- 更新批处理脚本，使组合素材自动选择正确的输入底图

## 影响
- 受影响规范：新增 `ai-girlfriend-material-matrix`
- 受影响代码：
  - `scripts/ai-girlfriend-prompt-pack.json`
  - `scripts/generate-ai-girlfriend-prompt-batch.ts`
  - `scripts/run-ai-girlfriend-material-batch.ts`
  - `scripts/build-ai-girlfriend-asset-index.ts`
  - `src/shared/lib/ai-girlfriend-assets.json`
  - `src/shared/blocks/ai-character/ai-character-page.tsx`

## 风险与规模
- 素材数量会从单轴组合快速膨胀为全排列矩阵
- 需要支持分批生成与断点续跑，否则一次性生成量会过大
- 需要确保页面读取逻辑与素材 key 完全一致，否则会出现“素材已生成但页面没命中”的问题
