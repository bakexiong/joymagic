"use client";

import {
  FolderOpen,
  Images,
  LayoutDashboard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/core/i18n/navigation";
import { cn } from "@/shared/lib/utils";

export function CanvasSidebarNav({
  className,
  compact = false,
  onOpenProjects,
  onOpenCreations,
  onOpenCollections,
}: {
  className?: string;
  compact?: boolean;
  onOpenProjects?: () => void;
  onOpenCreations?: () => void;
  onOpenCollections?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("landing.canvasWorkspace.nav");
  const navItems = [
    {
      href: "/create/canvas/projects",
      label: t("canvas"),
      icon: LayoutDashboard,
      onClick: onOpenProjects,
    },
    {
      href: "/create/canvas/creations",
      label: t("creations"),
      icon: Images,
      onClick: onOpenCreations,
    },
    {
      href: "/create/canvas/collections",
      label: t("collections"),
      icon: FolderOpen,
      onClick: onOpenCollections,
    },
  ] as const;

  return (
    <nav
      className={cn(
        compact
          ? "p-0"
          : "rounded-[28px] border border-white/10 bg-[rgba(22,23,27,0.92)] p-3 shadow-[0_18px_54px_rgba(0,0,0,0.32)] backdrop-blur-xl",
        className,
      )}
      aria-label="Canvas 侧边栏导航"
    >
      <div className={cn("flex flex-col gap-2", compact && "gap-1.5")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = compact
            ? false
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const navLink = (
            <button
              type="button"
              onClick={item.onClick}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-3 rounded-[18px] border border-transparent px-3 py-2.5 text-sm font-medium text-white/58 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
                compact &&
                  "size-11 justify-center gap-0 rounded-[18px] px-0 py-0 text-white/64 hover:bg-white/[0.04]",
                isActive &&
                  "border-white/10 bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              )}
            >
              <Icon className={cn("size-4.5 shrink-0", isActive && "text-white")} />
              {!compact ? <span>{item.label}</span> : null}
            </button>
          );

          if (!compact) {
            return <div key={item.href}>{navLink}</div>;
          }

          return (
            <div key={item.href} className="group relative">
              {navLink}
              <div
                className={cn(
                  "pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[rgba(29,29,31,0.96)] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-[0_18px_48px_rgba(0,0,0,0.3)] transition duration-150 group-hover:opacity-100",
                  isActive && "opacity-100",
                )}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
