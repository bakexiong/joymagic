# 设计文档：Canvas Project 持久化

## 上下文

Create Canvas 已具备基于 React Flow 的画布能力，但当前状态主要保存在前端 store 内。用户希望 Canvas 作为高级模式长期存在，因此必须具备 project 根实体、持久化快照和恢复能力。

项目已有 `workbench_creation`、`workbench_collection`、`workbench_upload` 等数据模型，说明当前产品域已经采用 `workbench_*` 作为创作资产系统前缀。Canvas 的持久化设计应延续这一命名和分层风格。

## 目标 / 非目标

- 目标：
  - 为 Canvas 建立稳定的 project 根实体
  - 支持 graph 的创建、保存、加载与恢复
  - 支持首页进入高级模式时自动创建带初始 workflow 的项目
  - 与现有 workbench 资产体系兼容
  - 为后续最近项目、复制项目、项目封面、版本历史预留演进空间
- 非目标：
  - 不做多人协作
  - 不做复杂 merge 或协同冲突解决
  - 不做完整版本历史 UI
  - 不替代普通模式的轻量生成流程

## 决策

### 决策 1：Canvas 必须采用 project + snapshot 的双层持久化模型

持久化分两层：

1. `workbench_canvas_project`
   - 承担项目元信息
   - 包括用户归属、标题、封面、入口上下文、最近打开时间
2. `workbench_canvas_snapshot`
   - 承担当前画布图状态
   - 包括 graph JSON、meta JSON、版本号

这样可以避免将所有持久化责任压到单表上，并为未来版本历史保留空间。

### 决策 2：真正的编辑器页必须使用带 projectId 的路由

- `/{locale}/create/canvas`
  - 新建项目入口页或中转页
- `/{locale}/create/canvas/{projectId}`
  - 真正编辑页

这样可以确保：

- 每个高级模式画布都拥有稳定 URL
- 刷新与恢复有明确标识
- 后续最近项目、复制项目和分享能力具备自然落点

### 决策 3：graph 只保存稳定文档状态，不保存临时 UI 运行态

可持久化：

- `nodes`
- `edges`
- `viewport`
- `selection`
- `composer references`
- `graph meta`

不可持久化：

- command menu open state
- context menu anchor
- hover state
- object URL
- upload in progress 临时状态
- polling queue
- toast state

### 决策 4：首页高级模式入口必须由后端创建初始项目

当用户从首页点击 `Open in Canvas` 时，不应先进入本地空画布再前端拼接初始节点。正确流程为：

- 前端提交首页输入
- 后端创建 project
- 后端生成初始 graph
- 保存 snapshot
- 返回 `projectId`
- 前端跳转到项目编辑页

这样可以保证刷新、恢复、分享和重复打开时行为一致。

### 决策 5：结果资产继续复用 workbench_creation

Canvas 的 result node 不应成为独立资产源。生成成功后仍由既有 `workbench_creation` 保存资产记录，Canvas 只在 graph 中引用 creation 信息，例如：

- `creationRecordId`
- `url`
- `sceneId`
- `modelUrl`
- `prompt`

这可以保持画布结构与资产库解耦。

## 数据模型

### workbench_canvas_project

- `id`
- `user_id`
- `name`
- `mode`
- `status`
- `cover_url`
- `entry_scene_id`
- `entry_model_url`
- `last_opened_at`
- `created_at`
- `updated_at`

### workbench_canvas_snapshot

- `id`
- `project_id`
- `user_id`
- `version`
- `graph_json`
- `meta_json`
- `created_at`
- `updated_at`

首版采用“每个 project 一条当前 snapshot”的简化模式，后续再演进为历史版本链。

## 持久化图模型

建议保存结构：

```ts
type PersistedCanvasGraph = {
  schemaVersion: 1;
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  selection: {
    nodeId: string | null;
    edgeId: string | null;
  };
  composer: {
    nodeId: string | null;
    references: string[];
  };
  meta: {
    title?: string;
    coverUrl?: string | null;
    source?: "homepage" | "canvas" | "template" | "history";
    entrySceneId?: string | null;
    entryModelUrl?: string | null;
    lastGeneratedAt?: string | null;
  };
};
```

## API

- `POST /api/workbench/canvas-projects`
  - 创建 project
  - 可接收首页 entry payload
- `GET /api/workbench/canvas-projects`
  - 获取项目列表
- `GET /api/workbench/canvas-projects/[id]`
  - 获取项目和 snapshot
- `PATCH /api/workbench/canvas-projects/[id]`
  - 更新标题、封面、状态等元信息
- `PUT /api/workbench/canvas-projects/[id]/snapshot`
  - 保存 graph snapshot

## 保存策略

1. 自动保存
   - 对输入与拖拽类变更采用 1 到 1.5 秒防抖保存
2. 即时保存
   - 新增节点
   - 删除节点
   - 删除边
   - 生成成功插入 result node
   - 首页初始项目创建后的首次快照
3. 离页兜底
   - 页面隐藏或关闭前执行最后一次轻量保存

## 冲突策略

snapshot 保存带版本号：

- 请求必须带 `expectedVersion`
- 若版本不一致，返回冲突错误
- 首版不做自动 merge，只提示刷新

## 恢复策略

加载 snapshot 后，前端需执行 normalize：

- 清理无效 node
- 清理 dangling edge
- 修正非法 selection
- 忽略不存在的临时状态字段
- 根据 `schemaVersion` 做兼容转换
