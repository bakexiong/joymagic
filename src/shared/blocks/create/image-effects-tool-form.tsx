"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

import { Link, usePathname } from "@/core/i18n/navigation";
import {
  ImageUploader,
  type ImageUploaderValue,
} from "@/shared/blocks/common/image-uploader";
import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAppContext } from "@/shared/contexts/app";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import { downloadFileFromUrl } from "@/shared/lib/image-preview";
import {
  getImageEffectRequiredInputCount,
  getImageEffectItemsSync,
  type ImageEffectItem,
} from "@/shared/lib/image-effect-data";
import { withOssImageMaxSide, withOssImageResize } from "@/shared/lib/cdn";
import { cn } from "@/shared/lib/utils";

type ImageEffectsToolFormProps = {
  selectedEffectSlug?: string | null;
  onEffectSlugChange?: (slug: string) => void;
  prefillReferenceImages?: ImageUploaderValue[];
  prefillNonce?: number;
  onGenerateSuccess?: () => void;
  layout?: "panel" | "studio";
  lockSelectedEffect?: boolean;
};

type ExampleOption = {
  inputImageUrls: string[];
  outputImageUrl: string;
};

type GeneratedPreview = {
  inputImageUrls: string[];
  outputImageUrl: string;
  effectTitle: string;
};

type PendingStudioTask = {
  requestId: string;
  scenario: string;
  createdAt: string;
  inputImageUrls: string[];
  effectSlug: string;
  effectTitle: string;
  aspectRatio: string;
};

const STUDIO_SUCCESS_STATUSES = new Set(["completed", "success"]);
const STUDIO_FAILURE_STATUSES = new Set(["failed", "error"]);
const STUDIO_FORM_PANEL_HEIGHT_CLASS = "h-[640px]";
const STUDIO_PREVIEW_PANEL_HEIGHT_CLASS = "h-[620px]";

function getInputPreviewUrls(source?: {
  inputImageUrl?: string;
  inputImageUrls?: string[];
}) {
  const urls = source?.inputImageUrls?.filter(Boolean) || [];
  if (urls.length > 0) {
    return urls.slice(0, 2);
  }

  return source?.inputImageUrl ? [source.inputImageUrl] : [];
}

function getExampleInputUrls(effect: ImageEffectItem) {
  const examples = new Map<string, ExampleOption>();

  const addExample = (inputImageUrls: string[], outputImageUrl?: string) => {
    const cleanedInputs = inputImageUrls.filter(Boolean);
    if (cleanedInputs.length === 0 || !outputImageUrl) {
      return;
    }

    const key = `${cleanedInputs.join("|")}::${outputImageUrl}`;
    if (!examples.has(key)) {
      examples.set(key, {
        inputImageUrls: cleanedInputs,
        outputImageUrl,
      });
    }
  };

  addExample(
    getInputPreviewUrls(effect.previewExample),
    effect.previewExample?.outputImageUrl || effect.coverUrl,
  );

  effect.examples?.forEach((example) => {
    addExample(getInputPreviewUrls(example), example.outputImageUrl);
  });

  return Array.from(examples.values()).slice(0, 8);
}

function getImageEffectStylePreviewImageUrl(effect?: ImageEffectItem | null) {
  if (!effect) {
    return "";
  }

  if (effect.previewExample?.outputImageUrl) {
    return effect.previewExample.outputImageUrl;
  }

  if (effect.coverUrl) {
    return effect.coverUrl;
  }

  if (effect.posterUrl) {
    return effect.posterUrl;
  }

  const exampleOutputUrl = effect.examples
    ?.map((example) => example.outputImageUrl)
    .find(Boolean);
  if (exampleOutputUrl) {
    return exampleOutputUrl;
  }

  const exampleInputUrl = effect.examples
    ?.map((example) => getInputPreviewUrls(example)[0])
    .find(Boolean);
  if (exampleInputUrl) {
    return exampleInputUrl;
  }

  return getInputPreviewUrls(effect.previewExample)[0] || "";
}

function normalizePrefillImages(
  items: ImageUploaderValue[],
): ImageUploaderValue[] {
  return items.reduce<ImageUploaderValue[]>((result, item, index) => {
    const preview = String(item.preview || item.url || "").trim();
    const url = String(item.url || item.preview || "").trim();

    if (!preview && !url) {
      return result;
    }

    result.push({
      ...item,
      id: item.id || `prefill-image-${index}`,
      preview: preview || url,
      url: url || preview,
      status: "uploaded" as const,
    });

    return result;
  }, []);
}

function renderErrorMessage(message: string) {
  if (message !== "Insufficient credits. Please upgrade to continue.") {
    return <span className="break-words">{message}</span>;
  }

  return (
    <span className="break-words">
      {message}{" "}
      <Link
        href="/pricing"
        className="font-semibold underline underline-offset-2"
      >
        Pricing
      </Link>
    </span>
  );
}

