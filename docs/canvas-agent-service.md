# Canvas Agent 双服务开发说明

## 目标

当前仓库支持同仓双服务开发：

- 主站服务：Next.js
- Agent 服务：独立的 Mastra Server，内部承载 `src/mastra`

## 开发命令

```bash
pnpm dev:web
pnpm dev:agent
```

Agent 服务默认端口：

```text
http://127.0.0.1:4112
```

Mastra Studio UI 建议单独启动，并显式指向 Agent 服务：

```bash
pnpm mastra:studio
```

默认入口：

```text
Studio UI: http://127.0.0.1:4111
Agent API:  http://127.0.0.1:4112
```

这样 `Traces` / `Logs` / `Metrics` 看到的就是 `dev:agent` 那个 Mastra 进程的数据，不再和主站进程混淆。

## 环境变量读取

- 主站继续使用 Next.js 默认的 `.env.development` / `.env.local`
- Agent 服务通过 `mastra dev/start/studio --env .env.agent.development` 显式读取根目录 `.env.agent.development`
- 如需额外兜底，可继续保留根目录 `.env`

建议新增：

```bash
.env.agent.development
```

例如：

```bash
CANVAS_AGENT_INTERNAL_TOKEN=your-shared-token
CANVAS_AGENT_SERVICE_PORT=4112
CANVAS_AGENT_SERVICE_HOST=127.0.0.1
```

## 主站接入 Agent 服务

当主站需要把 Canvas Agent 请求转发给独立 Agent 服务时，请设置：

```bash
CANVAS_AGENT_SERVICE_URL=http://127.0.0.1:4112
CANVAS_AGENT_INTERNAL_TOKEN=your-shared-token
```

Agent 服务本身也需要相同的：

```bash
CANVAS_AGENT_INTERNAL_TOKEN=your-shared-token
```

如未设置 `CANVAS_AGENT_SERVICE_URL`，主站会继续回退到本地进程内执行。

## 内部接口

- `POST /internal/canvas-agent/message`
- `GET /internal/health`

这些接口默认仅供主站内部调用，不应直接暴露给前端。

## Observability 对齐

如果要在 Mastra Studio 里看到主站转发出来的 Canvas Agent traces，请使用下面这组进程：

```bash
pnpm dev:agent
pnpm mastra:studio
pnpm dev:web
```

其中：

- `dev:agent` 负责真正执行 Mastra agents / workflows / tools
- `mastra:studio` 只是 UI，连接到 `dev:agent`
- `dev:web` 负责把主站请求转发到 `CANVAS_AGENT_SERVICE_URL`

不要再把 Studio UI 接到主站进程，也不要尝试让多个进程共享同一个 DuckDB 文件。
