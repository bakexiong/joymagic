# 设计文档：Create Canvas 工作流画布

## 上下文

用户已经多次明确，`/[locale]/create/canvas` 的目标不是“把现有表单搬进新页面”，而是一个接近 TapNow / Fresh Ideas 的真实创作画布：

- 全屏黑色无限画布
- 轻量图像/视频节点稀疏分布
- 节点之间以细曲线连接
- 选中节点后，在节点附近弹出 prompt composer，而不是固定右侧大面板
- 左侧保留工具轨道，底部保留缩放与导航控件
- 生成结果天然成为下一轮工作流的输入节点

同时，项目已有一套成熟的图片/视频生成链路、模型配置、上传能力、积分校验和模板体系。新设计必须建立在这些现有能力之上，而不是再造一套后台接口。

## 目标 / 非目标

- 目标：
  - 为 `/[locale]/create/canvas` 定义独立的桌面端画布产品形态
  - 使用 React Flow / XYFlow 实现真实的工作流画布、节点拖拽、缩放、平移与连接线生命周期
  - 让节点成为生成、引用、回流的核心交互单元
  - 让视觉风格明显区别于传统表单工作台，接近 TapNow 的创作氛围
  - 复用现有生成、上传、模板、积分和模型选择链路
- 非目标：
  - 不做多人协作和实时同步
  - 不重写现有模型配置注册系统
  - 不为每个字段都做通用可视化节点编辑器
  - 不要求移动端完整支持桌面级拖拽编排

## 决策

### 决策 1：Create Canvas 作为独立能力，而不是 desktop-playground 的另一种皮肤

Create Canvas 与现有 desktop-playground 在交互中心上完全不同：

- desktop-playground 以“表单”作为主对象
- create canvas 以“节点与结果链路”作为主对象

因此应将其视为独立能力，避免继续在旧工作台上堆样式或透传整个旧表单组件。

### 决策 2：采用“页面壳 + 画布引擎层 + DOM 浮层 + 生成适配层 + Agent 适配层”的五层结构

Create Canvas 的实现分为五层：

1. 页面壳
   - 负责路由、初始化数据、国际化、权限门控、页面级导航
2. 画布引擎层
   - 负责 React Flow 视口、节点渲染、边渲染、拖拽、缩放、平移和连接流程
3. DOM 浮层
   - 负责顶部栏、左侧轨道、底部缩放条、悬浮 composer、命令菜单
4. 生成适配层
   - 负责把节点上下文转成现有 workbench 生成参数
5. Agent 适配层
   - 负责未来聊天、灵感、节点创建、布局与更新动作的统一入口

这五层必须解耦，不得把旧 workbench 的整块 DOM 或整套表单直接塞进画布页面。

### 决策 3：使用 React Flow / XYFlow 作为唯一工作流画布承载层

页面必须使用 React Flow / XYFlow 实现以下能力：

- 无限工作流画布
- 默认滚轮 / 触摸板双指滑动平移
- `Ctrl / Cmd + 滚轮` 缩放
- 触控板双指捏合缩放
- 空白拖动画布
- 节点拖拽
- React Flow Handle 连接生命周期
- 自定义 Bezier Edge 与透明交互命中层
- 节点 DOM 与连接线 SVG 的分层渲染

React DOM 只承载浮层 UI，例如：

- 顶部标题和操作按钮
- 左侧工具轨道
- 底部缩放条
- 选中节点附近的悬浮 composer

Create Canvas 的鼠标 / 触摸板交互必须对齐 TapNow 当前画布页的主要规则：

- 默认滚轮不直接缩放，而是平移画布
- 触控板双指滑动按平移处理
- `Ctrl / Cmd + 滚轮` 触发缩放
- 触控板双指捏合触发缩放
- 双击不得触发画布缩放
- 用户在空白区域按下并拖动时，应直接平移画布
- 节点拖拽优先于画布平移
- 选择态与节点拖拽不得因为启用空白区拖动而失效

### 决策 4：用“节点原语”而不是“旧表单片段”组织交互

画布节点按职责分为以下几类：

1. 输入节点
   - 模板 prompt
   - 参考图
   - 历史结果
   - 上传素材
