"use client";

import {
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/core/i18n/navigation";

import { SmartIcon } from "@/shared/blocks/common";
import { AddToolsDialog } from "@/shared/blocks/create/add-tools-dialog";
import { useAppContext } from "@/shared/contexts/app";
import { usePinnedTools } from "@/shared/hooks/use-pinned-tools";
import {
  extractCombinedAiSceneItems,
  isHiddenAiScene,
} from "@/shared/lib/ai-scene-nav";
import { toCdnUrl } from "@/shared/lib/cdn";
import { isStudioToolHidden } from "@/shared/lib/studio-tool-visibility";
import { isNonBrandExternal } from "@/shared/lib/url";
import { cn } from "@/shared/lib/utils";
import {
  WORKBENCH_PANEL_AMBIENT_CLASS,
  WORKBENCH_PANEL_BASE_CLASS,
} from "@/shared/lib/workbench-panel-shared";
import type { NavItem } from "@/shared/types/blocks/common";

/** 单行：链接 / 分组标题 / 分隔线 */
export type SidebarRow =
  | {
      kind: "link";
      title: string;
      url: string;
      icon?: string;
      badge?: string;
      /** beta：红色胶囊；free：绿色；默认：浅色 */
      badgeVariant?: "beta" | "free" | "default";
      /** 禁用点击，仅展示 */
      disabled?: boolean;
    }
  | { kind: "heading"; title: string }
  | { kind: "divider" };

export type HomeSidebarData = {
  items: SidebarRow[];
  upgrade?: { title: string; url: string };
  social?: Array<{ icon: string; url: string; label: string }>;
};

export type HomeSidebarProps = {
  data?: HomeSidebarData;
  width?: number;
  className?: string;
  navItems?: NavItem[];
};

const WORKSPACE_DESTINATION_ITEMS: Array<
  Extract<SidebarRow, { kind: "link" }>
> = [
  {
    kind: "link",
    title: "Canvas",
    url: "/create/canvas/projects",
    icon: "LayoutDashboard",
  },
  {
    kind: "link",
    title: "Creations",
    url: "/create/canvas/creations",
    icon: "Images",
  },
  {
    kind: "link",
    title: "Collections",
    url: "/create/canvas/collections",
    icon: "FolderOpen",
  },
];

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_STORAGE_KEY = "workspace-sidebar-collapsed";

type SidebarTooltipState = {
  title: string;
  top: number;
  left: number;
} | null;

export type StudioSectionKey = "image" | "video" | "effects";

export type StudioSidebarSectionData = {
  effects: Array<Extract<SidebarRow, { kind: "link" }>>;
  image: Array<Extract<SidebarRow, { kind: "link" }>>;
  video: Array<Extract<SidebarRow, { kind: "link" }>>;
};

export type StudioSidebarPrimarySectionMeta = {
  title: string;
  url: string;
  icon?: string;
};

function applySidebarWidth(collapsed: boolean) {
  if (typeof document === "undefined") return;
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  document.documentElement.style.setProperty(
    "--workspace-sidebar-w",
    `${width}px`,
  );
  document.documentElement.style.setProperty(
    "--workspace-sidebar-offset",
    `calc(${width}px + 1.5rem)`,
  );
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function getToolUrl(tool: NavItem): string {
  return tool.url || tool.children?.[0]?.url || "";
}

function getNavItemLabel(item?: NavItem) {
  return item?.title || item?.name || "";
}

function getNavItemIconName(item?: NavItem) {
  return typeof item?.icon === "string" ? item.icon : undefined;
}

const STUDIO_IMAGE_CARD_ROWS: Array<Extract<SidebarRow, { kind: "link" }>> = [
  {
    kind: "link",
    title: "Editor & Combiner",
    url: "/tool/editor-combiner",
    icon: "PencilLine",
  },
  {
    kind: "link",
    title: "Image to Image",
    url: "/tool/image-to-image",
    icon: "Images",
  },
  {
    kind: "link",
    title: "Text to Image",
    url: "/tool/text-to-image",
    icon: "Image",
  },
  {
    kind: "link",
    title: "PhotoShoot",
    url: "/tool/photoshoot",
    icon: "Camera",
  },
  {
    kind: "link",
    title: "Variations",
    url: "/tool/variations",
    icon: "Grid2x2",
  },
  {
    kind: "link",
    title: "Face Generator",
    url: "/tool/face-generator",
    icon: "ScanFace",
  },
  {
    kind: "link",
    title: "Image Upscaler",
    url: "/tool/image-upscaler",
    icon: "ScanSearch",
  },
  {
    kind: "link",
    title: "Background Remover",
    url: "/tool/image-background-remover",
    icon: "ScissorsLineDashed",
  },
  {
    kind: "link",
    title: "Image Eraser",
    url: "/tool/image-eraser",
    icon: "Eraser",
  },
];

const STUDIO_VIDEO_CARD_ROWS: Array<Extract<SidebarRow, { kind: "link" }>> = [
  {
    kind: "link",
    title: "Image to Video",
    url: "/tool/image-to-video",
    icon: "Images",
  },
  {
    kind: "link",
    title: "Text to Video",
    url: "/tool/text-to-video",
    icon: "Type",
  },
  {
    kind: "link",
    title: "Reference To Video",
    url: "/tool/reference-to-video",
    icon: "GalleryHorizontal",
  },
  {
    kind: "link",
    title: "Video Extend",
    url: "/tool/video-extend",
    icon: "Expand",
  },
  {
    kind: "link",
    title: "Motion Control",
    url: "/tool/motion-control",
    icon: "Move",
  },
  {
    kind: "link",
    title: "Longcat Avatar",
    url: "/tool/longcat-avatar",
    icon: "MessageCircleMore",
  },
];

const STUDIO_EFFECT_CARD_ROWS: Array<Extract<SidebarRow, { kind: "link" }>> = [
  {
    kind: "link",
    title: "Image Effects",
    url: "/tool/image-effect",
    icon: "Sparkles",
  },
  {
    kind: "link",
    title: "Video Effects",
    url: "/tool/video-effect",
    icon: "Clapperboard",
  },
];

export function getStudioSidebarSectionData(
  tSidebar: (key: string) => string,
): StudioSidebarSectionData {
  return {
    image: STUDIO_IMAGE_CARD_ROWS.map((row) => ({
      ...row,
      title: tSidebar(`imageTools.${row.title}`),
    })),
    video: STUDIO_VIDEO_CARD_ROWS.map((row) => ({
      ...row,
      title: tSidebar(`videoTools.${row.title}`),
    })).filter((row) => !isStudioToolHidden(row.url)),
    effects: STUDIO_EFFECT_CARD_ROWS.map((row) => ({
      ...row,
      title:
        row.title === "Image Effects"
          ? tSidebar(`imageTools.${row.title}`)
          : tSidebar(`videoTools.${row.title}`),
    })),
  };
}

export function getStudioSidebarPrimarySectionMeta(
  tSidebar: (key: string) => string,
): Record<keyof StudioSidebarSectionData, StudioSidebarPrimarySectionMeta> {
  return {
    effects: {
      title: tSidebar("primary.effects"),
      url: "/ai-effect",
      icon: "Sparkles",
    },
    image: {
      title: tSidebar("primary.image"),
      url: "/ai-image-generator",
      icon: "Image",
    },
    video: {
      title: tSidebar("primary.video"),
      url: "/ai-video-generator",
      icon: "Clapperboard",
    },
  };
}

export function getStudioSidebarSectionKey(
  item: NavItem,
  studioSidebarPrimaryMeta: Record<
    keyof StudioSidebarSectionData,
    StudioSidebarPrimarySectionMeta
  >,
): StudioSectionKey | null {
  const url = (item.url || "").trim().toLowerCase();
  const title = (item.title || item.name || "").trim().toLowerCase();
  const childUrls =
    item.children?.flatMap((child) => {
      const urls = child.url ? [child.url] : [];
      const nestedUrls =
        child.children?.map((nestedChild) => nestedChild.url || "") || [];
      return [...urls, ...nestedUrls];
    }) || [];
  const normalizedChildUrls = childUrls
    .map((childUrl) => childUrl.trim().toLowerCase())
    .filter(Boolean);

  const hasChildUrl = (...patterns: string[]) =>
    normalizedChildUrls.some((childUrl) =>
      patterns.some((pattern) => childUrl.includes(pattern)),
    );

  if (
    url === "/ai-effect" ||
    title === studioSidebarPrimaryMeta.effects.title.toLowerCase() ||
    title === "ai effect" ||
    title === "ai 特效" ||
    title.includes("effect") ||
    title.includes("特效") ||
    hasChildUrl("/image-effect", "/video-effect")
  ) {
    return "effects";
  }

  if (
    url === "/ai-image-generator" ||
    title === studioSidebarPrimaryMeta.image.title.toLowerCase() ||
    title === "image ai" ||
    title === "图片ai" ||
    title === "图像ai" ||
    title.includes("image") ||
    title.includes("图片") ||
    title.includes("图像") ||
    hasChildUrl(
      "/text-to-image",
      "/image-to-image",
      "/editor-combiner",
      "/photoshoot",
      "/variations",
      "/face-generator",
      "/image-upscaler",
      "/image-background-remover",
      "/image-eraser",
    )
  ) {
    return "image";
  }

  if (
    url === "/ai-video-generator" ||
    title === studioSidebarPrimaryMeta.video.title.toLowerCase() ||
    title === "video ai" ||
    title === "视频ai" ||
    title.includes("video") ||
    title.includes("视频") ||
    hasChildUrl(
      "/image-to-video",
      "/text-to-video",
      "/reference-to-video",
      "/video-extend",
      "/motion-control",
      "/longcat-avatar",
    )
  ) {
    return "video";
  }

  return null;
}

function isHiddenSidebarLink(title: string, url: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  return (
    normalizedTitle.includes("video upscaler") ||
    normalizedTitle.includes("视频放大") ||
    normalizedTitle.includes("影片放大") ||
    normalizedUrl.includes("video-upscaler") ||
    normalizedUrl.includes("/video-face-swap") ||
    normalizedUrl.includes("video-face-swap") ||
    normalizedTitle.includes("video face swap")
  );
}

function isHistoryLink(title: string, url: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  return (
    normalizedUrl === "/" ||
    normalizedUrl.startsWith("/creator") ||
    normalizedTitle.includes("home") ||
    normalizedTitle.includes("首页") ||
    normalizedTitle.includes("history") ||
    normalizedTitle.includes("历史") ||
    normalizedTitle.includes("asset") ||
    normalizedTitle.includes("资产")
  );
}

function isInspireLink(title: string, url: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();
  return (
    normalizedUrl.startsWith("/explore") ||
    normalizedUrl.includes("#features") ||
    normalizedTitle.includes("explore") ||
    normalizedTitle.includes("探索") ||
    normalizedTitle.includes("inspire") ||
    normalizedTitle.includes("应用") ||
    normalizedTitle.includes("template")
  );
}

function getCreationEntryType(title: string, url: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (
    normalizedTitle.includes("video") ||
    normalizedTitle.includes("视频") ||
    normalizedUrl.includes("video")
  ) {
    return "video";
  }

  if (
    normalizedTitle.includes("image") ||
    normalizedTitle.includes("图像") ||
    normalizedTitle.includes("图片") ||
    normalizedUrl.includes("image")
  ) {
    return "image";
  }

  if (
    normalizedTitle.includes("effect") ||
    normalizedTitle.includes("effects") ||
    normalizedUrl.includes("effect")
  ) {
    return "effect";
  }

  if (
    normalizedTitle.includes("audio") ||
    normalizedTitle.includes("音频") ||
    normalizedUrl.includes("audio")
  ) {
    return "audio";
  }

  return null;
}

function getCreationEntryLabel(type: string, fallback: string) {
  switch (type) {
    case "video":
      return "Video";
    case "image":
      return "Image";
    case "audio":
      return "Audio";
    case "effect":
      return "Effect";
    default:
      return fallback;
  }
}

function getSidebarRowBadge(row: Extract<SidebarRow, { kind: "link" }>) {
  return "badge" in row ? row.badge : undefined;
}

function getSidebarRowBadgeVariant(row: Extract<SidebarRow, { kind: "link" }>) {
  return "badgeVariant" in row ? row.badgeVariant : undefined;
}

function getSidebarRowDisabled(row: Extract<SidebarRow, { kind: "link" }>) {
  return "disabled" in row ? row.disabled : undefined;
}

function SidebarNavLink({
  title,
  url,
  icon,
  iconUrl,
  badge,
  badgeVariant = "default",
  active,
  disabled,
  clickable = true,
  collapsed = false,
  order = 0,
  nested = false,
  onTooltipChange,
}: {
  title: string;
  url: string;
  icon?: string;
  iconUrl?: string;
  badge?: string;
  badgeVariant?: "beta" | "free" | "default";
  active: boolean;
  disabled?: boolean;
  clickable?: boolean;
  collapsed?: boolean;
  order?: number;
  nested?: boolean;
  onTooltipChange?: (next: SidebarTooltipState) => void;
}) {
  const textDelay = collapsed ? "0ms" : `${Math.min(order * 18, 126)}ms`;
  const updateTooltip = (
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    nextTitle: string | null,
  ) => {
    if (!onTooltipChange) return;
    if (!nextTitle) {
      onTooltipChange(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    onTooltipChange({
      title: nextTitle,
      top: rect.top + rect.height / 2,
      left: rect.right + 14,
    });
  };
  const row = (
    <>
      {icon || iconUrl ? (
        iconUrl ? (
          <span
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center overflow-hidden rounded-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              collapsed && "size-[18px]",
              !disabled &&
                "group-hover:scale-[1.08] group-hover:-translate-y-[1px]",
            )}
          >
            <img
              src={toCdnUrl(iconUrl)}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
        ) : (
          <SmartIcon
            name={icon ?? "sparkles"}
            size={15}
            className={cn(
              "shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              disabled
                ? "text-white/30"
                : active
                  ? "text-[color:var(--color-link-on-dark)]"
                  : "text-white/58",
              collapsed && "size-4.5",
              !disabled &&
                "group-hover:scale-[1.1] group-hover:-translate-y-[1px] group-hover:text-white/90",
            )}
          />
        )
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] font-medium leading-none tracking-[-0.015em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          nested && !collapsed && badge && "truncate pr-1",
          collapsed &&
            "pointer-events-none w-0 flex-none -translate-x-1 overflow-hidden opacity-0",
        )}
        style={{ transitionDelay: textDelay }}
      >
        {title}
      </span>
      {badge && !collapsed ? (
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full border border-white/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-white",
            badgeVariant === "beta"
              ? "bg-rose-500/90"
              : badgeVariant === "free"
                ? cn(
                    "border-emerald-200/85 bg-emerald-400 text-[#052814]",
                    nested &&
                      "col-start-2 ml-0 mt-1.5 self-start px-1.5 py-[3px] text-[8px] tracking-[0.04em]",
                  )
                : "bg-white/[0.1]",
          )}
        >
          {badge}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span className="relative block">
        <span
          className={cn(
            "flex cursor-not-allowed items-center gap-2 rounded-xl px-2.5 py-2.5 text-[15px] font-medium tracking-[-0.02em] text-white/26 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            nested &&
              !collapsed &&
              "ml-7 px-2 py-1.5 text-[12px] text-white/30",
            collapsed &&
              "mx-auto h-10 w-10 justify-center gap-0 rounded-[18px] px-0",
          )}
          onMouseEnter={(event) => collapsed && updateTooltip(event, title)}
          onMouseLeave={() => collapsed && onTooltipChange?.(null)}
          onFocus={(event) => collapsed && updateTooltip(event, title)}
          onBlur={() => collapsed && onTooltipChange?.(null)}
        >
          {row}
        </span>
      </span>
    );
  }

  const className = cn(
    "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-[-0.015em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    nested &&
      !collapsed &&
      cn(
        "ml-7 gap-1.5 px-2 py-1.5 text-[12px] font-medium text-white/44",
        badge
          ? "grid grid-cols-[18px_minmax(0,1fr)] items-start gap-y-0"
          : "items-center",
      ),
    collapsed &&
      "mx-auto h-10 w-10 justify-center gap-0 rounded-[18px] px-0 py-0",
    active
      ? collapsed
        ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_0_0_1px_rgba(214,235,253,0.18),0_0_18px_rgba(214,235,253,0.08),0_10px_24px_rgba(0,0,0,0.28)]"
        : nested
          ? "bg-transparent text-white"
          : "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.28)]"
      : nested
        ? "text-white/42 hover:bg-transparent hover:text-white/78"
        : "text-white/52 hover:bg-white/[0.045] hover:text-white/88",
  );

  if (!clickable) {
    return (
      <span className="relative block">
        <span
          className={className}
          title={collapsed ? title : undefined}
          onMouseEnter={(event) => collapsed && updateTooltip(event, title)}
          onMouseLeave={() => collapsed && onTooltipChange?.(null)}
          onFocus={(event) => collapsed && updateTooltip(event, title)}
          onBlur={() => collapsed && onTooltipChange?.(null)}
        >
          {row}
        </span>
      </span>
    );
  }

  if (isExternalHref(url)) {
    return (
      <span className="relative block">
        <a
          href={url}
          className={className}
          title={collapsed ? title : undefined}
          onMouseEnter={(event) => collapsed && updateTooltip(event, title)}
          onMouseLeave={() => collapsed && onTooltipChange?.(null)}
          onFocus={(event) => collapsed && updateTooltip(event, title)}
          onBlur={() => collapsed && onTooltipChange?.(null)}
          target="_blank"
          rel={
            isNonBrandExternal(url)
              ? "nofollow noopener noreferrer"
              : "noopener noreferrer"
          }
        >
          {row}
        </a>
      </span>
    );
  }

  return (
    <span className="relative block">
      <Link
        href={url}
        className={className}
        title={collapsed ? title : undefined}
        onMouseEnter={(event) => collapsed && updateTooltip(event, title)}
        onMouseLeave={() => collapsed && onTooltipChange?.(null)}
        onFocus={(event) => collapsed && updateTooltip(event, title)}
        onBlur={() => collapsed && onTooltipChange?.(null)}
      >
        {row}
      </Link>
    </span>
  );
}

