# 变更：优化桌面端图片 Playground UI 设计

## 为什么

当前 `/text-to-image/*` 与 `/image-to-image/*` 的 PC 端页面虽然已经切换到 `CreateLayout` 工作台结构，但内部表单仍然是旧版落地页的双栏布局，只能通过大量 CSS 覆写来"套壳"调整样式。这导致：

1. 表单结构受限于旧 DOM 层级，无法真正实现单栏创作台体验
2. 不同模型页面的参数展示不统一，用户体验不一致
3. 参考图片显示的目标设计（图1）与当前实现（图2）差距较大
4. 维护成本高，每次调整都需要编写复杂的 CSS 覆盖规则

用户提供的参考设计图片展示了更简洁、更专业的创作面板布局，需要从底层重新设计桌面端 Playground 组件。

## 变更内容

- 为桌面端图片 Playground 定义全新的 UI 规范，参考提供的设计图片
- 实现统一的桌面端表单基座组件，支持 schema 驱动的字段渲染
- 将 Model 选择器、Prompt 输入区、参数配置区、生成按钮整合为单一流畅的创作面板
- 为 `text-to-image` 和 `image-to-image` 场景提供差异化但统一的参数布局
- 将 `/text-to-video/*`、`/image-to-video/*` 和 `/pollo` 下其他创作工具页统一到同一套桌面 workbench 外壳
- 移除旧版双栏布局的 CSS 覆写代码，使用原生组件结构
- 保持移动端继续使用现有 playground 组件
- 保持页面 header、Hero 标题/描述、SEO 模块的位置和内容不变

## 非目标

- 不修改移动端 playground 体验
- 不改变后端 API 接口或生成逻辑
- 不修改 `/content` 目录下的 MDX 文件
- 不改变模型切换的路由跳转机制

## 影响

- 受影响规范：`desktop-image-playground`
- 受影响代码：
  - `src/shared/blocks/common/desktop-image-ai-workbench.tsx` - 需要移除大量 CSS 覆写
  - `src/shared/blocks/common/desktop-image-ai-workbench-v2.tsx` - 扩展到视频与其他创作工具场景
  - `src/shared/blocks/common/flux-style-image-page-layout.tsx` - 作为统一图片工具页外壳
  - `src/shared/blocks/common/flux-style-video-page-layout.tsx` - 作为统一视频工具页外壳
  - `src/themes/default/blocks/*-text-to-image-playground.tsx` - 所有 text-to-image playground 组件
  - `src/themes/default/blocks/*-image-to-image-playground.tsx` - 所有 image-to-image playground 组件
  - `src/themes/default/blocks/*-text-to-video-playground.tsx` - 所有 text-to-video playground 组件
  - `src/themes/default/blocks/*-image-to-video-playground.tsx` - 所有 image-to-video playground 组件
  - `src/themes/default/blocks/*-playground.tsx` - 其他 `/pollo` 创作工具 playground 组件
  - 新增：`src/shared/blocks/desktop-playground/` - 桌面端专用 playground 基座组件
  - 新增：`src/shared/blocks/desktop-playground/schema/` - 字段 schema 定义
