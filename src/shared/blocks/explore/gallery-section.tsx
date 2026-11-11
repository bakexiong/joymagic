'use client';

import { useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { MediaGrid } from './media-grid';
import { MediaItem } from './media-card';
import { cn } from '@/shared/lib/utils';

interface GallerySectionProps {
  sceneName: string;
  subtitle: string;
  items: MediaItem[];
  generateUrl?: string;
  sectionId?: string;
  onItemClick?: (item: MediaItem, generateUrl?: string, sectionId?: string) => void;
  onViewAll?: () => void;
  className?: string;
  viewAllText?: string;
}

export function GallerySection({
  sceneName,
  subtitle,
  items,
  generateUrl,
  sectionId,
  onItemClick,
  onViewAll,
  className,
  viewAllText = 'View all',
}: GallerySectionProps) {
  const handleItemClick = useCallback((item: MediaItem) => {
    onItemClick?.(item, generateUrl, sectionId);
  }, [onItemClick, generateUrl, sectionId]);

  return (
    <section className={cn('mb-12 md:mb-16', className)}>
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        <h2 className="mb-1.5 whitespace-nowrap text-xl font-bold text-white sm:mb-2 sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
          {sceneName}
        </h2>
        <p className="whitespace-nowrap text-xs text-white/70 sm:text-sm md:text-base">{subtitle}</p>
      </div>

      <MediaGrid items={items} onItemClick={handleItemClick} />

      {onViewAll && items.length > 0 && (
        <div className="mt-4 flex justify-center sm:mt-5 md:mt-6">
          <Button
            onClick={onViewAll}
            variant="default"
            size="lg"
            className="min-h-[44px] whitespace-nowrap rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white shadow-xl shadow-black/30 transition-all duration-200 hover:bg-white/15 hover:scale-105 hover:shadow-2xl hover:shadow-black/40 sm:px-6 sm:py-3 sm:text-sm"
          >
            {viewAllText}
            <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
