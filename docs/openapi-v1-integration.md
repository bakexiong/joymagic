# OpenAPI v1 接口接入文档

## 概述

本文档描述了 OpenAPI v1 接口的接入方式，包括认证机制、签名算法和各接口的使用说明。

## 基础信息

- **Base URL**: `https://your-domain.com/api/openapi/v1`
- **请求方式**: POST
- **Content-Type**: `application/json`

## 认证机制

所有 OpenAPI 接口都需要通过两层安全校验：

### 1. OpenAPI API Key 验证

在请求头中携带 OpenAPI API Key，用于验证调用方身份。

**请求头**：
- 优先使用：`X-OpenAPI-Key: your_openapi_key`
- 或使用：`Authorization: Bearer your_openapi_key`

**配置方式**：
服务端需要在环境变量中配置 `OPENAPI_API_KEY`，客户端请求时携带的 Key 必须与此值匹配。

### 2. 参数签名验证

使用 HMAC-SHA256 算法对请求参数进行签名，防止参数篡改和重放攻击。

#### 签名算法

**步骤 1：构建签名字符串**

1. 将请求 body 中的所有字段按 key 字母序排列
2. 拼接为 `key=value&key=value` 格式
3. 在末尾追加 `&timestamp=xxx&nonce=xxx`

示例：
```
email=user@example.com&page=1&timestamp=1710000000000&nonce=abc123xyz
```

**步骤 2：生成签名**

使用 HMAC-SHA256 算法，以 `OPENAPI_SECRET` 为密钥，对签名字符串进行加密：

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', OPENAPI_SECRET)
  .update(signString)
  .digest('hex');
```

**步骤 3：携带签名请求头**

- `X-Timestamp`: 当前时间戳（毫秒）
- `X-Nonce`: 随机字符串（用于防重放）
- `X-Signature`: 生成的签名

#### 签名验证规则

- **时间窗口**：timestamp 与服务器时间差不超过 5 分钟
- **防重放**：同一 nonce 在 5 分钟内只能使用一次
- **签名匹配**：计算的签名必须与 X-Signature 一致

#### 签名示例（Node.js）

```javascript
const crypto = require('crypto');

function generateSignature(params, timestamp, nonce, secret) {
  // 1. 按 key 字母序排列并拼接
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k] !== undefined && params[k] !== null)
    .map(k => `${k}=${params[k]}`)
    .join('&');

  // 2. 追加 timestamp 和 nonce
  const signString = `${sorted}&timestamp=${timestamp}&nonce=${nonce}`;

  // 3. HMAC-SHA256 签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');

  return signature;
}

// 使用示例
const params = { email: 'user@example.com', page: 1 };
const timestamp = Date.now().toString();
const nonce = crypto.randomBytes(16).toString('hex');
const secret = 'your_openapi_secret';

const signature = generateSignature(params, timestamp, nonce, secret);

// 发送请求
fetch('https://your-domain.com/api/openapi/v1/credit-history', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-OpenAPI-Key': 'your_openapi_key',
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature,
  },
  body: JSON.stringify(params),
});
```

## 响应格式

所有接口统一返回 JSON 格式：

**成功响应**：
```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

**失败响应**：
```json
{
  "code": -1,
  "message": "error message",
  "data": null
}
```

**认证失败响应**（HTTP 403）：
```json
{
  "code": -1,
  "message": "Forbidden",
  "success": false
}
```

## 接口列表

### 1. 删除账号

**接口地址**：`/api/openapi/v1/delete-account`

**请求参数**：
```json
{
  "email": "user@example.com"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "message": "Account deleted successfully"
  }
}
```

**说明**：
- 删除用户账号及其关联的所有数据（session、account 等会被级联删除）
- 删除操作不可逆，请谨慎使用

---

### 2. 积分记录查询

**接口地址**：`/api/openapi/v1/credit-history`

**请求参数**：
```json
{
  "email": "user@example.com",
  "page": 1,
  "limit": 30
}
```

