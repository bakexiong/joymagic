# 变更：新增独立部署的媒体转存服务

## 为什么

当前生成结果、示例素材和部分业务流程仍直接保存第三方 CDN 地址，导致外部链接失效、跨域/防盗链、加载性能和资产归属不可控。已有 `/api/storage/upload-from-url` 运行在 Next API 中，适合作为站内接口，但不适合作为统一、可独立扩缩容和部署的媒体转存基础服务。

## 变更内容

- 在当前仓库内新增可单独部署到 Railway 的 `upload-service`，不拆新项目，专门负责将第三方图片或视频转存到指定 Cloudflare R2。
- 服务提供后端调用的 HTTP API，支持单个和批量 URL 转存、媒体类型校验、文件大小限制、超时控制和结构化错误。
- 服务使用服务端密钥或内部鉴权，禁止在前端暴露任何 R2 key、转存服务 key 或第三方接口 key。
- 转存成功后返回 R2 公网 URL、对象 key、content type、文件大小、媒体类型和可选缩略图/海报信息。
- 为现有 Next API 和后续 AI 生成终态 R2 镜像提供统一调用入口，转存完成后必须更新对应 `ai_task.task_result` 中的媒体地址，逐步替换直接使用第三方 CDN 地址的路径。

## 影响

- 受影响规范：`upload-service`
- 受影响代码：
  - 新增 `services/upload-service/*` 或同等仓库内服务目录
  - 新增 Railway/Docker 部署配置，例如 `services/upload-service/Dockerfile`
  - 新增服务端调用客户端，例如 `src/server/upload-service/*` 或 `src/shared/lib/upload-service-client.ts`
  - 后续可迁移 `src/app/api/storage/upload-from-url/route.ts`
  - 后续可接入 `src/shared/lib/generated-output-r2.ts` / AI 生成终态处理，并更新 `ai_task.taskResult`
- 非目标：
  - 不拆分新仓库或新前端项目
  - 不直接修改 `/content` 下 MDX
  - 不把任何 key 放到前端
  - 不在本次变更中批量替换所有静态 CDN 文案和素材引用
