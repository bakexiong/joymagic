# Google Play IAP App 对接文档

## 概述

本文档面向 Android / Flutter App 客户端，说明如何对接站点现有的 Google Play 内购后端接口。

当前后端已支持：

- Google Play 一次性商品验单
- Google Play 订阅验单
- 用户权益查询
- 手动恢复购买
- 服务端自动接入现有积分体系
  - 一次性商品：`order + credit`
  - 订阅首购：`order + subscription + credit`
  - 订阅续费：`renewal order + credit`

## 基础信息

- Base URL：`https://your-domain.com/api/openapi/v1`
- 数据格式：`application/json`
- 时区：UTC
- 时间格式：ISO8601，例如 `2026-04-28T10:20:30Z`

## 接入流程

### App 侧主流程

1. App 调起 Google Play Billing 发起购买
2. Google Play 返回购买结果
3. App 读取购买凭证信息
4. App 调用后端 `POST /iap/google/verify`
5. 后端回源 Google Play Developer API 验单
6. 后端写入 IAP 记录，并同步到现有积分/订阅账本
7. 后端返回最新权益
8. App 根据权益结果刷新会员态、积分态、去广告态等 UI

### 恢复购买流程

1. App 启动或用户点击“恢复购买”
2. App 先查询本地 Google Play 购买记录
3. App 调用后端 `POST /iap/google/restore`
4. 后端基于历史已绑定 token 重新回源校验
5. App 再调用 `GET /iap/entitlements` 拉取最新权益

## 认证方式

这组 IAP 接口使用双层认证：

- `X-OpenAPI-Key`：平台级调用方身份校验
- `Authorization: Bearer <user-api-key>`：用户身份校验

注意：

- 这组 IAP 接口当前不要求 `X-Signature`
- `Authorization` 这里放的是用户 API Key，不是 Google 登录 token
- `X-OpenAPI-Key` 和用户 API Key 都必须走服务端安全分发，不要硬编码在前端包体里

### 请求头示例

```http
Content-Type: application/json
X-OpenAPI-Key: your_openapi_key
Authorization: Bearer user_api_key
Idempotency-Key: 4fdc9c68-2a7a-4f7e-bd76-5bdb3d5fe001
```

## 接口列表

### 1. 提交购买验单

- 方法：`POST`
- 地址：`/api/openapi/v1/iap/google/verify`

#### 请求体

```json
{
  "platform": "google",
  "packageName": "com.example.app",
  "productId": "vip.monthly",
  "productType": "subs",
  "purchaseToken": "token_xxx",
  "orderId": "GPA.1234-5678-9012-34567",
  "purchaseTime": "2026-04-28T10:20:30Z",
  "clientTraceId": "trace-001"
}
```

#### 字段说明

- `platform`：固定传 `google`
- `packageName`：Android 包名，必须和后台允许的包名一致
- `productId`：Google Play 商品 ID
- `productType`：`inapp` 或 `subs`
- `purchaseToken`：Google Play 购买凭证，幂等核心字段
- `orderId`：Google Play 订单号，订阅续费场景建议也带上
- `purchaseTime`：客户端记录的购买时间，可选
- `clientTraceId`：客户端链路追踪 ID，可选，建议传

#### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "verifyStatus": "PURCHASED",
    "serverOrderNo": "IAP202604280001",
    "productId": "vip.monthly",
    "productType": "subs",
    "purchaseToken": "token_xxx",
    "entitlements": [
      {
        "entitlementCode": "vip",
        "status": "ACTIVE",
        "productId": "vip.monthly",
        "platform": "google",
        "startAt": "2026-04-28T10:20:30.000Z",
        "expireAt": "2026-05-28T10:20:30.000Z"
      }
    ]
  }
}
```

#### 幂等命中响应

```json
{
  "code": 0,
  "message": "already_processed",
  "data": {
    "verifyStatus": "PURCHASED",
    "serverOrderNo": "IAP202604280001",
    "productId": "vip.monthly",
    "productType": "subs",
    "purchaseToken": "token_xxx",
    "entitlements": [
      {
        "entitlementCode": "vip",
        "status": "ACTIVE",
        "productId": "vip.monthly",
        "platform": "google",
        "startAt": "2026-04-28T10:20:30.000Z",
        "expireAt": "2026-05-28T10:20:30.000Z"
      }
    ]
  }
}
```

#### App 侧处理建议

- `code == 0` 且 `verifyStatus == PURCHASED`：视为成功
- `message == already_processed`：不要报错，直接按成功处理
- 后端已自动做幂等，不要因为用户重复点击而阻塞重试
- 成功后建议立即刷新权益和余额 UI

### 2. 查询当前用户权益

- 方法：`GET`
- 地址：`/api/openapi/v1/iap/entitlements`

#### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "entitlements": [
      {
        "entitlementCode": "vip",
        "status": "ACTIVE",
        "productId": "vip.monthly",
        "platform": "google",
        "startAt": "2026-04-28T10:20:30.000Z",
        "expireAt": "2026-05-28T10:20:30.000Z"
      }
    ]
  }
}
```

#### 使用场景

- App 启动后刷新会员态
- 购买成功后刷新 UI
- 进入会员页、权益页时兜底拉取
- 恢复购买完成后再次确认

### 3. 恢复购买

- 方法：`POST`
- 地址：`/api/openapi/v1/iap/google/restore`

#### 请求体

```json
{
  "packageName": "com.example.app",
  "reason": "device_migration"
}
```

#### 成功响应

```json
{
  "code": 0,
  "message": "restore_task_accepted",
  "data": {
    "taskId": "restore-1746691200000-ab12cd34",
    "total": 2,
    "restoredCount": 2
  }
}
```

#### 注意事项

- 当前恢复逻辑依赖服务端已有绑定过的购买记录
- 如果是全新设备首次登录，建议仍优先走 Google Play 本地购买查询，再把每个购买结果调用 `verify`
- `restore` 更适合作为“服务端补偿恢复”

## 状态说明

### `verifyStatus`

- `PURCHASED`：购买成功，可发放权益
- `PENDING`：待支付 / 待确认，不应解锁权益
- `CANCELED`：已取消
- `EXPIRED`：订阅已过期

### `entitlements[].status`

- `ACTIVE`：权益有效
- `PENDING`：待生效
- `PENDING_CANCEL`：到期取消中
- `REVOKED`：已撤销
- `EXPIRED`：已过期

App 展示建议：

- `ACTIVE`：正常解锁能力
- `PENDING_CANCEL`：保持可用，但展示“将在到期后失效”
- `PENDING`：不要立即解锁
- `REVOKED / EXPIRED`：视为无效

## Flutter 请求示例

### 验单示例

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> verifyGooglePurchase({
  required String baseUrl,
  required String openApiKey,
  required String userApiKey,
  required String packageName,
  required String productId,
  required String productType,
  required String purchaseToken,
  String? orderId,
  String? purchaseTime,
  String? clientTraceId,
  String? idempotencyKey,
}) async {
  final uri = Uri.parse('$baseUrl/api/openapi/v1/iap/google/verify');

  final response = await http.post(
    uri,
    headers: {
      'Content-Type': 'application/json',
      'X-OpenAPI-Key': openApiKey,
      'Authorization': 'Bearer $userApiKey',
      if (idempotencyKey != null) 'Idempotency-Key': idempotencyKey,
    },
    body: jsonEncode({
      'platform': 'google',
      'packageName': packageName,
      'productId': productId,
      'productType': productType,
      'purchaseToken': purchaseToken,
      if (orderId != null) 'orderId': orderId,
      if (purchaseTime != null) 'purchaseTime': purchaseTime,
      if (clientTraceId != null) 'clientTraceId': clientTraceId,
    }),
  );

  return jsonDecode(response.body) as Map<String, dynamic>;
}
```

### 查询权益示例

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> fetchEntitlements({
  required String baseUrl,
  required String openApiKey,
  required String userApiKey,
}) async {
  final uri = Uri.parse('$baseUrl/api/openapi/v1/iap/entitlements');

  final response = await http.get(
    uri,
    headers: {
      'X-OpenAPI-Key': openApiKey,
      'Authorization': 'Bearer $userApiKey',
    },
  );

  return jsonDecode(response.body) as Map<String, dynamic>;
}
```

