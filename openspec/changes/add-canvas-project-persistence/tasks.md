## 1. 方案与规范

- [ ] 1.1 新建 `add-canvas-project-persistence` proposal
- [ ] 1.2 为 `workflow-canvas-creator` 补充 project 持久化 spec 增量
- [ ] 1.3 完成 design 文档并确认可持久化状态边界

## 2. 数据层

- [ ] 2.1 在 `src/config/db/schema.ts` 新增 `workbench_canvas_project`
- [ ] 2.2 在 `src/config/db/schema.ts` 新增 `workbench_canvas_snapshot`
- [ ] 2.3 新增对应 migration
- [ ] 2.4 为 project 增加用户、更新时间、最近打开时间相关索引
- [ ] 2.5 为 snapshot 增加 project 唯一约束或等价当前快照约束

## 3. Model 层

- [ ] 3.1 新增 `src/shared/models/workbench-canvas-project.ts`
- [ ] 3.2 实现创建 project
- [ ] 3.3 实现获取 project 列表
- [ ] 3.4 实现读取单个 project
- [ ] 3.5 实现更新 project 元信息
- [ ] 3.6 实现保存 snapshot
- [ ] 3.7 实现读取 snapshot
- [ ] 3.8 实现 snapshot 版本校验

## 4. API 层

- [ ] 4.1 新增 `POST /api/workbench/canvas-projects`
- [ ] 4.2 新增 `GET /api/workbench/canvas-projects`
- [ ] 4.3 新增 `GET /api/workbench/canvas-projects/[id]`
- [ ] 4.4 新增 `PATCH /api/workbench/canvas-projects/[id]`
- [ ] 4.5 新增 `PUT /api/workbench/canvas-projects/[id]/snapshot`
- [ ] 4.6 接入登录鉴权与项目归属校验

## 5. 路由与页面壳

- [ ] 5.1 将 `/{locale}/create/canvas` 调整为创建入口或中转页
- [ ] 5.2 新增 `/{locale}/create/canvas/[projectId]`
- [ ] 5.3 在项目页接入 project + snapshot 服务端加载
- [ ] 5.4 未找到项目时返回合理空态或 404

## 6. Canvas Store 持久化适配

- [ ] 6.1 明确 graph store 的 persisted state 与 ephemeral state 分层
- [ ] 6.2 增加 graph serialize 方法
- [ ] 6.3 增加 graph deserialize / normalize 方法
- [ ] 6.4 首次加载 snapshot 时 hydrate 到 workspace provider
- [ ] 6.5 保存前剔除不可持久化状态

## 7. 首页高级模式链路

- [ ] 7.1 抽取首页 entry state 结构
- [ ] 7.2 新增 `Open in Canvas` 或等价高级模式入口
- [ ] 7.3 提交首页 `prompt / scene / model / params / ref` 到 create project API
- [ ] 7.4 服务端根据 entry state 构建初始 workflow node
- [ ] 7.5 如有参考图，创建初始输入节点和 `reference edge`
- [ ] 7.6 创建完成后跳转到 `/{locale}/create/canvas/{projectId}`

## 8. 自动保存

- [ ] 8.1 为可编辑 graph 变更建立 dirty 标记
- [ ] 8.2 为输入和拖拽变更建立 debounce 自动保存
- [ ] 8.3 为新增/删除节点和边建立即时保存
- [ ] 8.4 为生成成功插入 result node 建立即时保存
- [ ] 8.5 增加离页兜底保存

## 9. 结果资产挂接

- [ ] 9.1 确认 result node 保存 `creationRecordId`
- [ ] 9.2 生成成功后将 creation 信息写入 graph
- [ ] 9.3 用最近图片结果更新 project cover 候选
- [ ] 9.4 确认仍复用既有 `workbench_creation`

## 10. 验证

- [ ] 10.1 验证创建 project 后可稳定刷新恢复
- [ ] 10.2 验证自动保存后重新进入可恢复 graph
- [ ] 10.3 验证首页进入高级模式可创建带初始 workflow 的项目
- [ ] 10.4 验证未授权用户不能访问他人 project
- [ ] 10.5 验证前端未新增敏感 key