2. 生成节点
   - 当前工作流节点
   - 绑定 scene / model / prompt / 关键参数
3. 输出节点
   - 最新图像结果
   - 最新视频结果
   - 可再次引用为下一轮输入
4. 工具节点
   - 快速切换到其它图片/视频生成场景
5. 命令节点
   - 从已有节点继续派生下一步动作
   - 承载“文生图 / 图生图 / 图生视频 / 上传 / 模板”等快捷入口
6. 群组节点
   - 承载局部创作簇和语义区域

节点不追求流程编排平台那种“大而全”的表单能力，而是保持轻量信息密度，保证画布氛围。

### 决策 5：edge 必须具有语义，不得退化为纯视觉连线

画布 edge 至少分为以下几类：

- `reference`
  - 将上游媒体作为下游节点的参考输入
- `derivation`
  - 表示“从该节点继续生成”
- `result`
  - 表示某次生成的结果来自哪个工作流节点
- `control`
  - 表示工具节点、模板节点、场景切换节点对目标节点的影响
- `command`
  - 表示用户从某个节点拖出后产生的临时命令链路

edge 不仅用于绘制连线，还负责驱动：

- 输入类型约束
- 参数推导
- 结果回流
- command node 默认插入方向

### 决策 6：悬浮 composer 贴近选中节点，而不是固定侧栏

当用户选中当前生成节点或某个可编辑节点时，页面必须在节点附近显示悬浮 composer。该 composer 承担以下职责：

- 编辑 prompt
- 选择场景与模型
- 快捷切换纵横比 / 风格 / 数量等高频参数
- 对 image-to-image / image-to-video 场景插入参考图上传入口
- 触发生成

复杂低频参数不要求首版全部暴露，可采用“展开更多”或二级弹层，但不能回退为固定右侧完整表单。

### 决策 7：引入 command node / command menu 作为“下一步动作”机制

当用户从节点的输出 handle 发起连接，且未命中现有合法节点时，系统应在落点附近打开 command node 或 command menu，用于创建下一步节点，例如：

- 文生图
- 图生图
- 图生视频
- 首帧视频
- 提示词反推
- 上传参考图
- 套用模板

这样可以让“从节点继续创作”成为默认动作，而不是要求用户频繁回到侧边导航。

### 决策 8：聊天输入区是画布上下文输入层，而不是独立聊天框

页面底部或节点附近的 composer 必须支持以下上下文来源：

- 当前选中的工作流节点
- 主动 `@` 引用的画布节点
- 从灵感、历史、模板面板注入的上下文

未来 Agent 能力接入时，聊天输入区应复用同一套上下文模型，而不是维护另一份独立状态。

### 决策 9：复用现有生成链路，不新增画布专属后端协议

Create Canvas 的提交必须继续走现有能力：

- `playground-config-registry` 的场景配置
- `currentConfig.onGenerate(...)`
- 现有积分估算与访问校验
- 现有上传接口与 `ImageUploader`
- 现有模板 catalog 与生成记录接口

画布能力只负责组织状态，不负责替换底层生成协议。

### 决策 10：提前定义 Agent 接口层，但首版可只实现本地适配

Create Canvas 必须为后续 Agent 能力预留标准接口，包括：

- `readCanvasGraph`
- `readCanvasNodes`
- `createCanvasNode`
- `updateCanvasNode`
- `createCanvasEdge`
- `layoutCanvasNodes`
- `groupCanvasNodes`
- `focusCanvasNode`

首版可以只在前端本地实现这些接口，不要求接入真正的聊天 Agent，但接口形态必须稳定，避免未来二次拆底层。

## 目标架构

```text
CanvasPageShell
  -> CanvasWorkspaceProvider
    -> CanvasGraphStore
    -> CanvasRuntime
      -> ReactFlowStage
      -> TapnowCanvasNode
      -> TapnowCanvasEdge
    -> CanvasOverlayRoot
      -> CanvasTopBar
      -> CanvasToolRail
      -> CanvasBottomControls
      -> CanvasComposerPortal
      -> CanvasCommandMenu
      -> CanvasPanels (templates / history / assets)
    -> CanvasGenerationAdapter
    -> CanvasAgentAdapter
```

