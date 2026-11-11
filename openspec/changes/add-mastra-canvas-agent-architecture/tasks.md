## 1. 架构与依赖

- [x] 1.1 引入 Mastra 运行时依赖，并确定使用的 storage provider
- [x] 1.2 创建 `src/mastra/` 目录与主 `Mastra` 实例
- [x] 1.3 明确 Mastra 与现有 Next.js / API route / 项目模型层的边界
- [x] 1.4 在当前项目内新增 `src/shared/services/canvas-agent/` 作为 Mastra 与现有服务层的桥接层
- [x] 1.5 创建 `canvas-agent-workspace`，接入 Mastra Workspace Skills 能力

## 2. Agent 分层

- [x] 2.1 定义 `canvas-supervisor-agent`
- [x] 2.2 定义 `intent-planner-agent`
- [x] 2.3 定义 `scene-router-agent`
- [x] 2.4 定义 `prompt-refiner-agent`
- [x] 2.5 定义 `response-composer-agent`
- [x] 2.6 为各 Agent 编写清晰的 `description`、`instructions` 与输入输出契约

## 2A. Skills 层

- [x] 2A.1 设计 `src/mastra/skills/*` 目录结构，确保每个 skill 以 `SKILL.md` 为入口
- [x] 2A.2 接入 Mastra Workspace Skills 的发现、读取与搜索能力
- [x] 2A.3 先提供通用 skill 模板与占位目录，不预置正式业务 skill 内容
- [x] 2A.4 预留显式 `skillId` 与自动 skill 路由能力的协议位置，但具体 skill 后续再补
- [x] 2A.5 如前端需要展示卡片元数据，补充轻量 skill registry，但不替代 Workspace Skills 正文

## 3. Tool 层

- [x] 3.1 封装画布读取工具：读取项目、图快照、选中节点、引用节点
- [x] 3.2 封装画布写入工具：创建节点、更新节点、创建边、布局节点
- [x] 3.3 封装生成工具：复用现有图片 / 视频生成链路
- [x] 3.4 封装上传 / 模板 / 历史资产工具
- [x] 3.5 为关键工具增加输入 schema、权限校验与审计日志
- [x] 3.6 增加 `@参考图` 解析工具，统一解析上传图片、画布节点和历史素材引用

## 3A. 计费层

- [x] 3A.1 新增 `canvas-agent-billing` 服务，复用现有积分消费与返还逻辑
- [x] 3A.2 定义聊天计费的 `scene`、`description` 和 metadata 结构
- [x] 3A.3 将聊天计费接入 `POST /api/agent/canvas/message` 入口，而不是分散到 tool 内
- [x] 3A.4 明确聊天失败返还、生成失败返还和重复消息幂等扣费规则

## 4. Workflow 层

- [x] 4.1 定义“聊天请求处理工作流”
- [x] 4.2 定义“结构化操作计划校验与落图步骤”
- [x] 4.3 定义独立“生成执行与结果回流工作流”
- [x] 4.4 定义失败恢复、重试与幂等策略
- [x] 4.5 定义基于 skill 的工作流骨架实例化与自动节点生成步骤

## 5. Memory 与会话

- [x] 5.1 定义 `threadId` 与 `resourceId` 规则
- [x] 5.2 接入消息历史存储
- [x] 5.3 定义项目级聊天会话与消息记录模型，确保每条消息都关联 `projectId`
- [x] 5.4 实现按 `projectId` 恢复最近会话与聊天列表的查询能力
- [x] 5.5 区分 memory 上下文与正式聊天记录的职责边界
- [x] 5.6 规划 working memory 中的用户偏好 / 品牌偏好 / 当前项目目标
- [x] 5.7 规划 observational memory 与 semantic recall 的启用策略
- [x] 5.8 新增聊天线程、消息、消息附件、消息引用四张表及对应迁移

## 6. Editor 与版本管理

- [x] 6.1 接入 `MastraEditor`
- [x] 6.2 定义 code-defined agent 与 editor override 的边界
- [x] 6.3 规划 draft / published / archived 版本流转
- [x] 6.4 规划 staging / production 的版本 targeting 策略

## 7. 接口与前端适配

- [x] 7.1 设计 `canvas agent` 服务端 API：session / message / thread
- [x] 7.2 将前端 `canvas-agent-adapter` 改为调用服务端而非本地伪编排
- [x] 7.3 定义消息流、状态事件和结构化操作返回格式
- [x] 7.4 保证前端不新增敏感 key
- [x] 7.5 保留前端本地 fallback 作为迁移期回滚开关
- [x] 7.6 支持前端传递可选 `skillId`，但第一期不要求提供正式 skill 列表或自动判定结果
- [x] 7.7 在消息响应中返回聊天计费结果，便于前端展示余额变化和扣费反馈
- [x] 7.8 支持同一 `canvas project` 下创建多个聊天线程，并在右侧 Dock 中提供新建会话、历史会话查看与切换能力
- [x] 7.8 支持消息携带上传图片 attachments，并支持正文中的 `@参考图` 引用解析
- [x] 7.9 在线程读取接口中返回规范化的 `attachments` 与 `mentionedReferences`
- [x] 7.10 在消息流中持久化场景参数卡，并统一通过 `json-render` 渲染建议卡、场景参数卡和生成状态卡
- [x] 7.11 增加 `Ask / Auto` 双模式：Ask 先搭图并要求确认，Auto 直接提交生成
- [x] 7.12 对过短输入执行提示词优化，并在首次文本消息时自动创建优化后的文本节点
- [x] 7.13 上传图片自动初始化参考图节点，并把文本节点 / 参考图节点 / 工作流节点自动编组

## 8. 观测与治理

- [x] 8.1 规划 Agent / Workflow / Tool 的 tracing 与日志字段
- [x] 8.2 规划失败分类、告警和人工回放能力
- [x] 8.3 规划后续评测与自动调优接入点

## 9. 交付收口

- [x] 9.1 更新相关规范
- [x] 9.2 记录同仓接入的迁移顺序与回滚策略
- [x] 9.3 运行 OpenSpec 校验（若本地环境具备 `openspec-cn`）
