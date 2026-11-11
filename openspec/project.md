# 项目上下文

## 目的

10b.ai 是一个专业的 AI 图像生成和处理平台，为创作者、品牌和设计师提供高质量的 AI 视觉内容生成服务。项目的主要目标包括：

- 提供多种 AI 图像生成模型（10b.ai Turbo、Flux、Qwen、Seedream 等）
- 支持图像到图像转换、背景移除、图像擦除、图像放大等图像处理功能
- 支持文本到视频和图像到视频生成
- 提供用户认证、权限管理（RBAC）和积分系统
- 支持多语言国际化（中文、英文、日文、韩文、土耳其文等）
- 集成多种支付方式（Stripe、PayPal、Creem）
- 提供博客和文档系统

## 技术栈

### 前端框架
- **Next.js 15.5.5** - React 框架，使用 App Router
- **React 18** - UI 库
- **TypeScript 5** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **Framer Motion** - 动画库
- **Radix UI** - 无障碍 UI 组件库
- **shadcn/ui** - 组件库

### 后端与数据库
- **Drizzle ORM** - 数据库 ORM
- **Better Auth** - 认证系统
- **LibSQL/PostgreSQL** - 数据库

### AI 与集成
- **Vercel AI SDK** - AI 模型集成
- **Replicate** - AI 模型服务
- **OpenRouter** - AI 模型路由
- **Hugging Face** - AI 模型服务

### 文档与内容
- **Fumadocs** - MDX 文档系统
- **next-mdx-remote** - MDX 渲染
- **next-intl** - 国际化

### 支付与存储
- **Stripe** - 支付处理
- **PayPal** - 支付处理
- **Creem** - 支付处理
- **Cloudflare R2 / AWS S3** - 对象存储

### 部署与基础设施
- **Cloudflare Workers** - 边缘计算部署（通过 OpenNext Cloudflare）
- **Vercel** - 主要部署平台
- **Docker** - 容器化

### 开发工具
- **Turbopack** - 构建工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **pnpm** - 包管理器

## 项目约定

### 代码风格
- 使用 TypeScript 严格模式
- 使用 ESLint 和 Prettier 进行代码格式化
- 导入排序使用 `@ianvs/prettier-plugin-sort-imports`
- 组件使用函数式组件和 React Hooks
- 使用 React Compiler 进行优化

### 架构模式
- **App Router** - Next.js 15 App Router 架构
- **服务端组件优先** - 默认使用 RSC，需要交互时使用客户端组件
- **模块化设计** - 功能按模块组织（core、extensions、shared、themes）
- **扩展系统** - 通过 `extensions` 目录实现可插拔功能（支付、存储、AI、分析等）
- **主题系统** - 支持多主题，主题位于 `src/themes` 目录
- **国际化** - 使用 next-intl，支持多语言，语言文件位于 `src/config/locale/messages`

### 目录结构约定
- `/src/app` - Next.js App Router 页面和路由
- `/src/core` - 核心功能（认证、数据库、国际化、RBAC）
- `/src/extensions` - 可扩展功能模块（支付、存储、AI、分析等）
- `/src/shared` - 共享组件和工具
- `/src/shared/blocks` - 生成的组件应放在此处
- `/src/themes` - 主题相关组件和布局
- `/src/config` - 配置文件（数据库、国际化、样式）
- `/content` - MDX 内容文件（不要直接修改，应修改渲染逻辑）

### 测试策略
- 当前项目未配置测试框架
- 建议未来添加单元测试和集成测试

### Git 工作流
- 使用分支策略（当前在 `develop/migrate_10b` 分支）
- 提交信息应使用中文（根据 AGENTS.md 的语言偏好）

## 领域上下文

### AI 图像生成领域
- 项目支持多种 AI 模型，包括：
  - 10b.ai Turbo（自研优化模型）
  - Flux 2 Klein
  - Qwen Image
  - Seedream
  - Nano Banana
  - GPT-Image-1
  - 以及其他开源模型

