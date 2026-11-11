# Vidu Q3 图像生成视频规范

## 新增需求

### 需求：Vidu Q3 图像生成视频表单组件

系统必须提供 Vidu Q3 图像生成视频的前端表单组件，支持以下参数配置：

**必填参数：**
- `prompt`：视频描述文本，用于指导视频生成内容
- `image`：参考图片 URL，支持拖拽上传或点击上传

**可选参数：**
- `resolution`：视频分辨率，支持 540p、720p、1080p，默认 720p
- `duration`：视频时长，范围 1-16 秒，默认 1 秒，通过滑块和输入框联动控制
- `movement_amplitude`：运动幅度，支持 auto、small、medium、large，默认 auto
- `generate_audio`：是否生成音频，布尔值，默认 true
- `bgm`：是否添加背景音乐，布尔值，默认 true
- `seed`：随机种子，可选数字，带随机生成按钮

**不包含功能：**
- Prompt Enhancer（提示词增强）功能

#### 场景：用户填写表单并提交生成请求

- **当** 用户填写 prompt 和上传 image
- **并且** 配置其他可选参数
- **并且** 点击生成按钮
- **那么** 系统调用 `/api/ai/image-to-video-vidu-q3/generate` API
- **并且** 显示生成进度状态
- **并且** 生成完成后显示视频预览

#### 场景：用户调整 duration 参数

- **当** 用户拖动 duration 滑块
- **那么** 输入框同步显示当前值
- **当** 用户在输入框输入数值
- **那么** 滑块同步移动到对应位置
- **并且** 数值限制在 1-16 范围内

#### 场景：用户上传参考图片

- **当** 用户拖拽图片到上传区域
- **或者** 用户点击上传区域选择图片
- **那么** 系统上传图片并显示预览
- **并且** 显示图片 URL
- **并且** 提供删除按钮

#### 场景：用户使用随机种子

- **当** 用户点击 seed 旁边的随机按钮
- **那么** 系统生成随机数填入 seed 输入框

### 需求：Vidu Q3 视频生成 API 路由

系统必须提供 `/api/ai/image-to-video-vidu-q3/generate` API 端点，接收以下参数：

```json
{
  "prompt": "string (required)",
  "image": "string (required, URL)",
  "resolution": "540p | 720p | 1080p",
  "duration": "number (1-16)",
  "movement_amplitude": "auto | small | medium | large",
  "generate_audio": "boolean",
  "bgm": "boolean",
  "seed": "number (optional)"
}
```

#### 场景：API 接收有效请求

- **当** 前端发送包含必填参数的 POST 请求
- **那么** API 验证参数有效性
- **并且** 扣除用户积分
- **并且** 调用 Vidu Q3 后端服务
- **并且** 返回任务 ID 用于状态轮询

#### 场景：API 接收无效请求

- **当** 请求缺少必填参数 prompt 或 image
- **那么** API 返回 400 错误
- **并且** 返回明确的错误信息

### 需求：Vidu Q3 积分估算支持

系统必须支持 `image-to-video-vidu-q3` 场景的积分估算，计算因子包括：
- `duration`：视频时长
- `resolution`：视频分辨率
- `generate_audio`：是否生成音频

#### 场景：前端实时估算积分

- **当** 用户调整 duration、resolution 或 generate_audio 参数
- **那么** 系统调用积分估算 API
- **并且** 生成按钮显示预估积分数

### 需求：Vidu Q3 视频预览和下载

系统必须在视频生成完成后提供预览和下载功能。

#### 场景：视频生成完成

- **当** 视频生成任务状态变为 completed
- **那么** 系统显示视频预览播放器
- **并且** 提供播放/暂停控制
- **并且** 提供音量控制
- **并且** 提供全屏查看按钮
- **并且** 提供下载按钮

#### 场景：用户下载视频

- **当** 用户点击下载按钮
- **那么** 系统下载视频文件
- **并且** 文件名包含时间戳

### 需求：Vidu Q3 页面 SEO 优化

系统必须为 Vidu Q3 image to video 页面提供完整的 SEO 优化，核心关键词为 "Vidu Q3 image to video"。

**TDK 优化：**
- Title: "Vidu Q3 Image to Video - AI Video Generator | 10b.ai"
- Description: "Transform images into stunning videos with Vidu Q3 AI. Control motion amplitude, add background music, generate audio. Free to try, no editing skills needed."
- Keywords: "vidu q3, image to video, ai video generator, vidu q3 i2v, animate images, motion control, background music, ai video"

**页面文案优化：**
- Hero 标题包含核心关键词
- Features 描述突出 Vidu Q3 独特功能（movement_amplitude、bgm）
- FAQ 回答用户关于 Vidu Q3 的常见问题
- 所有文案自然融入关键词，避免堆砌

**结构化数据：**
- SoftwareApplication JSON-LD
- HowTo JSON-LD
- FAQ JSON-LD
- Breadcrumb JSON-LD

#### 场景：搜索引擎抓取页面

- **当** 搜索引擎爬虫访问 `/image-to-video/vidu-q3` 页面
- **那么** 页面返回正确的 meta title、description、keywords
- **并且** 页面包含完整的 JSON-LD 结构化数据
- **并且** 页面内容包含核心关键词 "Vidu Q3 image to video"

#### 场景：用户通过搜索引擎访问

- **当** 用户搜索 "Vidu Q3 image to video" 相关关键词
- **那么** 搜索结果显示优化后的标题和描述
- **并且** 用户点击后进入功能完整的页面
