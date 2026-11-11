"use client";

import { useState, useMemo, useRef } from "react";
import {
  Loader2,
  Plus,
  Save,
  Eye,
  Trash2,
  Wand2,
  Download,
} from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { defaultLocale } from "@/config/locale";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { NavItem } from "@/shared/types/blocks/common";
import {
  extractImageAiScenes,
  FORM_COMPONENTS,
} from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import type {
  SceneNode,
  ModelNode,
} from "@/shared/blocks/common/ai-generator-shared";
import { groupAiScenesByCategory } from "@/shared/lib/ai-scene-nav";
import type {
  ExploreConfig,
  ExploreSection,
} from "@/shared/models/explore-config";
import type { MediaItem } from "@/shared/blocks/explore/media-card";

export function ExploreManager({
  initialConfig,
  navItems,
}: {
  initialConfig: ExploreConfig;
  navItems: NavItem[];
}) {
  const locale = useLocale();
  const [config, setConfig] = useState<ExploreConfig>({
    title: initialConfig.title || "Explore",
    subtitle: initialConfig.subtitle || "",
    sections: initialConfig.sections || [],
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(
    config.sections[0]?.id || null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // 从 navItems 提取场景和模型
  const scenes = useMemo(() => extractImageAiScenes(navItems), [navItems]);
  const { imageScenes, videoScenes } = useMemo(
    () => groupAiScenesByCategory(scenes),
    [scenes],
  );

  // 生成表单状态
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>("");

  // 使用 ref 保存最新的 sceneId 和 modelUrl
  const selectedSceneIdRef = useRef(selectedSceneId);
  const selectedModelUrlRef = useRef(selectedModelUrl);

  // 更新 ref
  selectedSceneIdRef.current = selectedSceneId;
  selectedModelUrlRef.current = selectedModelUrl;

  // 处理生成完成的回调
  const handleGenerationComplete = async (result: {
    url: string;
    type: "image" | "video";
    prompt: string;
    parameters: Record<string, any>;
  }) => {
    console.log(
      "[ExploreManager] handleGenerationComplete called with:",
      result,
    );
    console.log("[ExploreManager] result.url type:", typeof result.url);
    console.log("[ExploreManager] result.url length:", result.url?.length);
    console.log(
      "[ExploreManager] result.url preview:",
      result.url?.substring(0, 100),
    );

    // 验证 URL 格式
    if (
      result.url?.startsWith("data:image") ||
      result.url?.startsWith("data:video")
    ) {
      console.error(
        "[ExploreManager] ERROR: Received base64 data instead of URL!",
      );
      console.error("[ExploreManager] Base64 data length:", result.url.length);
      toast.error("错误：接收到 base64 数据而不是 URL，请检查 API 返回值");
      return;
    }

    if (!result.url?.startsWith("http")) {
      console.warn(
        "[ExploreManager] WARNING: URL does not start with http:",
        result.url,
      );
    }

    console.log("[ExploreManager] selectedSection:", selectedSection);
    console.log("[ExploreManager] currentSection:", currentSection);

    if (!selectedSection || !currentSection) {
      toast.error("请先选择目标分类");
      return;
    }

    console.log("[ExploreManager] Generation completed:", result);

    // 上传到 OSS 并生成缩略图
    const toastId = toast.loading("正在上传到 OSS...");
    let uploadResult: any;
    try {
      console.log("[ExploreManager] Starting upload to OSS...");

      const uploadResponse = await fetch("/api/storage/upload-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.url,
          type: result.type,
        }),
        // 添加超时控制（180秒）
        signal: AbortSignal.timeout(180000),
      });

      uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || uploadResult.code !== 0) {
        throw new Error(uploadResult.message || "上传失败");
      }

      console.log("[ExploreManager] Upload to OSS success:", uploadResult.data);

      // 使用 OSS URL 替换原始 URL
      result.url = uploadResult.data.url;

      toast.dismiss(toastId);
      toast.success("上传到 OSS 成功！");
    } catch (error: any) {
      console.error("[ExploreManager] Upload to OSS failed:", error);
      toast.dismiss(toastId);

      if (error.name === "TimeoutError" || error.name === "AbortError") {
        toast.error("上传超时，请检查网络连接或稍后重试");
      } else {
        toast.error(`上传到 OSS 失败: ${error.message}`);
      }
      return;
    }

    // 使用 ref 获取最新的 sceneId 和 modelUrl
    const currentSceneId = selectedSceneIdRef.current;
    const currentModelUrl = selectedModelUrlRef.current;

    console.log("[ExploreManager] Current values from ref:", {
      currentSceneId,
      currentModelUrl,
    });

    // sceneKey: 直接使用 currentSceneId
    // modelKey: 使用完整的 currentModelUrl
    // model: 从 currentModelUrl 中提取模型名称
    const sceneKey = currentSceneId || "";
    const modelKey = currentModelUrl || "";
    let model = "";

    if (currentModelUrl) {
      const lastSlashIndex = currentModelUrl.lastIndexOf("/");
      if (lastSlashIndex > 0) {
        model = currentModelUrl.substring(lastSlashIndex + 1); // 'yoga-v1'
      } else {
        model = currentModelUrl;
      }
    }

    console.log("[ExploreManager] Extracted keys:", {
      sceneKey,
      modelKey,
      model,
      currentSceneId,
      currentModelUrl,
    });

    // 生成随机的初始点赞数 (100-1000)
    const randomLikes = Math.floor(Math.random() * 901) + 100;

    // 创建新的 MediaItem
    const newItem: MediaItem = {
      id: `item-${Date.now()}`,
      src: result.url,
      type: result.type,
      prompt: result.prompt,
      alt: result.prompt,
      sceneKey: sceneKey,
      modelKey: modelKey, // 完整路径
      model: model, // 只有模型名称
      generateUrl: "/creator",
      parameters: result.parameters,
      likes: randomLikes, // 添加随机点赞数
      thumbnailUrl: uploadResult.data.thumbnailUrl, // 添加缩略图 URL
    };

    console.log("[ExploreManager] Creating new item:", newItem);

    // 添加到当前选中的分类
    setConfig((prev) => {
      const updated = {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === selectedSection ? { ...s, items: [...s.items, newItem] } : s,
        ),
      };
      console.log("[ExploreManager] Updated config:", updated);
      return updated;
    });

    toast.success(
      `已添加${result.type === "image" ? "图片" : "视频"}到 ${currentSection.sceneName}`,
    );
  };

  // 当前选中的场景和模型
  const currentScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId),
    [scenes, selectedSceneId],
  );

  const currentModels = useMemo(
    () => currentScene?.children || [],
    [currentScene],
  );

  const currentModel = useMemo(
    () => currentModels.find((m) => m.url === selectedModelUrl),
    [currentModels, selectedModelUrl],
  );

  const currentSection = useMemo(
    () => config.sections.find((s) => s.id === selectedSection),
    [config.sections, selectedSection],
  );

  // 获取当前模型对应的表单组件
  const CurrentForm = useMemo(() => {
    if (!selectedModelUrl) return null;
    return FORM_COMPONENTS[selectedModelUrl] || null;
  }, [selectedModelUrl]);

  // 初始化场景和模型选择
  useMemo(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      const firstScene = scenes[0];
      setSelectedSceneId(firstScene.id);
      if (firstScene.children && firstScene.children.length > 0) {
        setSelectedModelUrl(firstScene.children[0].url);
      }
    }
  }, [scenes, selectedSceneId]);

  // 添加新分类
  const addSection = () => {
    const newId = `section-${Date.now()}`;
    const newSection: ExploreSection = {
      id: newId,
      sceneName: "New Section",
      subtitle: "",
      generateUrl: "/text-to-image",
      items: [],
    };
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setSelectedSection(newId);
  };

  // 删除分类
  const deleteSection = (sectionId: string) => {
    if (!confirm("确定要删除这个分类吗？")) return;
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
    if (selectedSection === sectionId) {
      setSelectedSection(config.sections[0]?.id || null);
    }
  };

  // 更新分类信息
  const updateSection = (
    sectionId: string,
    updates: Partial<ExploreSection>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s,
      ),
    }));
  };

  // 当场景改变时，重置模型选择
  const handleSceneChange = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setSelectedModelUrl("");

    const scene = scenes.find((s) => s.id === sceneId);
    if (scene?.children && scene.children.length > 0) {
      setSelectedModelUrl(scene.children[0].url);
    }
  };

  // 删除项目
  const deleteItem = (sectionId: string, itemId: string) => {
    if (!confirm("确定要删除这个项目吗？")) return;
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s,
      ),
    }));
  };

  // 保存配置
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      console.log("[ExploreManager] Saving config:", {
        title: config.title,
        subtitle: config.subtitle,
        sectionsCount: config.sections.length,
        totalItems: config.sections.reduce((sum, s) => sum + s.items.length, 0),
      });

      const response = await fetch("/api/admin/explore/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      console.log("[ExploreManager] Save response:", result);

      if (!response.ok) {
        throw new Error(result.message || "保存失败");
      }

      if (result.data?.saved === false) {
        console.warn("[ExploreManager] Config saved but verification failed");
        toast.warning("配置已保存，但验证失败，请刷新页面检查");
      } else {
        toast.success("保存成功！");
      }
    } catch (error: any) {
      console.error("[ExploreManager] 保存失败:", error);
      toast.error(error.message || "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 导出配置
  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `explore-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 预览项目
  const previewItemHandler = (item: MediaItem) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  // 跳转到 creator 页面
  const goToCreator = (item: MediaItem) => {
    const params = new URLSearchParams({
      prompt: item.prompt || "",
      quality: item.quality || "",
      size: item.size || "",
    });
    const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
    window.open(`${localePrefix}/creator?${params.toString()}`, "_blank");
  };

  // 调试：查看数据库中的配置
  const debugConfig = async () => {
    try {
      const response = await fetch("/api/admin/explore/debug");
      const result = await response.json();
      console.log("[Debug] Database config:", result);

      if (result.data) {
        alert(
          `数据库配置:\n存在: ${result.data.exists}\n长度: ${result.data.length}\n\n预览:\n${result.data.preview}`,
        );
      }
    } catch (error) {
      console.error("[Debug] Failed to fetch config:", error);
      toast.error("获取调试信息失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={addSection} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            添加分类
          </Button>
          <Button onClick={exportConfig} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出配置
          </Button>
          <Button onClick={debugConfig} variant="outline" size="sm">
            🐛 调试
          </Button>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          保存配置
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 场景和模型选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择生成器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>选择场景</Label>
                <Select
                  value={selectedSceneId}
                  onValueChange={handleSceneChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageScenes.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Image</SelectLabel>
                        {imageScenes.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>
                            {scene.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {imageScenes.length > 0 && videoScenes.length > 0 && (
                      <SelectSeparator />
                    )}
                    {videoScenes.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Video</SelectLabel>
                        {videoScenes.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>
                            {scene.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {currentModels.length > 0 && (
                <div>
                  <Label>模型</Label>
                  <Select
                    value={selectedModelUrl}
                    onValueChange={setSelectedModelUrl}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((model) => (
                        <SelectItem key={model.url} value={model.url}>
                          {model.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>目标分类</Label>
                <Select
                  value={selectedSection || ""}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.sceneName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 生成器表单 */}
        <Card>
          <CardHeader>
            <CardTitle>生成内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={formRef} className="rounded-lg">
              {CurrentForm ? (
                <CurrentForm
                  key={`${selectedSceneId}-${selectedModelUrl}`}
                  className="py-0"
                  onGenerationComplete={handleGenerationComplete}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  请选择场景和模型以显示生成表单
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 分类管理 */}
        <Card>
          <CardHeader>
            <CardTitle>分类管理</CardTitle>
          </CardHeader>
          <CardContent>
            {currentSection ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>分类名称</Label>
                    <Input
                      value={currentSection.sceneName}
                      onChange={(e) =>
                        updateSection(currentSection.id, {
                          sceneName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>分类 ID</Label>
                    <Input
                      value={currentSection.id}
                      onChange={(e) =>
                        updateSection(currentSection.id, { id: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>描述</Label>
                  <Input
                    value={currentSection.subtitle}
                    onChange={(e) =>
                      updateSection(currentSection.id, {
                        subtitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSection(currentSection.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除分类
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">
                    内容列表 ({currentSection.items.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentSection.items.map((item) => (
                      <div
                        key={item.id}
                        className="relative group border rounded-lg overflow-hidden"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.src}
                            alt={item.alt}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <video
                            src={item.src}
                            className="w-full h-40 object-cover"
                            muted
                            loop
                          />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => previewItemHandler(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteItem(currentSection.id, item.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">
                            {item.model}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                请选择或创建一个分类
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>内容预览</DialogTitle>
            <DialogDescription>查看详细信息并跳转到 Creator</DialogDescription>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {previewItem.type === "image" ? (
                  <img
                    src={previewItem.src}
                    alt={previewItem.alt}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={previewItem.src}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>模型</Label>
                  <p className="text-gray-700">{previewItem.model}</p>
                </div>
                <div>
                  <Label>类型</Label>
                  <p className="text-gray-700">{previewItem.type}</p>
                </div>
                <div>
                  <Label>质量</Label>
                  <p className="text-gray-700">{previewItem.quality}</p>
                </div>
                <div>
                  <Label>尺寸</Label>
                  <p className="text-gray-700">{previewItem.size}</p>
                </div>
                <div className="col-span-2">
                  <Label>Prompt</Label>
                  <p className="text-gray-700">{previewItem.prompt}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  关闭
                </Button>
                <Button onClick={() => goToCreator(previewItem)}>
                  在 Creator 中打开
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
