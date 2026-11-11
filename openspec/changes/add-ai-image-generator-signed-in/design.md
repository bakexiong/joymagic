# 架构设计：AI Image Generator 已登录态组件

## 现状分析

### 当前架构

```
AiImageGeneratorShell (登录态分支)
├── user === null → AiImageGeneratorGuest
│   ├── 场景/模型选择 → router.push(url) 跳转到对应页面
│   └── 表单内嵌展示（预览性质，最终需跳转）
└── user !== null → 临时占位符 + 旧版 ImageGenerator（待替换）
```

### Guest 组件的关键行为

1. **场景切换** (`handleSceneChange`)：更新 state + 如果有目标 URL 则 `router.push()`
2. **模型切换** (`handleModelChange`)：更新 state + `router.push(modelUrl)`
3. **表单渲染**：通过 `FORM_COMPONENTS[targetUrl]` 动态加载对应表单组件

这意味着 Guest 组件中，场景/模型切换最终会导致页面跳转，表单仅作为预览。

### 与现有提案的关系

- `update-ai-image-generator-guest-entry` 已将 `/ai-image-generator` 重新定义为入口页容器，并把未登录态设计为独立组件
- 本提案在其基础上补足登录态分支，不重新定义入口页视觉和信息架构
- `update-mobile-image-ai-pages` 面向所有图片 AI 路由的移动端统一编排；本提案只处理 `/ai-image-generator` 登录态同页切换，不改动其他路由的跳转模型

## 设计方案

### 方案选择：提取公共模块 + 新增 SignedIn 组件

```
ai-image-generator/
├── ai-image-generator-shell.tsx    # 登录态分支（修改）
├── ai-image-generator-guest.tsx    # 未登录态（不修改逻辑）
├── ai-image-generator-signed-in.tsx # 已登录态（新增）
└── ai-image-generator-shared.ts    # 公共模块（新增）
```

### 公共模块提取（ai-image-generator-shared.ts）

从 `ai-image-generator-guest.tsx` 提取以下共享内容：

| 提取内容 | 说明 |
|---------|------|
| `SceneNode` / `ModelNode` 类型 | 场景和模型的数据类型 |
| `FORM_COMPONENTS` | 表单组件映射表 |
| `WORKBENCH_*_CLASS` 常量 | UI 样式常量（6个） |
| `DynamicBlockLoading` | 动态加载占位组件 |
| `extractImageAiScenes()` | 从 navItems 提取场景函数 |
| `findFirstSceneWithWorkspace()` | 查找默认场景函数 |
| `toId()` / `normalizeItem()` | 工具函数 |
| `GeneratorBlockProps` 类型 | 表单组件 Props 类型 |

### SignedIn 组件与 Guest 组件的差异对比

| 维度 | Guest (未登录) | SignedIn (已登录) |
|------|---------------|------------------|
| 场景切换 | `router.push(url)` 跳转 | 仅更新 state，不跳转 |
| 模型切换 | `router.push(modelUrl)` 跳转 | 仅更新 state，不跳转 |
| 表单位置 | 嵌入页面（预览性质） | 嵌入页面（正式使用） |
| 路由依赖 | 需要 `useRouter` | 不需要 `useRouter` |
| UI 布局 | 深色工作台 + 场景/模型选择器 + 表单 | **完全相同** |
| CSS 类名 | 所有 WORKBENCH_* 常量 | **完全相同** |
| 移动端/桌面端分支 | `isMobile` 条件渲染 | **完全相同** |

### Shell 组件修改

```typescript
// 修改前
if (!user) {
  return <AiImageGeneratorGuest navItems={navItems} title={title} />;
}
return <临时占位符 + 旧版 ImageGenerator />;

// 修改后
if (!user) {
  return <AiImageGeneratorGuest navItems={navItems} title={title} />;
}
return <AiImageGeneratorSignedIn navItems={navItems} title={title} />;
```

### 数据流

```
navItems (服务端 props)
  └→ extractImageAiScenes() 提取场景树
      └→ selectedSceneId (state) ←→ Scene Select
      └→ selectedModelUrl (state) ←→ Model Select
          └→ currentTargetUrl (derived)
              └→ FORM_COMPONENTS[url] → 动态表单组件
```

已登录态的数据流与未登录态完全相同，唯一区别是**切换事件不触发 `router.push()`**。

## 实施约束

### UI 一致性约束

- 已登录态组件必须复用未登录态同一套 JSX 结构、类名和工作台样式常量
- 允许抽取公共片段，但不得在登录态顺带调整标题区、选择器层级、表单容器尺寸或响应式断点
- 若共享提取导致 Guest 组件行为变化，则该提取方案不可接受

### 状态约束

- `selectedSceneId`、`selectedModelUrl` 的初始化逻辑必须继续由 `navItems` 推导，不得引入第二套静态配置
- 已登录用户切换 scene 时，若目标 scene 含模型列表，必须立即把 `selectedModelUrl` 重置为首个模型
- 已登录用户切换到无模型列表的 scene 时，模型选择器必须隐藏，工作区直接渲染该 scene 对应表单
- 浏览器地址栏和路由上下文在整个切换过程中保持 `/ai-image-generator`

### 兼容性约束

- 表单组件若依赖目标路由做内部初始化，需要在实施阶段逐一验证其是否能在固定 URL 下正常工作
- 本提案不修改任何 playground 组件；若发现某组件强依赖当前 pathname，应在实施阶段单独登记为阻塞或后续变更

## 权衡考虑

### 为什么不直接复用 Guest 组件 + 传参控制行为？

虽然 Guest 和 SignedIn 的 UI 完全一致，但将导航行为通过 prop 注入会引入额外的条件分支，增加 Guest 组件的复杂度。考虑到：

1. Guest 组件已经相当复杂（590+ 行），不宜继续膨胀
2. 未来已登录态可能增加积分显示、历史记录等差异化功能
3. 两个组件共享公共模块即可避免代码重复

因此选择**提取公共模块 + 独立组件**的方案。

### 为什么不用 HOC 或 renderProps 模式？

场景/模型选择器和表单区域的 UI 结构虽然相同，但 JSX 层级较深（移动端和桌面端各一套），使用 HOC 或 renderProps 会导致代码可读性下降。直接复制 UI 结构并在 shared 模块中共享数据和样式是更务实的做法。
