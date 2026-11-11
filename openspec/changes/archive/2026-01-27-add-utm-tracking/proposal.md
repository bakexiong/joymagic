# 提案：添加 UTM 参数追踪系统

## 为什么

当前 10b.ai 平台缺少系统化的流量来源追踪机制，导致以下问题：

1. **无法评估营销效果**：不知道哪些渠道带来了真实的用户转化和收入
2. **KOL 推广难以量化**：无法准确评估每个 KOL 的推广效果和 ROI
3. **服务商结算困难**：缺少数据支持，难以与营销服务商进行效果结算
4. **营销预算浪费**：无法识别高效渠道，导致预算分配不合理
5. **决策缺乏依据**：产品和营销决策缺少数据支持

通过实现标准的 UTM 参数追踪系统，可以：
- 精确追踪每个营销活动的转化效果
- 为营销预算分配提供数据依据
- 支持与服务商的透明结算
- 优化营销策略，提高 ROI

这是一个基础设施级别的功能，对业务增长至关重要。

## 变更内容

本变更将引入以下规范增量：

1. **utm-capture** - UTM 参数捕获
   - 在客户端捕获 URL 中的 UTM 参数
   - 解析和验证 UTM 参数格式

2. **utm-storage** - UTM 参数存储
   - 将 UTM 参数存储到 Cookie
   - 管理 Cookie 生命周期（30 天有效期）
   - 提供 localStorage 备用存储

3. **utm-order-association** - 订单关联
   - 扩展订单表添加 UTM 字段
   - 在创建订单时关联 UTM 数据
   - 从 Cookie 读取并验证 UTM 参数

4. **utm-analytics** - UTM 数据分析
   - 提供基础的 UTM 统计查询
   - 按渠道、活动、时间范围分析订单数据
   - 计算转化率和 ROI

## 概述

为 10b.ai 平台实现 UTM 参数追踪系统，通过 Cookie 存储 UTM 参数，并在创建订单时关联 UTM 数据，用于追踪营销活动的转化效果和 ROI。

**核心流程：**
1. 用户通过 UTM 链接访问网站 → 将 UTM 参数存储到 Cookie
2. 用户创建订单 → 从 Cookie 读取 UTM 参数并关联到订单
3. 通过订单数据分析营销效果和 ROI

## 背景

当前平台缺少系统化的流量来源追踪机制，无法有效评估：
- 不同营销渠道的转化效果
- KOL 推广的实际价值
- 服务商（agency）的执行质量
- 营销活动的 ROI

通过实现标准的 UTM 参数追踪系统，可以为业务决策提供数据支持，优化营销投入。

## 目标

1. **捕获 UTM 参数**：在用户访问时捕获 URL 中的 UTM 参数并存储到 Cookie
2. **订单关联**：在创建订单时将 UTM 数据关联到订单记录
3. **数据分析**：通过订单数据分析营销活动的转化效果和 ROI
4. **标准化规范**：建立统一的 UTM 命名规范，确保数据质量

## UTM 参数标准

### 五大标准字段

| 字段 | 用途 | 示例值 |
|------|------|--------|
| `utm_source` | 流量来源平台 | `youtube`, `google`, `facebook`, `twitter` |
| `utm_medium` | 流量形态 | `kol`, `ads`, `organic`, `pr`, `community` |
| `utm_campaign` | 投放批次/活动 | `2026_kol_launch`, `2026_q1_brand` |
| `utm_content` | 执行方/素材 | `ceci__missxia__video1`, `ceci__leoai__description` |
| `utm_term` | 关键词/定位（可选） | `ai_image`, `background_remover` |

### 命名规范

#### utm_source（平台层）
- 原则：平台级，长期稳定
- 推荐值：`youtube`, `google`, `facebook`, `twitter`, `instagram`, `tiktok`, `linkedin`, `reddit`, `producthunt`

