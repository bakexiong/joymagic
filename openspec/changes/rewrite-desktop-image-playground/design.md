## 上下文

当前 PC 端图片页面存在两个互相冲突的结构层：

1. 外层已经切到 `CreateLayout` 风格的工作台
2. 内层 playground 仍然保留旧版 landing 双栏表单结构

这导致：

- 表单只能通过 CSS 覆写压平，无法真正重塑信息结构
- prompt、参数、辅助面板、结果预览仍然受旧 DOM 结构限制
- 不同模型页面虽然参数不同，但桌面端无法统一成一套稳定创作台体验

## 目标

- 为所有图片 AI 页面建立一套统一的 PC 端创作台规范
- 将 prompt、参考图、输出参数、数量和 CTA 融入单一桌面端表单结构
- 让模型页只提供参数 schema 和生成逻辑，不再负责桌面端布局

## 非目标

- 不重写移动端布局
- 不改变后端接口或参数语义
- 不重写视频场景

## 方案

### 1. 拆分桌面与移动端职责

- 现有 playground 组件继续保留移动端使用
- 新增桌面端基座组件，由 workbench 在 PC 环境下注入
- PC 端不再直接渲染旧 playground 的完整布局

### 2. schema 驱动桌面端字段

每个图片场景在桌面端映射为统一字段 schema，例如：

- `prompt`
- `referenceImages`
- `aspectRatio`
- `outputFormat`
- `quality`
- `imageCount`
- `submit`

字段 schema 只描述：

- 字段类型
- 标签和说明
- 默认值
- 选项
- 是否显示

实际渲染由统一桌面端基座负责。

### 3. 统一桌面端信息架构

桌面端单一创作面板结构：

1. `Model Bar`
2. `Prompt Composer`
3. `Parameter Rows`
4. `Action Bar`

其中：

- `text-to-image` 优先显示 prompt 与输出参数
- `image-to-image` 优先显示参考图上传与编辑 prompt

### 4. SEO 与页面内容位置

- header 保持不变
- `CreateLayout` 负责工作台区域
- Hero 标题/描述放在 `CreateLayout` 下方
- Features / FAQ / CTA 等页面 SEO 模块继续保持原顺序和原数据来源

## 风险

### 字段兼容性风险

现有各 playground 把状态、校验、积分估算和提交逻辑写在页面组件内部。若直接改为 schema 驱动，需要为这些逻辑提供统一的桌面端适配层。

### 渐进迁移风险

不同模型参数不完全一致，必须提供 schema 缺失时的降级方案，否则某些模型会在桌面端无法渲染。

## 实施建议

先完成一套共享桌面端基座，再逐步把每个模型的参数迁移到 schema。不要继续在旧 DOM 结构上叠加样式覆写。
