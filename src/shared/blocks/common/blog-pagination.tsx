import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import { buttonVariants } from '@/shared/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/shared/components/ui/pagination';
import { cn } from '@/shared/lib/utils';

type PageItem = number | 'ellipsis';

function buildHref({
  basePath,
  page,
  pageSize,
  defaultPageSize = 30,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  defaultPageSize?: number;
}) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (pageSize !== defaultPageSize) params.set('pageSize', String(pageSize));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([
    1,
    2,
    totalPages - 1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  for (const page of sorted) {
    const prev = items.length ? items[items.length - 1] : null;
    const prevNumber = typeof prev === 'number' ? prev : null;
    if (prevNumber !== null && page - prevNumber > 1) items.push('ellipsis');
    items.push(page);
  }
  return items;
}

function PageLink({
  href,
  isActive,
  children,
  size = 'icon',
  ariaLabel,
  className,
}: {
  href: string;
  isActive?: boolean;
  children: ReactNode;
  size?: 'icon' | 'default';
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className
      )}
    >
      {children}
    </Link>
  );
}

function DisabledButton({
  children,
  size = 'icon',
  ariaLabel,
}: {
  children: ReactNode;
  size?: 'icon' | 'default';
  ariaLabel?: string;
}) {
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        buttonVariants({ variant: 'ghost', size }),
        'pointer-events-none opacity-50'
      )}
    >
      {children}
    </span>
  );
}

export function BlogPagination({
  total,
  page,
  pageSize,
  basePath,
  className,
}: {
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  className?: string;
}) {
  const sanitizedTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const sanitizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 30;

  const totalPages = Math.max(1, Math.ceil(sanitizedTotal / sanitizedPageSize));
  const currentPage =
    Number.isFinite(page) && page > 0 ? Math.min(page, totalPages) : 1;

  if (totalPages <= 1) return null;

  const pageItems = getPageItems(currentPage, totalPages);

  const prevHref =
    currentPage > 1
      ? buildHref({
          basePath,
          page: currentPage - 1,
          pageSize: sanitizedPageSize,
        })
      : null;
  const nextHref =
    currentPage < totalPages
      ? buildHref({
          basePath,
          page: currentPage + 1,
          pageSize: sanitizedPageSize,
        })
      : null;

  return (
    <Pagination className={cn('mx-auto mt-10 w-full justify-center', className)}>
      <PaginationContent>
        <PaginationItem>
          {prevHref ? (
            <PageLink href={prevHref} size="default" ariaLabel="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </PageLink>
          ) : (
            <DisabledButton size="default" ariaLabel="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </DisabledButton>
          )}
        </PaginationItem>

        {pageItems.map((item, idx) =>
          item === 'ellipsis' ? (
            <PaginationEllipsis key={`ellipsis-${idx}`} />
          ) : (
            <PaginationItem key={`page-${item}`}>
              <PageLink
                href={buildHref({
                  basePath,
                  page: item,
                  pageSize: sanitizedPageSize,
                })}
                isActive={item === currentPage}
              >
                {item}
              </PageLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          {nextHref ? (
            <PageLink href={nextHref} size="default" ariaLabel="Next page">
              <ChevronRight className="h-4 w-4" />
            </PageLink>
          ) : (
            <DisabledButton size="default" ariaLabel="Next page">
              <ChevronRight className="h-4 w-4" />
            </DisabledButton>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
