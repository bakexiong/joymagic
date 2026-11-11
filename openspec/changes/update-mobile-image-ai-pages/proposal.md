# 变更：重构图片 AI 全场景移动端页面

## 为什么

当前图片 AI 各场景页面主要按桌面端结构编排，移动端仍然先展示大段 hero/SEO 文案，再进入生成表单，导致移动端首屏不能直接进入操作。用户现在要求所有图片 AI 场景页和模型页在移动端都提供新的表单优先页面，并且每个页面都要具备统一的场景切换与模型切换能力，同时不影响 PC 端现有页面结构。

这已经超出单个 `/ai-image-generator` 入口页改造的范围，需要把移动端图片 AI 体验提升为一个跨所有 image 场景页面的统一编排能力。

## 变更内容

- 为所有图片 AI 场景页与模型页提供仅在移动端生效的新页面编排，PC 端现有结构和交互保持不变
- 适用范围覆盖：
  - `/ai-image-generator`
  - `text-to-image/*`
  - `image-to-image/*`
  - `/image-eraser`
  - `/image-background-remover`
  - `/image-upscaler`
  - `/qwen-image-layered`
- 移动端页面必须把对应场景的核心生成表单区域提前到首屏展示
- 移动端页面必须在表单上方提供统一的场景切换下拉框
- 当当前场景存在模型列表时，移动端页面必须同时提供模型切换下拉框
- 场景切换或模型切换时，页面必须跳转到对应的目标路由
- 页面原有 SEO 模块、特性介绍、FAQ、CTA 等内容必须后移到表单区域之后
- 各页面的 SEO 内容本身不修改，仅调整移动端顺序与展示优先级
- 各场景的移动端新页面应共享统一的移动端工作台样式，避免每个路由独立发散

## 影响

- 受影响规范：
  - `mobile-image-ai-pages`
  - `mobile-homepage-layout`
- 受影响代码：
  - `src/app/[locale]/(landing)/(ai)/ai-image-generator/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(pollo)/text-to-image/*/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(pollo)/image-to-image/*/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(pollo)/image-eraser/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(pollo)/image-background-remover/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(pollo)/image-upscaler/page.tsx`
  - `src/app/[locale]/(landing)/(ai)/(qwen)/qwen-image-layered/page.tsx`
  - 后续新增的图片 AI 移动端统一工作台组件
