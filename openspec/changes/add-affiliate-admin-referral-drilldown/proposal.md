# 变更：为 Affiliate Admin 增加按推广码查看注册用户与转化用户明细

## 为什么

当前 affiliate 管理后台只能看到推广者的注册人数汇总，以及在佣金页查看已经产生佣金的转化用户，但无法围绕单个推广码直接查看其带来的注册用户明细和订单转化用户明细，给运营排查与核对带来额外成本。

## 变更内容

- 在 affiliate admin 中为单个推广者增加“归因明细”查看能力
- 支持查看该推广码对应的注册用户列表
- 支持查看该推广码对应的订单转化用户列表，并展示订单/订阅来源与佣金状态
- 保持现有 admin 布局、权限体系与 affiliate 数据模型不变

## 影响

- 受影响规范：`affiliate-admin`
- 受影响代码：
  - `src/shared/models/affiliate.ts`
  - `src/app/api/admin/affiliate/affiliates/*`
  - `src/shared/blocks/affiliate-admin/index.tsx`
