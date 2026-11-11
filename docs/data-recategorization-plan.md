# 数据重新分类方案

## 当前问题

现有的 `explore_page_config` 数据按模型分类（GPT-image 1, Nano Banana, Qwen Image 等），但这种分类方式：
1. 对用户不够友好（用户不关心具体模型）
2. 缺乏场景化（用户更关心"我想生成什么"）
3. 不利于内容发现

## 新的分类方案

### 方案 1：按场景分类（推荐）

根据用户使用场景重新组织内容：

```json
{
  "sections": [
    {
      "id": "portraits",
      "sceneName": "人物肖像",
      "subtitle": "真实人物、角色扮演、时尚写真",
      "generateUrl": "/text-to-image?category=portrait",
      "items": [...]
    },
    {
      "id": "fantasy",
      "sceneName": "奇幻世界",
      "subtitle": "魔法、神话、科幻场景",
      "generateUrl": "/text-to-image?category=fantasy",
      "items": [...]
    },
    {
      "id": "nature",
      "sceneName": "自然风光",
      "subtitle": "山川、海洋、森林、日落",
      "generateUrl": "/text-to-image?category=nature",
      "items": [...]
    },
    {
      "id": "urban",
      "sceneName": "城市生活",
      "subtitle": "街拍、建筑、赛博朋克",
      "generateUrl": "/text-to-image?category=urban",
      "items": [...]
    },
    {
      "id": "art",
      "sceneName": "艺术创作",
      "subtitle": "油画、水彩、插画、概念艺术",
      "generateUrl": "/text-to-image?category=art",
      "items": [...]
    },
    {
      "id": "animals",
      "sceneName": "动物世界",
      "subtitle": "宠物、野生动物、奇幻生物",
      "generateUrl": "/text-to-image?category=animals",
      "items": [...]
    },
    {
      "id": "food",
      "sceneName": "美食摄影",
      "subtitle": "料理、甜点、创意美食",
      "generateUrl": "/text-to-image?category=food",
      "items": [...]
    },
    {
      "id": "videos",
      "sceneName": "视频创作",
      "subtitle": "动态场景、视频特效",
      "generateUrl": "/text-to-video",
      "items": [...]
    }
  ]
}
```

### 方案 2：按风格分类

```json
{
  "sections": [
    {
      "id": "realistic",
      "sceneName": "写实风格",
      "subtitle": "照片级真实感",
      "items": [...]
    },
    {
      "id": "anime",
      "sceneName": "动漫风格",
      "subtitle": "日系、二次元",
      "items": [...]
    },
    {
      "id": "artistic",
      "sceneName": "艺术风格",
      "subtitle": "油画、水彩、素描",
      "items": [...]
    },
    {
      "id": "cyberpunk",
      "sceneName": "赛博朋克",
      "subtitle": "未来科技、霓虹灯",
      "items": [...]
    },
    {
      "id": "vintage",
      "sceneName": "复古风格",
      "subtitle": "民国、80年代、胶片",
      "items": [...]
    }
  ]
}
```

### 方案 3：按用途分类

```json
{
  "sections": [
    {
      "id": "social-media",
      "sceneName": "社交媒体",
      "subtitle": "头像、封面、朋友圈",
      "items": [...]
    },
    {
      "id": "marketing",
      "sceneName": "营销推广",
      "subtitle": "海报、广告、产品图",
      "items": [...]
    },
    {
      "id": "design",
      "sceneName": "设计素材",
      "subtitle": "背景、纹理、图标",
      "items": [...]
    },
    {
      "id": "entertainment",
      "sceneName": "娱乐创作",
      "subtitle": "表情包、壁纸、插画",
      "items": [...]
    }
  ]
}
```

## 分类规则

### 人物肖像 (portraits)
- 关键词：人物、肖像、写真、角色、职业
- 示例：
  - 校园学生、职场白领
  - 时尚模特、街拍
  - 角色扮演（魔法师、战士等）
  - 民国、复古人物

### 奇幻世界 (fantasy)
- 关键词：魔法、神话、精灵、龙、城堡
- 示例：
  - 森林精灵、魔法师
  - 神话生物、飞天仙女
  - 奇幻城堡、魔法森林
  - 外星世界

### 自然风光 (nature)
- 关键词：山川、海洋、森林、日落、季节
- 示例：
  - 日出日落、星空
  - 山川河流、瀑布
  - 四季风景
  - 花海、草原

### 城市生活 (urban)
- 关键词：城市、街道、建筑、赛博朋克
- 示例：
  - 街头摄影、城市夜景
  - 赛博朋克城市
  - 建筑摄影
  - 咖啡馆、书店等场景

### 艺术创作 (art)
- 关键词：油画、水彩、插画、艺术风格
- 示例：
  - 梵高风格、莫奈风格
  - 浮世绘、中国画
  - 概念艺术、插画
  - 抽象艺术

### 动物世界 (animals)
- 关键词：动物、宠物、野生动物
- 示例：
  - 猫狗宠物
  - 野生动物（老虎、狮子等）
  - 奇幻生物（独角兽、凤凰等）
  - 动物与人互动

### 美食摄影 (food)
- 关键词：食物、料理、甜点
- 示例：
  - 精致料理
  - 甜点蛋糕
  - 创意美食艺术
  - 食材特写

