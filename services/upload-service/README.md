# upload-service

独立部署的媒体转存服务，用于把第三方图片或视频转存到 Cloudflare R2。

## Railway / Docker 部署

Railway 使用本目录下的 `Dockerfile` 构建：

```bash
services/upload-service/Dockerfile
```

Railway 配置里建议保持构建上下文为仓库根目录，并把 Dockerfile Path 设置为 `services/upload-service/Dockerfile`。

服务启动命令已经写在 Dockerfile 中，会监听 Railway 注入的 `PORT`。

需要在 Railway 配置这些环境变量：

- `UPLOAD_SERVICE_TOKEN`：主站后端调用 upload-service 的内部 token
- `R2_ACCOUNT_ID`：Cloudflare 账号 ID，若设置了 `R2_ENDPOINT` 可选
- `R2_ACCESS_KEY_ID`：R2 S3 API access key
- `R2_SECRET_ACCESS_KEY`：R2 S3 API secret key
- `R2_BUCKET`：目标 bucket 名称
- `R2_PUBLIC_DOMAIN`：R2 公开访问域名，例如 `https://cdn.example.com`
- `DATABASE_URL`：主服务同一个数据库，upload-service 会轮询 `r2_upload_task`，并回写 `ai_task` 与关联的 `workbench_creation`
- `R2_ENDPOINT`：可选，默认使用 `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
- `MAX_IMAGE_BYTES`：可选，默认 `26214400`
- `MAX_VIDEO_BYTES`：可选，默认 `524288000`
- `DOWNLOAD_TIMEOUT_MS`：可选，默认 `60000`
- `R2_UPLOAD_WORKER_ENABLED`：可选，设为 `false` 可关闭队列轮询
- `R2_UPLOAD_WORKER_INTERVAL_MS`：可选，默认 `60000`
- `R2_UPLOAD_WORKER_BATCH_SIZE`：可选，默认 `5`

每条 `r2_upload_task` 只对应一个源 URL 和一个 `workbench_creation_id`。多图任务会入队多条记录，避免单条记录里维护多个 creation id。

## 本地运行

```bash
UPLOAD_SERVICE_TOKEN=dev-token \
R2_ACCOUNT_ID=xxx \
R2_ACCESS_KEY_ID=xxx \
R2_SECRET_ACCESS_KEY=xxx \
R2_BUCKET=xxx \
R2_PUBLIC_DOMAIN=https://cdn.example.com \
DATABASE_URL=postgresql://xxx \
pnpm upload-service:railway
```

主站后端需要配置：

- `UPLOAD_SERVICE_URL`
- `UPLOAD_SERVICE_TOKEN`

不要把这些值放到任何 `NEXT_PUBLIC_` 环境变量里。
