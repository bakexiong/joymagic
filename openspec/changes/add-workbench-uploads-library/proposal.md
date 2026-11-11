# 变更：为工作台增加可持久化的 Uploads 媒体库

## 为什么
当前工作台中的上传仅完成对象存储上传并返回 URL，未写入数据库，也没有可查询、可筛选、可搜索的 `Uploads` 视图。这导致用户上传的图片、视频、音频无法在工作台中作为稳定资产复用，`Uploads` 标签页也无法承载真实的产品能力。

## 变更内容
- 新增工作台上传媒体表，用于保存用户上传的图片、视频、音频等资产
- 在上传接口完成对象存储上传后，将上传记录写入数据库
- 为工作台 `Uploads` 视图增加真实数据加载
- 支持按媒体类型筛选（图片、视频、音频等）
- 支持按日期范围筛选
- 支持按上传时所属场景（scene / tool）筛选
- 支持按上传时所属模型筛选
- 支持关键字搜索（文件名、场景名、模型名等可搜索字段）
- 保持前端不暴露任何 key，数据库写入和查询全部通过服务端完成

## 影响
- 受影响规范：`workbench-uploads-library`
- 受影响代码：
  - `src/config/db/schema.ts`
  - `src/shared/models/`
  - `src/app/api/storage/upload-image/route.ts`
  - `src/app/api/storage/upload-video/route.ts`
  - `src/app/api/storage/upload-audio/route.ts`
  - `src/shared/blocks/desktop-playground/components/workbench-media-panel.tsx`
  - `src/shared/blocks/common/desktop-media-ai-workbench.tsx`
  - `src/shared/blocks/creator-workbench/creator-workbench.tsx`
