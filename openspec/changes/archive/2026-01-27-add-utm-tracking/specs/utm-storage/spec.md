# 规范：UTM 数据存储

## 新增需求

### 需求：数据库必须扩展用户表支持 UTM 字段

数据库的 `user` 表必须扩展以存储 UTM 追踪数据。

#### 场景：存储用户的首次访问 UTM 数据

**前置条件：**
- 用户通过 UTM 链接注册账户
- 注册请求包含 UTM 数据

**操作：**
1. 创建用户记录
2. 存储首次访问的 UTM 参数到对应字段

**预期结果：**
- 用户记录包含以下字段：
  - `first_utm_source` - 首次访问来源
  - `first_utm_medium` - 首次访问媒介
  - `first_utm_campaign` - 首次访问活动
  - `first_utm_content` - 首次访问内容
  - `first_utm_term` - 首次访问关键词
  - `first_visit_at` - 首次访问时间
- 所有字段为可选（nullable）
- 字段类型为 `text`

#### 场景：存储用户的最后访问 UTM 数据

**前置条件：**
- 用户已有账户
- 用户通过新的 UTM 链接访问并登录

**操作：**
1. 更新用户记录
2. 更新最后访问的 UTM 参数

**预期结果：**
- 用户记录包含以下字段：
  - `last_utm_source` - 最后访问来源
  - `last_utm_medium` - 最后访问媒介
  - `last_utm_campaign` - 最后访问活动
  - `last_utm_content` - 最后访问内容
  - `last_utm_term` - 最后访问关键词
  - `last_visit_at` - 最后访问时间
- 首次访问数据保持不变

### 需求：系统必须创建 UTM 追踪历史表

系统必须创建独立的表记录用户的所有 UTM 访问历史。

#### 场景：记录每次 UTM 访问

**前置条件：**
- 用户通过 UTM 链接访问网站
- 用户已登录或注册

**操作：**
1. 创建新的 `utm_tracking` 记录
2. 关联到用户 ID
3. 记录完整的 UTM 参数和时间戳

**预期结果：**
- `utm_tracking` 表包含以下字段：
  - `id` - 主键（UUID）
  - `user_id` - 用户 ID（外键，关联到 user 表）
  - `utm_source` - 来源
  - `utm_medium` - 媒介
  - `utm_campaign` - 活动
  - `utm_content` - 内容
  - `utm_term` - 关键词
  - `visit_at` - 访问时间
  - `ip_address` - 访问 IP（可选）
  - `user_agent` - 浏览器信息（可选）
  - `referrer` - 引荐来源（可选）
  - `created_at` - 记录创建时间
- 支持按用户 ID 和时间范围查询
- 添加索引：`idx_utm_tracking_user_id`, `idx_utm_tracking_visit_at`

#### 场景：查询用户的 UTM 历史

**前置条件：**
- 用户有多次 UTM 访问记录
- 管理员需要查看用户的访问历史

**操作：**
1. 查询 `utm_tracking` 表
2. 按用户 ID 筛选
3. 按时间倒序排列

**预期结果：**
- 返回用户的所有 UTM 访问记录
- 按时间从新到旧排序
- 包含完整的 UTM 参数和访问信息

### 需求：系统必须提供 UTM 数据查询 API

系统必须提供 API 用于查询和统计 UTM 数据。

#### 场景：查询指定用户的 UTM 数据

**前置条件：**
- 管理员已登录
- 需要查看特定用户的 UTM 信息

**操作：**
1. 调用 API：`GET /api/admin/users/{userId}/utm`
2. 传入用户 ID

**预期结果：**
- 返回用户的首次和最后访问 UTM 数据
- 返回格式：
  ```json
  {
    "user_id": "user_123",
    "first_visit": {
      "utm_source": "youtube",
      "utm_medium": "kol",
      "utm_campaign": "2026_kol1",
      "utm_content": "ceci__missxia__video1",
      "utm_term": "",
      "visit_at": "2026-01-20T10:30:00Z"
    },
    "last_visit": {
      "utm_source": "google",
      "utm_medium": "ads",
      "utm_campaign": "2026_q1_brand",
      "utm_content": "",
      "utm_term": "ai_image",
      "visit_at": "2026-01-26T15:45:00Z"
    }
  }
  ```

