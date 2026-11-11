'use client';

import { ReactNode } from 'react';
import { CopyIcon } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';

export function Copy({
  value,
  placeholder,
  metadata,
  className,
  children,
}: {
  value: string;
  placeholder?: string;
  metadata?: Record<string, any>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="min-w-0 inline-block">
          <CopyToClipboard
            text={value}
            onCopy={() => toast.success(metadata?.message ?? 'Copied')}
          >
            <div className={`flex cursor-pointer items-center gap-2 min-w-0 ${className ?? ''}`}>
              <span className="min-w-0 truncate block">{children}</span>
              <CopyIcon className="h-3 w-3 shrink-0" />
            </div>
          </CopyToClipboard>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-md">
        <p className="whitespace-pre-wrap break-words text-xs">{value}</p>
      </TooltipContent>
    </Tooltip>
  );
}
