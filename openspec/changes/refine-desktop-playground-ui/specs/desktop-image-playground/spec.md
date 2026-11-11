## 新增需求

### 需求：桌面端图片 Playground 必须使用统一的 UI 组件架构

系统必须为桌面端图片 Playground 提供统一的组件架构，包括 Model 选择器、Prompt 输入区、参数配置区和操作栏，不再使用 CSS 覆写旧版双栏布局。

#### 场景：桌面端访问 text-to-image 页面

- **当** 用户在桌面端访问任意 `/text-to-image/*` 页面
- **那么** 页面必须渲染 `DesktopImagePlayground` 组件
- **并且** 组件必须包含 Model 选择器、Prompt 输入区、参数配置区和操作栏
- **并且** 不得渲染旧版双栏布局或使用 CSS 覆写

#### 场景：桌面端访问 image-to-image 页面

- **当** 用户在桌面端访问任意 `/image-to-image/*` 页面
- **那么** 页面必须渲染 `DesktopImagePlayground` 组件
- **并且** 组件必须包含 Model 选择器、参考图片上传、Prompt 输入区、参数配置区和操作栏
- **并且** 不得渲染旧版双栏布局或使用 CSS 覆写

#### 场景：移动端访问图片 Playground 页面

- **当** 用户在移动端访问任意 `/text-to-image/*` 或 `/image-to-image/*` 页面
- **那么** 页面必须继续渲染现有的移动端 playground 组件
- **并且** 不得使用新的 `DesktopImagePlayground` 组件

### 需求：桌面端图片 Playground 必须支持 schema 驱动的字段渲染

系统必须支持通过 schema 定义每个模型的参数字段，并根据 schema 自动渲染对应的表单控件。

#### 场景：渲染 text-to-image 模型的参数字段

- **当** 桌面端渲染某个 text-to-image 模型的 playground
- **那么** 系统必须根据该模型的 schema 渲染 prompt、aspectRatio、resolution、outputFormat 等字段
- **并且** 每个字段必须使用统一的样式规范（高度、圆角、边框、背景）

#### 场景：渲染 image-to-image 模型的参数字段

- **当** 桌面端渲染某个 image-to-image 模型的 playground
- **那么** 系统必须根据该模型的 schema 渲染 referenceImages、prompt、aspectRatio、resolution、outputFormat 等字段
- **并且** referenceImages 字段必须显示为图片上传组件

#### 场景：模型缺少 schema 定义

- **当** 某个模型没有定义 schema
- **那么** 系统必须使用默认 schema 模板
- **或者** 回退到旧版 playground 组件

### 需求：桌面端图片 Playground UI 必须符合设计规范

系统必须按照设计规范实现桌面端图片 Playground 的 UI 样式，包括 Model 选择器、Prompt 输入区、参数控件和生成按钮。

#### 场景：渲染 Model 选择器

- **当** 桌面端渲染 Model 选择器
- **那么** 选择器高度必须约为 80px
- **并且** 背景必须使用深色渐变 `linear-gradient(180deg, rgba(18, 22, 34, 0.96), rgba(13, 16, 26, 0.98))`
- **并且** 边框必须为 `1px solid rgba(255, 255, 255, 0.08)`
- **并且** 圆角必须为 `1.35rem`
- **并且** 左侧必须显示模型图标（64x64），右侧显示箭头

#### 场景：渲染 Prompt 输入区

- **当** 桌面端渲染 Prompt 输入区
- **那么** 输入区背景必须使用深色渐变（同 Model 选择器）
- **并且** 边框必须为 `1px solid rgba(255, 255, 255, 0.08)`
- **并且** 圆角必须为 `1.55rem`
- **并且** Textarea 最小高度必须为 210px
- **并且** Textarea 必须使用透明背景和无边框样式

#### 场景：渲染参数控件

- **当** 桌面端渲染参数控件（Select、Input 等）
- **那么** 控件高度必须为 `3.6rem`
- **并且** 控件圆角必须为 `1rem`
- **并且** 控件背景必须为 `rgba(7, 10, 18, 0.92)`
- **并且** 控件边框必须为 `1px solid rgba(255, 255, 255, 0.08)`

#### 场景：渲染生成按钮

- **当** 桌面端渲染生成按钮
- **那么** 按钮高度必须为 `3.85rem`
- **并且** 按钮圆角必须为 `1.2rem`
- **并且** 按钮背景必须使用粉紫渐变 `linear-gradient(180deg, #ff2ec8, #f012af)`
- **并且** 按钮边框必须为 `1px solid rgba(255, 71, 194, 0.2)`
- **并且** 按钮必须包含阴影效果 `inset 0 -4px 0 rgba(198, 10, 139, 0.65), 0 14px 30px rgba(240, 18, 175, 0.18)`

### 需求：桌面端图片 Playground 必须保持现有功能不变

系统在重写桌面端图片 Playground UI 时，必须保持模型切换、积分估算、图片生成等现有功能不变。

#### 场景：切换模型

- **当** 用户在桌面端 Playground 中切换模型
- **那么** 系统必须跳转到该模型对应的页面路由
- **并且** 新页面必须正确渲染该模型的 schema 字段

#### 场景：估算所需积分

- **当** 用户在桌面端 Playground 中修改参数（如 resolution）
- **那么** 系统必须实时更新所需积分估算
- **并且** 积分估算必须显示在生成按钮附近

#### 场景：生成图片

- **当** 用户在桌面端 Playground 中点击生成按钮
- **那么** 系统必须使用当前表单的参数值调用生成 API
- **并且** 生成过程中必须显示加载状态
- **并且** 生成完成后必须显示结果图片

#### 场景：保持页面 SEO 内容

- **当** 桌面端渲染图片 Playground 页面
- **那么** Hero 标题与描述必须位于 `CreateLayout` 下方输出
- **并且** Features、FAQ、CTA 等 SEO 模块必须继续按原顺序输出
- **并且** 这些模块的内容和数据来源不得改变
