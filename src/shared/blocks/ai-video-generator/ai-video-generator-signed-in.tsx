"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { NavItem } from "@/shared/types/blocks/common";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { resolveDefaultVideoModelUrl } from "@/shared/lib/video-model-defaults";
import { MOBILE_WORKBENCH_VIDEO_FORM_CLASS } from "@/shared/lib/workbench-form-overrides";
import {
  captureWorkbenchScroll,
  restoreWorkbenchScroll,
} from "@/shared/lib/workbench-scroll";
import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import {
  AiVideoGeneratorWorkbench,
  WORKBENCH_FORM_OVERRIDE_CLASS,
  WORKBENCH_MUTED_TEXT_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_SHELL_CLASS,
  WORKBENCH_FIELD_SURFACE_CLASS,
  WORKBENCH_SELECT_CONTENT_CLASS,
  ScenePickerControl,
  extractVideoAiScenes,
  findFirstSceneWithWorkspace,
  FORM_COMPONENTS,
} from "./ai-video-generator-shared";

export function AiVideoGeneratorSignedIn({
  navItems,
  title,
}: {
  navItems: NavItem[];
  title: string;
}) {
  const formRef = useRef<HTMLDivElement | null>(null);
  const viewportAnchorRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const scenes = useMemo(() => extractVideoAiScenes(navItems), [navItems]);
  const defaultScene = useMemo(
    () => findFirstSceneWithWorkspace(scenes, "Video"),
    [scenes],
  );

  const [selectedSceneId, setSelectedSceneId] = useState(
    defaultScene?.id ?? "",
  );
  const [selectedModelUrl, setSelectedModelUrl] = useState(
    resolveDefaultVideoModelUrl(defaultScene),
  );

  useEffect(() => {
    if (!defaultScene) return;
    setSelectedSceneId(defaultScene.id);
    setSelectedModelUrl(resolveDefaultVideoModelUrl(defaultScene));
  }, [defaultScene]);

  const currentScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) ?? defaultScene,
    [defaultScene, scenes, selectedSceneId],
  );
  const currentModels = currentScene?.children ?? [];
  const currentTargetUrl =
    currentModels.length > 0
      ? selectedModelUrl || currentModels[0]?.url || ""
      : currentScene?.url || "";
  const deferredTargetUrl = useDeferredValue(currentTargetUrl);
  const CurrentForm = deferredTargetUrl
    ? FORM_COMPONENTS[deferredTargetUrl]
    : null;
  const currentModel =
    currentModels.find((model) => model.url === selectedModelUrl) ??
    currentModels[0];
  const isVideoScene = currentScene?.category === "Video";

  const handleSceneChange = (sceneId: string) => {
    captureWorkbenchScroll(viewportAnchorRef.current);

    const nextScene = scenes.find((scene) => scene.id === sceneId);
    if (!nextScene) return;

    startTransition(() => {
      setSelectedSceneId(sceneId);
      setSelectedModelUrl(resolveDefaultVideoModelUrl(nextScene));
    });
  };

  const handleModelChange = (modelUrl: string) => {
    captureWorkbenchScroll(viewportAnchorRef.current);

    startTransition(() => {
      setSelectedModelUrl(modelUrl);
    });
  };

  useLayoutEffect(() => {
    if (!isMobile) {
      return;
    }

    restoreWorkbenchScroll(viewportAnchorRef.current);
  }, [CurrentForm, currentModel?.url, currentScene?.id, isMobile]);

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
          <div className="rounded-[1.5rem]">
            <div
              className={cn(
                "overflow-hidden rounded-[1.2rem] border border-slate-200 dark:border-white/6",
                WORKBENCH_PANEL_SURFACE_CLASS,
              )}
            >
              <div className="px-4 pt-4 pb-3">
                <div className="mb-4">
                  <ScenePickerControl
                    scenes={scenes}
                    currentScene={currentScene}
                    title={title}
                    onSceneChange={handleSceneChange}
                  />
                </div>
                {currentModels.length > 0 ? (
                  <div>
                    <p
                      className={cn("mb-2 text-sm", WORKBENCH_MUTED_TEXT_CLASS)}
                    >
                      Model
                    </p>
                    <Select
                      value={currentModel?.url ?? ""}
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
        </div>
      </section>
    );
  }

  return (
    <AiVideoGeneratorWorkbench
      title={title}
      scenes={scenes}
      currentScene={currentScene}
      currentModels={currentModels}
      currentModel={currentModel}
      CurrentForm={CurrentForm}
      viewportAnchorRef={viewportAnchorRef}
      formRef={formRef}
      preserveViewportOnChange
      onSceneChange={handleSceneChange}
      onModelChange={handleModelChange}
    />
  );
}
