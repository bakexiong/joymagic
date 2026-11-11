"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { ComponentType, RefObject } from "react";
import {
  Check,
  ChevronDown,
  Clapperboard,
  ImageIcon,
  Sparkles,
  X,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  extractCombinedAiSceneEntries,
  groupAiScenesByCategory,
  type AiSceneCategory,
} from "@/shared/lib/ai-scene-nav";
import {
  MOBILE_WORKBENCH_PROMPT_PARITY_CLASS,
  MOBILE_WORKBENCH_VIDEO_FORM_CLASS,
} from "@/shared/lib/workbench-form-overrides";
import {
  SCENE_PICKER_CARD_CLASS,
  SCENE_PICKER_CARD_IMAGE_CLASS,
  SCENE_PICKER_GRID_CLASS,
  SCENE_PICKER_MODAL_BODY_CLASS,
  SCENE_PICKER_MODAL_CONTENT_CLASS,
  SCENE_PICKER_MODAL_HEADER_CLASS,
} from "@/shared/lib/scene-picker-shared";
import { restoreWorkbenchScroll } from "@/shared/lib/workbench-scroll";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

export type GeneratorBlockProps = {
  className?: string;
};

type PreloadableGeneratorComponent = ComponentType<GeneratorBlockProps> & {
  preload?: () => Promise<unknown>;
};

export type SceneNode = {
  id: string;
  title: string;
  category?: AiSceneCategory;
  description?: string;
  url?: string;
  badge?: string;
  icon_url?: string;
  children?: ModelNode[];
};

export type ModelNode = {
  id: string;
  title: string;
  description?: string;
  url: string;
  badge?: string;
  icon_url?: string;
};

export const WORKBENCH_SHELL_CLASS =
  "bg-[#f5f5f7] text-slate-950 dark:bg-[#05060d] dark:text-white";
export const WORKBENCH_PANEL_SURFACE_CLASS = "bg-[#f5f5f7] dark:bg-[#0a0d18]";
export const WORKBENCH_FIELD_SURFACE_CLASS =
  "border-slate-200 bg-[#f0f1f4] text-slate-950 shadow-none dark:border-white/8 dark:bg-[#353d50] dark:text-white";
export const WORKBENCH_SELECT_CONTENT_CLASS =
  "border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-[#171b2b] dark:text-white";
export const WORKBENCH_SCENE_SELECT_CONTENT_CLASS =
  "rounded-[1.2rem] border-slate-200/90 bg-white/96 p-2 text-slate-950 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171b2b]/98 dark:text-white";
export const WORKBENCH_MUTED_TEXT_CLASS = "text-slate-500 dark:text-white/88";
export const WORKBENCH_FORM_OVERRIDE_CLASS = `[&&_.bg-card]:!bg-[#f5f5f7] [&&_[class*='bg-card/60']]:!bg-[#f5f5f7] [&&_.bg-background]:!bg-[#f5f5f7] [&&_[class*='bg-background/60']]:!bg-[#f5f5f7] [&&_textarea]:!bg-[#f5f5f7] [&&_textarea]:!text-slate-950 [&&_textarea]:placeholder:!text-slate-400 [&&_.text-foreground]:!text-slate-950 [&&_.text-muted-foreground]:!text-slate-500 dark:[&&_.bg-card]:!bg-[#0a0d18] dark:[&&_[class*='bg-card/60']]:!bg-[#0a0d18] dark:[&&_.bg-background]:!bg-[#0a0d18] dark:[&&_[class*='bg-background/60']]:!bg-[#0a0d18] dark:[&&_textarea]:!bg-[#0a0d18] dark:[&&_textarea]:!text-white dark:[&&_textarea]:placeholder:!text-white/38 dark:[&&_.text-foreground]:!text-white dark:[&&_.text-muted-foreground]:!text-white/62 ${MOBILE_WORKBENCH_PROMPT_PARITY_CLASS}`;
export const WORKBENCH_SCENE_TRIGGER_CLASS =
  "group h-auto min-h-16 w-full rounded-[1.1rem] border border-slate-200/90 bg-white px-4 py-3 text-left shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/80 dark:border-white/8 dark:bg-white/[0.04] dark:hover:border-white/14 dark:hover:bg-white/[0.06]";

