"use client";

import { useState } from "react";
import { Play, Wand2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";

import { defaultLocale } from "@/config/locale";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

interface ExploreItem {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
  model: string;
  prompt: string;
  quality: string;
  size: string;
  width: number;
  height: number;
  generateUrl: string;
  aspectRatio: number;
  likes: number;
  priority: string;
  thumbnailUrl: string;
}

interface ExploreSection {
  id: string;
  sceneName: string;
  subtitle: string;
  generateUrl: string;
  items: ExploreItem[];
}

interface ExploreConfig {
  title: string;
  subtitle: string;
  sections: ExploreSection[];
}

export function ExploreGallery({ config }: { config: ExploreConfig }) {
  const locale = useLocale();
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleItemClick = (item: ExploreItem) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const handleGenerate = () => {
    if (!selectedItem) return;

    const params = new URLSearchParams({
      prompt: selectedItem.prompt,
      quality: selectedItem.quality,
      size: selectedItem.size,
      model: selectedItem.model,
    });

    const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
    window.location.href = `${localePrefix}/creator?${params.toString()}`;
  };

  return (
    <div className="space-y-12">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{config.title}</h1>
        {config.subtitle && (
          <p className="text-lg text-muted-foreground">{config.subtitle}</p>
        )}
      </div>

      {/* 分类展示 */}
      {config.sections.map((section, sectionIndex) => (
        <motion.section
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{section.sceneName}</h2>
            {section.subtitle && (
              <p className="text-muted-foreground">{section.subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {section.items.map((item, itemIndex) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: itemIndex * 0.05 }}
                className="group relative cursor-pointer rounded-lg overflow-hidden border hover:shadow-lg transition-all"
                onClick={() => handleItemClick(item)}
              >
                {/* 媒体内容 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {item.type === "image" ? (
                    <img
                      src={item.thumbnailUrl || item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.src}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* 信息栏 */}
                <div className="p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {item.model}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="w-3 h-3" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}

      {/* 详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>内容详情</DialogTitle>
            <DialogDescription>
              查看提示词和参数，点击 Generate 按钮在 Creator 中重新生成
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* 媒体预览 */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedItem.type === "image" ? (
                  <img
                    src={selectedItem.src}
                    alt={selectedItem.alt}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedItem.src}
                    controls
                    className="w-full h-full"
                    autoPlay
                    loop
                  />
                )}
              </div>

              {/* 参数信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    模型
                  </p>
                  <p className="text-base">{selectedItem.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    类型
                  </p>
                  <p className="text-base capitalize">{selectedItem.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    质量
                  </p>
                  <p className="text-base capitalize">{selectedItem.quality}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    尺寸
                  </p>
                  <p className="text-base">{selectedItem.size}</p>
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Prompt
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {selectedItem.prompt}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  关闭
                </Button>
                <Button onClick={handleGenerate} className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
