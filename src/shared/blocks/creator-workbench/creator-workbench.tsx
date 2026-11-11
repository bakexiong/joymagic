"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useLocale, useTranslations } from "next-intl";

import { defaultLocale } from "@/config/locale";
import { usePathname } from "@/core/i18n/navigation";
import { type PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import { getPlaygroundConfigByUrl } from "@/shared/blocks/desktop-playground/playground-config-registry";
import { type GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { WorkbenchMediaPanel } from "@/shared/blocks/desktop-playground/components/workbench-media-panel";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import { WorkbenchFormSkeleton } from "@/shared/blocks/common/workbench-form-skeleton";
import { useAppContext } from "@/shared/contexts/app";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { type GenerationCallbacks } from "@/shared/lib/ai-generation";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import {
  buildWorkbenchTemplateCatalog,
  filterWorkbenchTemplateSamplesByPolicy,
  restoreOriginalMediaUrls,
  type WorkbenchTemplateSamplePolicy,
  type WorkbenchTemplateItem,
} from "@/shared/lib/workbench-template-catalog";
import { resolveDefaultVideoModelUrl } from "@/shared/lib/video-model-defaults";
import type { NavItem } from "@/shared/types/blocks/common";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";

import {
  extractImageAiScenes,
  findFirstSceneWithWorkspace,
} from "../ai-image-generator/ai-image-generator-shared";

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

type GeneratedMediaState = {
  Image: GeneratedMediaItem[];
  Video: GeneratedMediaItem[];
};

type SceneOption = {
  id: string;
  label: string;
  url: string;
  iconUrl?: string;
};

type ModelOption = {
  label: string;
  url: string;
  description?: string;
  monogram: string;
  badge?: string;
  iconUrl?: string;
};

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

function getDefaultValues(config?: PlaygroundConfig) {
  if (!config) {
    return {};
  }

  const initialValues: Record<string, any> = {};
  Object.entries(config.schema).forEach(([key, field]) => {
    if (field) {
      initialValues[key] =
        key === "seed" &&
        (field.defaultValue === -1 || field.defaultValue === "-1")
          ? ""
          : field.defaultValue;
    }
  });
  return initialValues;
}

function getPreferredSceneUrl(scene: {
  url?: string;
  children?: Array<{ url: string }>;
}) {
  return resolveDefaultVideoModelUrl(scene);
}

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

export function CreatorWorkbench({
  navItems,
  title,
  initialScene,
  initialModel,
  initialPrompt,
  initialParams,
  initialRef,
  initialAuto,
  preferredModelKey,
  syncUrlOnInit = true,
  templateSamplePolicy = "default",
}: {
  navItems: NavItem[];
  title: string;
  initialScene?: string;
  initialModel?: string;
  initialPrompt?: string;
  initialParams?: string;
  initialRef?: string;
  initialAuto?: boolean;
  preferredModelKey?: string;
  syncUrlOnInit?: boolean;
  templateSamplePolicy?: WorkbenchTemplateSamplePolicy;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const tc = useTranslations("creator");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });
  const scenes = useMemo(() => extractImageAiScenes(navItems), [navItems]);
  const normalizedInitialScene = useMemo(() => {
    if (!initialScene) return "";
    try {
      return decodeURIComponent(initialScene).trim();
    } catch {
      return initialScene.trim();
    }
  }, [initialScene]);
  const normalizedInitialModel = useMemo(() => {
    if (!initialModel) return "";
    try {
      return decodeURIComponent(initialModel).trim();
    } catch {
      return initialModel.trim();
    }
  }, [initialModel]);

  const defaultScene = useMemo(() => {
    if (normalizedInitialScene) {
      const sceneByParam = scenes.find(
        (scene) => scene.id === normalizedInitialScene,
      );
      if (sceneByParam) return sceneByParam;

      // 优先精确匹配：scene.id 与 initialScene 完全相同
      // 或者 initialScene 是一个完整路径，尝试在所有场景中查找匹配的子模型
      const sceneWithMatchingChild = scenes.find((scene) =>
        scene.children?.some((child) => child.url === normalizedInitialScene),
      );
      if (sceneWithMatchingChild) return sceneWithMatchingChild;

      // 部分匹配：检查 initialScene 是否与某个场景的 URL 完全匹配（独立工具页场景）
      const sceneByUrlMatch = scenes.find(
        (scene) => scene.url === normalizedInitialScene,
      );
      if (sceneByUrlMatch) return sceneByUrlMatch;

      // 旧的部分匹配逻辑：检查 initialScene 是否包含 scene.id（保持向后兼容）
      const sceneByPartialMatch = scenes.find(
        (scene) =>
          scene.id.includes(normalizedInitialScene) ||
          normalizedInitialScene.includes(scene.id),
      );
      if (sceneByPartialMatch) return sceneByPartialMatch;

      if (normalizedInitialScene.includes("video")) {
        return findFirstSceneWithWorkspace(scenes, "Video");
      }

      if (normalizedInitialScene.includes("image")) {
        return findFirstSceneWithWorkspace(scenes, "Image");
      }
    }

    return findFirstSceneWithWorkspace(scenes, "Image");
  }, [normalizedInitialScene, scenes]);

  const defaultModelUrl = useMemo(() => {
    if (!defaultScene) return "";

    if (normalizedInitialModel && defaultScene.children) {
      const modelByKey = defaultScene.children.find((model) => {
        const modelKey = model.url?.split("/").pop();
        return modelKey === normalizedInitialModel;
      });
      if (modelByKey?.url) return modelByKey.url;

      const modelByPartialMatch = defaultScene.children.find(
        (model) =>
          model.url?.includes(normalizedInitialModel) ||
          normalizedInitialModel.includes(model.url || ""),
      );
      if (modelByPartialMatch?.url) return modelByPartialMatch.url;
    }

    return resolveDefaultVideoModelUrl(defaultScene);
  }, [defaultScene, normalizedInitialModel]);

  const [selectedSceneId, setSelectedSceneId] = useState(
    defaultScene?.id ?? "",
  );
  const [selectedModelUrl, setSelectedModelUrl] = useState(defaultModelUrl);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMediaState>({
    Image: [],
    Video: [],
  });
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);
  const [pendingReferenceImage, setPendingReferenceImage] =
    useState<ImageUploaderValue | null>(null);
  const [videoReferencePreviewItem, setVideoReferencePreviewItem] =
    useState<GeneratedMediaItem | null>(null);
  const hasSkippedInitialUrlSyncRef = useRef(false);
  const lastResolvedConfigRef = useRef<PlaygroundConfig | null>(null);
  const [configMap, setConfigMap] = useState<Record<string, PlaygroundConfig>>(
    {},
  );

  // sessionStorage 相关逻辑只在客户端执行，避免 hydration 不匹配
  const [currentValues, setCurrentValues] = useState<Record<string, any>>(() =>
    getDefaultValues(undefined),
  );

  // 跟踪当前配置是否正在加载中（用于从外部跳转过来时的 loading 状态）
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isFirstMount = useRef(true);
  const hasAutoGenerated = useRef(false);

  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    const loadCreations = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setGeneratedMedia({ Image: [], Video: [] });
          setSelectedItemIndices([]);
        }
        return;
      }

      try {
        const response = await fetch("/api/workbench/creations?limit=200");
        const result = await response.json();

        if (!response.ok || result.code !== 0) {
          throw new Error(result.message || "failed to load creations");
        }

        const items = Array.isArray(result.data?.items)
          ? (result.data.items as WorkbenchCreationRecord[]).map(
              mapCreationRecordToGeneratedItem,
            )
          : [];

        if (cancelled) return;

        setGeneratedMedia({
          Image: items.filter((item) => item.mediaKind !== "video"),
          Video: items.filter((item) => item.mediaKind === "video"),
        });
        setSelectedItemIndices([]);
      } catch {
        if (!cancelled) {
          setGeneratedMedia({ Image: [], Video: [] });
          setSelectedItemIndices([]);
        }
      }
    };

    void loadCreations();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // 初始化数据：从 URL 参数或 sessionStorage 读取
  // URL 参数优先于 sessionStorage（支持外部链接直接跳转）
  useEffect(() => {
    const defaults = getDefaultValues(undefined);
    const merged = { ...defaults };

    // URL 参数优先级最高
    if (initialPrompt) {
      merged.prompt = decodeURIComponent(initialPrompt);
    } else {
      const storedPrompt = sessionStorage.getItem("creator-initial-prompt");
      if (storedPrompt) {
        merged.prompt = storedPrompt;
        sessionStorage.removeItem("creator-initial-prompt");
      }
    }

    if (initialParams) {
      try {
        Object.assign(merged, JSON.parse(decodeURIComponent(initialParams)));
      } catch {}
    } else {
      const storedParams = sessionStorage.getItem("creator-initial-params");
      if (storedParams) {
        try {
          Object.assign(merged, JSON.parse(storedParams));
        } catch {}
        sessionStorage.removeItem("creator-initial-params");
      }
    }

    if (initialRef) {
      const entry: ImageUploaderValue = {
        id: `home-composer-ref-${Date.now()}`,
        preview: initialRef,
        url: initialRef,
        status: "uploaded",
      };
      merged.referenceImages = [entry];
    } else {
      const refUrl = sessionStorage.getItem("creator-initial-ref");
      if (refUrl) {
        sessionStorage.removeItem("creator-initial-ref");
        const entry: ImageUploaderValue = {
          id: `home-composer-ref-${Date.now()}`,
          preview: refUrl,
          url: refUrl,
          status: "uploaded",
        };
        merged.referenceImages = [entry];
      }
    }

    if (Object.keys(merged).length > 0 || merged.prompt) {
      setCurrentValues(merged);
    }

    // URL auto 参数优先，否则检查 sessionStorage
    if (initialAuto) {
      setShouldAutoGenerate(true);
    } else {
      const autoGenFlag = sessionStorage.getItem("creator-auto-generate");
      if (autoGenFlag === "1") {
        sessionStorage.removeItem("creator-auto-generate");
        setShouldAutoGenerate(true);
      }
    }
  }, [initialPrompt, initialParams, initialRef, initialAuto]);

  // 页面刷新时清空数据
  useEffect(() => {
    setGeneratedMedia({ Image: [], Video: [] });
    setSelectedItemIndices([]);
  }, []);

  useEffect(() => {
    if (!defaultScene) return;
    setSelectedSceneId(defaultScene.id);
    setSelectedModelUrl(defaultModelUrl);
  }, [defaultModelUrl, defaultScene]);

  const currentScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) ?? defaultScene,
    [defaultScene, scenes, selectedSceneId],
  );
  const currentModels = currentScene?.children ?? [];
  const orderedCurrentModels = useMemo(() => {
    if (!preferredModelKey) {
      return currentModels;
    }

    const preferred = currentModels.filter(
      (model) => model.url?.split("/").pop() === preferredModelKey,
    );
    const rest = currentModels.filter(
      (model) => model.url?.split("/").pop() !== preferredModelKey,
    );

    return [...preferred, ...rest];
  }, [currentModels, preferredModelKey]);
  const normalizedSelectedModelUrl = useMemo(() => {
    if (!selectedModelUrl) return "";
    if (selectedModelUrl.startsWith("/")) return selectedModelUrl;

    const modelByKey = currentModels.find(
      (model) => model.url?.split("/").pop() === selectedModelUrl,
    );
    return modelByKey?.url ?? selectedModelUrl;
  }, [currentModels, selectedModelUrl]);
  const currentTargetUrl =
    currentModels.length > 0
      ? normalizedSelectedModelUrl ||
        resolveDefaultVideoModelUrl(currentScene) ||
        currentModels[0]?.url ||
        ""
      : currentScene?.url || "";
  const currentModel =
    currentModels.find((model) => model.url === normalizedSelectedModelUrl) ??
    currentModels[0];
  const currentCategory = currentScene?.category ?? "Image";
  const currentPanelMedia =
    currentCategory === "Video"
      ? videoReferencePreviewItem
        ? [...generatedMedia.Video, videoReferencePreviewItem]
        : generatedMedia.Video
      : generatedMedia.Image;

  // configMap 是异步加载的，currentConfig 需要基于最新的 configMap 计算
  // 使用 useMemo 确保当 configMap 更新时 currentConfig 也会更新
  const currentConfig = useMemo(
    () => configMap[currentTargetUrl],
    [configMap, currentTargetUrl],
  );
  const activeConfig =
    currentConfig ?? lastResolvedConfigRef.current ?? undefined;
  const selectedToolSlug =
    currentTargetUrl.split("/").filter(Boolean).pop() ??
    currentScene?.id.split("/").filter(Boolean).pop() ??
    null;

  useEffect(() => {
    if (currentConfig) {
      lastResolvedConfigRef.current = currentConfig;
    }
  }, [currentConfig]);

  // 异步加载当前 URL 对应的 PlaygroundConfig
  useEffect(() => {
    if (!currentTargetUrl) return;

    if (currentConfig) {
      setIsLoadingConfig(false);
      return;
    }

    let cancelled = false;
    setIsLoadingConfig(true);
    getPlaygroundConfigByUrl(currentTargetUrl).then((cfg) => {
      if (cancelled) return;
      if (cfg) {
        setConfigMap((prev) => ({ ...prev, [currentTargetUrl]: cfg }));
      }
      if (!cancelled) {
        setIsLoadingConfig(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentConfig, currentTargetUrl]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCurrentValues(getDefaultValues(currentConfig));
  }, [currentConfig]);

  useEffect(() => {
    if (!pendingReferenceImage || !activeConfig?.schema.referenceImages) {
      return;
    }

    setCurrentValues((prev) => {
      const existingImages = Array.isArray(prev.referenceImages)
        ? (prev.referenceImages as ImageUploaderValue[])
        : [];
      const alreadyExists = existingImages.some(
        (image) => image.url === pendingReferenceImage.url,
      );

      if (alreadyExists) {
        setPendingReferenceImage(null);
        return prev;
      }

      setPendingReferenceImage(null);
      return {
        ...prev,
        referenceImages: [pendingReferenceImage],
      };
    });
  }, [activeConfig, pendingReferenceImage]);

  // 当配置加载完成且需要自动生成时，触发生成
  useEffect(() => {
    if (!currentConfig || !currentTargetUrl || !shouldAutoGenerate) return;
    if (hasAutoGenerated.current) return;
    hasAutoGenerated.current = true;

    const merged = { ...currentValues };

    // URL params 已在初始化时处理，这里只从 sessionStorage 补充读取
    if (typeof window !== "undefined" && !initialParams) {
      const storedParams = sessionStorage.getItem("creator-initial-params");
      if (storedParams) {
        try {
          const params = JSON.parse(storedParams);
          Object.assign(merged, params);
          sessionStorage.removeItem("creator-initial-params");
        } catch {
          // 忽略解析错误
        }
      }
    }

    setCurrentValues(merged);

    // 延迟等待表单渲染完成
    const timer = setTimeout(() => {
      if (merged.prompt && merged.prompt.trim()) {
        const generateBtn = document.querySelector(
          "[data-generate-btn]",
        ) as HTMLButtonElement | null;
        if (generateBtn && !generateBtn.disabled) {
          generateBtn.click();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConfig, currentTargetUrl, shouldAutoGenerate]);

  // 上传字段在开始上传时会立刻写入 values（status=uploading）。
  // 避免在上传未完成时触发 /api/ai/estimate-credits（部分场景依赖上传后的 url / 时长等参数）。
  const hasUploadingUploads = useMemo(() => {
    const schema = activeConfig?.schema || {};
    const uploadKeys = Object.entries(schema)
      .filter(([, field]) => field?.type === "upload")
      .map(([key]) => key);

    return uploadKeys.some((key) => {
      const raw = currentValues?.[key];
      const items = Array.isArray(raw) ? (raw as ImageUploaderValue[]) : [];
      return items.some((item) => item?.status === "uploading");
    });
  }, [activeConfig?.schema, currentValues]);

  const estimateParams = activeConfig?.estimateParams?.(currentValues);
  // 注意：useEstimateCredits 内部有 5 分钟内存缓存（key=apiKey+params）。
  // creator 的「切换模型」场景下，不同模型可能共享同一个 creditScenario 且 estimateParams 一样，
  // 这会导致切换模型时命中缓存，从而不触发 /api/ai/estimate-credits 网络请求。
  // 这里将当前模型 url 纳入 params（后端会忽略无关字段），确保切换模型时 cacheKey 变化。
  const estimateParamsWithModel = useMemo(() => {
    if (estimateParams === undefined) {
      // 一些模型配置没有 estimateParams（例如固定积分场景），也需要发起请求；
      // 这里至少带上模型 url，避免不同模型因同一 creditScenario 命中同一缓存。
      return { __modelUrl: currentTargetUrl };
    }

    return {
      ...(estimateParams || {}),
      __modelUrl: currentTargetUrl,
    };
  }, [estimateParams, currentTargetUrl]);

  // 如果配置没显式提供 creditScenario，则回退到默认场景（与旧逻辑一致）。
  const creditScenario =
    activeConfig?.creditScenario ?? "flux-2-klein-text-to-image";
  const { credits: requiredCredits } = useEstimateCredits(
    creditScenario,
    estimateParamsWithModel,
    // currentConfig 不存在时避免“空配置发请求”；没有上传进行中才需要估算积分
    { enabled: Boolean(activeConfig) && !hasUploadingUploads },
  );

  const sceneOptions = useMemo<SceneOption[]>(
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

  const modelOptions = useMemo<ModelOption[]>(() => {
    const options = orderedCurrentModels
      .filter((model) => Boolean(model.url))
      .map((model) => ({
        label: model.title || tc("model.untitled"),
        url: model.url,
        description: model.description,
        badge: model.badge,
        iconUrl:
          getModelVendorLogo({ url: model.url, title: model.title }).url ||
          model.icon_url,
        monogram: (model.title || tc("model.fallbackMonogram"))
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
      }));

    if (options.length > 0) {
      return options;
    }

    if (!currentTargetUrl || !currentConfig?.model?.name) {
      return [];
    }

    const fallbackLabel = currentConfig.model.name || tc("model.untitled");
    return [
      {
        label: fallbackLabel,
        url: currentTargetUrl,
        iconUrl: getModelVendorLogo({
          url: currentTargetUrl,
          title: fallbackLabel,
        }).url,
        monogram: (fallbackLabel || tc("model.fallbackMonogram"))
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
      },
    ];
  }, [currentConfig?.model?.name, currentTargetUrl, orderedCurrentModels, tc]);
  const [templateItems, setTemplateItems] = useState<WorkbenchTemplateItem[]>(
    [],
  );
  const resolvedTemplateModelLabel =
    currentModel?.title || modelOptions[0]?.label || "";

  useEffect(() => {
    if (!activeConfig || !currentTargetUrl) {
      setTemplateItems([]);
      return;
    }

    let cancelled = false;

    buildWorkbenchTemplateCatalog({
      sceneId: currentScene?.id,
      sceneLabel: currentScene?.title,
      modelUrl: currentTargetUrl,
      modelLabel: resolvedTemplateModelLabel || undefined,
      config: activeConfig,
    })
      .then((items) => {
        if (!cancelled) {
          setTemplateItems(
            filterWorkbenchTemplateSamplesByPolicy(
              items as WorkbenchTemplateItem[],
              templateSamplePolicy,
            ),
          );
        }
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
    activeConfig,
    currentScene?.id,
    currentScene?.title,
    currentTargetUrl,
    resolvedTemplateModelLabel,
    templateSamplePolicy,
  ]);

  const syncCreatorUrl = (sceneId: string, modelUrl: string) => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const externalPathname =
      locale === defaultLocale ? pathname : `/${locale}${pathname}`;
    params.set("scene", sceneId);

    const modelKey = modelUrl.split("/").filter(Boolean).pop();
    if (modelKey) {
      params.set("model", modelKey);
    } else {
      params.delete("model");
    }

    const nextQuery = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      nextQuery ? `${externalPathname}?${nextQuery}` : externalPathname,
    );
  };

  useEffect(() => {
    if (!currentScene?.id || !currentTargetUrl) {
      return;
    }

    if (!syncUrlOnInit && !hasSkippedInitialUrlSyncRef.current) {
      hasSkippedInitialUrlSyncRef.current = true;
      return;
    }

    syncCreatorUrl(currentScene.id, currentTargetUrl);
  }, [currentScene?.id, currentTargetUrl, syncUrlOnInit]);

  const handleSceneChange = (sceneId: string) => {
    const nextScene = scenes.find((scene) => scene.id === sceneId);
    if (!nextScene) return;

    const nextModelUrl = getPreferredSceneUrl(nextScene);

    startTransition(() => {
      setSelectedSceneId(sceneId);
      setSelectedModelUrl(nextModelUrl);
      setCurrentValues(getDefaultValues(configMap[nextModelUrl]));
    });

    syncCreatorUrl(sceneId, nextModelUrl);
  };

  const handleModelChange = (modelUrl: string) => {
    startTransition(() => {
      setSelectedModelUrl(modelUrl);
      setCurrentValues(getDefaultValues(configMap[modelUrl]));
    });

    syncCreatorUrl(currentScene?.id ?? selectedSceneId, modelUrl);
  };

  const handleToolSelect = (tool: NavItem) => {
    const targetUrl =
      tool.children?.find((child) => child.url)?.url || tool.url || "";
    if (!targetUrl) return;

    const matchedScene = scenes.find(
      (scene) =>
        scene.url === targetUrl ||
        scene.children?.some((model) => model.url === targetUrl),
    );
    if (!matchedScene) return;

    const nextModelUrl =
      matchedScene.children?.find((model) => model.url === targetUrl)?.url ||
      getPreferredSceneUrl(matchedScene);

    startTransition(() => {
      setSelectedSceneId(matchedScene.id);
      setSelectedModelUrl(nextModelUrl);
      setCurrentValues(getDefaultValues(configMap[nextModelUrl]));
    });

    syncCreatorUrl(matchedScene.id, nextModelUrl);
  };

  const callbacks: GenerationCallbacks = {
    checkAccess: () => checkAccess(),
    modelUrl: currentTargetUrl,
    modelLabel: currentModel?.title || modelOptions[0]?.label,
    showPricingModal: () => setIsShowPaymentModal(true),
    showSignModal: () => setIsShowSignModal(true),
    fetchUserInfo: async () => {
      await fetchUserInfo();
    },
    onStatusUpdate: () => {},
    onError: () => {},
    translateApiError: (translationKey) => tCommonApi(translationKey as any),
  };

  const handleGenerate = async (values: Record<string, any>) => {
    if (!activeConfig) {
      throw new Error(tc("errors.noWorkspace"));
    }

    setIsGenerating(true);

    try {
      const requestValues = {
        ...values,
        __modelUrl: currentTargetUrl,
        __modelLabel: currentModel?.title || modelOptions[0]?.label,
      };

      const result = await activeConfig.onGenerate(requestValues, {
        callbacks,
        t: (key: string, params?: Record<string, any>) => {
          const translated = t(key as never, params as never);
          return typeof translated === "string"
            ? translated
            : params?.defaultValue || key;
        },
        requiredCredits,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      });

      const generated =
        result.imageUrls || result.imageUrl || result.videoUrl || null;

      if (generated) {
        setGeneratedMedia((prev) => {
          const bucket = currentCategory === "Video" ? "Video" : "Image";
          const aspectRatio = currentValues.aspectRatio || "1:1";

          const newItems: GeneratedMediaItem[] = Array.isArray(generated)
            ? generated.map((url) => ({
                url,
                params: { ...currentValues },
                aspectRatio,
                createdAt: new Date().toISOString(),
                sceneId: currentScene?.id,
                modelUrl: selectedModelUrl,
              }))
            : [
                {
                  url: generated,
                  params: { ...currentValues },
                  aspectRatio,
                  createdAt: new Date().toISOString(),
                  sceneId: currentScene?.id,
                  modelUrl: selectedModelUrl,
                },
              ];

          return {
            ...prev,
            [bucket]: [...newItems, ...prev[bucket]],
          };
        });
      }

      return result;
    } finally {
      setIsGenerating(false);
    }
  };

  const configuredForm = activeConfig ? (
    activeConfig.scenarioType === "image-to-image" ||
    activeConfig.scenarioType === "image-to-video" ? (
      <ReferenceImageForm
        config={{ ...activeConfig, onGenerate: handleGenerate }}
        sceneTitle={currentScene?.title || title}
        sceneOptions={sceneOptions}
        currentSceneId={currentScene?.id}
        onSceneChange={handleSceneChange}
        onGenerate={() => {}}
        onValuesChange={setCurrentValues}
        isGenerating={isGenerating}
        requiredCredits={requiredCredits}
        modelOptions={modelOptions}
        currentModelUrl={currentTargetUrl}
        onModelChange={handleModelChange}
        values={currentValues}
      />
    ) : (
      <PromptToMediaForm
        config={{ ...activeConfig, onGenerate: handleGenerate }}
        sceneTitle={currentScene?.title || title}
        sceneOptions={sceneOptions}
        currentSceneId={currentScene?.id}
        onSceneChange={handleSceneChange}
        onGenerate={() => {}}
        onValuesChange={setCurrentValues}
        isGenerating={isGenerating}
        requiredCredits={requiredCredits}
        modelOptions={modelOptions}
        currentModelUrl={currentTargetUrl}
        onModelChange={handleModelChange}
        values={currentValues}
      />
    )
  ) : isLoadingConfig ? (
    <WorkbenchFormSkeleton />
  ) : (
    <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(11,14,24,0.98)_18%,rgba(11,14,24,1)_100%)] px-6 text-center text-sm text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.24)]">
      {tc("errors.noWorkspace")}
    </div>
  );

  const mainPanelContent = (
    <WorkbenchMediaPanel
      defaultTab={user ? "creations" : "templates"}
      isSignedIn={Boolean(user?.id)}
      templateItems={templateItems}
      onUseTemplate={(item) => {
        setCurrentValues({
          ...getDefaultValues(currentConfig),
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
          ((scene as any).children ?? [])
            .filter((model: any) => Boolean(model.url))
            .map((model: any) => ({
              value: model.url,
              label: model.title || tc("model.untitled"),
            })),
        ]),
      )}
      generatedPanelProps={{
        items: currentPanelMedia,
        isGenerating,
        mediaType: currentCategory === "Video" ? "video" : "image",
        emptyText: tc("generated.empty"),
        emptyStateTitle:
          currentCategory === "Video"
            ? t("desktopPlayground.generatedPanel.defaults.videoTitle")
            : t("desktopPlayground.generatedPanel.defaults.imageTitle"),
        emptyStateDescription:
          currentCategory === "Video"
            ? t("desktopPlayground.generatedPanel.defaults.videoDescription")
            : t("desktopPlayground.generatedPanel.defaults.imageDescription"),
        emptyStateChips: modelOptions.map((model) => model.label).slice(0, 6),
        emptyStatePreviewItems: [
          {
            label: currentScene?.title || title,
            iconUrl: currentScene?.icon_url,
          },
          {
            label:
              currentModel?.title ||
              modelOptions[0]?.label ||
              (currentCategory === "Video"
                ? t("desktopPlayground.generatedPanel.defaults.featuredVideo")
                : t("desktopPlayground.generatedPanel.defaults.featuredImage")),
            iconUrl:
              getModelVendorLogo({
                url: currentModel?.url,
                title: currentModel?.title,
              }).url || modelOptions[0]?.iconUrl,
          },
          {
            label: modelOptions[1]?.label || tc("panels.generated.titleImages"),
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
          const item = currentPanelMedia[index];

          if (currentCategory !== "Video" && item?.url) {
            const targetScene = scenes.find(
              (scene) =>
                scene.url?.startsWith("/image-to-video") ||
                scene.children?.some((child) =>
                  child.url?.startsWith("/image-to-video"),
                ),
            );

            const referenceEntry: ImageUploaderValue = {
              id: `creator-image-to-video-ref-${Date.now()}`,
              preview: item.url,
              url: item.url,
              status: "uploaded",
            };
            setPendingReferenceImage(referenceEntry);
            setVideoReferencePreviewItem({
              ...item,
              mediaKind: "image",
              params: { ...item.params, sourcePreview: true },
            });

            if (targetScene) {
              const nextModelUrl = getPreferredSceneUrl(targetScene);
              startTransition(() => {
                setSelectedSceneId(targetScene.id);
                setSelectedModelUrl(nextModelUrl);
                setCurrentValues({
                  ...getDefaultValues(configMap[nextModelUrl]),
                  referenceImages: [referenceEntry],
                });
              });

              syncCreatorUrl(targetScene.id, nextModelUrl);
            } else {
              setCurrentValues((prev) => ({
                ...prev,
                referenceImages: [referenceEntry],
              }));
            }
            return;
          }

          if (item?.sceneId && item.sceneId !== currentScene?.id) {
            const targetScene = scenes.find((s) => s.id === item.sceneId);
            if (targetScene) {
              handleSceneChange(item.sceneId);
              if (item.modelUrl && item.modelUrl !== selectedModelUrl) {
                handleModelChange(item.modelUrl);
              }
            }
          } else if (item?.modelUrl && item.modelUrl !== selectedModelUrl) {
            handleModelChange(item.modelUrl);
          }

          setCurrentValues(params);
        },
        onUpscaleItem: (index) => {
          const item = currentPanelMedia[index];
          if (currentCategory === "Video" || !item?.url) return;

          const targetScene = scenes.find(
            (scene) =>
              scene.url?.startsWith("/image-upscaler") ||
              scene.children?.some((child) =>
                child.url?.startsWith("/image-upscaler"),
              ),
          );

          const referenceEntry: ImageUploaderValue = {
            id: `creator-image-upscale-ref-${Date.now()}`,
            preview: item.url,
            url: item.url,
            status: "uploaded",
          };
          setPendingReferenceImage(referenceEntry);

          if (targetScene) {
            const nextModelUrl = getPreferredSceneUrl(targetScene);
            startTransition(() => {
              setSelectedSceneId(targetScene.id);
              setSelectedModelUrl(nextModelUrl);
              setCurrentValues({
                ...getDefaultValues(configMap[nextModelUrl]),
                referenceImages: [referenceEntry],
              });
            });

            syncCreatorUrl(targetScene.id, nextModelUrl);
          } else {
            setCurrentValues((prev) => ({
              ...prev,
              referenceImages: [referenceEntry],
            }));
          }
        },
        onDeleteItem: (index) => {
          if (currentCategory === "Video" && videoReferencePreviewItem) {
            const previewIndex = generatedMedia.Video.length;
            if (index === previewIndex) {
              setVideoReferencePreviewItem(null);
              setPendingReferenceImage(null);
              setSelectedItemIndices((prevSelected) =>
                removeSelectedIndices(prevSelected, [previewIndex]),
              );
              return;
            }
          }

          const key = currentCategory === "Video" ? "Video" : "Image";
          const item = generatedMedia[key][index];
          const creationRecordId = item?.params?.creationRecordId;
          const removeItem = () => {
            setGeneratedMedia((prev) => {
              const next = [...prev[key]];
              next.splice(index, 1);
              return { ...prev, [key]: next };
            });
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
          if (currentCategory === "Video" && videoReferencePreviewItem) {
            const previewIndex = generatedMedia.Video.length;
            const hasPreviewItem = indices.includes(previewIndex);
            const normalizedIndices = indices.filter(
              (itemIndex) => itemIndex !== previewIndex,
            );

            if (hasPreviewItem) {
              setVideoReferencePreviewItem(null);
              setPendingReferenceImage(null);
            }

            if (normalizedIndices.length === 0) {
              setSelectedItemIndices((prevSelected) =>
                removeSelectedIndices(prevSelected, indices),
              );
              return;
            }

            const removedSet = new Set(normalizedIndices);
            const key = currentCategory === "Video" ? "Video" : "Image";
            const creationIds = normalizedIndices
              .map(
                (itemIndex) =>
                  generatedMedia[key][itemIndex]?.params?.creationRecordId,
              )
              .filter((value): value is string => Boolean(value));
            const removeItems = () => {
              setGeneratedMedia((prev) => ({
                ...prev,
                [key]: prev[key].filter(
                  (_, itemIndex) => !removedSet.has(itemIndex),
                ),
              }));
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
            return;
          }

          const removedSet = new Set(indices);
          const key = currentCategory === "Video" ? "Video" : "Image";
          const creationIds = indices
            .map(
              (itemIndex) =>
                generatedMedia[key][itemIndex]?.params?.creationRecordId,
            )
            .filter((value): value is string => Boolean(value));
          const removeItems = () => {
            setGeneratedMedia((prev) => ({
              ...prev,
              [key]: prev[key].filter(
                (_, itemIndex) => !removedSet.has(itemIndex),
              ),
            }));
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
    <CreateLayout
      navItems={navItems}
      category={currentCategory}
      initialTool={selectedToolSlug ?? undefined}
      selectedToolSlug={selectedToolSlug}
      onToolSelect={handleToolSelect}
      toolPanelContent={configuredForm}
      mainPanelContent={mainPanelContent}
      variant="two-column"
    />
  );
}