export const DynamicBlockLoading = () => (
  <div className="flex min-h-[28rem] items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.03] text-sm text-white/64">
    Loading workspace...
  </div>
);

export function preloadFormComponent(
  url: string | undefined,
  formComponents: Record<string, PreloadableGeneratorComponent>,
) {
  if (!url) {
    return;
  }

  formComponents[url]?.preload?.();
}

function toId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getSceneCategoryMeta(category?: AiSceneCategory) {
  if (category === "Video") {
    return {
      label: "Video",
      description: "Animate, swap faces, or generate clips",
      icon: Clapperboard,
      badgeClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200",
      iconClassName: "text-emerald-600 dark:text-emerald-300",
    };
  }

  return {
    label: "Image",
    description: "Create, edit, or upscale visuals",
    icon: ImageIcon,
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-200",
    iconClassName: "text-sky-600 dark:text-sky-300",
  };
}

function normalizeItem(item: NavItem): SceneNode | ModelNode | null {
  const title = item.title || item.name || item.text;
  if (!title) return null;

  return {
    id: item.url || toId(title),
    title,
    description: item.description,
    url: item.url,
    badge: item.badge,
    icon_url: item.icon_url,
  };
}

export function extractAiScenes(
  navItems: NavItem[],
  filterCategory?: AiSceneCategory,
): SceneNode[] {
  const allItems = extractCombinedAiSceneEntries(navItems);

  if (allItems.length === 0) {
    return [];
  }

  const filteredItems = filterCategory
    ? allItems.filter((entry) => entry.category === filterCategory)
    : allItems;

  return filteredItems.reduce<SceneNode[]>((acc, entry, index) => {
    const normalized = normalizeItem(entry.item);
    if (!normalized) {
      return acc;
    }

    const children = (entry.item.children ?? []).reduce<ModelNode[]>(
      (modelAcc, child) => {
        const normalizedChild = normalizeItem(child);
        if (normalizedChild?.url) {
          modelAcc.push(normalizedChild as ModelNode);
        }
        return modelAcc;
      },
      [],
    );

    const uniqueId =
      entry.item.url ||
      entry.item.children?.[0]?.url ||
      `${toId(entry.item.title || entry.item.name || "")}-${index}`;

    acc.push({
      id: uniqueId,
      title: normalized.title,
      category: entry.category,
      description: normalized.description,
      url: normalized.url,
      badge: normalized.badge,
      icon_url: entry.item.icon_url,
      children: children.length > 0 ? children : undefined,
    });

    return acc;
  }, []);
}

export function findFirstSceneWithWorkspace(
  scenes: SceneNode[],
  preferredCategory?: AiSceneCategory,
) {
  if (preferredCategory) {
    const categoryScenes = scenes.filter(
      (scene) => scene.category === preferredCategory,
    );
    const found =
      categoryScenes.find(
        (scene) => scene.children && scene.children.length > 0,
      ) ?? categoryScenes.find((scene) => scene.url);
    if (found) return found;
  }

  return (
    scenes.find((scene) => scene.children && scene.children.length > 0) ??
    scenes.find((scene) => scene.url) ??
    null
  );
}

export function SceneSelectTriggerValue({
  scene,
  placeholder = "Choose a scene",
}: {
  scene: SceneNode | null;
  placeholder?: string;
}) {
  const meta = getSceneCategoryMeta(scene?.category);
  const Icon = meta.icon;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border",
          meta.badgeClassName,
        )}
      >
        <Icon className={cn("size-4", meta.iconClassName)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.18em] uppercase",
              meta.badgeClassName,
            )}
          >
            <Sparkles className="size-2.5" />
            {meta.label}
          </span>
        </span>
        <span className="block truncate text-[1rem] font-semibold text-slate-950 dark:text-white">
          {scene?.title || placeholder}
        </span>
      </span>
    </div>
  );
}

