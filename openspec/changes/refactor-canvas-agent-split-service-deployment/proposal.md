# 变更：将 Canvas Agent 调整为同仓双服务部署

## 为什么

当前主站 Next.js 与 Mastra Canvas Agent 仍在同一运行链路中耦合：

- 主站 API route 直接在本进程内加载并执行 `src/mastra`
- Mastra observability、日志、运行时内存与主站进程绑定
- 本地开发和线上排障时，主站进程与 Mastra Studio 进程会产生观测割裂
- 后续 Agent 扩容、超时治理、灰度发布和故障隔离都难以独立进行

虽然当前已经完成了“同仓接入 Mastra”的第一阶段，但继续把 Agent 作为主站进程内模块运行，会让部署边界、观测边界和运行边界始终不清晰。

因此需要把 Canvas Agent 调整为“同一个仓库、两个独立服务”的部署模型：主站负责用户与业务边界，Agent 服务负责 Mastra runtime、workflow、tools 和模型执行。

## 变更内容

- 将 Canvas Agent 从“主站进程内执行”调整为“独立 Agent 服务执行”
- 保持同仓开发，不拆分仓库
- 主站继续保留现有 `/api/agent/canvas/*` 对外接口与鉴权职责
- 主站改为通过内部 HTTP 调用 Agent 服务，而不是直接 import `src/mastra`
- 新增 Agent 服务启动入口，独立承载 `src/mastra` 的 agents、workflows、tools、memory 与 observability
- 定义主站到 Agent 服务之间的内部鉴权、超时、错误映射和流式转发协议
- 明确项目数据、线程数据、消息持久化、积分扣减和生成状态回写的归属边界
- 允许主站与 Agent 服务分别部署、分别扩缩容、分别观察日志与 traces

## 非目标

- 不拆分代码仓库
- 不重写当前 Canvas Agent 的业务能力、prompt 逻辑或工作流语义
- 不在本次变更中替换现有图片 / 视频生成底层 API
- 不要求第一阶段引入新的消息队列、任务系统或分布式事件总线
- 不把任何模型 key、provider key 或内部服务密钥暴露到前端

## 影响

- 受影响规范：
  - `canvas-agent-platform`
  - `api-routing`
- 受影响代码：
  - `src/app/api/agent/canvas/message/route.ts`
  - `src/app/api/agent/canvas/*`
  - `src/mastra/index.ts`
  - 可能新增 `src/agent-server/*`
  - 可能新增 Agent 服务专用启动脚本与部署配置
  - 可能新增主站到 Agent 服务的内部 client / transport 层
