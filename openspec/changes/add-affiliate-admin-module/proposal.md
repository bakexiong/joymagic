# 变更：新增 admin 内部分销管理模块

## 为什么

当前项目缺少面向运营团队的分销管理后台，无法在现有 admin 中集中查看推广者、审核申请、跟踪佣金与提现状态，也没有针对该模块的菜单级权限隔离。

## 变更内容

- 在现有 `admin` 后台内新增分销管理模块路由与页面
- 新增分销模块 RBAC 权限，并让 sidebar 基于权限隐藏该模块入口
- 提供数据概览、推广者管理、申请审核、佣金管理、提现管理、全局配置六个页面
- 为真实数据接入设计分销领域表结构，覆盖申请、档案、归因、佣金、提现和配置
- 当前保留静态 mock UI，后续在同一数据模型上切换到真实接口

## 影响

- 受影响规范：`affiliate-admin`
- 受影响代码：`src/app/[locale]/(admin)/admin/*`，`src/core/rbac/*`，`src/shared/blocks/dashboard/*`，`src/config/locale/messages/*`，`src/config/db/schema.ts`
