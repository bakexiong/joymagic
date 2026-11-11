## 1. 规范与模型

- [ ] 1.1 为 `step-based-pricing` 编写增量规范
- [ ] 1.2 在共享类型中新增 `step-based` 计算器类型
- [ ] 1.3 为定价配置增加步长计费字段定义

## 2. 后端计费逻辑

- [ ] 2.1 在 `credit-config.ts` 中新增 `step-based` 计费计算分支
- [ ] 2.2 让统一积分估算接口支持 `step-based`
- [ ] 2.3 让真实扣费链路与估算逻辑保持一致
- [ ] 2.4 保证 `duration-block-resolved` 原行为不变

## 3. 管理端配置

- [ ] 3.1 在 admin pricing 页面新增 `step-based` 计算器选项
- [ ] 3.2 为 `step-based` 提供独立配置 UI，不再复用参数组合价格表
- [ ] 3.3 更新 `/api/admin/pricing` 的读写逻辑以保存新字段
- [ ] 3.4 确认旧场景在管理端仍按原方式展示

## 4. 验证

- [ ] 4.1 验证 `openspec-cn validate add-step-based-pricing --strict --no-interactive`
- [ ] 4.2 验证 TypeScript 编译通过
- [ ] 4.3 手动验证至少一个 `step-based` 场景的管理端配置与积分估算
