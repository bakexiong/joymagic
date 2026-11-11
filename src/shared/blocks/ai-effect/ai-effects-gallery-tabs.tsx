"use client";

import { useSearchParams } from "next/navigation";

import { ImageEffectGallery } from "@/shared/blocks/image-effect/image-effect-gallery";
import { VideoEffectGallery } from "@/shared/blocks/video-effect/video-effect-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { ImageEffectItem } from "@/shared/lib/image-effect-data";
import {
  landingSidebarContainerCn,
  landingSidebarInnerCn,
} from "@/shared/lib/landing-sidebar-layout-classes";
import type { VideoEffectItem } from "@/shared/lib/video-effect-data";

type AiEffectsGalleryTabsProps = {
  imageCtaLabel: string;
  imageItems: ImageEffectItem[];
  videoCtaLabel: string;
  videoItems: VideoEffectItem[];
};

export function AiEffectsGalleryTabs({
  imageCtaLabel,
  imageItems,
  videoCtaLabel,
  videoItems,
}: AiEffectsGalleryTabsProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "image" ? "image" : "video";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#181b24_0%,#0d0f14_34%,#08090d_100%)]">
      <section
        className={landingSidebarContainerCn(
          "border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)] px-3 pb-4 pt-5 sm:px-4 sm:pb-5 sm:pt-6 md:px-5 md:pb-6 md:pt-6 lg:px-6",
        )}
      >
        <div className={landingSidebarInnerCn("w-full max-w-[1680px]")}>
          <Tabs key={defaultTab} defaultValue={defaultTab} className="space-y-4 sm:space-y-5">
            <TabsList className="h-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <TabsTrigger
                value="image"
                className="rounded-xl px-3.5 py-2 text-sm text-white/72 data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Image Effect
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="rounded-xl px-3.5 py-2 text-sm text-white/72 data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Video Effect
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-0">
              <ImageEffectGallery ctaLabel={imageCtaLabel} items={imageItems} />
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <VideoEffectGallery ctaLabel={videoCtaLabel} items={videoItems} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