#### 场景：统计 UTM 活动效果

**前置条件：**
- 管理员需要查看特定活动的转化数据

**操作：**
1. 调用 API：`GET /api/admin/utm/stats`
2. 传入筛选参数（campaign, source, medium 等）
3. 传入时间范围

**预期结果：**
- 返回统计数据：
  ```json
  {
    "campaign": "2026_kol1",
    "total_visits": 1500,
    "unique_users": 850,
    "registered_users": 120,
    "paid_users": 15,
    "total_revenue": 1250.00,
    "breakdown_by_source": [
      {
        "source": "youtube",
        "visits": 1200,
        "users": 680,
        "conversions": 100
      },
      {
        "source": "twitter",
        "visits": 300,
        "users": 170,
        "conversions": 20
      }
    ]
  }
  ```

## 数据库迁移

### 迁移脚本：添加 UTM 字段到 user 表

```sql
-- 添加首次访问 UTM 字段
ALTER TABLE "user" ADD COLUMN "first_utm_source" TEXT;
ALTER TABLE "user" ADD COLUMN "first_utm_medium" TEXT;
ALTER TABLE "user" ADD COLUMN "first_utm_campaign" TEXT;
ALTER TABLE "user" ADD COLUMN "first_utm_content" TEXT;
ALTER TABLE "user" ADD COLUMN "first_utm_term" TEXT;
ALTER TABLE "user" ADD COLUMN "first_visit_at" TIMESTAMP;

-- 添加最后访问 UTM 字段
ALTER TABLE "user" ADD COLUMN "last_utm_source" TEXT;
ALTER TABLE "user" ADD COLUMN "last_utm_medium" TEXT;
ALTER TABLE "user" ADD COLUMN "last_utm_campaign" TEXT;
ALTER TABLE "user" ADD COLUMN "last_utm_content" TEXT;
ALTER TABLE "user" ADD COLUMN "last_utm_term" TEXT;
ALTER TABLE "user" ADD COLUMN "last_visit_at" TIMESTAMP;

-- 添加索引用于统计查询
CREATE INDEX "idx_user_first_utm_campaign" ON "user"("first_utm_campaign");
CREATE INDEX "idx_user_first_utm_source" ON "user"("first_utm_source");
CREATE INDEX "idx_user_last_utm_campaign" ON "user"("last_utm_campaign");
```

### 迁移脚本：创建 utm_tracking 表

```sql
-- 创建 UTM 追踪历史表
CREATE TABLE "utm_tracking" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_content" TEXT,
  "utm_term" TEXT,
  "visit_at" TIMESTAMP NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "referrer" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 添加索引
CREATE INDEX "idx_utm_tracking_user_id" ON "utm_tracking"("user_id");
CREATE INDEX "idx_utm_tracking_visit_at" ON "utm_tracking"("visit_at");
CREATE INDEX "idx_utm_tracking_campaign" ON "utm_tracking"("utm_campaign");
CREATE INDEX "idx_utm_tracking_source" ON "utm_tracking"("utm_source");

-- 复合索引用于常见查询
CREATE INDEX "idx_utm_tracking_user_visit" ON "utm_tracking"("user_id", "visit_at" DESC);
```

## 性能考虑

### 索引策略
- 在常用查询字段上添加索引（campaign, source, user_id）
- 使用复合索引优化多条件查询
- 定期分析查询性能并调整索引

### 数据归档
- 考虑对超过 1 年的 `utm_tracking` 数据进行归档
- 保留聚合统计数据，删除详细记录

### 查询优化
- 使用分页限制返回结果数量
- 对统计查询使用缓存（Redis）
- 考虑使用物化视图存储常用统计数据

## 数据隐私

### GDPR 合规
- UTM 数据属于用户数据，需在用户删除账户时一并删除
- 在隐私政策中说明 UTM 数据的收集和使用
- 支持用户查看和导出自己的 UTM 数据

### 数据保留
- 默认保留 UTM 数据 2 年
- 超过保留期的数据自动归档或删除
- 管理员可配置保留策略

## 依赖关系

- 被 `utm-capture` 规范依赖（前端捕获后存储到此）
- 被 `utm-analytics` 规范依赖（分析工具读取此数据）
- 被 `utm-order-association` 规范依赖（订单关联用户 UTM 数据）