### 推荐模块目录

```text
src/shared/blocks/creator-workbench/canvas/
  page/
    canvas-page-shell.tsx
  core/
    canvas-workspace-provider.tsx
    canvas-graph-store.ts
    canvas-types.ts
    canvas-selectors.ts
  runtime/
    react-flow-stage.tsx
    react-flow-node.tsx
    react-flow-edge.tsx
    canvas-viewport-controller.ts
  nodes/
    render-node.tsx
    image-node.tsx
    video-node.tsx
    workflow-node.tsx
    result-node.tsx
    command-node.tsx
    template-node.tsx
  composer/
    canvas-composer.tsx
    canvas-context-chip.tsx
    canvas-reference-picker.tsx
  commands/
    canvas-command-menu.tsx
    canvas-command-registry.ts
  adapters/
    canvas-generation-adapter.ts
    canvas-agent-adapter.ts
    canvas-template-adapter.ts
    canvas-history-adapter.ts
  ui/
    canvas-top-bar.tsx
    canvas-tool-rail.tsx
    canvas-bottom-controls.tsx
```

## 画布信息架构

### 顶层布局

页面采用全屏画布布局：

1. 顶部左侧
   - 品牌/标题
   - 当前画布名称
2. 顶部右侧
   - 积分 pill
   - 社区入口
   - 分享按钮
3. 左侧浮动工具轨道
   - 新建节点
   - 工作流分类
   - 历史/评论/收藏等后续入口占位
4. 中央主区域
   - React Flow 画布
   - 节点与连接线
5. 底部左侧
   - 画布导航、缩放控件、帮助入口
6. 节点附近
   - 悬浮 composer

### 节点布局原则

- 默认使用稀疏布局，避免强制网格化密集排版
- 主工作流节点位于视觉中心偏右位置
- 历史输入节点散落在左侧和上方
- 新结果节点默认出现在当前工作流节点右侧或上方
- 节点允许拖拽后持久化到本地状态

## 数据模型

### CanvasGraph

```ts
type CanvasGraph = {
  id: string;
  locale: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewportState;
  selection: CanvasSelectionState;
  meta: CanvasGraphMeta;
};
```

### CanvasNode

```ts
type CanvasNode =
  | InputNode
  | WorkflowNode
  | ResultNode
  | ToolNode
  | CommandNode
  | GroupNode;
```

#### 共用字段

```ts
type CanvasNodeBase = {
  id: string;
  kind: 'input' | 'workflow' | 'result' | 'tool' | 'command' | 'group';
  subtype: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title?: string;
  status?: 'idle' | 'selected' | 'generating' | 'error';
  parentId?: string;
  data: Record<string, unknown>;
};
```

#### 推荐子类型

- 输入节点
  - `template`
  - `reference-image`
  - `reference-video`
  - `history-image`
  - `history-video`
  - `upload`
- 工作流节点
  - `image-generation`
  - `video-generation`
  - `image-edit`
  - `video-edit`
- 结果节点
  - `image-result`
  - `video-result`
- 工具节点
  - `scene-switcher`
  - `model-preset`
- 命令节点
  - `command-menu`
- 群组节点
  - `group`

### CanvasEdge

```ts
type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  semantic: 'reference' | 'derivation' | 'result' | 'control' | 'command';
  handles?: {
    source?: 'left' | 'right' | 'top' | 'bottom';
    target?: 'left' | 'right' | 'top' | 'bottom';
  };
  state?: 'idle' | 'highlighted' | 'disabled';
  data?: Record<string, unknown>;
};
```

### Composer Context

```ts
type CanvasComposerContext = {
  activeNodeId?: string;
  referencedNodeIds: string[];
  inferredInputs: {
    images: string[];
    videos: string[];
  };
  mode: 'node' | 'selection' | 'command';
};
```

## 关键交互流

### 从节点继续创作

1. 用户选中某个工作流节点或结果节点
2. 用户点击右侧 handle 或拖出一条连接
3. 若命中合法节点，创建语义 edge
4. 若未命中合法节点，在落点创建 command node / command menu
5. 用户选择“图生图 / 图生视频 / 提示词反推 / 上传素材 / 模板”
6. 系统创建目标节点、自动连线并将其设为当前编辑节点

