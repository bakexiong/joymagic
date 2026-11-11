## 1. 实施

- [x] 1.1 新增 `services/upload-service` Node 服务入口、类型定义和路由结构
- [x] 1.2 新增独立部署配置 `services/upload-service/Dockerfile`，包含 Railway 运行入口和部署说明
- [x] 1.3 实现 URL 校验、SSRF 防护、媒体类型识别、大小限制、超时和错误响应
- [x] 1.4 实现单文件转存 `POST /v1/transfer`，将第三方图片/视频写入 R2 并返回 R2 URL
- [x] 1.5 实现批量转存 `POST /v1/transfer/batch`，逐项返回成功/失败结果
- [x] 1.6 实现服务端鉴权，所有非健康检查接口必须拒绝未授权请求
- [x] 1.7 增加站内服务端 client，用于 Next API 和生成终态处理调用 upload-service
- [x] 1.8 实现 AI task 结果地址更新：转存成功后更新 `ai_task.taskResult` 中的 `output` / `outputs` 为 R2 URL，并保留原始第三方 URL
- [x] 1.9 将现有 `/api/storage/upload-from-url` 改为通过 upload-service 转存，保持响应结构兼容
- [x] 1.10 新增 `r2_upload_task` 表和模型，AI 成功终态只写入该队列表，禁止扫描 `ai_task`
- [x] 1.11 在 upload-service 中启动轮询器，只消费 `r2_upload_task`，成功后回写 `ai_task.taskResult`
- [x] 1.12 将 `r2_upload_task` 改为一条媒体 URL 一条记录，并通过单个 `workbench_creation_id` 精确回写 `workbench_creation`
- [ ] 1.13 补充最小测试或脚本验证：健康检查、鉴权失败、图片转存、视频转存、非法 URL 拒绝、AI task 地址更新

## 2. 验证

- [x] 2.1 运行 `openspec-cn validate add-upload-service --strict --no-interactive`
- [ ] 2.2 运行 TypeScript/ESLint 检查，确认新增服务和调用端无类型错误
- [ ] 2.3 使用本地或预览环境验证转存结果 URL 指向 R2 公网域名，且相关 `ai_task.task_result` 已更新为 R2 URL
