import type { ReactNode } from "react";

import { landingSidebarContainerCn } from "@/shared/lib/landing-sidebar-layout-classes";

export function CanvasSectionShell({
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-y-auto bg-[#050505] text-white">
      <div
        className={landingSidebarContainerCn(
          "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10",
        )}
      >
        {action ? (
          <div className="mb-6 flex justify-end lg:mb-7">
            {action}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
