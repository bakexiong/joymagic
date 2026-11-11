"use client";

import { useEffect, useState } from "react";

import { GallerySection } from "@/shared/blocks/explore/gallery-section";
import { MediaDetailModal } from "@/shared/blocks/explore/media-detail-modal";
import { MediaItem } from "@/shared/blocks/explore/media-card";
import { ExploreConfig } from "@/shared/models/explore-config";
import { useRouter } from "@/core/i18n/navigation";

export function ExploreClient() {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectedItemGenerateUrl, setSelectedItemGenerateUrl] =
    useState<string>("/text-to-image");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [config, setConfig] = useState<ExploreConfig>(() => ({
    title: "",
    subtitle: "",
    generateUrl: "/text-to-image",
    sections: [],
  }));

  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/explore");
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (!data || !isMounted) return;

        setConfig((prev) => ({
          ...prev,
          ...data,
          sections:
            Array.isArray(data.sections) && data.sections.length > 0
              ? data.sections
              : prev.sections,
        }));
      } catch {
        // 静默失败，保持当前配置
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleItemClick = (
    item: MediaItem,
    sectionGenerateUrl?: string,
    sectionId?: string,
  ) => {
    setSelectedItem(item);
    setSelectedItemGenerateUrl(
      item.generateUrl ||
        sectionGenerateUrl ||
        config.generateUrl ||
        "/text-to-image",
    );
    setSelectedSectionId(sectionId || null);
    setIsModalOpen(true);
  };

  const getModelFromSectionId = (
    sectionId: string | null,
    generateUrl: string,
  ): string | null => {
    if (generateUrl.includes("text-to-image")) {
      const imageModelMap: Record<string, string> = {
        "gpt-image-1": "gpt-image-1",
        "nano-banana": "nano-banana",
        "nano-banana-pro": "nano-banana-pro",
        "seedream-45": "seedream-v4-5",
        "seedream-v4-5": "seedream-v4-5",
        "qwen-image": "qwen-image-202512",
        "qwen-image-202512": "qwen-image-202512",
        "10b.ai": "10b.ai",
        "text-to-image": "10b.ai",
      };
      return imageModelMap[sectionId || ""] || "10b.ai";
    }

    if (generateUrl.includes("text-to-video")) {
      const videoModelMap: Record<string, string> = {
        "wan-26": "wan-2-6",
        "wan-2-6": "wan-2-6",
        "ltx-2-fast": "ltx-2-fast",
        "ltx-2-pro": "ltx-2-pro",
        "seedance-15-pro": "seedance-1-5-pro",
        "seedance-1-5-pro": "seedance-1-5-pro",
        "seedance-20": "seedance-2-0",
        "seedance-2-0": "seedance-2-0",
        "veo-31": "veo-3-1",
        "veo-3-1": "veo-3-1",
        "text-to-video": "seedance-1-5-pro",
      };
      return videoModelMap[sectionId || ""] || "seedance-1-5-pro";
    }

    if (generateUrl.includes("image-to-video")) {
      const imageToVideoModelMap: Record<string, string> = {
        "wan-26": "wan-2-6",
        "wan-2-6": "wan-2-6",
        "ltx-2-fast": "ltx-2-fast",
        "ltx-2-pro": "ltx-2-pro",
        "seedance-15-pro": "seedance-1-5-pro",
        "seedance-1-5-pro": "seedance-1-5-pro",
        "seedance-20": "seedance-2-0",
        "seedance-2-0": "seedance-2-0",
        "veo-31": "veo-3-1",
        "veo-3-1": "veo-3-1",
        "image-to-video": "seedance-1-5-pro",
      };
      return imageToVideoModelMap[sectionId || ""] || "seedance-1-5-pro";
    }

    return null;
  };

  const handleRecreate = (item: MediaItem) => {
    if (item.prompt) {
      sessionStorage.setItem("creator-initial-prompt", item.prompt);
    }
    if (item.parameters && Object.keys(item.parameters).length > 0) {
      sessionStorage.setItem(
        "creator-initial-params",
        JSON.stringify(item.parameters),
      );
    }

    const targetUrl = selectedItemGenerateUrl || "/text-to-image";
    router.push(targetUrl);
  };

  const handleVideo = (item: MediaItem) => {
    if (item.type !== "image") {
      return;
    }

    if (item.src) {
      sessionStorage.setItem("explore_image_url", item.src);
    }

    if (item.prompt) {
      sessionStorage.setItem("explore_prompt", item.prompt);
    }

    const model = getModelFromSectionId(selectedSectionId, "/image-to-video");
    if (model) {
      sessionStorage.setItem("explore_model", model);
    }

    router.push("/image-to-video");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f14] via-[#0f1117] to-[#111319] px-4 pt-16 pb-12 md:px-6 md:pt-20 md:pb-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {config.sections.map((section) => (
          <GallerySection
            key={section.id}
            sceneName={section.sceneName}
            subtitle={section.subtitle || ""}
            items={section.items || []}
            generateUrl={section.generateUrl}
            sectionId={section.id}
            onItemClick={handleItemClick}
          />
        ))}
      </div>

      <MediaDetailModal
        item={selectedItem}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRecreate={handleRecreate}
        onVideo={handleVideo}
      />
    </div>
  );
}
