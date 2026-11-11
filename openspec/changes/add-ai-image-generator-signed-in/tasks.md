# 任务清单：为 AI Image Generator 入口页增加已登录用户组件

## 1. 规范与边界

- [x] 1.1 对齐 `update-ai-image-generator-guest-entry` 中未登录态入口页的布局、场景结构和工作台样式约束
- [x] 1.2 定义已登录态仅在 `/ai-image-generator` 内切换 scene/model、不发生路由跳转的规则
- [x] 1.3 明确该变更与 `update-mobile-image-ai-pages` 的边界，避免将同页切换能力扩散到其他图片 AI 路由

## 2. 组件实现

- [x] 2.1 从 `AiImageGeneratorGuest` 提取共享类型、样式常量、场景解析逻辑和表单映射到公共模块
- [x] 2.2 新增 `AiImageGeneratorSignedIn` 组件，并保持与未登录态完全一致的表单 UI 和响应式布局
- [x] 2.3 实现已登录态 scene 切换仅更新本地状态，并在有模型列表时自动切换到该场景的默认模型
- [x] 2.4 实现已登录态 model 切换仅更新本地状态，并在工作区内切换对应表单组件
- [x] 2.5 修改 `AiImageGeneratorShell`，使已登录用户不再看到旧版 `ImageGenerator` fallback

## 3. 验证

- [x] 3.1 运行 `openspec-cn validate add-ai-image-generator-signed-in --strict --no-interactive`
- [ ] 3.2 验证未登录用户仍使用原有 `AiImageGeneratorGuest` 逻辑和跳转行为
- [ ] 3.3 验证已登录用户切换 scene 时 URL 始终保持 `/ai-image-generator`
- [ ] 3.4 验证已登录用户切换 model 时 URL 始终保持 `/ai-image-generator`
- [ ] 3.5 验证移动端和桌面端下登录态组件的布局、选择器和表单工作区与未登录态保持一致
