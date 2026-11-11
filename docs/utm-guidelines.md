# UTM 参数命名规范

本文档定义了 10b.ai 平台的 UTM 参数标准和命名规范，用于追踪营销活动的转化效果和 ROI。

## 目录

- [UTM 参数概述](#utm-参数概述)
- [五大标准字段](#五大标准字段)
- [命名规范](#命名规范)
- [使用示例](#使用示例)
- [链接生成工具](#链接生成工具)
- [最佳实践](#最佳实践)

## UTM 参数概述

UTM（Urchin Tracking Module）参数是添加在 URL 末尾的查询参数，用于追踪流量来源和营销活动效果。

**基本格式：**
```
https://10b.ai/?utm_source=youtube&utm_medium=kol&utm_campaign=2026_kol_launch&utm_content=ceci__missxia__video1
```

## 五大标准字段

| 字段 | 必填 | 用途 | 示例值 |
|------|------|------|--------|
| `utm_source` | ✅ | 流量来源平台 | `youtube`, `google`, `facebook`, `twitter` |
| `utm_medium` | ✅ | 流量形态 | `kol`, `ads`, `organic`, `pr`, `community` |
| `utm_campaign` | ✅ | 投放批次/活动 | `2026_kol_launch`, `2026_q1_brand` |
| `utm_content` | 推荐 | 执行方/素材 | `ceci__missxia__video1`, `ceci__leoai__description` |
| `utm_term` | 可选 | 关键词/定位 | `ai_image`, `background_remover` |

### 字段说明

#### utm_source（流量来源平台）
- **用途**：标识流量来自哪个平台
- **原则**：平台级，长期稳定
- **推荐值**：
  - 社交媒体：`youtube`, `facebook`, `twitter`, `instagram`, `tiktok`, `linkedin`, `reddit`
  - 搜索引擎：`google`, `bing`, `baidu`
  - 其他：`producthunt`, `newsletter`, `direct`

#### utm_medium（流量形态）
- **用途**：描述流量的类型或营销方式
- **原则**：描述流量特征
- **推荐值**：
  - `kol` - KOL/网红推广
  - `ads` - 付费广告
  - `organic` - 自然流量/SEO
  - `pr` - 新闻/公关
  - `community` - 社群投放
  - `affiliate` - 联盟营销
  - `email` - 邮件营销
  - `referral` - 推荐流量

#### utm_campaign（投放批次）
- **用途**：代表一次营销活动或预算批次
- **原则**：便于追踪和预算管理
- **格式**：`年_渠道_主题`
- **示例**：
  - `2026_kol_launch` - 2026年 KOL 启动活动
  - `2026_youtube_kol` - 2026年 YouTube KOL 推广
  - `2026_q1_brand` - 2026年第一季度品牌推广
  - `2026_black_friday` - 2026年黑色星期五促销

#### utm_content（执行层）
- **用途**：标识具体执行方和素材位置
- **原则**：精确到执行方和内容位置
- **格式**：`服务商__kol__内容位置`
- **示例**：
  - `ceci__missxia__video1` - Ceci 服务商，MissXia KOL，视频1
  - `ceci__missxia__pinned_comment` - Ceci 服务商，MissXia KOL，置顶评论
  - `ceci__leoai__description` - Ceci 服务商，LeoAI KOL，视频描述
  - `direct__techcrunch__article` - 直接合作，TechCrunch，文章

#### utm_term（关键词/定位）
- **用途**：关键词定位、A/B 测试变体
- **原则**：可选字段，用于细分
- **示例**：
  - `ai_image` - AI 图像生成关键词
  - `background_remover` - 背景移除关键词
  - `test_a` - A/B 测试变体 A
  - `mobile_users` - 移动端用户定位

## 命名规范

### 通用规则

1. **使用小写字母**：所有参数值使用小写字母
2. **使用下划线分隔**：单词之间使用下划线 `_` 分隔
3. **避免特殊字符**：不使用空格、中文、特殊符号
4. **保持简洁**：参数值尽量简短，最长不超过 200 字符
5. **保持一致性**：同一平台/活动使用相同的命名

### utm_content 特殊规范

对于 `utm_content` 字段，使用双下划线 `__` 分隔不同层级：

```
服务商__KOL__内容位置
```

**示例：**
- `ceci__missxia__video1` - Ceci 服务商 → MissXia KOL → 视频1
- `ceci__missxia__pinned_comment` - Ceci 服务商 → MissXia KOL → 置顶评论
- `direct__techcrunch__article` - 直接合作 → TechCrunch → 文章

## 使用示例

### 示例 1：YouTube KOL 推广

**场景**：通过 Ceci 服务商，与 MissXia 合作，在 YouTube 视频中推广

**UTM 链接：**
```
https://10b.ai/?utm_source=youtube&utm_medium=kol&utm_campaign=2026_kol_launch&utm_content=ceci__missxia__video1&utm_term=ai_image
```

**参数解析：**
- `utm_source=youtube` - 流量来自 YouTube
- `utm_medium=kol` - 通过 KOL 推广
- `utm_campaign=2026_kol_launch` - 2026年 KOL 启动活动
- `utm_content=ceci__missxia__video1` - Ceci 服务商，MissXia KOL，视频1
- `utm_term=ai_image` - 关键词：AI 图像生成

### 示例 2：Facebook 付费广告

**场景**：在 Facebook 投放付费广告，推广背景移除功能

**UTM 链接：**
```
https://10b.ai/?utm_source=facebook&utm_medium=ads&utm_campaign=2026_q1_brand&utm_content=ad_set_1&utm_term=background_remover
```

**参数解析：**
- `utm_source=facebook` - 流量来自 Facebook
- `utm_medium=ads` - 付费广告
- `utm_campaign=2026_q1_brand` - 2026年第一季度品牌推广
- `utm_content=ad_set_1` - 广告组1
- `utm_term=background_remover` - 关键词：背景移除

### 示例 3：Product Hunt 发布

**场景**：在 Product Hunt 发布产品

**UTM 链接：**
```
https://10b.ai/?utm_source=producthunt&utm_medium=organic&utm_campaign=2026_ph_launch&utm_content=main_post
```

**参数解析：**
- `utm_source=producthunt` - 流量来自 Product Hunt
- `utm_medium=organic` - 自然流量
- `utm_campaign=2026_ph_launch` - 2026年 Product Hunt 发布
- `utm_content=main_post` - 主帖子

### 示例 4：邮件营销

**场景**：发送营销邮件给订阅用户

**UTM 链接：**
```
https://10b.ai/?utm_source=newsletter&utm_medium=email&utm_campaign=2026_q1_newsletter&utm_content=cta_button
```

**参数解析：**
- `utm_source=newsletter` - 流量来自邮件订阅
- `utm_medium=email` - 邮件营销
- `utm_campaign=2026_q1_newsletter` - 2026年第一季度邮件营销
- `utm_content=cta_button` - CTA 按钮

## 链接生成工具

### 在线工具

推荐使用以下工具生成 UTM 链接：

1. **Google Campaign URL Builder**
   - 网址：https://ga-dev-tools.google/campaign-url-builder/
   - 特点：Google 官方工具，简单易用

2. **UTM.io**
   - 网址：https://utm.io/
   - 特点：支持批量生成，提供链接管理

### 手动生成

**基本格式：**
```
https://10b.ai/?utm_source=[来源]&utm_medium=[媒介]&utm_campaign=[活动]&utm_content=[内容]&utm_term=[关键词]
```

**注意事项：**
- 参数之间使用 `&` 连接
- 参数值需要进行 URL 编码（如果包含特殊字符）
- 第一个参数前使用 `?`，后续参数使用 `&`

## 最佳实践

### 1. 保持一致性

**✅ 正确：**
```
utm_source=youtube
utm_source=youtube
utm_source=youtube
```

**❌ 错误：**
```
utm_source=youtube
utm_source=YouTube
utm_source=yt
```

### 2. 使用有意义的名称

**✅ 正确：**
```
utm_campaign=2026_kol_launch
utm_content=ceci__missxia__video1
```

**❌ 错误：**
```
utm_campaign=campaign1
utm_content=link1
```

### 3. 避免过长的参数

**✅ 正确：**
```
utm_content=ceci__missxia__video1
```

**❌ 错误：**
```
utm_content=ceci_agency_missxia_kol_youtube_video_number_1_main_link
```

### 4. 记录 UTM 参数

建议维护一个 UTM 参数表格，记录所有使用的 UTM 参数：

| Campaign | Source | Medium | Content | 开始日期 | 结束日期 | 预算 | 备注 |
|----------|--------|--------|---------|----------|----------|------|------|
| 2026_kol_launch | youtube | kol | ceci__missxia__video1 | 2026-01-01 | 2026-03-31 | $5000 | MissXia 视频推广 |
| 2026_q1_brand | facebook | ads | ad_set_1 | 2026-01-01 | 2026-03-31 | $10000 | Facebook 品牌广告 |

### 5. 定期审查和清理

- 每季度审查 UTM 参数使用情况
- 删除无效或过期的 UTM 参数
- 统一命名规范，避免重复

### 6. 测试 UTM 链接

在正式使用前，务必测试 UTM 链接：

1. 点击 UTM 链接，确保能正常访问
2. 检查浏览器开发者工具，确认 Cookie 已设置
3. 创建测试订单，验证 UTM 数据是否正确关联

## 数据查询

### 查询 UTM 统计数据

使用管理员 API 查询 UTM 统计数据：

```bash
GET /api/admin/utm/stats?campaign=2026_kol_launch&start_date=2026-01-01&end_date=2026-03-31
```

**响应示例：**
```json
{
  "total_orders": 150,
  "total_amount": 45000,
  "breakdown_by_source": [
    {
      "source": "youtube",
      "orders": 100,
      "amount": 30000
    },
    {
      "source": "facebook",
      "orders": 50,
      "amount": 15000
    }
  ],
  "breakdown_by_content": [
    {
      "content": "ceci__missxia__video1",
      "orders": 80,
      "amount": 24000
    },
    {
      "content": "ceci__leoai__description",
      "orders": 20,
      "amount": 6000
    }
  ]
}
```

### 导出订单数据

导出包含 UTM 数据的订单 CSV：

```bash
GET /api/admin/orders/export?campaign=2026_kol_launch&start_date=2026-01-01&end_date=2026-03-31
```

## 隐私和合规

### GDPR/CCPA 合规

- UTM 参数不包含个人身份信息（PII）
- Cookie 有效期为 30 天
- 用户可以通过清除浏览器 Cookie 删除 UTM 数据
- 隐私政策中已说明 UTM 数据收集用途

### Cookie 说明

- **Cookie 名称**：`utm_params`
- **有效期**：30 天
- **用途**：追踪营销活动转化效果
- **存储内容**：UTM 参数（不包含个人信息）

## 技术实现

### 前端捕获

UTM 参数在页面加载时自动捕获并存储到 Cookie：

```typescript
// 自动捕获 UTM 参数
import { captureAndSaveUTM } from '@/shared/lib/utm';

useEffect(() => {
  captureAndSaveUTM();
}, []);
```

### 后端关联

创建订单时，自动从 Cookie 读取 UTM 参数并关联到订单：

```typescript
// 获取 UTM 数据
const utmData = await getUTMFromCookie();
const utmFields = utmDataToDbFields(utmData);

// 创建订单时关联 UTM 数据
const order = {
  // ... 其他字段
  ...utmFields,
};
```

## 常见问题

### Q1: UTM 参数会影响 SEO 吗？

不会。搜索引擎会忽略 UTM 参数，不会影响页面的 SEO 排名。

### Q2: UTM 参数可以追踪多久？

Cookie 有效期为 30 天。如果用户在 30 天内创建订单，UTM 数据会被关联到订单。

### Q3: 如果用户清除 Cookie 怎么办？

如果用户清除 Cookie，UTM 数据会丢失。但历史访问记录已保存在 `utm_tracking` 表中。

### Q4: 可以修改已有订单的 UTM 数据吗？

不建议修改。UTM 数据应该在订单创建时自动关联，保持数据的准确性。

### Q5: 如何处理多次访问？

如果用户多次访问（带不同 UTM 参数），Cookie 会被最新的 UTM 参数覆盖。订单关联的是最后一次访问的 UTM 数据。

## 联系支持

如有问题或建议，请联系：
- 技术支持：tech@10b.ai
- 营销团队：marketing@10b.ai

---

**文档版本**：v1.0
**最后更新**：2026-01-27
**维护者**：10b.ai 技术团队
