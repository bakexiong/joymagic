"use client";

import {
  ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePathname, useRouter } from "@/core/i18n/navigation";
import { useAppContext } from "@/shared/contexts/app";
import {
  FORM_COMPONENTS as IMAGE_FORM_COMPONENTS,
  preloadImageFormComponent,
} from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import {
  FORM_COMPONENTS as VIDEO_FORM_COMPONENTS,
  preloadVideoFormComponent,
} from "@/shared/blocks/ai-video-generator/ai-video-generator-shared";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { isMobileAiWorkbenchPath } from "@/shared/lib/ai-paths";
import {
  extractCombinedAiSceneEntries,
  groupAiScenesByCategory,
  type AiSceneCategory,
} from "@/shared/lib/ai-scene-nav";
import {
  captureWorkbenchScroll,
  restoreWorkbenchScroll,
} from "@/shared/lib/workbench-scroll";
import type { NavItem } from "@/shared/types/blocks/common";
import { cn } from "@/shared/lib/utils";
import {
  MOBILE_WORKBENCH_PROMPT_PARITY_CLASS,
  MOBILE_WORKBENCH_VIDEO_FORM_CLASS,
} from "@/shared/lib/workbench-form-overrides";
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

type SceneNode = {
  id: string;
  title: string;
  category?: AiSceneCategory;
  url?: string;
  children?: ModelNode[];
};

type ModelNode = {
  id: string;
  title: string;
  description?: string;
  url: string;
};

const WORKBENCH_SHELL_CLASS =
  "bg-[#f5f5f7] text-slate-950 dark:bg-[#05060d] dark:text-white";
const WORKBENCH_PANEL_SURFACE_CLASS = "bg-[#f5f5f7] dark:bg-[#0a0d18]";
const WORKBENCH_FIELD_SURFACE_CLASS =
  "border-slate-200 bg-[#f0f1f4] text-slate-950 shadow-none dark:border-white/8 dark:bg-[#353d50] dark:text-white";
const WORKBENCH_SELECT_CONTENT_CLASS =
  "border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-[#171b2b] dark:text-white";
const WORKBENCH_MUTED_TEXT_CLASS = "text-slate-500 dark:text-white/88";
const WORKBENCH_FORM_OVERRIDE_CLASS = `[&&_.bg-card]:!bg-[#f5f5f7] [&&_[class*='bg-card/60']]:!bg-[#f5f5f7] [&&_.bg-background]:!bg-[#f5f5f7] [&&_[class*='bg-background/60']]:!bg-[#f5f5f7] [&&_textarea]:!bg-[#f5f5f7] [&&_textarea]:!text-slate-950 [&&_textarea]:placeholder:!text-slate-400 [&&_.text-foreground]:!text-slate-950 [&&_.text-muted-foreground]:!text-slate-500 dark:[&&_.bg-card]:!bg-[#0a0d18] dark:[&&_[class*='bg-card/60']]:!bg-[#0a0d18] dark:[&&_.bg-background]:!bg-[#0a0d18] dark:[&&_[class*='bg-background/60']]:!bg-[#0a0d18] dark:[&&_textarea]:!bg-[#0a0d18] dark:[&&_textarea]:!text-white dark:[&&_textarea]:placeholder:!text-white/38 dark:[&&_.text-foreground]:!text-white dark:[&&_.text-muted-foreground]:!text-white/62 ${MOBILE_WORKBENCH_PROMPT_PARITY_CLASS}`;
const MOBILE_WORKBENCH_FORM_COMPONENTS = {
  ...IMAGE_FORM_COMPONENTS,
  ...VIDEO_FORM_COMPONENTS,
};

function preloadWorkbenchFormComponent(url?: string) {
  if (!url) {
    return;
  }

  preloadImageFormComponent(url);
  preloadVideoFormComponent(url);
}

function normalizeTitle(item: NavItem) {
  return item.title || item.name || item.text || "";
}