### 结果回流

1. 用户在 workflow node 上触发生成
2. `canvas-generation-adapter` 将节点数据转换为现有生成参数
3. 系统走现有 workbench 配置与后端生成接口
4. 生成完成后插入 result node
5. result node 与 workflow node 建立 `result` edge
6. 用户可把 result node 继续接回新的 workflow node 作为 `reference` 输入

### 参数推导

当 edge 变化时，系统应执行有限推导：

- 有参考图接入时，工作流节点切换到图生图或图生视频语义
- 有视频参考接入时，隐藏不适配的图片专属参数
- 从模板节点接入时，回填 prompt、scene、model 与高频参数

## Agent 接口层

### 目标

将未来聊天与自动化动作统一映射到画布操作，而不是直接操作底层组件状态。

### 推荐接口

```ts
interface CanvasAgentAdapter {
  readCanvasGraph(): CanvasGraph;
  readCanvasNodes(nodeIds?: string[]): CanvasNode[];
  createNode(input: CreateCanvasNodeInput): CanvasNode;
  updateNode(nodeId: string, patch: Partial<CanvasNode['data']>): void;
  createEdge(input: CreateCanvasEdgeInput): CanvasEdge;
  layoutNodes(nodeIds?: string[]): void;
  groupNodes(nodeIds: string[]): CanvasNode;
  focusNode(nodeId: string): void;
}
```

### 与聊天输入区的关系

- 聊天输入区只写入 `CanvasComposerContext`
- Agent 层读取 `CanvasComposerContext` 与 `CanvasGraph`
- Agent 产生的结果以节点、边、布局变化回写画布

## 模块职责

### `canvas-graph-store`

- 持有节点、边、选中态、视口态
- 提供纯状态变更 action
- 不直接依赖 React Flow 或具体 UI

### `react-flow-stage`

- 负责 React Flow 视口、节点、边和连接事件桥接
- 将画布事件转发给 graph store
- 不负责任何业务生成逻辑

### `canvas-generation-adapter`

- 读取 workflow node 和其上游引用
- 转换为现有 `desktop-playground` 可消费的配置
- 调用现有访问校验、积分估算和生成提交逻辑

### `canvas-agent-adapter`

- 负责定义统一的“读画布 / 改画布”操作集
- 为未来 chat / automation / assistant 操作保留同一入口

### `canvas-command-registry`

- 维护 command node 可创建的节点类型
- 维护不同源节点下哪些命令可用
- 输出默认 node payload 和默认 edge semantic

## 视觉设计

### 视觉来源

本提案的页面样式以用户指定的 TapNow 页面为主要观察样本：

- `https://app.tapnow.ai/canvas/a40d6f74-459a-43f6-8613-7c34b4ee73da`

UI 规范仅提炼该页面中可直接观察到的布局和视觉规律，不声明复刻其内部代码实现。

### 总体气质

- 暗色、克制、专业
- 空间感比面板感更强
- 让用户感受到“在创作桌面上组织灵感”，而不是“在后台表单里填参数”

### 基于参考页提取的桌面 UI 规范

#### 页面构图

- 画布必须采用全屏无外框编辑器构图，避免传统站点内容容器宽度限制
- 视觉重心必须落在中右区域的工作流链路与 composer 上，而不是左上角导航或右侧表单栏
- 页面必须保留大面积留白，让节点链路在空旷画布中形成“工作桌面”感

#### 顶部信息层

- 左上角必须保留轻量品牌区和画布标题
- 右上角必须使用一组胶囊或圆角按钮承载积分、社区、分享等全局操作
- 顶部控件必须悬浮于画布之上，而不是占据独立 header 条

#### 左侧工具轨道

- 左侧工具轨道必须做成悬浮竖向胶囊，而不是标准 sidebar
- 轨道顶部主按钮必须明显大于其余按钮，用于新建或召唤命令
- 轨道内部按钮应采用统一尺寸的图标按钮，并通过分隔线划分功能组
- 轨道底部应预留头像、个人入口或工作空间入口

#### 底部控制条

