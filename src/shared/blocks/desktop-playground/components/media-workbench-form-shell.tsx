"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronsUpDown,
  Clapperboard,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { toCdnUrl } from "@/shared/lib/cdn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPortalContainerProvider,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  SCENE_PICKER_CARD_CLASS,
  SCENE_PICKER_CARD_IMAGE_CLASS,
  SCENE_PICKER_GRID_CLASS,
  SCENE_PICKER_MODAL_BODY_CLASS,
  SCENE_PICKER_MODAL_CONTENT_CLASS,
  SCENE_PICKER_MODAL_HEADER_CLASS,
} from "@/shared/lib/scene-picker-shared";

export type WorkbenchSceneOption = {
  id: string;
  label: string;
  url: string;
  iconUrl?: string;
  badge?: string;
};

export type WorkbenchModelOption = {
  label: string;
  url: string;
  description?: string;
  monogram: string;
  badge?: string;
  iconUrl?: string;
};

const MODEL_SELECT_CONTENT_CLASS =
  "z-[1450] rounded-[1.15rem] border border-[#E5E7EB] bg-white text-[#23282F] shadow-[0_18px_40px_rgba(35,40,47,0.12)] [--select-content-bg:#ffffff]";

const MODEL_SELECT_ITEM_CLASS =
  "group block w-full min-w-0 cursor-pointer overflow-hidden p-0 text-[#23282F] outline-none data-[highlighted]:bg-transparent data-[highlighted]:text-[#23282F]";

const MODEL_SELECT_TRIGGER_CLASS =
  "h-auto min-h-[64px] w-full cursor-pointer rounded-2xl border border-[#E5E7EB] bg-[#F5F7F9] px-4 py-3 text-left text-sm text-[#23282F] shadow-none transition-all duration-300 hover:border-[#23282F]/12 hover:bg-[#fff7df] focus-visible:ring-[#00B2FF]/20 max-md:rounded-[1rem]";

function getTranslationWithFallback(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback: string,
  values?: Record<string, any>,
) {
  const translated = t(key as any, values);
  return translated === key ? fallback : translated;
}

function resolveModelIconSrc(iconUrl?: string): string | undefined {
  if (!iconUrl) return undefined;
  if (iconUrl.startsWith("/")) return iconUrl;
  return toCdnUrl(iconUrl) || iconUrl;
}

function getSceneMeta(
  scene: WorkbenchSceneOption,
  t: ReturnType<typeof useTranslations>,
) {
  const isVideo =
    /video-face-swap|text-to-video|image-to-video|reference-to-video|video-extend|motion-control|longcat-avatar/.test(
      scene.url,
    );

  return isVideo
    ? {
        category: t("sceneGroups.video"),
        icon: Clapperboard,
        description: t("sceneMeta.videoDescription"),
        badgeClassName:
          "border-emerald-400/18 bg-emerald-400/10 text-emerald-200",
      }
    : {
        category: t("sceneGroups.image"),
        icon: ImageIcon,
        description: t("sceneMeta.imageDescription"),
        badgeClassName: "border-sky-400/18 bg-sky-400/10 text-sky-200",
      };
}

function getSceneTranslationKey(scene: WorkbenchSceneOption) {
  const source = `${scene.id} ${scene.url} ${scene.label}`.toLowerCase();

  if (/qwen-image-layered|qwen.*layered/.test(source)) {
    return "sceneNames.qwenImageLayered";
  }
  if (/image-background-remover|background-remover/.test(source)) {
    return "sceneNames.backgroundRemover";
  }
  if (/image-upscaler|upscaler/.test(source)) {
    return "sceneNames.imageUpscaler";
  }
  if (/image-eraser|eraser/.test(source)) {
    return "sceneNames.imageEraser";
  }
  if (/video-face-swap|face-swap/.test(source)) {
    return "sceneNames.videoFaceSwap";
  }
  if (/ai-clothes-remover|clothes-remover/.test(source)) {
    return "sceneNames.aiClothesRemover";
  }
  if (/motion-control/.test(source)) {
    return "sceneNames.motionControl";
  }
  if (/longcat-avatar/.test(source)) {
    return "sceneNames.longcatAvatar";
  }
  if (/video-extend/.test(source)) {
    return "sceneNames.videoExtend";
  }
  if (/reference-to-video/.test(source)) {
    return "sceneNames.referenceToVideo";
  }
  if (/text-to-video/.test(source)) {
    return "sceneNames.textToVideo";
  }
  if (/image-to-video/.test(source)) {
    return "sceneNames.imageToVideo";
  }
  if (/text-to-image/.test(source)) {
    return "sceneNames.textToImage";
  }
  if (/image-to-image/.test(source)) {
    return "sceneNames.imageToImage";
  }

  return null;
}

