"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Coins,
  Crown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/core/i18n/navigation";
import {
  BrandLogo,
  LocaleSelector,
  SignUser,
  SmartIcon,
  ThemeToggler,
} from "@/shared/blocks/common";
import { LazyImage } from "@/shared/blocks/common/lazy-image";
import { PricingPrompt } from "@/shared/blocks/payment/pricing-prompt";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { useMedia } from "@/shared/hooks/use-media";
import { useAppContext } from "@/shared/contexts/app";
import { toCdnUrl, withOssImageResize } from "@/shared/lib/cdn";
import { getSiteLogoUrl } from "@/shared/lib/site-logo";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { getImageEffectItemsSync } from "@/shared/lib/image-effect-data";
import { getVideoEffectItemsSync } from "@/shared/lib/video-effect-data";
import { isHiddenAiScene } from "@/shared/lib/ai-scene-nav";
import { cn } from "@/shared/lib/utils";
import { isCreemReviewMode } from "@/shared/lib/creem-review";
import { NavItem } from "@/shared/types/blocks/common";
import { Header as HeaderType } from "@/shared/types/blocks/landing";
import {
  getStudioSidebarSectionKey,
  getStudioSidebarPrimarySectionMeta,
  getStudioSidebarSectionData,
} from "@/themes/default/blocks/home-sidebar";

