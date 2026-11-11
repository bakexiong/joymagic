# 变更：重构首页为工作台式 Suite 布局

## 为什么

当前首页仍混合了传统落地页与工作台入口两套模式，首屏信息层级分散，Header、Sidebar、Hero、输入框之间的职责边界不够清晰。用户进入首页后，虽然能看到较多能力模块，但不够像一个可以立即开始创作的产品首页。

参考 OpenArt Suite Home 的布局方向，本项目需要把首页重构为“创作入口优先、工具发现紧随其后、转化能力嵌入路径中”的工作台式首页。

## 变更内容

- 重构首页桌面端信息架构，采用 `Marketing Bar + Header + Sidebar + Composer Workspace + Tool Discovery` 的布局模式
- 将原 Header 中的主导航迁移到左侧 Sidebar，Header 仅保留品牌信息和用户操作区
- 为 Header 上方增加营销位，用于活动、新模型、折扣或功能发布信息
- 重设计首页首屏输入框，使其成为首页最强入口，而不是普通表单
- 调整首页 Hero/首屏内容层级，弱化传统文案式 Hero，强化工作台和任务入口
- 统一首页的面板层级、按钮、胶囊控件、卡片结构与深色主题语言
- 重新组织首页中部内容区，优先展示工具发现、模型能力、案例流和升级入口

## 影响

- 受影响规范：`homepage-layout`
- 受影响代码：
  - `src/themes/default/pages/landing-v2.tsx`
  - `src/themes/default/layouts/landing.tsx`
  - `src/themes/default/blocks/header.tsx`
  - `src/themes/default/blocks/home-sidebar.tsx`
  - `src/themes/default/blocks/home-composer.tsx`
  - `src/config/style/global.css`
  - `src/config/style/theme.css`