- 底部左侧必须存在紧凑的导航与缩放条
- 缩放控制必须是短横条与拖钮组合，而不是原生浏览器样式
- 帮助或提示入口应与导航条形成单独的小圆按钮

#### 画布背景

- 背景必须是极深色底面加低对比点阵
- 点阵密度应均匀且细小，只提供尺度感，不应形成明显网格线
- 允许弱渐变或局部辉光，但不能让背景从“克制”变成“炫技”

#### 节点卡片比例

- 默认媒体节点应偏小，接近“缩略图卡片”而不是大面板
- 未填充内容的节点应优先显示媒体类型标签和居中占位图标
- 已有结果的节点应优先显示真实缩略图，标题保持简短
- 节点圆角应较大，接近参考页的柔和卡片语言

#### 连线样式

- 连线必须是轻薄曲线，不得使用流程图式粗线或箭头
- 默认连线亮度必须低于节点描边亮度
- 连线在选中、悬停或链路激活时才适度提亮
- 连线节点的连接点应足够克制，避免抢占视觉焦点

#### Composer 面板

- composer 必须是一个独立悬浮大卡片，锚定在节点链路附近，而非页面侧边
- composer 宽度必须显著大于普通节点，承担主输入职责
- composer 顶部应能容纳来源节点缩略图、上下文入口或添加引用按钮
- 中部必须是大面积 prompt 输入区
- 底部必须是高频参数与执行区，包含模型、比例、模式、倍率、提交按钮等
- 提交按钮必须放在最右侧，并成为底部操作栏的最强视觉锚点

#### 视觉层级

- 全局层级顺序应为：
  - 背景点阵
  - 节点与连线
  - 选中高亮
  - 悬浮工具轨道与顶部按钮
  - composer / command menu / 浮层面板
- 任何临时浮层都不得破坏画布的主空间感，避免出现大面积遮罩式侧栏

#### 动效原则

- 节点选中、composer 出现、command menu 弹出都应使用轻量缩放和透明度过渡
- 缩放和平移必须保持流畅，视觉上优先稳定，不追求夸张动画
- 连线高亮可以有极轻的发光或透明度变化，但不应使用厚重流光

### 背景

- 画布主色：近黑 `#050607` 到 `#0a0c10`
- 使用低对比点阵网格作为底纹
- 允许非常弱的径向辉光，但不得破坏整体克制风格

### 节点样式

- 默认节点：深灰卡片，细描边，轻阴影
- 选中节点：更亮的描边与轻微高光
- 占位图节点：显示媒体类型标签 + 居中占位图标
- 结果节点：优先显示真实缩略图
- 节点标题应短，避免大段说明文案堆叠

### 连接线

- 使用细曲线
- 默认透明度较低
- 选中链路时适度提亮
- 不使用厚重箭头和流程图式装饰

### 悬浮 composer

- 贴近节点，宽度明显大于普通节点
- 深色磨砂背景
- 结构自上而下：
  - 节点来源 / 引用缩略图
  - prompt 编辑区
  - 模型与快捷参数 chips
  - 底部操作栏（模型、比例、速度/数量、提交按钮）
- 提交按钮应是最强视觉锚点

### 建议设计 token

```text
canvas-bg: #060708
canvas-panel: rgba(26, 26, 28, 0.92)
canvas-panel-soft: rgba(36, 36, 40, 0.92)
canvas-stroke: rgba(255, 255, 255, 0.12)
canvas-stroke-active: rgba(255, 255, 255, 0.42)
canvas-text-primary: rgba(255, 255, 255, 0.94)
canvas-text-secondary: rgba(255, 255, 255, 0.62)
canvas-text-muted: rgba(255, 255, 255, 0.36)
canvas-accent: #ffffff
canvas-grid-dot: rgba(255, 255, 255, 0.08)
canvas-pill-bg: rgba(38, 38, 42, 0.92)
canvas-pill-stroke: rgba(255, 255, 255, 0.08)
canvas-toolbar-bg: rgba(28, 28, 31, 0.94)
canvas-toolbar-stroke: rgba(255, 255, 255, 0.1)
canvas-node-bg: rgba(34, 34, 36, 0.96)
canvas-node-placeholder: rgba(255, 255, 255, 0.18)
canvas-curve: rgba(255, 255, 255, 0.24)
canvas-curve-active: rgba(255, 255, 255, 0.56)
canvas-handle-ring: rgba(255, 255, 255, 0.18)
canvas-handle-ring-active: rgba(255, 255, 255, 0.68)
canvas-composer-bg: rgba(34, 34, 36, 0.96)
canvas-composer-shadow: 0 24px 60px rgba(0, 0, 0, 0.42)
```

