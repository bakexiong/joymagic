import { type CSSProperties, type ReactNode } from "react";

import {
  Footer as FooterType,
  Header as HeaderType,
} from "@/shared/types/blocks/landing";
import { cn } from "@/shared/lib/utils";
import { type HomeSidebarData } from "@/themes/default/blocks/home-sidebar";
import { Footer } from "@/themes/default/blocks/footer";
import { Header } from "@/themes/default/blocks/header";

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export default async function LandingLayout({
  children,
  header,
  footer,
  mobileLegacyHref,
  homeSidebar,
}: {
  children: ReactNode;
  header: HeaderType;
  footer: FooterType;
  mobileLegacyHref?: string;
  /** 侧栏文案与结构来自 landing.homeSidebar；无 items 时不渲染侧栏 */
  homeSidebar?: HomeSidebarData;
}) {
  const showSidebar = false;

  return (
    <div
      className={cn(
        "flex min-h-screen w-screen flex-col bg-white pt-[var(--top-banner-h,0px)] [--background:#ffffff] [--card:#ffffff] [--popover:#ffffff] [--sidebar:#ffffff] [--header-h:4.75rem] dark:bg-[color:var(--color-page-bg)] dark:[--background:var(--color-page-bg)] dark:[--card:var(--color-surface-1)] dark:[--popover:var(--color-surface-2)] dark:[--sidebar:var(--color-sidebar-panel)]",
        showSidebar
          ? "[--top-banner-h:3rem] sm:[--top-banner-h:2.5rem]"
          : "[--top-banner-h:0px]",
      )}
      style={
        {
          "--workspace-sidebar-w-default": showSidebar
            ? `${SIDEBAR_WIDTH}px`
            : `${SIDEBAR_COLLAPSED_WIDTH}px`,
          "--workspace-sidebar-offset-default": showSidebar
            ? `calc(${SIDEBAR_WIDTH}px + 1.5rem)`
            : `calc(${SIDEBAR_COLLAPSED_WIDTH}px + 1.5rem)`,
        } as CSSProperties
      }
    >
      {/* Header 为 fixed，不占文档流；--header-h 必须设在本层：侧栏与 Header 为兄弟，无法继承 header 上的变量 */}
      <Header
        header={header}
        mobileLegacyHref={mobileLegacyHref}
        showDesktopNav={!showSidebar}
        workspaceMode={showSidebar}
      />

      <div
        className={cn(
          "relative min-w-0 w-full flex-1 pt-[var(--header-h)] transition-[margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          /* 侧栏 fixed 脱离文档流：主区预留左侧宽度 + 顶栏留白（pt 与侧栏 top 均引用 --header-h，保持同步） */
          showSidebar &&
            "group/sidebar-layout md:ml-[var(--workspace-sidebar-offset,var(--workspace-sidebar-offset-default,calc(220px+1.5rem)))] md:w-[calc(100%-var(--workspace-sidebar-offset,var(--workspace-sidebar-offset-default,calc(220px+1.5rem))))]",
        )}
        {...(showSidebar ? { "data-layout": "with-sidebar" as const } : {})}
      >
        {children}
        <Footer footer={footer} />
      </div>
    </div>
  );
}