**参数说明**：
- `email`（必填）：用户邮箱
- `page`（可选）：页码，默认 1
- `limit`（可选）：每页数量，默认 30

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": "credit_123",
        "transactionNo": "TXN20240101001",
        "transactionType": "grant",
        "transactionScene": "payment",
        "credits": 100,
        "status": "active",
        "description": "购买积分包",
        "expiresAt": "2024-12-31T23:59:59.000Z",
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 50,
      "totalPages": 2
    }
  }
}
```

**字段说明**：
- `transactionType`: 交易类型
  - `grant`: 授予积分
  - `consume`: 消费积分
- `transactionScene`: 交易场景
  - `payment`: 支付购买
  - `subscription`: 订阅
  - `renewal`: 续费
  - `gift`: 赠送
  - `reward`: 奖励
  - `admin_adjust`: 管理员调整
- `status`: 积分状态
  - `active`: 有效
  - `expired`: 已过期
  - `deleted`: 已删除

---

### 3. 更新个人信息

**接口地址**：`/api/openapi/v1/update-profile`

**请求参数**：
```json
{
  "email": "user@example.com",
  "name": "New Name",
  "image": "https://example.com/avatar.jpg",
  "country": "US"
}
```

**参数说明**：
- `email`（必填）：用户邮箱，用于查找用户
- `name`（可选）：用户名
- `image`（可选）：头像 URL
- `country`（可选）：国家代码（ISO 3166-1 alpha-2）

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "New Name",
      "image": "https://example.com/avatar.jpg",
      "country": "US"
    }
  }
}
```

**说明**：
- 只更新提供的字段，未提供的字段保持不变
- 至少需要提供一个可更新字段（name、image 或 country）

---

### 4. 用户注册

**接口地址**：`/api/openapi/v1/register`

**请求参数**：
```json
{
  "email": "user@example.com",
  "password": "password123",
  "source": "third_party"
}
```

**参数说明**：
- `email`（必填）：用户邮箱
- `password`（必填）：密码，至少 6 位
- `source`（可选）：注册来源标识，默认为 "openapi"

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "user"
    },
    "source": "third_party"
  }
}
```

**说明**：
- 如果邮箱已注册，返回现有用户信息和 API Key
- 新注册用户会自动创建 API Key 并授予初始积分
- 返回的 `apiKey` 可用于后续 API 调用

---

### 5. 获取用户信息

**接口地址**：`/api/openapi/v1/get-user`

**请求参数**：
```json
{
  "email": "user@example.com"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

---

### 6. 查询余额

**接口地址**：`/api/openapi/v1/balance`

**请求方式**：GET

**请求头**：
- `X-OpenAPI-Key`: OpenAPI API Key（必填）
- `Authorization`: Bearer {用户 API Key}（必填）

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "balance": 95.50,
    "usedBalance": 4.50,
    "totalBalance": 100.00,
    "currency": "USD",
    "available": true
  }
}
```

**说明**：
- 此接口需要同时提供 OpenAPI API Key 和用户 API Key
- 用户 API Key 通过注册接口获取

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| -1 | 失败（具体错误信息见 message 字段）|

**常见错误信息**：
- `Missing Authorization or X-OpenAPI-Key header`: 缺少认证头
- `Invalid OpenAPI API Key`: OpenAPI API Key 无效
- `Missing signature headers`: 缺少签名相关请求头
- `Timestamp expired or invalid`: 时间戳过期或无效
- `Duplicate nonce`: nonce 重复（防重放）
- `Invalid signature`: 签名验证失败
- `email is required`: 缺少必填参数
- `user not found`: 用户不存在

## 环境配置

服务端需要配置以下环境变量：

```bash
# OpenAPI API Key（用于验证调用方身份）
OPENAPI_API_KEY=your_openapi_key

# OpenAPI Secret（用于签名验证）
OPENAPI_SECRET=your_openapi_secret
```

**注意**：
- 如果未配置 `OPENAPI_API_KEY`，则跳过 API Key 验证
- 如果未配置 `OPENAPI_SECRET`，则跳过签名验证
- 生产环境强烈建议同时配置两者以确保安全

## 最佳实践

1. **密钥管理**
   - 妥善保管 `OPENAPI_API_KEY` 和 `OPENAPI_SECRET`
   - 定期轮换密钥
   - 不要在客户端代码中硬编码密钥

2. **错误处理**
   - 实现重试机制（针对网络错误）
   - 记录错误日志便于排查
   - 对敏感信息进行脱敏处理

3. **性能优化**
   - 合理设置分页参数
   - 使用连接池管理 HTTP 连接
   - 实现请求缓存（针对不常变化的数据）

4. **安全建议**
   - 使用 HTTPS 传输
   - 实现 IP 白名单（如有需要）
   - 监控异常请求行为

## 技术支持

如有问题，请联系技术支持团队。