### 组件级 UI 规范

#### 顶部胶囊按钮

- 高度建议 `40px - 48px`
- 水平内边距建议 `14px - 18px`
- 圆角建议 `16px - 18px`
- 背景使用 `canvas-pill-bg`
- 描边使用 `canvas-pill-stroke`

#### 左侧工具轨道

- 轨道宽度建议 `56px - 72px`
- 主按钮尺寸建议 `40px - 48px`
- 普通图标按钮尺寸建议 `18px - 22px`
- 轨道圆角应明显大于普通卡片

#### 媒体节点

- 标准节点宽度建议 `88px - 120px`
- 标准节点高度建议 `120px - 168px`
- 圆角建议 `18px - 22px`
- 标题与类型标签必须位于节点外缘或上方，避免压缩缩略图区域

#### Composer

- 宽度建议 `520px - 860px`
- 最小高度建议 `180px - 240px`
- 顶部引用区高度建议 `44px - 60px`
- Prompt 输入区应优先占据纵向空间
- 底部操作栏高度建议 `44px - 56px`

#### Command Menu

- 必须采用深色浮层卡片
- 每个命令项应包含图标、主标签、可选描述
- 命令项之间使用紧凑分组，而不是长菜单列表

## 交互设计

### 基础操作

- 用户可以滚轮缩放画布
- 用户可以拖动画布空白区域进行平移
- 用户可以拖动节点改变布局
- 用户点击节点后进入选中状态

### 节点选择与编辑

- 选中普通输入节点时，显示可引用/应用操作
- 选中当前工作流节点时，显示完整 composer
- 选中输出节点时，支持将结果重新注入当前工作流
- 切换选中节点时，悬浮 composer 跟随目标节点变化
- 从节点拖出未命中合法目标时，必须弹出 command node / command menu

### 生成流程

1. 用户选中当前工作流节点
2. 在悬浮 composer 中修改 prompt / 模型 / 高优参数
3. 点击生成
4. 系统走现有生成接口
5. 新输出结果以新节点形式回流到画布
6. 用户可继续将结果拖拽、引用、再生成

### 模板与历史

- 模板必须能以节点或快捷卡片形式进入画布
- 历史结果必须能被重新引用到当前生成节点
- 对 image-to-image / image-to-video，参考图必须可以来自上传或历史节点

## 渐进实施建议

### 阶段 A：单人本地工作流画布

- 完成 React Flow / XYFlow 视口
- 完成节点 / 边模型
- 完成 workflow node、result node、command node
- 接通现有图片视频生成链路

### 阶段 B：上下文 composer 与历史/模板回流

- 接入 `@` 上下文
- 接入模板和历史结果节点
- 完成参数回填和结果回流

### 阶段 C：Agent 原生能力

- 暴露 `canvas-agent-adapter`
- 接入聊天输入区
- 支持自动布局、自动创建节点、自动更新节点

## 首批组件实现顺序

### 第 1 批：先让独立画布壳和图模型成立

目标：

- 新路由具备独立页面壳
- 画布状态不再依附旧 workbench
- 后续组件可以围绕统一 graph store 迭代

文件：

