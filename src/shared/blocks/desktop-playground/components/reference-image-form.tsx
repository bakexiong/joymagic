"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

import { ImageUploader } from "@/shared/blocks/common/image-uploader";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import { cn } from "@/shared/lib/utils";
import { toCdnUrl, withOssImageResize } from "@/shared/lib/cdn";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAppContext } from "@/shared/contexts/app";
import { localizeFieldSchema } from "../lib/localize-field";
import { mergeLinkedFieldValues } from "../lib/linked-field-values";

import type { PlaygroundConfig } from "../types/playground-config";
import {
  MediaWorkbenchFormShell,
  type WorkbenchModelOption,
  type WorkbenchSceneOption,
} from "./media-workbench-form-shell";

interface ReferenceImageFormProps {
  config: PlaygroundConfig;
  sceneTitle?: string;
  sceneIconUrl?: string;
  sceneOptions?: WorkbenchSceneOption[];
  currentSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  onGenerate?: (imageUrl: string | string[]) => void;
  onValuesChange?: (values: Record<string, any>) => void;
  isGenerating?: boolean;
  requiredCredits?: number | null;
  modelOptions?: WorkbenchModelOption[];
  currentModelUrl?: string;
  onModelChange?: (modelUrl: string) => void;
  values?: Record<string, any>;
  generationContext?: Parameters<PlaygroundConfig["onGenerate"]>[1];
  shellVariant?: "default" | "mango";
  hideSceneTabs?: boolean;
}

const WORKBENCH_SELECT_TRIGGER_CLASS =
  "h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F5F7F9] text-left text-sm text-[#23282F] shadow-none transition-all duration-200 hover:border-[#23282F]/12 hover:bg-[#fff7df] focus-visible:ring-[#00B2FF]/20 max-md:rounded-[1rem] [&_[data-slot=select-value]]:text-[#23282F] [&_[data-slot=select-value]]:opacity-100 [&_[data-slot=select-value][data-placeholder]]:text-[#8A94A6]";

const WORKBENCH_SELECT_CONTENT_CLASS =
  "z-[1450] rounded-[1.1rem] border border-[#E5E7EB] bg-white text-[#23282F] shadow-[0_18px_40px_rgba(35,40,47,0.12)] [--select-content-bg:#ffffff] [&>div]:!bg-white";

const WORKBENCH_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-[0.9rem] px-3 py-2.5 text-[#4A5464] transition-all duration-200 hover:bg-[#fff7df] hover:text-[#23282F] focus:bg-[#fff7df] focus:text-[#23282F] data-[highlighted]:bg-[#fff7df] data-[highlighted]:text-[#23282F] data-[state=checked]:bg-[#fff1b8] data-[state=checked]:text-[#23282F]";

const WORKBENCH_TOGGLE_CHECKBOX_CLASS =
  "size-5 rounded-md border-[#E5E7EB] bg-white shadow-[0_0_0_1px_rgba(229,231,235,1)] data-[state=checked]:border-[#1DBFA1] data-[state=checked]:bg-[#1DBFA1] data-[state=checked]:text-white";

function AspectRatioIcon({
  ratio,
  isSelected,
  autoLabel = "Auto",
}: {
  ratio: string;
  isSelected: boolean;
  autoLabel?: string;
}) {
  if (ratio.toLowerCase() === "auto") {
    return (
      <div
        className={cn(
          "flex h-5 min-w-9 items-center justify-center rounded border px-1.5 text-[10px] font-medium transition-colors",
          isSelected
            ? "border-[#23282F]/18 bg-[#fff1b8] text-[#23282F]"
            : "border-[#E5E7EB] bg-white text-[#666666]",
        )}
      >
        {autoLabel}
      </div>
    );
  }

  const [rawWidth, rawHeight] = ratio.split(":").map(Number);
  const width = Number.isFinite(rawWidth) ? rawWidth : 1;
  const height = Number.isFinite(rawHeight) ? rawHeight : 1;
  const aspect = width / height;
  const base = 18;
  const iconWidth = aspect > 1 ? base * aspect : base;
  const iconHeight = aspect < 1 ? base / aspect : base;

  return (
    <div
      className={cn(
        "shrink-0 rounded border transition-colors",
        isSelected
          ? "border-[#23282F]/18 bg-[#fff1b8]"
          : "border-[#E5E7EB] bg-white",
      )}
      style={{
        width: `${iconWidth}px`,
        height: `${iconHeight}px`,
      }}
    />
  );
}

function getUploadedImageItems(value: unknown): ImageUploaderValue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(Boolean) as ImageUploaderValue[];
}

