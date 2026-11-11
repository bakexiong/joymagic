"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/core/i18n/navigation";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { isMobileAiWorkbenchPath } from "@/shared/lib/ai-paths";
import { cn } from "@/shared/lib/utils";

export function MobileImageAiPostWorkbenchShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const shouldForceDark = isMobile && isMobileAiWorkbenchPath(pathname);
  const isGraphiteLanding = pathname === "/text-to-image/flux-2-klein";

  return (
    <div
      className={cn(
        shouldForceDark &&
          (isGraphiteLanding
            ? "dark bg-[#050505] text-foreground [--background:oklch(0.098_0_0)] [--foreground:oklch(0.95_0_0)] [--card:oklch(0.24_0_0)] [--card-foreground:oklch(0.95_0_0)] [--popover:oklch(0.24_0_0)] [--popover-foreground:oklch(0.95_0_0)] [--sidebar:oklch(0.24_0_0)] [--muted:oklch(0.23_0_0)] [--muted-foreground:oklch(0.76_0_0)] [--accent:oklch(0.26_0_0)] [--accent-foreground:oklch(0.95_0_0)] [--border:oklch(0.34_0_0)] [--input:oklch(0.34_0_0)] [--ring:oklch(0.92_0_0)] [--primary:oklch(0.92_0_0)] [--primary-foreground:oklch(0.16_0_0)]"
            : "dark bg-[#05060d] text-white [--background:oklch(0.2077_0.0398_265.7549)] [--card:oklch(0.2795_0.0368_260.031)] [--popover:oklch(0.2795_0.0368_260.031)] [--sidebar:oklch(0.2795_0.0368_260.031)]"),
        className,
      )}
    >
      {children}
    </div>
  );
}
