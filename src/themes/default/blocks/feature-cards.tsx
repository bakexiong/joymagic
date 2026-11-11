"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Video, Image as ImageIcon, Wand2 } from "lucide-react";
import Image from "next/image";
import { Link, useRouter } from "@/core/i18n/navigation";
import {
  landingSidebarContainerCn,
  landingSidebarInnerCn,
} from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import { NavItem } from "@/shared/types/blocks/common";
import { useTranslations } from "next-intl";

interface FeatureCard {
  id: string;
  titleKey: string; // 翻译 key
  descriptionKey: string; // 翻译 key
  icon: React.ReactNode;
  image: string;
  backgroundImage?: string;
  href: string;
  badgeKey?: string; // 翻译 key
  gradient: string;
  navKey?: string; // 用于匹配 header nav 中的场景
}

const featureCards: FeatureCard[] = [
  {
    id: "image",
    titleKey: "image.title",
    descriptionKey: "image.description",
    icon: <ImageIcon className="size-6" />,
    image: "https://cdn.10b.ai/showcase/image-demo.webp",
    backgroundImage: "https://ocdn.10b.ai/banner/Image.png",
    href: "/create/image",
    gradient: "from-pink-500/20 to-purple-500/20",
    navKey: "Image", // 使用 icon 名称匹配
  },
  {
    id: "video",
    titleKey: "video.title",
    descriptionKey: "video.description",
    icon: <Video className="size-6" />,
    image: "https://cdn.10b.ai/showcase/video-demo.webp",
    backgroundImage: "https://ocdn.10b.ai/banner/Video.png",
    href: "/create/video",
    gradient: "from-blue-500/20 to-cyan-500/20",
    navKey: "Video", // 使用 icon 名称匹配
  },
  {
    id: "audio",
    titleKey: "audio.title",
    descriptionKey: "audio.description",
    icon: <Wand2 className="size-6" />,
    image: "https://cdn.10b.ai/showcase/audio-demo.webp",
    backgroundImage: "https://ocdn.10b.ai/banner/Audio.png",
    href: "#",
    badgeKey: "audio.badge",
    gradient: "from-violet-500/20 to-purple-500/20",
    navKey: "audio",
  },
];

function getPreferredNavUrl(item?: NavItem): string {
  if (!item) {
    return "#";
  }

  if (item.url) {
    return item.url;
  }

  for (const child of item.children || []) {
    const childUrl = getPreferredNavUrl(child);
    if (childUrl !== "#") {
      return childUrl;
    }
  }

  return "#";
}

function getCreatorSceneHref(scene?: NavItem): string {
  const sceneId = getPreferredNavUrl(scene);

  if (!sceneId || sceneId === "#") {
    return "#";
  }

  const params = new URLSearchParams({
    scene: sceneId,
  });

  return `/creator?${params.toString()}`;
}

function FeatureCardComponent({
  card,
  index,
  subScenes = [],
  resolvedHref,
}: {
  card: FeatureCard;
  index: number;
  subScenes?: NavItem[];
  resolvedHref: string;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const isDisabled = card.id === 'audio';
  const t = useTranslations('landing.wavespeed.featureCards');

  // 取前3个子场景，为 View All 按钮留出空间
  const displaySubScenes = subScenes.slice(0, 3);

  const cardContent = (
    <div
      className={cn(
        "relative h-[360px] w-full overflow-hidden rounded-3xl border border-white/10",
        "bg-gradient-to-br from-white/5 to-white/0",
        "backdrop-blur-sm transition-all duration-300",
        "hover:border-white/20 hover:shadow-2xl hover:shadow-white/10",
        isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"
      )}
    >
      <div className="absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-70">
        <Image
          src={card.backgroundImage || card.image}
          alt={t(card.titleKey)}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
        <div className={cn("absolute inset-0 bg-gradient-to-br", card.gradient)} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {card.badgeKey && (
        <div className="absolute right-4 top-4 z-10">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur-sm">
            {t(card.badgeKey)}
          </span>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col justify-end p-6">
        <motion.div
          initial={false}
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm"
        >
          {card.icon}
        </motion.div>

        {/* 这里不要使用标题标签（h*），避免语义与SEO层级不符合预期 */}
        <div className="mb-2 text-2xl font-bold text-white">
          {t(card.titleKey)}
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="mb-3 text-sm text-white/80">
                {t(card.descriptionKey)}
              </p>

              {/* 显示子场景 */}
              {displaySubScenes.length > 0 && !isDisabled && (
                <div className="space-y-1.5">
                  {displaySubScenes.map((scene, idx) => {
                    return (
                      <Link
                        key={idx}
                        href={getCreatorSceneHref(scene)}
                        className="block rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {scene.title || scene.name}
                      </Link>
                    );
                  })}

                  {/* View All 按钮 */}
                  <Link
                    href={resolvedHref}
                    className="flex items-center justify-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{t('viewAll')}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}

              {!isDisabled && displaySubScenes.length === 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span>Explore</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isHovered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/60"
          >
            {!isDisabled && <ArrowRight className="size-4" />}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        if (!isDisabled && resolvedHref !== "#") {
          router.push(resolvedHref);
        }
      }}
      className="group relative"
    >
      {cardContent}
    </motion.div>
  );
}

export function FeatureCardsSection({ className, headerNavItems = [] }: { className?: string; headerNavItems?: NavItem[] }) {
  // 根据 navKey 匹配 header 中的导航项，获取子场景
  const getSubScenes = (navKey?: string): NavItem[] => {
    if (!navKey || !headerNavItems.length) return [];

    // 匹配逻辑：通过 icon 属性匹配，因为 icon 在所有语言中都是一致的
    // "Image" -> icon: "Image", "Video" -> icon: "Video"
    const navItem = headerNavItems.find((item: NavItem) => {
      const itemIcon = typeof item.icon === 'string' ? item.icon : '';
      return itemIcon === navKey;
    });

    return navItem?.children || [];
  };

  const getCardHref = (navKey?: string, fallbackHref?: string) => {
    const subScenes = getSubScenes(navKey);
    const firstScene = subScenes[0];

    if (firstScene) {
      return getCreatorSceneHref(firstScene);
    }

    return getPreferredNavUrl(firstScene) || fallbackHref || "#";
  };

  return (
    <section className={cn("relative py-8", className)}>
      <div
        className={landingSidebarContainerCn("container relative z-10 px-4")}
      >
        <div className={landingSidebarInnerCn("mx-auto max-w-7xl")}>
          <div className="flex justify-center">
            <div className="grid w-full grid-cols-1 gap-4 min-[640px]:grid-cols-3 min-[640px]:gap-6 xl:max-w-[1100px]">
              {featureCards.map((card, index) => (
                <FeatureCardComponent
                  key={card.id}
                  card={card}
                  index={index}
                  subScenes={getSubScenes(card.navKey)}
                  resolvedHref={getCardHref(card.navKey, card.href)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
