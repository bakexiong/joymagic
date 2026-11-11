## 新增需求

### 需求：独立媒体转存服务

系统必须在当前仓库内提供一个可单独部署的 `upload-service`，用于将第三方图片或视频 URL 转存到指定 Cloudflare R2 bucket，并返回 R2 托管地址。

#### 场景：服务健康检查

- **当** 调用方请求 `GET /health`
- **那么** 服务必须返回健康状态
- **并且** 不需要访问 R2 或下载第三方资源

#### 场景：图片转存成功

- **当** 授权的服务端调用 `POST /v1/transfer` 并传入有效图片 URL
- **那么** upload-service 必须下载源图片并写入 R2
- **并且** 响应必须包含 R2 `url`、对象 `key`、`contentType`、`size` 和 `mediaType: "image"`

#### 场景：视频转存成功

- **当** 授权的服务端调用 `POST /v1/transfer` 并传入有效视频 URL
- **那么** upload-service 必须下载源视频并写入 R2
- **并且** 响应必须包含 R2 `url`、对象 `key`、`contentType`、`size` 和 `mediaType: "video"`

#### 场景：批量转存

- **当** 授权的服务端调用 `POST /v1/transfer/batch` 并传入多个媒体 URL
- **那么** 服务必须逐项处理转存
- **并且** 单个 URL 失败不得导致其他 URL 的成功结果丢失
- **并且** 响应必须为每一项返回成功结果或结构化错误

### 需求：转存服务必须保护密钥和内部接口

upload-service 必须只接受服务端授权调用，禁止前端直接持有或传递 R2 key、upload-service key 或第三方服务 key。

#### 场景：缺少鉴权

- **当** 调用方请求 `/v1/transfer` 或 `/v1/transfer/batch` 但未提供有效鉴权
- **那么** 服务必须返回未授权错误
- **并且** 禁止下载第三方资源
- **并且** 禁止写入 R2

#### 场景：前端调用约束

- **当** 前端需要转存第三方媒体
- **那么** 前端必须调用站内后端接口
- **并且** 站内后端接口再使用服务端密钥调用 upload-service
- **并且** 任何密钥都不得出现在客户端 bundle、浏览器请求参数或公开配置中

### 需求：转存服务必须执行下载安全校验

upload-service 必须在下载远程媒体前执行 URL、协议、地址、媒体类型、文件大小和超时校验，降低 SSRF、恶意文件和资源耗尽风险。

#### 场景：非法协议

- **当** 请求 URL 使用非 `http` 或 `https` 协议
- **那么** 服务必须拒绝请求
- **并且** 禁止发起下载

#### 场景：私网或本地地址

- **当** 请求 URL 指向 localhost、私网、link-local 或其他内部地址
- **那么** 服务必须拒绝请求
- **并且** 禁止写入 R2

#### 场景：媒体类型不匹配

- **当** 源站返回的 `content-type` 与请求的 `mediaType` 不匹配
- **那么** 服务必须拒绝转存
- **并且** 返回可诊断的错误信息

#### 场景：文件过大或下载超时

- **当** 源媒体超过配置的大小上限或下载超过配置超时时间
- **那么** 服务必须中断处理
- **并且** 返回结构化错误
- **并且** 禁止返回第三方 CDN URL 作为成功结果

### 需求：现有后端转存入口必须复用 upload-service

现有站内后端转存入口必须通过 upload-service 完成第三方媒体到 R2 的转存，并保持对前端的响应结构兼容。

#### 场景：现有 upload-from-url 兼容

- **当** 前端继续调用 `/api/storage/upload-from-url`
- **那么** 站内后端必须调用 upload-service 执行实际转存
- **并且** 响应仍必须包含 `url`、`thumbnailUrl`、`key` 和 `type`
- **并且** `url` 必须优先指向 R2 公网域名

#### 场景：AI 生成终态异步转存

- **当** AI 生成任务进入成功终态且结果包含第三方媒体 URL
- **那么** 后端必须创建 `r2_upload_task` 队列记录
- **并且** 主服务禁止启动 interval 或后台轮询器
- **并且** 每个第三方媒体 URL 必须写入一条独立 `r2_upload_task`
- **并且** 每条 `r2_upload_task` 必须关联最多一个 `workbench_creation_id`
- **并且** upload-service 必须在自身进程中轮询 `r2_upload_task` 并执行上传
- **并且** 上传处理器禁止通过扫描 `ai_task` 查找待上传记录
- **并且** 转存成功后必须更新对应 `ai_task.task_result` 中的 `output` 和 `outputs` 为 R2 URL
- **并且** 转存成功后必须根据 `workbench_creation_id` 更新对应 `workbench_creation.url`
- **并且** 系统必须保留原始第三方 URL 到 `originalOutput`、`originalOutputs` 或等效字段
- **并且** upload-service 失败不得导致生成接口、状态接口或 webhook 响应失败

#### 场景：AI task 地址更新幂等

- **当** 同一个 AI task 的结果被重复触发转存
- **那么** 系统必须通过 `r2_upload_task` 的状态和幂等键避免重复写入无意义的新对象
- **并且** `ai_task.task_result` 中的最终媒体地址必须保持为 R2 URL
- **并且** 原始第三方 URL 不得被覆盖丢失

#### 场景：上传任务失败重试

- **当** upload-service 处理 `r2_upload_task` 失败
- **那么** 系统必须记录失败原因和尝试次数
- **并且** 未达到最大尝试次数时必须允许后续重试
- **并且** 失败不得阻塞 AI 生成状态响应