- `src/app/[locale]/(landing)/create/canvas/page.tsx`
- `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
- `src/shared/blocks/creator-workbench/canvas/core/canvas-types.ts`
- `src/shared/blocks/creator-workbench/canvas/core/canvas-graph-store.ts`
- `src/shared/blocks/creator-workbench/canvas/core/canvas-workspace-provider.tsx`
- `src/shared/blocks/creator-workbench/canvas/core/canvas-selectors.ts`

### 第 2 批：跑通 React Flow / XYFlow 视口与画布层

目标：

- 用户可以看到真实画布
- 可以平移、缩放、定位节点
- 视口与状态容器打通

文件：

- `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-stage.tsx`
- `src/shared/blocks/creator-workbench/canvas/runtime/canvas-viewport-controller.ts`
- `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-edge.tsx`

### 第 3 批：实现最小可用节点集

目标：

- 先跑通创作闭环所需最少节点
- 暂不追求所有节点一次到齐

首批节点：

- `workflow-node`
- `result-node`
- `command-node`

文件：

- `src/shared/blocks/creator-workbench/canvas/nodes/render-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/nodes/workflow-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/nodes/result-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/nodes/command-node.tsx`

第二批节点：

- `image-node`
- `video-node`
- `template-node`

文件：

- `src/shared/blocks/creator-workbench/canvas/nodes/image-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/nodes/video-node.tsx`
- `src/shared/blocks/creator-workbench/canvas/nodes/template-node.tsx`

### 第 4 批：实现 command system

目标：

- 从节点继续创作成为默认手势
- 命令面板负责创建下一步节点

文件：

- `src/shared/blocks/creator-workbench/canvas/commands/canvas-command-registry.ts`
- `src/shared/blocks/creator-workbench/canvas/commands/canvas-command-menu.tsx`

建议 registry 首批命令：

- `text-to-image`
- `image-to-image`
- `image-to-video`
- `text-to-video`
- `upload-reference`
- `apply-template`

### 第 5 批：实现悬浮 composer

目标：

- 以 workflow node 为中心建立主编辑入口
- 支持 prompt、模型、高频参数和引用上下文

文件：

- `src/shared/blocks/creator-workbench/canvas/composer/canvas-composer.tsx`
- `src/shared/blocks/creator-workbench/canvas/composer/canvas-context-chip.tsx`
- `src/shared/blocks/creator-workbench/canvas/composer/canvas-reference-picker.tsx`

建议 `canvas-composer.tsx` 内先拆 4 个内部区块：

- header：当前节点、引用缩略图、添加上下文
- body：prompt 主输入区
- controls：scene / model / aspect ratio / count
- footer：积分估算、生成按钮、更多设置

### 第 6 批：接通现有生成链路

目标：

- 不重写生成协议
- workflow node 的提交完全复用现有图片/视频生成体系

文件：

- `src/shared/blocks/creator-workbench/canvas/adapters/canvas-generation-adapter.ts`

适配职责：

- 从 graph store 读取 active workflow node
- 聚合上游 `reference` / `control` / `template` edge
- 转成 `playground-config-registry` 可消费参数
- 调用现有访问校验、积分估算与生成提交逻辑
- 在成功后插入 `result-node`

### 第 7 批：接入模板与历史回流

目标：

- 实现真正的“结果继续创作”
- 模板和历史不再是页面外能力

文件：

- `src/shared/blocks/creator-workbench/canvas/adapters/canvas-template-adapter.ts`
- `src/shared/blocks/creator-workbench/canvas/adapters/canvas-history-adapter.ts`

### 第 8 批：收口 UI 框架层

目标：

- 让页面达到参考页的整体布局语言
- 但不与画布核心逻辑耦合

文件：

- `src/shared/blocks/creator-workbench/canvas/ui/canvas-top-bar.tsx`
- `src/shared/blocks/creator-workbench/canvas/ui/canvas-tool-rail.tsx`
- `src/shared/blocks/creator-workbench/canvas/ui/canvas-bottom-controls.tsx`

### 第 9 批：预留 Agent 原生能力

目标：

- 先把接口立住
- 后续可逐步接聊天和自动化能力

文件：

- `src/shared/blocks/creator-workbench/canvas/adapters/canvas-agent-adapter.ts`

推荐首版接口：

- `readCanvasGraph`
- `readCanvasNodes`
- `createNode`
- `updateNode`
- `createEdge`
- `layoutNodes`
- `groupNodes`
- `focusNode`

## 文件级拆分清单

```text
src/app/[locale]/(landing)/create/canvas/
  page.tsx

