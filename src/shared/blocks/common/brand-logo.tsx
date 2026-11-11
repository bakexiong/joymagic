import { Link } from '@/core/i18n/navigation';
import { getSiteLogoUrl } from '@/shared/lib/site-logo';
import { Brand as BrandType } from '@/shared/types/blocks/common';

import { LazyImage } from './lazy-image';

export function BrandLogo({
  brand,
  showTitle = true,
}: {
  brand: BrandType;
  showTitle?: boolean;
}) {
  const logoSrc =
    brand.logo?.src === '/logo.png'
      ? getSiteLogoUrl(240, 80)
      : brand.logo?.src;

  return (
    <Link
      href={brand.url || ''}
      target={brand.target || '_self'}
      className={`flex items-center space-x-2 ${brand.className}`}
    >
      {brand.logo && logoSrc && (
        <LazyImage
          src={logoSrc}
          alt={brand.logo.alt || ''}
          className="h-12 w-auto"
          effect="none"
          priority
        />
      )}
      {showTitle && brand.title && (
        <span className="text-lg font-medium">{brand.title}</span>
      )}
    </Link>
  );
}
