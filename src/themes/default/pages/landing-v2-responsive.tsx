"use client";

import {
  type ComponentType,
  createElement,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import { Skeleton } from "@/shared/components/ui/skeleton";
import { PcHomeStudio } from "@/shared/blocks/pc-home-studio";
import { PcHomepage } from "@/shared/blocks/pc-homepage";
import { HomepagePromoCarousel } from "@/shared/blocks/homepage";
import { HomepageSuiteVertical } from "@/shared/blocks/homepage-suite/homepage-suite-vertical";
import type { MobileHomepageConfig } from "@/shared/lib/mobile-homepage";
import type { Hero as HeroType } from "@/shared/types/blocks/landing";
import type { NavItem } from "@/shared/types/blocks/common";
import { HomeComposerSection } from "@/themes/default/blocks/home-composer";

function useViewportDeferredMount({
  query,
  rootMargin = "240px 0px",
  deferUntilVisible = true,
}: {
  query: string;
  rootMargin?: string;
  deferUntilVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    const update = () => setIsMatched(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  useEffect(() => {
    if (!deferUntilVisible) {
      if (isMatched) {
        setShouldMount(true);
      }
      return;
    }

    if (!isMatched || shouldMount) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldMount(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [deferUntilVisible, isMatched, rootMargin, shouldMount]);

  return { ref, shouldMount: isMatched && shouldMount };
}

function DeferredViewportBlock<T extends object>({
  query,
  fallback,
  component: Component,
  props,
  className,
  rootMargin,
  deferUntilVisible = true,
}: {
  query: string;
  fallback: React.ReactNode;
  component: ComponentType<T>;
  props: T;
  className?: string;
  rootMargin?: string;
  deferUntilVisible?: boolean;
}) {
  if (!deferUntilVisible) {
    return <div className={className}>{createElement(Component, props)}</div>;
  }

  const { ref, shouldMount } = useViewportDeferredMount({
    query,
    rootMargin,
    deferUntilVisible,
  });

  return (
    <div ref={ref} className={className}>
      {shouldMount ? (
        <Suspense fallback={fallback}>
          {createElement(Component, props)}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

function PcHomepageFallback() {
  return (
    <div className="px-5 pb-8 pt-3">
      <Skeleton className="h-[72rem] rounded-[1.5rem] bg-white/[0.05]" />
    </div>
  );
}

function DesktopHeroModules({
  bannerSlides,
  headerNavItems,
}: {
  bannerSlides: MobileHomepageConfig["bannerSlides"];
  headerNavItems: NavItem[];
}) {
  return (
    <div className="w-full space-y-6">
      <HomeComposerSection
        className="w-full"
        headerNavItems={headerNavItems}
      />
      <HomepagePromoCarousel slides={bannerSlides} />
      <HomepageSuiteVertical headerNavItems={headerNavItems} />
    </div>
  );
}

export function DeferredMobileHomepage({
  hero: _hero,
  config,
  sectionClassName: _sectionClassName,
  headerNavItems,
}: {
  hero: HeroType;
  config: MobileHomepageConfig;
  sectionClassName?: string;
  headerNavItems: NavItem[];
}) {
  return (
    <div className="md:hidden">
      <PcHomeStudio
        bannerSlides={config.bannerSlides}
        showcaseGroups={config.showcaseGroups}
        headerNavItems={headerNavItems}
      />
    </div>
  );
}

export function DeferredDesktopHeroModules({
  bannerSlides,
  headerNavItems,
}: {
  bannerSlides: MobileHomepageConfig["bannerSlides"];
  headerNavItems: NavItem[];
}) {
  return (
    <DesktopHeroModules
      bannerSlides={bannerSlides}
      headerNavItems={headerNavItems}
    />
  );
}

export function DeferredPcHomepage({
  hero,
  config,
}: {
  hero: HeroType;
  config: {
    bannerSlides: MobileHomepageConfig["bannerSlides"];
    showcaseGroups: MobileHomepageConfig["showcaseGroups"];
  };
}) {
  return (
    <DeferredViewportBlock
      query="(min-width: 768px)"
      component={PcHomepage}
      props={{ hero, config }}
      fallback={<PcHomepageFallback />}
      rootMargin="320px 0px"
      deferUntilVisible={false}
    />
  );
}
