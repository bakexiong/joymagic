# 阿里云 OSS 配置指南

## 概述

本项目已集成阿里云 OSS（对象存储服务）作为文件上传存储方案。OSS 将作为默认存储提供商（如果配置），优先级高于 Cloudflare R2 和 AWS S3。

## 配置步骤

### 1. 获取阿里云 OSS 凭证

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 创建或选择一个 Bucket
3. 获取以下信息：
   - Region（区域）：例如 `oss-cn-hangzhou`
   - Bucket 名称
   - Access Key ID
   - Access Key Secret

### 2. 在管理后台配置

访问 `/admin/settings/storage`：

#### 第一步：选择存储提供商

在"存储设置"部分，从下拉菜单中选择 **阿里云 OSS**

#### 第二步：填写 OSS 配置

在"阿里云 OSS"部分填写：

- **阿里云 OSS Region**: 你的 OSS 区域（如 `oss-cn-hangzhou`）
- **阿里云 Access Key ID**: 你的 Access Key ID
- **阿里云 Access Key Secret**: 你的 Access Key Secret
- **Bucket 名称**: 你的 Bucket 名称
- **Endpoint（可选）**: 自定义 endpoint，留空使用默认
- **自定义域名（可选）**: 如果配置了 CDN 加速域名，填写此项

### 3. 存储提供商切换

系统提供了便捷的切换功能：

1. 访问 `/admin/settings/storage`
2. 在"存储设置"部分选择你想使用的存储提供商：
   - **阿里云 OSS**
   - **Cloudflare R2**
   - **AWS S3**
3. 填写对应存储提供商的配置参数
4. 保存设置

**注意：** 切换存储提供商后，需要确保对应的配置参数已正确填写，否则上传将失败。

## 技术实现

### 文件结构

```
src/extensions/storage/
├── index.ts          # 存储管理器
├── oss.ts            # 阿里云 OSS Provider（新增）
├── r2.ts             # Cloudflare R2 Provider
└── s3.ts             # AWS S3 Provider
```

### OSS Provider 特性

- ✅ 支持流式上传（内存高效）
- ✅ 使用 Web Crypto API 生成 HMAC-SHA1 签名
- ✅ 支持自定义 endpoint 和 CDN 域名
- ✅ 完整的错误处理
- ✅ 兼容现有上传 API

### API 签名

OSS Provider 使用标准的 OSS REST API 签名方式：

```
Authorization: OSS <AccessKeyId>:<Signature>
```

其中 Signature 计算方式：
```
Signature = Base64(HMAC-SHA1(AccessKeySecret, StringToSign))
```

## 使用示例

配置完成后，所有文件上传将自动使用阿里云 OSS：

```typescript
// 上传图片
const formData = new FormData();
formData.append('files', file);

const response = await fetch('/api/storage/upload-image', {
  method: 'POST',
  body: formData,
});

const { urls } = await response.json();
// urls[0] 将是 OSS 上的文件 URL
```

## 常见问题

### Q: 如何切换存储提供商？

A: 访问 `/admin/settings/storage`，在"存储设置"部分的下拉菜单中选择你想使用的存储提供商（OSS/R2/S3），然后填写对应的配置参数并保存。

### Q: 切换存储提供商后，旧文件还能访问吗？

A: 可以。切换存储提供商只影响新上传的文件，已上传的文件仍然保存在原来的存储服务中，可以正常访问。

### Q: 可以同时配置多个存储提供商吗？

A: 可以。你可以同时配置 OSS、R2 和 S3，系统会根据"存储设置"中选择的提供商来决定使用哪一个。未选中的提供商配置会被保留，方便随时切换。

### Q: 支持哪些 OSS 区域？

A: 支持所有阿里云 OSS 区域，常用的有：
- `oss-cn-hangzhou`（杭州）
- `oss-cn-shanghai`（上海）
- `oss-cn-beijing`（北京）
- `oss-cn-shenzhen`（深圳）

### Q: 如何配置 CDN 加速？

A: 在阿里云 OSS 控制台绑定自定义域名并配置 CDN，然后在"自定义域名"字段填写你的 CDN 域名。

### Q: 上传失败怎么办？

A: 检查以下几点：
1. Access Key 是否正确
2. Bucket 是否存在且有写入权限
3. Region 是否正确
4. 网络是否可以访问阿里云 OSS

## 安全建议

1. 使用 RAM 子账号的 Access Key，不要使用主账号
2. 为 RAM 子账号分配最小权限（仅 OSS 写入权限）
3. 定期轮换 Access Key
4. 不要将 Access Key 提交到代码仓库
