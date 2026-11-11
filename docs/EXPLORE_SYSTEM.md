# Explore 数据生成系统

完整的 Explore 内容管理系统，支持在管理后台生成和管理 AI 内容。

## 功能特性

### 1. 管理后台 (`/admin/explore/manager`)

#### 内容生成器
- **Prompt 输入**: 支持多行文本输入提示词
- **模型选择**: 支持多种 AI 模型
  - GPT-image 1 (图片)
  - 10b.ai Turbo (图片)
  - Nano Banana (图片)
  - Veo 3.1 (视频)
  - Pixverse V5.6 (视频)
- **参数配置**:
  - 质量选择 (low/medium/high/standard/hd)
  - 尺寸选择 (根据模型动态调整)
- **实时生成**: 调用对应模型 API 生成内容
- **自动轮询**: 等待生成完成并获取结果

#### 分类管理
- 创建/编辑/删除分类
- 为每个分类添加生成的内容
- 拖拽排序（可扩展）
- 批量操作

#### 内容管理
- 网格展示所有生成的内容
- 悬停预览
- 查看详细信息
- 删除内容
- 导出配置为 JSON

### 2. 用户端展示 (`ExploreGallery`)

#### 内容展示
- 响应式网格布局
- 图片/视频预览
- 悬停播放视频
- 显示模型、点赞数等信息

#### 详情对话框
- 点击查看完整内容
- 显示所有参数信息
  - 模型名称
  - 质量设置
  - 尺寸信息
  - 完整 Prompt
- **Generate 按钮**: 跳转到 `/creator` 页面并自动填充参数

### 3. API 端点

#### `/api/admin/explore/save` (POST)
保存 Explore 配置到数据库

**请求体**:
```json
{
  "title": "Explore",
  "subtitle": "",
  "sections": [
    {
      "id": "portraits",
      "sceneName": "Portraits",
      "subtitle": "Real people, cosplay, fashion photography",
      "generateUrl": "/text-to-image?category=portrait",
      "items": [...]
    }
  ]
}
```

#### `/api/explore` (GET)
获取当前 Explore 配置

#### `/api/ai/[scene]/generate` (POST)
通用 AI 生成接口，支持所有配置的模型

## 使用流程

### 管理员工作流

1. **访问管理后台**: `/admin/explore/manager`
2. **创建分类**: 点击"添加分类"，输入分类名称和描述
3. **生成内容**:
   - 选择目标分类
   - 选择 AI 模型
   - 配置质量和尺寸参数
   - 输入 Prompt
   - 点击"生成内容"
4. **等待生成**: 系统自动调用 API 并轮询结果
5. **管理内容**:
   - 预览生成的内容
   - 删除不满意的内容
   - 调整分类信息
6. **保存配置**: 点击"保存配置"更新到数据库
7. **导出备份**: 点击"导出配置"下载 JSON 文件

### 用户工作流

1. **浏览 Explore 页面**: 查看所有分类和内容
2. **点击感兴趣的内容**: 打开详情对话框
3. **查看参数**: 了解生成该内容的 Prompt 和参数
4. **点击 Generate**: 自动跳转到 `/creator` 页面
5. **参数自动填充**:
   - Prompt 已填充
   - 模型已选择
   - 质量和尺寸已设置
6. **直接生成**: 用户可以直接点击生成，或修改参数后生成

## 技术实现

### 前端组件

- **ExploreManager**: 管理后台主组件
  - 状态管理: 使用 React useState 管理配置
  - 表单处理: 实时更新配置对象
  - API 调用: fetch 调用生成和保存接口
  - 轮询机制: 递归轮询任务状态

- **ExploreGallery**: 用户端展示组件
  - 响应式布局: Tailwind CSS Grid
  - 动画效果: Framer Motion
  - 对话框: Radix UI Dialog
  - URL 参数传递: URLSearchParams

### 后端 API

- **统一生成接口**: `/api/ai/[scene]/generate`
  - 动态路由支持所有模型
  - 参数验证
  - 积分扣除
  - 任务创建和轮询

- **配置保存接口**: `/api/admin/explore/save`
  - 权限验证
  - 数据验证
  - 数据库更新

### 数据流

```
管理员输入 Prompt
    ↓
选择模型和参数
    ↓
调用 /api/ai/[scene]/generate
    ↓
创建任务并返回 taskId
    ↓
轮询 /api/ai/status?taskId=xxx
    ↓
获取生成结果 URL
    ↓
添加到配置对象
    ↓
保存到 /api/admin/explore/save
    ↓
更新数据库配置
    ↓
用户访问 Explore 页面
    ↓
点击内容查看详情
    ↓
点击 Generate 跳转到 /creator
    ↓
参数自动填充
    ↓
用户生成新内容
```

## 配置示例

```json
{
  "title": "Explore",
  "subtitle": "Discover amazing AI-generated content",
  "sections": [
    {
      "id": "portraits",
      "sceneName": "Portraits",
      "subtitle": "Real people, cosplay, fashion photography",
      "generateUrl": "/text-to-image?category=portrait",
      "items": [
        {
          "id": "item-1234567890",
          "type": "image",
          "src": "https://example.com/image.png",
          "alt": "GPT-image 1 creation",
          "model": "GPT-image 1",
          "prompt": "A beautiful portrait of a woman...",
          "quality": "medium",
          "size": "1024*1536",
          "width": 1024,
          "height": 1536,
          "generateUrl": "/text-to-image",
          "aspectRatio": 0.666,
          "likes": 0,
          "priority": "high",
          "thumbnailUrl": "https://example.com/image.png"
        }
      ]
    }
  ]
}
```

## 扩展功能

### 可以添加的功能

1. **批量生成**: 一次输入多个 Prompt 批量生成
2. **模板系统**: 保存常用的 Prompt 模板
3. **标签系统**: 为内容添加标签便于筛选
4. **搜索功能**: 按 Prompt、模型等搜索内容
5. **排序功能**: 按时间、点赞数等排序
6. **拖拽排序**: 调整内容在分类中的顺序
7. **A/B 测试**: 测试不同参数的效果
8. **统计分析**: 查看各内容的点击率、生成率等
9. **版本控制**: 保存配置的历史版本
10. **权限管理**: 不同管理员的操作权限

## 文件结构

```
src/
├── app/
│   ├── [locale]/(admin)/admin/explore/
│   │   └── manager/
│   │       ├── page.tsx              # 管理后台页面
│   │       └── explore-manager.tsx   # 管理器组件
│   └── api/
│       └── admin/explore/
│           └── save/
│               └── route.ts          # 保存配置 API
├── shared/
│   └── components/
│       └── explore-gallery.tsx       # 用户端展示组件
└── prompt-manager.html               # 独立的 HTML 管理工具
```

## 使用说明

1. **首次使用**: 访问 `/admin/explore/manager` 创建第一个分类
2. **生成内容**: 使用内容生成器创建内容
3. **保存配置**: 点击保存按钮更新配置
4. **查看效果**: 在用户端页面查看展示效果
5. **用户交互**: 用户点击 Generate 跳转到 Creator 页面

## 注意事项

- 生成内容需要消耗积分，请确保账户有足够积分
- 视频生成时间较长，请耐心等待
- 建议先在测试环境验证配置后再发布到生产环境
- 定期备份配置 JSON 文件
- 图片和视频 URL 需要确保长期有效
