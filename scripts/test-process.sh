#!/bin/bash

# 测试图片处理脚本
# 使用小型测试文件验证功能

set -e

echo "🧪 测试图片处理脚本"
echo ""

# 创建测试 JSON 文件
cat > test-explore.json << 'EOF'
{
  "title": "Test Explore",
  "sections": [
    {
      "id": "test-section",
      "sceneName": "Test Images",
      "items": [
        {
          "id": "test-1",
          "src": "https://d1q70pf5vjeyhc.cloudfront.net/predictions/22eb7936a5754f61b7c0154edda14c7c/1.png",
          "type": "image",
          "prompt": "Test image 1 - Already OSS"
        },
        {
          "id": "test-2",
          "src": "https://picsum.photos/800/600",
          "type": "image",
          "prompt": "Test image 2 - Need upload"
        }
      ]
    }
  ]
}
EOF

echo "✅ 创建测试文件: test-explore.json"
echo ""

# 运行处理脚本
echo "🚀 运行处理脚本..."
echo ""

./scripts/process-images.sh test-explore.json

echo ""
echo "📊 查看结果..."
echo ""

if [ -f "test-explore-processed.json" ]; then
    echo "✅ 生成了处理后的文件: test-explore-processed.json"
    echo ""
    echo "文件内容预览:"
    head -50 test-explore-processed.json
    echo ""
    echo "✅ 测试完成！"
else
    echo "❌ 未找到处理后的文件"
    exit 1
fi
