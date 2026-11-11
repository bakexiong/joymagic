/**
 * 数据补全脚本：为 explore_page_config 补全新增字段
 *
 * 新增字段：
 * 1. sceneName (替换 modelName)
 * 2. width, height, aspectRatio (图片尺寸信息)
 * 3. likes (虚拟点赞数)
 * 4. priority (加载优先级)
 * 5. srcSet (响应式图片源 - 可选)
 * 6. blurDataURL (占位图 - 可选)
 */

import { getConfigs } from '@/shared/models/config';

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
 * 从图片 URL 推测尺寸（基于常见模型输出）
 */
function inferDimensions(item: any): { width: number; height: number; aspectRatio: number } | null {
  // 如果已有尺寸信息，直接使用
  if (item.width && item.height) {
    return {
      width: item.width,
      height: item.height,
      aspectRatio: item.height / item.width,
    };
  }

  // 从 size 字段解析
  if (item.size && typeof item.size === 'string') {
    const match = item.size.match(/(\d+)x(\d+)/);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      return {
        width,
        height,
        aspectRatio: height / width,
      };
    }
  }

  // 根据模型推测默认尺寸
  const model = item.model?.toLowerCase() || '';

  if (model.includes('gpt-image')) {
    return { width: 1024, height: 1024, aspectRatio: 1 };
  }
  if (model.includes('nano banana')) {
    return { width: 1024, height: 1024, aspectRatio: 1 };
  }
  if (model.includes('qwen')) {
    return { width: 1328, height: 1328, aspectRatio: 1 };
  }
  if (model.includes('seedream')) {
    return { width: 2048, height: 2048, aspectRatio: 1 };
  }
  if (model.includes('wan')) {
    return { width: 1280, height: 1280, aspectRatio: 1 };
  }
  if (model.includes('10b.ai')) {
    return { width: 1024, height: 1024, aspectRatio: 1 };
  }

  // 默认方形
  return { width: 1024, height: 1024, aspectRatio: 1 };
}

/**
 * 补全单个 item 的数据
 */
function enrichItem(item: any, itemIndex: number, sectionIndex: number): any {
  const enriched = { ...item };

  // 1. 补全尺寸信息
  if (!enriched.width || !enriched.height || !enriched.aspectRatio) {
    const dimensions = inferDimensions(item);
    if (dimensions) {
      enriched.width = dimensions.width;
      enriched.height = dimensions.height;
      enriched.aspectRatio = dimensions.aspectRatio;
    }
  }

  // 2. 补全点赞数
  if (enriched.likes === undefined || enriched.likes === null) {
    enriched.likes = generateVirtualLikes(item.id);
  }

  // 3. 补全优先级（首个 section 的前 4 个设为 high）
  if (!enriched.priority) {
    enriched.priority = sectionIndex === 0 && itemIndex < 4 ? 'high' : 'low';
  }

  // 4. 视频类型不需要某些字段
  if (enriched.type === 'video') {
    // 视频通常没有固定尺寸，移除这些字段
    delete enriched.width;
    delete enriched.height;
    delete enriched.aspectRatio;
  }

  return enriched;
}

/**
 * 补全整个配置
 */
function enrichConfig(config: any): any {
  if (!config || !config.sections || !Array.isArray(config.sections)) {
    console.error('Invalid config structure');
    return config;
  }

  const enriched = { ...config };

  enriched.sections = config.sections.map((section: any, sectionIndex: number) => {
    const enrichedSection = { ...section };

    // 1. modelName 改为 sceneName
    if (section.modelName && !section.sceneName) {
      enrichedSection.sceneName = section.modelName;
      delete enrichedSection.modelName;
    }

    // 2. 补全 items
    if (section.items && Array.isArray(section.items)) {
      enrichedSection.items = section.items.map((item: any, itemIndex: number) =>
        enrichItem(item, itemIndex, sectionIndex)
      );
    }

    return enrichedSection;
  });

  return enriched;
}

/**
 * 主函数
 */
async function main() {
  console.log('开始数据补全...\n');

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

    console.log(`✅ 配置包含 ${config.sections?.length || 0} 个 section\n`);

    // 3. 补全数据
    const enrichedConfig = enrichConfig(config);

    // 4. 输出结果
    console.log('补全后的配置：\n');
    console.log(JSON.stringify(enrichedConfig, null, 2));

    // 5. 统计信息
    console.log('\n\n=== 补全统计 ===');
    enrichedConfig.sections.forEach((section: any, index: number) => {
      console.log(`\nSection ${index + 1}: ${section.sceneName || section.modelName}`);
      console.log(`  - Items: ${section.items?.length || 0}`);

      const itemsWithDimensions = section.items?.filter((item: any) =>
        item.width && item.height
      ).length || 0;
      console.log(`  - 有尺寸信息: ${itemsWithDimensions}/${section.items?.length || 0}`);

      const itemsWithLikes = section.items?.filter((item: any) =>
        item.likes !== undefined
      ).length || 0;
      console.log(`  - 有点赞数: ${itemsWithLikes}/${section.items?.length || 0}`);

      const highPriorityItems = section.items?.filter((item: any) =>
        item.priority === 'high'
      ).length || 0;
      console.log(`  - 高优先级: ${highPriorityItems}`);
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

export { enrichConfig, enrichItem, inferDimensions, generateVirtualLikes };
