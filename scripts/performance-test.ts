import * as fs from 'fs';
import * as path from 'path';

async function getPageSpeedData() {
  const url = 'https://10b.ai';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&category=performance`;

  console.log('正在获取 PageSpeed Insights 数据...');
  console.log('目标网站:', url);

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 提取关键性能指标
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    const performanceData = {
      url: url,
      timestamp: new Date().toISOString(),
      scores: {
        performance: categories.performance.score * 100,
      },
      metrics: {
        'First Contentful Paint': audits['first-contentful-paint'].displayValue,
        'Largest Contentful Paint': audits['largest-contentful-paint'].displayValue,
        'Total Blocking Time': audits['total-blocking-time'].displayValue,
        'Cumulative Layout Shift': audits['cumulative-layout-shift'].displayValue,
        'Speed Index': audits['speed-index'].displayValue,
        'Time to Interactive': audits['interactive'].displayValue,
      },
      opportunities: [] as any[],
      diagnostics: [] as any[],
      passedAudits: [] as any[],
    };

    // 提取优化建议（Opportunities）
    Object.keys(audits).forEach((key) => {
      const audit = audits[key];
      if (audit.details && audit.details.type === 'opportunity' && audit.score !== null && audit.score < 1) {
        performanceData.opportunities.push({
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue || 'N/A',
          numericValue: audit.numericValue,
          details: audit.details.items?.slice(0, 5) || [], // 只保留前5项
        });
      }
    });

    // 提取诊断信息（Diagnostics）
    Object.keys(audits).forEach((key) => {
      const audit = audits[key];
      if (audit.details && audit.details.type === 'table' && audit.score !== null && audit.score < 1 && !audit.details.type.includes('opportunity')) {
        performanceData.diagnostics.push({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue || 'N/A',
        });
      }
    });

    // 提取通过的审计
    Object.keys(audits).forEach((key) => {
      const audit = audits[key];
      if (audit.score === 1 && audit.title) {
        performanceData.passedAudits.push({
          id: key,
          title: audit.title,
        });
      }
    });

    // 保存完整数据
    const jsonPath = path.join(process.cwd(), 'performance-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(performanceData, null, 2));
    console.log(`\n性能数据已保存到: ${jsonPath}`);

    // 保存原始数据（用于调试）
    const rawJsonPath = path.join(process.cwd(), 'performance-data-raw.json');
    fs.writeFileSync(rawJsonPath, JSON.stringify(data, null, 2));
    console.log(`原始数据已保存到: ${rawJsonPath}`);

    // 打印摘要
    console.log('\n=== 性能测试结果摘要 ===');
    console.log(`\n性能评分: ${performanceData.scores.performance}/100`);

    console.log('\n核心指标:');
    Object.entries(performanceData.metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log(`\n优化建议数量: ${performanceData.opportunities.length}`);
    if (performanceData.opportunities.length > 0) {
      console.log('\n主要优化建议:');
      performanceData.opportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`  ${index + 1}. ${opp.title}`);
        console.log(`     预计节省: ${opp.displayValue}`);
      });
    }

    console.log(`\n诊断信息数量: ${performanceData.diagnostics.length}`);
    console.log(`通过的审计数量: ${performanceData.passedAudits.length}`);

    return performanceData;
  } catch (error) {
    console.error('获取性能数据时出错:', error);
    throw error;
  }
}

// 运行测试
getPageSpeedData()
  .then(() => {
    console.log('\n性能测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
