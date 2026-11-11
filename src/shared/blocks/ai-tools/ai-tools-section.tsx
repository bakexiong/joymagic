"use client";

import { useMemo } from "react";
import { Video, Image as ImageIcon } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";

import { Link } from "@/core/i18n/navigation";
import { SmartIcon } from "@/shared/blocks/common";
import { isHiddenAiScene } from "@/shared/lib/ai-scene-nav";
import { toCdnUrl } from "@/shared/lib/cdn";
import { landingSidebarRowCenteredCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

type AiToolsCategory = "Image" | "Video";

function withOssResizeParams(imageSrc: string, width: number, height: number) {
  const ossProcess = `image/resize,m_fill,w_${width},h_${height}`;

  try {
    const url = new URL(imageSrc);
    // 清理 next/image 风格查询参数，避免无效参数污染缓存 key
    url.searchParams.delete("w");
    url.searchParams.delete("q");

    const currentProcess = url.searchParams.get("x-oss-process");
    if (!currentProcess) {
      url.searchParams.set("x-oss-process", ossProcess);
      return url.toString();
    }

    const replacedProcess = currentProcess.match(
      /image\/resize,m_fill,w_\d+,h_\d+/,
    )
      ? currentProcess.replace(/image\/resize,m_fill,w_\d+,h_\d+/, ossProcess)
      : `${currentProcess}/resize,m_fill,w_${width},h_${height}`;

    url.searchParams.set("x-oss-process", replacedProcess);
    return url.toString();
  } catch {
    return imageSrc;
  }
}

function getPreferredNavUrl(item?: NavItem): string {
  if (!item) return "#";

  if (item.url) return item.url;

  for (const child of item.children || []) {
    const childUrl = getPreferredNavUrl(child);
    if (childUrl !== "#") return childUrl;
  }

  return "#";
}

function getCreatorSceneHref(scene?: NavItem): string {
  const sceneId = getCreatorSceneId(scene);
  if (!sceneId) return "#";

  const params = new URLSearchParams({ scene: sceneId });
  return `/creator?${params.toString()}`;
}

function toId(value: string) {
  // 与工作台侧 `toId()` 保持一致：lowercase + 将非字母数字序列替换为 '-'
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getCreatorSceneId(scene?: NavItem): string {
  if (!scene) return "";
  // 若场景本身带 url，则工作台使用该 url 作为 scene.id（见 extractAiScenes/normalizeItem）
  if (scene.url) return scene.url;

  const title = scene.title || scene.name || "";
  if (!title) return "";

  return toId(title);
}

function mapSceneItems(items: NavItem[]): NavItem[] {
  // 保持与工作台侧边栏/“Add Tools”使用的映射逻辑一致：
  // 优先使用当前 item 的 url，否则从子节点补齐 url，并继承描述/图标等字段。
  return items
    .map((item) => {
      const firstChild =
        item.children?.find((child) => child.url) || item.children?.[0];

      return {
        ...item,
        url: item.url || firstChild?.url,
        description: item.description || firstChild?.description,
        badge: item.badge || firstChild?.badge,
        icon: item.icon || firstChild?.icon,
        icon_url: item.icon_url || firstChild?.icon_url,
      };
    })
    .filter((item) => Boolean(item.url) && !isHiddenAiScene(item));
}

function hasFreeBadge(
  item: NavItem | undefined,
  freeBadgeKeywords: string[],
): boolean {
  if (!item) return false;

  const badgeText = String(item.badge || "")
    .trim()
    .toLowerCase();
  if (
    badgeText &&
    freeBadgeKeywords.some((keyword) => badgeText.includes(keyword))
  ) {
    return true;
  }

  return (item.children || []).some((child) =>
    hasFreeBadge(child, freeBadgeKeywords),
  );
}

function resolveToolIcon(tool: NavItem, category: AiToolsCategory) {
  if (typeof tool.icon === "string" && tool.icon.trim()) {
    return <SmartIcon name={tool.icon} size={16} className="text-white/85" />;
  }

  // 如果 tool.icon 本身是 ReactNode，则直接渲染（通常用于固定图标）
  if (tool.icon && typeof tool.icon !== "string") {
    return tool.icon;
  }

  // 兜底：按分类展示 Image/Video 图标
  if (category === "Video") {
    return <Video className="size-3.5 text-white/85" />;
  }

  return <ImageIcon className="size-3.5 text-white/85" />;
}

const toolsGridClassName =
  "grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6";

/** 单张工具卡片（与 Image / Video 共用同一外层 grid 时列线才能对齐） */
function ToolCard({
  tool,
  category,
  untitledLabel,
}: {
  tool: NavItem;
  category: AiToolsCategory;
  untitledLabel: string;
}) {
  const label = tool.title || tool.name || untitledLabel;
  const href = getCreatorSceneHref(tool);
  const safeHref = href && href !== "#" ? href : "#";

  const thumb = (() => {
    const iconUrl =
      typeof tool.icon_url === "string" ? toCdnUrl(tool.icon_url) : "";
    return iconUrl ? withOssResizeParams(iconUrl, 640, 640) : "";
  })();

  return (
    <Link
      href={safeHref}
      aria-disabled={safeHref === "#"}
      onClick={(e) => {
        if (safeHref === "#") e.preventDefault();
      }}
      className={cn(
        "group relative block min-w-0 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.03]",
        "transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      <div className="relative aspect-[1/1] w-full">
        {thumb ? (
          <img
            src={thumb}
            alt={label}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur">
          {resolveToolIcon(tool, category)}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-7">
          <div className="text-[14px] font-extrabold tracking-tight text-white drop-shadow-[0_5px_16px_rgba(0,0,0,0.35)] font-mono">
            {label}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
        </div>
      </div>
    </Link>
  );
}

export function AiToolsSection({
  className,
  headerNavItems = [],
  variant = "desktop",
  sectionType = "ai",
}: {
  className?: string;
  headerNavItems?: NavItem[];
  variant?: "desktop" | "mobile";
  sectionType?: "ai" | "free";
}) {
  const isMobile = variant === "mobile";
  const messages = useMessages() as Record<string, any>;
  const wavespeedMessages =
    messages?.landing?.wavespeed || messages?.wavespeed || {};
  const tc = useTranslations("creator");
  const untitledLabel = tc("tools.untitled");
  const freeBadgeKeywords = useMemo(() => {
    const rawBadges = wavespeedMessages?.freeTools?.badges;
    if (!Array.isArray(rawBadges)) return [];

    return rawBadges
      .map((badge) =>
        String(badge || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
  }, [wavespeedMessages]);
  const { imageTools, videoTools } = useMemo(() => {
    const imageNav = headerNavItems.find((item) => item.icon === "Image");
    const videoNav = headerNavItems.find((item) => item.icon === "Video");

    const mappedImageTools = mapSceneItems(imageNav?.children || []);
    const mappedVideoTools = mapSceneItems(videoNav?.children || []);

    if (sectionType === "free") {
      return {
        imageTools: mappedImageTools.filter((item) =>
          hasFreeBadge(item, freeBadgeKeywords),
        ),
        videoTools: mappedVideoTools.filter((item) =>
          hasFreeBadge(item, freeBadgeKeywords),
        ),
      };
    }

    return {
      imageTools: mappedImageTools,
      videoTools: mappedVideoTools,
    };
  }, [headerNavItems, sectionType, freeBadgeKeywords]);

  const tWavespeed = useTranslations("landing.wavespeed");
  const tSceneGroups = useTranslations(
    "landing.wavespeed.desktopPlayground.sceneGroups",
  );
  const sectionTitle =
    sectionType === "free"
      ? tWavespeed("freeTools.title")
      : tWavespeed("aiTools.title");
  const sectionSubtitle =
    sectionType === "free"
      ? tWavespeed("freeTools.subtitle")
      : tWavespeed("aiTools.subtitle");

  return (
    <section
      className={cn(
        "relative bg-[#050505] text-white",
        isMobile ? "py-4" : "py-8",
        className,
      )}
    >
      <div
        className={cn(
          isMobile
            ? "relative z-10 px-4"
            : landingSidebarRowCenteredCn(
                "relative z-10 mx-auto w-full 2xl:max-w-[1600px] px-5",
              ),
        )}
      >
        <div className={cn(isMobile ? "mx-auto w-full" : "mx-auto w-full")}>
          <div className="mb-6 flex items-center gap-3">
            <div>
              <div className="text-2xl font-semibold text-white">
                {sectionTitle}
              </div>
              <p className="mt-1 text-sm text-white/70">{sectionSubtitle}</p>
            </div>
          </div>

          {imageTools.length || videoTools.length ? (
            <div className={toolsGridClassName}>
              {imageTools.length ? (
                <>
                  <div className="col-span-full mb-4 flex items-center gap-2">
                    <ImageIcon className="size-4 text-white/80" />
                    <div className="text-lg font-semibold text-white/90">
                      {tSceneGroups("image")}
                    </div>
                  </div>
                  {imageTools.map((tool) => (
                    <ToolCard
                      key={
                        tool.url ||
                        getPreferredNavUrl(tool) ||
                        tool.title ||
                        tool.name
                      }
                      tool={tool}
                      category="Image"
                      untitledLabel={untitledLabel}
                    />
                  ))}
                </>
              ) : null}
              {videoTools.length ? (
                <>
                  <div
                    className={cn(
                      "col-span-full mb-4 flex items-center gap-2",
                      imageTools.length ? "mt-10" : "",
                    )}
                  >
                    <Video className="size-4 text-white/80" />
                    <div className="text-lg font-semibold text-white/90">
                      {tSceneGroups("video")}
                    </div>
                  </div>
                  {videoTools.map((tool) => (
                    <ToolCard
                      key={
                        tool.url ||
                        getPreferredNavUrl(tool) ||
                        tool.title ||
                        tool.name
                      }
                      tool={tool}
                      category="Video"
                      untitledLabel={untitledLabel}
                    />
                  ))}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