function getUploadedMediaUrls(value: unknown): string[] {
  return getUploadedImageItems(value)
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

function getLinkedReferencePreviewUrl(field: any, optionValue: string) {
  const linkedValues = field?.linkedValuesByOption?.[optionValue];
  if (
    typeof linkedValues?.previewClipUrl === "string" &&
    linkedValues.previewClipUrl
  ) {
    return linkedValues.previewClipUrl;
  }

  if (typeof linkedValues?.previewUrl === "string" && linkedValues.previewUrl) {
    return linkedValues.previewUrl;
  }

  const referenceImages = Array.isArray(linkedValues?.referenceImages)
    ? linkedValues.referenceImages
    : [];
  const firstImage = referenceImages[0];

  if (!firstImage || typeof firstImage !== "object") {
    return "";
  }

  return firstImage.url || firstImage.preview || "";
}

function getLinkedPreviewMediaType(field: any, optionValue: string) {
  const linkedValues = field?.linkedValuesByOption?.[optionValue];
  if (linkedValues?.mediaType === "video" || linkedValues?.previewClipUrl) {
    return "video";
  }

  return "image";
}

function isUploadField(field: PlaygroundConfig["schema"][string]) {
  return field?.type === "upload";
}

function resolveModelIconSrc(iconUrl?: string): string | undefined {
  if (!iconUrl) return undefined;
  if (iconUrl.startsWith("/")) return iconUrl;
  return toCdnUrl(iconUrl) || iconUrl;
}

export function ReferenceImageForm({
  config,
  sceneTitle,
  sceneIconUrl,
  sceneOptions = [],
  currentSceneId,
  onSceneChange,
  onGenerate,
  onValuesChange,
  isGenerating: externalIsGenerating,
  requiredCredits,
  modelOptions = [],
  currentModelUrl,
  onModelChange,
  values: externalValues,
  generationContext,
  shellVariant = "default",
  hideSceneTabs = false,
}: ReferenceImageFormProps) {
  const t = useTranslations("landing.wavespeed.desktopPlayground");
  const { user } = useAppContext();
  const isMangoVariant = shellVariant === "mango";
  const fieldLabelClass = isMangoVariant
    ? "text-[15px] font-medium text-[#23282F]"
    : "text-sm font-semibold text-[#23282F]";
  const [values, setValues] = useState<Record<string, any>>(() => {
    if (externalValues) {
      return externalValues;
    }
    const initialValues: Record<string, any> = {};
    Object.entries(config.schema).forEach(([key, field]) => {
      if (field) {
        initialValues[key] =
          key === "style" && !field.required
            ? ""
            : key === "seed" &&
                (field.defaultValue === -1 || field.defaultValue === "-1")
              ? ""
              : field.defaultValue;
      }
    });
    // 从 sessionStorage 读取初始提示词和参数（explore/首页点击生成后跳转过来）
    if (typeof window !== "undefined") {
      const storedPrompt = sessionStorage.getItem("creator-initial-prompt");
      if (storedPrompt) {
        initialValues.prompt = storedPrompt;
        sessionStorage.removeItem("creator-initial-prompt");
      }
      const storedParams = sessionStorage.getItem("creator-initial-params");
      if (storedParams) {
        try {
          const params = JSON.parse(storedParams);
          Object.assign(initialValues, params);
        } catch {
          // 忽略解析错误
        }
        sessionStorage.removeItem("creator-initial-params");
      }
    }
    return initialValues;
  });
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openStyleFieldKey, setOpenStyleFieldKey] = useState<string | null>(
    null,
  );

  // 同步外部传入的 values（避免在 render 中 setState 导致时序异常：首次点击不生效/需点两次）
  useEffect(() => {
    if (!externalValues) return;
    const next = JSON.stringify(externalValues);
    const current = JSON.stringify(values);
    if (next !== current) {
      setValues(externalValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValues]);

  const formValues = externalValues ?? values;
  const isGenerating = Boolean(externalIsGenerating) || internalIsGenerating;
  const currentModelLabel =
    modelOptions.find((model) => model.url === currentModelUrl)?.label || "";
  const uploadMetadata = {
    sceneId: currentSceneId || "",
    sceneLabel: sceneTitle || "",
    modelUrl: currentModelUrl || "",
    modelLabel: currentModelLabel,
  };
  const promptField = localizeFieldSchema(
    "prompt",
    config.schema.prompt,
    config.scenarioType,
    t,
  );
  const promptValue = formValues.prompt || "";
  const referenceImageField = config.schema.referenceImages
    ? localizeFieldSchema(
        "referenceImages",
        config.schema.referenceImages,
        config.scenarioType,
        t,
      )
    : undefined;
  const uploadedImages = getUploadedImageItems(formValues.referenceImages);
  const hasUploadedImages = uploadedImages.some((item) => item.url);
  const isReferenceImagesRequiredForSubmit = Boolean(referenceImageField);
  const isUploadingImages = uploadedImages.some(
    (item) => item.status === "uploading",
  );
  const additionalUploadFields = Object.entries(config.schema).filter(
    ([key, field]) =>
      key !== "referenceImages" && key !== "prompt" && isUploadField(field),
  );
  const hasMissingRequiredUploads = additionalUploadFields.some(
    ([key, field]) =>
      Boolean(field?.required) &&
      !getUploadedImageItems(formValues[key]).some((item) => item.url),
  );
  const hasUploadingAdditionalUploads = additionalUploadFields.some(([key]) =>
    getUploadedImageItems(formValues[key]).some(
      (item) => item.status === "uploading",
    ),
  );
  const hasMissingRequiredFields = Object.entries(config.schema).some(
    ([key, field]) => {
      if (
        !field ||
        !field.required ||
        key === "prompt" ||
        key === "referenceImages" ||
        field.type === "upload"
      ) {
        return false;
      }

      const value = formValues[key];

      if (field.type === "toggle") {
        return !Boolean(value);
      }

      if (field.type === "number" || field.type === "slider") {
        return value === undefined || value === null || Number.isNaN(value);
      }

      return String(value ?? "").trim().length === 0;
    },
  );
  const maxLength = 2000;
  const generateLabel =
    config.scenarioType === "text-to-video" ||
    config.scenarioType === "image-to-video"
      ? t("actions.generateVideo")
      : t("actions.generateImage");
  const showPromptField = promptField?.visible !== false;
  const isPromptRequired = Boolean(promptField?.required && showPromptField);
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const hasInsufficientCredits =
    !!user &&
    requiredCredits !== null &&
    requiredCredits !== undefined &&
    remainingCredits < requiredCredits;

  const updateValues = (nextValues: Record<string, any>) => {
    setValues(nextValues);
    onValuesChange?.(nextValues);
  };
  const updateSelectValue = (fieldKey: string, value: string, field: any) => {
    updateValues(mergeLinkedFieldValues(formValues, fieldKey, value, field));
  };
  const clearStyleValue = (fieldKey: string) => {
    updateValues({
      ...formValues,
      [fieldKey]: "",
    });
  };
  const renderStyleSelect = (fieldKey: string, field: any) => {
    const options = field.options || [];
    const selectedValue =
      typeof formValues[fieldKey] === "string" ? formValues[fieldKey] : "";
    const selectedOption = options.find(
      (option: any) => String(option.value) === selectedValue,
    );
    const selectedPreviewUrl = selectedOption
      ? getLinkedReferencePreviewUrl(field, String(selectedOption.value))
      : "";
    const selectedPreviewMediaType = selectedOption
      ? getLinkedPreviewMediaType(field, String(selectedOption.value))
      : "image";
    const dialogOpen = openStyleFieldKey === fieldKey;

    return (
      <>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenStyleFieldKey(fieldKey)}
            className={cn(
              "w-full cursor-pointer overflow-hidden rounded-[18px] bg-[#F7F8FB] text-left transition hover:bg-[#F3F6FB]",
              isGenerating && "cursor-not-allowed opacity-70",
            )}
            disabled={isGenerating}
          >
            <div className="flex min-h-[58px] items-center gap-3 px-4 py-2.5">
              <div className="aspect-[1.45] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[#F2F4F8]">
                {selectedPreviewUrl && selectedPreviewMediaType === "video" ? (
                  <video
                    src={toCdnUrl(selectedPreviewUrl) || selectedPreviewUrl}
                    className="h-full w-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : selectedPreviewUrl ? (
                  <img
                    src={toCdnUrl(selectedPreviewUrl) || selectedPreviewUrl}
                    alt={selectedOption?.label || field.label}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E8EBF3] text-[10px] font-medium text-[#667085]">
                    Select Style
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[14px] font-medium text-[#3E434D]">
                  {selectedOption?.label || "Select Style"}
                </p>
              </div>
              <div className="shrink-0 text-[#4B5563]">
                <ChevronRight className="h-5 w-5 stroke-[1.75]" />
              </div>
            </div>
          </button>
          {selectedOption ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                clearStyleValue(fieldKey);
              }}
              className="absolute right-10 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#D9E0EA] bg-white text-[#667085] transition hover:border-[#BFD7FF] hover:text-[#23282F]"
              aria-label="Clear style"
              disabled={isGenerating}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => setOpenStyleFieldKey(open ? fieldKey : null)}
        >
          <DialogContent className="!w-[min(88vw,1520px)] !max-w-none border border-[#D9E0EA] bg-white p-0 text-[#23282F] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <DialogHeader className="border-b border-[#EEF2F7] px-6 py-5 text-left">
              <DialogTitle className="text-[24px] font-semibold text-[#23282F]">
                {field.label}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[82vh] overflow-y-auto px-7 py-7">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {options.map((option: any) => {
                  const optionValue = String(option.value);
                  const isActive = selectedValue === optionValue;
                  const previewUrl = getLinkedReferencePreviewUrl(
                    field,
                    optionValue,
                  );
                  const previewMediaType = getLinkedPreviewMediaType(
                    field,
                    optionValue,
                  );
                  const previewCardUrl = toCdnUrl(previewUrl) || previewUrl;

                  return (
                    <button
                      key={optionValue}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          clearStyleValue(fieldKey);
                        } else {
                          updateSelectValue(fieldKey, optionValue, field);
                        }
                        setOpenStyleFieldKey(null);
                      }}
                      className="cursor-pointer text-left"
                    >
                      <div
                        className={cn(
                          "overflow-hidden rounded-[14px] border-2 bg-[#F2F4F8] transition-all",
                          isActive
                            ? "border-[#2FB5FF] ring-2 ring-[#C86BFF]/70"
                            : "border-transparent hover:border-[#BFD7FF]",
                        )}
                      >
                        <div className="aspect-[1.28] w-full bg-[#F2F4F8]">
                          {previewUrl && previewMediaType === "video" ? (
                            <video
                              src={previewCardUrl}
                              className="h-full w-full object-contain"
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                            />
                          ) : previewUrl ? (
                            <img
                              src={previewCardUrl}
                              alt={option.label}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#E8EBF3] px-3 text-center text-[13px] font-medium text-[#667085]">
                              {option.label}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-5 text-[#23282F]">
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  useEffect(() => {
    const styleField = config.schema.style;
    if (!styleField?.linkedValuesByOption) {
      return;
    }

    const selectedStyle =
      typeof formValues.style === "string" && formValues.style.trim()
        ? formValues.style.trim()
        : "";

    if (!selectedStyle) {
      return;
    }

    const linkedValues = styleField.linkedValuesByOption[selectedStyle];
    if (!linkedValues) {
      return;
    }

    const shouldHydratePrompt =
      typeof linkedValues.prompt === "string" &&
      !String(formValues.prompt || "").trim();
    const shouldHydrateReferenceImages =
      Array.isArray(linkedValues.referenceImages) &&
      linkedValues.referenceImages.length > 0 &&
      getUploadedImageItems(formValues.referenceImages).length === 0;

    if (!shouldHydratePrompt && !shouldHydrateReferenceImages) {
      return;
    }

    const nextValues = mergeLinkedFieldValues(
      formValues,
      "style",
      selectedStyle,
      styleField,
    );
    if (JSON.stringify(nextValues) === JSON.stringify(formValues)) {
      return;
    }

    updateValues(nextValues);
  }, [config.schema.style, formValues]);

  useEffect(() => {
    if (!referenceImageField || typeof window === "undefined") {
      return;
    }

    const existingImages = getUploadedImageItems(formValues.referenceImages);
    if (existingImages.some((item) => item.url)) {
      return;
    }

    const refUrl = sessionStorage.getItem("creator-initial-ref");
    if (!refUrl) {
      return;
    }

    sessionStorage.removeItem("creator-initial-ref");
    updateValues({
      ...formValues,
      referenceImages: [
        {
          id: `reference-image-form-ref-${Date.now()}`,
          preview: refUrl,
          url: refUrl,
          status: "uploaded",
        } satisfies ImageUploaderValue,
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceImageField, formValues.referenceImages]);

  const handleGenerate = async () => {
    if (hasInsufficientCredits) {
      setError(
        t("errors.insufficientCredits", {
          required: requiredCredits,
          remaining: remainingCredits,
        }),
      );
      return;
    }

    setInternalIsGenerating(true);
    setError(null);

    try {
      const result = await config.onGenerate(
        formValues,
        generationContext as any,
      );
      const generatedMedia =
        result?.imageUrls || result?.imageUrl || result?.videoUrl;
      if (generatedMedia) {
        onGenerate?.(generatedMedia);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errors.generationFailed"),
      );
    } finally {
      setInternalIsGenerating(false);
    }
  };

  const currentScene = sceneOptions.find(
    (scene) => scene.id === currentSceneId,
  );
  const currentSceneSearchText = [
    currentSceneId,
    currentScene?.id,
    currentScene?.label,
    currentScene?.url,
    sceneTitle,
  ]
    .filter(Boolean)
    .join(" ");
  const scenePairMode = /image[- ]to[- ]video|text[- ]to[- ]video/i.test(
    currentSceneSearchText,
  )
    ? "video"
    : /image[- ]to[- ]image|text[- ]to[- ]image/i.test(currentSceneSearchText)
      ? "image"
      : null;
  const scenePairMatchers =
    scenePairMode === "video"
      ? {
          primary: /image[- ]to[- ]video/i,
          secondary: /text[- ]to[- ]video/i,
        }
      : scenePairMode === "image"
        ? {
            primary: /image[- ]to[- ]image/i,
            secondary: /text[- ]to[- ]image/i,
          }
        : null;
  const pairedSceneTabs = scenePairMatchers
    ? sceneOptions
        .filter((scene) => {
          const sceneText = `${scene.id} ${scene.label} ${scene.url}`;
          return (
            scenePairMatchers.primary.test(sceneText) ||
            scenePairMatchers.secondary.test(sceneText)
          );
        })
        .sort((a, b) => {
          const aIsPrimary = scenePairMatchers.primary.test(
            `${a.id} ${a.label} ${a.url}`,
          );
          const bIsPrimary = scenePairMatchers.primary.test(
            `${b.id} ${b.label} ${b.url}`,
          );

          if (aIsPrimary === bIsPrimary) {
            return 0;
          }

          return aIsPrimary ? -1 : 1;
        })
        .slice(0, 2)
    : [];
  const shouldShowPairedSceneTabs = pairedSceneTabs.length >= 2;

  if (isMangoVariant) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="space-y-4">
          {!hideSceneTabs && shouldShowPairedSceneTabs ? (
            <div className="rounded-[16px] bg-[#F3F4F8] p-1">
              <div className="grid grid-cols-2 gap-1">
                {pairedSceneTabs.map((scene) => {
                  const isActive = scene.id === currentSceneId;

                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => onSceneChange?.(scene.id)}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-center rounded-[14px] px-4 text-[14px] font-medium transition-all",
                        isActive
                          ? "bg-white text-[#23282F] shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
                          : "text-[#2A65FF] hover:bg-white/70",
                      )}
                    >
                      {scene.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {modelOptions.length > 0 && onModelChange && currentModelUrl ? (
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-[#23282F]">
                Model
              </label>
              <Select value={currentModelUrl} onValueChange={onModelChange}>
                <SelectTrigger className="h-[72px] w-full cursor-pointer rounded-[12px] border-0 bg-[#F3F4F8] px-5 py-3 text-left shadow-none hover:bg-[#EEF1F6]">
                  {(() => {
                    const selectedModel = modelOptions.find(
                      (model) => model.url === currentModelUrl,
                    );

                    return selectedModel ? (
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
                    );
                  })()}
                </SelectTrigger>
                <SelectContent className={WORKBENCH_SELECT_CONTENT_CLASS}>
                  {modelOptions.map((model) => (
                    <SelectItem
                      key={model.url}
                      value={model.url}
                      className={WORKBENCH_SELECT_ITEM_CLASS}
                    >
                      <div className="flex w-full items-center gap-3 rounded-xl py-4 pl-4 pr-8 transition-all duration-200">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff7df] text-sm font-bold text-[#7a5600]">
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
                          <p className="flex items-center gap-2 truncate text-sm font-medium text-[#23282F]">
                            {model.label}
                            {model.badge ? (
                              <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                                {model.badge}
                              </span>
                            ) : null}
                          </p>
                          {model.description ? (
                            <p className="mt-1.5 line-clamp-2 text-xs text-[#666666]">
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

          {(() => {
            const styleField = config.schema.style;
            if (!styleField || styleField.visible === false) {
              return null;
            }

            const localizedStyleField = localizeFieldSchema(
              "style",
              styleField,
              config.scenarioType,
              t,
            );

            return (
              <div className="space-y-2">
                <label className="text-[15px] font-medium text-[#23282F]">
                  {localizedStyleField.label}
                </label>
                {renderStyleSelect("style", localizedStyleField)}
              </div>
            );
          })()}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-4">
          <div className="space-y-5 pb-4">
            {referenceImageField && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[15px] font-medium text-[#23282F]">
                    {referenceImageField.label}
                    {referenceImageField.required && (
                      <span className="ml-1 text-red-400">*</span>
                    )}
                  </label>
                  <span className="text-xs text-[#666666]">
                    {uploadedImages.length}/{referenceImageField.maxFiles || 1}
                  </span>
                </div>
                <ImageUploader
                  allowMultiple={referenceImageField.multiple}
                  maxImages={referenceImageField.maxFiles || 1}
                  accept={referenceImageField.accept}
                  uploadUrl={referenceImageField.uploadUrl}
                  previewType={referenceImageField.previewType}
                  maxSizeMB={referenceImageField.maxSizeMB}
                  title={undefined}
                  emptyHint={undefined}
                  defaultPreviews={getUploadedMediaUrls(
                    formValues.referenceImages,
                  )}
                  onChange={(items) =>
                    updateValues({
                      ...formValues,
                      referenceImages: items,
                    })
                  }
                  uploadMetadata={uploadMetadata}
                  resourceLibraryPlacement="studio-panel"
                />
                <div className="flex items-center gap-2 text-xs text-[#666666]">
                  <ImagePlus className="size-3.5" />
                  <span>
                    {isUploadingImages
                      ? t("uploads.uploading")
                      : referenceImageField.description ||
                        "Add a source image to guide the new result."}
                  </span>
                </div>
              </div>
            )}

            {promptField && showPromptField && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[15px] font-medium text-[#23282F]">
                    Creative Prompt
                    {promptField.required && (
                      <span className="ml-1 text-red-400">*</span>
                    )}
                  </label>
                  <span className="text-xs text-[#666666]">
                    {promptValue.length}/{maxLength}
                  </span>
                </div>
                <textarea
                  value={promptValue}
                  onChange={(e) =>
                    updateValues({ ...formValues, prompt: e.target.value })
                  }
                  placeholder="Describe the refreshed look, mood, and details you want the new image to capture."
                  maxLength={maxLength}
                  className="min-h-[160px] w-full resize-none rounded-[12px] border border-[#E5E7EB] bg-[#F3F4F8] px-3 py-3 text-sm text-[#23282F] placeholder:text-[#666666] shadow-none focus:border-[#00B2FF] focus:bg-white focus:outline-none"
                  disabled={isGenerating}
                />
              </div>
            )}

            {Object.entries(config.schema).map(([key, field]) => {
              if (
                !field ||
                key === "prompt" ||
                key === "referenceImages" ||
                key === "style"
              ) {
                return null;
              }
              if (field.visible === false) {
                return null;
              }

              const localizedField = localizeFieldSchema(
                key,
                field,
                config.scenarioType,
                t,
              );

              if (localizedField.type === "select" && key === "aspectRatio") {
                return (
                  <div key={key} className="space-y-2.5">
                    <label className="text-[15px] font-medium text-[#23282F]">
                      Framing Ratio
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {localizedField.options?.slice(0, 7).map((option) => {
                        const optionValue = String(option.value);
                        const isSelected =
                          String(
                            formValues[key] ?? localizedField.defaultValue,
                          ) === optionValue;

                        return (
                          <button
                            key={optionValue}
                            type="button"
                            onClick={() =>
                              updateValues({
                                ...formValues,
                                [key]: option.value,
                              })
                            }
                            className={cn(
                              "flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-[10px] border px-1.5 py-2 transition-all duration-300",
                              isSelected
                                ? "border-[#D7E7FF] bg-white text-[#2A65FF] shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
                                : "border-transparent bg-[#F3F4F8] hover:border-[#D7E7FF] hover:bg-white",
                            )}
                            disabled={isGenerating}
                          >
                            <AspectRatioIcon
                              ratio={optionValue}
                              isSelected={isSelected}
                              autoLabel={t("aspectRatio.auto")}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                isSelected
                                  ? "text-[#2A65FF]"
                                  : "text-[#23282F]",
                              )}
                            >
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (localizedField.type === "select") {
                return (
                  <div key={key} className="space-y-2.5">
                    <label className="text-[15px] font-medium text-[#23282F]">
                      {localizedField.label}
                    </label>
                    {key === "style" ? (
                      renderStyleSelect(key, localizedField)
                    ) : (
                      <Select
                        value={String(
                          formValues[key] ?? localizedField.defaultValue,
                        )}
                        onValueChange={(value) =>
                          updateSelectValue(key, value, localizedField)
                        }
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-[48px] rounded-[12px] border-0 bg-[#F3F4F8] text-[#23282F] hover:bg-[#EEF1F6] [&_[data-slot=select-value]]:text-[#23282F] [&_[data-slot=select-value]]:opacity-100 [&_[data-slot=select-value][data-placeholder]]:text-[#8A94A6]">
                          <SelectValue
                            className="text-[#23282F] opacity-100"
                            placeholder={
                              localizedField.placeholder || localizedField.label
                            }
                          />
                        </SelectTrigger>
                        <SelectContent
                          className={WORKBENCH_SELECT_CONTENT_CLASS}
                        >
                          {localizedField.options?.map((option) => (
                            <SelectItem
                              key={String(option.value)}
                              value={String(option.value)}
                              className={WORKBENCH_SELECT_ITEM_CLASS}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        <div className="pt-4">
          <button
            data-generate-btn
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isUploadingImages ||
              hasUploadingAdditionalUploads ||
              (isPromptRequired && !promptValue.trim()) ||
              (isReferenceImagesRequiredForSubmit && !hasUploadedImages) ||
              hasMissingRequiredUploads ||
              hasMissingRequiredFields
            }
            className={cn(
              "h-[62px] w-full rounded-full border-0 text-base font-semibold text-white transition-all duration-300",
              "bg-[#23282F] hover:scale-[1.02] hover:bg-[#333333] hover:shadow-xl hover:shadow-black/15",
              "disabled:cursor-not-allowed disabled:bg-[#EFE7C8] disabled:text-[#9A8F66] disabled:hover:scale-100",
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                {t("actions.generating")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 inline h-4 w-4" />
                Generate AI Image
                {requiredCredits !== null && requiredCredits !== undefined && (
                  <span className="ml-1.5 opacity-90">
                    ({requiredCredits} {t("credits")})
                  </span>
                )}
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <MediaWorkbenchFormShell
      t={t}
      sceneTitle={sceneTitle}
      sceneIconUrl={sceneIconUrl}
      sceneOptions={sceneOptions}
      currentSceneId={currentSceneId}
      onSceneChange={onSceneChange}
      modelOptions={modelOptions}
      currentModelUrl={currentModelUrl}
      onModelChange={onModelChange}
      configModelName={config.model.name}
      variant={shellVariant}
      hideSceneTabs={hideSceneTabs}
      footer={
        <>
          <button
            data-generate-btn
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isUploadingImages ||
              hasUploadingAdditionalUploads ||
              (isPromptRequired && !promptValue.trim()) ||
              (isReferenceImagesRequiredForSubmit && !hasUploadedImages) ||
              hasMissingRequiredUploads ||
              hasMissingRequiredFields
            }
            className={cn(
              "h-[62px] w-full rounded-full border-0 text-base font-semibold text-white transition-all duration-300",
              "bg-[#23282F] hover:scale-[1.02] hover:bg-[#333333] hover:shadow-xl hover:shadow-black/15",
              "disabled:cursor-not-allowed disabled:bg-[#EFE7C8] disabled:text-[#9A8F66] disabled:hover:scale-100",
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                {t("actions.generating")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 inline h-4 w-4" />
                {generateLabel}
                {requiredCredits !== null && requiredCredits !== undefined && (
                  <span className="ml-1.5 opacity-90">
                    ({requiredCredits} {t("credits")})
                  </span>
                )}
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </>
      }
    >
      {referenceImageField && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className={fieldLabelClass}>
              {referenceImageField.label}
              {referenceImageField.required && (
                <span className="ml-1 text-red-400">*</span>
              )}
            </label>
            <span className="text-xs text-[#666666]">
              {uploadedImages.length}/{referenceImageField.maxFiles || 1}
            </span>
          </div>
          <div
            className={cn(
              "border border-[#E5E7EB] p-3 shadow-none",
              isMangoVariant
                ? "rounded-[12px] bg-[#F3F4F8]"
                : "rounded-2xl bg-[#F5F7F9]",
            )}
          >
            <ImageUploader
              allowMultiple={referenceImageField.multiple}
              maxImages={referenceImageField.maxFiles || 1}
              accept={referenceImageField.accept}
              uploadUrl={referenceImageField.uploadUrl}
              previewType={referenceImageField.previewType}
              maxSizeMB={referenceImageField.maxSizeMB}
              title={undefined}
              emptyHint={undefined}
              defaultPreviews={getUploadedMediaUrls(formValues.referenceImages)}
              onChange={(items) =>
                updateValues({
                  ...formValues,
                  referenceImages: items,
                })
              }
              uploadMetadata={uploadMetadata}
              resourceLibraryPlacement="studio-panel"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#666666]">
            <ImagePlus className="size-3.5" />
            <span>
              {isUploadingImages
                ? t("uploads.uploading")
                : referenceImageField.description || t("uploads.referenceHint")}
            </span>
          </div>
        </div>
      )}

      {promptField && showPromptField && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className={fieldLabelClass}>
              {promptField.label}
              {promptField.required && (
                <span className="ml-1 text-red-400">*</span>
              )}
            </label>
            <span className="text-xs text-[#666666]">
              {promptValue.length}/{maxLength}
            </span>
          </div>
          <textarea
            value={promptValue}
            onChange={(e) =>
              updateValues({ ...formValues, prompt: e.target.value })
            }
            placeholder={
              promptField.placeholder || t("prompt.referencePlaceholder")
            }
            maxLength={maxLength}
            className={cn(
              "w-full resize-none border border-[#E5E7EB] px-3 py-3 text-sm text-[#23282F] placeholder:text-[#666666] shadow-none transition-all duration-300 focus:border-[#00B2FF] focus:bg-white focus:outline-none",
              isMangoVariant
                ? "min-h-[180px] rounded-[12px] bg-[#F3F4F8]"
                : "min-h-[110px] rounded-lg bg-[#F5F7F9]",
            )}
            disabled={isGenerating}
          />
        </div>
      )}

      {Object.entries(config.schema).map(([key, field]) => {
        if (!field || key === "prompt" || key === "referenceImages") {
          return null;
        }

        if (field.visible === false) {
          return null;
        }

        const localizedField = localizeFieldSchema(
          key,
          field,
          config.scenarioType,
          t,
        );

        return (
          <div key={key} className="space-y-2.5">
            {localizedField.type !== "toggle" &&
              localizedField.type !== "upload" && (
                <label className={fieldLabelClass}>
                  {localizedField.label}
                  {localizedField.required && (
                    <span className="ml-1 text-red-400">*</span>
                  )}
                </label>
              )}

            {localizedField.type === "slider" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-6 flex-1 items-center">
                    <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full border border-[#E5E7EB] bg-[#EEF1F4]" />
                    <div
                      className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full border border-[#FFC100]/30 bg-gradient-to-r from-[#FFC100] via-[#FFD966] to-[#FFE8A3] transition-all duration-200"
                      style={{
                        width: `${(((formValues[key] ?? localizedField.defaultValue) - (localizedField.min || 0)) / ((localizedField.max || 100) - (localizedField.min || 0))) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={localizedField.min}
                      max={localizedField.max}
                      step={localizedField.step}
                      value={formValues[key] ?? localizedField.defaultValue}
                      onChange={(e) =>
                        updateValues({
                          ...formValues,
                          [key]: Number(e.target.value),
                        })
                      }
                      disabled={isGenerating}
                      className={cn(
                        "relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent",
                        "[&::-webkit-slider-thumb]:appearance-none",
                        "[&::-webkit-slider-thumb]:h-6",
                        "[&::-webkit-slider-thumb]:w-6",
                        "[&::-webkit-slider-thumb]:rounded-full",
                        "[&::-webkit-slider-thumb]:border-[3px]",
                        "[&::-webkit-slider-thumb]:border-white",
                        "[&::-webkit-slider-thumb]:bg-[#23282F]",
                        "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,193,0,0.16),0_6px_18px_rgba(35,40,47,0.24)]",
                        "[&::-webkit-slider-runnable-track]:bg-transparent",
                        "[&::-moz-range-thumb]:h-6",
                        "[&::-moz-range-thumb]:w-6",
                        "[&::-moz-range-thumb]:rounded-full",
                        "[&::-moz-range-thumb]:border-[3px]",
                        "[&::-moz-range-thumb]:border-white",
                        "[&::-moz-range-thumb]:bg-[#23282F]",
                        "[&::-moz-range-track]:bg-transparent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    />
                  </div>
                  <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#23282F] shadow-none">
                    {typeof (formValues[key] ?? localizedField.defaultValue) ===
                    "number"
                      ? Number(formValues[key] ?? localizedField.defaultValue)
                          .toFixed(2)
                          .replace(/\.00$/, "")
                      : (formValues[key] ?? localizedField.defaultValue)}
                  </div>
                </div>
              </div>
            )}

            {localizedField.type === "textarea" && (
              <textarea
                value={String(
                  formValues[key] ?? localizedField.defaultValue ?? "",
                )}
                onChange={(e) =>
                  updateValues({ ...formValues, [key]: e.target.value })
                }
                placeholder={localizedField.placeholder || localizedField.label}
                className="min-h-[96px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F5F7F9] px-3 py-3 text-sm text-[#23282F] placeholder:text-[#666666] shadow-none transition-all duration-300 hover:bg-white focus:border-[#00B2FF] focus:bg-white focus:outline-none"
                disabled={isGenerating}
              />
            )}

            {localizedField.type === "text" && (
              <input
                type="text"
                value={String(
                  formValues[key] ?? localizedField.defaultValue ?? "",
                )}
                onChange={(e) =>
                  updateValues({ ...formValues, [key]: e.target.value })
                }
                placeholder={localizedField.placeholder || localizedField.label}
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F5F7F9] px-3 text-sm text-[#23282F] placeholder:text-[#666666] shadow-none transition-all duration-300 hover:bg-white focus:border-[#00B2FF] focus:bg-white focus:outline-none"
                disabled={isGenerating}
              />
            )}

            {localizedField.type === "number" && (
              <input
                type="number"
                min={localizedField.min}
                max={localizedField.max}
                step={localizedField.step}
                value={formValues[key] ?? localizedField.defaultValue ?? ""}
                onChange={(e) =>
                  updateValues({
                    ...formValues,
                    [key]: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder={localizedField.placeholder || localizedField.label}
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F5F7F9] px-3 text-sm text-[#23282F] placeholder:text-[#666666] shadow-none transition-all duration-300 hover:bg-white focus:border-[#00B2FF] focus:bg-white focus:outline-none"
                disabled={isGenerating}
              />
            )}

            {localizedField.type === "select" && key === "aspectRatio" && (
              <div className="flex flex-wrap justify-start gap-2">
                {localizedField.options?.map((option) => {
                  const optionValue = String(option.value);
                  const isSelected =
                    String(formValues[key] ?? localizedField.defaultValue) ===
                    optionValue;

                  return (
                    <button
                      key={optionValue}
                      type="button"
                      onClick={() =>
                        updateValues({ ...formValues, [key]: option.value })
                      }
                      className={cn(
                        "flex w-[56px] flex-col items-center justify-center gap-1 border px-1.5 py-2 transition-all duration-300 sm:w-[60px]",
                        isMangoVariant ? "rounded-[10px]" : "rounded-lg",
                        isSelected
                          ? isMangoVariant
                            ? "border-[#D7E7FF] bg-white text-[#2A65FF] shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
                            : "border-[#23282F]/16 bg-[#fff4c6] shadow-none"
                          : isMangoVariant
                            ? "border-transparent bg-[#F3F4F8] hover:border-[#D7E7FF] hover:bg-white"
                            : "border-[#E5E7EB] bg-white hover:border-[#23282F]/12 hover:bg-[#fff7df]",
                      )}
                      disabled={isGenerating}
                    >
                      <AspectRatioIcon
                        ratio={optionValue}
                        isSelected={isSelected}
                        autoLabel={t("aspectRatio.auto")}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          isSelected ? "text-[#23282F]" : "text-[#666666]",
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {localizedField.type === "select" &&
              key !== "aspectRatio" &&
              (key === "style" ? (
                renderStyleSelect(key, localizedField)
              ) : (
                <Select
                  value={String(formValues[key] ?? localizedField.defaultValue)}
                  onValueChange={(value) =>
                    updateSelectValue(key, value, localizedField)
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger className={WORKBENCH_SELECT_TRIGGER_CLASS}>
                    <SelectValue
                      placeholder={
                        localizedField.placeholder || localizedField.label
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    preventCloseAutoFocus
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className={WORKBENCH_SELECT_CONTENT_CLASS}
                  >
                    {localizedField.options?.map((option) => (
                      <SelectItem
                        key={String(option.value)}
                        value={String(option.value)}
                        className={WORKBENCH_SELECT_ITEM_CLASS}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

            {localizedField.type === "toggle" && (
              <label
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center justify-between border border-[#E5E7EB] px-3.5 py-3 shadow-none transition-all duration-300 hover:bg-white",
                  isMangoVariant
                    ? "rounded-[12px] bg-[#F3F4F8]"
                    : "rounded-xl bg-[#F5F7F9]",
                )}
              >
                <div className="pr-4">
                  <p className="text-sm font-medium text-[#23282F]">
                    {localizedField.label}
                  </p>
                  {localizedField.description ? (
                    <p className="mt-1 text-xs text-[#666666]">
                      {localizedField.description}
                    </p>
                  ) : null}
                </div>
                <Checkbox
                  checked={Boolean(
                    formValues[key] ?? localizedField.defaultValue,
                  )}
                  onCheckedChange={(checked) =>
                    updateValues({ ...formValues, [key]: Boolean(checked) })
                  }
                  disabled={isGenerating}
                  className={WORKBENCH_TOGGLE_CHECKBOX_CLASS}
                />
              </label>
            )}

            {localizedField.type === "upload" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className={fieldLabelClass}>
                    {localizedField.label}
                    {localizedField.required && (
                      <span className="ml-1 text-red-400">*</span>
                    )}
                  </label>
                  <span className="text-xs text-[#666666]">
                    {getUploadedImageItems(formValues[key]).length}/
                    {localizedField.maxFiles || 1}
                  </span>
                </div>
                <div
                  className={cn(
                    "border border-[#E5E7EB] p-3",
                    isMangoVariant
                      ? "rounded-[12px] bg-[#F3F4F8]"
                      : "rounded-2xl bg-[#F5F7F9]",
                  )}
                >
                  <ImageUploader
                    allowMultiple={localizedField.multiple}
                    maxImages={localizedField.maxFiles || 1}
                    accept={localizedField.accept}
                    uploadUrl={localizedField.uploadUrl}
                    previewType={localizedField.previewType}
                    maxSizeMB={localizedField.maxSizeMB}
                    title={undefined}
                    emptyHint={undefined}
                    defaultPreviews={getUploadedMediaUrls(formValues[key])}
                    onChange={(items) =>
                      updateValues({
                        ...formValues,
                        [key]: items,
                      })
                    }
                    uploadMetadata={uploadMetadata}
                    resourceLibraryPlacement="studio-panel"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#666666]">
                  <ImagePlus className="size-3.5" />
                  <span>
                    {getUploadedImageItems(formValues[key]).some(
                      (item) => item.status === "uploading",
                    )
                      ? t("uploads.uploading")
                      : localizedField.description || t("uploads.defaultHint")}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </MediaWorkbenchFormShell>
  );
}