function getSceneLabel(
  scene: WorkbenchSceneOption,
  t: ReturnType<typeof useTranslations>,
) {
  const translationKey = getSceneTranslationKey(scene);
  return translationKey
    ? getTranslationWithFallback(t, translationKey, scene.label)
    : scene.label;
}

function renderSceneSelectItems(
  sceneOptions: WorkbenchSceneOption[],
  t: ReturnType<typeof useTranslations>,
) {
  const imageScenes = sceneOptions.filter(
    (scene) => getSceneMeta(scene, t).category === t("sceneGroups.image"),
  );
  const videoScenes = sceneOptions.filter(
    (scene) => getSceneMeta(scene, t).category === t("sceneGroups.video"),
  );

  const renderGroup = (label: string, scenes: WorkbenchSceneOption[]) => (
    <SelectGroup>
      <SelectLabel className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#666666]">
        {label}
      </SelectLabel>
      {scenes.map((scene) => {
        const meta = getSceneMeta(scene, t);
        const Icon = meta.icon;
        const iconSrc = toCdnUrl(scene.iconUrl ?? (scene as any).icon_url);
        const sceneLabel = getSceneLabel(scene, t);

        return (
          <SelectItem
            key={scene.id}
            value={scene.id}
            className="mb-1 min-h-14 rounded-xl border border-transparent px-3 py-3 pr-8 text-[#23282F] transition-all duration-200 hover:border-[#E5E7EB] hover:bg-[#fff7df] hover:text-[#23282F] focus:border-[#E5E7EB] focus:bg-[#fff7df] focus:text-[#23282F]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                  meta.badgeClassName,
                )}
              >
                {iconSrc ? (
                  <img
                    src={iconSrc}
                    alt={sceneLabel}
                    className="block size-6 rounded-full object-cover object-center"
                  />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span>{sceneLabel}</span>
                    {scene.badge ? (
                      <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                        {scene.badge}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[#666666]">
                  {meta.description}
                </span>
              </span>
            </div>
          </SelectItem>
        );
      })}
    </SelectGroup>
  );

  return (
    <>
      {imageScenes.length > 0
        ? renderGroup(t("sceneGroups.image"), imageScenes)
        : null}
      {imageScenes.length > 0 && videoScenes.length > 0 ? (
        <SelectSeparator className="mx-2 my-2 bg-[#E5E7EB]" />
      ) : null}
      {videoScenes.length > 0
        ? renderGroup(t("sceneGroups.video"), videoScenes)
        : null}
    </>
  );
}

function ScenePickerDialog({
  open,
  onOpenChange,
  sceneOptions,
  currentSceneId,
  currentSceneLabel,
  onSceneChange,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sceneOptions: WorkbenchSceneOption[];
  currentSceneId?: string;
  currentSceneLabel?: string;
  onSceneChange: (sceneId: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [activeCategory, setActiveCategory] = useState<"video" | "image">(
    "image",
  );

  const imageScenes = sceneOptions.filter(
    (scene) => getSceneMeta(scene, t).category === t("sceneGroups.image"),
  );
  const videoScenes = sceneOptions.filter(
    (scene) => getSceneMeta(scene, t).category === t("sceneGroups.video"),
  );

  useEffect(() => {
    if (!open) return;

    const currentScene = sceneOptions.find(
      (scene) => scene.id === currentSceneId,
    );
    const isVideo =
      currentScene &&
      getSceneMeta(currentScene, t).category === t("sceneGroups.video");
    setActiveCategory(isVideo ? "video" : "image");
  }, [currentSceneId, open, sceneOptions, t]);

  const activeScenes = activeCategory === "video" ? videoScenes : imageScenes;
  const titleText = getTranslationWithFallback(
    t,
    "scenePicker.title",
    "Select Scene",
  );
  const closeLabel = getTranslationWithFallback(
    t,
    "scenePicker.close",
    "Close",
  );
  const currentSelectionLabel = getTranslationWithFallback(
    t,
    "scenePicker.currentSelection",
    "CURRENT SELECTION",
  );
  const currentText = getTranslationWithFallback(
    t,
    "scenePicker.current",
    "Current",
  );
  const switchText = getTranslationWithFallback(
    t,
    "scenePicker.switch",
    "Switch",
  );
  const emptyText = getTranslationWithFallback(
    t,
    "scenePicker.empty",
    "No scenes available right now.",
  );
  const currentSceneFallback = getTranslationWithFallback(
    t,
    "scenePicker.currentSceneFallback",
    "No scene selected",
  );
  const tabVideoText = getTranslationWithFallback(
    t,
    "scenePicker.tabs.video",
    "Video",
  );
  const tabImageText = getTranslationWithFallback(
    t,
    "scenePicker.tabs.image",
    "Image",
  );
  const currentSceneOption = sceneOptions.find(
    (scene) => scene.id === currentSceneId,
  );
  const selectedSceneLabel = currentSceneOption
    ? getSceneLabel(currentSceneOption, t)
    : currentSceneLabel || currentSceneFallback;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={SCENE_PICKER_MODAL_CONTENT_CLASS}
      >
        <DialogHeader className={SCENE_PICKER_MODAL_HEADER_CLASS}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="min-w-0">
                <DialogTitle className="truncate text-left text-[15px] font-semibold tracking-[-0.02em] text-[#f0f0f0] sm:text-[16px]">
                  {titleText}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {selectedSceneLabel}
                </DialogDescription>
              </div>

              {imageScenes.length > 0 && videoScenes.length > 0 ? (
                <>
                  <div className="hidden h-9 w-px bg-[rgba(214,235,253,0.12)] md:block" />
                  <div className="inline-flex rounded-[18px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] p-1">
                    {(
                      [
                        {
                          value: "video" as const,
                          icon: Clapperboard,
                          label: tabVideoText,
                        },
                        {
                          value: "image" as const,
                          icon: ImageIcon,
                          label: tabImageText,
                        },
                      ] as const
                    ).map(({ value, icon: Icon, label }) => {
                      const isActive = activeCategory === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setActiveCategory(value)}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-[14px] px-3 py-2 text-[11px] font-medium tracking-[0.02em] transition-all",
                            isActive
                              ? "bg-white text-[#050608] shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                              : "text-[#a1a4a5] hover:text-[#f0f0f0]",
                          )}
                        >
                          <Icon className="size-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[rgba(214,235,253,0.12)] bg-white/[0.02] text-white/55 transition-colors hover:border-[rgba(214,235,253,0.19)] hover:text-white"
              aria-label={closeLabel}
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className={SCENE_PICKER_MODAL_BODY_CLASS}>
          {activeScenes.length > 0 ? (
            <div>
              <div className="mb-4 rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-white/[0.02] px-3.5 py-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#a1a4a5]">
                  {currentSelectionLabel}
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-[#f0f0f0]">
                  {selectedSceneLabel}
                </p>
              </div>

              <div className={SCENE_PICKER_GRID_CLASS}>
                {activeScenes.map((scene) => {
                  const meta = getSceneMeta(scene, t);
                  const Icon = meta.icon;
                  const iconSrc = toCdnUrl(
                    scene.iconUrl ?? (scene as any).icon_url,
                  );
                  const isActive = scene.id === currentSceneId;
                  const sceneLabel = getSceneLabel(scene, t);

                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => {
                        onSceneChange(scene.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        SCENE_PICKER_CARD_CLASS,
                        isActive
                          ? "border-[rgba(214,235,253,0.26)] shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
                          : "border-[rgba(214,235,253,0.12)] hover:border-[rgba(214,235,253,0.2)] hover:bg-white/[0.03]",
                      )}
                    >
                      <div className={SCENE_PICKER_CARD_IMAGE_CLASS}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_58%),linear-gradient(180deg,#1d2129_0%,#111318_52%,#08090c_100%)]" />
                        {iconSrc ? (
                          <img
                            src={iconSrc}
                            alt={sceneLabel}
                            className="absolute inset-0 h-full w-full object-cover object-center opacity-88"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white/28">
                            <Icon className="size-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-transparent" />

                        <div className="absolute left-2 top-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] backdrop-blur-md",
                              meta.badgeClassName,
                            )}
                          >
                            {meta.category}
                          </span>
                        </div>

                        <div className="absolute right-2 top-2">
                          {isActive ? (
                            <span className="inline-flex size-7.5 items-center justify-center rounded-full border border-[#11FF99]/25 bg-[#11FF99]/12 text-[#11FF99] shadow-[0_10px_20px_rgba(0,0,0,0.26)] backdrop-blur-md">
                              <Check className="size-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex size-7.5 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/90 text-[#4A5464] shadow-[0_10px_20px_rgba(35,40,47,0.12)] backdrop-blur-md">
                              <Icon className="size-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                        <h3 className="truncate text-[12px] font-medium leading-[1.35] text-[#23282F] sm:text-[13px]">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{sceneLabel}</span>
                            {scene.badge ? (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[8px] text-red-400">
                                {scene.badge}
                              </span>
                            ) : null}
                          </span>
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.45] text-[#666666]">
                          {meta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-[22px] border border-dashed border-[#E5E7EB] bg-[#F5F7F9] text-sm text-[#666666]">
              {emptyText}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MediaWorkbenchFormShellProps {
  t: ReturnType<typeof useTranslations>;
  sceneTitle?: string;
  sceneIconUrl?: string;
  sceneOptions?: WorkbenchSceneOption[];
  currentSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  modelOptions?: WorkbenchModelOption[];
  currentModelUrl?: string;
  onModelChange?: (modelUrl: string) => void;
  configModelName: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "mango";
  hideSceneTabs?: boolean;
}

export function MediaWorkbenchFormShell({
  t,
  sceneTitle,
  sceneIconUrl,
  sceneOptions = [],
  currentSceneId,
  onSceneChange,
  modelOptions = [],
  currentModelUrl,
  onModelChange,
  configModelName,
  children,
  footer,
  variant = "default",
  hideSceneTabs = false,
}: MediaWorkbenchFormShellProps) {
  const [isScenePickerOpen, setIsScenePickerOpen] = useState(false);
  const [selectPortalContainer, setSelectPortalContainer] =
    useState<HTMLDivElement | null>(null);

  const selectedScene = sceneOptions.find(
    (scene) => scene.id === currentSceneId,
  );
  const selectedModel = modelOptions.find(
    (model) => model.url === currentModelUrl,
  );
  const selectedSceneLabel = selectedScene
    ? getSceneLabel(selectedScene, t)
    : sceneTitle || configModelName;
  const switchSceneLabel = getTranslationWithFallback(
    t,
    "scenePicker.trigger.open",
    "Switch scene",
  );
  const changeSceneText = getTranslationWithFallback(
    t,
    "scenePicker.trigger.change",
    "Change",
  );
  const hasMangoSceneStyle =
    /image to image|text to image|image to video|text to video/i.test(
      selectedSceneLabel,
    );
  const isMangoVariant = variant === "mango" || hasMangoSceneStyle;
  const selectedSceneSearchText = [
    currentSceneId,
    selectedScene?.id,
    selectedScene?.label,
    selectedScene?.url,
    selectedSceneLabel,
  ]
    .filter(Boolean)
    .join(" ");
  const mangoSceneMode = /image[- ]to[- ]video|text[- ]to[- ]video/i.test(
    selectedSceneSearchText,
  )
    ? "video"
    : /image[- ]to[- ]image|text[- ]to[- ]image/i.test(selectedSceneSearchText)
      ? "image"
      : null;
  const mangoSceneMatchers =
    mangoSceneMode === "video"
      ? {
          primary: /image[- ]to[- ]video/i,
          secondary: /text[- ]to[- ]video/i,
        }
      : mangoSceneMode === "image"
        ? {
            primary: /image[- ]to[- ]image/i,
            secondary: /text[- ]to[- ]image/i,
          }
        : null;
  const mangoSceneTabs =
    isMangoVariant && currentSceneId && onSceneChange && mangoSceneMatchers
      ? sceneOptions
          .filter((scene) => {
            const sceneText = `${scene.id} ${scene.label} ${scene.url} ${getSceneLabel(scene, t)}`;
            return (
              mangoSceneMatchers.primary.test(sceneText) ||
              mangoSceneMatchers.secondary.test(sceneText)
            );
          })
          .sort((a, b) => {
            const aText = `${a.id} ${a.label} ${a.url} ${getSceneLabel(a, t)}`;
            const bText = `${b.id} ${b.label} ${b.url} ${getSceneLabel(b, t)}`;
            const aIsPrimary = mangoSceneMatchers.primary.test(aText);
            const bIsPrimary = mangoSceneMatchers.primary.test(bText);

            if (aIsPrimary === bIsPrimary) {
              return 0;
            }

            return aIsPrimary ? -1 : 1;
          })
      : [];
  const showMangoSceneTabs = mangoSceneTabs.length >= 2;
  const showStaticMangoTabs =
    isMangoVariant &&
    !showMangoSceneTabs &&
    hasMangoSceneStyle &&
    Boolean(mangoSceneMatchers);
  const staticMangoSceneMatchers = mangoSceneMatchers ?? {
    primary: /a^/,
    secondary: /a^/,
  };

  return (
    <SelectPortalContainerProvider container={selectPortalContainer}>
      <div
        className={cn(
          "group relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
          isMangoVariant
            ? "rounded-none border-0 bg-transparent shadow-none"
            : "rounded-3xl border border-[#E5E7EB] bg-white shadow-[0_18px_42px_rgba(35,40,47,0.08)] max-md:h-full max-md:min-h-0 max-md:rounded-[1.35rem] max-md:border-0 max-md:shadow-none",
        )}
      >
        {isMangoVariant ? null : (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,193,0,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(64,158,255,0.08),transparent_26%)]" />
        )}
        <div
          ref={setSelectPortalContainer}
          className="pointer-events-none absolute inset-0 z-[70]"
        />

        <div
          className={cn(
            "relative z-10",
            isMangoVariant
              ? "space-y-3 px-0 pb-0 pt-0"
              : "border-b border-[#E5E7EB] px-4 pb-4 pt-4",
          )}
        >
          {!hideSceneTabs && showMangoSceneTabs ? (
            <div className="rounded-[18px] bg-[#F3F4F8] p-1">
              <div className="grid grid-cols-2 gap-1">
                {mangoSceneTabs.slice(0, 2).map((scene) => {
                  const isActive = scene.id === currentSceneId;

                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => onSceneChange?.(scene.id)}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-center rounded-[15px] px-4 text-[14px] font-medium transition-all",
                        isActive
                          ? "bg-white text-[#23282F] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
                          : "text-[#2A65FF] hover:bg-white/70",
                      )}
                    >
                      {getSceneLabel(scene, t)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : !hideSceneTabs && showStaticMangoTabs ? (
            <div className="rounded-[18px] bg-[#F3F4F8] p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const matchedScene = sceneOptions.find((scene) =>
                      staticMangoSceneMatchers.primary.test(
                        `${scene.id} ${scene.label} ${scene.url}`,
                      ),
                    );
                    if (matchedScene) onSceneChange?.(matchedScene.id);
                  }}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center rounded-[15px] px-4 text-[14px] font-medium transition-all",
                    staticMangoSceneMatchers.primary.test(
                      selectedSceneSearchText,
                    )
                      ? "bg-white text-[#23282F] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
                      : "text-[#2A65FF]",
                  )}
                >
                  {mangoSceneMode === "video"
                    ? "Image to Video"
                    : "Image to Image"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const matchedScene = sceneOptions.find((scene) =>
                      staticMangoSceneMatchers.secondary.test(
                        `${scene.id} ${scene.label} ${scene.url}`,
                      ),
                    );
                    if (matchedScene) onSceneChange?.(matchedScene.id);
                  }}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center rounded-[15px] px-4 text-[14px] font-medium transition-all",
                    staticMangoSceneMatchers.secondary.test(
                      selectedSceneSearchText,
                    )
                      ? "bg-white text-[#23282F] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
                      : "text-[#2A65FF]",
                  )}
                >
                  {mangoSceneMode === "video"
                    ? "Text to Video"
                    : "Text to Image"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            {sceneOptions.length > 1 &&
            currentSceneId &&
            onSceneChange &&
            !hideSceneTabs &&
            !showMangoSceneTabs ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsScenePickerOpen(true)}
                  className={cn(
                    "h-auto min-h-0 w-full max-w-none cursor-pointer text-left shadow-none transition-all duration-200",
                    isMangoVariant
                      ? "rounded-[18px] bg-[#F7F8FB] px-5 py-4 hover:bg-[#F3F6FB]"
                      : "rounded-2xl border border-[#E5E7EB] bg-[#F5F7F9] px-4 py-3 hover:border-[#23282F]/12 hover:bg-[#fff7df]",
                  )}
                  aria-label={switchSceneLabel}
                >
                  {selectedScene ? (
                    <div className="relative flex min-w-0 items-center gap-3 pr-24">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                          getSceneMeta(selectedScene, t).badgeClassName,
                        )}
                      >
                        {(() => {
                          const Icon = getSceneMeta(selectedScene, t).icon;
                          const iconSrc = toCdnUrl(
                            selectedScene.iconUrl ??
                              (selectedScene as any).icon_url,
                          );
                          return iconSrc ? (
                            <img
                              src={iconSrc}
                              alt={selectedSceneLabel}
                              className="block size-6 rounded-full object-cover object-center"
                            />
                          ) : (
                            <Icon className="size-4" />
                          );
                        })()}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                            getSceneMeta(selectedScene, t).badgeClassName,
                          )}
                        >
                          {getSceneMeta(selectedScene, t).category}
                        </span>
                        <span className="block truncate text-[1rem] font-bold leading-tight text-[#23282F] md:text-[1.08rem]">
                          <span className="inline-flex items-center gap-2">
                            <span>{selectedSceneLabel}</span>
                            {selectedScene.badge ? (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                                {selectedScene.badge}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#666666]",
                          isMangoVariant
                            ? "rounded-full bg-white/80 px-2.5 py-1"
                            : "h-7 rounded-full border border-[#E5E7EB] bg-white px-2",
                        )}
                      >
                        <ChevronsUpDown className="size-3.5" />
                        <span>{changeSceneText}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="truncate text-sm font-bold text-[#23282F] md:text-[1rem]">
                      {selectedSceneLabel}
                    </span>
                  )}
                </button>
                <ScenePickerDialog
                  open={isScenePickerOpen}
                  onOpenChange={setIsScenePickerOpen}
                  sceneOptions={sceneOptions}
                  currentSceneId={currentSceneId}
                  currentSceneLabel={selectedSceneLabel}
                  onSceneChange={onSceneChange}
                  t={t}
                />
              </>
            ) : (
              <div
                className={cn(
                  "flex min-w-0 items-center gap-3",
                  isMangoVariant && "rounded-[18px] bg-[#F7F8FB] px-5 py-4",
                  !hideSceneTabs &&
                    (showMangoSceneTabs || showStaticMangoTabs) &&
                    "hidden",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/18 bg-sky-400/10 text-sky-600">
                  {sceneIconUrl ? (
                    <img
                      src={toCdnUrl(sceneIconUrl)}
                      alt={sceneTitle || configModelName}
                      className="block size-6 rounded-full object-cover object-center"
                    />
                  ) : (
                    <ImageIcon className="size-4" />
                  )}
                </span>
                <h2 className="min-w-0 text-sm font-bold text-[#23282F] md:text-[1rem]">
                  {sceneTitle || configModelName}
                </h2>
              </div>
            )}
          </div>

          {modelOptions.length > 0 && onModelChange && currentModelUrl ? (
            <div className={cn(isMangoVariant ? "mt-0" : "mt-4")}>
              <p
                className={cn(
                  "mb-2 text-[#23282F]",
                  isMangoVariant
                    ? "text-[15px] font-medium tracking-normal"
                    : "text-[11px] font-medium uppercase tracking-[0.12em] text-[#666666]",
                )}
              >
                {isMangoVariant ? "Model" : t("model.label")}
              </p>
              <Select value={currentModelUrl} onValueChange={onModelChange}>
                <SelectTrigger
                  className={cn(
                    MODEL_SELECT_TRIGGER_CLASS,
                    isMangoVariant &&
                      "min-h-[72px] rounded-[12px] border-0 bg-[#F3F4F8] px-5 py-3 hover:bg-[#EEF1F6]",
                  )}
                >
                  {selectedModel ? (
                    <div className="flex min-w-0 items-center gap-3.5 pr-1">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff7df] text-sm font-bold text-[#7a5600]">
                        {selectedModel.iconUrl ? (
                          <img
                            src={resolveModelIconSrc(selectedModel.iconUrl)}
                            alt={selectedModel.label}
                            className="block size-full object-contain p-1.5"
                          />
                        ) : (
                          selectedModel.monogram
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold text-[#23282F]">
                          <span className="inline-flex items-center gap-2">
                            <span>{selectedModel.label}</span>
                            {selectedModel.badge ? (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                                {selectedModel.badge}
                              </span>
                            ) : null}
                          </span>
                        </p>
                        {selectedModel.description ? (
                          <p className="mt-1.5 truncate text-[10px] text-[#666666]">
                            {selectedModel.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <SelectValue placeholder={t("model.choose")} />
                  )}
                </SelectTrigger>
                <SelectContent
                  preventCloseAutoFocus
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  className={MODEL_SELECT_CONTENT_CLASS}
                  style={{
                    height: "auto",
                    minHeight: 0,
                    maxHeight: 420,
                    backgroundColor: "#ffffff",
                    ["--select-content-bg" as string]: "#ffffff",
                  }}
                >
                  {modelOptions.map((model) => (
                    <SelectItem
                      key={model.url}
                      value={model.url}
                      className={MODEL_SELECT_ITEM_CLASS}
                    >
                      <div className="flex w-full items-center gap-3 rounded-xl py-4 pl-4 pr-8 transition-all duration-200 group-data-[highlighted]:bg-[#fff7df] group-data-[state=checked]:bg-[#fff1b8]">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff7df] text-sm font-bold text-[#7a5600] transition-colors group-data-[highlighted]:bg-[#ffe8a4]">
                          {model.iconUrl ? (
                            <img
                              src={resolveModelIconSrc(model.iconUrl)}
                              alt={model.label}
                              className="block size-full object-contain p-1.5"
                            />
                          ) : (
                            model.monogram
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-medium text-[#23282F] group-data-[highlighted]:font-semibold">
                            {model.label}
                            {model.badge ? (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                                {model.badge}
                              </span>
                            ) : null}
                          </p>
                          {model.description ? (
                            <p className="mt-1.5 line-clamp-2 text-xs text-[#666666] group-data-[highlighted]:text-[#4A5464]">
                              {model.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:hover:bg-[#d0d5dd]",
            isMangoVariant
              ? "px-0 pb-0 pt-3"
              : "px-2 pb-3 pt-3 md:px-4 md:pt-4",
          )}
        >
          <div
            className={cn(isMangoVariant ? "space-y-3 pb-3" : "space-y-4 pb-3")}
          >
            {children}
          </div>
        </div>

        {footer ? (
          <div
            className={cn(
              "relative z-20 shrink-0",
              isMangoVariant
                ? "px-0 pb-0 pt-3"
                : "sticky bottom-0 border-t border-[#E5E7EB] bg-[linear-gradient(180deg,rgba(255,254,248,0.96)_0%,rgba(255,248,222,0.98)_100%)] px-5 pb-10 pt-5 backdrop-blur-sm max-md:px-4 max-md:pb-[max(env(safe-area-inset-bottom),1rem)] max-md:pt-4",
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </SelectPortalContainerProvider>
  );
}
