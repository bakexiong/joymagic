## 1. 梳理与保护

- [ ] 1.1 记录现有 generate/status/notify 的外部响应契约和主要调用方
- [ ] 1.2 标出当前同步模式、异步模式、webhook 模式、已终态 DB 短路模式
- [ ] 1.3 为状态映射、输出抽取、嵌套路径读取、task result 解析添加单元测试或等效脚本测试

## 2. 服务拆分

- [x] 2.1 新增 AI generation 服务目录和类型定义
- [ ] 2.2 抽出场景与 Provider 配置解析服务
- [x] 2.3 抽出请求参数验证、默认值、类型转换和场景 body normalizer
- [ ] 2.4 抽出积分计算、免费额度、扣费和退款服务
- [ ] 2.5 抽出 Provider 请求构建、响应解析、状态/输出/错误提取服务
- [ ] 2.6 抽出任务创建、任务更新、本地终态短路和 options/result 解析服务
- [ ] 2.7 抽出任务终态 finalize 服务，统一成功、失败、NSFW、R2 镜像和 workbench creation

## 3. 路由迁移

- [x] 3.1 将 `/api/ai/[scene]/generate` 改为调用 submit service
- [x] 3.2 将 `/api/ai/status` 改为调用 status service
- [x] 3.3 将 `/api/ai/notify/[provider]` 改为调用统一 status/finalize service
- [ ] 3.4 将旧 `/api/ai/generate` 保留为兼容入口或轻量适配层
- [ ] 3.5 删除 `common-handler` 中迁移后无引用的重复函数

## 4. 验证

- [ ] 4.1 验证图像同步生成响应包含 `output` 和 `outputs`
- [ ] 4.2 验证异步生成返回 `taskId/requestId`
- [ ] 4.3 验证状态查询处理中、成功、失败、未知状态
- [ ] 4.4 验证失败任务只退款一次
- [ ] 4.5 验证已完成任务重复查询不重复写入 workbench creation
- [ ] 4.6 验证 R2 上传失败不影响接口成功响应
- [x] 4.7 运行 `pnpm exec tsc --noEmit --pretty false`