export function Header({
  header,
  mobileLegacyHref = "/?layout=legacy",
  mobileV2Href = "/?layout=v2",
  showDesktopNav = true,
  workspaceMode = false,
}: {
  header: HeaderType;
  mobileLegacyHref?: string;
  mobileV2Href?: string;
  showDesktopNav?: boolean;
  workspaceMode?: boolean;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [mangoOpenMenu, setMangoOpenMenu] = useState<string | null>(null);
  const [desktopDropdownTop, setDesktopDropdownTop] = useState(72);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const headerSurfaceRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const logoLeftRef = useRef<number | null>(null);
  const isLarge = useMedia("(min-width: 64rem)");
  const pathname = usePathname();
  const [signInHref, setSignInHref] = useState("/sign-in");
  const { user } = useAppContext();
  const tAiEffect = useTranslations("landing.ai-effect");
  const tImageEffects = useTranslations("landing.image-effects");
  const tVideoEffects = useTranslations("landing.video-effects");
  const tSidebar = useTranslations("landing.sidebarStudio");
  const studioSidebarSections = getStudioSidebarSectionData(tSidebar);
  const studioSidebarPrimaryMeta = getStudioSidebarPrimarySectionMeta(tSidebar);

  const isHardcodedBlogHref = (href: string) =>
    href === "/blog" || href.startsWith("/blog/");

  const hiddenNavUrls = new Set<string>(["/ai-girl", "/affiliate"]);
  if (isCreemReviewMode()) {
    hiddenNavUrls.add("/video-face-swap");
    hiddenNavUrls.add("/ai-clothes-remover");
    hiddenNavUrls.add("/tool/video-effect/ai-bikini");
  }
  const filterHiddenNavItems = (items?: NavItem[]) => {
    if (!items || items.length === 0) return items;
    return items
      .filter(
        (item) => !hiddenNavUrls.has(item?.url || "") && !isHiddenAiScene(item),
      )
      .map((item) => {
        if (
          !item ||
          !Array.isArray(item.children) ||
          item.children.length === 0
        ) {
          return item;
        }
        const filteredChildren = item.children.filter(
          (child) =>
            !hiddenNavUrls.has(child?.url || "") && !isHiddenAiScene(child),
        );
        if (filteredChildren.length === item.children.length) return item;
        return {
          ...item,
          children: filteredChildren,
        };
      });
  };

  type MangoMenuItem = {
    title: string;
    url: string;
    icon: string;
    iconUrl?: string;
    badge?: string;
  };
  type MangoMenuSection = {
    title: string;
    url?: string;
    icon?: string;
    items: MangoMenuItem[];
    columns?: number;
  };
  type MangoMenuGroup = {
    title: string;
    panelWidth: number;
    columns: number;
    badge?: string;
    items?: MangoMenuItem[];
    sections?: MangoMenuSection[];
  };

  const imageEffectHeaderItems: NavItem[] = getImageEffectItemsSync(
    tImageEffects.raw("titles") as Record<string, string>,
  ).map((item) => ({
    title: item.title,
    url: `/tool/image-effect/${encodeURIComponent(item.slug)}`,
    icon: "Sparkles",
    icon_url: item.posterUrl || item.coverUrl,
  }));

  const videoEffectHeaderItems: NavItem[] = getVideoEffectItemsSync(
    tVideoEffects.raw("titles") as Record<string, string>,
  ).map((item) => ({
    title: item.title,
    url: `/tool/video-effect/${encodeURIComponent(item.slug)}`,
    icon: "Clapperboard",
    icon_url: item.coverUrl || item.sourceImageUrl,
  }));

  const augmentAiEffectNavItems = (items?: NavItem[]) => {
    if (!items || items.length === 0) return items;

    const expandedItems = items.flatMap((item) => {
      const hasAiEffectChildren =
        Array.isArray(item.children) &&
        item.children.some((child) => child.url === "/image-effect") &&
        item.children.some((child) => child.url === "/video-effect");

      if (!hasAiEffectChildren) {
        return [item];
      }

      return [
        {
          ...item,
          title: tAiEffect("tabs.image"),
          icon: "Image",
          children: [
            {
              title: tAiEffect("tabs.image"),
              url: "/tool/image-effect",
              icon: "Image",
            },
            ...imageEffectHeaderItems,
          ],
        },
        {
          ...item,
          title: tAiEffect("tabs.video"),
          icon: "Clapperboard",
          children: [
            {
              title: tAiEffect("tabs.video"),
              url: "/tool/video-effect",
              icon: "Clapperboard",
            },
            ...videoEffectHeaderItems,
          ],
        },
      ];
    });

    return expandedItems.map((item) => {
      if (
        item.title !== tAiEffect("tabs.image") &&
        item.title !== tAiEffect("tabs.video")
      ) {
        return item;
      }

      if (!Array.isArray(item.children)) {
        return item;
      }

      const [overviewItem, ...effectItems] = item.children;

      return {
        ...item,
        children: [
          {
            ...overviewItem,
            children: effectItems,
          },
        ],
      };
    });
  };

  const baseNavItems = filterHiddenNavItems(
    augmentAiEffectNavItems(header.nav?.items),
  );
  const navItems = baseNavItems;
  const useMangoHeader =
    !workspaceMode &&
    (pathname === "/" ||
      pathname === "/pricing" ||
      [
        "/about",
        "/contact",
        "/business-model",
        "/terms-of-service",
        "/privacy-policy",
        "/refund-policy",
        "/acceptable-use-policy",
        "/content-moderation-policy",
        "/ai-wrapper-disclaimer",
        "/open-source-attribution",
      ].includes(pathname) ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/") ||
      pathname === "/activity" ||
      pathname.startsWith("/activity/") ||
      pathname.startsWith("/model") ||
      pathname.startsWith("/tools") ||
      pathname.startsWith("/tool") ||
      pathname === "/ai-effect" ||
      pathname.startsWith("/ai-effect/"));
  const mangoMenuGroups: MangoMenuGroup[] = [
    {
      title: "AI Video",
      panelWidth: 460,
      columns: 1,
      items: studioSidebarSections.video.map((item) => ({
        title: item.title,
        url: item.url,
        icon: item.icon || "Clapperboard",
      })),
    },
    {
      title: tAiEffect("tabs.image"),
      panelWidth: 1180,
      columns: 3,
      badge: "NEW",
      items: imageEffectHeaderItems.map((item) => ({
        title: item.title || "",
        url: item.url || "#",
        icon: "Sparkles",
        iconUrl: item.icon_url,
      })),
    },
    {
      title: tAiEffect("tabs.video"),
      panelWidth: 1180,
      columns: 3,
      badge: "NEW",
      items: videoEffectHeaderItems.map((item) => ({
        title: item.title || "",
        url: item.url || "#",
        icon: "Clapperboard",
        iconUrl: item.icon_url,
      })),
    },
    {
      title: "AI Photo",
      panelWidth: 460,
      columns: 1,
      items: studioSidebarSections.image.map((item) => ({
        title: item.title,
        url: item.url,
        icon: item.icon || "Image",
      })),
    },
  ] as const;
  const mangoNavItems = [
    ...mangoMenuGroups.map((group) => ({
      title: group.title,
      url: "#",
      hasMenu: true,
    })),
    { title: "Pricing", url: "/pricing", hasMenu: false },
  ];

  // Check if any child menu item is active
  const isChildActive = (item: NavItem): boolean => {
    if (!item.children || item.children.length === 0) return false;
    return item.children.some((child) => {
      if (child.url && pathname.startsWith(child.url)) return true;
      if (child.children) {
        return child.children.some(
          (nestedChild) =>
            nestedChild.url && pathname.startsWith(nestedChild.url),
        );
      }
      return false;
    });
  };

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setSignInHref(
      `/sign-in?callbackUrl=${encodeURIComponent(currentUrl || "/")}`,
    );
  }, [pathname]);

  useEffect(() => {
    // Listen to scroll event to enable header styles on scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !workspaceMode) return;

    const syncState = (collapsed: boolean) => {
      setIsSidebarCollapsed(collapsed);
    };

    const saved = window.localStorage.getItem("workspace-sidebar-collapsed");
    syncState(saved === "true");

    const handleSidebarState = (event: Event) => {
      syncState(
        Boolean(
          (event as CustomEvent<{ collapsed?: boolean }>).detail?.collapsed,
        ),
      );
    };

    window.addEventListener("workspace-sidebar-state", handleSidebarState);
    return () => {
      window.removeEventListener("workspace-sidebar-state", handleSidebarState);
    };
  }, [workspaceMode]);

  useEffect(() => {
    setMangoOpenMenu(null);
  }, [pathname]);

  // 防止移动端菜单打开时背景滚动
  useEffect(() => {
    if (isMobileMenuOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      // 禁止背景滚动
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // 恢复滚动 - 使用 requestAnimationFrame 避免闪烁
        const restore = () => {
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.width = "";
          document.body.style.overflow = "";
          window.scrollTo(0, scrollY);
        };
        requestAnimationFrame(restore);
      };
    }
  }, [isMobileMenuOpen]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex === null) return;

      const target = event.target as Node;
      const menuElement = menuRefs.current[openMenuIndex];
      const buttonElement = buttonRefs.current[openMenuIndex];
      const navItemElement = navItemRefs.current[openMenuIndex];

      // Check if click is outside menu and button
      if (
        menuElement &&
        buttonElement &&
        navItemElement &&
        !menuElement.contains(target) &&
        !buttonElement.contains(target) &&
        !navItemElement.contains(target)
      ) {
        setOpenMenuIndex(null);
      }
    };

    if (openMenuIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuIndex]);

  // 计算 logo 的位置
  const calculateLogoPosition = () => {
    if (isLarge && logoRef.current && logoLeftRef.current === null) {
      // 使用 requestAnimationFrame 批处理布局读取，避免强制重排
      requestAnimationFrame(() => {
        if (!logoRef.current) return;
        const logoRect = logoRef.current.getBoundingClientRect();
        // 获取导航容器（ul）
        const navContainer = navItemRefs.current[0]?.parentElement;
        if (navContainer) {
          const containerRect = navContainer.getBoundingClientRect();
          // 计算 logo 相对于导航容器的左侧位置
          logoLeftRef.current = logoRect.left - containerRect.left;
        }
      });
    }
  };

  // Handle menu toggle on click
  const handleMenuToggle = (index: number) => {
    // 计算 logo 的位置（如果还没有计算）
    calculateLogoPosition();
    // Toggle menu: if clicking the same menu, close it; otherwise open the new one
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  useEffect(() => {
    if (openMenuIndex === null) return;

    const updateDropdownPosition = () => {
      const headerSurface = headerSurfaceRef.current;
      if (!headerSurface) return;
      const headerRect = headerSurface.getBoundingClientRect();

      setDesktopDropdownTop(Math.round(headerRect.bottom + 1));
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, {
      passive: true,
    });
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [openMenuIndex]);

  // Custom menu item component
  const CustomMenuItem = ({
    href,
    title,
    description,
    icon,
    icon_url,
    badge,
    onItemClick,
  }: {
    href: string;
    title: string;
    description?: string;
    icon?: string;
    icon_url?: string;
    badge?: string;
    onItemClick?: () => void;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    const resolvedIconUrl =
      getModelVendorLogo({ url: href, title }).url || toCdnUrl(icon_url);

    return (
      <li>
        {isHardcodedBlogHref(href) ? (
          <NextLink
            href={href}
            onClick={onItemClick}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
              "bg-white/70 dark:bg-slate-800/70 backdrop-blur-md",
              "border-slate-200/70 dark:border-white/[0.08]",
              "hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:border-slate-300 dark:hover:border-white/20 hover:-translate-y-1 hover:scale-[1.02]",
              isActive
                ? "border-primary/40 bg-primary/[0.08] dark:bg-primary/[0.15] shadow-lg shadow-primary/10"
                : "",
            )}
          >
            <div className="flex items-start gap-3">
              {(resolvedIconUrl || icon) && (
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700/80 dark:to-slate-700/60 ring-slate-200 dark:ring-white/[0.08] relative flex size-11 flex-shrink-0 items-center justify-center rounded-xl border border-transparent ring-1 transition-all duration-200 group-hover:from-slate-200 group-hover:to-slate-100 dark:group-hover:from-slate-600/90 dark:group-hover:to-slate-600/70 group-hover:ring-slate-300 dark:group-hover:ring-white/20 group-hover:shadow-md">
                  {resolvedIconUrl ? (
                    <img
                      src={resolvedIconUrl}
                      alt={title}
                      className="h-7 w-7 object-contain"
                    />
                  ) : icon ? (
                    <SmartIcon name={icon} className="h-5 w-5" />
                  ) : null}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-slate-900 dark:text-slate-100",
                    )}
                  >
                    {title}
                  </div>
                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/30">
                      {badge}
                    </span>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </NextLink>
        ) : (
          <Link
            href={href}
            onClick={onItemClick}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
              "bg-white/70 dark:bg-slate-800/70 backdrop-blur-md",
              "border-slate-200/70 dark:border-white/[0.08]",
              "hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:border-slate-300 dark:hover:border-white/20 hover:-translate-y-1 hover:scale-[1.02]",
              isActive
                ? "border-primary/40 bg-primary/[0.08] dark:bg-primary/[0.15] shadow-lg shadow-primary/10"
                : "",
            )}
          >
            <div className="flex items-start gap-3">
              {(resolvedIconUrl || icon) && (
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700/80 dark:to-slate-700/60 ring-slate-200 dark:ring-white/[0.08] relative flex size-11 flex-shrink-0 items-center justify-center rounded-xl border border-transparent ring-1 transition-all duration-200 group-hover:from-slate-200 group-hover:to-slate-100 dark:group-hover:from-slate-600/90 dark:group-hover:to-slate-600/70 group-hover:ring-slate-300 dark:group-hover:ring-white/20 group-hover:shadow-md">
                  {resolvedIconUrl ? (
                    <img
                      src={resolvedIconUrl}
                      alt={title}
                      className="h-7 w-7 object-contain"
                    />
                  ) : icon ? (
                    <SmartIcon name={icon} className="h-5 w-5" />
                  ) : null}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-slate-900 dark:text-slate-100",
                    )}
                  >
                    {title}
                  </div>
                  {badge && (
                    <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/30">
                      {badge}
                    </span>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}
      </li>
    );
  };

  const renderDesktopDropdown = (item: NavItem, idx: number) => {
    const hasNestedChildren = item.children?.some(
      (subItem) => subItem.children && subItem.children.length > 0,
    );

    const nestedItems: NavItem[] = [];
    const regularItems: NavItem[] = [];

    item.children?.forEach((subItem) => {
      if (subItem.children && subItem.children.length > 0) {
        nestedItems.push(subItem);
      } else if (subItem.url) {
        regularItems.push(subItem);
      }
    });

    const dropdown = (
      <div
        ref={(el) => {
          menuRefs.current[idx] = el;
        }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[1001] animate-in fade-in slide-in-from-top-2 duration-200",
          "overflow-y-auto border-t border-white/10 bg-[rgba(11,11,14,0.96)] shadow-[0_28px_90px_-28px_rgba(0,0,0,0.72)] backdrop-blur-2xl",
        )}
        style={{
          top: desktopDropdownTop,
        }}
      >
        <div className="container mx-auto max-w-[1600px] px-6 py-5 xl:px-8">
          {hasNestedChildren ? (
            <div className="space-y-4">
              {regularItems.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {regularItems.map((subItem: NavItem, iidx) => (
                    <CustomMenuItem
                      key={iidx}
                      href={subItem.url || ""}
                      title={subItem.title || ""}
                      description={subItem.description || ""}
                      icon={subItem.icon as string | undefined}
                      icon_url={subItem.icon_url}
                      badge={subItem.badge}
                      onItemClick={() => setOpenMenuIndex(null)}
                    />
                  ))}
                </ul>
              ) : null}
              {nestedItems.length > 0 ? (
                <div className="space-y-3">
                  {nestedItems.map((subItem: NavItem, iidx) => (
                    <section
                      key={iidx}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <div className="mb-3 flex items-center gap-2.5 px-1">
                        {subItem.icon ? (
                          <div className="flex size-6 items-center justify-center rounded-lg bg-white/[0.08] text-white/80">
                            <SmartIcon
                              name={subItem.icon as string}
                              className="h-3.5 w-3.5"
                            />
                          </div>
                        ) : null}
                        <h3 className="text-sm font-semibold text-white/92">
                          {subItem.title}
                        </h3>
                      </div>
                      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {subItem.children?.map(
                          (nestedItem: NavItem, nestedIdx) => (
                            <CustomMenuItem
                              key={nestedIdx}
                              href={nestedItem.url || ""}
                              title={nestedItem.title || ""}
                              description={nestedItem.description || ""}
                              icon={nestedItem.icon as string | undefined}
                              icon_url={nestedItem.icon_url}
                              badge={nestedItem.badge}
                              onItemClick={() => setOpenMenuIndex(null)}
                            />
                          ),
                        )}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-5">
              {item.children?.map((subItem: NavItem, iidx) => (
                <CustomMenuItem
                  key={iidx}
                  href={subItem.url || ""}
                  title={subItem.title || ""}
                  description={subItem.description || ""}
                  icon={subItem.icon as string | undefined}
                  icon_url={subItem.icon_url}
                  badge={subItem.badge}
                  onItemClick={() => setOpenMenuIndex(null)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    );

    if (typeof document === "undefined") {
      return null;
    }

    return createPortal(dropdown, document.body);
  };

  const getMobileStudioSectionKey = (item: NavItem) => {
    return getStudioSidebarSectionKey(item, studioSidebarPrimaryMeta);
  };

  const getMobileStudioSectionItems = (item: NavItem) => {
    const key = getMobileStudioSectionKey(item);
    return key ? studioSidebarSections[key] : null;
  };

  const getMobileStudioSectionMeta = (item: NavItem) => {
    const key = getMobileStudioSectionKey(item);
    return key ? studioSidebarPrimaryMeta[key] : null;
  };

  // Navigation menu for large screens - Custom implementation
  const NavMenu = () => {
    return (
      <nav className="max-lg:hidden">
        <ul className="flex items-center gap-3">
          {navItems?.map((item, idx) => (
            <li
              key={idx}
              ref={(el) => {
                navItemRefs.current[idx] = el;
              }}
              className="relative"
            >
              {item.children && item.children.length > 0 ? (
                <>
                  <button
                    ref={(el) => {
                      buttonRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => handleMenuToggle(idx)}
                    className={cn(
                      "flex flex-row items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all duration-200 font-medium cursor-pointer",
                      item.is_active ||
                        isChildActive(item) ||
                        openMenuIndex === idx
                        ? "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
                    )}
                  >
                    {item.icon && (
                      <SmartIcon
                        name={item.icon as string}
                        className="h-4 w-4"
                      />
                    )}
                    {item.title}
                    <svg
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        openMenuIndex === idx && "rotate-180",
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openMenuIndex === idx
                    ? renderDesktopDropdown(item, idx)
                    : null}
                </>
              ) : (
                <Link
                  href={item.url || "#"}
                  className={cn(
                    "flex flex-row items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all duration-200 font-medium cursor-pointer",
                    item.is_active || pathname === item.url
                      ? "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
                  )}
                >
                  {item.icon && (
                    <SmartIcon name={item.icon as string} className="h-4 w-4" />
                  )}
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    );
  };

  // Mobile menu using Accordion, shown on small screens
  const MobileMenu = ({ closeMenu }: { closeMenu: () => void }) => {
    const isMangoMobileMenu = useMangoHeader;
    const isMangoEffectMenuTitle = (title?: string | null) =>
      title === tAiEffect("tabs.image") || title === tAiEffect("tabs.video");
    const mobileMangoEffectItems: NavItem[] = [
      {
        title: tAiEffect("tabs.image"),
        icon: "Image",
        children: [
          {
            title: tAiEffect("tabs.image"),
            url: "/tool/image-effect",
            icon: "Image",
          },
          ...imageEffectHeaderItems,
        ],
      },
      {
        title: tAiEffect("tabs.video"),
        icon: "Clapperboard",
        children: [
          {
            title: tAiEffect("tabs.video"),
            url: "/tool/video-effect",
            icon: "Clapperboard",
          },
          ...videoEffectHeaderItems,
        ],
      },
    ];
    const mobileNavItems = isMangoMobileMenu
      ? [
          ...(navItems?.filter((item) => {
            if (isHardcodedBlogHref(item.url || "")) {
              return false;
            }
            return getMobileStudioSectionKey(item) !== "effects";
          }) || []),
          ...mobileMangoEffectItems,
        ]
      : navItems;

    return (
      <nav
        role="navigation"
        className="w-full [--color-border:--alpha(var(--color-foreground)/5%)] [--color-muted:--alpha(var(--color-foreground)/5%)]"
      >
        <Accordion
          type="single"
          collapsible
          className="space-y-1 **:hover:no-underline"
        >
          {mobileNavItems?.map((item, idx) => {
            const shouldUseStudioSectionMapping = !(
              isMangoMobileMenu && isMangoEffectMenuTitle(item.title)
            );
            const studioSectionMeta = shouldUseStudioSectionMapping
              ? getMobileStudioSectionMeta(item)
              : null;
            const studioSectionItems = shouldUseStudioSectionMapping
              ? getMobileStudioSectionItems(item)
              : null;
            const mobileItemTitle = studioSectionMeta?.title || item.title;
            const mobileItemIcon = studioSectionMeta?.icon || item.icon;

            return (
              <AccordionItem
                key={idx}
                value={mobileItemTitle || ""}
                className="group relative border-b-0 overflow-hidden rounded-xl"
              >
                {item.children && item.children.length > 0 ? (
                  <>
                    <AccordionTrigger
                      className={cn(
                        "flex items-center justify-between px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 **:!font-semibold",
                        isMangoMobileMenu
                          ? "text-black hover:bg-black/[0.04] data-[state=open]:bg-[#f6f7f8] data-[state=open]:shadow-none"
                          : "hover:bg-slate-100/90 dark:hover:bg-white/[0.06] data-[state=open]:bg-white/[0.05] data-[state=open]:shadow-sm",
                        !isMangoMobileMenu &&
                          (item.is_active || isChildActive(item)
                            ? "bg-slate-100/80 text-slate-900 dark:bg-white/[0.08] dark:text-white"
                            : "text-slate-700 dark:text-slate-200"),
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {mobileItemIcon ? (
                          <SmartIcon
                            name={mobileItemIcon as string}
                            className="size-4.5"
                          />
                        ) : null}
                        <span>{mobileItemTitle}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-1 animate-in slide-in-from-top-2 duration-200 motion-reduce:animate-none">
                      {(() => {
                        if (studioSectionItems) {
                          return (
                            <ul className="space-y-0.5 px-2">
                              {studioSectionItems.map((subItem, iidx) => (
                                <li
                                  key={`${subItem.url}-${subItem.title}-${iidx}`}
                                >
                                  <Link
                                    href={subItem.url || ""}
                                    onClick={closeMenu}
                                    className={cn(
                                      "grid grid-cols-[auto_1fr] items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer",
                                      isMangoMobileMenu
                                        ? "hover:bg-[#f6f7f8]"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5",
                                    )}
                                  >
                                    <div
                                      aria-hidden
                                      className={cn(
                                        "flex items-center justify-center *:size-4",
                                        isMangoMobileMenu
                                          ? "text-black/55"
                                          : "text-slate-500 dark:text-slate-400",
                                      )}
                                    >
                                      {(() => {
                                        const logo = getModelVendorLogo({
                                          url: subItem.url,
                                          title: subItem.title,
                                        });

                                        return logo?.url ? (
                                          <img
                                            src={logo.url}
                                            alt={subItem.title || ""}
                                            className={cn(
                                              "size-4 object-contain",
                                              isMangoMobileMenu &&
                                                "brightness-0 opacity-75",
                                            )}
                                          />
                                        ) : subItem.icon ? (
                                          <SmartIcon
                                            name={subItem.icon as string}
                                          />
                                        ) : null;
                                      })()}
                                    </div>
                                    <div
                                      className={cn(
                                        "text-sm font-medium",
                                        isMangoMobileMenu
                                          ? "text-black"
                                          : "text-slate-700 dark:text-slate-200",
                                      )}
                                    >
                                      {subItem.title}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        // 检查是否有嵌套的 children（子项有 children）
                        const hasNestedChildren = item.children?.some(
                          (subItem) =>
                            subItem.children && subItem.children.length > 0,
                        );

                        if (hasNestedChildren) {
                          // 有嵌套 children，按嵌套结构组织，使用嵌套 Accordion
                          const nestedItems: NavItem[] = [];
                          const regularItems: NavItem[] = [];

                          item.children?.forEach((subItem) => {
                            if (
                              subItem.children &&
                              subItem.children.length > 0
                            ) {
                              nestedItems.push(subItem);
                            } else if (subItem.url) {
                              regularItems.push(subItem);
                            }
                          });

                          return (
                            <div className="space-y-2 px-2">
                              {/* 嵌套项使用 Accordion */}
                              {nestedItems.length > 0 && (
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="space-y-1"
                                >
                                  {nestedItems.map((subItem: NavItem, iidx) => (
                                    <AccordionItem
                                      key={iidx}
                                      value={`nested-${iidx}`}
                                      className="border-none rounded-lg overflow-hidden"
                                    >
                                      <AccordionTrigger
                                        className={cn(
                                          "px-4 py-3.5 text-sm font-semibold rounded-xl hover:no-underline transition-all duration-200",
                                          isMangoMobileMenu
                                            ? "bg-[#f6f7f8] text-black hover:bg-[#eef0f2] data-[state=open]:bg-[#eef0f2]"
                                            : "text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-white/[0.1]",
                                        )}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          {subItem.icon && (
                                            <SmartIcon
                                              name={subItem.icon as string}
                                              className="size-4.5"
                                            />
                                          )}
                                          <span>{subItem.title}</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pb-2 pt-1">
                                        <ul className="space-y-0.5">
                                          {subItem.children?.map(
                                            (
                                              nestedItem: NavItem,
                                              nestedIdx,
                                            ) => (
                                              <li key={nestedIdx}>
                                                <Link
                                                  href={nestedItem.url || ""}
                                                  onClick={closeMenu}
                                                  className={cn(
                                                    "grid grid-cols-[auto_1fr] items-center gap-2.5 px-4 py-2.5 pl-10 rounded-lg transition-colors duration-200 cursor-pointer",
                                                    isMangoMobileMenu
                                                      ? "hover:bg-[#f6f7f8]"
                                                      : "hover:bg-slate-50 dark:hover:bg-white/5",
                                                  )}
                                                >
                                                  <div
                                                    aria-hidden
                                                    className={cn(
                                                      "flex items-center justify-center *:size-5 transition-colors",
                                                      isMangoMobileMenu
                                                        ? "text-black/50 group-hover:text-black/75"
                                                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
                                                    )}
                                                  >
                                                    {(() => {
                                                      const logo =
                                                        getModelVendorLogo({
                                                          url: nestedItem.url,
                                                          title:
                                                            nestedItem.title,
                                                        });
                                                      return logo?.url ? (
                                                        <img
                                                          src={logo.url}
                                                          alt={
                                                            nestedItem.title ||
                                                            ""
                                                          }
                                                          className={cn(
                                                            "size-5 object-contain",
                                                            isMangoMobileMenu &&
                                                              "brightness-0 opacity-75",
                                                          )}
                                                        />
                                                      ) : nestedItem.icon ? (
                                                        <SmartIcon
                                                          name={
                                                            nestedItem.icon as string
                                                          }
                                                        />
                                                      ) : null;
                                                    })()}
                                                  </div>
                                                  <div
                                                    className={cn(
                                                      "text-sm font-medium transition-colors",
                                                      isMangoMobileMenu
                                                        ? "text-black group-hover:text-black"
                                                        : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white",
                                                    )}
                                                  >
                                                    {nestedItem.title}
                                                  </div>
                                                </Link>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              )}
                              {/* 普通项 */}
                              {regularItems.length > 0 && (
                                <ul className="space-y-0.5">
                                  {regularItems.map(
                                    (subItem: NavItem, iidx) => (
                                      <li key={iidx}>
                                        <Link
                                          href={subItem.url || ""}
                                          onClick={closeMenu}
                                          className={cn(
                                            "grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                                            isMangoMobileMenu
                                              ? "hover:bg-[#f6f7f8]"
                                              : "hover:bg-slate-50 dark:hover:bg-white/[0.06]",
                                          )}
                                        >
                                          <div
                                            aria-hidden
                                            className={cn(
                                              "flex items-center justify-center *:size-4",
                                              isMangoMobileMenu
                                                ? "text-black/55"
                                                : "text-slate-500 dark:text-slate-400",
                                            )}
                                          >
                                            {(() => {
                                              const logo = getModelVendorLogo({
                                                url: subItem.url,
                                                title: subItem.title,
                                              });
                                              return logo?.url ? (
                                                <img
                                                  src={logo.url}
                                                  alt={subItem.title || ""}
                                                  className={cn(
                                                    "size-4 object-contain",
                                                    isMangoMobileMenu &&
                                                      "brightness-0 opacity-75",
                                                  )}
                                                />
                                              ) : subItem.icon ? (
                                                <SmartIcon
                                                  name={subItem.icon as string}
                                                />
                                              ) : null;
                                            })()}
                                          </div>
                                          <div
                                            className={cn(
                                              "text-sm font-medium",
                                              isMangoMobileMenu
                                                ? "text-black"
                                                : "text-slate-700 dark:text-slate-200",
                                            )}
                                          >
                                            {subItem.title}
                                          </div>
                                        </Link>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        } else {
                          // 无嵌套 children，使用原来的布局
                          return (
                            <ul className="space-y-0.5 px-2">
                              {item.children?.map((subItem: NavItem, iidx) => (
                                <li key={iidx}>
                                  <Link
                                    href={subItem.url || ""}
                                    onClick={closeMenu}
                                    className={cn(
                                      "grid grid-cols-[auto_1fr] items-center gap-2.5 px-4 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer",
                                      isMangoMobileMenu
                                        ? "hover:bg-[#f6f7f8]"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5",
                                    )}
                                  >
                                    <div
                                      aria-hidden
                                      className={cn(
                                        "flex items-center justify-center *:size-4",
                                        isMangoMobileMenu
                                          ? "text-black/55"
                                          : "text-slate-500 dark:text-slate-400",
                                      )}
                                    >
                                      {(() => {
                                        const logo = getModelVendorLogo({
                                          url: subItem.url,
                                          title: subItem.title,
                                        });

                                        return logo?.url ? (
                                          <img
                                            src={logo.url}
                                            alt={subItem.title || ""}
                                            className={cn(
                                              "size-4 object-contain",
                                              isMangoMobileMenu &&
                                                "brightness-0 opacity-75",
                                            )}
                                          />
                                        ) : subItem.icon ? (
                                          <SmartIcon
                                            name={subItem.icon as string}
                                          />
                                        ) : null;
                                      })()}
                                    </div>
                                    <div
                                      className={cn(
                                        "text-sm font-medium",
                                        isMangoMobileMenu
                                          ? "text-black"
                                          : "text-slate-700 dark:text-slate-200",
                                      )}
                                    >
                                      {subItem.title}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      })()}
                    </AccordionContent>
                  </>
                ) : (
                  <>
                    {isHardcodedBlogHref(item.url || "") ? (
                      <NextLink
                        href={item.url || ""}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center justify-between px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer",
                          isMangoMobileMenu
                            ? "text-black hover:bg-black/[0.04]"
                            : "hover:bg-slate-100/90 dark:hover:bg-white/[0.06]",
                          !isMangoMobileMenu &&
                            (item.is_active || pathname === item.url
                              ? "bg-slate-100/80 text-slate-900 dark:bg-white/[0.08] dark:text-white"
                              : "text-slate-700 dark:text-slate-200"),
                        )}
                      >
                        {item.title}
                      </NextLink>
                    ) : (
                      <Link
                        href={item.url || ""}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center justify-between px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer",
                          isMangoMobileMenu
                            ? "text-black hover:bg-black/[0.04]"
                            : "hover:bg-slate-100/90 dark:hover:bg-white/[0.06]",
                          !isMangoMobileMenu &&
                            (item.is_active || pathname === item.url
                              ? "bg-slate-100/80 text-slate-900 dark:bg-white/[0.08] dark:text-white"
                              : "text-slate-700 dark:text-slate-200"),
                        )}
                      >
                        {item.title}
                      </Link>
                    )}
                  </>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
    );
  };

  const renderDesktopHeaderActions = () => (
    <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 in-data-[state=active]:flex max-lg:in-data-[state=active]:mt-6 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
      <div className="flex w-full flex-row items-center gap-4 sm:flex-row sm:gap-6 sm:space-y-0 md:w-fit">
        {header.show_locale ? (
          <LocaleSelector className="rounded-xl border border-white/10 bg-[#111214] px-3 text-[#f2f2f4] hover:bg-[#18191c]" />
        ) : null}
        <div className="flex-1 md:hidden"></div>
        {header.show_sign ? <SignUser userNav={header.user_nav} /> : null}

        {header.buttons &&
          header.buttons.map((button, idx) => (
            <Link
              key={idx}
              href={button.url || ""}
              target={button.target || "_self"}
              className={cn(
                "focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                "h-7 px-3 ring-0",
                button.variant === "outline"
                  ? "bg-background ring-foreground/10 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 border border-transparent shadow-sm ring-1 shadow-black/15 duration-200"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 border-[0.5px] border-white/25 shadow-md ring-1 shadow-black/20 ring-(--ring-color) [--ring-color:color-mix(in_oklab,var(--color-foreground)15%,var(--color-primary))]",
              )}
            >
              {button.icon && <SmartIcon name={button.icon as string} />}
              <span>{button.title}</span>
            </Link>
          ))}
      </div>
    </div>
  );

  const renderWorkspaceCredits = () => (
    <Link
      href={user ? "/settings/credits" : "/pricing"}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--color-frost-border)] bg-transparent px-4 text-sm font-medium text-white/82 transition hover:bg-white/[0.06] hover:text-white"
    >
      <Coins className="size-4 text-white/72" />
      <span className="tabular-nums">
        {user?.credits?.remainingCredits ?? 0} credits
      </span>
    </Link>
  );

  const renderWorkspaceHeaderActions = () => (
    <div className="flex items-center gap-2.5">
      <PricingPrompt autoPrompt={false}>
        {(openPricing) => (
          <button
            type="button"
            onClick={openPricing}
            className="group relative inline-flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-[color:var(--color-frost-border)] bg-white px-4 text-sm font-semibold tracking-[-0.015em] text-black shadow-[0_12px_32px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f4f4f4] hover:shadow-[0_16px_40px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.7)]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
            <Crown
              className="relative size-4 shrink-0 text-black"
              strokeWidth={2.2}
            />
            <span className="relative whitespace-nowrap leading-none">
              Prcing
            </span>
          </button>
        )}
      </PricingPrompt>

      {header.show_locale ? (
        <LocaleSelector
          type="icon"
          className="h-10 rounded-full border border-[color:var(--color-frost-border)] bg-transparent px-3 text-white/82 hover:bg-white/[0.06]"
        />
      ) : null}

      {renderWorkspaceCredits()}

      {header.show_sign ? (
        <SignUser
          userNav={header.user_nav}
          triggerClassName="h-10 w-10 rounded-full border border-[color:var(--color-frost-border)] bg-transparent"
          buttonClassName="h-10 rounded-full border border-[color:var(--color-frost-border)] bg-transparent px-4 text-white"
        />
      ) : null}
    </div>
  );

  const renderSidebarToggle = () => (
    <button
      type="button"
      onClick={() => {
        if (typeof window === "undefined") return;
        const nextCollapsed = !isSidebarCollapsed;
        window.localStorage.setItem(
          "workspace-sidebar-collapsed",
          String(nextCollapsed),
        );
        window.dispatchEvent(
          new CustomEvent("workspace-sidebar-set", {
            detail: { collapsed: nextCollapsed },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("workspace-sidebar-state", {
            detail: { collapsed: nextCollapsed },
          }),
        );
        setIsSidebarCollapsed(nextCollapsed);
      }}
      aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-pressed={isSidebarCollapsed}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-frost-border)] bg-transparent text-white/78 transition hover:bg-white/[0.06] hover:text-white"
    >
      {isSidebarCollapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
    </button>
  );

  const renderMobileHomeTopBar = () => (
    <div className="container relative z-[100] px-4">
      <div
        className={cn(
          "flex min-h-14 items-center justify-between gap-2 py-2.5",
          isMobileMenuOpen ? "border-b border-white/10 bg-[#050505]" : "",
        )}
      >
        <div className="flex min-w-0 shrink items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            className={cn(
              "relative z-20 flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95",
              "bg-[#18191c] text-[#f2f2f4] shadow-[0_14px_36px_-20px_rgba(0,0,0,0.7)] hover:bg-[#202125]",
            )}
          >
            <Menu className="m-auto size-4 transition-all duration-300 in-data-[state=active]:scale-0 in-data-[state=active]:rotate-180 in-data-[state=active]:opacity-0" />
            <X className="absolute inset-0 m-auto size-4 scale-0 -rotate-180 opacity-0 transition-all duration-300 in-data-[state=active]:scale-100 in-data-[state=active]:rotate-0 in-data-[state=active]:opacity-100" />
          </button>

          {header.brand ? (
            <Link
              href={header.brand.url || ""}
              target={header.brand.target || "_self"}
              className="flex min-w-0 max-w-[40vw] shrink items-center gap-1.5 text-white sm:max-w-[48vw]"
            >
              {header.brand.logo ? (
                <LazyImage
                  src={getSiteLogoUrl(216, 72)}
                  alt={header.brand.logo.alt || header.brand.title || ""}
                  className="h-7 w-auto shrink-0 sm:h-8"
                  effect="none"
                  priority
                />
              ) : null}
              {header.brand.title ? (
                <span className="hidden truncate text-[0.8rem] font-medium leading-none sm:inline sm:text-[0.85rem]">
                  {header.brand.title}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 min-w-[120px]">
          <div className="flex flex-nowrap items-center justify-end gap-1.5">
            <PricingPrompt autoPrompt={false}>
              {(openPricing) => (
                <button
                  type="button"
                  onClick={openPricing}
                  className={cn(
                    "h-8 shrink-0 rounded-lg px-2.5 text-[0.75rem] font-semibold transition-colors",
                    "bg-[#18191c] text-[#f2f2f4] shadow-none hover:bg-[#202125]",
                  )}
                >
                  Pricing
                </button>
              )}
            </PricingPrompt>
            {header.show_locale ? (
              <LocaleSelector
                type="button"
                className={cn(
                  "h-8 w-[70px] shrink-0 rounded-lg border-0 bg-transparent px-2.5 text-[0.75rem] font-semibold shadow-none ring-0 hover:bg-transparent dark:border-0 dark:bg-transparent dark:hover:bg-transparent",
                  "text-[#f2f2f4] dark:text-[#f2f2f4]",
                )}
              />
            ) : null}
            {header.show_sign ? (
              <SignUser
                userNav={header.user_nav}
                signButtonSize="sm"
                containerClassName="flex w-auto shrink-0 flex-row items-center gap-1.5"
                buttonClassName={cn(
                  "ml-0 h-8 min-w-[70px] shrink-0 rounded-lg px-2.5 text-[0.75rem] transition-colors",
                  "bg-[#18191c] text-[#f2f2f4] shadow-none hover:bg-[#202125]",
                )}
                triggerClassName={cn(
                  "ml-0 h-8 w-8 shrink-0 rounded-lg bg-transparent px-0 shadow-none transition-colors hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
                  "text-[#f2f2f4] dark:text-[#f2f2f4]",
                )}
              />
            ) : null}
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-[100000] bg-slate-950/98 dark:bg-slate-950/98 backdrop-blur-2xl animate-in fade-in duration-300 motion-reduce:animate-none overflow-y-auto"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: "100dvh",
          }}
        >
          {/* 顶部装饰条 */}
          <div className="h-px bg-[color:var(--color-frost-border)]" />

          {/* 关闭按钮 */}
          <div className="fixed top-6 right-6 z-10">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 菜单内容 */}
          <div className="flex h-full flex-col pt-20">
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <MobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* 底部渐变遮罩 - 提示可滚动 */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/98 to-transparent" />
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderMangoDesktopHeader = () => (
    <div className="mx-auto flex h-[88px] max-w-[1320px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-5">
        <Link href="/" className="flex items-center gap-3 text-black">
          <img
            src="/brand/barko-bear-wordmark.svg"
            alt="Barko Bear"
            className="h-9 w-auto"
          />
        </Link>
        {header.show_locale ? (
          <LocaleSelector
            type="icon"
            showIcon={false}
            showChevron
            className="h-auto w-auto gap-2 rounded-none px-0 py-0 text-[15px] font-medium text-black/82 hover:bg-transparent"
            labelClassName="text-[18px] font-semibold leading-none text-black"
            chevronClassName="size-4 text-black/70"
            contentAlign="start"
            contentSideOffset={18}
            contentCollisionPadding={24}
            contentClassName="mt-3 w-[min(760px,calc(100vw-48px))] max-w-[760px] overflow-hidden rounded-[20px] border border-black/8 bg-white p-5 text-black shadow-[0_18px_46px_rgba(0,0,0,0.12)]"
            itemsContainerClassName="grid grid-cols-3 gap-x-5 gap-y-1"
            itemClassName="min-h-[44px] justify-start rounded-[12px] px-4 py-2.5 text-[15px] font-normal text-black data-[highlighted]:bg-black/4 data-[highlighted]:text-black focus:bg-black/4 focus:text-black"
            activeItemClassName="font-semibold"
            showCheck={false}
          />
        ) : null}
      </div>

      <div
        className="relative flex items-center gap-7"
        onMouseLeave={() => setMangoOpenMenu(null)}
      >
        <nav className="hidden xl:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium text-black/78">
            {mangoNavItems.map((item) => {
              const menuGroup = mangoMenuGroups.find(
                (group) => group.title === item.title,
              );
              const isOpen = mangoOpenMenu === item.title;

              return (
                <li
                  key={item.title || item.url}
                  className="relative"
                  onMouseLeave={() => {
                    if (item.hasMenu) setMangoOpenMenu(null);
                  }}
                >
                  {item.hasMenu && menuGroup ? (
                    <>
                      <button
                        type="button"
                        onMouseEnter={() => setMangoOpenMenu(item.title)}
                        onClick={() =>
                          setMangoOpenMenu((current) =>
                            current === item.title ? null : item.title,
                          )
                        }
                        className={cn(
                          "inline-flex cursor-pointer items-start gap-1.5 transition-colors",
                          isOpen ? "text-black" : "hover:text-black",
                        )}
                      >
                        <span>{item.title}</span>
                        {menuGroup.badge ? (
                          <span className="mt-[-6px] inline-flex rounded-full bg-[#ff4f87] px-2.5 py-1 text-[11px] font-semibold leading-none text-white">
                            {menuGroup.badge}
                          </span>
                        ) : null}
                      </button>
                      {isOpen ? (
                        <div className="absolute left-1/2 top-full z-[1005] -translate-x-1/2 pt-5">
                          <div
                            className="relative overflow-hidden rounded-[22px] border border-black/6 bg-white p-7 shadow-[0_18px_46px_rgba(0,0,0,0.1)]"
                            style={{
                              width: `${menuGroup.panelWidth}px`,
                              maxWidth: "min(calc(100vw - 64px), 1200px)",
                            }}
                          >
                            <div className="max-h-[min(calc(100vh-160px),720px)] overflow-y-auto pr-1">
                              <div className="mb-6 text-[18px] font-semibold text-black/58">
                                {menuGroup.title}
                              </div>
                              {menuGroup.sections?.length ? (
                                <div className="grid gap-5 xl:grid-cols-2">
                                  {menuGroup.sections.map((section) => (
                                    <section
                                      key={`${menuGroup.title}-${section.title}`}
                                      className="p-1"
                                    >
                                      <div className="mb-3 flex items-center gap-2.5">
                                        {section.icon ? (
                                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7c78ff,#5a7df3)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                                            <SmartIcon
                                              name={section.icon}
                                              className="h-4 w-4"
                                            />
                                          </span>
                                        ) : null}
                                        {section.url ? (
                                          <Link
                                            href={section.url}
                                            onClick={() =>
                                              setMangoOpenMenu(null)
                                            }
                                            className="cursor-pointer text-[15px] font-semibold text-black transition hover:text-black/72"
                                          >
                                            {section.title}
                                          </Link>
                                        ) : (
                                          <div className="text-[15px] font-semibold text-black">
                                            {section.title}
                                          </div>
                                        )}
                                      </div>
                                      <ul
                                        className="grid gap-x-3 gap-y-1.5"
                                        style={{
                                          gridTemplateColumns: `repeat(${section.columns || 1}, minmax(0, 1fr))`,
                                        }}
                                      >
                                        {section.items.map((subItem) => (
                                          <li
                                            key={`${section.title}-${subItem.title}`}
                                          >
                                            <Link
                                              href={subItem.url || "#"}
                                              onClick={() =>
                                                setMangoOpenMenu(null)
                                              }
                                              className="grid min-h-[38px] min-w-0 cursor-pointer grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-[10px] px-2 py-1.5 text-[13px] font-medium text-black/78 transition hover:bg-black/4 hover:text-black"
                                            >
                                              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-[linear-gradient(135deg,#7c78ff,#5a7df3)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                                                {subItem.iconUrl ? (
                                                  <img
                                                    src={
                                                      withOssImageResize(
                                                        subItem.iconUrl,
                                                        96,
                                                        96,
                                                      ) || subItem.iconUrl
                                                    }
                                                    alt={subItem.title}
                                                    className="h-full w-full object-cover"
                                                  />
                                                ) : (
                                                  <SmartIcon
                                                    name={
                                                      subItem.icon as string
                                                    }
                                                    className="h-3.5 w-3.5"
                                                  />
                                                )}
                                              </span>
                                              <span className="flex min-w-0 items-center gap-2">
                                                <span className="block truncate leading-none">
                                                  {subItem.title}
                                                </span>
                                                {subItem.badge ? (
                                                  <span className="inline-flex rounded-full bg-[#ff4f87] px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                                                    {subItem.badge}
                                                  </span>
                                                ) : null}
                                              </span>
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </section>
                                  ))}
                                </div>
                              ) : (
                                <ul
                                  className="grid gap-x-10 gap-y-2"
                                  style={{
                                    gridTemplateColumns:
                                      menuGroup.columns === 1
                                        ? "minmax(0, 1fr)"
                                        : `repeat(${menuGroup.columns}, minmax(260px, 1fr))`,
                                    gridTemplateRows:
                                      menuGroup.columns > 1 && menuGroup.items
                                        ? `repeat(${Math.ceil(menuGroup.items.length / menuGroup.columns)}, minmax(0, auto))`
                                        : undefined,
                                    gridAutoFlow:
                                      menuGroup.columns > 1
                                        ? "column"
                                        : undefined,
                                  }}
                                >
                                  {menuGroup.items?.map((subItem) => (
                                    <li
                                      key={`${menuGroup.title}-${subItem.title}`}
                                    >
                                      <Link
                                        href={subItem.url || "#"}
                                        onClick={() => setMangoOpenMenu(null)}
                                        className="grid min-h-[56px] min-w-0 cursor-pointer grid-cols-[40px_minmax(0,1fr)] items-center gap-4 rounded-[12px] px-3 py-2 text-[15px] font-semibold text-black/78 transition hover:bg-black/4 hover:text-black"
                                      >
                                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c78ff,#5a7df3)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                                          {subItem.iconUrl ? (
                                            <img
                                              src={
                                                withOssImageResize(
                                                  subItem.iconUrl,
                                                  80,
                                                  80,
                                                ) || subItem.iconUrl
                                              }
                                              alt={subItem.title}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <SmartIcon
                                              name={subItem.icon as string}
                                              className="h-5 w-5"
                                            />
                                          )}
                                        </span>
                                        <span className="flex min-w-0 items-center gap-2">
                                          <span className="block truncate whitespace-nowrap leading-none">
                                            {subItem.title}
                                          </span>
                                          {subItem.badge ? (
                                            <span className="inline-flex rounded-full bg-[#ff4f87] px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                                              {subItem.badge}
                                            </span>
                                          ) : null}
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <Link
                      href={item.url || "#"}
                      className="cursor-pointer transition-colors hover:text-black"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        {header.show_sign ? (
          user ? (
            <SignUser
              userNav={header.user_nav}
              containerClassName="w-auto items-center gap-0 space-y-0"
              triggerClassName="h-10 w-10 rounded-full border border-black/10 bg-white p-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:bg-[#fafafa]"
              buttonClassName="ml-0 h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:bg-[#fafafa]"
              menuVariant="light"
            />
          ) : (
            <Link
              href={signInHref}
              className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:bg-white/90"
            >
              Login
            </Link>
          )
        ) : null}
      </div>
    </div>
  );

  const renderMangoMobileHeader = () => (
    <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="flex items-center gap-3 text-black">
          <img
            src="/brand/barko-bear-wordmark.svg"
            alt="Barko Bear"
            className="h-7 w-auto"
          />
        </Link>
        {header.show_locale ? (
          <LocaleSelector
            type="icon"
            showIcon={false}
            showChevron
            className="h-auto w-auto gap-1.5 rounded-none px-0 py-0 text-sm font-medium text-black/82 hover:bg-transparent"
            labelClassName="text-base font-semibold leading-none text-black"
            chevronClassName="size-4 text-black/70"
            contentAlign="start"
            contentSideOffset={14}
            contentCollisionPadding={12}
            contentClassName="mt-3 w-[min(380px,calc(100vw-24px))] max-w-[380px] overflow-hidden rounded-[18px] border border-black/8 bg-white p-3 text-black shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
            itemsContainerClassName="grid grid-cols-2 gap-x-2 gap-y-1"
            itemClassName="min-h-[42px] justify-start rounded-[10px] px-3 py-2.5 text-[14px] font-normal text-black data-[highlighted]:bg-black/4 data-[highlighted]:text-black focus:bg-black/4 focus:text-black"
            activeItemClassName="font-semibold"
            showCheck={false}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {header.show_sign ? (
          user ? (
            <SignUser
              userNav={header.user_nav}
              containerClassName="w-auto items-center gap-0 space-y-0"
              triggerClassName="z-[1003] h-10 w-10 rounded-full border border-black/10 bg-[#fff4cf] p-0 shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:bg-[#fff1bf]"
              buttonClassName="ml-0 h-10 rounded-full border border-black/10 bg-[#fff4cf] px-4 text-sm font-medium text-black shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:bg-[#fff1bf]"
              menuVariant="light"
            />
          ) : (
            <Link
              href={signInHref}
              className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:bg-white/90"
            >
              Login
            </Link>
          )
        ) : null}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full text-black"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-x-0 top-[72px] z-[1002] max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-black/8 bg-[#ffc62e] px-4 pb-6 pt-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:px-6">
          <div className="rounded-[24px] border border-black/8 bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
            <MobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {useMangoHeader ? (
        <header
          className="fixed inset-x-0 top-[var(--top-banner-h,0px)] z-[1000] border-b border-black/8 bg-[#ffc62e]/95 backdrop-blur"
          style={{ "--header-h": "5.5rem" } as CSSProperties}
        >
          <div className="lg:hidden">{renderMangoMobileHeader()}</div>
          <div className="hidden lg:block">{renderMangoDesktopHeader()}</div>
        </header>
      ) : null}
      {!useMangoHeader ? (
        <header
          data-state={isMobileMenuOpen ? "active" : "inactive"}
          {...(isScrolled && { "data-scrolled": true })}
          className="has-data-[state=open]:bg-background/50 fixed inset-x-0 z-[1000] has-data-[state=open]:h-[calc(100dvh-var(--top-banner-h,0px))] has-data-[state=open]:backdrop-blur"
          style={
            {
              "--header-h": "4.5rem",
              top: "var(--top-banner-h, 0px)",
            } as CSSProperties
          }
        >
          <div
            ref={headerSurfaceRef}
            className={cn(
              "absolute inset-x-0 top-0 z-[1000] h-18 border-transparent ring-1 ring-transparent transition-all duration-300",
              /* 暗色下默认与 Hero / 侧栏 #050505 一致，避免透明时透出布局里偏蓝的 --background */
              workspaceMode
                ? "dark:bg-[color:var(--color-header-bg)]"
                : "dark:bg-[#050505]",
              workspaceMode
                ? "bg-[color:var(--color-header-bg)] backdrop-blur-2xl"
                : "in-data-scrolled:border-white/8 in-data-scrolled:bg-[#050505]/88 in-data-scrolled:border-b in-data-scrolled:backdrop-blur-2xl in-data-scrolled:shadow-xl in-data-scrolled:shadow-black/30",
              openMenuIndex !== null
                ? "has-data-[state=open]:ring-white/8 has-data-[state=open]:bg-[#050505]/92 has-data-[state=open]:border-b has-data-[state=open]:shadow-2xl has-data-[state=open]:shadow-black/30 has-data-[state=open]:backdrop-blur-2xl"
                : "",
              "max-lg:h-auto max-lg:border-none max-lg:in-data-[state=active]:h-auto max-lg:in-data-[state=active]:bg-transparent",
            )}
          >
            <div className="lg:hidden">{renderMobileHomeTopBar()}</div>

            <div className="hidden lg:block">
              <div
                className={cn(
                  "container",
                  workspaceMode && "max-w-none px-6 xl:px-8",
                )}
              >
                <div
                  className={cn(
                    "relative flex flex-wrap items-center justify-between py-4",
                    workspaceMode && "gap-6",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-8">
                    <div className="flex items-center gap-3">
                      {workspaceMode ? renderSidebarToggle() : null}
                      {/* Brand Logo */}
                      <div ref={logoRef} className="min-w-0">
                        {header.brand ? (
                          <BrandLogo brand={header.brand} showTitle={false} />
                        ) : null}
                      </div>
                    </div>

                    {/* Desktop Navigation Menu */}
                    {showDesktopNav ? <NavMenu /> : null}
                  </div>

                  {workspaceMode
                    ? renderWorkspaceHeaderActions()
                    : renderDesktopHeaderActions()}
                </div>
              </div>
            </div>
          </div>
        </header>
      ) : null}
    </>
  );
}