### 图像处理功能
- 文本到图像生成
- 图像到图像转换
- 背景移除
- 图像擦除
- 图像放大
- 图像到视频转换
- 文本到视频生成
- 视频人脸替换

### 用户系统
- 用户认证系统（Better Auth）
- 基于角色的访问控制（RBAC）
- 用户积分/信用系统
- 用户国家/IP 追踪
- IP 黑名单功能

### 内容管理
- 博客系统（支持分类和标签）
- MDX 文档系统
- 多语言内容管理
- Strapi CMS 集成（通过脚本同步）

## 重要约束

### 安全约束
- **禁止在前端放置任何 API Key** - 所有需要 key 的接口必须在后端发起，避免被恶意调用
- 使用 Cloudflare Turnstile 进行安全验证
- 支持 IP 黑名单功能

### 内容约束
- **不要直接修改 `/content` 文件夹下的 MDX 文件** - 如果内容渲染出现问题，应修改渲染逻辑而不是直接修改 MDX 文件

### 组件生成约束
- 生成的组件应统一放到 `/src/shared/blocks` 目录

### 部署约束
- 支持 Vercel 和 Cloudflare Workers 两种部署方式
- 使用 OpenNext Cloudflare 适配器进行 Cloudflare 部署
- 构建前会自动同步 Strapi 文章（prebuild 脚本）

## 外部依赖

### AI 服务
- **Replicate** - AI 模型 API
- **OpenRouter** - AI 模型路由服务
- **Hugging Face** - AI 模型服务
- **自建 AI 服务** - 10b.ai Turbo 等模型

### 支付服务
- **Stripe** - 主要支付处理
- **PayPal** - 支付处理
- **Creem** - 支付处理

### 存储服务
- **Cloudflare R2** - 对象存储
- **AWS S3** - 对象存储备选

### 邮件服务
- **Resend** - 邮件发送
- **阿里云邮件服务** - 邮件发送备选

### 分析服务
- **Vercel Analytics** - 网站分析
- **Google Analytics** - 网站分析
- **Plausible** - 隐私友好的分析
- **Microsoft Clarity** - 用户行为分析
- **Open Panel** - 分析服务

### 客服服务
- **Crisp** - 在线客服
- **Tawk.to** - 在线客服备选

### 内容管理
- **Strapi CMS** - 内容管理系统（通过脚本同步）

### 数据库
- **LibSQL** - 主要数据库（Turso）
- **PostgreSQL** - 数据库备选

### 其他服务
- **Cloudflare** - CDN、安全、Workers
- **Vercel** - 部署和边缘函数

## 开发命令

### 开发
- `pnpm dev` - 启动开发服务器（使用 Turbopack）
- `pnpm build` - 构建生产版本
- `pnpm build:fast` - 快速构建（使用 webpack，增加内存限制）
- `pnpm start` - 启动生产服务器

### 代码质量
- `pnpm lint` - 运行 ESLint
- `pnpm format` - 格式化代码
- `pnpm format:check` - 检查代码格式

### 数据库
- `pnpm db:generate` - 生成数据库迁移
- `pnpm db:migrate` - 运行数据库迁移
- `pnpm db:push` - 推送数据库变更
- `pnpm db:studio` - 打开 Drizzle Studio

### 认证
- `pnpm auth:generate` - 生成认证相关代码

### 权限管理
- `pnpm rbac:init` - 初始化 RBAC 系统
- `pnpm rbac:assign` - 分配用户角色

### 内容同步
- `pnpm sync:posts` - 同步 Strapi 文章

### Cloudflare 部署
- `pnpm cf:preview` - 构建并预览 Cloudflare 版本
- `pnpm cf:deploy` - 构建并部署到 Cloudflare
- `pnpm cf:upload` - 构建并上传到 Cloudflare
- `pnpm cf:typegen` - 生成 Cloudflare 类型定义
