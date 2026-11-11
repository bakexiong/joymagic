# 变更：优化首页移动端独立布局

## 为什么

当前首页在移动端沿用桌面端的 Hero 与导航结构，首屏信息密度高，无法按业务目标优先展示轮播 Banner、核心创作入口和模型案例。与此同时，首页尚未提供可由后台维护的模型案例展示区，无法支撑后续持续扩展多个模型入口。

## 变更内容

- 为首页新增仅在移动端生效的独立布局编排，桌面端现有布局保持不变
- 将移动端首页首屏调整为：顶部工具栏、Banner slides、`Create Image` / `Create Video` 双 CTA、按模型分组的案例展示区
- 模型案例展示区采用按模型拆分的独立模块，并以瀑布流方式展示该模型下的案例
- 在移动端首页为已登录用户提供“切换到旧版本”入口，入口位于用户头像下拉菜单中
- 在案例展示区之后，继续渲染现有首页 SEO 模块；移动端保留原首页 hero 文案区，但不重复展示其 tabs 与生成表单
- 明确要求 SEO 文案、文案字段和值不做修改，仅调整移动端布局顺序与展示方式
- 保持 footer 结构与样式不变
- 新增后台可配置的首页模型案例配置，用于维护模型分组、排序、封面、跳转与展示开关

## 影响

- 受影响规范：
  - `mobile-homepage-layout`
  - `homepage-model-showcase-admin`
- 受影响代码：
  - `src/app/[locale]/(landing)/page.tsx`
  - `src/themes/default/pages/landing.tsx`
  - `src/themes/default/blocks/header.tsx`
  - `src/shared/services/settings.ts`
  - `src/shared/models/config.ts`
  - 后续新增的首页移动端区块组件与后台配置表单
