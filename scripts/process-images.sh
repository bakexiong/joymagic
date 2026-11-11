#!/bin/bash

# 图片批量上传到 OSS 并生成缩略图
# 使用方法: ./process-images.sh <input-json-file>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 图片批量上传到 OSS 脚本"
echo ""

# 加载 .env.local 文件
if [ -f ".env.local" ]; then
    echo "📄 加载 .env.local 文件..."
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
    echo -e "${GREEN}✅ 环境变量已加载${NC}"
    echo ""
fi

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}❌ 请提供输入 JSON 文件路径${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/process-images.sh explore-config-processed.json"
    echo ""
    exit 1
fi

INPUT_FILE="$1"

# 检查文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ 文件不存在: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 输入文件: $INPUT_FILE${NC}"
echo ""

# 检查环境变量
echo "🔍 检查环境变量..."
MISSING_ENV=0

if [ -z "$OSS_REGION" ]; then
    echo -e "${YELLOW}⚠️  OSS_REGION 未设置${NC}"
    MISSING_ENV=1
else
    echo -e "${GREEN}✅ OSS_REGION: $OSS_REGION${NC}"
fi

if [ -z "$OSS_ACCESS_KEY_ID" ]; then
    echo -e "${YELLOW}⚠️  OSS_ACCESS_KEY_ID 未设置${NC}"
    MISSING_ENV=1
else
    echo -e "${GREEN}✅ OSS_ACCESS_KEY_ID: ${OSS_ACCESS_KEY_ID:0:10}...${NC}"
fi

if [ -z "$OSS_ACCESS_KEY_SECRET" ]; then
    echo -e "${YELLOW}⚠️  OSS_ACCESS_KEY_SECRET 未设置${NC}"
    MISSING_ENV=1
else
    echo -e "${GREEN}✅ OSS_ACCESS_KEY_SECRET: ********${NC}"
fi

if [ -z "$OSS_BUCKET" ]; then
    echo -e "${YELLOW}⚠️  OSS_BUCKET 未设置${NC}"
    MISSING_ENV=1
else
    echo -e "${GREEN}✅ OSS_BUCKET: $OSS_BUCKET${NC}"
fi

if [ -n "$OSS_PUBLIC_DOMAIN" ]; then
    echo -e "${GREEN}✅ OSS_PUBLIC_DOMAIN: $OSS_PUBLIC_DOMAIN${NC}"
fi

echo ""

if [ $MISSING_ENV -eq 1 ]; then
    echo -e "${RED}❌ 请在 .env.local 中设置缺失的环境变量${NC}"
    echo ""
    echo "示例配置:"
    echo "OSS_REGION=oss-ap-southeast-1"
    echo "OSS_ACCESS_KEY_ID=your_key"
    echo "OSS_ACCESS_KEY_SECRET=your_secret"
    echo "OSS_BUCKET=your_bucket"
    echo "OSS_PUBLIC_DOMAIN=https://your-cdn.com"
    echo ""
    exit 1
fi

# 检查 sharp 依赖
echo "🔍 检查依赖..."
if ! npx tsx -e "require('sharp')" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  sharp 未安装，正在安装...${NC}"
    pnpm install sharp
    echo -e "${GREEN}✅ sharp 安装完成${NC}"
else
    echo -e "${GREEN}✅ sharp 已安装${NC}"
fi

echo ""

# 运行脚本
echo "🎬 开始处理..."
echo ""

npx tsx scripts/process-explore-images.ts "$INPUT_FILE"

echo ""
echo -e "${GREEN}✅ 处理完成！${NC}"
