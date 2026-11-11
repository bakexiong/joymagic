# 提案：为 AI Image Generator 入口页增加已登录用户组件

## 变更 ID

`add-ai-image-generator-signed-in`

## 摘要

为 `/ai-image-generator` 页面实现已登录用户的专属组件。该组件的表单 UI 和视觉布局与现有未登录态组件（`AiImageGeneratorGuest`）完全一致，核心区别在于：已登录用户切换场景（scene）和模型（model）时不进行路由跳转，所有操作均在 `/ai-image-generator` 页面内完成。

## 动机

当前 `/ai-image-generator` 页面的已登录态仅显示一个临时占位符和旧版 `ImageGenerator` 组件回退方案。未登录用户已有完整的新设计入口页体验，但已登录用户缺失相同的体验。需要为已登录用户提供同等质量的入口页，同时利用已登录态无需路由跳转引导注册的优势，让用户直接在页面内完成场景和模型切换及生成操作。

## 范围

### 包含
- 新增 `AiImageGeneratorSignedIn` 组件（已登录态入口组件）
- 修改 `AiImageGeneratorShell` 切换到新组件
- 复用 Guest 组件的所有 UI 布局、样式常量、表单映射
- 为场景切换和模型切换定义“仅更新页面内状态、不改写 URL”的行为约束

### 不包含
- 不修改未登录态组件（`AiImageGeneratorGuest`）的任何行为
- 不修改各表单组件（playground 组件）本身
- 不涉及后端 API 变更
- 不涉及积分系统或支付流程变更
- 不将该无跳转交互扩展到其他图片 AI 路由；其他路由仍由各自页面提案处理

## 影响的功能

| 功能 | 类型 | 说明 |
|------|------|------|
| ai-image-generator-entry | 修改 | 增加已登录态组件的需求和场景 |

## 依赖与边界

- 该变更依赖活动提案 `update-ai-image-generator-guest-entry` 先定义并稳定未登录态入口 UI、场景结构和共享工作台布局
- 该变更仅覆盖 `/ai-image-generator` 登录态分支，不替代 `update-mobile-image-ai-pages` 中针对其他图片 AI 页面移动端编排的工作
- 该变更的核心边界是“UI 与未登录态完全一致，仅导航行为不同”，不得顺带调整入口页视觉结构

## 风险与注意事项

- **复用策略**：已登录组件与未登录组件的 UI 完全一致，需要将共享的常量、类型、工具函数和 `FORM_COMPONENTS` 映射表提取为公共模块，避免代码重复
- **表单组件兼容性**：各 playground 表单组件原设计用于独立页面，嵌入到 `/ai-image-generator` 时可能存在 context 依赖（如路由参数），需确认无副作用
- **状态管理**：已登录组件的场景/模型切换仅更新本地 state，不触发路由变更，需确保表单组件在 URL 不变的情况下正确响应 prop 变化
- **提案并行风险**：`ai-image-generator-entry` 目前同时存在未登录态和已登录态两个活动变更，后续实施与归档时需按顺序合并，避免规范增量互相覆盖
