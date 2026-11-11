# 变更：重写桌面端图片 Playground

## 为什么

当前 `/text-to-image/*` 与 `/image-to-image/*` 的 PC 端页面仍然依赖旧版 playground 结构。即使外层切换到 `CreateLayout` 风格工作台，内部表单仍然是原来的落地页双栏实现，只能通过样式覆写“套壳”，无法真正达到单栏创作台、一体化参数区和模型切换区的目标。

用户已经明确要求彻底抛弃现有 PC 表单设计，参考新的创作面板稿，重新定义桌面端图片 Playground 的结构与交互，同时保持 header 不变，并保留 `CreateLayout` 下方的页面 SEO 内容。

## 变更内容

- 为 `/text-to-image/*` 与 `/image-to-image/*` 定义独立的桌面端 Playground 规范，不再复用旧版 PC 落地页表单结构
- 引入桌面端专用的 schema 驱动表单基座，统一承载 prompt、参考图、输出参数、数量与生成动作
- 保持移动端继续复用现有 playground，不改变移动端交互
- 保持页面 header 不变
- 保持 `CreateLayout` 下方的 Hero 标题/描述与现有 SEO 模块输出顺序，不修改其内容来源
- 模型切换继续通过对应路由跳转

## 非目标

- 不修改 `/content` 下的 MDX 内容
- 不改造视频类 playground
- 不在本提案中重写各模型的生成逻辑或 API 调用
- 不改变移动端表单体验

## 影响

- 受影响规范：`desktop-image-playground`
- 受影响代码：
  - `src/shared/blocks/common/desktop-image-ai-workbench.tsx`
  - `src/themes/default/blocks/*text-to-image-playground.tsx`
  - `src/themes/default/blocks/*image-to-image-playground.tsx`
  - 可能新增 `src/shared/blocks` 下的桌面端图片 playground 基座与 schema 组件
