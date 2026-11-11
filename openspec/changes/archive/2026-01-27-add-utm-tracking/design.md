# 设计文档：UTM 追踪系统架构（订单关联方案）

## 架构概览

UTM 追踪系统采用简化的订单关联架构，通过 Cookie 存储 UTM 参数，在创建订单时关联数据。

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ URL 参数解析 │  │ 参数清理验证  │  │ Cookie 存储   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                  │              │
│           └────────────────┴──────────────────┘              │
│                          │                                   │
│                          ▼                                   │
│                    utm_params Cookie                         │
│                    (有效期 30 天)                             │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 层                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              订单创建 API                              │   │
│  │  - 读取 Cookie 中的 UTM 数据                          │   │
│  │  - 创建订单并关联 UTM                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              order 表                                  │   │
│  │  + utm_source                                         │   │
│  │  + utm_medium                                         │   │
│  │  + utm_campaign                                       │   │
│  │  + utm_content                                        │   │
│  │  + utm_term                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  统计分析层                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              UTM 统计 API                              │   │
│  │  - 按活动/渠道统计订单                                 │   │
│  │  - 计算转化率和 ROI                                   │   │
│  │  - 导出数据用于结算                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 数据流设计

### 流程 1：用户访问（捕获 UTM）

```
用户通过 UTM 链接访问
    │
    ▼
解析 URL 中的 UTM 参数
    │
    ▼
清理和验证参数（XSS 防护）
    │
    ▼
存储到 Cookie（utm_params，30天有效期）
    │
    ▼
用户浏览网站（UTM 数据保持在 Cookie 中）
```

### 流程 2：用户创建订单

```
用户提交订单
    │
    ▼
服务端处理订单创建请求
    │
    ▼
从 Cookie 读取 utm_params
    │
    ├─> Cookie 存在
    │   │
    │   ▼
    │   解析 JSON 数据
    │   │
    │   ▼
    │   创建订单，包含 UTM 字段
    │
    └─> Cookie 不存在
        │
        ▼
        创建订单，UTM 字段为 null
```

### 流程 3：管理员查看统计

```
管理员访问统计页面
    │
    ▼
选择筛选条件（活动、渠道、时间范围）
    │
    ▼
调用统计 API
    │
    ▼
查询订单表，按 UTM 字段分组统计
    │
    ▼
返回统计结果（订单数、金额、转化率）
    │
    ▼
展示数据或导出 CSV
```

## 数据模型设计

### order 表扩展

```typescript
interface Order {
  // 现有字段...
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: Date;

  // 新增：UTM 字段
  utm_source?: string;      // 来源平台（如 youtube, google）
  utm_medium?: string;      // 流量形态（如 kol, ads）
  utm_campaign?: string;    // 活动批次（如 2026_kol1）
  utm_content?: string;     // 执行方/素材（如 ceci__missxia__video1）
  utm_term?: string;        // 关键词（可选）
}
```

## Cookie 设计

### Cookie 结构

```javascript
// Cookie 名称
const COOKIE_NAME = 'utm_params';

// Cookie 值（JSON 字符串）
const cookieValue = JSON.stringify({
  utm_source: 'youtube',
  utm_medium: 'kol',
  utm_campaign: '2026_kol1',
  utm_content: 'ceci__missxia__video1',
  utm_term: ''
});

// Cookie 属性
{
  name: 'utm_params',
  value: encodeURIComponent(cookieValue),
  maxAge: 30 * 24 * 60 * 60,  // 30 天
  path: '/',
  sameSite: 'lax',
  secure: true  // 生产环境
}
```

### Cookie 生命周期

1. **创建**：用户通过 UTM 链接访问时创建
2. **更新**：用户通过新的 UTM 链接访问时覆盖
3. **读取**：创建订单时读取
4. **过期**：30 天后自动过期

## API 设计

### 订单创建 API（扩展）

**POST /api/orders**

**请求体：**
```json
{
  "items": [...],
  "amount": 100.00,
  // 其他订单字段
}
```

**Cookie：**
```
utm_params=%7B%22utm_source%22%3A%22youtube%22%2C%22utm_medium%22%3A%22kol%22...
```

**响应：**
```json
{
  "order_id": "order_123",
  "amount": 100.00,
  "utm_source": "youtube",
  "utm_medium": "kol",
  "utm_campaign": "2026_kol1",
  "utm_content": "ceci__missxia__video1"
}
```

