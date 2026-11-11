"use client";

import { ReactNode, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Image as ImageIcon,
  Layers3,
  Sparkles,
} from "lucide-react";

import { usePathname, useRouter } from "@/core/i18n/navigation";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  extractImageAiScenes,
  WORKBENCH_FIELD_SURFACE_CLASS,
  WORKBENCH_FORM_OVERRIDE_CLASS,
  WORKBENCH_MUTED_TEXT_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_SELECT_CONTENT_CLASS,
} from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import { CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

function findCurrentSelection(
  scenes: ReturnType<typeof extractImageAiScenes>,
  pathname: string,
) {
  let matchedScene = scenes[0] ?? null;
  let matchedModel = matchedScene?.children?.[0] ?? null;
  let matchedLength = -1;

  for (const scene of scenes) {
    if (
      scene.url &&
      (pathname === scene.url || pathname.startsWith(`${scene.url}/`))
    ) {
      if (scene.url.length > matchedLength) {
        matchedScene = scene;
        matchedModel = null;
        matchedLength = scene.url.length;
      }
    }

    for (const model of scene.children ?? []) {
      if (pathname === model.url || pathname.startsWith(`${model.url}/`)) {
        if (model.url.length > matchedLength) {
          matchedScene = scene;
          matchedModel = model;
          matchedLength = model.url.length;
        }
      }
    }
  }

  return {
    scene: matchedScene,
    model:
      matchedModel ||
      matchedScene?.children?.find((item) => item.url === pathname) ||
      matchedScene?.children?.[0] ||
      null,
  };
}

function getModelBadge(title?: string | null) {
  const normalized = title?.trim().toLowerCase() || "";

  if (normalized.includes("nano banana")) {
    return (
      <span className="text-[2.5rem] font-black leading-none text-white">
        G
      </span>
    );
  }

  if (normalized.includes("qwen")) {
    return <Layers3 className="size-8 text-fuchsia-300" />;
  }

  if (normalized.includes("flux")) {
    return <Sparkles className="size-8 text-cyan-300" />;
  }

  return <ImageIcon className="size-8 text-violet-300" />;
}

export function DesktopImageAiWorkbench({
  headerNavItems,
  playground,
  fallbackTitle,
}: {
  headerNavItems?: NavItem[];
  playground: ReactNode;
  fallbackTitle?: string;
}) {
  const t = useTranslations("landing.wavespeed.desktopPlayground");
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const scenes = useMemo(
    () => extractImageAiScenes(headerNavItems || []),
    [headerNavItems],
  );
  const routeSelection = useMemo(
    () => findCurrentSelection(scenes, pathname),
    [pathname, scenes],
  );

  if (isMobile || !routeSelection.scene) {
    return null;
  }

  const currentScene = routeSelection.scene;
  const currentModel = routeSelection.model;
  const currentModels = currentScene.children ?? [];
  const currentSlug =
    currentModel?.url?.split("/").filter(Boolean).pop() ||
    currentScene.url?.split("/").filter(Boolean).pop() ||
    "";
  const title = currentModel?.title || currentScene.title || fallbackTitle;
  const isImageToImageRoute = pathname.startsWith("/image-to-image");
  const toolPanelContent = (
    <div
      className={cn(
        "desktop-ai-workbench flex h-full min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-white/8 py-0 shadow-none",
        WORKBENCH_PANEL_SURFACE_CLASS,
      )}
    >
      <div className="border-b border-white/8 px-5 py-4">
        {currentModels.length > 0 ? (
          <Select
            value={currentModel?.url || currentModels[0]?.url}
            onValueChange={(modelUrl) => {
              router.push(modelUrl, { scroll: false });
            }}
          >
            <SelectTrigger
              className={cn(
                "desktop-ai-model-trigger h-auto rounded-[1.35rem] border-white/8 px-4 py-4 shadow-none",
                WORKBENCH_FIELD_SURFACE_CLASS,
              )}
            >
              <div className="flex w-full items-center gap-4 text-left">
                <div className="flex size-[4.25rem] shrink-0 items-center justify-center rounded-[1.25rem] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {getModelBadge(title)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", WORKBENCH_MUTED_TEXT_CLASS)}>
                    {t("model.label")}
                  </p>
                  <p className="truncate pt-1 text-[1.75rem] font-semibold leading-none tracking-tight text-white">
                    {title}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-white/40" />
              </div>
            </SelectTrigger>
            <SelectContent className={WORKBENCH_SELECT_CONTENT_CLASS}>
              {currentModels.map((model) => (
                <SelectItem key={model.url} value={model.url}>
                  {model.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div
            className={cn(
              "flex items-center gap-4 rounded-[1.35rem] border border-white/8 px-4 py-4",
              WORKBENCH_FIELD_SURFACE_CLASS,
            )}
          >
            <div className="flex size-[4.25rem] shrink-0 items-center justify-center rounded-[1.25rem] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {getModelBadge(title)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", WORKBENCH_MUTED_TEXT_CLASS)}>
                {t("model.label")}
              </p>
              <p className="truncate pt-1 text-[1.75rem] font-semibold leading-none tracking-tight text-white">
                {title}
              </p>
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex min-h-0 flex-1 px-5 pb-5 pt-5">
        <div
          className={cn(
            "desktop-ai-form min-h-0 flex-1 overflow-hidden [&&_.mx-auto]:max-w-full [&&_[class*='max-w-[92rem]']]:max-w-full [&&_.py-16]:py-0 [&&_[class*='lg:py-16']]:py-0",
            isImageToImageRoute
              ? "desktop-ai-form--image-to-image"
              : "desktop-ai-form--text-to-image",
            WORKBENCH_FORM_OVERRIDE_CLASS,
          )}
        >
          {playground}
        </div>
      </CardContent>
      <style jsx global>{`
          .desktop-ai-workbench .desktop-ai-model-trigger > svg {
            display: none;
          }

          .desktop-ai-workbench .desktop-ai-model-trigger {
            background: linear-gradient(
              180deg,
              rgba(18, 22, 34, 0.96),
              rgba(13, 16, 26, 0.98)
            ) !important;
          }

          .desktop-ai-form > section {
            padding: 0 !important;
            background: transparent !important;
          }

          .desktop-ai-form > section > div {
            max-width: 100% !important;
            padding: 0 !important;
          }

          .desktop-ai-form [class*="grid-cols-1"][class*="lg:grid-cols-2"] {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 0 !important;
            align-items: stretch !important;
          }

          .desktop-ai-form
            [class*="grid-cols-1"][class*="lg:grid-cols-2"]
            > :last-child {
            display: none !important;
          }

          .desktop-ai-form [class*="space-y-4"]:first-child {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.9rem !important;
            padding: 0 !important;
          }

          .desktop-ai-form [class*="hidden border"][class*="bg-muted/50"],
          .desktop-ai-form [class*="justify-center"] p.inline-flex {
            display: none !important;
          }

          .desktop-ai-form .bg-card,
          .desktop-ai-form [class*="bg-card/60"],
          .desktop-ai-form [class*="bg-card border"],
          .desktop-ai-form [class*="bg-muted/50"] {
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          .desktop-ai-form [class*="space-y-4"]:first-child > .bg-card,
          .desktop-ai-form
            [class*="space-y-4"]:first-child
            > [class*="bg-card/60"],
          .desktop-ai-form
            [class*="space-y-4"]:first-child
            > [class*="bg-muted/50"] {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.7rem !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
            padding-bottom: 1rem !important;
          }

          .desktop-ai-form [class*="space-y-4"]:first-child > .bg-card:first-child,
          .desktop-ai-form
            [class*="space-y-4"]:first-child
            > [class*="bg-card/60"]:first-child {
            gap: 0.95rem !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 1.55rem !important;
            background: linear-gradient(
              180deg,
              rgba(14, 18, 30, 0.96),
              rgba(9, 12, 20, 0.98)
            ) !important;
            padding: 1.15rem !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          }

          .desktop-ai-form [class*="space-y-4"]:first-child > :last-child {
            border-bottom: 0 !important;
            padding-bottom: 0 !important;
          }

          .desktop-ai-form [class*="bg-card border border-border rounded-md p-6 shadow-lg"],
          .desktop-ai-form [class*="bg-card border border-border rounded-lg p-6 shadow-lg"] {
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 1.55rem !important;
            background: linear-gradient(
              180deg,
              rgba(14, 18, 30, 0.96),
              rgba(9, 12, 20, 0.98)
            ) !important;
            padding: 1.2rem !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          }

          .desktop-ai-form > section > div > div:first-child {
            padding: 0 !important;
          }

          .desktop-ai-form .bg-card > label,
          .desktop-ai-form .bg-card .text-sm.font-medium.text-foreground,
          .desktop-ai-form
            .bg-card
            .text-xs.md\\:text-sm.font-semibold.text-primary {
            color: rgba(255, 255, 255, 0.88) !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
          }

          .desktop-ai-form .bg-card > label {
            margin-bottom: 0.1rem !important;
            padding: 0 0.1rem !important;
          }

          .desktop-ai-form .bg-card .text-destructive,
          .desktop-ai-form .bg-card [class*="text-muted-foreground"] {
            color: rgba(255, 255, 255, 0.44) !important;
          }

          .desktop-ai-form [class*="space-y-4"]:first-child > .bg-card:first-child > .mt-4,
          .desktop-ai-form
            [class*="space-y-4"]:first-child
            > [class*="bg-card/60"]:first-child
            > .mt-4 {
            border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
            padding-top: 1rem !important;
            margin-top: 0.95rem !important;
          }

          .desktop-ai-form .bg-card > .flex.items-center.gap-1\\.5.mb-2,
          .desktop-ai-form .bg-card > .flex.items-center.justify-between {
            margin-bottom: 0.1rem !important;
            padding: 0 0.1rem !important;
          }

          .desktop-ai-form textarea {
            min-height: 210px !important;
            border-radius: 0 !important;
            border: 0 !important;
            background: transparent !important;
            color: rgba(255, 255, 255, 0.96) !important;
            padding: 0.25rem 0 !important;
            font-size: 1.05rem !important;
            line-height: 1.8 !important;
            box-shadow: none !important;
          }

          .desktop-ai-form textarea::placeholder {
            color: rgba(255, 255, 255, 0.36) !important;
          }

          .desktop-ai-form [class*="min-h-\\[200px\\]"][class*="resize-none"][class*="border"] {
            min-height: 250px !important;
            padding: 0 !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .desktop-ai-form [role="combobox"],
          .desktop-ai-form input,
          .desktop-ai-form button[class*="rounded-sm"],
          .desktop-ai-form button[class*="rounded-md"],
          .desktop-ai-form button[class*="rounded-lg"] {
            min-height: 3.6rem !important;
            border-radius: 1rem !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            background: rgba(7, 10, 18, 0.92) !important;
            color: rgba(255, 255, 255, 0.92) !important;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
          }

          .desktop-ai-form [role="combobox"] span,
          .desktop-ai-form [role="combobox"] svg,
          .desktop-ai-form input,
          .desktop-ai-form button[class*="rounded-sm"] span {
            color: inherit !important;
          }

          .desktop-ai-form input::placeholder {
            color: rgba(255, 255, 255, 0.34) !important;
          }

          .desktop-ai-form .flex.justify-end.mt-1\\.5 {
            justify-content: flex-start !important;
            margin-top: 0.75rem !important;
          }

          .desktop-ai-form button.h-7.gap-1.px-2.text-xs.text-muted-foreground {
            height: 2.2rem !important;
            border-radius: 999px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            background: rgba(255, 255, 255, 0.03) !important;
            padding: 0 0.75rem !important;
            color: rgba(255, 255, 255, 0.76) !important;
          }

          .desktop-ai-form button[class*="w-full"][class*="bg-gradient-to-r"],
          .desktop-ai-form button.group.relative.w-full {
            min-height: 3.85rem !important;
            border-radius: 1.2rem !important;
            border: 1px solid rgba(255, 71, 194, 0.2) !important;
            background: linear-gradient(180deg, #ff2ec8, #f012af) !important;
            color: white !important;
            box-shadow:
              inset 0 -4px 0 rgba(198, 10, 139, 0.65),
              0 14px 30px rgba(240, 18, 175, 0.18) !important;
          }

          .desktop-ai-form .mt-4,
          .desktop-ai-form .mt-3,
          .desktop-ai-form .mt-2 {
            margin-top: 0.6rem !important;
          }

          .desktop-ai-form [class*="flex flex-wrap gap-2"] > button {
            min-height: 2.8rem !important;
            border-radius: 0.85rem !important;
            padding: 0.55rem 0.8rem !important;
          }

          .desktop-ai-form .bg-card > div[class*="rounded"],
          .desktop-ai-form .bg-card > div > div[class*="rounded"] {
            border-color: rgba(255, 255, 255, 0.08) !important;
            background: rgba(7, 10, 18, 0.92) !important;
            box-shadow: none !important;
          }

          .desktop-ai-form .bg-card:first-child .flex.justify-end.mt-1\\.5 {
            justify-content: flex-start !important;
            margin-top: 0.25rem !important;
          }

          .desktop-ai-form .bg-card:first-child button.h-7.gap-1.px-2.text-xs.text-muted-foreground {
            height: 2.65rem !important;
            border-radius: 999px !important;
            padding: 0 1rem !important;
            background: rgba(255, 255, 255, 0.04) !important;
          }

          .desktop-ai-form .bg-card:first-child [class*="flex flex-wrap gap-2"] {
            gap: 0.55rem !important;
          }

          .desktop-ai-form .bg-card:first-child [class*="flex flex-wrap gap-2"] > button {
            min-height: 2.95rem !important;
            border-radius: 1rem !important;
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
          }

          .desktop-ai-form .bg-card:first-child [class*="flex flex-wrap gap-2"] > button[class*="bg-primary/10"] {
            background: rgba(236, 72, 153, 0.18) !important;
            border-color: rgba(236, 72, 153, 0.45) !important;
            color: white !important;
          }

          .desktop-ai-form .text-center.text-muted-foreground,
          .desktop-ai-form .text-sm.text-muted-foreground.mt-3.text-center {
            color: rgba(255, 255, 255, 0.44) !important;
          }

          .desktop-ai-form .hidden.border.border-border.bg-muted\\/50 {
            display: none !important;
          }

          .desktop-ai-form [class*="bg-card border border-border rounded-md p-6 shadow-lg"] > label,
          .desktop-ai-form [class*="bg-card border border-border rounded-lg p-6 shadow-lg"] > label {
            font-size: 2rem !important;
            font-weight: 800 !important;
            letter-spacing: -0.04em !important;
            margin-bottom: 0.5rem !important;
          }

          .desktop-ai-form .custom-scrollbar {
            scrollbar-width: thin;
          }

          .desktop-ai-form [class*="grid gap-2"] {
            gap: 0.75rem !important;
          }

          .desktop-ai-form [class*="min-h-\\[820px\\]"] {
            min-height: 0 !important;
          }

          .desktop-ai-form--text-to-image .bg-card > label:first-child {
            margin-bottom: 0.75rem !important;
          }

          .desktop-ai-form--image-to-image
            [class*="rounded-xl"][class*="bg-card/60"],
          .desktop-ai-form--image-to-image
            [class*="rounded-2xl"][class*="bg-card/60"] {
            padding: 0.9rem !important;
          }
        `}</style>
    </div>
  );

  return (
    <CreateLayout
      navItems={headerNavItems || []}
      category="Image"
      initialTool={currentSlug}
      routingMode="direct-target"
      toolPanelContent={toolPanelContent}
    />
  );
}
