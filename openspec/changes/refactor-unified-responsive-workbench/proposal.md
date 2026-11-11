# 变更：统一 AI 页面响应式工作台基座

## 为什么

当前项目同时维护移动端图片工作台和桌面端 `desktop-playground` / workbench 多套实现，导致 AI 场景页在移动端和桌面端的入口结构、样式语言、切换逻辑和维护方式持续分叉。用户现在明确要求首页移动端不要修改，只统一工作台基座，让 `desktop-playground` 适配移动端并收敛为一套响应式工作台能力。

这属于跨 AI 场景页移动端与桌面端工作台架构的合并，不再是局部样式调整。

## 变更内容

- 将现有 `desktop-playground` / 统一 workbench 改造为响应式实现，支持移动端和桌面端共用同一套 schema、切换逻辑与生成面板
- 图片与视频相关 AI 页面优先复用统一响应式 workbench，而不是继续分流到 `mobile-image-ai-workbench`
- 首页移动端现有 `mobile-homepage` 和首页编排保持不变，本次只统一 AI 工作台基座
- 保持现有后端 API、积分逻辑、模型路由和 SEO 内容本身不变，仅调整前端工作台承载方式与页面编排

## 非目标

- 不修改 `/content` 下的 MDX 内容
- 不调整 AI 生成接口或积分计算规则
- 不改变模型页面的 URL 结构
- 不修改首页移动端 `mobile-homepage` 的展示结构
- 不在前端新增任何 key 或敏感配置

## 影响

- 受影响规范：
  - `responsive-ai-workbench`
- 受影响代码：
  - `src/shared/blocks/common/mobile-image-ai-workbench.tsx`
  - `src/shared/blocks/common/desktop-media-ai-workbench.tsx`
  - `src/shared/blocks/desktop-playground/*`
  - `src/themes/default/blocks/hero.tsx`
