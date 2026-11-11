import { getPlaygroundConfigByUrl } from "@/shared/blocks/desktop-playground/playground-config-registry";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground/types/playground-config";
import {
  TOOL_LIBRARY_OVERRIDES,
  type ToolLibraryOverrideDefinition,
} from "@/shared/lib/fixed-tools-library";
import {
  buildWorkbenchSceneTemplateCatalog,
  type WorkbenchTemplateItem,
} from "@/shared/lib/workbench-template-catalog";
import {
  DEFAULT_IMAGE_TO_IMAGE_MODEL_URL,
  DEFAULT_TEXT_TO_IMAGE_MODEL_URL,
} from "@/shared/services/canvas-agent/canvas-agent-scene-router";
import { DEFAULT_IMAGE_TO_VIDEO_MODEL_URL } from "@/shared/lib/video-model-defaults";
import type { NavItem } from "@/shared/types/blocks/common";

const TOOL_ALIAS_TO_SCENE_PATH: Record<string, string> = {
  "text-to-image": "/text-to-image",
  "image-to-image": "/image-to-image",
  "text-to-video": "/text-to-video",
  "image-to-video": "/image-to-video",
  photoshoot: "/image-to-image",
  "editor-combiner": "/image-to-image",
  "image-effect": "/image-to-image",
  "image-effects": "/image-to-image",
  variations: "/image-to-image",
  "video-effect": "/image-to-video",
  "video-effects": "/image-to-video",
};

const TOOL_ALIAS_TO_LABEL: Record<string, string> = {
  photoshoot: "PhotoShoot",
  "editor-combiner": "Editor & Combiner",
  "image-effect": "Image Effects",
  "image-effects": "Image Effects",
  variations: "Variations",
  "video-effect": "Video Effects",
  "video-effects": "Video Effects",
};

