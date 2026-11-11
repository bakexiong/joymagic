# 变更：为 Create Canvas 增加 Project 持久化能力

## 为什么

当前 `/{locale}/create/canvas` 已具备独立工作流画布能力，但仍然以页面级临时状态为主，缺少真正的项目实体与持久化机制，无法满足以下需求：

- Canvas 必须作为高级模式长期存在，而不是一次性临时编辑器
- 用户进入 Canvas 后应拥有独立 project，用于承载当前创作过程
- 画布节点、连线、视口和结果回流需要在刷新、离开页面、再次打开时恢复
- 首页进入高级模式时，需要先创建 project，再将 prompt、scene、model、params、ref 注入画布
- 后续“最近项目”“继续编辑”“复制项目”“项目封面”“项目分享”都依赖稳定的 project 根实体

因此需要为 Create Canvas 增加 project 持久化能力，并明确路由、数据模型、保存机制和恢复流程。

## 变更内容

- 新增 `workbench_canvas_project` 作为 Canvas 高级模式的项目根实体
- 新增 `workbench_canvas_snapshot` 作为当前画布图状态的持久化存储
- 将 `/{locale}/create/canvas` 调整为新建项目入口或中转页
- 新增 `/{locale}/create/canvas/[projectId]` 作为真正的 Canvas 编辑页
- 定义首页进入高级模式时的“创建 project + 注入初始 workflow node”链路
- 定义 Canvas 自动保存、关键动作即时保存和恢复加载机制
- 定义 Canvas graph 的可持久化边界与运行时边界
- 约束生成结果继续复用现有 `workbench_creation` 资产体系，而非新建独立资产协议

## 影响

- 受影响规范：`workflow-canvas-creator`
- 受影响代码：
  - `src/app/[locale]/(canvas)/create/canvas/page.tsx`
  - 新增 `src/app/[locale]/(canvas)/create/canvas/[projectId]/page.tsx`
  - `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
  - `src/shared/blocks/creator-workbench/canvas/core/*`
  - `src/config/db/schema.ts`
  - `src/config/db/migrations/*`
  - 新增 `src/shared/models/workbench-canvas-project.ts`
  - 新增 `src/app/api/workbench/canvas-projects/*`

## 非目标

- 不在本次实现多人协作、实时同步或评论能力
- 不在本次实现完整版本历史与回滚 UI
- 不替换现有普通 workbench 的轻量生成模式
- 不新增前端密钥或绕过既有服务端生成链路
