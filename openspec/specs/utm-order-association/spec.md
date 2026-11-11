# utm-order-association 规范

## 目的
待定 - 由归档变更 add-utm-tracking 创建。归档后请更新目的。
## 需求
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

