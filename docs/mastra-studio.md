# Mastra Studio 本地入口

这个项目现在把 Mastra Agent 服务和 Mastra Studio UI 分开启动：

- `pnpm dev:agent`：真正执行 Agent / Workflow / Tools
- `pnpm mastra:studio`：只启动 Studio UI，并连接到 `dev:agent`

## 启动方式

在项目根目录运行：

```bash
pnpm dev:agent
pnpm mastra:studio
```

如果你需要看更详细的 Mastra 调试日志：

```bash
pnpm mastra:studio:debug
```

## 默认地址

Mastra Studio 默认会启动在：

```text
http://localhost:4111
```

常用入口：

- Studio: `http://localhost:4111`
- Agent API: `http://127.0.0.1:4112/api`
- Agent Health: `http://127.0.0.1:4112/internal/health`
- Agent Swagger UI: `http://127.0.0.1:4112/swagger-ui`

## 说明

- `pnpm dev:agent` 会显式使用当前仓库的 `src/mastra`
- 启动前会自动准备 `src/mastra/public/.mastra -> ./.mastra` 的本地链接，修正 Mastra CLI 的开发路径要求
- 不依赖现有 Next 管理后台页面
- `pnpm mastra:studio` 会把 `window.MASTRA_SERVER_HOST/PORT/API_PREFIX` 指向独立 Agent 服务
- 主要用于本地调试 Canvas Agent、Workflow、Tools、Editor 与 Observability
- DuckDB observability 仅在设置 `MASTRA_ENABLE_LOCAL_OBSERVABILITY=true` 时启用，建议只放在本地 `.env.agent.development`
- 不要让多个进程共享同一个 `.duckdb` 文件，否则会触发 DuckDB lock 冲突
