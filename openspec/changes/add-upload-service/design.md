## 上下文

项目当前支持容器化服务部署，并已有 R2/S3/OSS 存储抽象。媒体转存场景和站点主 API 的生命周期不同：下载第三方大文件可能耗时、失败率高、需要独立限流和资源控制，因此应从 Next API 中拆出一个仓库内独立可部署到 Railway 的服务。

## 目标 / 非目标

- 目标：提供一个可独立部署的 `upload-service`，将第三方图片或视频稳定转存到 R2。
- 目标：通过服务端鉴权和 R2 绑定/服务端密钥避免任何前端 key 暴露。
- 目标：为站内现有 `/api/storage/upload-from-url`、AI 生成结果镜像和后台素材同步提供统一能力。
- 目标：AI 任务结果转存完成后，站内后端必须把 `ai_task.task_result` 中的第三方媒体 URL 更新为 R2 URL，并保留原始 URL 以便追踪。
- 非目标：不建立新仓库，不重做现有存储抽象，不一次性替换所有静态 CDN URL。

## 技术方案

- 服务形态：在仓库内新增 `services/upload-service`，使用 TypeScript 编写 Node HTTP 服务入口，并配套独立 `Dockerfile` 供 Railway 构建部署。
- R2 写入：在 Railway 中使用 Cloudflare R2 S3 API 写入目标 bucket，R2 access key 只存在服务端环境变量中。
- API：
  - `GET /health` 返回服务健康状态。
  - `POST /v1/transfer` 转存单个 URL。
  - `POST /v1/transfer/batch` 转存多个 URL，并返回逐项结果。
- 请求字段：`url`、`mediaType`、`targetPrefix`、`filename`、`metadata`、`idempotencyKey` 可选。
- 响应字段：`url`、`key`、`bucket`、`mediaType`、`contentType`、`size`、`sourceUrl`、`thumbnailUrl` 可选。
- 鉴权：内部调用必须携带服务端配置的 bearer token 或 HMAC 签名；前端禁止直接调用该服务。
- 安全校验：只允许 `http`/`https` URL，禁止私网/本地地址，校验 content type 和文件大小，设置下载超时和最大重定向次数。
- 幂等：优先使用调用方传入 `idempotencyKey` 或规范化 URL hash 生成对象 key，避免重复转存同一素材。
- AI task 更新：`upload-service` 只负责下载和写入 R2，不直接访问业务数据库；站内后端 client 在拿到转存结果后，负责更新 `ai_task.task_result`。更新内容必须把 `output` 和 `outputs` 替换为 R2 URL，并将第三方原始地址保存到 `originalOutput` / `originalOutputs` 或等效字段，避免丢失溯源信息。
- 集成：保留现有 `/api/storage/upload-from-url` 路径，对内改为调用 `upload-service`；AI 生成终态处理可异步调用该服务，成功后更新 `ai_task.task_result`，失败只记录日志且保留原始结果地址。

## 风险与缓解

- 大视频占用 Worker 内存：实现时应优先流式读取并写入 R2，必要时配置大小上限。
- 第三方源站防盗链或慢响应：设置 User-Agent、超时、错误码和重试边界，失败向调用方返回可诊断错误。
- SSRF 风险：下载前解析并校验 URL，拒绝 localhost、私网、link-local、file/data/blob 等协议。
- R2 域名差异：通过环境变量配置 public domain，返回的 URL 不依赖第三方 CDN。