### 恢复购买示例

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> restorePurchases({
  required String baseUrl,
  required String openApiKey,
  required String userApiKey,
  required String packageName,
}) async {
  final uri = Uri.parse('$baseUrl/api/openapi/v1/iap/google/restore');

  final response = await http.post(
    uri,
    headers: {
      'Content-Type': 'application/json',
      'X-OpenAPI-Key': openApiKey,
      'Authorization': 'Bearer $userApiKey',
    },
    body: jsonEncode({
      'packageName': packageName,
      'reason': 'device_migration',
    }),
  );

  return jsonDecode(response.body) as Map<String, dynamic>;
}
```

## 推荐客户端时序

### 购买成功后

1. 拿到 `purchaseToken`
2. 立即调用 `verify`
3. 如果返回成功，直接使用返回的 `entitlements`
4. 再调用一次 `entitlements` 作为兜底刷新

### App 启动时

1. 查询用户登录态
2. 调 `GET /iap/entitlements`
3. 根据权益恢复会员 UI

### 切换设备或用户主动恢复购买时

1. 先调用 `restore`
2. 成功后调用 `entitlements`
3. 如果仍未恢复，再引导用户上报本地 Google Play 购买结果重新 `verify`

## 错误处理建议

### 常见错误

- `X-OpenAPI-Key header is required`
  - 未传平台级 OpenAPI Key

- `API Key is required`
  - 未传用户 API Key

- `Invalid or deleted API Key`
  - 用户 API Key 无效

- `platform, packageName, productId, productType and purchaseToken are required`
  - 验单参数不完整

- `productType must be inapp or subs`
  - 商品类型错误

- `packageName does not match server configuration`
  - 包名未加入后台允许名单

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured`
  - 服务端尚未完成后台配置

- `Google Play API request failed: ...`
  - 服务端回源 Google 失败，通常是 token、商品 ID、包名或服务账号权限问题

### 客户端策略

- 对 `already_processed` 按成功处理
- 对网络失败允许重试
- 对 `PENDING` 提示“支付处理中”
- 对配置类错误直接上报，不要让用户无限重试

## 后台配置要求

管理后台路径：

- `/admin/settings/payment`

需要配置：

- `Google Play Allowed Package Names`
- `Google Play Service Account JSON`
- `Google Play Product Mappings`
- `Google Play RTDN Webhook Token`
- `Google Play Internal API Token`

其中 `Google Play Product Mappings` 决定：

- 商品对应哪种权益编码
- 发多少积分
- 积分有效期
- 是否为订阅
- 订阅周期是什么

## 商品映射示例

```json
{
  "vip.monthly": {
    "entitlementCode": "vip",
    "planName": "VIP Monthly",
    "productName": "VIP Monthly",
    "creditsAmount": 1000,
    "creditsValidDays": 30,
    "amount": 999,
    "currency": "USD",
    "paymentProductId": "vip.monthly",
    "interval": "month",
    "intervalCount": 1
  },
  "remove_ads_lifetime": {
    "entitlementCode": "no_ads",
    "productName": "Remove Ads Lifetime",
    "creditsAmount": 0,
    "creditsValidDays": 0,
    "amount": 1999,
    "currency": "USD",
    "paymentProductId": "remove_ads_lifetime"
  }
}
```

## 联调检查清单

- Google Play Billing 商品 ID 与后台 `productId` 一致
- App 上传的 `packageName` 与后台允许名单一致
- App 传的 `productType` 正确
- 每次购买都把 `purchaseToken` 原样传给后端
- 服务端已配置好 Google Play 服务账号 JSON
- 商品映射已在后台配置完成
- 购买成功后 App 正确刷新权益 UI

## 非 App 侧接口

以下接口不需要 App 直接调用：

- `POST /api/openapi/v1/iap/google/rtdn/webhook`
  - 给 Google RTDN 用

- `POST /api/openapi/v1/iap/google/ack/retry`
  - 内部运维 / 补偿任务用

