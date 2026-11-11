"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/core/i18n/navigation";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { captureWorkbenchScroll } from "@/shared/lib/workbench-scroll";
import type { NavItem } from "@/shared/types/blocks/common";
import type { Hero as HeroType } from "@/shared/types/blocks/landing";
import { Hero } from "@/themes/default/blocks/hero";

import {
  AiImageGeneratorWorkbench,
  extractImageAiScenes,
  findFirstSceneWithWorkspace,
  FORM_COMPONENTS,
} from "./ai-image-generator-shared";

export function AiImageGeneratorGuest({
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
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement | null>(null);
  const viewportAnchorRef = useRef<HTMLElement | null>(null);
  const scenes = useMemo(() => extractImageAiScenes(navItems), [navItems]);
  const defaultScene = useMemo(
    () => findFirstSceneWithWorkspace(scenes, "Image"),
    [scenes],
  );

  const urlModel = searchParams.get("model");
  const urlScene = searchParams.get("scene");
  const initialToolSlug =
    urlModel?.split("/").filter(Boolean).pop() ||
    urlScene?.split("/").filter(Boolean).pop() ||
    "";
  const [selectedSceneId, setSelectedSceneId] = useState(
    defaultScene?.id ?? "",
  );
  const [selectedModelUrl, setSelectedModelUrl] = useState(
    defaultScene?.children?.[0]?.url ?? defaultScene?.url ?? "",
  );

  useEffect(() => {
    if (!defaultScene) return;

    if (urlModel) {
      setSelectedModelUrl(urlModel);

      const sceneForModel = scenes.find((scene) => {
        if (scene.url === urlModel) return true;
        return scene.children?.some((child) => child.url === urlModel);
      });

      if (sceneForModel) {
        setSelectedSceneId(sceneForModel.id);
        return;
      }
    }

    if (urlScene) {
      const sceneForUrl =
        scenes.find(
          (scene) => scene.id === urlScene || scene.url === urlScene,
        ) ??
        scenes.find((scene) =>
          scene.children?.some((child) => child.url === urlScene),
        );

      if (sceneForUrl) {
        setSelectedSceneId(sceneForUrl.id);
        setSelectedModelUrl(
          sceneForUrl.children?.[0]?.url ?? sceneForUrl.url ?? "",
        );
        return;
      }
    }

    setSelectedSceneId(defaultScene.id);
    setSelectedModelUrl(
      defaultScene.children?.[0]?.url ?? defaultScene.url ?? "",
    );
  }, [defaultScene, scenes, urlModel, urlScene]);

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

    const nextUrl = nextScene.url || nextScene.children?.[0]?.url;
    if (nextUrl) {
      captureWorkbenchScroll(viewportAnchorRef.current);
      router.push(nextUrl, { scroll: false });
      return;
    }

    startTransition(() => {
      setSelectedSceneId(sceneId);
      setSelectedModelUrl(nextScene.children?.[0]?.url ?? "");
    });
  };

  const handleModelChange = (modelUrl: string) => {
    captureWorkbenchScroll(viewportAnchorRef.current);
    router.push(modelUrl, { scroll: false });
  };

  if (!isMobile) {
    return (
      <>
        <CreateLayout
          navItems={navItems}
          category="Image"
          initialTool={initialToolSlug}
          routingMode="direct-target"
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

  return (
    <>
      <AiImageGeneratorWorkbench
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