function extractImageAiScenes(navItems?: NavItem[]): SceneNode[] {
  const allItems = extractCombinedAiSceneEntries(navItems);
  if (!allItems.length) {
    return [];
  }

  return allItems.reduce<SceneNode[]>((acc, entry) => {
    const title = normalizeTitle(entry.item);
    if (!title) {
      return acc;
    }

    const children = (entry.item.children || []).reduce<ModelNode[]>(
      (modelAcc, model) => {
        const modelTitle = normalizeTitle(model);
        if (modelTitle && model.url) {
          modelAcc.push({
            id: model.url,
            title: modelTitle,
            description: model.description,
            url: model.url,
          });
        }
        return modelAcc;
      },
      [],
    );

    acc.push({
      id: entry.item.url || children[0]?.url || title,
      title,
      category: entry.category,
      url: entry.item.url,
      children: children.length > 0 ? children : undefined,
    });

    return acc;
  }, []);
}

function renderSceneSelectItems(scenes: SceneNode[]) {
  const { imageScenes, videoScenes } = groupAiScenesByCategory(scenes);

  return (
    <>
      {imageScenes.length > 0 ? (
        <SelectGroup>
          <SelectLabel>Image</SelectLabel>
          {imageScenes.map((scene) => (
            <SelectItem key={scene.id} value={scene.id}>
              {scene.title}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
      {imageScenes.length > 0 && videoScenes.length > 0 ? (
        <SelectSeparator />
      ) : null}
      {videoScenes.length > 0 ? (
        <SelectGroup>
          <SelectLabel>Video</SelectLabel>
          {videoScenes.map((scene) => (
            <SelectItem key={scene.id} value={scene.id}>
              {scene.title}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
    </>
  );
}

function findCurrentSelection(scenes: SceneNode[], pathname: string) {
  let matchedScene: SceneNode | null = null;
  let matchedModel: ModelNode | null = null;
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

    for (const model of scene.children || []) {
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
    scene: matchedScene || scenes[0] || null,
    model: matchedModel,
  };
}

export function MobileImageAiWorkbench({
  headerNavItems,
  playground,
  fallbackTitle,
  className,
}: {
  headerNavItems?: NavItem[];
  playground: ReactNode;
  fallbackTitle?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isPending } = useAppContext();
  const isMobile = useIsMobile();
  const viewportAnchorRef = useRef<HTMLElement | null>(null);
  const isMotionControlRoute = pathname.includes("/motion-control/");
  const shouldUseLocalSwitch =
    !isMotionControlRoute && (Boolean(session?.user) || isPending);

  const scenes = useMemo(
    () => extractImageAiScenes(headerNavItems),
    [headerNavItems],
  );
  const routeSelection = useMemo(
    () => findCurrentSelection(scenes, pathname),
    [pathname, scenes],
  );
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [selectedModelUrl, setSelectedModelUrl] = useState("");

  useEffect(() => {
    if (!shouldUseLocalSwitch || !routeSelection.scene) {
      return;
    }

    setSelectedSceneId(routeSelection.scene.id);
    setSelectedModelUrl(
      routeSelection.model?.url ||
        routeSelection.scene.children?.find((item) => item.url === pathname)
          ?.url ||
        routeSelection.scene.children?.[0]?.url ||
        routeSelection.scene.url ||
        "",
    );
  }, [
    pathname,
    routeSelection.model?.url,
    routeSelection.scene,
    shouldUseLocalSwitch,
  ]);

  useEffect(() => {
    if (!shouldUseLocalSwitch) {
      return;
    }

    for (const scene of scenes) {
      preloadWorkbenchFormComponent(scene.url);
      for (const model of scene.children ?? []) {
        preloadWorkbenchFormComponent(model.url);
      }
    }
  }, [scenes, shouldUseLocalSwitch]);

  const currentScene = shouldUseLocalSwitch
    ? (scenes.find((scene) => scene.id === selectedSceneId) ??
      routeSelection.scene)
    : routeSelection.scene;
  const currentModel = shouldUseLocalSwitch
    ? (currentScene?.children?.find((item) => item.url === selectedModelUrl) ??
      currentScene?.children?.[0] ??
      null)
    : routeSelection.model ||
      (currentScene?.children?.find((item) => item.url === pathname) ??
        currentScene?.children?.[0] ??
        null);
  const currentTargetUrl = currentScene?.children?.length
    ? currentModel?.url || currentScene.children[0]?.url || ""
    : currentScene?.url || "";
  const deferredTargetUrl = useDeferredValue(currentTargetUrl);
  const CurrentForm = deferredTargetUrl
    ? MOBILE_WORKBENCH_FORM_COMPONENTS[deferredTargetUrl]
    : null;
  const shouldPreserveViewport = !shouldUseLocalSwitch;
  const isVideoScene = currentScene?.category === "Video";

  useLayoutEffect(() => {
    if (!shouldPreserveViewport) {
      return;
    }

    restoreWorkbenchScroll(viewportAnchorRef.current);
  }, [pathname, shouldPreserveViewport]);

  if (!isMobile || !isMobileAiWorkbenchPath(pathname) || !currentScene) {
    return null;
  }

  const handleSceneChange = (sceneId: string) => {
    const nextScene = scenes.find((scene) => scene.id === sceneId);
    if (!nextScene) return;

    if (shouldUseLocalSwitch) {
      startTransition(() => {
        setSelectedSceneId(sceneId);
        setSelectedModelUrl(
          nextScene.children?.[0]?.url ?? nextScene.url ?? "",
        );
      });
      return;
    }

    const nextUrl = nextScene.url || nextScene.children?.[0]?.url;
    if (nextUrl) {
      captureWorkbenchScroll(viewportAnchorRef.current);
      router.push(nextUrl, { scroll: false });
    }
  };

  const handleModelChange = (modelUrl: string) => {
    if (shouldUseLocalSwitch) {
      startTransition(() => {
        setSelectedModelUrl(modelUrl);
      });
      return;
    }

    captureWorkbenchScroll(viewportAnchorRef.current);
    router.push(modelUrl, { scroll: false });
  };

  return (
    <section
      ref={viewportAnchorRef}
      style={{ overflowAnchor: "none" }}
      className={cn(
        "overflow-x-hidden px-3 pb-8 pt-14 md:hidden",
        WORKBENCH_SHELL_CLASS,
        className,
      )}
    >
      <div className="mx-auto w-full max-w-full">
        <div className={cn("rounded-[1.8rem]")}>
          <div
            className={cn(
              "overflow-hidden rounded-[1.8rem] border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)]",
              WORKBENCH_PANEL_SURFACE_CLASS,
            )}
          >
            <div className="px-4 pt-4 pb-3">
              <div className="mb-4">
                <Select
                  value={currentScene.id}
                  onValueChange={handleSceneChange}
                >
                  <SelectTrigger
                    className={cn(
                      "h-13 w-full rounded-[1rem] pr-3 pl-0 text-left text-base bg-transparent border-none shadow-none data-[placeholder]:text-slate-400 dark:bg-transparent dark:border-none dark:shadow-none dark:data-[placeholder]:text-white/40",
                    )}
                  >
                    <SelectValue placeholder="Choose a scene" />
                  </SelectTrigger>
                  <SelectContent
                    className={WORKBENCH_SELECT_CONTENT_CLASS}
                    preventCloseAutoFocus
                  >
                    {renderSceneSelectItems(scenes)}
                  </SelectContent>
                </Select>
              </div>

              {currentScene.children?.length ? (
                <div>
                  <p className={cn("mb-2 text-sm", WORKBENCH_MUTED_TEXT_CLASS)}>
                    Model
                  </p>
                  <Select
                    value={currentModel?.url || currentScene.children[0]?.url}
                    onValueChange={handleModelChange}
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
                    >
                      {currentScene.children.map((model) => (
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
              style={{ overflowAnchor: "none" }}
              className={cn(
                "border-t border-slate-200 px-0 pt-2 pb-1 dark:border-white/6 [&&_.mx-auto]:max-w-full [&&_.mx-auto]:px-0 [&&_[class*='max-w-[92rem]']]:max-w-full [&&_[class*='min-h-[820px]']]:min-h-0 [&&_.p-6]:px-4 [&&_.p-6]:pt-3 [&&_.p-6]:pb-4 [&&_.py-6]:py-0 [&&_.py-12]:py-0 [&&_.py-16]:py-0 [&&_[class*='md:py-12']]:py-0 [&&_[class*='lg:py-16']]:py-0 [&&_.mt-8]:mt-0 [&&_.space-y-6]:space-y-7 [&&_.gap-6]:gap-7 [&&_.gap-8]:gap-6 motion-reduce:[&&_*]:transition-none",
                WORKBENCH_FORM_OVERRIDE_CLASS,
                isVideoScene && MOBILE_WORKBENCH_VIDEO_FORM_CLASS,
              )}
            >
              {shouldUseLocalSwitch ? (
                CurrentForm ? (
                  <CurrentForm className="py-0 lg:py-0" />
                ) : (
                  playground
                )
              ) : (
                playground
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
