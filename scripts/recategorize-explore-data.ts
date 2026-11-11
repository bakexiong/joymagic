/**
 * 数据重新分类脚本
 *
 * 功能：
 * 1. 读取现有的 explore_page_config
 * 2. 根据 prompt 关键词自动分类
 * 3. 补全必需字段（width, height, aspectRatio, likes, priority）
 * 4. 输出新的分类结构
 */

import { getConfigs } from '@/shared/models/config';

// 分类元数据
const categoryMetadata = {
  portraits: {
    id: 'portraits',
    sceneName: '人物肖像',
    subtitle: '真实人物、角色扮演、时尚写真',
    generateUrl: '/text-to-image?category=portrait',
    order: 1,
  },
  fantasy: {
    id: 'fantasy',
    sceneName: '奇幻世界',
    subtitle: '魔法、神话、科幻场景',
    generateUrl: '/text-to-image?category=fantasy',
    order: 2,
  },
  nature: {
    id: 'nature',
    sceneName: '自然风光',
    subtitle: '山川、海洋、森林、日落',
    generateUrl: '/text-to-image?category=nature',
    order: 3,
  },
  urban: {
    id: 'urban',
    sceneName: '城市生活',
    subtitle: '街拍、建筑、赛博朋克',
    generateUrl: '/text-to-image?category=urban',
    order: 4,
  },
  art: {
    id: 'art',
    sceneName: '艺术创作',
    subtitle: '油画、水彩、插画、概念艺术',
    generateUrl: '/text-to-image?category=art',
    order: 5,
  },
  animals: {
    id: 'animals',
    sceneName: '动物世界',
    subtitle: '宠物、野生动物、奇幻生物',
    generateUrl: '/text-to-image?category=animals',
    order: 6,
  },
  food: {
    id: 'food',
    sceneName: '美食摄影',
    subtitle: '料理、甜点、创意美食',
    generateUrl: '/text-to-image?category=food',
    order: 7,
  },
  videos: {
    id: 'videos',
    sceneName: '视频创作',
    subtitle: '动态场景、视频特效',
    generateUrl: '/text-to-video',
    order: 8,
  },
};

/**
 * 生成虚拟点赞数
 */
function generateVirtualLikes(itemId: string): number {
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    const char = itemId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const min = 100;
  const max = 9999;
  return min + (Math.abs(hash) % (max - min + 1));
}

/**
 * 从图片信息推测尺寸
 */
function inferDimensions(item: any): { width: number; height: number; aspectRatio: number } | null {
  if (item.width && item.height) {
    return {
      width: item.width,
      height: item.height,
      aspectRatio: item.height / item.width,
    };
  }

  if (item.size && typeof item.size === 'string') {
    const match = item.size.match(/(\d+)x(\d+)/);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      return { width, height, aspectRatio: height / width };
    }
  }

  const model = item.model?.toLowerCase() || '';
  if (model.includes('gpt-image')) return { width: 1024, height: 1024, aspectRatio: 1 };
  if (model.includes('nano banana')) return { width: 1024, height: 1024, aspectRatio: 1 };
  if (model.includes('qwen')) return { width: 1328, height: 1328, aspectRatio: 1 };
  if (model.includes('seedream')) return { width: 2048, height: 2048, aspectRatio: 1 };
  if (model.includes('wan')) return { width: 1280, height: 1280, aspectRatio: 1 };
  if (model.includes('10b.ai')) return { width: 1024, height: 1024, aspectRatio: 1 };

  return { width: 1024, height: 1024, aspectRatio: 1 };
}

/**
 * 根据内容自动分类
 */
function categorizeItem(item: any): string {
  const prompt = (item.prompt || '').toLowerCase();
  const alt = (item.alt || '').toLowerCase();
  const text = prompt + ' ' + alt;

  // 视频单独分类
  if (item.type === 'video') {
    return 'videos';
  }

  // 人物肖像
  const portraitKeywords = [
    '人物', '女', '男', 'female', 'male', '肖像', 'portrait',
    '学生', '职业', '角色', '穿着', 'wearing', 'girl', 'boy',
    'woman', 'man', 'lady', 'cheerleader', 'jk', '校服',
    '白领', '模特', 'model', 'firefighter', 'florist'
  ];
  if (portraitKeywords.some(kw => text.includes(kw))) {
    return 'portraits';
  }

  // 奇幻世界
  const fantasyKeywords = [
    '魔法', '精灵', '神话', '仙', '龙', 'magic', 'fantasy', 'elf',
    '奇幻', '飞天', '神兽', 'celestial', 'dunhuang', '敦煌',
    'alien', '外星', 'mecha', '机甲', 'wizard', 'witch',
    'unicorn', '独角兽', 'galaxy', '星系', 'quantum', '量子'
  ];
  if (fantasyKeywords.some(kw => text.includes(kw))) {
    return 'fantasy';
  }

  // 自然风光
  const natureKeywords = [
    '山', '海', '森林', '日落', '星空', '瀑布', 'mountain', 'ocean',
    'forest', 'sunset', '风景', '自然', 'nature', 'beach', '沙滩',
    'waterfall', 'rainbow', '彩虹', 'flower', '花', 'tulip',
    'sunflower', '向日葵', 'maple', '枫叶', 'snow', '雪'
  ];
  if (natureKeywords.some(kw => text.includes(kw))) {
    return 'nature';
  }

  // 城市生活
  const urbanKeywords = [
    '城市', '街道', '建筑', '赛博', 'cyberpunk', 'city', 'urban',
    '咖啡', '书店', '霓虹', 'neon', 'street', '街头', 'cafe',
    'office', '办公', 'rooftop', '天台', 'skyscraper', '摩天楼',
    'tram', '电车', 'bus', '公交'
  ];
  if (urbanKeywords.some(kw => text.includes(kw))) {
    return 'urban';
  }

  // 动物世界
  const animalKeywords = [
    '猫', '狗', '动物', '宠物', 'cat', 'dog', 'animal', 'pet',
    '老虎', '狮子', 'tiger', 'lion', 'alpaca', '羊驼',
    'octopus', '章鱼', 'marmot', '土拨鼠', 'glider', '蜜袋鼯',
    'dragon', 'bearded', '鬃狮蜥', 'squirrel', '松鼠'
  ];
  if (animalKeywords.some(kw => text.includes(kw))) {
    return 'animals';
  }

  // 美食摄影
  const foodKeywords = [
    '食物', '料理', '甜点', 'food', 'sushi', '寿司',
    '蛋糕', 'cake', '美食', 'candy', '糖果'
  ];
  if (foodKeywords.some(kw => text.includes(kw))) {
    return 'food';
  }

  // 艺术创作
  const artKeywords = [
    '油画', '水彩', '插画', '艺术', 'art', 'painting', '风格',
    'style', '浮世绘', 'ukiyo-e', 'van gogh', '梵高', 'picasso',
    '毕加索', 'comic', '漫画', 'steampunk', '蒸汽朋克',
    'gothic', '哥特', 'retro', '复古', 'vintage'
  ];
  if (artKeywords.some(kw => text.includes(kw))) {
    return 'art';
  }

  // 默认归类到艺术创作
  return 'art';
}

