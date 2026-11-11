## 1. 规范与设计

- [ ] 1.1 定义桌面端图片 Playground 的统一信息架构与区域划分
- [ ] 1.2 定义桌面端图片 Playground 的 schema 字段模型（prompt、参考图、输出参数、数量、CTA 等）
- [ ] 1.3 定义 `text-to-image` 与 `image-to-image` 在桌面端共享与差异化的参数映射规则

## 2. 基座实现

- [ ] 2.1 新增桌面端图片 Playground 基座组件，不再复用旧版 PC landing 表单布局
- [ ] 2.2 将 `desktop-image-ai-workbench` 改为渲染新的桌面端基座
- [ ] 2.3 保持模型切换通过路由跳转
- [ ] 2.4 保持 Hero 标题/描述位于 `CreateLayout` 下方，且现有 SEO 模块顺序不变

## 3. 场景接入

- [ ] 3.1 接入所有 `text-to-image` 路由的桌面端 schema
- [ ] 3.2 接入所有 `image-to-image` 路由的桌面端 schema
- [ ] 3.3 为缺少 schema 的模型提供安全降级策略

## 4. 验证

- [ ] 4.1 验证桌面端 `/text-to-image/*` 页面不再出现旧版双栏/嵌套表单结构
- [ ] 4.2 验证桌面端 `/image-to-image/*` 页面不再出现旧版双栏/嵌套表单结构
- [ ] 4.3 验证模型切换后跳转到正确路由
- [ ] 4.4 验证 `CreateLayout` 下方 Hero 标题/描述及 SEO 内容仍按原顺序输出
- [ ] 4.5 运行 `openspec-cn validate rewrite-desktop-image-playground --strict --no-interactive`