### UTM 统计 API

**GET /api/admin/utm/stats**

**查询参数：**
- `campaign` - 筛选特定活动
- `source` - 筛选特定来源
- `medium` - 筛选特定媒介
- `start_date` - 开始日期（YYYY-MM-DD）
- `end_date` - 结束日期（YYYY-MM-DD）

**响应：**
```json
{
  "summary": {
    "total_orders": 150,
    "total_amount": 12500.00,
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    }
  },
  "by_campaign": [
    {
      "campaign": "2026_kol1",
      "orders": 120,
      "amount": 10000.00
    }
  ],
  "by_source": [
    {
      "source": "youtube",
      "orders": 100,
      "amount": 8500.00
    },
    {
      "source": "twitter",
      "orders": 20,
      "amount": 1500.00
    }
  ],
  "by_content": [
    {
      "content": "ceci__missxia__video1",
      "orders": 80,
      "amount": 6500.00
    }
  ]
}
```

### 订单导出 API

**GET /api/admin/orders/export**

**查询参数：**
- `campaign` - 筛选活动
- `source` - 筛选来源
- `start_date` - 开始日期
- `end_date` - 结束日期
- `format` - 导出格式（csv, json）

**响应（CSV）：**
```csv
order_id,amount,created_at,utm_source,utm_medium,utm_campaign,utm_content,utm_term
order_123,100.00,2026-01-26T10:30:00Z,youtube,kol,2026_kol1,ceci__missxia__video1,
order_124,50.00,2026-01-26T11:00:00Z,youtube,kol,2026_kol1,ceci__leoai__description,
```

## 技术实现

### 客户端：UTM 捕获

```typescript
// src/shared/lib/utm.ts

export function sanitizeUTMValue(value: string): string {
  // 移除 HTML 标签
  value = value.replace(/<[^>]*>/g, '');
  // 移除特殊字符
  value = value.replace(/[<>"']/g, '');
  // 限制长度
  value = value.substring(0, 200);
  return value.trim();
}

export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  let hasUTM = false;
  for (const key of utmKeys) {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = sanitizeUTMValue(value);
      hasUTM = true;
    }
  }

  // 只有当 URL 中有 UTM 参数时才更新 Cookie
  if (hasUTM) {
    const cookieValue = encodeURIComponent(JSON.stringify(utmParams));
    const maxAge = 30 * 24 * 60 * 60; // 30 天
    const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';

    document.cookie = `utm_params=${cookieValue}; max-age=${maxAge}; path=/; samesite=lax${secure}`;
  }
}
```

### 客户端：UTM 追踪组件

```typescript
// src/shared/components/utm-tracker.tsx

'use client';

import { useEffect } from 'react';
import { captureUTMParams } from '@/shared/lib/utm';

export function UTMTracker() {
  useEffect(() => {
    captureUTMParams();
  }, []);

  return null;
}
```

### 服务端：读取 Cookie

```typescript
// src/shared/lib/utm-server.ts

import { cookies } from 'next/headers';

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export async function getUTMFromCookie(): Promise<UTMData | null> {
  try {
    const cookieStore = await cookies();
    const utmCookie = cookieStore.get('utm_params');

    if (!utmCookie) {
      return null;
    }

    const utmData = JSON.parse(decodeURIComponent(utmCookie.value));

    return {
      utm_source: utmData.utm_source || null,
      utm_medium: utmData.utm_medium || null,
      utm_campaign: utmData.utm_campaign || null,
      utm_content: utmData.utm_content || null,
      utm_term: utmData.utm_term || null,
    };
  } catch (error) {
    console.error('Failed to parse UTM cookie:', error);
    return null;
  }
}
```

### 服务端：订单创建

```typescript
// 订单创建逻辑（示例）

import { getUTMFromCookie } from '@/shared/lib/utm-server';
import { db } from '@/core/db';
import { order } from '@/config/db/schema';

export async function createOrder(orderData: CreateOrderData) {
  // 从 Cookie 读取 UTM 数据
  const utmData = await getUTMFromCookie();

  // 创建订单，包含 UTM 数据
  const newOrder = await db.insert(order).values({
    ...orderData,
    utm_source: utmData?.utm_source,
    utm_medium: utmData?.utm_medium,
    utm_campaign: utmData?.utm_campaign,
    utm_content: utmData?.utm_content,
    utm_term: utmData?.utm_term,
  }).returning();

  return newOrder[0];
}
```