export function ImageEffectsToolForm({
  selectedEffectSlug,
  onEffectSlugChange,
  prefillReferenceImages,
  prefillNonce = 0,
  onGenerateSuccess,
  layout = "panel",
  lockSelectedEffect = false,
}: ImageEffectsToolFormProps) {
  const pathname = usePathname();
  const tCopy = useTranslations("landing.image-effects.workspace");
  const tGeneration = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const tCreator = useTranslations("creator.toolsDetailPage");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const items = useMemo(() => getImageEffectItemsSync(), []);
  const [internalEffectSlug, setInternalEffectSlug] = useState(
    selectedEffectSlug || items[0]?.slug || "",
  );
  const [uploadedItems, setUploadedItems] = useState<ImageUploaderValue[]>([]);
  const [selectedExample, setSelectedExample] = useState<ExampleOption | null>(
    null,
  );
  const [selectedExampleUrls, setSelectedExampleUrls] = useState<
    string[] | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [requiredCredits, setRequiredCredits] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(true);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [hasManualEffectSelection, setHasManualEffectSelection] =
    useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [generatedPreview, setGeneratedPreview] =
    useState<GeneratedPreview | null>(null);
  const [showStudioResultPanel, setShowStudioResultPanel] = useState(false);
  const [studioPendingItemCount, setStudioPendingItemCount] = useState(0);
  const [studioGeneratedItems, setStudioGeneratedItems] = useState<
    GeneratedMediaItem[]
  >([]);
  const [isEffectDialogOpen, setIsEffectDialogOpen] = useState(false);
  const [studioFakeProgress, setStudioFakeProgress] = useState(0);
  const [pendingEffectTitle, setPendingEffectTitle] = useState<string | null>(
    null,
  );
  const [previewResultUrl, setPreviewResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEffectSlug) {
      setInternalEffectSlug(selectedEffectSlug);
    }
  }, [selectedEffectSlug]);

  useEffect(() => {
    if (lockSelectedEffect && selectedEffectSlug) {
      setHasManualEffectSelection(true);
    }
  }, [lockSelectedEffect, selectedEffectSlug]);

  const effect =
    items.find((item) => item.slug === internalEffectSlug) ?? items[0] ?? null;
  const effectThumbUrl = getImageEffectStylePreviewImageUrl(effect);
  const effectThumbCardUrl =
    withOssImageMaxSide(effectThumbUrl, 420) || effectThumbUrl;

  useEffect(() => {
    if (!effect) {
      return;
    }

    onEffectSlugChange?.(effect.slug);
  }, [effect, onEffectSlugChange]);

  useEffect(() => {
    let cancelled = false;

    const loadRequiredCredits = async () => {
      setIsEstimating(true);
      setEstimateError(null);

      try {
        const response = await fetch("/api/ai/image-effect/estimate-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.code !== 0) {
          throw new Error(result.message || "Failed to estimate credits");
        }

        if (!cancelled) {
          setRequiredCredits(result.data?.requiredCredits ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setRequiredCredits(null);
          setEstimateError(
            error instanceof Error
              ? error.message
              : "Failed to estimate credits",
          );
        }
      } finally {
        if (!cancelled) {
          setIsEstimating(false);
        }
      }
    };

    void loadRequiredCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setGenerationError("");
    setGeneratedPreview(null);
    setShowStudioResultPanel(false);
    setStudioPendingItemCount(0);
    setStudioGeneratedItems([]);
    setPendingEffectTitle(null);
  }, [effect?.slug]);

  useEffect(() => {
    if (!prefillReferenceImages?.length) {
      return;
    }

    const normalizedPrefillImages = normalizePrefillImages(
      prefillReferenceImages,
    );

    if (!normalizedPrefillImages.length) {
      return;
    }

    setSelectedExample(null);
    setSelectedExampleUrls(
      normalizedPrefillImages
        .map((item) => item.url || item.preview)
        .filter((value): value is string => Boolean(value)),
    );
    setUploadedItems(normalizedPrefillImages);
    setGenerationError("");
    setGeneratedPreview(null);
    setShowStudioResultPanel(false);
    setStudioPendingItemCount(0);
    setStudioGeneratedItems([]);
    setPendingEffectTitle(null);
  }, [prefillNonce, prefillReferenceImages]);

  const requiredInputCount = getImageEffectRequiredInputCount(
    effect?.requiredInputCount,
  );
  const exampleOptions = useMemo(
    () => (effect ? getExampleInputUrls(effect) : []),
    [effect],
  );
  const uploadedImageUrls = useMemo(
    () =>
      uploadedItems
        .filter((item) => item.status === "uploaded" && item.url)
        .map((item) => item.url as string)
        .slice(0, requiredInputCount),
    [requiredInputCount, uploadedItems],
  );
  const uploadedReady = uploadedImageUrls.length >= requiredInputCount;
  const isUploading = uploadedItems.some((item) => item.status === "uploading");

  const previewInputUrls = selectedExample?.inputImageUrls?.length
    ? selectedExample.inputImageUrls
    : selectedExampleUrls?.length
      ? selectedExampleUrls
      : getInputPreviewUrls(effect?.previewExample).length
        ? getInputPreviewUrls(effect?.previewExample)
        : getInputPreviewUrls(effect || undefined).length
          ? getInputPreviewUrls(effect || undefined)
          : [effect?.posterUrl || effect?.coverUrl].filter(Boolean);
  const previewOutputUrl =
    selectedExample?.outputImageUrl ||
    effect?.previewExample?.outputImageUrl ||
    effect?.coverUrl;
  const hasDistinctPreviewImages =
    previewInputUrls.length > 0 &&
    Boolean(previewOutputUrl) &&
    previewInputUrls.some((url) => url !== previewOutputUrl);
  const workspacePreviewInputUrls = selectedExample?.inputImageUrls?.length
    ? selectedExample.inputImageUrls
    : selectedExampleUrls?.length
      ? selectedExampleUrls
      : uploadedImageUrls.length
        ? uploadedImageUrls
        : [];
  const primaryPreviewInputUrl = workspacePreviewInputUrls[0] || null;
  const rotatingPreviewEffect =
    !hasManualEffectSelection && items.length > 0
      ? items[carouselIndex % items.length] || effect
      : effect;
  const rotatingPreviewInputUrls = getInputPreviewUrls(
    rotatingPreviewEffect?.previewExample,
  );
  const rotatingPreviewInputUrl =
    rotatingPreviewInputUrls[0] ||
    rotatingPreviewEffect?.posterUrl ||
    rotatingPreviewEffect?.coverUrl ||
    primaryPreviewInputUrl;
  const rotatingPreviewOutputUrl =
    rotatingPreviewEffect?.previewExample?.outputImageUrl ||
    rotatingPreviewEffect?.coverUrl ||
    previewOutputUrl;
  const studioPreviewInputUrls = generatedPreview?.inputImageUrls?.length
    ? generatedPreview.inputImageUrls
    : rotatingPreviewInputUrl
      ? [rotatingPreviewInputUrl]
      : [];
  const studioPreviewOutputUrl =
    generatedPreview?.outputImageUrl || rotatingPreviewOutputUrl;
  const studioPreviewTitle =
    generatedPreview?.effectTitle ||
    pendingEffectTitle ||
    rotatingPreviewEffect?.title ||
    effect.title;
  const isStudioPending = layout === "studio" && studioPendingItemCount > 0;

  useEffect(() => {
    if (!isStudioPending) {
      setStudioFakeProgress(0);
      return;
    }

    setStudioFakeProgress((current) => (current > 0 ? current : 6));

    const timer = window.setInterval(() => {
      setStudioFakeProgress((current) => {
        if (current < 24) return current + 6;
        if (current < 48) return current + 4;
        if (current < 72) return current + 3;
        if (current < 88) return current + 2;
        if (current < 95) return current + 1;
        return current;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [isStudioPending]);

  useEffect(() => {
    if (hasManualEffectSelection || items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % items.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [hasManualEffectSelection, items.length]);

  const handleExampleSelect = (example: ExampleOption) => {
    if (!effect) {
      return;
    }

    setSelectedExample(example);
    setSelectedExampleUrls(example.inputImageUrls);
    setGenerationError("");
    setUploadedItems(
      example.inputImageUrls.map((url, index) => ({
        id: `example-${effect.slug}-${index}-${url}`,
        preview: url,
        url,
        status: "uploaded" as const,
      })),
    );
  };

  const handleUploadedItemsChange = (nextItems: ImageUploaderValue[]) => {
    setUploadedItems(nextItems);
    setGeneratedPreview(null);
    setShowStudioResultPanel(false);
    setStudioPendingItemCount(0);
    setStudioGeneratedItems([]);
    setPendingEffectTitle(null);

    if (!selectedExample) {
      return;
    }

    const nextUploadedUrls = nextItems
      .filter((item) => item.status === "uploaded" && item.url)
      .map((item) => item.url as string);
    const stillUsingSelectedExample = selectedExample.inputImageUrls.every(
      (url) => nextUploadedUrls.includes(url),
    );

    if (!stillUsingSelectedExample) {
      setSelectedExample(null);
      setSelectedExampleUrls(null);
    }
  };

  const buildGeneratedMediaItem = (
    url: string,
    inputImageUrls: string[],
    createdAt: string,
    taskOverride?: Pick<
      PendingStudioTask,
      "effectSlug" | "effectTitle" | "aspectRatio"
    >,
  ): GeneratedMediaItem => ({
    url,
    params: {
      effect: taskOverride?.effectSlug || effect.slug,
      effectTitle: taskOverride?.effectTitle || effect.title,
      image: inputImageUrls[0],
      images: inputImageUrls,
    },
    aspectRatio: taskOverride?.aspectRatio || effect.aspectRatio,
    createdAt,
    sceneId: `image-effect-${taskOverride?.effectSlug || effect.slug}`,
    prompt: taskOverride?.effectTitle || effect.title,
  });

  const pollStudioTask = async (task: PendingStudioTask) => {
    const maxAttempts = 120;
    const pollingInterval = 2000;

    const extractOutputs = (payload: any): string[] => {
      const candidates = [payload?.data?.outputs, payload?.outputs];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate.filter(
            (item: unknown): item is string =>
              typeof item === "string" && Boolean(item),
          );
        }
      }

      const singleOutputCandidates = [
        payload?.data?.output,
        payload?.data?.output_url,
        payload?.data?.imageUrl,
        payload?.output,
        payload?.output_url,
        payload?.imageUrl,
      ];

      for (const candidate of singleOutputCandidates) {
        if (typeof candidate === "string" && candidate) {
          return [candidate];
        }
      }

      return [];
    };

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        const response = await fetch(
          `/api/ai/status?taskId=${encodeURIComponent(task.requestId)}&scenario=${encodeURIComponent(task.scenario)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch task status");
        }

        const payload = await response.json();
        if (payload?.code !== 0) {
          throw new Error(payload?.message || "Failed to fetch task status");
        }

        const status = payload?.data?.status;
        if (STUDIO_SUCCESS_STATUSES.has(status)) {
          const outputs = extractOutputs(payload);
          if (outputs.length === 0) {
            throw new Error("Result URL not found");
          }

          setStudioGeneratedItems(
            outputs.map((url) =>
              buildGeneratedMediaItem(
                url,
                task.inputImageUrls,
                task.createdAt,
                task,
              ),
            ),
          );
          setGeneratedPreview({
            inputImageUrls: task.inputImageUrls,
            outputImageUrl: outputs[0],
            effectTitle: task.effectTitle,
          });
          setStudioPendingItemCount(0);
          setPendingEffectTitle(null);
          onGenerateSuccess?.();
          void fetchUserInfo();
          return;
        }

        if (STUDIO_FAILURE_STATUSES.has(status)) {
          throw new Error(payload?.data?.error || "Task failed");
        }
      }

      throw new Error("Task polling timeout");
    } catch (error) {
      console.error("[image-effects-tool-form] studio task failed:", error);
      setStudioPendingItemCount(0);
      setPendingEffectTitle(null);
      setGenerationError(
        error instanceof Error ? error.message : "Task polling timeout",
      );
    }
  };

  const handleGenerate = async () => {
    if (!effect) {
      return;
    }

    if (!uploadedReady) {
      setGenerationError(tCopy("uploadHint"));
      return;
    }

    setGenerationError("");
    setIsGenerating(true);
    const currentInputImageUrls = [...uploadedImageUrls];
    const currentCreatedAt = new Date().toISOString();
    const currentEffectTitle = effect.title;
    setPendingEffectTitle(currentEffectTitle);

    const result = await executeGeneration(
      {
        apiEndpoint: "/api/ai/image-effect/generate",
        scenario: "gpt-image-2-image-to-image",
        buildStatusEndpoint: (requestId) =>
          `/api/ai/status?taskId=${encodeURIComponent(requestId)}&scenario=gpt-image-2-image-to-image`,
        requestBody: {
          effectSlug: effect.slug,
          images: uploadedImageUrls,
        },
        requiredCredits,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      },
      {
        checkAccess: () => checkAccess(),
        showPricingModal: () => setIsShowPaymentModal(true),
        showSignModal: () => setIsShowSignModal(true),
        fetchUserInfo: async () => {
          await fetchUserInfo();
        },
        onTaskSubmitted:
          layout === "studio"
            ? ({ requestId, scenario }) => {
                const pendingTask: PendingStudioTask = {
                  requestId,
                  scenario,
                  createdAt: currentCreatedAt,
                  inputImageUrls: currentInputImageUrls,
                  effectSlug: effect.slug,
                  effectTitle: currentEffectTitle,
                  aspectRatio: effect.aspectRatio,
                };

                setShowStudioResultPanel(true);
                setStudioGeneratedItems([]);
                setStudioPendingItemCount(1);
                void pollStudioTask(pendingTask);
              }
            : undefined,
        deferPolling: layout === "studio",
        onStatusUpdate: () => {},
        onError: (error) => setGenerationError(error),
        translateApiError: (translationKey) =>
          tCommonApi(translationKey as any),
      },
      (key: string, params?: Record<string, any>) => {
        try {
          const translated = tGeneration(key as any, params as any);
          return typeof translated === "string"
            ? translated
            : params?.defaultValue || key;
        } catch {
          return params?.defaultValue || key;
        }
      },
    );

    if (result.success && result.url) {
      if (layout === "studio") {
        setShowStudioResultPanel(true);
        setStudioPendingItemCount(0);
        setStudioGeneratedItems([
          buildGeneratedMediaItem(
            result.url,
            currentInputImageUrls,
            currentCreatedAt,
          ),
        ]);
      }
      setGeneratedPreview({
        inputImageUrls: currentInputImageUrls,
        outputImageUrl: result.url,
        effectTitle: currentEffectTitle,
      });
      setPendingEffectTitle(null);
      onGenerateSuccess?.();
    }

    if (!result.success) {
      setPendingEffectTitle(null);
    }

    setIsGenerating(false);
  };

  if (!effect) {
    return null;
  }

  if (layout === "studio") {
    return (
      <div
        className="grid gap-2.5 xl:grid-cols-[430px_minmax(0,1fr)]"
        data-tool-generic-studio
      >
        <section
          className={cn(
            STUDIO_FORM_PANEL_HEIGHT_CLASS,
            "flex flex-col rounded-[20px] border border-[#D9E0EA] bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.06)]",
          )}
        >
          <div className="flex-1 min-h-0">
            <div className="flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
              <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                1.
              </span>
              <span>Choose an Effect Style</span>
            </div>

            <button
              type="button"
              onClick={() => setIsEffectDialogOpen(true)}
              className="mt-2 cursor-pointer overflow-hidden rounded-[18px] bg-[#F7F8FB] text-left transition hover:bg-[#F3F6FB]"
            >
              <div className="flex min-h-[92px] items-center gap-4 px-5 py-4">
                <div className="w-[124px] shrink-0 overflow-hidden rounded-[14px] bg-[#F2F4F8]">
                  {effectThumbUrl ? (
                    <img
                      src={effectThumbCardUrl}
                      alt={effect?.title}
                      className="aspect-[1.2] w-full bg-[#F2F4F8] object-contain"
                    />
                  ) : (
                    <div className="aspect-[1.2] w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[18px] font-normal text-[#3E434D]">
                    {effect?.title}
                  </p>
                </div>
                <div className="shrink-0 text-[#4B5563]">
                  <ChevronRight className="h-7 w-7 stroke-[1.75]" />
                </div>
              </div>
            </button>

            <div className="mt-3 flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
              <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                2.
              </span>
              <span>Upload Your Photo</span>
            </div>

            <div className="mt-2 overflow-hidden rounded-[12px]">
              {primaryPreviewInputUrl ? (
                <div className="relative h-[152px] bg-[#F2F4F8]">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedItems([]);
                      setSelectedExample(null);
                      setSelectedExampleUrls(null);
                      setGenerationError("");
                    }}
                    className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                    aria-label="Remove uploaded photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <img
                    src={primaryPreviewInputUrl || undefined}
                    alt={`${effect.title} input preview`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-1">
                  <ImageUploader
                    allowMultiple={requiredInputCount > 1}
                    maxImages={requiredInputCount}
                    maxSizeMB={15}
                    accept="image/*"
                    previewType="image"
                    emptyHint={undefined}
                    emptyStateTitle={undefined}
                    emptyStateSubtitle={undefined}
                    uploadButtonLabel={undefined}
                    defaultPreviews={selectedExampleUrls || undefined}
                    onChange={handleUploadedItemsChange}
                    uploadMetadata={{
                      sceneId: `image-effect-${effect.slug}`,
                      sceneLabel: effect.title,
                      modelUrl: pathname,
                      modelLabel: effect.title,
                    }}
                    resourceLibraryPlacement="studio-panel"
                    className={undefined}
                  />
                </div>
              )}
            </div>

            {exampleOptions.length > 0 ? (
              <div className="mt-1.5 flex items-center gap-2">
                <p className="shrink-0 text-[12px] font-medium text-[#23282F]">
                  Try a sample
                </p>
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {exampleOptions.map((example, index) => {
                    const isActive =
                      selectedExample?.outputImageUrl ===
                        example.outputImageUrl &&
                      selectedExample?.inputImageUrls.join("|") ===
                        example.inputImageUrls.join("|");

                    const exampleThumbUrl =
                      withOssImageResize(
                        example.inputImageUrls[0] || example.outputImageUrl,
                        80,
                        80,
                      ) ||
                      example.inputImageUrls[0] ||
                      example.outputImageUrl;

                    return (
                      <button
                        key={`${example.inputImageUrls.join("|")}-${example.outputImageUrl}-${index}`}
                        type="button"
                        onClick={() => handleExampleSelect(example)}
                        className={cn(
                          "relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border transition-all",
                          isActive
                            ? "border-[#2FB5FF] shadow-[0_0_0_2px_rgba(200,107,255,0.9)]"
                            : "border-[#D9E0EA] hover:border-[#3BA0FF]",
                        )}
                        aria-label={tCopy("exampleAria", { index: index + 1 })}
                      >
                        <img
                          src={exampleThumbUrl}
                          alt={`${effect.title} example ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto pt-3">
            <Button
              disabled={
                !uploadedReady ||
                isUploading ||
                isEstimating ||
                isGenerating ||
                isStudioPending
              }
              onClick={handleGenerate}
              className="h-[42px] w-full rounded-[12px] border-0 bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] text-[12px] font-semibold text-white shadow-none hover:opacity-95 disabled:bg-[#E6EAF2] disabled:text-[#9AA3AF]"
            >
              {isEstimating || isGenerating || isStudioPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>{tCopy("estimating")}</span>
                </>
              ) : (
                <span>Apply Photo Effects</span>
              )}
            </Button>

            <div className="mt-1.5 flex items-center justify-center gap-2 text-[13px] text-[#6B7280]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22B8FF_0%,#B23BFF_100%)] text-[11px] font-semibold text-white">
                ✦
              </span>
              <span>
                Credits required:{" "}
                <span className="font-medium text-[#23282F]">
                  {requiredCredits ?? 0} Credit(s)
                </span>
              </span>
            </div>

            {estimateError || generationError ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50 p-2 text-[10px] text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0">
                  {estimateError
                    ? renderErrorMessage(
                        `${tCopy("estimateError")} ${estimateError}`,
                      )
                    : renderErrorMessage(generationError)}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <Dialog open={isEffectDialogOpen} onOpenChange={setIsEffectDialogOpen}>
          <DialogContent className="!w-[min(88vw,1520px)] !max-w-none border border-[#D9E0EA] bg-white p-0 text-[#23282F] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <DialogHeader className="border-b border-[#EEF2F7] px-6 py-5 text-left">
              <DialogTitle className="text-[24px] font-semibold text-[#23282F]">
                Choose an Effect Style
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[82vh] overflow-y-auto px-7 py-7">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {items.map((item) => {
                  const isActive = item.slug === effect.slug;
                  const thumbUrl = getImageEffectStylePreviewImageUrl(item);
                  const thumbCardUrl =
                    withOssImageMaxSide(thumbUrl, 720) || thumbUrl;

                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        setHasManualEffectSelection(true);
                        setInternalEffectSlug(item.slug);
                        onEffectSlugChange?.(item.slug);
                        setIsEffectDialogOpen(false);
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
                        {thumbUrl ? (
                          <img
                            src={thumbCardUrl}
                            alt={item.title}
                            className="aspect-[1.28] w-full bg-[#F2F4F8] object-contain"
                          />
                        ) : (
                          <div className="aspect-[1.28] w-full" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-5 text-[#23282F]">
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(previewResultUrl)}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewResultUrl(null);
            }
          }}
        >
          <DialogContent className="!w-auto !max-w-[98vw] border-white/20 bg-black/90 p-0">
            {previewResultUrl ? (
              <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4">
                <img
                  src={previewResultUrl}
                  alt={`${studioPreviewTitle} preview`}
                  className="block h-auto max-h-[88vh] w-auto max-w-full object-contain"
                />
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <section
          data-resource-library-panel
          className={cn(
            STUDIO_PREVIEW_PANEL_HEIGHT_CLASS,
            "overflow-hidden rounded-[22px] border border-[#D9E0EA] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.7),transparent_24%),linear-gradient(180deg,#CFEAFF_0%,#D7EEFF_100%)] p-3.5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]",
          )}
        >
          {showStudioResultPanel ? (
            <div className="h-full overflow-hidden rounded-[16px] bg-[linear-gradient(180deg,#FDFEFF_0%,#F3F8FF_100%)]">
              {studioPendingItemCount > 0 &&
              studioGeneratedItems.length === 0 ? (
                <div className="relative h-full overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.82),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.55),transparent_22%),linear-gradient(180deg,#D9EEFF_0%,#CFE7FB_100%)]">
                  <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(255,255,255,0.52)_1px,transparent_1px)] [background-size:44px_44px]" />
                  <div className="pending-generation-shimmer absolute inset-y-0 -left-[30%] w-[35%] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.52)_52%,transparent_100%)]" />
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                    <div className="max-w-[420px] text-center">
                      <p className="text-[30px] font-semibold tracking-[-0.02em] text-[#1F2A37]">
                        Generating Your Effect
                      </p>
                      <p className="mt-3 text-[14px] leading-6 text-[#6E7A8A]">
                        Please don't leave this page during generation.
                      </p>
                      <div className="mx-auto mt-6 w-full max-w-[320px]">
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/55 shadow-[inset_0_1px_2px_rgba(106,149,196,0.12)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] transition-[width] duration-700 ease-out"
                            style={{ width: `${studioFakeProgress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[13px] font-medium text-[#4E5B6B]">
                          {studioFakeProgress}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : studioGeneratedItems.length === 1 ? (
                <div className="relative h-full overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.76),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.48),transparent_22%),linear-gradient(180deg,#D9EEFF_0%,#CFE7FB_100%)]">
                  <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.48)_1px,transparent_1px)] [background-size:44px_44px]" />
                  <div className="absolute inset-5 overflow-hidden rounded-[20px] border border-white/65 bg-white/45 shadow-[0_18px_40px_rgba(106,149,196,0.16)] backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() =>
                        studioGeneratedItems[0]?.url
                          ? setPreviewResultUrl(studioGeneratedItems[0].url)
                          : null
                      }
                      className="group block h-full w-full cursor-pointer"
                    >
                      <img
                        src={studioGeneratedItems[0]?.url}
                        alt={`${studioPreviewTitle} result`}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </button>
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          const resultUrl = studioGeneratedItems[0]?.url;
                          if (!resultUrl) return;
                          await downloadFileFromUrl(resultUrl, "png");
                        }}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.9rem] border border-[#D5E1EE] bg-white/92 text-[#42556F] shadow-[0_8px_20px_rgba(130,162,198,0.18)] backdrop-blur-md transition hover:bg-white"
                        aria-label="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const resultUrl = studioGeneratedItems[0]?.url;
                          if (!resultUrl) return;
                          setPreviewResultUrl(resultUrl);
                        }}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.9rem] border border-[#D5E1EE] bg-white/92 text-[#42556F] shadow-[0_8px_20px_rgba(130,162,198,0.18)] backdrop-blur-md transition hover:bg-white"
                        aria-label="Preview image"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex justify-center">
                    <span className="inline-flex rounded-full border border-white/70 bg-white/72 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A5464] shadow-[0_10px_24px_rgba(106,149,196,0.12)] backdrop-blur-md">
                      Generated Result
                    </span>
                  </div>
                </div>
              ) : (
                <GeneratedMediaPanel
                  items={studioGeneratedItems}
                  pendingItemCount={studioPendingItemCount}
                  mediaType="image"
                  embedded
                  embeddedTone="light"
                  hideHeader
                  emptyText={tCopy("emptyState")}
                  className="h-full min-h-0"
                />
              )}
            </div>
          ) : (
            <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[16px] bg-[#CDE7FF]">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:44px_44px] opacity-70" />

              {studioPreviewInputUrls[0] ? (
                <div className="relative z-20 flex h-full w-full items-center justify-center px-8 py-5">
                  <div className="relative flex h-full w-[min(64%,620px)] min-w-[470px] flex-col rounded-[26px] border-[7px] border-white bg-white p-4 shadow-[0_30px_78px_rgba(61,98,139,0.25)]">
                    <div className="absolute -left-16 top-10 z-20 w-[128px] rotate-[-6deg] overflow-hidden rounded-[14px] border-[5px] border-white bg-white shadow-[0_18px_44px_rgba(61,98,139,0.22)]">
                      {studioPreviewInputUrls.slice(0, 2).map((url, index) => (
                        <img
                          key={`${url}-${index}`}
                          src={url}
                          alt={`${studioPreviewTitle} source ${index + 1}`}
                          className={cn(
                            "w-full bg-[#F2F4F8] object-contain",
                            studioPreviewInputUrls.length > 1
                              ? "aspect-[1.08]"
                              : "aspect-[0.76]",
                            index > 0 ? "border-t border-[#E5E7EB]" : "",
                          )}
                        />
                      ))}
                      <div className="bg-white px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#56708C]">
                        Ref
                      </div>
                    </div>

                    <div className="absolute left-[64px] top-[44%] z-30 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#0E7BFF] text-white shadow-[0_14px_28px_rgba(14,123,255,0.24)]">
                      <ArrowRight className="h-4.5 w-4.5" />
                    </div>

                    <p className="text-center text-[1.2rem] font-semibold leading-tight tracking-[-0.03em] text-black">
                      {studioPreviewTitle}
                    </p>
                    <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-[22px]">
                      {studioPreviewOutputUrl ? (
                        <img
                          src={studioPreviewOutputUrl}
                          alt={`${studioPreviewTitle} output`}
                          className="h-full w-full bg-[#F2F4F8] object-contain"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#EEF4FB]" />
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-3 md:py-3 lg:overflow-hidden lg:px-0 lg:py-1">
        <div className="rounded-[1.55rem] border border-[#E5E7EB] bg-[linear-gradient(180deg,#fffef8_0%,#fff8de_100%)] p-3.5 shadow-[0_18px_50px_rgba(35,40,47,0.1)] md:p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:p-3">
          <div className="mb-3.5 flex items-end justify-between gap-3 lg:mb-2.5">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7a5600]">
                {tCopy("workspaceLabel")}
              </p>
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[#23282F] md:text-[1.6rem] lg:text-[1.35rem]">
                {tCopy("pageTitle")}
              </h1>
            </div>
            <div className="hidden rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] text-[#666666] md:block">
              {tCopy("inputBadge")}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.15rem] border border-[#E5E7EB] bg-white">
            <div className="relative h-[180px] overflow-hidden md:h-[196px] lg:h-[150px] xl:h-[164px]">
              {previewOutputUrl ? (
                <img
                  src={previewOutputUrl}
                  alt={effect.title}
                  className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
                />
              ) : (
                <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.1)_100%)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,222,0.08)_0%,rgba(35,40,47,0.08)_46%,rgba(35,40,47,0.24)_100%)]" />

              <div
                className={cn(
                  "absolute inset-y-0 left-1/2 w-[38%] min-w-[180px] max-w-[240px] -translate-x-1/2 overflow-hidden rounded-[1rem] border border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.28)]",
                  hasDistinctPreviewImages ? "grid grid-cols-2" : "block",
                )}
              >
                {hasDistinctPreviewImages ? (
                  <>
                    {previewInputUrls.length > 0 ? (
                      <div
                        className={cn(
                          "h-full w-full overflow-hidden",
                          previewInputUrls.length > 1
                            ? "grid grid-cols-2 gap-px"
                            : "",
                        )}
                      >
                        {previewInputUrls.map((url, index) => (
                          <img
                            key={`${effect.slug}-preview-input-${index}`}
                            src={url}
                            alt={`${effect.title} input ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <Skeleton className="h-full w-full rounded-none" />
                    )}
                    {previewOutputUrl ? (
                      <img
                        src={previewOutputUrl}
                        alt={`${effect.title} output`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Skeleton className="h-full w-full rounded-none" />
                    )}
                  </>
                ) : previewOutputUrl ? (
                  <img
                    src={previewOutputUrl}
                    alt={effect.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Skeleton className="h-full w-full rounded-none" />
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12 text-center">
                <p className="text-[1.1rem] font-semibold leading-none tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] md:text-[1.24rem]">
                  {effect.title}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center px-4">
                <div className="rounded-full border border-white/45 bg-white/80 px-3 py-1.5 text-center text-[11px] font-medium text-[#23282F] backdrop-blur-md">
                  {tCreator("actions.switchInLibrary")}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="mb-2.5 flex items-center justify-between gap-2 lg:mb-2">
              <h2 className="text-[1.05rem] font-semibold text-[#23282F]">
                {tCopy("imageTitle")}
              </h2>
              <p className="text-[11px] text-[#666666]">{tCopy("imageHint")}</p>
            </div>
            <div className="mb-3 flex flex-wrap gap-2 lg:mb-2">
              {Array.from({ length: requiredInputCount }).map((_, index) => {
                const isFilled = index < uploadedImageUrls.length;
                return (
                  <div
                    key={`${effect.slug}-input-slot-${index}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] transition",
                      isFilled
                        ? "border-[#23282F]/18 bg-[#fff4c6] text-[#23282F]"
                        : "border-[#E5E7EB] bg-white text-[#666666]",
                    )}
                  >
                    <span className="font-medium tabular-nums">
                      0{index + 1}
                    </span>
                    <span>{tCopy("inputLabel")}</span>
                  </div>
                );
              })}
            </div>
            <div className="rounded-[1rem] border border-[#E5E7EB] bg-[#F5F7F9] p-3 lg:flex-1 lg:min-h-0 lg:p-2.5">
              <ImageUploader
                allowMultiple={requiredInputCount > 1}
                maxImages={requiredInputCount}
                maxSizeMB={15}
                accept="image/*"
                previewType="image"
                emptyHint={undefined}
                emptyStateTitle={undefined}
                emptyStateSubtitle={undefined}
                uploadButtonLabel={undefined}
                defaultPreviews={selectedExampleUrls || undefined}
                onChange={handleUploadedItemsChange}
                uploadMetadata={{
                  sceneId: `image-effect-${effect.slug}`,
                  sceneLabel: effect.title,
                  modelUrl: pathname,
                  modelLabel: effect.title,
                }}
                resourceLibraryPlacement="studio-panel"
                className={undefined}
              />
            </div>

            {exampleOptions.length > 0 ? (
              <div className="mt-3.5 flex items-center gap-3 overflow-hidden lg:mt-2.5">
                <p className="shrink-0 text-[13px] font-medium text-[#666666]">
                  {tCopy("tryExamples")}
                </p>
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {exampleOptions.map((example, index) => {
                    const isActive =
                      selectedExample?.outputImageUrl ===
                        example.outputImageUrl &&
                      selectedExample?.inputImageUrls.join("|") ===
                        example.inputImageUrls.join("|");

                    return (
                      <button
                        key={`${example.inputImageUrls.join("|")}-${example.outputImageUrl}-${index}`}
                        type="button"
                        onClick={() => handleExampleSelect(example)}
                        className={cn(
                          "relative h-10 shrink-0 cursor-pointer overflow-hidden border transition-all duration-200",
                          example.inputImageUrls.length > 1
                            ? "w-[3.4rem] rounded-[14px]"
                            : "w-10 rounded-full",
                          isActive
                            ? "border-[#ff4b8b] ring-2 ring-[#ff4b8b]/30"
                            : "border-[#E5E7EB] hover:border-[#23282F]/24",
                        )}
                        aria-label={tCopy("exampleAria", { index: index + 1 })}
                      >
                        <div
                          className={cn(
                            "h-full w-full overflow-hidden",
                            example.inputImageUrls.length > 1
                              ? "grid grid-cols-2 gap-px"
                              : "",
                          )}
                        >
                          {example.inputImageUrls.map((url, inputIndex) => (
                            <img
                              key={`${url}-${inputIndex}`}
                              src={url}
                              alt={`${effect.title} example ${index + 1} input ${inputIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <Button
            disabled={
              !uploadedReady || isUploading || isEstimating || isGenerating
            }
            onClick={handleGenerate}
            className={cn(
              "mt-4 h-[62px] w-full rounded-full text-[15px] font-semibold shadow-none lg:mt-3 lg:h-12",
              "bg-[#23282F] text-white hover:bg-[#333333] disabled:bg-[#EFE7C8] disabled:text-[#9A8F66]",
            )}
          >
            {isEstimating || isGenerating ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>{tCopy("estimating")}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                <span>
                  {tCopy("create")}
                  {requiredCredits !== null && requiredCredits !== undefined ? (
                    <span className="ml-1.5 opacity-90">
                      ({requiredCredits} {tCopy("creditsUnit")})
                    </span>
                  ) : null}
                </span>
              </>
            )}
          </Button>

          {estimateError || generationError ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                {estimateError
                  ? renderErrorMessage(
                      `${tCopy("estimateError")} ${estimateError}`,
                    )
                  : renderErrorMessage(generationError)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
