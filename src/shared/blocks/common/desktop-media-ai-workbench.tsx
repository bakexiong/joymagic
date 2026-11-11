"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "@/core/i18n/navigation";
import { useTranslations } from "next-intl";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import { extractImageAiScenes } from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import { extractVideoAiScenes } from "@/shared/blocks/ai-video-generator/ai-video-generator-shared";
import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { WorkbenchMediaPanel } from "@/shared/blocks/desktop-playground/components/workbench-media-panel";
import { WorkbenchFormSkeleton } from "@/shared/blocks/common/workbench-form-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import { useAppContext } from "@/shared/contexts/app";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import type { NavItem } from "@/shared/types/blocks/common";
import type {
  FieldSchema,
  PlaygroundConfig,
} from "@/shared/blocks/desktop-playground";
import { getPlaygroundConfigByUrl } from "@/shared/blocks/desktop-playground/playground-config-registry";
import type { GenerationCallbacks } from "@/shared/lib/ai-generation";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import {
  DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
  resolveDefaultVideoModelUrl,
} from "@/shared/lib/video-model-defaults";
import {
  buildWorkbenchTemplateCatalog,
  restoreOriginalMediaUrls,
  type WorkbenchTemplateItem,
} from "@/shared/lib/workbench-template-catalog";

const PromptToMediaForm = dynamic(
  () =>
    import("@/shared/blocks/desktop-playground/components/prompt-to-media-form").then(
      (mod) => mod.PromptToMediaForm,
    ),
  { loading: () => <WorkbenchFormSkeleton /> },
);

const ReferenceImageForm = dynamic(
  () =>
    import("@/shared/blocks/desktop-playground/components/reference-image-form").then(
      (mod) => mod.ReferenceImageForm,
    ),
  { loading: () => <WorkbenchFormSkeleton /> },
);

interface DesktopMediaAiWorkbenchProps {
  headerNavItems?: NavItem[];
  playgroundConfig?: PlaygroundConfig;
  playground?: ReactNode;
  fallbackTitle?: string;
  creditsScenario?: string;
  categoryOverride?: "Image" | "Video";
  initialToolOverride?: string;
  toolPanelContentOverride?: ReactNode;
  mainPanelContentOverride?: ReactNode;
}

type ModelRouteOption = {
  label: string;
  url: string;
  description?: string;
  monogram: string;
  badge?: string;
  iconUrl?: string;
};

type SceneRouteOption = {
  id: string;
  label: string;
  url: string;
  iconUrl?: string;
};

function getPreferredSceneUrl<
  TScene extends {
    url?: string;
    children?: Array<{ url: string; title?: string }>;
  },
>(scene: TScene) {
  return resolveDefaultVideoModelUrl(scene);
}

function findCurrentSelection<
  TScene extends {
    id: string;
    title: string;
    url?: string;
    children?: TModel[];
  },
  TModel extends {
    url: string;
  },
>(scenes: TScene[], pathname: string) {
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

function getGeneratedItemsStorageKey(pathname: string) {
  return `desktop-media-ai-workbench:generated-items:${pathname}`;
}

type WorkbenchCreationRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  modelUrl?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  url: string;
  createdAt: string;
};

function mapCreationRecordToGeneratedItem(
  record: WorkbenchCreationRecord,
): GeneratedMediaItem {
  let parsedParams: Record<string, any> = {};

  if (record.params) {
    try {
      const result = JSON.parse(record.params);
      if (result && typeof result === "object" && !Array.isArray(result)) {
        parsedParams = result;
      }
    } catch {
      parsedParams = {};
    }
  }

  return {
    url: record.url,
    params: {
      ...parsedParams,
      creationRecordId: record.id,
    },
    aspectRatio:
      record.aspectRatio || String(parsedParams.aspectRatio || "1:1"),
    mediaKind:
      record.mediaType === "video" || record.mediaType === "audio"
        ? (record.mediaType as "video" | "audio")
        : "image",
    createdAt: record.createdAt,
    sceneId: record.sceneId || undefined,
    modelUrl: record.modelUrl || undefined,
    prompt: record.prompt || String(parsedParams.prompt || ""),
  };
}

function getDefaultValues(config?: PlaygroundConfig) {
  if (!config) {
    return {};
  }

  const initialValues: Record<string, any> = {};
  Object.entries(config.schema).forEach(([key, field]) => {
    if (field) {
      initialValues[key] = field.defaultValue;
    }
  });
  return initialValues;
}