### 视频创作 (videos)
- 所有 type 为 "video" 的内容

## 自动分类算法

基于 prompt 关键词自动分类：

```typescript
function categorizeItem(item: any): string {
  const prompt = (item.prompt || '').toLowerCase();
  const alt = (item.alt || '').toLowerCase();
  const text = prompt + ' ' + alt;

  // 视频单独分类
  if (item.type === 'video') {
    return 'videos';
  }

  // 人物肖像
  const portraitKeywords = ['人物', '女', '男', 'female', 'male', '肖像', 'portrait', '学生', '职业', '角色', '穿着', 'wearing'];
  if (portraitKeywords.some(kw => text.includes(kw))) {
    return 'portraits';
  }

  // 奇幻世界
  const fantasyKeywords = ['魔法', '精灵', '神话', '仙', '龙', 'magic', 'fantasy', 'elf', '奇幻', '飞天', '神兽'];
  if (fantasyKeywords.some(kw => text.includes(kw))) {
    return 'fantasy';
  }

  // 自然风光
  const natureKeywords = ['山', '海', '森林', '日落', '星空', '瀑布', 'mountain', 'ocean', 'forest', 'sunset', '风景', '自然'];
  if (natureKeywords.some(kw => text.includes(kw))) {
    return 'nature';
  }

  // 城市生活
  const urbanKeywords = ['城市', '街道', '建筑', '赛博', 'cyberpunk', 'city', 'urban', '咖啡', '书店', '霓虹'];
  if (urbanKeywords.some(kw => text.includes(kw))) {
    return 'urban';
  }

  // 动物世界
  const animalKeywords = ['猫', '狗', '动物', '宠物', 'cat', 'dog', 'animal', 'pet', '老虎', '狮子', '独角兽'];
  if (animalKeywords.some(kw => text.includes(kw))) {
    return 'animals';
  }

  // 美食摄影
  const foodKeywords = ['食物', '料理', '甜点', 'food', 'sushi', '蛋糕', 'cake', '美食'];
  if (foodKeywords.some(kw => text.includes(kw))) {
    return 'food';
  }

  // 艺术创作
  const artKeywords = ['油画', '水彩', '插画', '艺术', 'art', 'painting', '风格', 'style', '浮世绘'];
  if (artKeywords.some(kw => text.includes(kw))) {
    return 'art';
  }

  // 默认归类到艺术创作
  return 'art';
}
```

## 分类元数据

每个分类的完整信息：

```typescript
const categoryMetadata = {
  portraits: {
    id: 'portraits',
    sceneName: '人物肖像',
    subtitle: '真实人物、角色扮演、时尚写真',
    generateUrl: '/text-to-image?category=portrait',
    icon: '👤',
    order: 1,
  },
  fantasy: {
    id: 'fantasy',
    sceneName: '奇幻世界',
    subtitle: '魔法、神话、科幻场景',
    generateUrl: '/text-to-image?category=fantasy',
    icon: '🔮',
    order: 2,
  },
  nature: {
    id: 'nature',
    sceneName: '自然风光',
    subtitle: '山川、海洋、森林、日落',
    generateUrl: '/text-to-image?category=nature',
    icon: '🏞️',
    order: 3,
  },
  urban: {
    id: 'urban',
    sceneName: '城市生活',
    subtitle: '街拍、建筑、赛博朋克',
    generateUrl: '/text-to-image?category=urban',
    icon: '🏙️',
    order: 4,
  },
  art: {
    id: 'art',
    sceneName: '艺术创作',
    subtitle: '油画、水彩、插画、概念艺术',
    generateUrl: '/text-to-image?category=art',
    icon: '🎨',
    order: 5,
  },
  animals: {
    id: 'animals',
    sceneName: '动物世界',
    subtitle: '宠物、野生动物、奇幻生物',
    generateUrl: '/text-to-image?category=animals',
    icon: '🐾',
    order: 6,
  },
  food: {
    id: 'food',
    sceneName: '美食摄影',
    subtitle: '料理、甜点、创意美食',
    generateUrl: '/text-to-image?category=food',
    icon: '🍱',
    order: 7,
  },
  videos: {
    id: 'videos',
    sceneName: '视频创作',
    subtitle: '动态场景、视频特效',
    generateUrl: '/text-to-video',
    icon: '🎬',
    order: 8,
  },
};
```

## 实施步骤

1. **确定分类方案**：从上述 3 个方案中选择一个
2. **运行分类脚本**：自动将现有数据重新分类
3. **人工审核**：检查分类是否合理，手动调整
4. **更新配置**：将新的分类数据更新到数据库
5. **验证效果**：检查页面展示是否符合预期

## 优势

### 用户体验
- ✅ 更容易找到想要的内容
- ✅ 场景化分类更符合用户心智模型
- ✅ 提升内容发现效率

### 内容管理
- ✅ 便于内容策划和运营
- ✅ 可以针对不同场景优化内容
- ✅ 更好的数据分析维度

### SEO 优化
- ✅ 更清晰的内容结构
- ✅ 更好的关键词覆盖
- ✅ 提升搜索引擎友好度

## 注意事项

1. **保持平衡**：每个分类的内容数量尽量均衡
2. **定期更新**：根据用户反馈调整分类
3. **多维度标签**：一个内容可以属于多个分类
4. **A/B 测试**：测试不同分类方案的效果
