# 变更：按 Mango Animate 设计规范重构 `/tools/*` 页面

## 为什么

当前 `/tools/*` 页面主要沿用黑色工作台风格，视觉语言、页面层级、按钮体系、卡片结构和响应式布局均与 `mangoanimate.com-DESIGN.md` 定义的设计规范存在明显偏差。用户从首页或其它入口进入工具页后，界面体验与站内 Mango 风格页面不一致，也削弱了工具页作为核心转化页面的品牌统一性。

## 变更内容

- 重构 `/tools/[...tool]` 统一详情页的信息架构与视觉样式，使其符合 Mango Animate 设计规范
- 重构 `/tools/face-generator` 等采用同类工作台结构的专用工具页，使其与统一工具页保持一致的设计语言
- 为工具页抽取和统一 Mango 风格的布局容器、标签页、CTA、卡片、表单区与右侧工作台外壳
- 调整桌面端与移动端的布局切换方式，遵循规范中的 12 栏网格、间距、卡片和按钮体系
- 保持现有生成、模板库、作品列表、收藏集、权限校验和积分估算行为不变，仅重构呈现层和组件组织

## 影响

- 受影响规范：`tools-page-layout`
- 受影响代码：
  - `src/app/[locale]/(landing)/tools/[...tool]/page.tsx`
  - `src/app/[locale]/(landing)/tools/face-generator/page.tsx`
  - `src/shared/blocks/create/tools-detail-page.tsx`
  - `src/shared/blocks/face-generator/face-generator-page.tsx`
  - 与 tools 页面直接相关的共享工作台组件、样式和布局外壳
