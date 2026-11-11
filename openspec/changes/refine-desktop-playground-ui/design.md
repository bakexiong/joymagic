# 设计文档：优化桌面端图片 Playground UI

## 上下文

当前桌面端图片 Playground 存在以下问题：

1. **结构冲突**：外层使用 `CreateLayout` 工作台，内层仍是旧版双栏表单
2. **样式覆写过度**：`desktop-image-ai-workbench.tsx` 包含 500+ 行 CSS 覆写代码
3. **维护困难**：每个模型的 playground 组件都是独立实现，缺乏统一规范
4. **用户体验不一致**：不同模型页面的参数展示方式差异较大

用户提供的参考设计图片（图1）展示了目标 UI：
- 顶部 Model 选择器（带图标和模型名称）
- 中间 Prompt 输入区（大文本框，支持参考图片上传）
- 底部参数配置区（Aspect Ratio、Output 等）
- 底部生成按钮（带数量选择器）

当前实现（图2）通过 CSS 覆写勉强接近目标，但 DOM 结构仍是旧版双栏布局。

## 目标

1. 为桌面端图片 Playground 建立统一的 UI 规范和组件架构
2. 实现 schema 驱动的字段渲染系统，减少重复代码
3. 移除所有 CSS 覆写代码，使用原生组件结构
4. 提供清晰的桌面端/移动端分离机制

## 非目标

- 不改变移动端 playground 的实现
- 不修改后端 API 或生成逻辑
- 不重写视频类 playground（本次仅针对图片）

## 方案

### 1. 组件架构

```
DesktopImagePlayground (新组件)
├── ModelSelector (模型选择器)
├── PromptComposer (Prompt 输入区)
│   ├── PromptTextarea
│   ├── ReferenceImageUpload (仅 image-to-image)
│   └── PromptEnhanceButton
├── ParameterPanel (参数配置区)
│   ├── AspectRatioSelector
│   ├── ResolutionSelector
│   ├── OutputFormatSelector
│   └── ...其他参数
└── ActionBar (操作栏)
    ├── ImageCountSelector
    ├── CreditEstimate
    └── GenerateButton
```

### 2. Schema 驱动字段系统

每个模型页面提供字段 schema，描述需要展示的参数：

```typescript
interface FieldSchema {
  type: 'text' | 'select' | 'slider' | 'upload' | 'toggle';
  label: string;
  description?: string;
  defaultValue: any;
  options?: Array<{ label: string; value: any }>;
  visible?: boolean;
  required?: boolean;
}

interface PlaygroundSchema {
  prompt: FieldSchema;
  referenceImages?: FieldSchema; // 仅 image-to-image
  aspectRatio: FieldSchema;
  resolution: FieldSchema;
  outputFormat: FieldSchema;
  // ...其他字段
}
```

### 3. 桌面端/移动端分离

- 移动端：继续使用现有 `*-playground.tsx` 组件
- 桌面端：使用新的 `DesktopImagePlayground` 组件
- `desktop-image-ai-workbench.tsx` 根据设备类型选择渲染哪个组件

### 4. UI 规范（基于参考图片）

#### Model 选择器
- 高度：约 80px
- 背景：深色渐变 `linear-gradient(180deg, rgba(18, 22, 34, 0.96), rgba(13, 16, 26, 0.98))`
- 边框：`1px solid rgba(255, 255, 255, 0.08)`
- 圆角：`1.35rem`
- 内容：左侧图标（64x64）+ 模型名称 + 右侧箭头

#### Prompt 输入区
- 背景：同 Model 选择器
- 边框：`1px solid rgba(255, 255, 255, 0.08)`
- 圆角：`1.55rem`
- Textarea：最小高度 210px，透明背景，无边框
- 参考图片上传（image-to-image）：显示在 Prompt 上方或下方

#### 参数配置区
- 每个参数独立一行，带标签和控件
- 控件高度：`3.6rem`
- 控件圆角：`1rem`
- 控件背景：`rgba(7, 10, 18, 0.92)`
- 控件边框：`1px solid rgba(255, 255, 255, 0.08)`

#### 生成按钮
- 高度：`3.85rem`
- 圆角：`1.2rem`
- 背景：粉紫渐变 `linear-gradient(180deg, #ff2ec8, #f012af)`
- 边框：`1px solid rgba(255, 71, 194, 0.2)`
- 阴影：`inset 0 -4px 0 rgba(198, 10, 139, 0.65), 0 14px 30px rgba(240, 18, 175, 0.18)`

### 5. 实施策略

#### 阶段 1：创建基座组件
- 实现 `DesktopImagePlayground` 基座组件
- 实现 schema 解析和字段渲染逻辑
- 实现 Model 选择器、Prompt 输入区、参数面板、操作栏

#### 阶段 2：迁移 text-to-image
- 为所有 text-to-image 模型定义 schema
- 更新 `desktop-image-ai-workbench.tsx` 以使用新组件
- 移除旧的 CSS 覆写代码

#### 阶段 3：迁移 image-to-image
- 为所有 image-to-image 模型定义 schema
- 添加参考图片上传组件
- 验证所有模型页面

## 风险与缓解

### 风险 1：字段兼容性
现有 playground 组件的状态管理、校验逻辑、积分估算都在组件内部。

**缓解措施**：
- 新组件提供统一的状态管理 hook
- 保留现有的积分估算 hook（`useEstimateCredits`）
- 提供字段校验的统一接口

### 风险 2：渐进迁移
不同模型的参数不完全一致，必须提供降级方案。

**缓解措施**：
- Schema 支持可选字段
- 提供默认 schema 模板
- 缺失 schema 时回退到旧组件

### 风险 3：移动端影响
确保移动端不受影响。

**缓解措施**：
- 使用 `useIsMobile` hook 判断设备类型
- 移动端继续渲染旧组件
- 桌面端渲染新组件

## 待决问题

1. 是否需要为每个模型单独定义 schema，还是使用通用 schema + 模型特定覆盖？
2. 参考图片上传组件是放在 Prompt 上方还是下方？
3. 是否需要支持 schema 的动态加载（从服务端获取）？
