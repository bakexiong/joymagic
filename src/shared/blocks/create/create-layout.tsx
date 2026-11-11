"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  CopyPlus,
  Filter,
  FolderOpen,
  Grid2X2,
  Image as ImageIcon,
  Layers3,
  PanelLeft,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Video,
  Volume2,
  Wand2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Link, useRouter } from "@/core/i18n/navigation";
import { SmartIcon } from "@/shared/blocks/common";
import { GeneratedMediaEmptyState } from "@/shared/blocks/common/generated-media-empty-state";
import { cn } from "@/shared/lib/utils";
import { toCdnUrl } from "@/shared/lib/cdn";
import {
  WORKBENCH_PANEL_AMBIENT_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
} from "@/shared/lib/workbench-panel-shared";
import {
  isHiddenAiScene,
  type AiSceneCategory,
} from "@/shared/lib/ai-scene-nav";
import type { NavItem } from "@/shared/types/blocks/common";
import { AddToolsDialog } from "./add-tools-dialog";
import { useAppContext } from "@/shared/contexts/app";
import { SortableToolItem } from "./sortable-tool-item";
import { usePinnedTools } from "@/shared/hooks/use-pinned-tools";

interface CreateLayoutProps {
  navItems: NavItem[];
  category: AiSceneCategory;
  initialTool?: string;
  selectedToolSlug?: string | null;
  onToolSelect?: (tool: NavItem) => void;
  routingMode?: "create" | "direct-target";
  toolPanelContent?: ReactNode;
  mainPanelContent?: ReactNode;
  className?: string;
  variant?:
    | "default"
    | "reference-text-to-image"
    | "two-column"
    | "scene-browser";
}

type ToolCardTone = {
  surface: string;
  glow: string;
  accent: string;
  pill: string;
};