function SidebarSectionToggle({
  title,
  icon,
  expanded,
  active,
  collapsed = false,
  order = 0,
  onToggle,
  onTooltipChange,
}: {
  title: string;
  icon?: string;
  expanded: boolean;
  active: boolean;
  collapsed?: boolean;
  order?: number;
  onToggle: () => void;
  onTooltipChange?: (next: SidebarTooltipState) => void;
}) {
  const textDelay = collapsed ? "0ms" : `${Math.min(order * 18, 126)}ms`;
  const updateTooltip = (
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    nextTitle: string | null,
  ) => {
    if (!onTooltipChange) return;
    if (!nextTitle) {
      onTooltipChange(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    onTooltipChange({
      title: nextTitle,
      top: rect.top + rect.height / 2,
      left: rect.right + 14,
    });
  };

  return (
    <button
      type="button"
      onClick={() => !collapsed && onToggle()}
      className={cn(
        "group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium tracking-[-0.015em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed &&
          "mx-auto h-10 w-10 justify-center gap-0 rounded-[18px] px-0 py-0",
        active
          ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_10px_24px_rgba(0,0,0,0.28)]"
          : "text-white/52 hover:bg-white/[0.045] hover:text-white/88",
      )}
      aria-expanded={collapsed ? undefined : expanded}
      title={collapsed ? title : undefined}
      onMouseEnter={(event) => collapsed && updateTooltip(event, title)}
      onMouseLeave={() => collapsed && onTooltipChange?.(null)}
      onFocus={(event) => collapsed && updateTooltip(event, title)}
      onBlur={() => collapsed && onTooltipChange?.(null)}
    >
      {icon ? (
        <SmartIcon
          name={icon}
          size={15}
          className={cn(
            "shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            active ? "text-[color:var(--color-link-on-dark)]" : "text-white/58",
            !collapsed &&
              "group-hover:scale-[1.1] group-hover:-translate-y-[1px] group-hover:text-white/90",
          )}
        />
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] font-medium leading-none tracking-[-0.015em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed &&
            "pointer-events-none w-0 flex-none -translate-x-1 overflow-hidden opacity-0",
        )}
        style={{ transitionDelay: textDelay }}
      >
        {title}
      </span>
      {!collapsed ? (
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/42 transition-transform duration-300",
            expanded ? "rotate-0" : "-rotate-90",
          )}
        />
      ) : null}
    </button>
  );
}

