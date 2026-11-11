## 上下文
当前上传接口只负责把文件写入对象存储，返回 URL 后由前端组件临时持有。工作台右侧的 `Uploads` 尚未落地为真实媒体库，因此无法提供可靠的上传资产管理与筛选体验。

该能力同时涉及数据库、服务端 API、上传链路、工作台筛选 UI 和搜索，因此需要独立设计说明。

## 目标
- 让上传资产成为可持久化、可检索、可复用的用户媒体库
- 让 `Uploads` 视图和 `Creations` 视图在筛选交互上保持一致
- 让 `Tool` 和 `Model` 筛选与左侧工作台实际配置保持一致
- 保持所有敏感逻辑在服务端完成

## 非目标
- 本次不处理跨用户共享上传资产
- 本次不实现复杂文件夹或收藏夹系统
- 本次不引入前端直连数据库或前端保存敏感凭证

## 数据模型
建议新增 `workbench_upload` 表，至少包含：
- `id`
- `userId`
- `mediaType`
- `sceneId`
- `sceneLabel`
- `modelUrl`
- `modelLabel`
- `filename`
- `storageKey`
- `url`
- `mimeType`
- `fileSize`
- `keywordText`
- `createdAt`
- `updatedAt`

其中：
- `mediaType` 用于图片 / 视频 / 音频等类型筛选
- `sceneId + sceneLabel` 用于 `Tool` 筛选和展示兜底
- `modelUrl + modelLabel` 用于 `Model` 筛选和展示兜底
- `keywordText` 用于关键字搜索，避免前端拼接搜索字段

## 上传链路
上传接口在对象存储成功后，服务端继续写入数据库：
1. 校验登录用户
2. 读取上传请求中的 scene / model 元数据
3. 上传文件到存储服务
4. 持久化上传记录
5. 返回上传 URL 和数据库记录摘要

## 查询链路
新增服务端查询能力：
- 按用户查询 uploads
- 支持 `mediaType`、`dateRange`、`sceneId`、`modelUrl`、`keyword`
- 默认按 `createdAt desc`

## 前端交互
- `Uploads` 视图读取服务端数据，不再显示 `coming soon`
- `Tool` 取左侧 scene 列表
- `Model` 取当前 scene 下模型列表
- 类型筛选独立于 `Tool` / `Model`
- 日期选择继续使用现有独立浮层
- 关键字搜索用于上传资产列表

## 风险与注意事项
- 上传接口目前可能被多处复用，需要兼容未传 `scene/model` 元数据的旧调用
- 对于未提供 scene/model 的上传记录，需要允许空值并在 UI 做兜底
- 如果用户未登录，需要明确 uploads 是否降级为仅上传不入库，或直接要求登录

## 实施假设
- 默认以“登录用户上传资产入库”为主路径
- 未登录上传若仍需保留，允许只上传存储但不进入 `Uploads` 媒体库