/**
 * DesktopMediaAiWorkbench
 *
 * 统一的桌面 AI 工作台，承载 text-to-image 和 image-to-image V2 表单
 */
export function DesktopMediaAiWorkbench({
  headerNavItems,
  playgroundConfig,
  playground,
  fallbackTitle,
  creditsScenario,
  categoryOverride,
  initialToolOverride,
  toolPanelContentOverride,
  mainPanelContentOverride,
}: DesktopMediaAiWorkbenchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setIsShowSignModal, fetchUserInfo } = useAppContext();
  const isVideoWorkbench =
    pathname.startsWith("/text-to-video") ||
    pathname.startsWith("/image-to-video") ||
    pathname.startsWith("/motion-control") ||
    pathname.startsWith("/video-face-swap") ||
    pathname.startsWith("/longcat-avatar");
  const [currentValues, setCurrentValues] = useState<Record<string, any>>(() =>
    getDefaultValues(playgroundConfig),
  );
  const [resolvedPlaygroundConfig, setResolvedPlaygroundConfig] =
    useState<PlaygroundConfig>();
  const [generatedItems, setGeneratedItems] = useState<GeneratedMediaItem[]>(
    [],
  );
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const effectivePlaygroundConfig =
    playgroundConfig || resolvedPlaygroundConfig;

  const removeSelectedIndices = (
    prevSelected: number[],
    removedIndices: number[],
  ) => {
    const sortedRemoved = [...removedIndices].sort((a, b) => a - b);
    const removedSet = new Set(sortedRemoved);

    return prevSelected
      .filter((index) => !removedSet.has(index))
      .map(
        (index) =>
          index - sortedRemoved.filter((removed) => removed < index).length,
      );
  };

  const toggleSelectedItem = (index: number) => {
    setSelectedItemIndices((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index],
    );
  };
  const imageToVideoTargetUrl = useMemo(() => {
    const videoScenes = extractVideoAiScenes(headerNavItems || []);
    const imageToVideoUrls = videoScenes
      .flatMap((scene) => [
        scene.url,
        ...(scene.children?.map((child) => child.url) ?? []),
      ])
      .filter((url): url is string =>
        Boolean(url && url.startsWith("/image-to-video/")),
      );

    return (
      imageToVideoUrls.find(
        (url) => url === DEFAULT_IMAGE_TO_VIDEO_MODEL_URL,
      ) ||
      imageToVideoUrls[0] ||
      DEFAULT_IMAGE_TO_VIDEO_MODEL_URL
    );
  }, [headerNavItems]);
  const imageUpscalerTargetUrl = useMemo(() => {
    const imageScenes = extractImageAiScenes(headerNavItems || []);
    return (
      imageScenes
        .flatMap((scene) => [
          scene.url,
          ...(scene.children?.map((child) => child.url) ?? []),
        ])
        .find((url): url is string =>
          Boolean(url && url.startsWith("/image-upscaler")),
        ) || "/image-upscaler"
    );
  }, [headerNavItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const storageKey = getGeneratedItemsStorageKey(pathname);

    const loadItems = async () => {
      const savedItems = sessionStorage.getItem(storageKey);
      let sessionItems: GeneratedMediaItem[] = [];

      if (savedItems) {
        try {
          const parsed = JSON.parse(savedItems) as GeneratedMediaItem[];
          sessionItems = Array.isArray(parsed) ? parsed : [];
        } catch {
          sessionItems = [];
        }
      }

      if (!user?.id) {
        if (!cancelled) {
          setGeneratedItems(sessionItems);
          setSelectedItemIndices([]);
        }
        return;
      }

      try {
        const mediaType = isVideoWorkbench ? "video" : "image";
        const response = await fetch(
          `/api/workbench/creations?mediaType=${encodeURIComponent(mediaType)}&limit=100`,
        );
        const result = await response.json();

        if (!response.ok || result.code !== 0) {
          throw new Error(result.message || "failed to load creations");
        }

        const remoteItems = Array.isArray(result.data?.items)
          ? (result.data.items as WorkbenchCreationRecord[]).map(
              mapCreationRecordToGeneratedItem,
            )
          : [];

        const merged = [...sessionItems];
        const seen = new Set(sessionItems.map((item) => item.url));
        remoteItems.forEach((item) => {
          if (!seen.has(item.url)) {
            merged.push(item);
            seen.add(item.url);
          }
        });

        if (!cancelled) {
          setGeneratedItems(merged);
          setSelectedItemIndices([]);
        }
      } catch {
        if (!cancelled) {
          setGeneratedItems(sessionItems);
          setSelectedItemIndices([]);
        }
      }
    };

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [isVideoWorkbench, pathname, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getGeneratedItemsStorageKey(pathname);
    if (generatedItems.length === 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(generatedItems));
  }, [generatedItems, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!effectivePlaygroundConfig?.schema.referenceImages) return;

    const refUrl = sessionStorage.getItem("creator-initial-ref");
    if (!refUrl) return;

    sessionStorage.removeItem("creator-initial-ref");
    setCurrentValues((prev) => {
      const existingImages = Array.isArray(prev.referenceImages)
        ? (prev.referenceImages as ImageUploaderValue[])
        : [];

      if (existingImages.some((item) => item?.url === refUrl)) {
        return prev;
      }

      return {
        ...prev,
        referenceImages: [
          {
            id: `desktop-media-ai-workbench-ref-${Date.now()}`,
            preview: refUrl,
            url: refUrl,
            status: "uploaded",
          } satisfies ImageUploaderValue,
        ],
      };
    });
  }, [pathname, effectivePlaygroundConfig]);

  const safeNavigate = (url: string) => {
    if (!url || url === pathname) return;

    router.push(url, { scroll: false });
  };

  const t = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const tDesktop = useTranslations("landing.wavespeed.desktopPlayground");
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const scenes = useMemo(
    () =>
      isVideoWorkbench
        ? extractVideoAiScenes(headerNavItems || [])
        : extractImageAiScenes(headerNavItems || []),
    [headerNavItems, isVideoWorkbench],
  );

  const routeSelection = useMemo(
    () => findCurrentSelection(scenes, pathname),
    [pathname, scenes],
  );
  const currentScene = routeSelection.scene;

  const currentSlug = pathname.split("/").filter(Boolean).pop() || "";
  const currentModelUrl =
    routeSelection.model?.url ||
    currentScene?.url ||
    currentScene?.children?.[0]?.url ||
    "";

  // 上传字段在开始上传时会立刻写入 values（status=uploading）。
  // 避免在上传未完成时触发 /api/ai/estimate-credits（部分场景依赖上传后的 url / 时长等参数）。
  const hasUploadingUploads = useMemo(() => {
    const schema = effectivePlaygroundConfig?.schema;
    if (!schema) return false;

    const uploadKeys = (
      Object.entries(schema) as Array<[string, FieldSchema | undefined]>
    )
      .filter(([, field]) => field?.type === "upload")
      .map(([key]) => key);

    return uploadKeys.some((key) => {
      const raw = currentValues?.[key];
      const items = Array.isArray(raw) ? (raw as ImageUploaderValue[]) : [];
      return items.some((item) => item?.status === "uploading");
    });
  }, [currentValues, effectivePlaygroundConfig?.schema]);

  const estimateParams =
    effectivePlaygroundConfig?.estimateParams?.(currentValues);
  // 注意：useEstimateCredits 内部有 5 分钟内存缓存（key=apiKey+params）。
  // 工作台「切换模型」时，不同模型可能共享同一个 creditScenario 且 estimateParams 一样，
  // 这会导致切换模型时命中缓存，从而不触发 /api/ai/estimate-credits 网络请求。
  // 这里将当前模型 url 纳入 params（后端会忽略无关字段），确保切换模型时 cacheKey 变化。
  const estimateParamsWithModel = useMemo(
    () =>
      estimateParams === undefined
        ? undefined
        : {
            ...(estimateParams || {}),
            __modelUrl: currentModelUrl,
          },
    [estimateParams, currentModelUrl],
  );
  const { credits: requiredCredits } = useEstimateCredits(
    creditsScenario ||
      effectivePlaygroundConfig?.creditScenario ||
      "flux-2-klein-text-to-image",
    estimateParamsWithModel,
    {
      debounceMs: 300,
      enabled: !hasUploadingUploads && estimateParams !== undefined,
    },
  );

  const modelOptions = useMemo<ModelRouteOption[]>(
    () =>
      (currentScene?.children ?? [])
        .filter((model) => Boolean(model.url))
        .map((model) => ({
          label: model.title || tDesktop("model.untitled"),
          url: model.url!,
          description: model.description,
          badge: model.badge,
          iconUrl:
            getModelVendorLogo({ url: model.url, title: model.title }).url ||
            model.icon_url,
          monogram: (model.title || tDesktop("model.fallbackMonogram"))
            .split(/\s+/)
            .slice(0, 2)
            .map((part: string) => part.charAt(0))
            .join("")
            .toUpperCase(),
        })),
    [currentScene, tDesktop],
  );
  const currentModelOption =
    modelOptions.find((model) => model.url === currentModelUrl) ||
    modelOptions[0];
  const effectiveConfigIdentity = effectivePlaygroundConfig
    ? `${effectivePlaygroundConfig.model.id}:${effectivePlaygroundConfig.scenarioType}`
    : null;
  const lastConfigIdentityRef = useRef<string | null>(null);
  const [templateItems, setTemplateItems] = useState<WorkbenchTemplateItem[]>(
    [],
  );

  useEffect(() => {
    if (!effectivePlaygroundConfig || !effectiveConfigIdentity) {
      lastConfigIdentityRef.current = null;
      return;
    }

    if (lastConfigIdentityRef.current === effectiveConfigIdentity) {
      return;
    }

    lastConfigIdentityRef.current = effectiveConfigIdentity;
    setCurrentValues(getDefaultValues(effectivePlaygroundConfig));
  }, [effectiveConfigIdentity, effectivePlaygroundConfig]);

  useEffect(() => {
    let cancelled = false;

    if (!effectivePlaygroundConfig || !currentModelUrl) {
      setTemplateItems([]);
      return () => {
        cancelled = true;
      };
    }

    buildWorkbenchTemplateCatalog({
      sceneId: currentScene?.id,
      sceneLabel: currentScene?.title,
      modelUrl: currentModelUrl,
      modelLabel: currentModelOption?.label,
      config: effectivePlaygroundConfig,
    })
      .then((items) => {
        if (cancelled) return;
        setTemplateItems(items as WorkbenchTemplateItem[]);
      })
      .catch(() => {
        if (!cancelled) {
          setTemplateItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentModelOption?.label,
    currentModelUrl,
    currentScene?.id,
    currentScene?.title,
    effectivePlaygroundConfig,
  ]);
  const sceneOptions = useMemo<SceneRouteOption[]>(
    () =>
      scenes
        .map((scene) => ({
          id: scene.id,
          label: scene.title,
          url: getPreferredSceneUrl(scene),
          iconUrl: scene.icon_url,
          badge: (scene as any).badge,
        }))
        .filter((scene) => Boolean(scene.url)),
    [scenes],
  );

  const category = isVideoWorkbench ? "Video" : "Image";

  useEffect(() => {
    let cancelled = false;

    if (playgroundConfig) {
      setResolvedPlaygroundConfig(playgroundConfig);
      return;
    }

    if (!currentModelUrl) {
      setResolvedPlaygroundConfig(undefined);
      return;
    }

    getPlaygroundConfigByUrl(currentModelUrl).then((config) => {
      if (!cancelled) {
        setResolvedPlaygroundConfig(config);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentModelUrl, playgroundConfig]);

  const trackedPlayground = useMemo(() => {
    if (!isValidElement(playground)) {
      return playground;
    }

    const element = playground as ReactElement<any>;
    const originalHandler = element.props?.onGenerationComplete;

    return cloneElement(element, {
      onGenerationComplete: (result: { url?: string } | undefined) => {
        if (result?.url) {
          const newItem: GeneratedMediaItem = {
            url: result.url,
            params: { ...currentValues },
            aspectRatio: currentValues.aspectRatio || "1:1",
            createdAt: new Date().toISOString(),
            sceneId: currentScene?.id,
            modelUrl: currentModelUrl,
          };
          setGeneratedItems((prev) => [newItem, ...prev]);
        }

        if (typeof originalHandler === "function") {
          originalHandler(result);
        }
      },
    });
  }, [playground, currentValues, currentScene?.id, currentModelUrl]);

  const handleToolSelect = (tool: NavItem) => {
    const targetUrl =
      tool.children?.find((child) => child.url)?.url || tool.url || "";
    if (!targetUrl || targetUrl === pathname) return;
    safeNavigate(targetUrl);
  };

  if (toolPanelContentOverride || mainPanelContentOverride) {
    return (
      <CreateLayout
        navItems={headerNavItems || []}
        category={(categoryOverride || "Image") as any}
        initialTool={initialToolOverride || currentSlug}
        selectedToolSlug={initialToolOverride || currentSlug}
        onToolSelect={handleToolSelect}
        toolPanelContent={toolPanelContentOverride}
        mainPanelContent={mainPanelContentOverride}
        variant="two-column"
      />
    );
  }

  if (!effectivePlaygroundConfig) {
    if (!trackedPlayground) {
      return null;
    }

    const currentModelLabel =
      modelOptions.find((model) => model.url === currentModelUrl)?.label ||
      currentScene?.title ||
      fallbackTitle ||
      tDesktop("model.fallbackTitle");
    const currentModelMonogram = currentModelLabel
      .split(/\s+/)
      .slice(0, 2)
      .map((part: string) => part.charAt(0))
      .join("")
      .toUpperCase();

    const customToolPanelContent = (
      <div className="desktop-ai-workbench-flux flex h-full min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_14%,rgba(16,20,31,0.99)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_70px_rgba(0,0,0,0.42)]">
        <div className="border-b border-white/12 px-5 py-4">
          {modelOptions.length > 0 ? (
            <Select
              value={currentModelUrl || modelOptions[0]?.url}
              onValueChange={(nextModelUrl) => {
                if (!nextModelUrl || nextModelUrl === currentModelUrl) return;
                safeNavigate(nextModelUrl);
              }}
            >
              <SelectTrigger className="desktop-ai-model-trigger h-auto rounded-[1.35rem] border-white/14 px-4 py-4 shadow-none">
                <div className="flex w-full items-center gap-4 text-left">
                  <div className="flex size-[4.25rem] shrink-0 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <span className="text-[2.5rem] font-black leading-none text-white">
                      {currentModelMonogram}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/55">
                      {tDesktop("model.label")}
                    </p>
                    <p className="truncate pt-1 text-[1.75rem] font-semibold leading-none tracking-tight text-white">
                      {currentModelLabel}
                    </p>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="border-white/14 bg-[#141926] text-white">
                {modelOptions.map((model) => (
                  <SelectItem key={model.url} value={model.url}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 px-5 pb-5 pt-5">
          <div className="desktop-ai-form-flux min-h-0 flex-1 overflow-y-auto [&&_.mx-auto]:max-w-full [&&_[class*='max-w-[92rem]']]:max-w-full [&&_.py-16]:py-0 [&&_[class*='lg:py-16']]:py-0">
            {trackedPlayground}
          </div>
        </div>

        <style jsx global>{`
          .desktop-ai-workbench-flux .desktop-ai-model-trigger > svg {
            display: none;
          }

          .desktop-ai-workbench-flux .desktop-ai-model-trigger {
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.12),
              rgba(20, 25, 38, 0.98)
            ) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.12),
              inset 0 0 0 1px rgba(255, 255, 255, 0.04) !important;
          }

          .desktop-ai-form-flux > section {
            padding: 0 !important;
            background: transparent !important;
          }

          .desktop-ai-form-flux > section > div {
            max-width: 100% !important;
            padding: 0 !important;
          }
        `}</style>
      </div>
    );

    return (
      <CreateLayout
        navItems={headerNavItems || []}
        category={(categoryOverride || category) as any}
        initialTool={initialToolOverride || currentSlug}
        selectedToolSlug={initialToolOverride || currentSlug}
        onToolSelect={handleToolSelect}
        toolPanelContent={customToolPanelContent}
        mainPanelContent={
          <WorkbenchMediaPanel
            defaultTab={user ? "creations" : "templates"}
            isSignedIn={Boolean(user?.id)}
            templateItems={templateItems}
            onUseTemplate={(item) => {
              setCurrentValues({
                ...getDefaultValues(effectivePlaygroundConfig),
                ...item.params,
              });
            }}
            filterTools={scenes
              .filter((scene) => Boolean(getPreferredSceneUrl(scene)))
              .map((scene) => ({
                value: scene.id,
                label: scene.title,
              }))}
            filterModelsByTool={Object.fromEntries(
              scenes.map((scene) => [
                scene.id,
                (scene.children ?? [])
                  .filter((model) => Boolean(model.url))
                  .map((model) => ({
                    value: model.url!,
                    label: model.title || tDesktop("model.untitled"),
                  })),
              ]),
            )}
            generatedPanelProps={{
              items: generatedItems,
              isGenerating: false,
              mediaType: isVideoWorkbench ? "video" : "image",
              emptyText: tDesktop("generatedPanel.empty"),
              emptyStateTitle: isVideoWorkbench
                ? tDesktop("generatedPanel.defaults.videoTitle")
                : tDesktop("generatedPanel.defaults.imageTitle"),
              emptyStateDescription: isVideoWorkbench
                ? tDesktop("generatedPanel.defaults.videoDescription")
                : tDesktop("generatedPanel.defaults.imageDescription"),
              emptyStateChips: modelOptions
                .map((model) => model.label)
                .slice(0, 6),
              emptyStatePreviewItems: [
                {
                  label: currentScene?.title || tDesktop("scene.untitled"),
                  iconUrl: currentScene?.icon_url,
                },
                {
                  label:
                    currentModelOption?.label ||
                    (isVideoWorkbench
                      ? tDesktop("generatedPanel.defaults.featuredVideo")
                      : tDesktop("generatedPanel.defaults.featuredImage")),
                  iconUrl: currentModelOption?.iconUrl,
                },
                {
                  label:
                    modelOptions[1]?.label ||
                    tDesktop("generatedPanel.titleImages"),
                  iconUrl: modelOptions[1]?.iconUrl,
                },
              ],
              modelMetaByUrl: Object.fromEntries(
                modelOptions.map((model) => [
                  model.url,
                  { label: model.label, iconUrl: model.iconUrl },
                ]),
              ),
              sceneMetaById: Object.fromEntries(
                scenes.map((scene) => [
                  scene.id,
                  { label: scene.title, iconUrl: scene.icon_url },
                ]),
              ),
              selectedIndices: selectedItemIndices,
              onClearSelection: () => setSelectedItemIndices([]),
              onToggleSelectItem: (index) => {
                toggleSelectedItem(index);
              },
              onUseItem: (index, params) => {
                const item = generatedItems[index];
                if (!isVideoWorkbench && item?.url) {
                  sessionStorage.setItem("creator-initial-ref", item.url);
                  router.push(imageToVideoTargetUrl, { scroll: false });
                  return;
                }
                setCurrentValues(params);
              },
              onUpscaleItem: (index) => {
                const item = generatedItems[index];
                if (!item?.url) return;
                sessionStorage.setItem("creator-initial-ref", item.url);
                router.push(imageUpscalerTargetUrl, { scroll: false });
              },
              onDeleteItem: (index) => {
                const item = generatedItems[index];
                const creationRecordId = item?.params?.creationRecordId;
                const removeItem = () => {
                  setGeneratedItems((prev) => prev.filter((_, i) => i !== index));
                  setSelectedItemIndices((prevSelected) =>
                    removeSelectedIndices(prevSelected, [index]),
                  );
                };

                if (creationRecordId) {
                  void fetch(`/api/workbench/creations/${creationRecordId}`, {
                    method: "DELETE",
                  }).finally(removeItem);
                  return;
                }

                removeItem();
              },
              onDeleteItems: (indices) => {
                const removedSet = new Set(indices);
                const creationIds = indices
                  .map((index) => generatedItems[index]?.params?.creationRecordId)
                  .filter((value): value is string => Boolean(value));
                const removeItems = () => {
                  setGeneratedItems((prev) =>
                    prev.filter((_, i) => !removedSet.has(i)),
                  );
                  setSelectedItemIndices((prevSelected) =>
                    removeSelectedIndices(prevSelected, indices),
                  );
                };

                if (creationIds.length > 0) {
                  void Promise.all(
                    creationIds.map((id) =>
                      fetch(`/api/workbench/creations/${id}`, {
                        method: "DELETE",
                      }),
                    ),
                  ).finally(removeItems);
                  return;
                }

                removeItems();
              },
            }}
          />
        }
        variant="two-column"
      />
    );
  }

  // Prepare callbacks for executeGeneration
  const callbacks: GenerationCallbacks = {
    checkAccess: () => checkAccess(),
    modelUrl: currentModelUrl,
    modelLabel: currentModelOption?.label,
    showPricingModal: () => setShowPricingModal(true),
    showSignModal: () => setIsShowSignModal(true),
    fetchUserInfo: async () => {
      await fetchUserInfo();
    },
    onStatusUpdate: (status) => setStatus(status),
    onError: (error) => setError(error),
    translateApiError: (translationKey) => tCommonApi(translationKey as any),
  };

  // Wrap the playground config to capture generated images and provide context
  const wrappedConfig: PlaygroundConfig = {
    ...effectivePlaygroundConfig,
    onGenerate: async (values, context) => {
      setIsGenerating(true);
      setError("");
      setStatus("");
      try {
        const requestValues = {
          ...values,
          __modelUrl: currentModelUrl,
          __modelLabel: currentModelOption?.label,
        };

        const result = await effectivePlaygroundConfig.onGenerate(requestValues, {
          callbacks,
          t: (key: string, params?: Record<string, any>) => {
            try {
              const translated = t(key as any, params as any);
              return typeof translated === "string"
                ? translated
                : params?.defaultValue || key;
            } catch {
              return params?.defaultValue || key;
            }
          },
          requiredCredits,
          remainingCredits: user?.credits?.remainingCredits ?? 0,
        });
        return result;
      } catch (err) {
        // Set error for actual API failures
        const errorMessage =
          err instanceof Error
            ? err.message
            : tDesktop("errors.generateImageFailed");
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
  };

  const sharedFormProps = {
    config: wrappedConfig,
    sceneTitle: currentScene?.title || tDesktop("scene.untitled"),
    sceneIconUrl: currentScene?.icon_url,
    sceneOptions,
    currentSceneId: currentScene?.id,
    onSceneChange: (nextSceneId: string) => {
      const nextScene = scenes.find((scene) => scene.id === nextSceneId);
      if (!nextScene) return;

      const nextUrl = getPreferredSceneUrl(nextScene);
      if (!nextUrl || nextUrl === pathname) return;

      safeNavigate(nextUrl);
    },
    isGenerating,
    requiredCredits,
    onValuesChange: setCurrentValues,
    values: currentValues,
    modelOptions,
    currentModelUrl,
    onModelChange: (nextModelUrl: string) => {
      if (!nextModelUrl || nextModelUrl === currentModelUrl) return;
      safeNavigate(nextModelUrl);
    },
    onGenerate: (generatedMedia: string | string[]) => {
      const aspectRatio = currentValues.aspectRatio || "1:1";

      if (Array.isArray(generatedMedia)) {
        const newItems = generatedMedia.map((url) => ({
          url,
          params: { ...currentValues },
          aspectRatio,
          createdAt: new Date().toISOString(),
          sceneId: currentScene?.id,
          modelUrl: currentModelUrl,
        }));
        setGeneratedItems(newItems);
        return;
      }

      const newItem: GeneratedMediaItem = {
        url: generatedMedia,
        params: { ...currentValues },
        aspectRatio,
        createdAt: new Date().toISOString(),
        sceneId: currentScene?.id,
        modelUrl: currentModelUrl,
      };
      setGeneratedItems((prev) => [newItem, ...prev]);
    },
  };

  const toolPanelContent =
    effectivePlaygroundConfig.scenarioType === "image-to-image" ||
    effectivePlaygroundConfig.scenarioType === "image-to-video" ? (
      <ReferenceImageForm {...sharedFormProps} />
    ) : (
      <PromptToMediaForm {...sharedFormProps} />
    );

  const mainPanelContent = (
    <WorkbenchMediaPanel
      defaultTab={user ? "creations" : "templates"}
      isSignedIn={Boolean(user?.id)}
      templateItems={templateItems}
      onUseTemplate={(item) => {
        setCurrentValues({
          ...getDefaultValues(effectivePlaygroundConfig),
          ...restoreOriginalMediaUrls(item.params),
        });
      }}
      filterTools={scenes
        .filter((scene) => Boolean(getPreferredSceneUrl(scene)))
        .map((scene) => ({
          value: scene.id,
          label: scene.title,
        }))}
      filterModelsByTool={Object.fromEntries(
        scenes.map((scene) => [
          scene.id,
          (scene.children ?? [])
            .filter((model) => Boolean(model.url))
            .map((model) => ({
              value: model.url!,
              label: model.title || tDesktop("model.untitled"),
            })),
        ]),
      )}
      generatedPanelProps={{
        items: generatedItems,
        isGenerating,
        mediaType: isVideoWorkbench ? "video" : "image",
        emptyText: tDesktop("generatedPanel.empty"),
        emptyStateTitle: isVideoWorkbench
          ? tDesktop("generatedPanel.defaults.videoTitle")
          : tDesktop("generatedPanel.defaults.imageTitle"),
        emptyStateDescription: isVideoWorkbench
          ? tDesktop("generatedPanel.defaults.videoDescription")
          : tDesktop("generatedPanel.defaults.imageDescription"),
        emptyStateChips: modelOptions.map((model) => model.label).slice(0, 6),
        emptyStatePreviewItems: [
          {
            label: currentScene?.title || tDesktop("scene.untitled"),
            iconUrl: currentScene?.icon_url,
          },
          {
            label:
              currentModelOption?.label ||
              (isVideoWorkbench
                ? tDesktop("generatedPanel.defaults.featuredVideo")
                : tDesktop("generatedPanel.defaults.featuredImage")),
            iconUrl: currentModelOption?.iconUrl,
          },
          {
            label:
              modelOptions[1]?.label || tDesktop("generatedPanel.titleImages"),
            iconUrl: modelOptions[1]?.iconUrl,
          },
        ],
        modelMetaByUrl: Object.fromEntries(
          modelOptions.map((model) => [
            model.url,
            { label: model.label, iconUrl: model.iconUrl },
          ]),
        ),
        sceneMetaById: Object.fromEntries(
          scenes.map((scene) => [
            scene.id,
            { label: scene.title, iconUrl: scene.icon_url },
          ]),
        ),
        selectedIndices: selectedItemIndices,
        onClearSelection: () => setSelectedItemIndices([]),
        onToggleSelectItem: (index) => {
          toggleSelectedItem(index);
        },
        onUseItem: (index, params) => {
          const item = generatedItems[index];

          if (!isVideoWorkbench && item?.url) {
            sessionStorage.setItem("creator-initial-ref", item.url);
            router.push(imageToVideoTargetUrl, { scroll: false });
            return;
          }

          if (item?.sceneId && item.sceneId !== currentScene?.id) {
            const targetScene = scenes.find((s) => s.id === item.sceneId);
            if (targetScene) {
              const targetUrl =
                item.modelUrl || getPreferredSceneUrl(targetScene);
              if (targetUrl && targetUrl !== pathname) {
                safeNavigate(targetUrl);
              }
            }
          } else if (item?.modelUrl && item.modelUrl !== currentModelUrl) {
            safeNavigate(item.modelUrl);
          }

          setCurrentValues(params);
        },
        onUpscaleItem: (index) => {
          const item = generatedItems[index];
          if (!item?.url) return;
          sessionStorage.setItem("creator-initial-ref", item.url);
          router.push(imageUpscalerTargetUrl, { scroll: false });
        },
        onDeleteItem: (index) => {
          const item = generatedItems[index];
          const creationRecordId = item?.params?.creationRecordId;
          const removeItem = () => {
            setGeneratedItems((prev) => prev.filter((_, i) => i !== index));
            setSelectedItemIndices((prevSelected) =>
              removeSelectedIndices(prevSelected, [index]),
            );
          };

          if (creationRecordId) {
            void fetch(`/api/workbench/creations/${creationRecordId}`, {
              method: "DELETE",
            }).finally(removeItem);
            return;
          }

          removeItem();
        },
        onDeleteItems: (indices) => {
          const removedSet = new Set(indices);
          const creationIds = indices
            .map((index) => generatedItems[index]?.params?.creationRecordId)
            .filter((value): value is string => Boolean(value));
          const removeItems = () => {
            setGeneratedItems((prev) =>
              prev.filter((_, i) => !removedSet.has(i)),
            );
            setSelectedItemIndices((prevSelected) =>
              removeSelectedIndices(prevSelected, indices),
            );
          };

          if (creationIds.length > 0) {
            void Promise.all(
              creationIds.map((id) =>
                fetch(`/api/workbench/creations/${id}`, {
                  method: "DELETE",
                }),
              ),
            ).finally(removeItems);
            return;
          }

          removeItems();
        },
      }}
    />
  );

  return (
    <>
      <CreateLayout
        navItems={headerNavItems || []}
        category={(categoryOverride || category) as any}
        initialTool={currentSlug}
        selectedToolSlug={currentSlug}
        onToolSelect={handleToolSelect}
        toolPanelContent={toolPanelContent}
        mainPanelContent={mainPanelContentOverride || mainPanelContent}
        variant="two-column"
      />
    </>
  );
}
