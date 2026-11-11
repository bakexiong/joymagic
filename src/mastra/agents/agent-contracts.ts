export const CANVAS_AGENT_BOUNDARY_SUMMARY = {
  runtime:
    "Mastra 运行在服务端，负责意图理解、工具决策、工作流执行；Next.js API routes 负责鉴权、会话落库、计费和响应编排；项目模型层继续作为快照、聊天记录、资产和任务状态的真相源。",
  guarantees: [
    "前端不持有新增敏感 key",
    "Agent 不直接操作 React 组件或 DOM",
    "所有持久化写入必须走服务层或正式工具",
  ],
};
