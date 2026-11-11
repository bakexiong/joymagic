## 1. 基座组件开发

- [ ] 1.1 创建 `src/shared/blocks/desktop-playground/` 目录结构
- [ ] 1.2 实现 `DesktopImagePlayground` 基座组件
- [ ] 1.3 实现 `ModelSelector` 组件（带图标和模型名称显示）
- [ ] 1.4 实现 `PromptComposer` 组件（大文本框 + Enhance 按钮）
- [ ] 1.5 实现 `ParameterPanel` 组件（统一参数渲染容器）
- [ ] 1.6 实现 `ActionBar` 组件（数量选择器 + 积分估算 + 生成按钮）

## 2. Schema 系统实现

- [ ] 2.1 定义 `FieldSchema` 和 `PlaygroundSchema` TypeScript 类型
- [ ] 2.2 实现 schema 解析器和字段渲染逻辑
- [ ] 2.3 创建通用字段组件（TextInput, Select, Slider, Toggle 等）
- [ ] 2.4 实现 `ReferenceImageUpload` 组件（用于 image-to-image）
- [ ] 2.5 为 text-to-image 场景定义默认 schema 模板
- [ ] 2.6 为 image-to-image 场景定义默认 schema 模板

## 3. 状态管理与逻辑

- [ ] 3.1 创建 `useDesktopPlayground` hook 统一管理表单状态
- [ ] 3.2 集成现有的 `useEstimateCredits` hook
- [ ] 3.3 实现字段校验逻辑
- [ ] 3.4 实现生成图片的提交逻辑
- [ ] 3.5 实现错误处理和状态提示

## 4. 样式与 UI 规范

- [ ] 4.1 实现 Model 选择器样式（参考设计图）
- [ ] 4.2 实现 Prompt 输入区样式（透明背景、无边框 textarea）
- [ ] 4.3 实现参数控件统一样式（高度 3.6rem，圆角 1rem）
- [ ] 4.4 实现生成按钮样式（粉紫渐变 + 阴影效果）
- [ ] 4.5 确保所有组件符合设计规范的间距和圆角

## 5. 集成到 workbench

- [ ] 5.1 更新 `desktop-image-ai-workbench.tsx` 以使用新的 `DesktopImagePlayground`
- [ ] 5.2 移除旧的 CSS 覆写代码（500+ 行 style jsx global）
- [ ] 5.3 实现桌面端/移动端分离逻辑（使用 `useIsMobile`）
- [ ] 5.4 确保移动端继续使用旧 playground 组件

## 6. 迁移 text-to-image 模型

- [ ] 6.1 为 `nano-banana-2-text-to-image` 定义 schema
- [ ] 6.2 为 `flux-2-klein-text-to-image` 定义 schema
- [ ] 6.3 为 `qwen-image-202512-text-to-image` 定义 schema
- [ ] 6.4 为 `seedream-5-0-lite-text-to-image` 定义 schema
- [ ] 6.5 为其他 text-to-image 模型定义 schema
- [ ] 6.6 验证所有 text-to-image 页面在桌面端正确渲染

## 7. 迁移 image-to-image 模型

- [ ] 7.1 为 `nano-banana-2-image-to-image` 定义 schema
- [ ] 7.2 为 `flux-2-klein-image-to-image` 定义 schema
- [ ] 7.3 为 `seedream-5-0-lite-image-to-image` 定义 schema
- [ ] 7.4 为其他 image-to-image 模型定义 schema
- [ ] 7.5 验证参考图片上传功能正常工作
- [ ] 7.6 验证所有 image-to-image 页面在桌面端正确渲染

## 8. 测试与验证

- [ ] 8.1 验证桌面端所有 text-to-image 页面不再出现旧版双栏布局
- [ ] 8.2 验证桌面端所有 image-to-image 页面不再出现旧版双栏布局
- [ ] 8.3 验证移动端继续使用旧 playground 组件，不受影响
- [ ] 8.4 验证模型切换功能正常（路由跳转）
- [ ] 8.5 验证 Hero 标题/描述和 SEO 模块位置不变
- [ ] 8.6 验证积分估算功能正常工作
- [ ] 8.7 验证图片生成功能正常工作
- [ ] 8.8 运行 `openspec-cn validate refine-desktop-playground-ui --strict --no-interactive`

## 9. 扩展到视频与其他工具页

- [ ] 9.1 将所有 `/text-to-video/*` 页面接入统一桌面 workbench 外壳
- [ ] 9.2 将所有 `/image-to-video/*` 页面接入统一桌面 workbench 外壳
- [ ] 9.3 将 `/image-eraser`、`/image-background-remover`、`/image-upscaler` 等图片工具页接入统一图片外壳
- [ ] 9.4 将 `/longcat-avatar`、`/motion-control/kling-2-6-pro` 等视频工具页接入统一视频外壳
- [ ] 9.5 验证上述页面在桌面端与 `/text-to-image` 保持一致的工作台布局节奏
