'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Globe, Languages } from 'lucide-react';
import { useLocale } from 'next-intl';

import { Link, usePathname, useRouter } from '@/core/i18n/navigation';
import { localeNames, locales } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cacheSet } from '@/shared/lib/cache';
import { cn } from '@/shared/lib/utils';

export function LocaleSelector({
  type = 'icon',
  variant = 'dropdown',
  className,
  showIcon = true,
  labelClassName,
  contentClassName,
  itemsContainerClassName,
  itemClassName,
  activeItemClassName,
  checkClassName,
  showCheck = true,
  showChevron = false,
  chevronClassName,
  contentAlign = 'center',
  contentSideOffset = 4,
  contentCollisionPadding = 16,
}: {
  type?: 'icon' | 'button';
  variant?: 'dropdown' | 'inline-list';
  className?: string;
  showIcon?: boolean;
  labelClassName?: string;
  contentClassName?: string;
  itemsContainerClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  checkClassName?: string;
  showCheck?: boolean;
  showChevron?: boolean;
  chevronClassName?: string;
  contentAlign?: 'start' | 'center' | 'end';
  contentSideOffset?: number;
  contentCollisionPadding?: number;
}) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const pathnameWithoutLocale = locales.reduce((path, loc) => {
    if (path === `/${loc}`) return '/';
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1) || '/';
    return path;
  }, pathname);
  const isBlogRoute =
    pathnameWithoutLocale === '/blog' || pathnameWithoutLocale.startsWith('/blog/');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isBlogRoute) {
    return null;
  }

  const handleSwitchLanguage = (value: string) => {
    if (value !== currentLocale) {
      // Update localStorage to sync with locale detector
      cacheSet('locale', value);
      router.push(pathname, {
        locale: value,
      });
    }
  };

  // Return a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    if (variant === 'inline-list') {
      return (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {Object.keys(localeNames).map((locale) => {
            const isActive = locale === currentLocale;
            const href = pathname || '/';
            return (
              <Link
                key={locale}
                href={href}
                locale={locale}
                prefetch={false}
                className={`rounded border px-2 py-1 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary'
                }`}
              >
                {localeNames[locale]}
              </Link>
            );
          })}
        </div>
      );
    }

    return (
      <Button
        variant={type === 'icon' ? 'ghost' : 'outline'}
        size="sm"
        className={
          type === 'icon'
            ? `h-auto w-auto gap-1.5 rounded-full px-3 py-2 ${className || ''}`
            : `${className || ''} hover:bg-primary/10`
        }
        disabled
      >
        {type === 'icon' ? (
          <>
            {showIcon ? <Languages size={16} /> : null}
            <span className={cn('text-xs font-medium', labelClassName)}>
              {localeNames[currentLocale]}
            </span>
            {showChevron ? (
              <ChevronDown
                size={16}
                className={cn('shrink-0 opacity-70', chevronClassName)}
              />
            ) : null}
          </>
        ) : (
          <>
            {showIcon ? <Globe size={16} /> : null}
            {localeNames[currentLocale]}
          </>
        )}
      </Button>
    );
  }

  if (variant === 'inline-list') {
    return (
      <div className={`flex flex-wrap gap-2 text-xs sm:text-sm ${className || ''}`}>
        {Object.keys(localeNames).map((locale) => {
          const isActive = locale === currentLocale;
          const href = pathname || '/';
          return (
            <Link
              key={locale}
              href={href}
              locale={locale}
              prefetch={false}
              data-active={isActive ? 'true' : 'false'}
              className={`rounded border px-2 py-1 transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary'
              }`}
            >
              {localeNames[locale]}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {type === 'icon' ? (
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto w-auto gap-1.5 rounded-full px-3 py-2 ${className || ''}`}
          >
            {showIcon ? <Languages size={16} /> : null}
            <span className={cn('text-xs font-medium', labelClassName)}>
              {localeNames[currentLocale]}
            </span>
            {showChevron ? (
              <ChevronDown
                size={16}
                className={cn('shrink-0 opacity-70', chevronClassName)}
              />
            ) : null}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`${className || ''} hover:bg-primary/10`}
          >
            {showIcon ? <Globe size={16} /> : null}
            {localeNames[currentLocale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={contentAlign}
        sideOffset={contentSideOffset}
        collisionPadding={contentCollisionPadding}
        className={cn('min-w-[240px] space-y-1 p-2', contentClassName)}
      >
        <div className={cn('space-y-1', itemsContainerClassName)}>
          {Object.keys(localeNames).map((locale) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleSwitchLanguage(locale)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors duration-150 data-[highlighted]:bg-white/12 data-[highlighted]:text-white focus:bg-white/12 focus:text-white',
                itemClassName,
                locale === currentLocale ? activeItemClassName : undefined,
              )}
            >
              <span>{localeNames[locale]}</span>
              {showCheck && locale === currentLocale ? (
                <Check size={16} className={cn('text-primary', checkClassName)} />
              ) : null}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
