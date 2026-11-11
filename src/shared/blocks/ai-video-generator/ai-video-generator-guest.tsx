"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "@/core/i18n/navigation";
import { resolveDefaultVideoModelUrl } from "@/shared/lib/video-model-defaults";
import { captureWorkbenchScroll } from "@/shared/lib/workbench-scroll";
import type { NavItem } from "@/shared/types/blocks/common";
import type { Hero as HeroType } from "@/shared/types/blocks/landing";
import { Hero } from "@/themes/default/blocks/hero";

import {
  AiVideoGeneratorWorkbench,
  extractVideoAiScenes,
  findFirstSceneWithWorkspace,
  FORM_COMPONENTS,
} from "./ai-video-generator-shared";

export function AiVideoGeneratorGuest({
  navItems,
  title,
  heroData,
  headerNavItems,
}: {
  navItems: NavItem[];
  title: string;
  heroData?: HeroType;
  headerNavItems?: NavItem[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement | null>(null);
  const viewportAnchorRef = useRef<HTMLElement | null>(null);
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

  const handleSceneChange = (sceneId: string) => {
    const nextScene = scenes.find((scene) => scene.id === sceneId);
    if (!nextScene) return;

    const nextUrl = resolveDefaultVideoModelUrl(nextScene);
    if (nextUrl) {
      captureWorkbenchScroll(viewportAnchorRef.current);
      router.push(nextUrl, { scroll: false });
      return;
    }

    startTransition(() => {
      setSelectedSceneId(sceneId);
      setSelectedModelUrl(resolveDefaultVideoModelUrl(nextScene));
    });
  };

  const handleModelChange = (modelUrl: string) => {
    captureWorkbenchScroll(viewportAnchorRef.current);
    router.push(modelUrl, { scroll: false });
  };

  return (
    <>
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
      {heroData && headerNavItems && (
        <Hero
          hero={heroData}
          showProductTabs={false}
          headerNavItems={headerNavItems}
          showGenerator={false}
          showBackgroundGrid={false}
        />
      )}
    </>
  );
}
