# 变更：新增模型维度落地页模板

## 为什么

当前项目已有按场景/能力组织的 AI 页面与 `/creator` 工作台，但缺少按“模型”组织的落地页入口。现有实现只接入了少数示例模型，无法覆盖站内已注册的大部分模型能力。用户现在要求“给现在所有的模型都增加一个落地页”，因此需要把模型页从示例能力升级为可覆盖全部已注册模型的通用能力。

## 变更内容

- 新增 `/model/[slug]` 动态路由，用于承载模型维度落地页
- 新增可复用的 model landing 数据层与页面模板
- 模型页数据层需要覆盖当前 playground 注册表中的全部已注册模型，而不只是一两个示例页
- 已有手工定制模型页继续保留，并在存在定制文案时优先使用定制数据
- 页面顶部直接复用 `/creator` 工作台，保证右侧媒体面板与 creator 保持一致
- 在工作台下方新增模型介绍、示例图库、适用场景与 FAQ 等模块

## 影响

- 受影响规范：`model-centric-landing`
- 受影响代码：
  - `src/app/[locale]/(landing)/model/[slug]/page.tsx`
  - `src/shared/blocks/model-landing/*`
  - `src/shared/lib/model-landing-data.ts`
  - `src/shared/blocks/desktop-playground/playground-config-registry.ts`
