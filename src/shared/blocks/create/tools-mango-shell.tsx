"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type MangoToolsTabItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

export function MangoToolsPageShell({
  title,
  description,
  eyebrow,
  showHero = true,
  topContent,
  tabs,
  activeTab,
  onTabChange,
  content,
  sidebar,
  mobileCta,
  mobileTabExtras,
  bottomContent,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  showHero?: boolean;
  topContent?: ReactNode;
  tabs: MangoToolsTabItem<string>[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  content: ReactNode;
  sidebar: ReactNode;
  mobileCta?: ReactNode;
  mobileTabExtras?: ReactNode;
  bottomContent?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#fff7df] px-3 py-4 text-[#23282F] sm:px-6 sm:py-6 xl:px-10 xl:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,193,0,0.3),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(167,52,238,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 border-t-2 border-[#FFC100]" />

      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-4 lg:gap-6">
        {showHero ? (
          <header className="rounded-[28px] border border-[#f1df9c] bg-[linear-gradient(135deg,#ffc100_0%,#ffd966_62%,#fff0b5_100%)] p-5 shadow-[0_18px_48px_rgba(255,193,0,0.18)] sm:p-6 lg:p-6">
            <div className="max-w-[46rem]">
              <div>
                {eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a5600] sm:text-sm">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-3 max-w-[14ch] text-[2rem] font-bold leading-[0.98] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem] lg:text-[2.95rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-[36rem] text-sm leading-6 text-[#4A5464] sm:text-[0.98rem] sm:leading-7">
                  {description}
                </p>
              </div>
            </div>
          </header>
        ) : null}

        {topContent ? <div className="min-w-0">{topContent}</div> : null}

        <div
          className={cn(
            "grid gap-4 xl:h-[calc(100dvh-6.75rem)] xl:min-h-0 xl:gap-6",
            sidebar ? "xl:grid-cols-[minmax(0,1fr)_420px]" : undefined,
          )}
        >
          <div className="min-w-0 xl:min-h-0">
            <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-3 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col">
              <div className="flex flex-col gap-3 border-b border-[#eef1f4] pb-3 sm:flex-row sm:items-center sm:justify-between">
                <MangoToolsTabBar
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                />
                <div className="flex flex-col gap-2 sm:hidden">
                  {mobileCta}
                  {mobileTabExtras}
                </div>
                <div className="hidden sm:block">{mobileTabExtras}</div>
              </div>
              <div className="mt-4 min-h-[24rem] overflow-visible xl:min-h-0 xl:flex-1 xl:overflow-hidden">
                {content}
              </div>
            </div>
          </div>

          {sidebar ? (
            <aside className="min-w-0 xl:min-h-0">
              <div className="rounded-[28px] border border-[#e8d897] bg-[linear-gradient(180deg,#fff8de_0%,#fffef5_100%)] p-3 shadow-[0_18px_42px_rgba(35,40,47,0.08)] sm:p-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col">
                {sidebar}
              </div>
            </aside>
          ) : null}
        </div>

        {bottomContent ? <div className="min-w-0">{bottomContent}</div> : null}
      </div>
    </section>
  );
}

export function MangoToolsTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: MangoToolsTabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              selected
                ? "border-[#23282F] bg-[#23282F] text-white shadow-[0_12px_28px_rgba(35,40,47,0.2)]"
                : "border-[#E5E7EB] bg-[#F5F7F9] text-[#4A5464] hover:border-[#23282F]/20 hover:bg-[#fff4c6] hover:text-[#23282F]",
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MangoPanelMessage({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#E5E7EB] bg-[#F5F7F9] px-6 text-center">
      {icon ? <div className="mb-3 text-[#666666]">{icon}</div> : null}
      <p className="text-base font-semibold text-[#23282F]">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#4A5464]">
        {description}
      </p>
    </div>
  );
}