function SceneSelectGroup({
  title,
  scenes,
}: {
  title: AiSceneCategory;
  scenes: SceneNode[];
}) {
  const meta = getSceneCategoryMeta(title);
  const Icon = meta.icon;

  return (
    <SelectGroup>
      <SelectLabel className="px-2 pb-2 text-[0.7rem] font-semibold tracking-[0.24em] uppercase text-slate-500 dark:text-white/45">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full border",
              meta.badgeClassName,
            )}
          >
            <Icon className="size-3" />
          </span>
          {meta.label}
        </span>
      </SelectLabel>
      {scenes.map((scene) => (
        <SelectItem
          key={scene.id}
          value={scene.id}
          className="mb-1 min-h-14 rounded-[0.95rem] border border-transparent px-3 py-3 pr-8 transition-colors focus:border-slate-200 focus:bg-slate-100/80 dark:focus:border-white/10 dark:focus:bg-white/[0.06]"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border",
                meta.badgeClassName,
              )}
            >
              <Icon className={cn("size-4", meta.iconClassName)} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{scene.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-500 dark:text-white/55">
                {scene.description || meta.description}
              </span>
            </span>
          </div>
        </SelectItem>
      ))}
    </SelectGroup>
  );
}

export function renderSceneSelectItems(scenes: SceneNode[]) {
  const { imageScenes, videoScenes } = groupAiScenesByCategory(scenes);

  return (
    <>
      {imageScenes.length > 0 ? (
        <SceneSelectGroup title="Image" scenes={imageScenes} />
      ) : null}
      {imageScenes.length > 0 && videoScenes.length > 0 ? (
        <SelectSeparator className="mx-2 my-2 bg-slate-200/90 dark:bg-white/8" />
      ) : null}
      {videoScenes.length > 0 ? (
        <SceneSelectGroup title="Video" scenes={videoScenes} />
      ) : null}
    </>
  );
}