## 数据库设计

### Schema 定义（Drizzle ORM）

```typescript
// src/config/db/schema.ts

import { pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const order = pgTable(
  'order',
  {
    // 现有字段...
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: text('status').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),

    // 新增：UTM 字段
    utm_source: text('utm_source'),
    utm_medium: text('utm_medium'),
    utm_campaign: text('utm_campaign'),
    utm_content: text('utm_content'),
    utm_term: text('utm_term'),
  },
  (table) => [
    // 新增索引
    index('idx_order_utm_campaign').on(table.utm_campaign),
    index('idx_order_utm_source').on(table.utm_source),
    index('idx_order_utm_campaign_created').on(table.utm_campaign, table.created_at),
  ]
);
```

### 迁移脚本

```sql
-- 添加 UTM 字段
ALTER TABLE "order" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_content" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_term" TEXT;

-- 添加索引
CREATE INDEX "idx_order_utm_campaign" ON "order"("utm_campaign");
CREATE INDEX "idx_order_utm_source" ON "order"("utm_source");
CREATE INDEX "idx_order_utm_campaign_created" ON "order"("utm_campaign", "created_at");
```

## 统计查询实现

### 按活动统计

```typescript
import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export async function getUTMStatsByCampaign(
  campaign: string,
  startDate: Date,
  endDate: Date
) {
  const stats = await db
    .select({
      source: order.utm_source,
      orderCount: sql<number>`count(*)`,
      totalAmount: sql<number>`sum(${order.amount})`,
    })
    .from(order)
    .where(
      and(
        sql`${order.utm_campaign} = ${campaign}`,
        gte(order.created_at, startDate),
        lte(order.created_at, endDate)
      )
    )
    .groupBy(order.utm_source);

  return stats;
}
```

## 安全考虑

### XSS 防护

所有 UTM 参数在存储前都经过清理：
- 移除 HTML 标签
- 移除特殊字符（<, >, ", '）
- 限制长度（200 字符）

### Cookie 安全

- 使用 `Secure` 标志（生产环境）
- 使用 `SameSite=Lax` 防止 CSRF
- 不存储敏感信息
- 30 天自动过期

### SQL 注入防护

使用 Drizzle ORM 的参数化查询，自动防止 SQL 注入。

## 性能优化

### 索引策略

```sql
-- 单列索引（用于简单筛选）
CREATE INDEX idx_order_utm_campaign ON "order"(utm_campaign);
CREATE INDEX idx_order_utm_source ON "order"(utm_source);

-- 复合索引（用于时间范围查询）
CREATE INDEX idx_order_utm_campaign_created ON "order"(utm_campaign, created_at);
```

### 查询优化

- 使用索引加速查询
- 对统计结果使用缓存（Redis，5分钟）
- 分页限制返回结果数量

### 缓存示例

```typescript
import { redis } from '@/shared/lib/redis';

export async function getUTMStatsWithCache(filters: UTMStatsFilters) {
  const cacheKey = `utm_stats:${JSON.stringify(filters)}`;

  // 尝试从缓存读取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 从数据库查询
  const stats = await getUTMStats(filters);

  // 缓存 5 分钟
  await redis.setex(cacheKey, 300, JSON.stringify(stats));

  return stats;
}
```

## 监控和日志

### 关键指标

1. **捕获率**：有 UTM 数据的订单占比
2. **Cookie 有效率**：创建订单时 Cookie 存在的比率
3. **数据完整性**：UTM 字段的非空率

### 日志记录

```typescript
logger.info('UTM captured', {
  utm_source: utmData.utm_source,
  utm_campaign: utmData.utm_campaign,
});

logger.info('Order created with UTM', {
  order_id: order.id,
  utm_campaign: order.utm_campaign,
  has_utm: !!order.utm_source,
});
```

## 总结

这个简化的订单关联方案具有以下优势：

1. **实现简单**：只需扩展订单表，不需要额外的追踪表
2. **性能良好**：Cookie 读取快速，不增加额外的数据库查询
3. **数据准确**：直接关联到订单，准确反映转化来源
4. **易于分析**：通过订单表即可进行所有统计分析

适合快速上线并满足基本的营销归因需求。