src/shared/blocks/creator-workbench/canvas/
  page/
    canvas-page-shell.tsx
  core/
    canvas-types.ts
    canvas-graph-store.ts
    canvas-workspace-provider.tsx
    canvas-selectors.ts
  runtime/
    react-flow-stage.tsx
    canvas-viewport-controller.ts
    react-flow-node.tsx
    react-flow-edge.tsx
  nodes/
    render-node.tsx
    workflow-node.tsx
    result-node.tsx
    command-node.tsx
    image-node.tsx
    video-node.tsx
    template-node.tsx
  commands/
    canvas-command-registry.ts
    canvas-command-menu.tsx
  composer/
    canvas-composer.tsx
    canvas-context-chip.tsx
    canvas-reference-picker.tsx
  adapters/
    canvas-generation-adapter.ts
    canvas-template-adapter.ts
    canvas-history-adapter.ts
    canvas-agent-adapter.ts
  ui/
    canvas-top-bar.tsx
    canvas-tool-rail.tsx
    canvas-bottom-controls.tsx
```

## 最小可上线范围

如果首版需要压缩范围，建议只上线以下文件组合：

- `page.tsx`
- `canvas-page-shell.tsx`
- `canvas-types.ts`
- `canvas-graph-store.ts`
- `canvas-workspace-provider.tsx`
- `react-flow-stage.tsx`
- `canvas-viewport-controller.ts`
- `react-flow-node.tsx`
- `react-flow-edge.tsx`
- `render-node.tsx`
- `workflow-node.tsx`
- `result-node.tsx`
- `command-node.tsx`
- `canvas-command-registry.ts`
- `canvas-command-menu.tsx`
- `canvas-composer.tsx`
- `canvas-generation-adapter.ts`
- `canvas-top-bar.tsx`
- `canvas-tool-rail.tsx`
- `canvas-bottom-controls.tsx`

这一版就可以先完成：

- 独立画布
- 节点拖拽/缩放/平移
- workflow node 生成
- result node 回流
- command node 派生下一步
- TapNow 风格的主界面骨架

## 技术方案

### 组件分层

```text
CanvasCreatorWorkbench
├── CanvasChrome
│   ├── HeaderActions
│   ├── LeftToolRail
│   └── BottomViewportControls
├── ReactFlowStage
│   ├── NodeRenderer
│   ├── EdgeRenderer
│   └── SelectionSync
└── FloatingNodeComposer
    ├── PromptEditor
    ├── SceneModelSwitchers
    ├── QuickParams
    ├── ReferenceMediaPicker
    └── GenerateActionBar
```

### 状态分层

- 画布状态：
  - 节点列表
  - 边列表
  - 节点坐标
  - 当前选中节点
  - 视口缩放与平移
- 生成状态：
  - 当前 scene / model
  - currentValues
  - isGenerating
  - requiredCredits
- 数据来源：
  - 模板 catalog
  - 历史 creations
  - 上传资源

### 降级策略

- 桌面端提供完整 React Flow / XYFlow 画布
- 小屏设备可降级为简化模式：
  - 保留节点流
  - 减少自由拖拽
  - composer 改为底部抽屉

## 风险 / 权衡

- 风险：React Flow 画布与 React 浮层定位同步复杂
  - 缓解：将节点世界坐标与视口变换统一管理，明确 screen/world 映射层
- 风险：现有表单逻辑字段很多，首版 composer 难以完全覆盖
  - 缓解：首版只暴露高频参数，低频参数通过“更多设置”展开
- 风险：画布样式过重会影响性能
  - 缓解：保持节点视觉简洁，避免大面积实时模糊和复杂阴影
- 风险：不同场景字段差异较大
  - 缓解：使用 schema 驱动的高频字段映射，允许场景级覆盖

## 迁移计划

1. 先完成 OpenSpec 提案与设计确认
2. 基于现有 `/[locale]/create/canvas` 路由重构画布骨架
3. 先接入 text-to-image / text-to-video 的高频流程
4. 再补齐 image-to-image / image-to-video 的参考图引用能力
5. 最后处理节点细节、动画和本地布局持久化

## 待决问题

- 首版是否要求所有模型场景都在画布模式可用，还是优先覆盖主流图片/视频场景
- 低频参数采用抽屉、Popover 还是独立详情面板
- 结果节点布局是否需要自动避让，还是首版先用简单生成位置策略
