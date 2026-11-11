# 变更：为 Affiliate 增加专属折扣码与购买页兑换入口

## 为什么

当前分销体系只支持通过专属链接完成归因，不适合短视频、直播口播等更依赖“口令/优惠码”传播的场景。运营需要让每个推广者拥有一个可传播、可编辑的折扣码，并允许用户在站内购买页直接输入兑换。

## 变更内容

- 为每个推广者新增唯一的专属折扣码，默认自动生成，管理员可编辑
- 为每个推广者折扣码增加有效期设置，默认生效 30 天，管理员可调整
- 在用户侧 `/settings/affiliate` 展示推广链接与折扣码
- 在 admin affiliate 模块中增加折扣码查看、编辑与状态管理能力
- 在站内购买/支付页面新增折扣码输入与兑换入口
- 下单时支持基于 affiliate 折扣码完成优惠计算
- 明确归因优先级：仅有效 affiliate cookie 或既有 referral 可参与归因；折扣码只用于优惠，不参与佣金归因

## 影响

- 受影响规范：`affiliate-admin`
- 受影响代码：`src/shared/models/affiliate.ts`，`src/config/db/schema.ts`，`src/app/api/admin/affiliate/*`，`src/app/api/affiliate/*`，`src/shared/blocks/affiliate-*`，购买/支付页面与支付服务链路
