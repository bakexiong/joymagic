## 1. 设计与收敛

- [x] 1.1 梳理 `mobile-image-ai-workbench`、`desktop-media-ai-workbench` 的职责边界与复用点
- [x] 1.2 设计统一响应式 workbench 的移动端与桌面端布局策略

## 2. 实施

- [x] 2.1 让 `desktop-playground` / 统一 workbench 在移动端可用，不再在移动端直接 `return null`
- [ ] 2.2 将 AI 场景页移动端入口从旧移动工作台切换到统一响应式 workbench
- [ ] 2.3 清理旧移动工作台的无用依赖或死路径
- [ ] 2.4 确保首页移动端 `mobile-homepage` 入口保持不变

## 3. 验证

- [ ] 3.1 验证 text-to-image、image-to-image、text-to-video、image-to-video 的移动端/桌面端行为，并确认首页移动端未受影响
- [ ] 3.2 运行静态检查并记录当前仓库已有的无关报错
