'use client';

import { useCallback, memo, useState, lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

import { withOssImageMaxSide } from '@/shared/lib/cdn';
import { landingSidebarRowCenteredCn } from '@/shared/lib/landing-sidebar-layout-classes';
import { cn } from '@/shared/lib/utils';
import { type MobileHomepageBannerSlide, type MobileHomepageShowcaseGroup } from '@/shared/lib/mobile-homepage';
import { Hero as HeroType } from '@/shared/types/blocks/landing';
import { MediaItem, MediaCard } from '@/shared/blocks/explore/media-card';
import { Link, useRouter } from '@/core/i18n/navigation';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getImageEffectItemsSync } from '@/shared/lib/image-effect-data';
import { getVideoEffectItemsSync } from '@/shared/lib/video-effect-data';

const MediaDetailModal = lazy(() =>
  import('@/shared/blocks/explore/media-detail-modal').then((mod) => ({
    default: mod.MediaDetailModal,
  }))
);

const EFFECT_INITIAL_RENDER_COUNT = 6;
const EFFECT_RENDER_BATCH_SIZE = 6;
const INSPIRATION_INITIAL_RENDER_COUNT = 18;
const INSPIRATION_RENDER_BATCH_SIZE = 18;

function normalizeHomepageGenerateUrl(url?: string) {
  const normalized = (url || '').trim();
  const normalizeScenePath = (sceneValue: string) =>
    sceneValue
      .replace(/^\/+/, '')
      .split('/')
      .filter(Boolean)
      .slice(0, 1)
      .join('/');

  if (!normalized) {
    return '/tools/text-to-image';
  }

  if (normalized.startsWith('/creator?')) {
    const query = normalized.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const scene = normalizeScenePath(params.get('scene') || '');

    return scene ? `/tools/${scene}` : '/tools/text-to-image';
  }

  const pathname = normalized.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length >= 2) {
    return `/tools/${parts.slice(0, -1).join('/')}`;
  }

  if (parts.length === 1) {
    return `/tools/${parts[0]}`;
  }

  return '/tools/text-to-image';
}

const ShowcaseCard = memo(function ShowcaseCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, isVisible } = useDeferredVisibility();
  const isInteractive = item.type !== 'audio' && Boolean(onClick);

  // 计算预期的宽高比 - 与 MediaCard 内部计算保持一致，防止布局偏移
  let aspectRatio = 1; // height/width
  if (item.aspectRatio) {
    aspectRatio = item.aspectRatio;
  } else if (item.height && item.width) {
    aspectRatio = item.height / item.width;
  } else if (item.gridSize === 'tall' || item.gridSize === 'large') {
    aspectRatio = 4 / 3;
  } else if (item.gridSize === 'small') {
    aspectRatio = 1;
  } else {
    aspectRatio = 10 / 16;
  }

  const cssAspectRatio = (1 / aspectRatio).toString(); // width/height for CSS

  return (
    <div ref={ref} className="group mb-2 w-full break-inside-avoid">
      <div className="relative w-full" style={{ aspectRatio: cssAspectRatio }}>
        {!isLoaded && (
          <Skeleton
            className="absolute inset-0 w-full h-full rounded-[0.7rem] bg-white/5"
          />
        )}
        {isVisible && (
          <div className={cn("absolute inset-0 w-full h-full transition-opacity duration-300", !isLoaded && "opacity-0")}>
            <MediaCard
              item={item}
              onClick={isInteractive ? onClick : undefined}
              onLoadComplete={() => setIsLoaded(true)}
              disableImageOptimization
              limitImageConcurrency
              className={cn(
                "w-full h-full rounded-[0.7rem] border-slate-200 dark:border-white/10",
                "transition-all duration-300 cursor-pointer",
                "group-hover:shadow-2xl group-hover:shadow-white/10 group-hover:scale-[1.02]"
              )}
            />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-[0.7rem] bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});

type EffectEntry = {
  id: string;
  title: string;
  description?: string;
  href: string;
  mediaType: 'image' | 'video';
  mediaSrc?: string;
  mediaPoster?: string;
  aspectRatio?: string;
};

const EFFECT_VIDEO_CONCURRENCY = 3;
let activeEffectVideoLoads = 0;
const pendingEffectVideoLoads: Array<() => void> = [];

function acquireEffectVideoSlot(onReady: () => void) {
  if (activeEffectVideoLoads < EFFECT_VIDEO_CONCURRENCY) {
    activeEffectVideoLoads += 1;
    onReady();
    return () => {
      activeEffectVideoLoads = Math.max(0, activeEffectVideoLoads - 1);
      const next = pendingEffectVideoLoads.shift();
      if (next) {
        activeEffectVideoLoads += 1;
        next();
      }
    };
  }

  pendingEffectVideoLoads.push(onReady);

  return () => {
    const index = pendingEffectVideoLoads.indexOf(onReady);
    if (index >= 0) {
      pendingEffectVideoLoads.splice(index, 1);
      return;
    }

    activeEffectVideoLoads = Math.max(0, activeEffectVideoLoads - 1);
    const next = pendingEffectVideoLoads.shift();
    if (next) {
      activeEffectVideoLoads += 1;
      next();
    }
  };
}

function parseAspectRatio(aspectRatio?: string) {
  if (!aspectRatio) return '4 / 5';
  const [width, height] = aspectRatio.split('/').map((value) => Number(value.trim()));
  if (!width || !height) return '4 / 5';
  return `${width} / ${height}`;
}

function useDeferredVisibility() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '80px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

function DeferredSection({
  children,
  minHeight,
  className,
}: {
  children: React.ReactNode;
  minHeight: number;
  className?: string;
}) {
  const { ref, isVisible } = useDeferredVisibility();

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isVisible ? undefined : `${minHeight}px` }}
    >
      {isVisible ? (
        children
      ) : (
        <Skeleton className="h-full min-h-[inherit] w-full rounded-[1.25rem] bg-white/5" />
      )}
    </div>
  );
}