function ScenePickerDialog({
  open,
  onOpenChange,
  scenes,
  currentScene,
  title,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenes: SceneNode[];
  currentScene: SceneNode | null;
  title: string;
  onSelect: (sceneId: string) => void;
}) {
  const { imageScenes, videoScenes } = groupAiScenesByCategory(scenes);
  const [activeCategory, setActiveCategory] = useState<AiSceneCategory>(
    currentScene?.category === "Video" ? "Video" : "Image",
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveCategory(currentScene?.category === "Video" ? "Video" : "Image");
  }, [currentScene?.category, open]);

  const activeScenes =
    activeCategory === "Video" ? videoScenes : imageScenes;
  const activeMeta = getSceneCategoryMeta(activeCategory);
  const ActiveIcon = activeMeta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={SCENE_PICKER_MODAL_CONTENT_CLASS}
      >
        <DialogHeader className={SCENE_PICKER_MODAL_HEADER_CLASS}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-5 sm:gap-6">
              <DialogTitle className="shrink-0 text-[1.12rem] font-semibold tracking-tight text-[#f0f0f0] sm:text-[1.25rem]">
                Add Tools
              </DialogTitle>
              <div className="hidden h-10 w-px bg-[rgba(214,235,253,0.12)] md:block" />
              <div className="flex items-center rounded-[20px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] p-1">
                {([
                  {
                    key: "Video" as const,
                    label: "Video",
                    icon: Clapperboard,
                    count: videoScenes.length,
                  },
                  {
                    key: "Image" as const,
                    label: "Image",
                    icon: ImageIcon,
                    count: imageScenes.length,
                  },
                ] as const)
                  .filter((item) => item.count > 0)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeCategory === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveCategory(item.key)}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-[16px] px-4 py-2.5 text-[0.88rem] font-semibold transition-all duration-200",
                          isActive
                            ? "bg-white text-[#101114] shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                            : "text-white/70 hover:text-white",
                        )}
                      >
                        <Icon className="size-4.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center text-white/55 transition-colors hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <DialogDescription className="sr-only">
            Select a generation scene from the modal grid.
          </DialogDescription>
        </DialogHeader>

        <div className={SCENE_PICKER_MODAL_BODY_CLASS}>
          <div className="mb-5 flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border",
                activeMeta.badgeClassName,
              )}
            >
              <ActiveIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold tracking-[0.22em] uppercase text-[#a1a4a5]/55">
                Current Selection
              </p>
              <p className="truncate text-[0.9rem] font-medium text-white/88">
                {currentScene?.title || title}
              </p>
            </div>
          </div>

          <div className={SCENE_PICKER_GRID_CLASS}>
            {activeScenes.map((scene) => {
              const isActive = currentScene?.id === scene.id;
              const SceneIcon = getSceneCategoryMeta(scene.category).icon;

              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    onSelect(scene.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    SCENE_PICKER_CARD_CLASS,
                    isActive
                      ? "border-[rgba(214,235,253,0.24)] bg-[#141418] shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                      : "border-[rgba(214,235,253,0.12)] bg-[#121216] hover:border-[rgba(214,235,253,0.2)] hover:bg-[#15151b]",
                  )}
                >
                  <div
                    className={cn(
                      SCENE_PICKER_CARD_IMAGE_CLASS,
                      "bg-gradient-to-br from-[#2d3440] via-[#212732] to-[#171b22]",
                    )}
                  >
                    {scene.icon_url ? (
                      <img
                        src={scene.icon_url}
                        alt={scene.title}
                        className="size-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <SceneIcon className="size-16 text-white/40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#121318] via-transparent to-transparent" />
                    <div className="absolute right-2.5 top-2.5 flex size-10 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,84,196,0.9),rgba(110,34,120,0.82))] text-white shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                      {isActive ? (
                        <Check className="size-4.5" />
                      ) : (
                        <SceneIcon className="size-4.5" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
                    <p className="truncate text-[1rem] font-semibold tracking-[-0.02em] text-white">
                      {scene.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ScenePickerControl({
  scenes,
  currentScene,
  title,
  onSceneChange,
  className,
  chevronClassName,
}: {
  scenes: SceneNode[];
  currentScene: SceneNode | null;
  title: string;
  onSceneChange: (sceneId: string) => void;
  className?: string;
  chevronClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex w-full items-center gap-3 pr-3 text-left",
          WORKBENCH_SCENE_TRIGGER_CLASS,
          className,
        )}
      >
        <SceneSelectTriggerValue scene={currentScene} />
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-100 text-slate-500 transition-colors group-hover:border-slate-300 group-hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55 dark:group-hover:border-white/16 dark:group-hover:bg-white/[0.08] dark:group-hover:text-white/72",
            chevronClassName,
          )}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>
      <ScenePickerDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        scenes={scenes}
        currentScene={currentScene}
        title={title}
        onSelect={onSceneChange}
      />
    </>
  );
}

export type AiGeneratorWorkbenchProps = {
  title: string;
  scenes: SceneNode[];
  currentScene: SceneNode | null;
  currentModels: ModelNode[];
  currentModel?: ModelNode | null;
  CurrentForm?: ComponentType<GeneratorBlockProps> | null;
  viewportAnchorRef: RefObject<HTMLElement | null>;
  formRef: RefObject<HTMLDivElement | null>;
  preserveViewportOnChange?: boolean;
  onSceneChange: (sceneId: string) => void;
  onModelChange: (modelUrl: string) => void;
};

export function AiGeneratorWorkbench({
  title,
  scenes,
  currentScene,
  currentModels,
  currentModel,
  CurrentForm,
  viewportAnchorRef,
  formRef,
  preserveViewportOnChange = false,
  onSceneChange,
  onModelChange,
}: AiGeneratorWorkbenchProps) {
  const isMobile = useIsMobile();
  const isVideoScene = currentScene?.category === "Video";

  useLayoutEffect(() => {
    if (!preserveViewportOnChange) {
      return;
    }

    restoreWorkbenchScroll(viewportAnchorRef.current);
  }, [
    CurrentForm,
    currentModel?.url,
    currentScene?.id,
    preserveViewportOnChange,
    viewportAnchorRef,
  ]);

  if (isMobile) {
    return (
      <section
        ref={viewportAnchorRef}
        style={{ overflowAnchor: "none" }}
        className={cn(
          "overflow-x-hidden px-2 pb-8 pt-24 md:hidden",
          WORKBENCH_SHELL_CLASS,
        )}
      >
        <div className="mx-auto w-full max-w-full">
          <div
            className={cn(
              "overflow-hidden rounded-[1.4rem] border border-slate-200 dark:border-white/6",
              WORKBENCH_PANEL_SURFACE_CLASS,
            )}
          >
            <div className="px-4 pt-4 pb-3">
              <div className="mb-4">
                <ScenePickerControl
                  scenes={scenes}
                  currentScene={currentScene}
                  title={title}
                  onSceneChange={onSceneChange}
                  className={cn(
                    WORKBENCH_SCENE_TRIGGER_CLASS,
                  )}
                />
              </div>
              {currentModels.length > 0 ? (
                <div>
                  <p className={cn("mb-2 text-sm", WORKBENCH_MUTED_TEXT_CLASS)}>
                    Model
                  </p>
                  <Select
                    value={currentModel?.url ?? ""}
                    onValueChange={onModelChange}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-16 w-full rounded-[1rem] px-3 text-left text-sm data-[placeholder]:text-slate-400 dark:data-[placeholder]:text-white/40",
                        WORKBENCH_FIELD_SURFACE_CLASS,
                      )}
                    >
                      <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent
                      className={WORKBENCH_SELECT_CONTENT_CLASS}
                      preventCloseAutoFocus
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      {currentModels.map((model) => (
                        <SelectItem key={model.url} value={model.url}>
                          <span className="block max-w-[15rem] truncate">
                            {model.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div
              ref={formRef}
              style={{ overflowAnchor: "none" }}
              className={cn(
                "border-t border-slate-200 px-0 pt-2 pb-1 dark:border-white/6 [&&_.mx-auto]:max-w-full [&&_.mx-auto]:px-0 [&&_[class*='max-w-[92rem]']]:max-w-full [&&_[class*='min-h-[820px]']]:min-h-0 [&&_.rounded-3xl]:rounded-none [&&_.border]:border-0 [&&_.p-6]:px-4 [&&_.p-6]:pt-1 [&&_.p-6]:pb-4 [&&_.py-6]:py-0 [&&_.py-12]:py-0 [&&_.py-16]:py-0 [&&_[class*='md:py-12']]:py-0 [&&_[class*='lg:py-16']]:py-0 [&&_.mt-8]:mt-0 [&&_[class*='shadow-[0_30px_120px_-80px_rgba(0,0,0,0.8)]']]:shadow-none [&&_.space-y-6]:space-y-7 [&&_.gap-6]:gap-7 [&&_.gap-8]:gap-6 motion-reduce:[&&_*]:transition-none",
                WORKBENCH_FORM_OVERRIDE_CLASS,
                isVideoScene && MOBILE_WORKBENCH_VIDEO_FORM_CLASS,
              )}
            >
              {CurrentForm ? (
                <CurrentForm className="py-0 lg:py-0" />
              ) : (
                <div className="flex min-h-[28rem] items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-white/60">
                  No workspace is available for the current selection.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={viewportAnchorRef}
      style={{ overflowAnchor: "none" }}
      className="hidden px-2 pb-8 pt-20 text-white md:block md:px-3"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[1.75rem] border border-white/6 bg-[#0c1020] p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.95)]">
          <div className="mb-5">
            <h1 className="text-[2.1rem] leading-tight font-semibold tracking-tight text-white">
              {currentScene?.title || title}
            </h1>
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/70">
                Scene
              </p>
              <ScenePickerControl
                scenes={scenes}
                currentScene={currentScene}
                title={title}
                onSceneChange={onSceneChange}
                className={cn(
                  WORKBENCH_SCENE_TRIGGER_CLASS,
                  "border-white/8 bg-white/[0.04] hover:border-white/14 hover:bg-white/[0.06]",
                )}
                chevronClassName="border-white/10 bg-white/[0.05] text-white/55 group-hover:border-white/16 group-hover:bg-white/[0.08] group-hover:text-white/78"
              />
            </div>
          </div>

          {currentModels.length > 0 ? (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                Model
              </p>
              <Select
                value={currentModel?.url ?? ""}
                onValueChange={onModelChange}
              >
                <SelectTrigger className="h-20 rounded-[1.05rem] border-white/8 bg-white/[0.06] px-4 text-left text-base text-white data-[placeholder]:text-white/40">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent
                  className="border-white/10 bg-[#171b2b] text-white"
                  preventCloseAutoFocus
                >
                  {currentModels.map((model) => (
                    <SelectItem key={model.url} value={model.url}>
                      <div className="flex flex-col items-start">
                        <span>{model.title}</span>
                        {model.description ? (
                          <span className="text-xs text-white/55">
                            {model.description}
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div
            ref={formRef}
            style={{ overflowAnchor: "none" }}
            className="overflow-hidden rounded-[1.4rem] border border-white/6 bg-[#0a0d18]"
          >
            {CurrentForm ? (
              <CurrentForm className="py-0 lg:py-0" />
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center px-6 text-center text-sm text-white/60">
                No workspace is available for the current selection.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
