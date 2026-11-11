#!/bin/bash

# OSS 上传进度监控脚本
# 使用方法: ./scripts/check-oss-progress.sh

echo "📊 OSS 上传进度监控"
echo "===================="
echo ""

# 检查任务是否在运行
if pgrep -f "upload-to-oss-with-thumbnails.ts" > /dev/null; then
    echo "✅ 上传任务正在运行中..."
    echo ""

    # 显示最新的进度信息
    if [ -f /private/tmp/claude-501/-Users-admin-project-10bai-z-image-ai/tasks/bptu8nfso.output ]; then
        echo "最新进度："
        tail -n 20 /private/tmp/claude-501/-Users-admin-project-10bai-z-image-ai/tasks/bptu8nfso.output | grep -E "(进度:|处理 |✅|❌)"
    fi
else
    echo "⏸️  上传任务未运行"
    echo ""

    # 检查是否已完成
    if [ -f explore-config-oss.json ]; then
        echo "✅ 发现输出文件 explore-config-oss.json"
        echo ""
        echo "文件大小: $(du -h explore-config-oss.json | cut -f1)"
        echo ""
        echo "下一步："
        echo "  1. 验证文件内容"
        echo "  2. 备份原配置: cp explore-config-processed.json explore-config-processed.json.bak"
        echo "  3. 替换配置: mv explore-config-oss.json explore-config-processed.json"
    else
        echo "❌ 未找到输出文件"
    fi
fi

echo ""
echo "提示: 使用 Ctrl+C 不会停止后台任务"
echo "如需停止上传，请运行: pkill -f upload-to-oss-with-thumbnails.ts"