/**
 * 补全单个 item 的数据
 */
function enrichItem(item: any): any {
  const enriched = { ...item };

  // 补全尺寸信息
  if (enriched.type !== 'video' && (!enriched.width || !enriched.height || !enriched.aspectRatio)) {
    const dimensions = inferDimensions(item);
    if (dimensions) {
      enriched.width = dimensions.width;
      enriched.height = dimensions.height;
      enriched.aspectRatio = dimensions.aspectRatio;
    }
  }

  // 补全点赞数
  if (enriched.likes === undefined || enriched.likes === null) {
    enriched.likes = generateVirtualLikes(item.id);
  }

  // 视频类型移除尺寸字段
  if (enriched.type === 'video') {
    delete enriched.width;
    delete enriched.height;
    delete enriched.aspectRatio;
  }

  return enriched;
}

/**
 * 重新分类所有数据
 */
function recategorizeData(config: any): any {
  if (!config || !config.sections || !Array.isArray(config.sections)) {
    console.error('Invalid config structure');
    return config;
  }

  // 收集所有 items
  const allItems: any[] = [];
  config.sections.forEach((section: any) => {
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item: any) => {
        allItems.push(enrichItem(item));
      });
    }
  });

  console.log(`\n总共收集到 ${allItems.length} 个 items`);

  // 按分类分组
  const categorizedItems: Record<string, any[]> = {};
  Object.keys(categoryMetadata).forEach(key => {
    categorizedItems[key] = [];
  });

  allItems.forEach(item => {
    const category = categorizeItem(item);
    categorizedItems[category].push(item);
  });

  // 生成新的 sections
  const newSections = Object.entries(categoryMetadata)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, meta]) => {
      const items = categorizedItems[key];

      // 为每个分类的前 4 个 item 设置高优先级
      const itemsWithPriority = items.map((item, index) => ({
        ...item,
        priority: index < 4 ? 'high' : 'low',
      }));

      return {
        id: meta.id,
        sceneName: meta.sceneName,
        subtitle: meta.subtitle,
        generateUrl: meta.generateUrl,
        items: itemsWithPriority,
      };
    })
    .filter(section => section.items.length > 0); // 移除空分类

  return {
    title: config.title || 'Explore',
    subtitle: config.subtitle || '',
    sections: newSections,
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('开始数据重新分类...\n');

  try {
    // 1. 读取配置
    const configs = await getConfigs();
    const raw = configs['explore_page_config'];

    if (!raw) {
      console.error('❌ 未找到 explore_page_config 配置');
      return;
    }

    console.log('✅ 成功读取配置');

    // 2. 解析 JSON
    let config;
    try {
      config = JSON.parse(raw);
    } catch (error) {
      console.error('❌ JSON 解析失败:', error);
      return;
    }

    console.log(`✅ 原配置包含 ${config.sections?.length || 0} 个 section`);

    // 3. 重新分类
    const recategorized = recategorizeData(config);

    // 4. 输出结果
    console.log('\n重新分类后的配置：\n');
    console.log(JSON.stringify(recategorized, null, 2));

    // 5. 统计信息
    console.log('\n\n=== 分类统计 ===');
    recategorized.sections.forEach((section: any) => {
      console.log(`\n${section.sceneName} (${section.id})`);
      console.log(`  - Items: ${section.items.length}`);

      const imageCount = section.items.filter((item: any) => item.type === 'image').length;
      const videoCount = section.items.filter((item: any) => item.type === 'video').length;
      console.log(`  - 图片: ${imageCount}, 视频: ${videoCount}`);

      const highPriorityCount = section.items.filter((item: any) => item.priority === 'high').length;
      console.log(`  - 高优先级: ${highPriorityCount}`);
    });

    console.log('\n\n=== 下一步操作 ===');
    console.log('1. 复制上面的 JSON 配置');
    console.log('2. 访问管理后台 /admin/explore');
    console.log('3. 更新 explore_page_config 配置');
    console.log('4. 保存并验证');

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { recategorizeData, categorizeItem, categoryMetadata };
