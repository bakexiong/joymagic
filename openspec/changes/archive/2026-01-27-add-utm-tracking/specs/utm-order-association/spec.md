# 规范：订单 UTM 关联

## 新增需求

### 需求：订单表必须扩展支持 UTM 字段

数据库的 `order` 表必须扩展以存储 UTM 追踪数据。

#### 场景：创建订单时存储用户的 UTM 数据

**前置条件：**
- 用户创建订单
- 用户账户中存在 UTM 数据（first_utm_* 字段）

**操作：**
1. 从用户记录中读取首次访问的 UTM 数据
2. 创建订单记录，包含 UTM 字段

**预期结果：**
- 订单记录包含以下字段：
  - `utm_source` - 来源平台
  - `utm_medium` - 流量形态
  - `utm_campaign` - 活动批次
  - `utm_content` - 执行方/素材
  - `utm_term` - 关键词（可选）
- 所有字段为可选（nullable）
- 字段类型为 `text`
- UTM 数据来自用户的 `first_utm_*` 字段

#### 场景：创建订单时用户无 UTM 数据

**前置条件：**
- 用户创建订单
- 用户账户中不存在 UTM 数据（直接注册，未通过 UTM 链接）

**操作：**
1. 检查用户的 UTM 数据
2. 未找到 UTM 数据
3. 创建订单记录，UTM 字段为空

**预期结果：**
- 订单创建成功
- UTM 字段为 `null`
- 不影响订单创建流程

### 需求：系统必须提供订单 UTM 统计查询 API

系统必须提供 API 用于查询和统计订单的 UTM 数据。

#### 场景：按活动统计订单数据

**前置条件：**
- 管理员需要查看特定活动的订单统计

**操作：**
1. 调用 API：`GET /api/admin/utm/orders/stats`
2. 传入筛选参数：`campaign=2026_kol1`
3. 传入时间范围：`start_date=2026-01-01&end_date=2026-01-31`

**预期结果：**
- 返回统计数据：
  ```json
  {
    "campaign": "2026_kol1",
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "total_orders": 150,
    "total_amount": 12500.00,
    "breakdown_by_source": [
      {
        "source": "youtube",
        "orders": 120,
        "amount": 10000.00
      },
      {
        "source": "twitter",
        "orders": 30,
        "amount": 2500.00
      }
    ],
    "breakdown_by_content": [
      {
        "content": "ceci__missxia__video1",
        "orders": 80,
        "amount": 6500.00
      },
      {
        "content": "ceci__leoai__description",
        "orders": 40,
        "amount": 3500.00
      }
    ]
  }
  ```

#### 场景：导出订单 UTM 数据

**前置条件：**
- 管理员需要导出订单数据用于财务结算

**操作：**
1. 调用 API：`GET /api/admin/orders/export`
2. 传入筛选参数（campaign, source, date_range 等）
3. 指定导出格式：`format=csv`

**预期结果：**
- 返回 CSV 文件，包含以下列：
  - 订单 ID
  - 用户 ID
  - 订单金额
  - 创建时间
  - utm_source
  - utm_medium
  - utm_campaign
  - utm_content
  - utm_term

## 数据库迁移

### 迁移脚本：添加 UTM 字段到 order 表

```sql
-- 添加 UTM 字段到 order 表
ALTER TABLE "order" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_content" TEXT;
ALTER TABLE "order" ADD COLUMN "utm_term" TEXT;

-- 添加索引用于统计查询
CREATE INDEX "idx_order_utm_campaign" ON "order"("utm_campaign");
CREATE INDEX "idx_order_utm_source" ON "order"("utm_source");
CREATE INDEX "idx_order_utm_campaign_created" ON "order"("utm_campaign", "created_at");
```

## 性能考虑

### 索引策略
- 在常用查询字段上添加索引（utm_campaign, utm_source）
- 使用复合索引优化时间范围查询（utm_campaign + created_at）

### 查询优化
- 使用分页限制返回结果数量
- 对统计查询使用缓存（Redis）
- 考虑使用物化视图存储常用统计数据

### 统计查询示例

```sql
-- 按活动统计订单数量和金额
SELECT
  utm_campaign,
  utm_source,
  COUNT(*) as order_count,
  SUM(amount) as total_amount
FROM "order"
WHERE utm_campaign = '2026_kol1'
  AND created_at >= '2026-01-01'
  AND created_at < '2026-02-01'
GROUP BY utm_campaign, utm_source
ORDER BY total_amount DESC;
```

## 技术实现

### 订单创建时关联 UTM

```typescript
import { db } from '@/core/db';
import { order, user } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

async function createOrder(orderData: OrderData, userId: string) {
  // 从用户记录读取 UTM 数据
  const userData = await db
    .select({
      first_utm_source: user.first_utm_source,
      first_utm_medium: user.first_utm_medium,
      first_utm_campaign: user.first_utm_campaign,
      first_utm_content: user.first_utm_content,
      first_utm_term: user.first_utm_term,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const utmData = userData[0];

  // 创建订单，包含 UTM 数据
  const newOrder = await db.insert(order).values({
    ...orderData,
    user_id: userId,
    utm_source: utmData?.first_utm_source,
    utm_medium: utmData?.first_utm_medium,
    utm_campaign: utmData?.first_utm_campaign,
    utm_content: utmData?.first_utm_content,
    utm_term: utmData?.first_utm_term,
  }).returning();

  return newOrder[0];
}
```

### 订单 UTM 统计查询

```typescript
import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export async function getOrderUTMStats(
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

## 数据一致性

### UTM 数据来源
- 订单的 UTM 数据来自用户的 `first_utm_*` 字段
- 反映用户首次访问时的来源渠道
- 即使用户后续通过其他渠道访问，订单仍关联首次来源

### 数据更新策略
- 订单创建后，UTM 数据不再更新
- 保持订单 UTM 数据的稳定性，用于准确的归因分析

## 业务价值

### 订单级别的归因分析
- 可以精确统计每个营销活动带来的订单数量和金额
- 支持按渠道、KOL、活动等维度分析订单转化
- 为营销预算分配和 ROI 计算提供数据支持

### 与用户 UTM 数据的关系
- **用户表 UTM**：记录用户的来源渠道（首次和最后）
- **订单表 UTM**：记录每笔订单的归因渠道
- **追踪表 UTM**：记录用户的完整访问历史

三者结合，提供完整的营销归因分析能力。

## 依赖关系

- 依赖 `utm-storage` 规范（用户表 UTM 字段）
- 被管理后台的订单 UTM 报表功能依赖