function LoadMoreSentinel({
  onVisible,
}: {
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      {
        rootMargin: '240px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} className="h-px w-full" aria-hidden="true" />;
}

function EffectMasonryCard({ item }: { item: EffectEntry }) {
  const { ref, isVisible } = useDeferredVisibility();
  const releaseSlotRef = useRef<(() => void) | null>(null);
  const hasVideoSlotRef = useRef(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const previewImageSrc =
    item.mediaPoster || withOssImageMaxSide(item.mediaSrc, 900);

  useEffect(() => {
    if (item.mediaType !== 'video' || !item.mediaSrc || !isVisible || hasVideoSlotRef.current) {
      return;
    }

    releaseSlotRef.current = acquireEffectVideoSlot(() => {
      hasVideoSlotRef.current = true;
      setShouldLoadVideo(true);
    });
  }, [item.mediaType, item.mediaSrc, isVisible]);

  useEffect(() => {
    if (isVisible) return;

    setShouldLoadVideo(false);
    if (releaseSlotRef.current) {
      const release = releaseSlotRef.current;
      releaseSlotRef.current = null;
      hasVideoSlotRef.current = false;
      release();
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (releaseSlotRef.current) {
        const release = releaseSlotRef.current;
        releaseSlotRef.current = null;
        hasVideoSlotRef.current = false;
        release();
      }
    };
  }, []);

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative mb-3 block break-inside-avoid overflow-hidden rounded-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)]",
        "transition-all duration-300 hover:border-white/18 hover:bg-white/[0.045]"
      )}
    >
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[1rem] bg-white/[0.03]"
        style={{ aspectRatio: parseAspectRatio(item.aspectRatio) }}
      >
        {shouldLoadVideo ? (
          <video
            src={item.mediaSrc}
            poster={item.mediaPoster}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
          />
        ) : previewImageSrc ? (
          <img
            src={previewImageSrc}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/5" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />
        {item.mediaType === 'video' && !shouldLoadVideo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/55 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <ArrowRight className="h-4 w-4 rotate-[-45deg] text-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-[1rem] font-semibold leading-[1.06] tracking-[-0.02em] text-white">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function PcHomepage({
  hero,
  config,
}: {
  hero: HeroType;
  config: {
    bannerSlides: MobileHomepageBannerSlide[];
    showcaseGroups: MobileHomepageShowcaseGroup[];
  };
}) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageEffectRenderCount, setImageEffectRenderCount] = useState(
    EFFECT_INITIAL_RENDER_COUNT,
  );
  const [videoEffectRenderCount, setVideoEffectRenderCount] = useState(
    EFFECT_INITIAL_RENDER_COUNT,
  );
  const [inspirationRenderCount, setInspirationRenderCount] = useState(
    INSPIRATION_INITIAL_RENDER_COUNT,
  );

  const handleItemClick = useCallback((item: MediaItem) => {
    if (item.type === 'audio') {
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleRecreate = useCallback((item: MediaItem) => {
    if (item.prompt) {
      sessionStorage.setItem('creator-initial-prompt', item.prompt);
    }
    if (item.parameters && Object.keys(item.parameters).length > 0) {
      sessionStorage.setItem('creator-initial-params', JSON.stringify(item.parameters));
    }
    const targetUrl = normalizeHomepageGenerateUrl(item.generateUrl);
    router.push(targetUrl);
  }, [router]);

  // PC端显示所有分类的所有图片（不限制数量）
  // 需要从原始数据源获取完整列表，而不是使用移动端的6个限制
  const allItems = useMemo(
    () => config.showcaseGroups.flatMap((group) => group.items),
    [config.showcaseGroups],
  );
  const imageEffectItems = useMemo(
    () =>
      getImageEffectItemsSync()
        .slice(0, 18)
        .map((item) => ({
          id: `image-effect-${item.id}`,
          title: item.title,
          description: item.description,
          href: `/ai-effect/image?effect=${item.slug}`,
          mediaType: 'image' as const,
          mediaSrc: item.previewExample?.outputImageUrl || item.coverUrl,
          aspectRatio: item.aspectRatio,
        })),
    [],
  );
  const videoEffectItems = useMemo(
    () =>
      getVideoEffectItemsSync()
        .slice(0, 18)
        .map((item) => ({
          id: `video-effect-${item.id}`,
          title: item.title,
          href: `/ai-effect/video?effect=${item.slug}`,
          mediaType: 'video' as const,
          mediaSrc: item.samplePreviewClipUrl || item.sampleVideoUrl,
          mediaPoster: item.coverUrl,
          aspectRatio: item.aspectRatio,
        })),
    [],
  );
  const visibleImageEffectItems = useMemo(
    () => imageEffectItems.slice(0, imageEffectRenderCount),
    [imageEffectItems, imageEffectRenderCount],
  );
  const visibleVideoEffectItems = useMemo(
    () => videoEffectItems.slice(0, videoEffectRenderCount),
    [videoEffectItems, videoEffectRenderCount],
  );
  const hasMoreImageEffects = visibleImageEffectItems.length < imageEffectItems.length;
  const hasMoreVideoEffects = visibleVideoEffectItems.length < videoEffectItems.length;
  const visibleInspirationItems = useMemo(
    () => allItems.slice(0, inspirationRenderCount),
    [allItems, inspirationRenderCount],
  );
  const hasMoreInspirations = visibleInspirationItems.length < allItems.length;

  return (
    <>
      <section className="overflow-hidden bg-[#050505] text-white">
        <div className={landingSidebarRowCenteredCn('mx-auto w-full 2xl:max-w-[1600px] px-5 pb-8 pt-3')}>
          {(imageEffectItems.length > 0 || videoEffectItems.length > 0) && (
            <div className="mb-8 space-y-6">
              {imageEffectItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-[22px] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                      Image Effects
                    </h2>
                    <Link
                      href="/ai-effect?tab=image"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/72 transition-colors duration-200 hover:border-white/16 hover:text-white"
                    >
                      <span>More</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [column-fill:_balance]">
                    {visibleImageEffectItems.map((item) => (
                      <EffectMasonryCard
                        key={item.id}
                        item={item}
                      />
                    ))}
                  </div>
                  {hasMoreImageEffects ? (
                    <LoadMoreSentinel
                      onVisible={() => {
                        setImageEffectRenderCount((prev) =>
                          Math.min(
                            imageEffectItems.length,
                            prev + EFFECT_RENDER_BATCH_SIZE,
                          ),
                        );
                      }}
                    />
                  ) : null}
                </div>
              )}

              {videoEffectItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-[22px] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                      Video Effects
                    </h2>
                    <Link
                      href="/ai-effect?tab=video"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/72 transition-colors duration-200 hover:border-white/16 hover:text-white"
                    >
                      <span>More</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [column-fill:_balance]">
                    {visibleVideoEffectItems.map((item) => (
                      <EffectMasonryCard
                        key={item.id}
                        item={item}
                      />
                    ))}
                  </div>
                  {hasMoreVideoEffects ? (
                    <LoadMoreSentinel
                      onVisible={() => {
                        setVideoEffectRenderCount((prev) =>
                          Math.min(
                            videoEffectItems.length,
                            prev + EFFECT_RENDER_BATCH_SIZE,
                          ),
                        );
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-[22px] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
              Inspirations
            </h2>
          </div>

          <DeferredSection minHeight={2200}>
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [column-fill:_balance]">
              {visibleInspirationItems.map((item) => (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>
            {hasMoreInspirations ? (
              <LoadMoreSentinel
                onVisible={() => {
                  setInspirationRenderCount((prev) =>
                    Math.min(
                      allItems.length,
                      prev + INSPIRATION_RENDER_BATCH_SIZE,
                    ),
                  );
                }}
              />
            ) : null}
          </DeferredSection>
        </div>
      </section>

      {isModalOpen ? (
        <Suspense fallback={null}>
          <MediaDetailModal
            item={selectedItem}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onRecreate={handleRecreate}
          />
        </Suspense>
      ) : null}
    </>
  );
}
