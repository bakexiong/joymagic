# Pollo AI 设计语言提取

> 说明：本次提取为人工抽取版本。由于当前线程环境缺少 `npm/npx`，无法直接运行 `designlang`，以下内容基于 `https://pollo.ai/` 与 `https://pollo.ai/pricing` 的公开页面结构、文案层级与可见视觉语言整理，适合作为首页/定价页对标参考，而非像素级还原。

## 1. 品牌气质

Pollo AI 的首页属于典型的 AI 创作平台增长型营销风格：

- 深色底的沉浸式工作台外观
- 高密度能力展示，但首屏仍保留强 CTA
- 强调“all-in-one platform”
- 通过 Agent、Apps、Models、Tools 形成生态感
- 用高亮色和卡片化模块制造“功能丰富且可立即尝试”的感受

整体关键词：

- 深色
- 玻璃感
- 高对比
- 平台化
- 结果导向
- 增长导向

## 2. 视觉系统总结

### 2.1 色彩

从公开页面可见信息推断，Pollo AI 的视觉系统以深色中性底为主，辅以明亮的青蓝、青绿和紫粉色高亮。

核心色板（近似）：

- Background / Base: `#05070C`
- Surface / Card: `#0D1117`
- Surface Elevated: `#141A22`
- Border Subtle: `rgba(255,255,255,0.08)`
- Text Primary: `#F8FAFC`
- Text Secondary: `#B6C2D0`
- Accent Cyan: `#5FD7FF`
- Accent Blue: `#4EA3FF`
- Accent Teal: `#4CE6B2`
- Accent Purple: `#8B7CFF`
- Accent Pink: `#FF6BD6`
- Success: `#33D17A`
- Warning / Badge: `#FFB84D`

### 2.2 背景语言

- 大面积深色背景
- 分层卡片背景，而不是纯平面
- 局部使用渐变高光和发光效果
- 功能分区通过卡片和分组标题区分，而不是纯分隔线

推断常见背景做法：

- 页面背景：深色纯底 + 轻微渐变
- 卡片背景：半透明深色或深色实底
- Hover：边框更亮，背景略提亮

## 3. 字体与排版

### 3.1 字体风格

未直接解析到官方字体文件名，按页面可见风格推断：

- 倾向现代无衬线系统
- 标题偏粗，强调产品感和平台感
- 正文为高可读性的中性无衬线

建议近似字体栈：

- Heading: `Inter`, `SF Pro Display`, `ui-sans-serif`, `system-ui`, sans-serif
- Body: `Inter`, `SF Pro Text`, `ui-sans-serif`, `system-ui`, sans-serif

### 3.2 排版特征

- H1 强而直接，通常一句话定义平台价值
- H2 用于模块分区，例如 `Video Models`、`Image Tools`
- 小标签和 Badges 用于 `New`、`Hot`、`Beta`
- 正文不长，偏营销文案而非技术解释

建议字号比例（近似）：

- H1: 48-64px
- H2: 28-36px
- H3: 18-24px
- Body Large: 18px
- Body: 14-16px
- Caption: 12-13px

## 4. 布局系统

### 4.1 首页布局

Pollo AI 首页结构大致为：

1. 顶部全局导航
2. 首屏创作入口 / Agent 入口
3. “What would you like to create today?” 类型的任务入口
4. Apps / Models / Tools 分区
5. FAQ
6. Footer / Explore More

### 4.2 信息架构特征

- 先给平台定义
- 再给用户立即开始的入口
- 再给工具和模型生态展示
- 最后给 FAQ 与扩展内容

这意味着它不是纯“工作台首页”，而是“营销首页 + 工作流入口”的混合体。

## 5. 间距与圆角

推断间距系统接近 4px 或 8px 基准：

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

圆角语言：

- 按钮：`9999px` 胶囊形
- 小卡片：12-16px
- 大卡片 / 面板：20-24px

## 6. 阴影与层次

Pollo AI 的层次不是重阴影，而是：

- 深浅背景分层
- 细边框
- 轻柔外发光
- Hover 时颜色强化

建议近似阴影：

- Card Shadow: `0 10px 30px rgba(0,0,0,0.28)`
- Glow Cyan: `0 0 0 1px rgba(95,215,255,0.2), 0 18px 50px rgba(95,215,255,0.12)`

## 7. 组件模式

### 7.1 Header

- 顶部导航密度高
- 左侧品牌
- 中部多级导航 / 能力入口
- 右侧登录、价格页、免费开始 CTA

### 7.2 Hero

- 强主标题
- 明确的创作输入入口
- 主 CTA 强烈
- 与结果场景强绑定

### 7.3 Tabs / Pills

- 大量使用横向胶囊切换
- 当前状态高亮
- 任务分类明显

### 7.4 Cards

- 深色卡片
- 卡片内图像 + 标题 + 简短说明
- 模块之间高度统一，利于快速扫描

### 7.5 Pricing Cards

- Free / Lite / Pro 分层
- 清晰列出 credits、并行任务数、是否去水印等升级理由
- 年付月付切换明显

## 8. 动效

从视觉语言推断，动效倾向：

- Hover 提亮
- 卡片轻微上浮
- 渐变光效
- Tabs/Chips 状态切换

不属于夸张动画型，而属于现代 SaaS / AI 产品常见的“高反馈、低打扰”风格。

## 9. 可访问性

### 9.1 手工评估

手工估计 WCAG 风险点：

- 深色底 + 白字，主体对比通常较强
- 次级灰字在部分深色卡片上可能接近 AA 临界
- Badge / 渐变高亮文案需要注意对比度

### 9.2 估计得分

- 视觉对比整体：`B+`
- 近似无障碍分数：`84/100`

> 这是基于公开页面的人工估计，不等同于自动化扫描分数。

## 10. 对你们最值得借鉴的点

如果目标是优化 `dev.10b.ai` 首页与定价页，Pollo AI 最值得借鉴的是：

1. 首页先卖结果，再卖工具
2. 首屏 CTA 非常明确
3. 平台心智清楚：不是单工具，而是全家桶
4. 定价页强调升级理由，不只强调 credits
5. 任务入口比模型入口更接近用户决策

## 11. 推荐落地方式

可把这份提取用于：

- 首页重构的信息架构参考
- 深色主题 token 初始化
- 价格页卡片视觉改造
- Canvas 模块视觉气质统一

相关来源：

- https://pollo.ai/
- https://pollo.ai/pricing
