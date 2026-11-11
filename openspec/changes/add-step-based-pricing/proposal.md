# 提案：新增通用按步长计费能力

## 为什么

当前系统已经支持 `duration-block`、`duration-block-resolved`、`tier-based`、`param-combination-pricing` 等多种计费方式，但“按 5 秒块计费”仍然和特定场景逻辑耦合较深，管理端也复用了参数组合 UI，导致配置体验和心智模型不一致。

我们需要新增一个独立的、通用的“按步长计费”能力，用于支持“每 N 秒/每 N 单位按块向上取整计费”的场景，同时不影响现有 `duration-block-resolved` 的行为和数据结构。

## 变更内容

- 新增独立的动态计费计算器类型：`step-based`
- 为 `pricing_config` 增加通用步长计费字段，用于描述：
  - 按哪个参数计费
  - 每步的长度
  - 每步的成本
  - 可选最小计费步数
- 管理端 pricing 页面为 `step-based` 提供独立配置 UI，不再复用参数组合列表展示
- `/api/ai/estimate-credits` 与真实生成扣费逻辑统一支持 `step-based`
- 保留现有 `duration-block-resolved` 逻辑、数据和 UI，不做兼容性破坏

## 影响

- 受影响规范：
  - `credit-estimation`
  - `api-routing`
  - 新增 `step-based-pricing`
- 受影响代码：
  - `src/shared/models/pricing-config.ts`
  - `src/config/credit-config.ts`
  - `src/config/pricing-config.ts`
  - `src/app/[locale]/(admin)/admin/pricing/page.tsx`
  - `src/app/api/admin/pricing/route.ts`
  - `src/app/api/ai/estimate-credits/route.ts`
  - 可能涉及使用 pricing 元数据的展示组件