#### utm_medium（流量形态）
- 原则：描述流量类型
- 推荐值：
  - `kol` - KOL 推广
  - `ads` - 付费广告
  - `organic` - 自然流量/SEO
  - `pr` - 新闻/公关
  - `community` - 社群投放
  - `affiliate` - 联盟营销
  - `email` - 邮件营销

#### utm_campaign（投放批次）
- 原则：代表一次营销活动或预算批次
- 格式：`年_渠道_主题`
- 示例：`2026_kol_launch`, `2026_youtube_kol`, `2026_q1_brand`

#### utm_content（执行层）
- 原则：标识具体执行方和素材
- 格式：`服务商__kol__内容位置`
- 示例：
  - `ceci__missxia__video1`
  - `ceci__missxia__pinned_comment`
  - `ceci__leoai__description`

#### utm_term（可选）
- 用途：关键词定位、A/B 测试变体
- 示例：`ai_image`, `test_a`, `mobile_users`

## 技术方案

### 1. 前端捕获（客户端）
- 页面加载时，使用 JavaScript 解析 URL 中的 UTM 参数
- 将 UTM 参数存储到 Cookie（有效期 30 天）
- Cookie 名称：`utm_params`，值为 JSON 格式

### 2. 订单关联（后端）
- 扩展 `order` 表，添加 UTM 字段（utm_source, utm_medium, utm_campaign, utm_content, utm_term）
- 在创建订单时，从请求的 Cookie 中读取 UTM 参数
- 将 UTM 参数存储到订单记录中

### 3. 数据分析
- 通过订单表查询 UTM 数据
- 按活动、渠道、时间范围统计订单数量和金额
- 计算每个营销活动的 ROI

## 实施范围

### 包含
- ✅ 客户端 UTM 参数捕获和 Cookie 存储
- ✅ 扩展订单表添加 UTM 字段
- ✅ 创建订单时关联 UTM 数据
- ✅ 基础的 UTM 统计查询（按订单分析）

### 不包含
- ❌ 用户级别的 UTM 追踪（不扩展 user 表）
- ❌ 独立的 utm_tracking 历史表
- ❌ 与分析工具的深度集成（后续迭代）
- ❌ 复杂的数据可视化仪表板（后续迭代）
- ❌ UTM 参数白名单验证（后续迭代）

## 成功标准

1. **功能完整性**
   - 能够捕获所有 5 个 UTM 参数并存储到 Cookie
   - 创建订单时 UTM 数据正确关联到订单记录
   - 可以通过订单数据查询和统计 UTM 效果

2. **数据准确性**
   - UTM 数据在 Cookie 有效期内不丢失
   - 订单的 UTM 数据准确反映用户访问时的来源
   - 统计数据准确（订单数、金额、转化率等）

3. **性能要求**
   - UTM 捕获不影响页面加载速度
   - 订单创建流程不受影响
   - 统计查询性能良好

## 风险与限制

### 风险
1. **隐私合规**：需确保符合 GDPR/CCPA 等隐私法规
2. **Cookie 限制**：Safari 等浏览器的 Cookie 限制可能影响追踪
3. **数据质量**：依赖营销团队正确使用 UTM 参数

### 缓解措施
1. 在隐私政策中说明数据收集用途
2. 使用多种存储方式（Cookie + localStorage）
3. 提供 UTM 参数生成工具和文档

## 后续迭代

1. **Phase 2**：UTM 参数白名单验证
2. **Phase 3**：高级分析仪表板
3. **Phase 4**：自动化归因和 ROI 计算
4. **Phase 5**：与 CRM 系统集成

## 相关资源

- [Google Analytics UTM 参数文档](https://support.google.com/analytics/answer/1033863)
- [UTM 参数最佳实践](https://blog.hubspot.com/marketing/utm-parameters)

## 批准

- [ ] 产品负责人
- [ ] 技术负责人
- [ ] 数据分析负责人