function normalizeToolParam(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function normalizeToolAlias(value: string) {
  return normalizeToolParam(value).split("/")[0] || "";
}

function getAliasedToolSlug(toolParam: string, aliases: string[]) {
  const normalized = normalizeToolParam(toolParam);
  if (!normalized) return null;

  const [alias, slug] = normalized.split("/");
  if (!aliases.includes(alias) || !slug) {
    return null;
  }

  return slug;
}

function parseToolParam(toolParam: string) {
  const normalized = toolParam.trim().replace(/^\/+|\/+$/g, "");
  const aliasedScenePath = TOOL_ALIAS_TO_SCENE_PATH[normalized];

  if (aliasedScenePath) {
    return {
      scenePath: aliasedScenePath,
      modelSlug: "",
    };
  }

  if (!normalized) {
    return {
      scenePath: undefined,
      modelSlug: "",
    };
  }

  if (!normalized.includes("~")) {
    return {
      scenePath: undefined,
      modelSlug: normalized,
    };
  }

  const [sceneKey, ...rest] = normalized.split("~");
  return {
    scenePath: sceneKey ? `/${sceneKey.replace(/^\/+/, "")}` : undefined,
    modelSlug: rest.join("~").trim(),
  };
}

function mapSceneItems(items: NavItem[]): NavItem[] {
  return items
    .map((item) => {
      const firstChild =
        item.children?.find((child) => child.url) || item.children?.[0];
      const derivedSceneUrl = firstChild?.url
        ? `/${firstChild.url.split("/").filter(Boolean).slice(0, -1).join("/")}`
        : undefined;

      return {
        ...item,
        url: item.url || derivedSceneUrl || firstChild?.url,
        description: item.description || firstChild?.description,
        badge: item.badge || firstChild?.badge,
        icon: item.icon || firstChild?.icon,
        icon_url: item.icon_url || firstChild?.icon_url,
      };
    })
    .filter((item) => Boolean(item.url));
}

function isHiddenAiScene(item?: NavItem) {
  if (!item) return false;
  const url = `${item.url || item.children?.[0]?.url || ""}`.toLowerCase();
  const title = `${item.title || ""} ${item.name || ""}`.toLowerCase();

  return (
    url.includes("/video-face-swap") ||
    url.includes("video-face-swap") ||
    title.includes("video face swap")
  );
}

function getToolSlug(tool?: NavItem | null) {
  return tool?.url?.split("/").filter(Boolean).pop() || "";
}

function sceneContainsSlug(scene: NavItem, slug: string | null) {
  if (!slug) return false;
  if (getToolSlug(scene) === slug) return true;
  return scene.children?.some((child) => getToolSlug(child) === slug) || false;
}

function findCurrentScene(navItems: NavItem[], toolSlug: string) {
  const { scenePath, modelSlug } = parseToolParam(toolSlug);
  const imageRoot = navItems.find((item) => item.icon === "Image");
  const videoRoot = navItems.find((item) => item.icon === "Video");
  const imageScenes = imageRoot?.children
    ? mapSceneItems(imageRoot.children)
    : [];
  const videoScenes = videoRoot?.children
    ? mapSceneItems(videoRoot.children)
    : [];
  const allScenes = [
    ...imageScenes.map((scene) => ({ category: "Image" as const, scene })),
    ...videoScenes.map((scene) => ({ category: "Video" as const, scene })),
  ];
  const matchedEntry =
    allScenes.find((entry) => {
      if (scenePath) {
        if (entry.scene.url === scenePath) {
          return true;
        }

        return (
          entry.scene.children?.some((child) => {
            if (!child.url) return false;
            return (
              child.url.startsWith(`${scenePath}/`) &&
              getToolSlug(child) === modelSlug
            );
          }) || false
        );
      }

      return sceneContainsSlug(entry.scene, modelSlug);
    }) ||
    allScenes.find((entry) => !isHiddenAiScene(entry.scene)) ||
    null;

  return {
    currentScene: matchedEntry?.scene || null,
    category: matchedEntry?.category || "Image",
  };
}

function resolveDefaultSceneModelUrl(scene: NavItem | null) {
  if (!scene) {
    return "";
  }

  const candidates = [
    ...(scene.children?.map((child) => child.url).filter(Boolean) ?? []),
  ]
    .concat(scene.url ? [scene.url] : [])
    .filter(Boolean) as string[];

  const isTextToImageScene =
    scene.url?.startsWith("/text-to-image") ||
    candidates.some((url) => url.startsWith("/text-to-image/"));
  if (isTextToImageScene) {
    return DEFAULT_TEXT_TO_IMAGE_MODEL_URL;
  }

  const isImageToImageScene =
    scene.url?.startsWith("/image-to-image") ||
    candidates.some((url) => url.startsWith("/image-to-image/"));
  if (isImageToImageScene) {
    return DEFAULT_IMAGE_TO_IMAGE_MODEL_URL;
  }

  const isTextToVideoScene =
    scene.url?.startsWith("/text-to-video") ||
    candidates.some((url) => url.startsWith("/text-to-video/"));
  if (isTextToVideoScene) {
    return "/text-to-video/seedance-2-0";
  }

  const isImageToVideoScene =
    scene.url?.startsWith("/image-to-video") ||
    candidates.some((url) => url.startsWith("/image-to-video/"));
  if (isImageToVideoScene) {
    return DEFAULT_IMAGE_TO_VIDEO_MODEL_URL;
  }

  return scene.children?.find((child) => child.url)?.url || scene.url || "";
}

function getCurrentModelUrl(scene: NavItem | null, toolSlug: string) {
  if (!scene) return "";
  const { modelSlug } = parseToolParam(toolSlug);
  const matchedChild = scene.children?.find(
    (child) => getToolSlug(child) === modelSlug,
  );
  if (matchedChild?.url) {
    return matchedChild.url;
  }
  return resolveDefaultSceneModelUrl(scene);
}

function getSceneLabel(scene?: NavItem | null) {
  return scene?.title || scene?.name || "Untitled Scene";
}

function resolveToolLibraryOverride({
  toolParam,
  sceneUrl,
  overrides,
}: {
  toolParam: string;
  sceneUrl?: string | null;
  overrides: ToolLibraryOverrideDefinition[];
}) {
  const normalizedTool = normalizeToolParam(toolParam);
  const toolMatched =
    overrides.find((override) => {
      const { exactToolParams, toolPrefixes } = override.match;

      if (exactToolParams?.includes(normalizedTool)) {
        return true;
      }

      if (toolPrefixes?.some((prefix) => normalizedTool.startsWith(prefix))) {
        return true;
      }

      return false;
    }) || null;

  if (toolMatched) {
    return toolMatched;
  }

  return (
    overrides.find((override) => {
      const { scenePaths } = override.match;

      if (sceneUrl && scenePaths?.includes(sceneUrl)) {
        return true;
      }

      return false;
    }) || null
  );
}

function buildOverrideLibraryItems({
  override,
  sceneId,
  sceneLabel,
}: {
  override: ToolLibraryOverrideDefinition;
  sceneId?: string;
  sceneLabel?: string;
}): WorkbenchTemplateItem[] {
  return override.items.map((item, index) => {
    const referencePreviewUrls = Array.isArray(item.params?.referenceImages)
      ? item.params.referenceImages
          .map(
            (entry: { preview?: string; url?: string }) =>
              entry?.preview || entry?.url,
          )
          .filter((value): value is string => Boolean(value))
      : [];

    return {
      id: `${override.id}-${index}`,
      title: item.title,
      prompt: item.prompt,
      mediaType: override.mediaType,
      sceneId,
      sceneLabel,
      modelLabel: override.modelLabel,
      aspectRatio:
        typeof item.params?.aspectRatio === "string" && item.params.aspectRatio
          ? item.params.aspectRatio
          : override.defaultAspectRatio,
      previewUrl: item.generatedUrl || item.previewUrl,
      previewClipUrl: item.previewClipUrl,
      thumbnailUrl: item.thumbnailUrl,
      sourcePreviewUrl: referencePreviewUrls[0],
      resultPreviewUrl:
        item.generatedUrl || item.previewUrl || item.thumbnailUrl,
      resultPreviewUrls: Array.isArray(item.resultPreviewUrls)
        ? item.resultPreviewUrls.filter(Boolean)
        : [],
      referencePreviewUrls,
      params: { ...item.params },
    };
  });
}

async function resolveLibraryItems({
  config,
  currentScene,
  effectiveSceneLabel,
  initialTool,
  isImageEffectsAlias,
  isVideoEffectsAlias,
  modelUrl,
}: {
  config?: PlaygroundConfig;
  currentScene: NavItem | null;
  effectiveSceneLabel: string;
  initialTool: string;
  isImageEffectsAlias: boolean;
  isVideoEffectsAlias: boolean;
  modelUrl: string;
}) {
  if (!currentScene?.url) {
    return [];
  }

  if (isImageEffectsAlias) {
    const imageEffectsOverride =
      TOOL_LIBRARY_OVERRIDES.find(
        (override) => override.id === "image-effects-scene-library",
      ) || null;

    if (imageEffectsOverride) {
      return buildOverrideLibraryItems({
        override: imageEffectsOverride,
        sceneId: currentScene.id,
        sceneLabel: effectiveSceneLabel,
      });
    }
  }

  if (isVideoEffectsAlias) {
    const videoEffectsOverride =
      TOOL_LIBRARY_OVERRIDES.find(
        (override) => override.id === "video-effects-scene-library",
      ) || null;

    if (videoEffectsOverride) {
      const effectSlug = getAliasedToolSlug(initialTool, [
        "video-effect",
        "video-effects",
      ]);
      const override = effectSlug
        ? {
            ...videoEffectsOverride,
            items: videoEffectsOverride.items.filter(
              (item) => item.params?.effectSlug === effectSlug,
            ),
          }
        : videoEffectsOverride;

      return buildOverrideLibraryItems({
        override,
        sceneId: currentScene.id,
        sceneLabel: effectiveSceneLabel,
      });
    }
  }

  const libraryOverride = resolveToolLibraryOverride({
    toolParam: initialTool,
    sceneUrl: currentScene.url,
    overrides: TOOL_LIBRARY_OVERRIDES,
  });

  if (libraryOverride) {
    return buildOverrideLibraryItems({
      override: libraryOverride,
      sceneId: currentScene.id,
      sceneLabel: effectiveSceneLabel,
    });
  }

  return buildWorkbenchSceneTemplateCatalog({
    sceneId: currentScene.id,
    sceneLabel: effectiveSceneLabel,
    scenePath: currentScene.url,
    config,
  });
}

export async function preloadToolsDetailLibrary(args: {
  navItems: NavItem[];
  initialTool: string;
}) {
  const { navItems, initialTool } = args;
  const { currentScene } = findCurrentScene(navItems, initialTool);
  const toolAlias = normalizeToolAlias(initialTool);
  const isImageEffectsAlias =
    toolAlias === "image-effect" || toolAlias === "image-effects";
  const isVideoEffectsAlias =
    toolAlias === "video-effect" || toolAlias === "video-effects";
  const isVariationsAlias = toolAlias === "variations";
  const shouldShowLibraryTab =
    toolAlias !== "image-upscaler" && !isVariationsAlias;

  if (
    (!shouldShowLibraryTab &&
      toolAlias !== "image-upscaler" &&
      toolAlias !== "variations") ||
    !currentScene?.url
  ) {
    return {
      items: [] as WorkbenchTemplateItem[],
      shouldShowLibraryTab,
      resolved: false,
    };
  }

  const effectiveSceneLabel =
    TOOL_ALIAS_TO_LABEL[toolAlias] || getSceneLabel(currentScene);
  const modelUrl = getCurrentModelUrl(currentScene, initialTool);
  let config: PlaygroundConfig | undefined;
  try {
    config = await getPlaygroundConfigByUrl(modelUrl);
  } catch {
    config = undefined;
  }
  const items = await resolveLibraryItems({
    config,
    currentScene,
    effectiveSceneLabel,
    initialTool,
    isImageEffectsAlias,
    isVideoEffectsAlias,
    modelUrl,
  });

  return {
    items,
    shouldShowLibraryTab,
    resolved: true,
  };
}