export function HomeSidebar({
  data,
  width = SIDEBAR_WIDTH,
  className,
  navItems,
}: HomeSidebarProps) {
  const pathname = usePathname();
  const tCanvasWorkspaceNav = useTranslations("landing.canvasWorkspace.nav");
  const tSidebar = useTranslations("landing.sidebarStudio");
  const { user, setIsShowSignModal } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<StudioSectionKey, boolean>
  >({
    image: true,
    video: true,
    effects: true,
  });
  const [isAddToolsDialogOpen, setIsAddToolsDialogOpen] = useState(false);
  const [tooltip, setTooltip] = useState<SidebarTooltipState>(null);
  const items = (data?.items ?? []).filter((row) => {
    if (row.kind !== "link") return true;
    return row.url !== "/ai-girl" && !isHiddenSidebarLink(row.title, row.url);
  });
  const linkItems = items.filter(
    (row): row is Extract<SidebarRow, { kind: "link" }> => row.kind === "link",
  );

  const workspaceDestinationItems = useMemo(
    () =>
      [
        {
          kind: "link" as const,
          title: tCanvasWorkspaceNav("canvas"),
          url: "/create/canvas/projects",
          icon: "LayoutDashboard",
        },
        {
          kind: "link" as const,
          title: tCanvasWorkspaceNav("creations"),
          url: "/create/canvas/creations",
          icon: "Images",
        },
        {
          kind: "link" as const,
          title: tCanvasWorkspaceNav("collections"),
          url: "/create/canvas/collections",
          icon: "FolderOpen",
        },
      ] satisfies Array<Extract<SidebarRow, { kind: "link" }>>,
    [tCanvasWorkspaceNav],
  );

  const historyItems = useMemo(
    () => linkItems.filter((row) => isHistoryLink(row.title, row.url)),
    [linkItems],
  );

  const inspireItems = useMemo(
    () =>
      linkItems.filter(
        (row) =>
          !historyItems.some((item) => item.url === row.url) &&
          isInspireLink(row.title, row.url),
      ),
    [historyItems, linkItems],
  );

  const workspaceItems = useMemo(
    () =>
      workspaceDestinationItems.filter(
        (row) =>
          !linkItems.some((item) => item.url === row.url) &&
          !historyItems.some((item) => item.url === row.url),
      ),
    [historyItems, linkItems, workspaceDestinationItems],
  );

  const creationItems = useMemo(
    () =>
      linkItems.filter(
        (row) =>
          !historyItems.some((item) => item.url === row.url) &&
          !inspireItems.some((item) => item.url === row.url),
      ),
    [historyItems, inspireItems, linkItems],
  );

  const creationActionItems = useMemo(() => {
    const picked = new Map<string, Extract<SidebarRow, { kind: "link" }>>();

    creationItems.forEach((row) => {
      const type = getCreationEntryType(row.title, row.url);
      if (!type || picked.has(type)) return;
      picked.set(type, row);
    });

    return ["video", "image", "effect", "audio"]
      .map((type) => picked.get(type))
      .filter(Boolean) as Array<Extract<SidebarRow, { kind: "link" }>>;
  }, [creationItems]);

  const allToolNavItems = useMemo<NavItem[]>(() => {
    const creatorTools = extractCombinedAiSceneItems(navItems);
    if (creatorTools.length > 0) {
      return creatorTools;
    }

    return creationItems
      .filter((row) => !row.disabled)
      .map((row) => ({
        title: row.title,
        url: row.url,
        icon: row.icon,
        badge: row.badge,
      }))
      .filter((tool) => !isHiddenAiScene(tool));
  }, [creationItems, navItems]);

  const { pinnedTools, pinnedToolUrls, toggleTool } =
    usePinnedTools(allToolNavItems);

  const isActiveUrl = (url: string) => {
    if (isExternalHref(url)) return false;
    if (url.includes("#")) return false;
    const pathOnly = url.split("?")[0] || "/";
    if (pathOnly === "/") return pathname === "/";
    return pathname.startsWith(pathOnly);
  };

  const studioPrimaryRows = useMemo(
    () =>
      [
        {
          kind: "link" as const,
          title: tSidebar("primary.home"),
          url: "/",
          icon: "House",
        },
        {
          kind: "link" as const,
          title: tSidebar("primary.infiniteCanvas"),
          url: "/create/canvas/projects",
          icon: "Workflow",
          badge: tSidebar("badges.beta"),
          badgeVariant: "beta" as const,
        },
        {
          kind: "link" as const,
          title: tSidebar("primary.image"),
          url: "/ai-image-generator",
          icon: "Image",
        },
        {
          kind: "link" as const,
          title: tSidebar("primary.video"),
          url: "/ai-video-generator",
          icon: "Clapperboard",
        },
        {
          kind: "link" as const,
          title: tSidebar("primary.effects"),
          url: "/ai-effect",
          icon: "Sparkles",
        },
      ] satisfies Array<Extract<SidebarRow, { kind: "link" }>>,
    [tSidebar],
  );

  const studioLibraryRows = useMemo(
    () =>
      [
        {
          kind: "link" as const,
          title: tSidebar("library.assets"),
          url: "/creator",
          icon: "Archive",
          disabled: true,
        },
        {
          kind: "link" as const,
          title: tSidebar("library.collections"),
          url: "/create/canvas/collections",
          icon: "FolderOpen",
        },
      ] satisfies Array<Extract<SidebarRow, { kind: "link" }>>,
    [tSidebar],
  );

  const studioAssetRows = useMemo(
    () =>
      [
        {
          kind: "link" as const,
          title: tSidebar("library.creations"),
          url: "/create/canvas/creations",
          icon: "Orbit",
        },
        {
          kind: "link" as const,
          title: tSidebar("library.uploads"),
          url: "/create/canvas/uploads",
          icon: "FileUp",
        },
      ] satisfies Array<Extract<SidebarRow, { kind: "link" }>>,
    [tSidebar],
  );

  const renderSectionHeading = (title: string, key: string) => {
    if (collapsed) return null;
    return (
      <p
        key={key}
        className="px-3 pt-5 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/26 first:pt-0"
      >
        {title}
      </p>
    );
  };

  const renderLinkRows = (
    rows: Array<Extract<SidebarRow, { kind: "link" }>>,
    orderOffset: number,
    options?: { nested?: boolean },
  ) =>
    rows.map((row, idx) => {
      return (
        <SidebarNavLink
          key={`${row.url}-${row.title}-${idx}`}
          title={row.title}
          url={row.url}
          icon={row.icon}
          iconUrl={undefined}
          badge={row.badge}
          badgeVariant={row.badgeVariant}
          active={isActiveUrl(row.url)}
          disabled={row.disabled}
          collapsed={collapsed}
          order={orderOffset + idx}
          nested={options?.nested}
          onTooltipChange={setTooltip}
        />
      );
    });

  const studioSectionData = useMemo(
    () => getStudioSidebarSectionData(tSidebar),
    [tSidebar],
  );
  const imageSceneRows = studioSectionData.image;
  const videoSceneRows = studioSectionData.video;
  const effectSceneRows = studioSectionData.effects;

  const toggleSection = (section: StudioSectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const isSectionActive = (
    rows: Array<Extract<SidebarRow, { kind: "link" }>>,
    sectionUrl: string,
  ) => rows.some((item) => isActiveUrl(item.url)) || isActiveUrl(sectionUrl);

  const renderStudioPrimaryRows = () => {
    const rows: ReactNode[] = [];
    let order = 0;

    studioPrimaryRows.forEach((row, index) => {
      const sectionKey =
        row.url === "/ai-image-generator"
          ? "image"
          : row.url === "/ai-video-generator"
            ? "video"
            : row.url === "/ai-effect"
              ? "effects"
              : null;

      if (sectionKey) {
        const sectionRows =
          sectionKey === "image"
            ? imageSceneRows
            : sectionKey === "video"
              ? videoSceneRows
              : effectSceneRows;
        rows.push(
          <SidebarSectionToggle
            key={`${row.url}-${row.title}-${index}`}
            title={row.title}
            icon={row.icon}
            expanded={expandedSections[sectionKey]}
            active={isSectionActive(sectionRows, row.url)}
            collapsed={collapsed}
            order={order}
            onToggle={() => toggleSection(sectionKey)}
            onTooltipChange={setTooltip}
          />,
        );
      } else {
        rows.push(
          <SidebarNavLink
            key={`${row.url}-${row.title}-${index}`}
            title={row.title}
            url={row.url}
            icon={row.icon}
            badge={getSidebarRowBadge(row)}
            badgeVariant={getSidebarRowBadgeVariant(row)}
            active={isActiveUrl(row.url)}
            disabled={getSidebarRowDisabled(row)}
            collapsed={collapsed}
            order={order}
            onTooltipChange={setTooltip}
          />,
        );
      }
      order += 1;

      if (collapsed) {
        return;
      }

      if (
        row.url === "/ai-image-generator" &&
        expandedSections.image &&
        imageSceneRows.length > 0
      ) {
        rows.push(...renderLinkRows(imageSceneRows, order, { nested: true }));
        order += imageSceneRows.length;
      }

      if (
        row.url === "/ai-video-generator" &&
        expandedSections.video &&
        videoSceneRows.length > 0
      ) {
        rows.push(...renderLinkRows(videoSceneRows, order, { nested: true }));
        order += videoSceneRows.length;
      }

      if (
        row.url === "/ai-effect" &&
        expandedSections.effects &&
        effectSceneRows.length > 0
      ) {
        rows.push(...renderLinkRows(effectSceneRows, order, { nested: true }));
        order += effectSceneRows.length;
      }
    });

    return rows;
  };

  const renderStudioLibraryRows = () => {
    const rows: ReactNode[] = [];
    let order =
      studioPrimaryRows.length +
      (expandedSections.image ? imageSceneRows.length : 0) +
      (expandedSections.video ? videoSceneRows.length : 0) +
      (expandedSections.effects ? effectSceneRows.length : 0);

    studioLibraryRows.forEach((row, index) => {
      rows.push(
        <SidebarNavLink
          key={`${row.url}-${row.title}-${index}`}
          title={row.title}
          url={row.url}
          icon={row.icon}
          badge={getSidebarRowBadge(row)}
          badgeVariant={getSidebarRowBadgeVariant(row)}
          active={isActiveUrl(row.url)}
          disabled={getSidebarRowDisabled(row)}
          collapsed={collapsed}
          order={order}
          onTooltipChange={setTooltip}
        />,
      );
      order += 1;

      if (collapsed) {
        return;
      }

      if (row.url === "/creator") {
        rows.push(...renderLinkRows(studioAssetRows, order, { nested: true }));
        order += studioAssetRows.length;
      }
    });

    return rows;
  };

  const renderPinnedRows = (rows: NavItem[], orderOffset: number) =>
    rows.map((tool, idx) => {
      const url = getToolUrl(tool);
      if (!url) return null;
      return (
        <SidebarNavLink
          key={`${url}-${tool.title || tool.name || idx}`}
          title={tool.title || tool.name || "Tool"}
          url={url}
          icon={tool.icon as string | undefined}
          iconUrl={tool.icon_url}
          active={isActiveUrl(url)}
          collapsed={collapsed}
          order={orderOffset + idx}
          onTooltipChange={setTooltip}
        />
      );
    });

  const handleOpenAddTools = () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }
    setIsAddToolsDialogOpen(true);
  };

  const renderCreationGrid = (
    rows: Array<Extract<SidebarRow, { kind: "link" }>>,
    orderOffset: number,
  ) => {
    if (collapsed) {
      return renderLinkRows(rows, orderOffset);
    }

    return (
      <div className="grid grid-cols-2 gap-2 px-1 pt-1">
        {rows.map((row, idx) => {
          const disabled = Boolean(row.disabled);
          const active = isActiveUrl(row.url);
          const creationType = getCreationEntryType(row.title, row.url);
          const displayTitle = tSidebar(
            `creationTypes.${getCreationEntryLabel(creationType || "", row.title)}`,
          );
          const buttonClassName = cn(
            "group flex min-h-[52px] items-center gap-2 rounded-[16px] border border-[color:var(--color-frost-border-alt)] bg-white/[0.03] px-3 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            active
              ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              : "text-white/78 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white",
            disabled && "cursor-not-allowed opacity-45",
          );
          const content = (
            <>
              {row.icon ? (
                <SmartIcon
                  name={row.icon}
                  size={15}
                  className={cn(
                    "shrink-0 text-white/70 transition-all duration-300 group-hover:scale-[1.08] group-hover:text-white",
                    active && "text-white",
                  )}
                />
              ) : null}
              <span className="whitespace-nowrap text-[13px] font-medium leading-none tracking-[-0.015em]">
                {displayTitle}
              </span>
            </>
          );

          if (disabled) {
            return (
              <span
                key={`${row.url}-${row.title}-${idx}`}
                className={buttonClassName}
                style={{
                  transitionDelay: `${Math.min((orderOffset + idx) * 18, 126)}ms`,
                }}
              >
                {content}
              </span>
            );
          }

          return (
            <Link
              key={`${row.url}-${row.title}-${idx}`}
              href={row.url}
              className={buttonClassName}
              style={{
                transitionDelay: `${Math.min((orderOffset + idx) * 18, 126)}ms`,
              }}
            >
              {content}
            </Link>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const nextCollapsed = saved === "true";
    setCollapsed(nextCollapsed);
    applySidebarWidth(nextCollapsed);
    const savedSections = window.localStorage.getItem(
      "workspace-sidebar-sections",
    );
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections) as Partial<
          Record<StudioSectionKey, boolean>
        >;
        setExpandedSections((current) => ({
          image: parsed.image ?? current.image,
          video: parsed.video ?? current.video,
          effects: parsed.effects ?? current.effects,
        }));
      } catch {}
    }

    const handleToggle = () => {
      setCollapsed((prev) => {
        const next = !prev;
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        applySidebarWidth(next);
        window.dispatchEvent(
          new CustomEvent("workspace-sidebar-state", {
            detail: { collapsed: next },
          }),
        );
        return next;
      });
    };

    const handleSetState = (event: Event) => {
      const nextCollapsed = Boolean(
        (event as CustomEvent<{ collapsed?: boolean }>).detail?.collapsed,
      );
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextCollapsed));
      setCollapsed(nextCollapsed);
      applySidebarWidth(nextCollapsed);
    };

    window.addEventListener("workspace-sidebar-toggle", handleToggle);
    window.addEventListener("workspace-sidebar-set", handleSetState);

    return () => {
      window.removeEventListener("workspace-sidebar-toggle", handleToggle);
      window.removeEventListener("workspace-sidebar-set", handleSetState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "workspace-sidebar-sections",
      JSON.stringify(expandedSections),
    );
  }, [expandedSections]);

  return (
    <>
      <aside
        data-home-sidebar
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          /* fixed + z-20：低于 Header（z-50）；top 依赖布局根上的变量（与 Header 兄弟，不能从 header 继承） */
          "fixed left-3 z-20 hidden flex-col overflow-visible rounded-[26px] transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex",
          WORKBENCH_PANEL_BASE_CLASS,
          "h-[calc(100dvh-var(--header-h,4.5rem)-var(--top-banner-h,0px)-1.5rem)]",
          className,
        )}
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : width,
          top: "calc(var(--header-h, 4.5rem) + var(--top-banner-h, 0px) + 0.75rem)",
          maxHeight:
            "calc(100dvh - var(--header-h, 4.5rem) - var(--top-banner-h, 0px) - 1.5rem)",
        }}
      >
        <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
        <nav
          className={cn(
            "relative z-10 flex flex-1 flex-col gap-1 overflow-y-auto py-4 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "px-3" : "px-3",
          )}
        >
          {!collapsed ? (
            <>
              {renderStudioPrimaryRows()}

              <div
                className="my-4 border-t border-white/[0.08]"
                role="separator"
              />

              <p className="px-3 pb-2 text-[13px] font-medium text-white/62">
                {tSidebar("library.title")}
              </p>
              {renderStudioLibraryRows()}
            </>
          ) : (
            <>
              {renderStudioPrimaryRows()}
              <div
                className="my-2 border-t border-white/[0.08]"
                role="separator"
              />
              {renderStudioLibraryRows()}
            </>
          )}
        </nav>
      </aside>
      <AddToolsDialog
        isOpen={isAddToolsDialogOpen}
        onClose={() => setIsAddToolsDialogOpen(false)}
        allTools={allToolNavItems}
        pinnedToolUrls={pinnedToolUrls}
        onToggleTool={toggleTool}
        sidebarWidth={collapsed ? SIDEBAR_COLLAPSED_WIDTH : width}
      />
      {collapsed && tooltip ? (
        <div
          className="pointer-events-none fixed z-[130] -translate-y-1/2 rounded-[14px] border border-[color:var(--color-frost-border)] bg-[linear-gradient(180deg,rgba(16,16,18,0.98),rgba(8,8,10,0.96))] px-3 py-2 text-[12px] font-medium leading-none whitespace-nowrap tracking-[-0.01em] text-white/92 shadow-[var(--shadow-ring-frost),0_14px_36px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{
            top: tooltip.top,
            left: tooltip.left,
          }}
        >
          {tooltip.title}
        </div>
      ) : null}
    </>
  );
}
