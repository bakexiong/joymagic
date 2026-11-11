'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cacheGet, cacheSet } from '@/shared/lib/cache';
import { getTimestamp } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';

const DISMISSED_KEY = 'vidu-q3-announcement-dismissed';
const DISMISSED_EXPIRY_DAYS = 7;

export function AnnouncementBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const isDismissed = (): boolean => {
    const dismissedData = cacheGet(DISMISSED_KEY);
    if (!dismissedData) return false;
    return true;
  };

  const setDismissed = () => {
    const expiresAt = getTimestamp() + DISMISSED_EXPIRY_DAYS * 24 * 60 * 60;
    cacheSet(DISMISSED_KEY, 'true', expiresAt);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 每次挂载时根据缓存决定是否显示（不用 ref  guarding，避免 Strict Mode 下第二次 effect 不执行导致不显示）
  useEffect(() => {
    if (!isDismissed()) {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (showBanner && bannerRef.current) {
      // 使用 requestAnimationFrame 批处理布局读取和写入，避免强制重排
      requestAnimationFrame(() => {
        if (!bannerRef.current) return;
        const bannerHeight = bannerRef.current.offsetHeight;

        // 批量执行所有 DOM 写入操作
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--announcement-banner-height', `${bannerHeight}px`);

          const header = document.querySelector('header');
          if (header) {
            header.style.top = `${bannerHeight}px`;
          }

          const sidebarContainer = document.querySelector('[data-slot="sidebar-container"]');
          if (sidebarContainer) {
            (sidebarContainer as HTMLElement).style.top = `${bannerHeight}px`;
            (sidebarContainer as HTMLElement).style.height = `calc(100vh - ${bannerHeight}px)`;
          }

          const sidebarWrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
          if (sidebarWrapper) {
            (sidebarWrapper as HTMLElement).style.paddingTop = `${bannerHeight}px`;
          }
        });
      });
    }

    return () => {
      document.documentElement.style.setProperty('--announcement-banner-height', '0px');

      const header = document.querySelector('header');
      if (header) header.style.top = '0px';

      const sidebarContainer = document.querySelector('[data-slot="sidebar-container"]');
      if (sidebarContainer) {
        (sidebarContainer as HTMLElement).style.top = '0px';
        (sidebarContainer as HTMLElement).style.height = '100vh';
      }

      const sidebarWrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
      if (sidebarWrapper) {
        (sidebarWrapper as HTMLElement).style.paddingTop = '0px';
      }
    };
  }, [showBanner]);

  const handleDismiss = () => {
    setDismissed();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[51] bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 dark:from-orange-500 dark:via-amber-500 dark:to-orange-500 border-b-[3px] border-amber-300 dark:border-amber-300 shadow-[0_6px_24px_rgba(252,211,77,0.5)] dark:shadow-[0_6px_24px_rgba(251,191,36,0.7)] backdrop-blur-md"
    >
      {/* Subtle animated gradient overlay for extra visual interest */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-white/60 via-amber-100/60 to-white/60 opacity-80",
        !prefersReducedMotion && "animate-pulse"
      )} />

      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto relative pr-10 sm:pr-12">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/85 text-amber-900 dark:bg-white/20 dark:text-white backdrop-blur-sm border border-amber-200 dark:border-white/30 shadow-lg",
            !prefersReducedMotion && "animate-pulse"
          )}>
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          </div>

          {/* Content - Centered */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center">
            <span className="text-sm font-semibold text-slate-900 dark:text-white drop-shadow-sm whitespace-nowrap">
              Vidu Q3 is live!
            </span>
            <span className="hidden sm:inline text-slate-900/40 dark:text-white/60">•</span>
            <Link
              href="/image-to-video/vidu-q3"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-amber-900 dark:bg-white/15 dark:text-white backdrop-blur-sm border border-amber-200 dark:border-white/30 text-sm font-semibold transition-all duration-200 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-white/25 hover:shadow-lg cursor-pointer shadow-md whitespace-nowrap"
            >
              <span className="text-xs font-bold">→</span>
            </Link>
          </div>

          {/* Close Button - Absolute positioned on the right */}
          <button
            onClick={handleDismiss}
            className="absolute right-0 flex-shrink-0 p-1.5 rounded-md text-amber-900/70 hover:text-amber-900 hover:bg-white/70 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm border border-transparent hover:border-amber-200 dark:hover:border-white/30"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
