'use client';

import { type KeyboardEvent, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export function PricingPlanCard({
  children,
  highlighted = false,
  selected = false,
  selectable = false,
  showSelectionIndicator = false,
  badge,
  className,
  badgeClassName,
  selectionIndicatorClassName,
  onClick,
}: {
  children: ReactNode;
  highlighted?: boolean;
  selected?: boolean;
  selectable?: boolean;
  showSelectionIndicator?: boolean;
  badge?: string;
  className?: string;
  badgeClassName?: string;
  selectionIndicatorClassName?: string;
  onClick?: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!selectable || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-pressed={selectable ? selected : undefined}
      onClick={selectable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative rounded-3xl border bg-white',
        selectable && 'cursor-pointer',
        className
      )}
    >
      {badge && (
        <span
          className={cn(
            'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-widest uppercase',
            badgeClassName
          )}
        >
          {badge}
        </span>
      )}
      {showSelectionIndicator && (
        <span
          className={cn(
            'absolute right-5 top-5 inline-flex size-6 items-center justify-center rounded-full border-2 transition-all duration-200',
            selected
              ? 'border-[#5E63F2] bg-[#5E63F2] text-white scale-110'
              : 'border-[#D0D5E0] bg-white text-transparent',
            selectionIndicatorClassName
          )}
          aria-hidden="true"
        >
          <CheckCircle2 className="size-3.5" />
        </span>
      )}
      {children}
    </div>
  );
}