const CARD_TONES: ToolCardTone[] = [
  {
    surface: "from-[#2c2c2f] via-[#1c1c1f] to-[#0f0f11]",
    glow: "from-white/14 via-white/6 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
  {
    surface: "from-[#26272b] via-[#18191c] to-[#101113]",
    glow: "from-white/12 via-white/5 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
  {
    surface: "from-[#303033] via-[#1f2023] to-[#121316]",
    glow: "from-white/12 via-white/4 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
  {
    surface: "from-[#2f2f31] via-[#1d1d20] to-[#111214]",
    glow: "from-white/10 via-white/4 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
  {
    surface: "from-[#292a2d] via-[#1a1b1e] to-[#101113]",
    glow: "from-white/14 via-white/5 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
  {
    surface: "from-[#2b2c2f] via-[#1b1c1f] to-[#0f1012]",
    glow: "from-white/12 via-white/5 to-transparent",
    accent: "text-white/82",
    pill: "bg-white/10 text-white/70",
  },
];

function mapSceneItems(items: NavItem[]): NavItem[] {
  return items
    .map((item) => {
      const firstChild =
        item.children?.find((child) => child.url) || item.children?.[0];
      const resolvedUrl = item.url || firstChild?.url || "";
      const isImageEffectsTool =
        resolvedUrl.includes("/image-effect") ||
        resolvedUrl.includes("/image-effects");
      const isVideoEffectsTool =
        resolvedUrl.includes("/video-effect") ||
        resolvedUrl.includes("/video-effects");
      const resolvedTitle =
        isImageEffectsTool && item.title === "Effects"
          ? firstChild?.title || "Image Effects"
          : isVideoEffectsTool && item.title === "Effects"
            ? firstChild?.title || "Video Effects"
            : item.title;
      const resolvedName =
        isImageEffectsTool && item.name === "Effects"
          ? firstChild?.name || "Image Effects"
          : isVideoEffectsTool && item.name === "Effects"
            ? firstChild?.name || "Video Effects"
            : item.name;

      return {
        ...item,
        title: resolvedTitle,
        name: resolvedName,
        url: item.url || firstChild?.url,
        description: item.description || firstChild?.description,
        badge: item.badge || firstChild?.badge,
        icon: item.icon || firstChild?.icon,
        icon_url: item.icon_url || firstChild?.icon_url,
      };
    })
    .filter((item) => Boolean(item.url));
}

function getToolSlug(tool?: NavItem | null) {
  return tool?.url?.split("/").filter(Boolean).pop() || "";
}

function getToolUrl(tool: NavItem): string {
  return tool.url || tool.children?.[0]?.url || "";
}

function sceneContainsSlug(scene: NavItem, slug: string | null) {
  if (!slug) return false;
  if (getToolSlug(scene) === slug) return true;
  return scene.children?.some((child) => getToolSlug(child) === slug) || false;
}

function getTone(index: number) {
  return CARD_TONES[index % CARD_TONES.length];
}

function getToolTargetUrl(tool: NavItem) {
  return tool.children?.find((child) => child.url)?.url || tool.url || "";
}

const SHOW_PINNED_TOOLS = true;

export function CreateLayout({
  navItems,
  category,
  initialTool,
  selectedToolSlug,
  onToolSelect,
  routingMode = "create",
  toolPanelContent,
  mainPanelContent,
  className,
  variant = "default",
}: CreateLayoutProps) {
  const { user, setIsShowSignModal } = useAppContext();
  const tc = useTranslations("creator");
  const router = useRouter();
  const activeTab = category;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialTool || null,
  );
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isAddToolsDialogOpen, setIsAddToolsDialogOpen] = useState(false);

  useEffect(() => {
    setSelectedSlug(initialTool || null);
  }, [initialTool]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const tools = useMemo(() => {
    const imageNav = navItems.find((item) => item.icon === "Image");
    const videoNav = navItems.find((item) => item.icon === "Video");

    return {
      Image: imageNav?.children
        ? mapSceneItems(imageNav.children).filter(
            (tool) => !isHiddenAiScene(tool),
          )
        : [],
      Video: videoNav?.children
        ? mapSceneItems(videoNav.children).filter(
            (tool) => !isHiddenAiScene(tool),
          )
        : [],
    };
  }, [navItems]);

  const currentTools = tools[activeTab] || [];
  const allTools = [...tools.Image, ...tools.Video];

  // 使用自定义 hook 管理固定工具 - 传入所有工具而不是当前工具
  const { pinnedTools, pinnedToolUrls, toggleTool, removeTool, reorderTools } =
    usePinnedTools(allTools);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pinnedToolUrls.indexOf(active.id as string);
      const newIndex = pinnedToolUrls.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTools(oldIndex, newIndex);
      }
    }
  };

  const activeSlug = selectedToolSlug ?? selectedSlug;
  const getToolLabel = (tool: NavItem) => {
    return tool.title || tool.name || tc("tools.untitled");
  };
  const selectedTool =
    currentTools.find((tool) => sceneContainsSlug(tool, activeSlug)) || null;
  const previewTools = currentTools.slice(0, 5);
  const guestPreviewTools = previewTools.slice(1, 4);
  const isGuestLanding = !selectedTool;
  const galleryPreviewTools = (
    isGuestLanding ? guestPreviewTools : previewTools
  ).slice(0, 3);
  const defaultSceneBrowserTab: "creations" | "collections" | "templates" = user
    ? "creations"
    : "templates";
  const isReferenceTextToImage = variant === "reference-text-to-image";
  const isSceneBrowser = variant === "scene-browser";
  const isFluxWorkbench = variant === "two-column" || isSceneBrowser;
  const isSidebarCollapsed = !sidebarExpanded;
  const entranceClass = () =>
    cn(
      "motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
      pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
    );

  const handleToolClick = (tool: NavItem) => {
    const slug = getToolSlug(tool);
    setSelectedSlug(slug);

    if (onToolSelect) {
      onToolSelect(tool);
      return;
    }

    if (routingMode === "direct-target" || isSceneBrowser) {
      const targetUrl = getToolTargetUrl(tool);
      if (targetUrl) {
        router.push(targetUrl);
      }
      return;
    }

    if (slug) {
      router.push(`/create/${activeTab.toLowerCase()}/${slug}`);
    }
  };

  // 统一使用三列布局（侧边栏 + 工具面板 + 主面板）
  const useThreeColumnLayout =
    variant === "two-column" ||
    variant === "default" ||
    variant === "scene-browser";

  if (useThreeColumnLayout) {
    return (
      <div
        className={cn(
          "flex w-full flex-col bg-[color:var(--color-page-bg)] pb-2 pt-3 text-foreground md:grid md:h-[calc(100dvh-3.5rem)] md:grid-cols-1 md:gap-2 md:px-2 md:pb-4 md:pt-3 lg:h-[calc(100dvh-var(--header-h,4.5rem))] lg:grid-cols-[minmax(380px,460px)_1fr] lg:gap-2 lg:px-2 lg:pb-2 lg:pt-3 xl:grid-cols-[minmax(400px,500px)_1fr] xl:gap-2",
          isFluxWorkbench &&
            "dark [--background:var(--color-page-bg)] [--foreground:var(--color-foreground)] [--card:var(--color-surface-1)] [--card-foreground:var(--color-foreground)] [--popover:var(--color-popover)] [--popover-foreground:var(--color-foreground)] [--muted:var(--color-muted)] [--muted-foreground:var(--color-text-secondary)] [--accent:var(--color-accent)] [--accent-foreground:var(--color-foreground)] [--border:var(--color-frost-border)] [--input:rgba(255,255,255,0.03)] [--ring:var(--color-ring)] [--primary:var(--color-primary)] [--primary-foreground:var(--color-primary-foreground)]",
          className,
        )}
      >
        {/* Content Container - 平板上垂直排列，桌面上水平排列 */}
        <div className="flex min-h-0 flex-col md:h-full md:overflow-hidden lg:contents">
          {/* Tool Panel - Form */}
          <aside
            className={cn(
              "flex min-h-[50vh] min-w-0 flex-col border-b border-border md:h-1/2 md:border-b-0 lg:h-full lg:border-b-0",
              entranceClass(),
            )}
            style={{ transitionDelay: pageReady ? "110ms" : "0ms" }}
          >
            <div
              className={cn(
                "flex h-full flex-col px-4 py-4 md:px-4 md:py-3 lg:px-0 lg:py-3",
                isSceneBrowser && "px-0 py-0 md:px-0 md:py-0 lg:px-0 lg:py-0",
              )}
            >
              {isSceneBrowser ? (
                <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.07)_14%,rgba(31,36,46,0.99)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)] backdrop-blur-sm transition-all duration-500 hover:border-white/24 hover:shadow-xl hover:shadow-black/30">
                  <div className="border-b border-white/5 px-5 pb-3.5 pt-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-white">
                          {tc("sceneBrowser.title", { category: activeTab })}
                        </h2>
                        <p className="mt-1 text-[14px] leading-5 text-white/42">
                          {tc("sceneBrowser.subtitle")}
                        </p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-white/66">
                        <FolderOpen className="size-4" />
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="space-y-2.5">
                      {currentTools.map((tool, index) => {
                        const tone = getTone(index);
                        const label = getToolLabel(tool);
                        const isActive = sceneContainsSlug(tool, activeSlug);

                        return (
                          <button
                            key={tool.url || label}
                            type="button"
                            onClick={() => handleToolClick(tool)}
                            className={cn(
                              "group relative flex w-full cursor-pointer items-start gap-3.5 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-300",
                              isActive
                                ? "border-white/12 bg-[#222733] shadow-[0_12px_40px_rgba(0,0,0,0.24)]"
                                : "border-white/6 bg-[#1a1e27] hover:border-white/10 hover:bg-[#1f2430]",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300",
                                isActive && "opacity-100",
                              )}
                            />
                            <div
                              className={cn(
                                "flex size-[52px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br shadow-[0_10px_30px_rgba(0,0,0,0.22)]",
                                tone.surface,
                              )}
                            >
                              {toCdnUrl(tool.icon_url) ? (
                                <img
                                  src={toCdnUrl(tool.icon_url)!}
                                  alt={label}
                                  className="block size-full rounded-full object-cover object-center"
                                />
                              ) : typeof tool.icon === "string" ? (
                                <SmartIcon
                                  name={tool.icon}
                                  className="size-5 text-white/82"
                                />
                              ) : tool.icon ? (
                                tool.icon
                              ) : (
                                <span className="text-[13px] font-semibold text-white/82">
                                  {label
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part.charAt(0))
                                    .join("")
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-white">
                                    {label}
                                  </h3>
                                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/42">
                                    {tool.description ||
                                      "Open this scene to explore models and start generating."}
                                  </p>
                                </div>
                                <ChevronDown className="-rotate-90 mt-0.5 size-4 shrink-0 text-white/26 transition-transform duration-300 group-hover:text-white/52" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-white/5 px-4 py-3.5">
                    <div className="rounded-[24px] border border-white/6 bg-[#111317] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Video",
                            href: "/create/video",
                            icon: Video,
                            active: category === "Video",
                          },
                          {
                            label: "Image",
                            href: "/create/image",
                            icon: ImageIcon,
                            active: category === "Image",
                          },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex h-14 items-center justify-center gap-2.5 rounded-[20px] px-4 text-[15px] font-semibold tracking-[-0.02em] transition-all duration-200",
                              item.active
                                ? "bg-white text-[#111214] shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                                : "text-white/68 hover:bg-white/[0.05] hover:text-white",
                            )}
                          >
                            <item.icon className="size-4.5" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : toolPanelContent ? (
                toolPanelContent
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {tc("panels.tools.formEmpty")}
                </div>
              )}
            </div>
          </aside>

          {/* Main Panel - Generated Media */}
          <main
            className={cn(
              "relative flex min-h-[50vh] min-w-0 flex-col md:h-1/2 lg:h-full",
              entranceClass(),
            )}
            style={{ transitionDelay: pageReady ? "180ms" : "0ms" }}
          >
            {/* Header for mobile/tablet */}
            {!mainPanelContent ? (
              <div className="border-b border-border px-4 py-3 md:px-4 lg:hidden">
                <h2 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                  {activeTab === "Image"
                    ? tc("panels.generated.titleImages")
                    : tc("panels.generated.titleVideos")}
                </h2>
              </div>
            ) : null}
            <div
              className={cn(
                "flex h-full min-h-0 flex-col px-4 py-4 md:px-4 md:py-3 lg:px-0 lg:py-3",
                mainPanelContent ? "overflow-hidden" : "overflow-y-auto",
                isSceneBrowser && "px-0 py-0 md:px-0 md:py-0 lg:px-0 lg:py-0",
              )}
            >
              {isSceneBrowser ? (
                <div className="group flex h-full min-h-0 flex-col overflow-hidden border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_12%,rgba(24,26,31,0.99)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)] transition-all duration-500 hover:border-white/24">
                  <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 pb-3.5 pt-3.5">
                    <div className="flex min-w-0 shrink items-center gap-2">
                      {[
                        {
                          label: tc("sceneBrowser.tabs.creations"),
                          active: defaultSceneBrowserTab === "creations",
                          icon: Star,
                        },
                        {
                          label: tc("sceneBrowser.tabs.collections"),
                          active: false,
                          icon: FolderOpen,
                        },
                        {
                          label: tc("sceneBrowser.tabs.templates"),
                          active: defaultSceneBrowserTab === "templates",
                          icon: CopyPlus,
                        },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className={cn(
                            "flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[18px] border px-3.5 text-[12px] font-semibold tracking-[-0.01em] transition-all duration-200 whitespace-nowrap",
                            item.active
                              ? "border-white/10 bg-white text-[#121315]"
                              : "border-white/10 bg-transparent text-white/70 hover:border-white/18 hover:bg-white/[0.05] hover:text-white",
                          )}
                        >
                          <item.icon className="size-[15px]" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2.5 whitespace-nowrap">
                      <div className="hidden items-center gap-2 xl:flex">
                        <div className="h-1 w-40 rounded-full bg-white/10">
                          <div className="relative h-full w-[54%] rounded-full bg-white/18">
                            <span className="absolute right-0 top-1/2 size-6 -translate-y-1/2 rounded-full border border-white/20 bg-white shadow-[0_6px_18px_rgba(0,0,0,0.32)]" />
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 rounded-[18px] border border-white/8 bg-white/[0.02] p-1">
                        {[
                          { icon: ImageIcon, active: false },
                          { icon: Video, active: false },
                          { icon: Volume2, active: false },
                          { icon: Layers3, active: true, label: "All" },
                        ].map((item, index) => (
                          <button
                            key={`${item.label || "icon"}-${index}`}
                            type="button"
                            className={cn(
                              "flex h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border px-2.5 text-[12px] font-semibold tracking-[-0.01em] transition-all duration-200",
                              item.active
                                ? "border-white/10 bg-white/12 text-white"
                                : "border-transparent bg-transparent text-white/38 hover:text-white/72",
                            )}
                          >
                            {item.label ? (
                              <span className="text-[12px] font-semibold">
                                {item.label}
                              </span>
                            ) : (
                              <item.icon className="size-[15px]" />
                            )}
                          </button>
                        ))}
                      </div>

                      {[Star, Filter, PanelLeft, Search].map((Icon, index) => (
                        <button
                          key={index}
                          type="button"
                          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[18px] border border-white/8 bg-transparent text-white/72 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] hover:text-white"
                        >
                          <Icon className="size-[15px]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#0d0f14] via-[#0f1117] to-[#111319]">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/[0.02] to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_52%)]" />
                    <div className="pointer-events-none absolute -bottom-6 right-10 hidden size-40 rounded-full bg-gradient-to-br from-white/[0.06] to-transparent blur-3xl xl:block" />
                  </div>
                </div>
              ) : mainPanelContent ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {mainPanelContent}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="max-w-xl text-muted-foreground">
                    <p className="text-sm">
                      {activeTab === "Image"
                        ? "Generated images will appear here."
                        : "Generated videos will appear here."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Add Tools Dialog */}
        {SHOW_PINNED_TOOLS ? (
          <AddToolsDialog
            isOpen={isAddToolsDialogOpen}
            onClose={() => setIsAddToolsDialogOpen(false)}
            allTools={allTools}
            pinnedToolUrls={pinnedToolUrls}
            onToggleTool={toggleTool}
            sidebarWidth={sidebarExpanded ? 200 : 64}
          />
        ) : null}
      </div>
    );
  }

  if (isReferenceTextToImage) {
    return (
      <section
        className={cn(
          "w-full bg-[#050505] px-4 pb-4 pt-[4.5rem] text-white sm:px-6 sm:pb-6 sm:pt-[5rem] xl:px-8",
          className,
        )}
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div className="mx-auto grid min-h-[calc(100dvh-6.5rem)] max-w-[1760px] grid-cols-1 gap-5 xl:grid-cols-[76px_minmax(460px,560px)_minmax(0,1fr)] xl:gap-6">
          <aside
            className={cn(
              "relative hidden overflow-hidden rounded-3xl xl:flex xl:min-h-0 xl:flex-col",
              WORKBENCH_PANEL_SURFACE_CLASS,
              WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
              entranceClass(),
            )}
            style={{ transitionDelay: pageReady ? "30ms" : "0ms" }}
          >
            <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
            <div className="relative z-10 flex justify-center px-3 pb-3 pt-4">
              <button
                type="button"
                onClick={() => setSidebarExpanded((prev) => !prev)}
                className="flex size-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] text-white/78 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
              >
                <PanelLeft
                  className={cn(
                    "size-4 transition-transform duration-300",
                    sidebarExpanded ? "rotate-180" : "rotate-0",
                  )}
                />
              </button>
            </div>

            <div className="relative z-10 px-3">
              <div className="h-px bg-white/8" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center gap-2 overflow-y-auto px-3 py-4">
              <button className="flex size-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.06] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <Wand2 className="size-4" />
              </button>

              {pinnedTools.slice(0, 5).map((tool, index) => {
                const tone = getTone(index);
                const label = getToolLabel(tool);
                const isActive = sceneContainsSlug(tool, selectedSlug);

                return (
                  <button
                    key={tool.url || label}
                    type="button"
                    onClick={() => handleToolClick(tool)}
                    title={label}
                    className={cn(
                      "flex size-11 items-center justify-center overflow-hidden rounded-[18px] border transition-all duration-200 hover:bg-white/[0.05]",
                      isActive
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-white/8 bg-transparent text-white/55",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
                        tone.surface,
                      )}
                    >
                      {toCdnUrl(tool.icon_url) ? (
                        <img
                          src={toCdnUrl(tool.icon_url)!}
                          alt={label}
                          className="block size-full rounded-full object-cover object-center"
                        />
                      ) : typeof tool.icon === "string" ? (
                        <SmartIcon
                          name={tool.icon}
                          className="size-5 text-white/82"
                        />
                      ) : (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/82">
                          {label
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 px-3 pb-4">
              <div className="flex flex-col items-center gap-2">
                <button className="flex size-11 items-center justify-center rounded-[18px] border border-white/8 bg-transparent text-white/50 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/82">
                  <Search className="size-4" />
                </button>
                <button className="flex size-11 items-center justify-center rounded-[18px] border border-white/8 bg-transparent text-white/50 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/82">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </aside>

          <aside
            className={cn(
              toolPanelContent
                ? "flex min-h-0 flex-col overflow-hidden"
                : "group flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.06)_14%,rgba(255,255,255,0.025)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)] backdrop-blur-sm transition-all duration-500 hover:border-white/24 hover:shadow-xl hover:shadow-black/30",
              entranceClass(),
            )}
            style={{ transitionDelay: pageReady ? "70ms" : "0ms" }}
          >
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                toolPanelContent ? "" : "px-5 pb-4 pt-4 sm:px-6 sm:pb-5",
              )}
            >
              {toolPanelContent ? (
                <div className="h-full">{toolPanelContent}</div>
              ) : (
                <>
                  <div className="border-b border-white/5 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                      {activeTab === "Image"
                        ? tc("panels.tools.titleImage")
                        : tc("panels.tools.titleVideo")}
                    </h2>
                  </div>
                  <div className="px-5 pb-4 pt-4 sm:px-6 sm:pb-5">
                    <div className="flex h-full min-h-[640px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] text-sm text-white/45">
                      {tc("panels.tools.empty")}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>

          <main
            className={cn(
              mainPanelContent
                ? "flex min-h-0 flex-col overflow-hidden"
                : "group flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.06)_14%,rgba(255,255,255,0.025)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)] backdrop-blur-sm transition-all duration-500 hover:border-white/24 hover:shadow-xl hover:shadow-black/30",
              entranceClass(),
            )}
            style={{ transitionDelay: pageReady ? "130ms" : "0ms" }}
          >
            {mainPanelContent ? (
              <div className="h-full w-full">{mainPanelContent}</div>
            ) : (
              <>
                <div className="border-b border-white/5 px-6 pb-4 pt-6 sm:px-7">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
                    {activeTab === "Video"
                      ? tc("panels.generated.titleVideos")
                      : tc("panels.generated.titleImages")}
                  </h2>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className="flex h-full min-h-[640px] flex-col items-center justify-center px-6 text-center sm:px-8">
                    <div className="max-w-xl text-white/55">
                      <p className="text-sm text-white/60">
                        {tc("generated.empty")}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </section>
    );
  }

  // reference-text-to-image variant 保持原有设计
  return (
    <section
      className={cn(
        "w-full bg-[#050505] px-0 pb-0 pt-[3.25rem] text-white sm:px-2.5 sm:pb-2.5 sm:pt-[4.5rem] lg:px-3 lg:pb-3 lg:pt-[5.25rem]",
        className,
      )}
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        className={cn(
          "grid min-h-[calc(100dvh-4.25rem)] grid-cols-1 gap-0 sm:gap-2.5 lg:h-[calc(100dvh-6.75rem)] lg:gap-3",
          sidebarExpanded
            ? "lg:grid-cols-[164px_308px_minmax(0,1fr)] xl:grid-cols-[176px_320px_minmax(0,1fr)]"
            : "lg:grid-cols-[64px_308px_minmax(0,1fr)] xl:grid-cols-[64px_320px_minmax(0,1fr)]",
        )}
      >
        <aside
          className={cn(
            "relative hidden min-h-0 flex-col rounded-[22px] py-3 lg:flex",
            WORKBENCH_PANEL_SURFACE_CLASS,
            WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
            entranceClass(),
            sidebarExpanded ? "px-2.5" : "px-1.5",
          )}
          style={{ transitionDelay: pageReady ? "40ms" : "0ms" }}
        >
          <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
          {/* Header with toggle */}
          <div
            className={cn(
              "relative z-10 flex items-center px-1",
              sidebarExpanded ? "gap-3" : "justify-center",
            )}
          >
            <button
              type="button"
              onClick={() => setSidebarExpanded((prev) => !prev)}
              className="group flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] border border-white/8 bg-white/[0.05] text-white/80 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] active:scale-[0.97] motion-reduce:transform-none"
            >
              <PanelLeft
                className={cn(
                  "size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  sidebarExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
            <div
              className={cn(
                "min-w-0 overflow-hidden transition-all duration-300",
                sidebarExpanded ? "block opacity-100" : "hidden opacity-0",
              )}
            >
              <p className="text-xs font-semibold tracking-tight text-white">
                joymagic
              </p>
              <p className="text-[9px] text-white/32">
                {tc("sidebar.subtitle")}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative z-10 mx-1 mt-3 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          {/* Main content */}
          <div className="relative z-10 mt-3 flex flex-1 flex-col overflow-hidden">
            {/* All Tools button */}
            <button
              className={cn(
                "group flex cursor-pointer rounded-[20px] px-1.5 py-1.5 text-left transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:bg-white/[0.04] motion-reduce:transform-none",
                sidebarExpanded ? "items-center gap-3" : "justify-center",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.06] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-all duration-200 group-hover:border-white/20 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.24)]">
                <Wand2 className="size-4" />
              </span>
              <div
                className={cn(
                  "min-w-0 overflow-hidden transition-all duration-300",
                  sidebarExpanded ? "block opacity-100" : "hidden opacity-0",
                )}
              >
                <p className="text-[12px] font-semibold leading-none text-white/84">
                  {tc("sidebar.allTools")}
                </p>
              </div>
            </button>

            {/* Pinned section label */}
            <div
              className={cn(
                "mt-4 items-center gap-2 px-2 text-[9px] uppercase tracking-[0.18em] text-white/24 transition-all duration-300",
                sidebarExpanded ? "flex opacity-100" : "hidden opacity-0",
              )}
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/8" />
              <span>{tc("sidebar.pinned")}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/8" />
            </div>

            {/* Tools list */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              {/* Add Tools button */}
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setIsShowSignModal(true);
                    return;
                  }
                  setIsAddToolsDialogOpen(true);
                }}
                className={cn(
                  "group flex w-full cursor-pointer rounded-[20px] px-1.5 py-1.5 text-left transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:bg-white/[0.04] motion-reduce:transform-none",
                  sidebarExpanded ? "items-center gap-2.5" : "justify-center",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/[0.03] text-white/82 transition-all duration-200 group-hover:border-white/30 group-hover:bg-white/[0.06]">
                  <Plus className="size-4.5" />
                </span>
                <div
                  className={cn(
                    "min-w-0 overflow-hidden transition-all duration-300",
                    sidebarExpanded ? "block opacity-100" : "hidden opacity-0",
                  )}
                >
                  <p className="text-[12px] font-medium leading-none text-white/48">
                    {tc("sidebar.addTools")}
                  </p>
                </div>
              </button>

              {/* Pinned tools */}
              <div className="mt-3 space-y-2">
                {pinnedTools.map((tool, index) => {
                  const tone = getTone(index);
                  const label = getToolLabel(tool);
                  const isActive = sceneContainsSlug(tool, selectedSlug);

                  return (
                    <button
                      key={tool.url || label}
                      type="button"
                      onClick={() => handleToolClick(tool)}
                      className={cn(
                        "group flex w-full cursor-pointer rounded-[20px] px-1.5 py-2 text-left transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none",
                        sidebarExpanded
                          ? "items-center gap-2.5"
                          : "justify-center",
                        isActive
                          ? "bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-[9px] font-semibold uppercase tracking-[0.08em] shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200",
                          tone.surface,
                          tone.accent,
                          isActive && "shadow-[0_6px_16px_rgba(0,0,0,0.2)]",
                        )}
                      >
                        {toCdnUrl(tool.icon_url) ? (
                          <img
                            src={toCdnUrl(tool.icon_url)!}
                            alt={label}
                            className="block size-full rounded-full object-cover object-center"
                          />
                        ) : typeof tool.icon === "string" ? (
                          <SmartIcon
                            name={tool.icon}
                            className="size-5 text-white/82"
                          />
                        ) : (
                          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/82">
                            {label
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part.charAt(0))
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div
                        className={cn(
                          "min-w-0 flex-1 overflow-hidden pr-0.5 transition-all duration-300",
                          sidebarExpanded
                            ? "block opacity-100"
                            : "hidden opacity-0",
                        )}
                      >
                        <p
                          className={cn(
                            "text-pretty whitespace-normal break-words text-[12px] font-medium leading-[1.22rem] tracking-[-0.01em] transition-colors duration-200",
                            isActive
                              ? "text-white"
                              : "text-white/48 group-hover:text-white/70",
                          )}
                        >
                          {label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <aside
          className={cn(
            "group relative order-2 flex min-h-0 flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] lg:order-none",
            WORKBENCH_PANEL_SURFACE_CLASS,
            WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
            entranceClass(),
          )}
          style={{ transitionDelay: pageReady ? "110ms" : "0ms" }}
        >
          <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
          <div className="relative z-10 flex items-center gap-2.5 border-b border-white/6 px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex size-8 items-center justify-center rounded-[18px] bg-white/8 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:size-9">
              {activeTab === "Image" ? (
                <ImageIcon className="size-4.5 sm:size-[18px]" />
              ) : (
                <Video className="size-4.5 sm:size-[18px]" />
              )}
            </div>
            <p className="text-sm font-semibold tracking-tight text-white sm:text-base">
              {activeTab}
            </p>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
            {toolPanelContent ? (
              <div className="h-full">{toolPanelContent}</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
                {currentTools.map((tool, index) => {
                  const tone = getTone(index);
                  const slug = getToolSlug(tool);
                  const label = getToolLabel(tool);
                  const isActive = slug === selectedSlug;
                  return (
                    <div
                      key={tool.url || label}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToolClick(tool)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleToolClick(tool);
                        }
                      }}
                      className={cn(
                        "group cursor-pointer overflow-hidden rounded-[16px] border text-left transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)] active:scale-[0.985] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] sm:rounded-[20px]",
                        isActive
                          ? "border-white/22 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_14px_36px_rgba(255,255,255,0.04)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <div
                        className={cn(
                          "relative h-24 overflow-hidden rounded-[14px] rounded-b-none bg-gradient-to-br sm:h-28 sm:rounded-[16px] lg:h-30",
                          tone.surface,
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br",
                            tone.glow,
                          )}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {toCdnUrl(tool.icon_url) ? (
                            <img
                              src={toCdnUrl(tool.icon_url)!}
                              alt={label}
                              className="block size-full rounded-full object-cover object-center"
                            />
                          ) : tool.icon && typeof tool.icon === "string" ? (
                            <SmartIcon
                              name={tool.icon}
                              className="size-7 text-white/72 sm:size-8 lg:size-9"
                            />
                          ) : (
                            <ImageIcon className="size-7 text-white/72 sm:size-8 lg:size-9" />
                          )}
                        </div>
                      </div>

                      <div className="px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3 sm:pt-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3
                            className={cn(
                              "line-clamp-2 text-[12px] font-bold tracking-tight sm:text-[13px]",
                              isActive ? "text-white" : "text-white",
                            )}
                          >
                            {label}
                          </h3>
                        </div>
                        {tool.badge ? (
                          <span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[9px] font-medium text-white/65 sm:text-[10px]">
                            {tool.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative z-10 border-t border-white/6 px-3 py-3 sm:px-4 sm:py-4">
            <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-1.5 sm:rounded-[22px] sm:p-2">
              <Link
                href="/create/image"
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center justify-center rounded-[16px] px-3 transition-all duration-200 sm:h-11 sm:rounded-[18px]",
                  activeTab === "Image"
                    ? "bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                )}
              >
                <div className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]">
                  <ImageIcon className="size-4 sm:size-[18px]" />
                  Image
                </div>
              </Link>
              <Link
                href="/create/video"
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center justify-center rounded-[16px] px-3 transition-all duration-200 sm:h-11 sm:rounded-[18px]",
                  activeTab === "Video"
                    ? "bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                )}
              >
                <div className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]">
                  <Video className="size-4 sm:size-[18px]" />
                  Video
                </div>
              </Link>
            </div>
          </div>
        </aside>

        <main
          className={cn(
            "group order-1 relative min-h-[360px] overflow-hidden rounded-[24px] sm:min-h-[420px] sm:rounded-[28px] lg:order-none lg:min-h-0",
            WORKBENCH_PANEL_SURFACE_CLASS,
            WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
            entranceClass(),
          )}
          style={{ transitionDelay: pageReady ? "180ms" : "0ms" }}
        >
          <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
          {mainPanelContent ? (
            <div className="relative z-10 h-full">{mainPanelContent}</div>
          ) : (
            <div className="relative z-10 h-full overflow-hidden">
              <GeneratedMediaEmptyState
                mediaType={activeTab === "Video" ? "video" : "image"}
                title={
                  selectedTool
                    ? getToolLabel(selectedTool)
                    : activeTab === "Video"
                      ? "Free AI Video Creation"
                      : "Free AI Image Creation"
                }
                description={
                  selectedTool
                    ? selectedTool.description ||
                      "Open this workspace to access presets, generation controls, and a focused creation flow."
                    : activeTab === "Video"
                      ? "Create cinematic AI videos from prompts, images, and motion presets. Explore model workflows and start directing motion in seconds."
                      : "Generate stunning visuals from simple prompts with powerful AI models. Explore image workflows and start creating polished artwork in seconds."
                }
                chips={currentTools
                  .slice(0, 6)
                  .map((tool) => getToolLabel(tool))}
                previewItems={(galleryPreviewTools.length > 0
                  ? galleryPreviewTools
                  : currentTools.slice(0, 3)
                ).map((tool) => ({
                  label: getToolLabel(tool),
                  iconUrl: tool.icon_url,
                }))}
              />
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
