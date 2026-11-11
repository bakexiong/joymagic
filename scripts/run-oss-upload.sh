#!/bin/bash

# OSS 上传脚本快捷启动器
# 使用方法: ./scripts/run-oss-upload.sh

set -e

echo "🚀 开始 OSS 上传任务..."
echo ""

# 检查 .env.oss 文件是否存在
if [ ! -f .env.oss ]; then
    echo "❌ 错误: .env.oss 文件不存在"
    echo "请先复制 .env.oss.example 并配置 OSS 凭证："
    echo "  cp .env.oss.example .env.oss"
    echo "  # 然后编辑 .env.oss 填入你的配置"
    exit 1
fi

# 检查 sharp 是否已安装
if ! pnpm list sharp > /dev/null 2>&1; then
    echo "📦 安装 sharp 依赖..."
    pnpm add sharp
    echo ""
fi

# 加载环境变量
echo "🔧 加载 OSS 配置..."
export $(cat .env.oss | grep -v '^#' | grep -v '^$' | xargs)

# 验证必需的环境变量
if [ -z "$OSS_REGION" ] || [ -z "$OSS_ACCESS_KEY_ID" ] || [ -z "$OSS_ACCESS_KEY_SECRET" ] || [ -z "$OSS_BUCKET" ]; then
    echo "❌ 错误: OSS 配置不完整"
    echo "请确保 .env.oss 中包含以下配置："
    echo "  - OSS_REGION"
    echo "  - OSS_ACCESS_KEY_ID"
    echo "  - OSS_ACCESS_KEY_SECRET"
    echo "  - OSS_BUCKET"
    exit 1
fi

echo "✅ OSS 配置验证通过"
echo ""

# 运行上传脚本
echo "📤 开始上传文件到 OSS..."
echo ""
pnpm tsx scripts/upload-to-oss-with-thumbnails.ts

echo ""
echo "✅ 上传完成！"
echo ""
echo "下一步："
echo "  1. 检查生成的 explore-config-oss.json 文件"
echo "  2. 验证 OSS 中的文件是否正确上传"
echo "  3. 替换配置文件: mv explore-config-oss.json explore-config-processed.json"
echo "  4. 测试前端显示效果"
