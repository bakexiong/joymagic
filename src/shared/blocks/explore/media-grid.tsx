'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import { MediaCard, MediaItem } from './media-card';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem, ...args: any[]) => void;
  className?: string;
}

// 按索引循环分配宽高比（仅在 item 无精确尺寸时使用）
const FALLBACK_VARIANTS = ['aspect-[3/4]', 'aspect-square', 'aspect-[16/10]'] as const;
const getFallbackVariant = (index: number) => FALLBACK_VARIANTS[index % FALLBACK_VARIANTS.length];

const MasonryCard = memo(function MasonryCard({
  item,
  index,
  onItemClick,
  onLoadFailed,
}: {
  item: MediaItem;
  index: number;
  onItemClick?: (item: MediaItem) => void;
  onLoadFailed?: (itemId: string) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isInteractive = item.type !== 'audio' && Boolean(onItemClick);

  // 优先使用预计算的 aspectRatio (height/width)，再从 width/height 推算，防止布局偏移
  const cssAspectRatio: string | undefined = item.aspectRatio
    ? (1 / item.aspectRatio).toString()
    : item.width && item.height
      ? (item.width / item.height).toString()
      : undefined;

  return (
    <div className="mb-3 w-full break-inside-avoid">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[0.7rem]',
          !cssAspectRatio && getFallbackVariant(index),
        )}
        style={cssAspectRatio ? { aspectRatio: cssAspectRatio } : undefined}
      >
        {!isLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-[0.7rem]" />
        )}
        <MediaCard
          item={item}
          onClick={isInteractive ? onItemClick : undefined}
          onLoadFailed={onLoadFailed}
          onLoadComplete={() => setIsLoaded(true)}
          className="h-full w-full"
        />
      </div>
    </div>
  );
});

export function MediaGrid({
  items,
  onItemClick,
  className,
}: MediaGridProps) {
  const [failedItems, setFailedItems] = useState<Set<string>>(new Set());

  const handleItemLoadFailed = useCallback((itemId: string) => {
    setFailedItems((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  }, []);

  const validItems = useMemo(
    () => items.filter((item) => !failedItems.has(item.id)),
    [items, failedItems],
  );

  if (validItems.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <p className="text-sm text-white/60">No items to display</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5 [column-fill:_balance]">
        {validItems.map((item, index) => (
          <MasonryCard
            key={item.id}
            item={item}
            index={index}
            onItemClick={onItemClick}
            onLoadFailed={handleItemLoadFailed}
          />
        ))}
      </div>
    </div>
  );
}
