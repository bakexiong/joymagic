## 1. 服务拆分方案

- [ ] 1.1 设计主站与 Agent 服务的职责边界
- [ ] 1.2 设计内部调用协议、鉴权方式与超时策略
- [ ] 1.3 确定本地开发端口、脚本和部署入口

## 2. Agent 服务入口

- [ ] 2.1 新增 Agent 服务启动入口并复用现有 `src/mastra` 注册逻辑
- [ ] 2.2 提供内部 `message` 与 `stream` 接口
- [ ] 2.3 增加健康检查与基础日志

## 3. 主站转发层

- [ ] 3.1 将 `/api/agent/canvas/message` 改为远程调用 Agent 服务
- [ ] 3.2 将流式消息接口改为远程透传
- [ ] 3.3 保持现有前端响应协议与 fallback 开关兼容

## 4. 共享边界治理

- [ ] 4.1 清理 tools / workflows 中对主站进程内状态的隐式依赖
- [ ] 4.2 显式传递 `userId / projectId / threadId / resourceId` 等上下文
- [ ] 4.3 校验数据库、对象存储和生成服务在双服务模式下的访问路径

## 5. 观测与发布

- [ ] 5.1 为 Agent 服务独立配置 observability、日志与运行指标
- [ ] 5.2 增加服务鉴权失败、上游超时、上游错误的分类日志
- [ ] 5.3 记录回滚方案与灰度发布步骤
- [ ] 5.4 运行 `openspec-cn validate refactor-canvas-agent-split-service-deployment --strict --no-interactive`
