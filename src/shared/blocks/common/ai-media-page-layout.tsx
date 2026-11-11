import type { ReactNode } from "react";

import { DesktopMediaAiWorkbench } from "@/shared/blocks/common/desktop-media-ai-workbench";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import type { NavItem } from "@/shared/types/blocks/common";
import type { Hero as HeroType } from "@/shared/types/blocks/landing";
import { Hero } from "@/themes/default/blocks/hero";

const fluxStylePageThemeClass =
  "dark bg-[#050505] text-foreground [--background:oklch(0.098_0_0)] [--foreground:oklch(0.95_0_0)] [--card:oklch(0.24_0_0)] [--card-foreground:oklch(0.95_0_0)] [--popover:oklch(0.24_0_0)] [--popover-foreground:oklch(0.95_0_0)] [--muted:oklch(0.23_0_0)] [--muted-foreground:oklch(0.76_0_0)] [--accent:oklch(0.26_0_0)] [--accent-foreground:oklch(0.95_0_0)] [--border:oklch(0.34_0_0)] [--input:oklch(0.34_0_0)] [--ring:oklch(0.92_0_0)] [--primary:oklch(0.92_0_0)] [--primary-foreground:oklch(0.16_0_0)]";

interface AiMediaPageLayoutProps {
  hero: HeroType;
  headerNavItems?: NavItem[];
  playground?: ReactNode;
  playgroundConfig?: PlaygroundConfig;
  children: ReactNode;
}

export function AiMediaPageLayout({
  hero,
  headerNavItems,
  playground,
  playgroundConfig,
  children,
}: AiMediaPageLayoutProps) {
  return (
    <>
      <div
        className="min-h-screen dark"
        style={{
          background: "linear-gradient(to bottom, #0d0f14, #0f1117, #111319)",
          backgroundAttachment: "fixed",
        }}
      >
        {playground ? (
          <DesktopMediaAiWorkbench
            headerNavItems={headerNavItems}
            fallbackTitle={hero.title}
            playground={playground}
          />
        ) : playgroundConfig ? (
          <DesktopMediaAiWorkbench headerNavItems={headerNavItems} />
        ) : null}
      </div>

      <Hero
        hero={hero}
        customModule={playgroundConfig ? undefined : playground}
        showBackgroundGrid={false}
        showGenerator={!playgroundConfig}
        showDesktopWorkbench={false}
        showInlineGenerator={false}
        headerNavItems={headerNavItems}
        minHeight="360px"
        className="pt-4 pb-6 md:pt-6 md:pb-8"
      />

      <div className={fluxStylePageThemeClass}>{children}</div>
    </>
  );
}
