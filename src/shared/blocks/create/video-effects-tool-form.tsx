"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
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
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAppContext } from "@/shared/contexts/app";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import { withOssImageMaxSide, withOssImageResize } from "@/shared/lib/cdn";
import { downloadFileFromUrl } from "@/shared/lib/image-preview";
import {
  AI_BIKINI_SLUG,
  AI_KISSING_HUB_SLUG,
  AI_TWERK_SLUG,
  getVideoEffectItemsSync,
  type VideoEffectItem,
  VIDEO_KISS_STYLE_SLUGS,
} from "@/shared/lib/video-effect-data";
import { cn } from "@/shared/lib/utils";

type VideoEffectsToolFormProps = {
  selectedEffectSlug?: string | null;
  onEffectSlugChange?: (slug: string) => void;
  sampleEffectSlug?: string | null;
  previewEffectSlug?: string | null;
  prefillReferenceImages?: ImageUploaderValue[];
  prefillNonce?: number;
  onGenerateSuccess?: () => void;
  layout?: "panel" | "studio";
};

type ExampleOption = {
  inputImageUrls: string[];
  outputVideoUrl: string;
  outputPreviewClipUrl?: string;
};

const STUDIO_FORM_PANEL_HEIGHT_CLASS = "h-[640px]";
const STUDIO_PREVIEW_PANEL_HEIGHT_CLASS = "h-[620px]";
const MULTI_REFERENCE_EFFECT_SLUGS = new Set([
  "ai-kissing",
  "kissing-pro",
  "couple-hugging",
  "romantic-lift",
  "french-kiss",
  "rain-kiss",
  "love-story",
  "hugging",
]);

function getVideoEffectRequiredInputCount(slug?: string | null) {
  return slug && MULTI_REFERENCE_EFFECT_SLUGS.has(slug) ? 2 : 1;
}

function getEffectPreviewMedia(effect?: VideoEffectItem | null) {
  if (!effect) {
    return {
      previewVideoUrl: "",
      previewPosterUrl: "",
      previewImageUrl: "",
    };
  }

  return {
    previewVideoUrl: effect.samplePreviewClipUrl || effect.sampleVideoUrl || "",
    previewPosterUrl: effect.coverUrl || effect.sourceImageUrl || "",
    previewImageUrl:
      effect.coverUrl ||
      effect.sourceImageUrl ||
      effect.examples?.[0]?.inputImageUrl ||
      "",
  };
}

function getEffectStylePreviewImageUrl(effect?: VideoEffectItem | null) {
  if (!effect) {
    return "";
  }

  return (
    effect.sourceImageUrl ||
    effect.examples?.find((example) => example.inputImageUrl)?.inputImageUrl ||
    effect.coverUrl ||
    ""
  );
}

function getExampleOptions(effect: VideoEffectItem) {
  const examples = new Map<string, ExampleOption>();
  const requiredInputCount = getVideoEffectRequiredInputCount(effect.slug);

  const addExample = (
    inputImageUrls: string[],
    outputVideoUrl?: string,
    outputPreviewClipUrl?: string,
  ) => {
    const cleanedInputs = inputImageUrls.filter(Boolean);
    if (cleanedInputs.length < requiredInputCount || !outputVideoUrl) {
      return;
    }

    const key = `${cleanedInputs.join("|")}::${outputVideoUrl}`;
    if (!examples.has(key)) {
      examples.set(key, {
        inputImageUrls: cleanedInputs.slice(0, requiredInputCount),
        outputVideoUrl,
        outputPreviewClipUrl,
      });
    }
  };

  const rawExamples =
    effect.examples?.map((example) => ({
      inputImageUrl: example.inputImageUrl,
      outputVideoUrl: example.outputVideoUrl || effect.sampleVideoUrl,
      outputPreviewClipUrl:
        example.outputPreviewClipUrl || effect.samplePreviewClipUrl,
    })) || [];

  if (requiredInputCount > 1) {
    const groupedByOutput = new Map<
      string,
      Array<{
        inputImageUrl?: string;
        outputVideoUrl?: string;
        outputPreviewClipUrl?: string;
      }>
    >();

    rawExamples.forEach((example) => {
      const key = example.outputVideoUrl || "";
      if (!key) return;
      const current = groupedByOutput.get(key) || [];
      current.push(example);
      groupedByOutput.set(key, current);
    });

    groupedByOutput.forEach((group, outputVideoUrl) => {
      addExample(
        group
          .map((item) => item.inputImageUrl || "")
          .filter(Boolean)
          .slice(0, requiredInputCount),
        outputVideoUrl,
        group[0]?.outputPreviewClipUrl,
      );
    });
  } else {
    rawExamples.forEach((example) => {
      addExample(
        [example.inputImageUrl || ""],
        example.outputVideoUrl,
        example.outputPreviewClipUrl,
      );
    });

    addExample(
      [effect.sourceImageUrl || ""],
      effect.sampleVideoUrl,
      effect.samplePreviewClipUrl,
    );
  }

  return Array.from(examples.values()).slice(0, 8);
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

export function VideoEffectsToolForm({
  selectedEffectSlug,
  onEffectSlugChange,
  sampleEffectSlug,
  previewEffectSlug,
  prefillReferenceImages,
  prefillNonce = 0,
  onGenerateSuccess,
  layout = "panel",
}: VideoEffectsToolFormProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("landing.video-effects.workspace");
  const tGeneration = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const tCreator = useTranslations("creator.toolsDetailPage");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const items = useMemo(() => getVideoEffectItemsSync(), []);
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
  const [hasManualEffectSelection, setHasManualEffectSelection] =
    useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isEffectDialogOpen, setIsEffectDialogOpen] = useState(false);
  const [studioFakeProgress, setStudioFakeProgress] = useState(0);
  const [studioGeneratedVideoUrl, setStudioGeneratedVideoUrl] = useState<
    string | null
  >(null);
  const [previewResultUrl, setPreviewResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEffectSlug) {
      setInternalEffectSlug(selectedEffectSlug);
    }
  }, [selectedEffectSlug]);

  const allEffectItems = useMemo(
    () =>
      items.flatMap((item) =>
        item.styleItems?.length ? [item, ...item.styleItems] : [item],
      ),
    [items],
  );
  const effect =
    allEffectItems.find((item) => item.slug === internalEffectSlug) ??
    items[0] ??
    null;
  const sampleEffect =
    (sampleEffectSlug
      ? allEffectItems.find((item) => item.slug === sampleEffectSlug)
      : null) || effect;
  const displayEffect = useMemo(() => {
    if (!effect) {
      return null;
    }

    if (
      VIDEO_KISS_STYLE_SLUGS.includes(
        effect.slug as (typeof VIDEO_KISS_STYLE_SLUGS)[number],
      )
    ) {
      return items.find((item) => item.slug === AI_KISSING_HUB_SLUG) ?? effect;
    }

    return effect;
  }, [effect, items]);
  const kissStyleItems =
    displayEffect?.slug === AI_KISSING_HUB_SLUG
      ? displayEffect.styleItems || []
      : [];
  const requiredInputCount = getVideoEffectRequiredInputCount(effect?.slug);
  const isChineseLocale = locale.toLowerCase().startsWith("zh");
  const hasKissStyleSelector = kissStyleItems.length > 1;
  const isAiBikini = displayEffect?.slug === AI_BIKINI_SLUG;
  const isAiKissingHub = displayEffect?.slug === AI_KISSING_HUB_SLUG;
  const isAiTwerk = displayEffect?.slug === AI_TWERK_SLUG;
  const aiTwerkUploadSectionTitle = isChineseLocale
    ? "上传一张单人全身照"
    : "Upload a full-body photo of one person";
  const aiTwerkPhotoRequirementsTitle = isChineseLocale
    ? "图片要求"
    : "Photo requirements";
  const aiTwerkRequirementGood = isChineseLocale
    ? "一张清晰的单人全身照"
    : "A clear full-body photo of one person";
  const aiTwerkRequirementBad = isChineseLocale
    ? "不要上传儿童照片"
    : "Don't upload a child photo";
  const inputBadgeText = isChineseLocale
    ? isAiTwerk
      ? "1 张图片输入"
      : `${requiredInputCount} 张图片输入`
    : isAiTwerk
      ? "1 image input"
      : `${requiredInputCount} image${requiredInputCount > 1 ? "s" : ""} input`;
  const imageHintText = isAiTwerk
    ? isChineseLocale
      ? "支持格式：jpg、jpeg、png、webp"
      : "Support Format: jpg, jpeg, png, webp"
    : isChineseLocale
      ? `支持 PNG、JPG、WEBP，最多 ${requiredInputCount} 张，每张最大 15MB`
      : `PNG, JPG, WEBP, up to ${requiredInputCount} image${requiredInputCount > 1 ? "s" : ""}, 15MB each`;
  const uploadHintText = isAiTwerk
    ? isChineseLocale
      ? "请上传一张清晰的单人全身照"
      : "Please upload one clear full-body photo of one person"
    : isChineseLocale
      ? requiredInputCount > 1
        ? `请上传 ${requiredInputCount} 张图片`
        : "请上传 1 张图片"
      : requiredInputCount > 1
        ? `Please upload ${requiredInputCount} images`
        : "Please upload 1 image";
  const uploadAreaTitle = (remainingCount: number, maxCount: number) =>
    isAiTwerk
      ? isChineseLocale
        ? "上传照片或拖放到这里"
        : "Upload a photo or drop it here"
      : isChineseLocale
        ? remainingCount >= maxCount
          ? `上传 ${maxCount} 张图片`
          : `还需上传 ${remainingCount} 张图片`
        : remainingCount >= maxCount
          ? `Upload ${maxCount} images`
          : `${remainingCount} more image${remainingCount > 1 ? "s" : ""} needed`;
  const uploadAreaSubtitle = (remainingCount: number, maxCount: number) =>
    isAiTwerk
      ? imageHintText
      : isChineseLocale
        ? `支持 PNG、JPG、WEBP，最多 ${maxCount} 张，每张最大 15MB`
        : `PNG, JPG, WEBP, up to ${maxCount} image${maxCount > 1 ? "s" : ""}, 15MB each`;
  const uploadButtonText = (remainingCount: number, maxCount: number) =>
    isAiTwerk
      ? isChineseLocale
        ? "上传文件"
        : "Upload file"
      : isChineseLocale
        ? remainingCount >= maxCount
          ? `选择 ${maxCount} 张图片`
          : `继续上传（还差 ${remainingCount} 张）`
        : remainingCount >= maxCount
          ? `Choose ${maxCount} image${maxCount > 1 ? "s" : ""}`
          : `Upload ${remainingCount} more`;
  const uploadSectionTitle = isAiTwerk
    ? isChineseLocale
      ? "上传你的照片"
      : "Upload Your Photo"
    : isChineseLocale
      ? requiredInputCount > 1
        ? "上传你的图片"
        : "上传你的图片"
      : requiredInputCount > 1
        ? "Upload Your Photos"
        : "Upload Your Photo";
  const imageSectionTitle = isAiTwerk
    ? aiTwerkUploadSectionTitle
    : isChineseLocale
      ? requiredInputCount > 1
        ? "图片"
        : "图片"
      : requiredInputCount > 1
        ? "Images"
        : "Image";
  const kissTypeSectionTitle = isChineseLocale
    ? "选择亲吻风格"
    : "Choose a kiss type";
  const kissUploadSectionTitle = isChineseLocale
    ? requiredInputCount > 1
      ? `上传 ${requiredInputCount} 张照片`
      : "上传一张包含两个人的照片"
    : requiredInputCount > 1
      ? `Upload ${requiredInputCount} photos`
      : "Upload one photo containing two persons";
  const panelPageTitle = isAiKissingHub
    ? "AI Kissing"
    : isAiBikini
      ? "AI Bikini"
      : isAiTwerk
        ? "AI Twerk"
        : t("pageTitle");
  const primaryGenerateLabel = isAiKissingHub
    ? isChineseLocale
      ? "生成接吻视频"
      : "Generate Kissing Video"
    : isAiBikini
      ? isChineseLocale
        ? "生成 AI Bikini 视频"
        : "Generate AI Bikini Video"
      : isAiTwerk
        ? isChineseLocale
          ? "生成 Twerk 视频"
          : "Generate Twerk Video"
        : "Apply Video Effects";
  const panelGenerateLabel = isAiKissingHub
    ? isChineseLocale
      ? "生成接吻视频"
      : "Generate Kissing Video"
    : isAiBikini
      ? isChineseLocale
        ? "生成 AI Bikini 视频"
        : "Generate AI Bikini Video"
      : isAiTwerk
        ? isChineseLocale
          ? "生成 Twerk 视频"
          : "Generate Twerk Video"
        : t("create");
  const studioUploadStepNumber = hasKissStyleSelector
    ? "2."
    : isAiTwerk
      ? "1."
      : "2.";
  const studioGeneratingTitle = isAiTwerk
    ? isChineseLocale
      ? "正在生成你的 Twerk 视频"
      : "Generating Your Twerk Video"
    : isAiBikini
      ? isChineseLocale
        ? "正在生成你的 AI Bikini 视频"
        : "Generating Your AI Bikini Video"
      : "Generating Your Effect";

  const handleKissStyleSelect = (styleSlug: string) => {
    setHasManualEffectSelection(true);
    setInternalEffectSlug(styleSlug);
    setSelectedExample(null);
    setSelectedExampleUrls(null);
    setGenerationError("");
    setStudioGeneratedVideoUrl(null);
    setPreviewResultUrl(null);
  };

  useEffect(() => {
    if (!displayEffect) return;
    onEffectSlugChange?.(displayEffect.slug);
  }, [displayEffect, onEffectSlugChange]);

  const exampleOptions = useMemo(
    () => (sampleEffect ? getExampleOptions(sampleEffect) : []),
    [sampleEffect],
  );
  const isUploading = useMemo(
    () => uploadedItems.some((item) => item.status === "uploading"),
    [uploadedItems],
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
  const uploadedImageUrl = uploadedImageUrls[0] || "";
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    effect
      ? effect.slug === AI_BIKINI_SLUG
        ? "image-to-video-wan-2-7"
        : `video-effect-${effect.slug}`
      : "",
    effect?.slug === AI_BIKINI_SLUG
      ? {
          resolution: "720p",
          duration: 5,
        }
      : {},
    {
      enabled: Boolean(effect),
      debounceMs: 200,
    },
  );

  useEffect(() => {
    setGenerationError("");
    setStudioGeneratedVideoUrl(null);
    setPreviewResultUrl(null);
  }, [effect?.slug]);

  useEffect(() => {
    if (hasManualEffectSelection || items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % items.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, [hasManualEffectSelection, items.length]);

  useEffect(() => {
    if (!prefillReferenceImages?.length) return;

    setSelectedExample(null);
    setSelectedExampleUrls(
      prefillReferenceImages
        .map((item) => item.url || item.preview)
        .filter((value): value is string => Boolean(value)),
    );
    setUploadedItems(prefillReferenceImages);
    setGenerationError("");
    setStudioGeneratedVideoUrl(null);
    setPreviewResultUrl(null);
  }, [prefillNonce, prefillReferenceImages]);

  const handleExampleSelect = (example: ExampleOption) => {
    if (!effect) return;

    setSelectedExample(example);
    setSelectedExampleUrls(example.inputImageUrls);
    setGenerationError("");
    setUploadedItems(
      example.inputImageUrls.map((url, index) => ({
        id: `example-${sampleEffect?.slug || effect.slug}-${index}-${url}`,
        preview: url,
        url,
        status: "uploaded" as const,
      })),
    );
  };

  const handleUploadedItemsChange = (nextItems: ImageUploaderValue[]) => {
    setUploadedItems(nextItems);
    setStudioGeneratedVideoUrl(null);
    setPreviewResultUrl(null);

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

  const handleGenerate = async () => {
    if (!effect) return;

    if (uploadedImageUrls.length < requiredInputCount) {
      setGenerationError(uploadHintText);
      return;
    }

    setGenerationError("");
    setStudioGeneratedVideoUrl(null);
    setPreviewResultUrl(null);
    setIsGenerating(true);

    const scene = `video-effect-${effect.slug}`;
    const result = await executeGeneration(
      {
        apiEndpoint:
          effect.slug === AI_BIKINI_SLUG
            ? "/api/ai/video-effect-ai-bikini/generate"
            : `/api/ai/${scene}/generate`,
        scenario:
          effect.slug === AI_BIKINI_SLUG ? "video-effect-ai-bikini" : scene,
        requestBody:
          effect.slug === AI_BIKINI_SLUG
            ? {
                image_urls: uploadedImageUrls,
              }
            : {
                image: uploadedImageUrls[0],
                image_urls: uploadedImageUrls,
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

    if (result.success) {
      if (layout === "studio" && result.url) {
        setStudioGeneratedVideoUrl(result.url);
      }
      onGenerateSuccess?.();
    }

    setIsGenerating(false);
  };

  if (!effect) {
    return null;
  }

  const workspacePreviewInputUrls = selectedExample?.inputImageUrls?.length
    ? selectedExample.inputImageUrls
    : selectedExampleUrls?.length
      ? selectedExampleUrls
      : uploadedImageUrls.length
        ? uploadedImageUrls
        : [];
  const primaryPreviewInputUrl = workspacePreviewInputUrls[0] || null;
  const uploaderDefaultPreviews = selectedExampleUrls || undefined;
  const fixedPreviewEffect =
    previewEffectSlug && allEffectItems.length > 0
      ? allEffectItems.find((item) => item.slug === previewEffectSlug) || null
      : null;
  const rotatingPreviewEffect =
    fixedPreviewEffect ||
    (!hasManualEffectSelection && items.length > 0
      ? items[carouselIndex % items.length] || effect
      : effect);
  const rotatingPreviewInputUrls = useMemo(() => {
    if (!rotatingPreviewEffect) {
      return [];
    }

    const rotatingExamples = getExampleOptions(rotatingPreviewEffect);
    if (rotatingExamples[0]?.inputImageUrls?.length) {
      return rotatingExamples[0].inputImageUrls.slice(
        0,
        getVideoEffectRequiredInputCount(rotatingPreviewEffect.slug),
      );
    }

    return [
      rotatingPreviewEffect.sourceImageUrl || effect.sourceImageUrl,
    ].filter(Boolean) as string[];
  }, [effect.sourceImageUrl, rotatingPreviewEffect]);
  const rotatingPreviewInputUrl = rotatingPreviewInputUrls[0] || "";
  const rotatingPreviewVideoUrl =
    rotatingPreviewEffect?.samplePreviewClipUrl ||
    rotatingPreviewEffect?.sampleVideoUrl ||
    "";
  const rotatingPreviewPosterUrl =
    rotatingPreviewEffect?.coverUrl ||
    rotatingPreviewEffect?.sourceImageUrl ||
    "";
  const displayEffectPreview = getEffectPreviewMedia(displayEffect);
  const displayEffectStylePreviewImageUrl =
    getEffectStylePreviewImageUrl(displayEffect);

  useEffect(() => {
    if (!isGenerating || layout !== "studio") {
      setStudioFakeProgress(0);
      return;
    }

    setStudioFakeProgress((current) => (current > 0 ? current : 2));

    const timer = window.setInterval(() => {
      setStudioFakeProgress((current) => {
        if (current < 12) return current + 2;
        if (current < 28) return current + 3;
        if (current < 46) return current + 2;
        if (current < 64) return current + 3;
        if (current < 80) return current + 2;
        if (current < 88) return current + 2;
        if (current < 95) return current + 1;
        return current;
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, [isGenerating, layout]);

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
          <div className="flex-1 min-h-0 overflow-y-auto">
            {!hasKissStyleSelector && !isAiTwerk ? (
              <div className="flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
                <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                  1.
                </span>
                <span>Choose an Effect Style</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsEffectDialogOpen(true)}
              className={cn(
                "cursor-pointer overflow-hidden rounded-[18px] bg-[#F7F8FB] text-left transition hover:bg-[#F3F6FB]",
                hasKissStyleSelector ? "" : "mt-2",
              )}
            >
              <div className="flex min-h-[92px] items-center gap-4 px-5 py-4">
                <div className="w-[124px] shrink-0 overflow-hidden rounded-[14px] bg-[#F2F4F8]">
                  {displayEffectStylePreviewImageUrl ? (
                    <img
                      src={
                        withOssImageMaxSide(
                          displayEffectStylePreviewImageUrl,
                          420,
                        ) || displayEffectStylePreviewImageUrl
                      }
                      alt={displayEffect?.title || effect.title}
                      className={cn(
                        "aspect-[1.2] w-full bg-[#F2F4F8] object-contain",
                      )}
                    />
                  ) : (
                    <div className="aspect-[1.2] w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[18px] font-normal text-[#3E434D]">
                    {displayEffect?.title || effect.title}
                  </p>
                </div>
                <div className="shrink-0 text-[#4B5563]">
                  <ChevronRight className="h-7 w-7 stroke-[1.75]" />
                </div>
              </div>
            </button>

            {hasKissStyleSelector ? (
              <>
                <div className="mt-3 flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
                  <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                    1.
                  </span>
                  <span>{kissTypeSectionTitle}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {kissStyleItems.map((styleItem) => {
                    const previewImageUrl =
                      getEffectStylePreviewImageUrl(styleItem);
                    const isActive = styleItem.slug === effect.slug;

                    return (
                      <button
                        key={styleItem.slug}
                        type="button"
                        onClick={() => handleKissStyleSelect(styleItem.slug)}
                        className={cn(
                          "overflow-hidden rounded-[16px] border text-left transition",
                          isActive
                            ? "border-[#2FB5FF] shadow-[0_0_0_2px_rgba(200,107,255,0.9)]"
                            : "border-[#D9E0EA] hover:border-[#3BA0FF]",
                        )}
                      >
                        <div className="relative">
                          {previewImageUrl ? (
                            <img
                              src={
                                withOssImageMaxSide(
                                  previewImageUrl,
                                  720,
                                ) || previewImageUrl
                              }
                              alt={styleItem.title}
	                              className="aspect-[1.45] w-full bg-[#F2F4F8] object-contain"
                            />
                          ) : (
                            <div className="aspect-[1.45] w-full bg-[#F2F4F8]" />
                          )}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.68)_100%)]" />
                          <p className="absolute inset-x-3 bottom-3 text-[14px] font-semibold text-white">
                            {styleItem.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            <div className="mt-3 flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
              <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                {studioUploadStepNumber}
              </span>
              <span>
                {isAiTwerk ? aiTwerkUploadSectionTitle : uploadSectionTitle}
              </span>
            </div>

            <div className="mt-2 overflow-hidden rounded-[12px]">
              {primaryPreviewInputUrl && !isAiBikini ? (
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
                  {workspacePreviewInputUrls.length > 1 ? (
                    <div className="grid h-full w-full grid-cols-2 gap-px bg-[#D9E0EA]">
                      {workspacePreviewInputUrls
                        .slice(0, requiredInputCount)
                        .map((inputUrl, inputIndex) => (
                          <img
                            key={`${inputUrl}-${inputIndex}`}
                            src={inputUrl}
                            alt={`${effect.title} input preview ${inputIndex + 1}`}
                            className="h-full w-full bg-[#F2F4F8] object-contain"
                          />
                        ))}
                    </div>
                  ) : (
                    <img
                      src={primaryPreviewInputUrl || undefined}
                      alt={`${effect.title} input preview`}
                      className="h-full w-full bg-[#F2F4F8] object-contain"
                    />
                  )}
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
                    defaultPreviews={uploaderDefaultPreviews}
                    onChange={handleUploadedItemsChange}
                    uploadMetadata={{
                      sceneId: `video-effect-${effect.slug}`,
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
                      selectedExample?.outputVideoUrl ===
                        example.outputVideoUrl &&
                      selectedExample?.inputImageUrls.join("|") ===
                        example.inputImageUrls.join("|");

                    return (
                      <button
                        key={`${example.inputImageUrls.join("|")}-${example.outputVideoUrl}-${index}`}
                        type="button"
                        onClick={() => handleExampleSelect(example)}
                        className={cn(
                          "relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border transition-all",
                          isActive
                            ? "border-[#2FB5FF] shadow-[0_0_0_2px_rgba(200,107,255,0.9)]"
                            : "border-[#D9E0EA] hover:border-[#3BA0FF]",
                        )}
                        aria-label={t("exampleAria", { index: index + 1 })}
                      >
                        {example.inputImageUrls.length > 1 ? (
                          <div className="grid h-full w-full grid-cols-2 gap-px bg-[#D9E0EA]">
                            {example.inputImageUrls
                              .slice(0, 2)
                              .map((inputUrl, inputIndex) => {
                                const thumbUrl =
                                  withOssImageMaxSide(inputUrl, 80) || inputUrl;

                                return (
                                  <img
                                    key={`${inputUrl}-${inputIndex}`}
                                    src={thumbUrl}
                                    alt={`${effect.title} example ${index + 1} input ${inputIndex + 1}`}
                                    className="h-full w-full bg-[#F2F4F8] object-contain"
                                  />
                                );
                              })}
                          </div>
                        ) : (
                          <img
                            src={
                              withOssImageMaxSide(
                                example.inputImageUrls[0],
                                80,
                              ) || example.inputImageUrls[0]
                            }
                            alt={`${effect.title} example ${index + 1}`}
                            className="h-full w-full bg-[#F2F4F8] object-contain"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isAiTwerk ? (
              <div className="mt-3 rounded-[14px] border border-[#E5E7EB] bg-[#FFFDF6] p-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7A5600]">
                  {aiTwerkPhotoRequirementsTitle}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-[12px] border border-[#D8E9D2] bg-[#F5FFF3] p-3 text-[13px] text-[#2F5130]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{aiTwerkRequirementGood}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-[12px] border border-[#F3D2D2] bg-[#FFF6F6] p-3 text-[13px] text-[#8E4141]">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{aiTwerkRequirementBad}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto shrink-0 pt-6">
            <Button
              disabled={
                !uploadedReady || isUploading || isEstimating || isGenerating
              }
              onClick={handleGenerate}
              className="h-[46px] w-full rounded-[12px] border-0 bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] text-[13px] font-semibold text-white shadow-none hover:opacity-95 disabled:bg-[#E6EAF2] disabled:text-[#9AA3AF]"
            >
              {isEstimating || isGenerating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>{t("estimating")}</span>
                </>
              ) : (
                <span>{primaryGenerateLabel}</span>
              )}
            </Button>

            <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-[#6B7280]">
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
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50 p-2.5 text-[12px] text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0">
                  {estimateError
                    ? renderErrorMessage(
                        `${t("estimateError")} ${estimateError}`,
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
                  const isActive =
                    item.slug === (displayEffect?.slug || effect.slug);
                  const thumbUrl = getEffectStylePreviewImageUrl(item);
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
                <video
                  src={previewResultUrl}
                  className="block h-auto max-h-[88vh] w-auto max-w-full object-contain"
                  controls
                  autoPlay
                  playsInline
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
          <div className="relative flex h-full min-h-[392px] items-center justify-center overflow-hidden rounded-[16px] bg-[#CDE7FF]">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:44px_44px] opacity-70" />

            {isGenerating ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                <div className="max-w-[420px] text-center">
                  <p className="text-[30px] font-semibold tracking-[-0.02em] text-[#1F2A37]">
                    {studioGeneratingTitle}
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
            ) : studioGeneratedVideoUrl ? (
              <div className="absolute inset-5 overflow-hidden rounded-[20px] border border-white/65 bg-white/45 shadow-[0_18px_40px_rgba(106,149,196,0.16)] backdrop-blur-[2px]">
                <video
                  src={studioGeneratedVideoUrl}
                  poster={effect.coverUrl || effect.sourceImageUrl}
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                />
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async (event) => {
                      event.stopPropagation();
                      await downloadFileFromUrl(studioGeneratedVideoUrl, "mp4");
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.9rem] border border-[#D5E1EE] bg-white/92 text-[#42556F] shadow-[0_8px_20px_rgba(130,162,198,0.18)] backdrop-blur-md transition hover:bg-white"
                    aria-label="Download video"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewResultUrl(studioGeneratedVideoUrl);
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.9rem] border border-[#D5E1EE] bg-white/92 text-[#42556F] shadow-[0_8px_20px_rgba(130,162,198,0.18)] backdrop-blur-md transition hover:bg-white"
                    aria-label="Preview video"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex justify-center">
                  <span className="inline-flex rounded-full border border-white/70 bg-white/72 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A5464] shadow-[0_10px_24px_rgba(106,149,196,0.12)] backdrop-blur-md">
                    Generated Result
                  </span>
                </div>
              </div>
            ) : (
              <>
                {rotatingPreviewInputUrl ? (
                  <div className="relative z-20 flex h-full w-full items-center justify-center px-8 py-5">
                    <div className="relative flex h-full w-[min(64%,620px)] min-w-[470px] flex-col rounded-[26px] border-[7px] border-white bg-white p-4 shadow-[0_30px_78px_rgba(61,98,139,0.25)]">
                      <div className="absolute -left-16 top-10 z-20 w-[128px] rotate-[-6deg] overflow-hidden rounded-[14px] border-[5px] border-white bg-white shadow-[0_18px_44px_rgba(61,98,139,0.22)]">
                        {rotatingPreviewInputUrls.slice(0, 2).map((url, index) => (
                          <img
                            key={`${url}-${index}`}
                            src={url}
                            alt={`${rotatingPreviewEffect?.title || effect.title} source ${index + 1}`}
                            className={cn(
                              "w-full bg-[#F2F4F8] object-contain",
                              rotatingPreviewInputUrls.length > 1
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
                        {rotatingPreviewEffect?.title || effect.title}
                      </p>
                      <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-[22px]">
                        {rotatingPreviewVideoUrl ? (
                          <video
                            src={rotatingPreviewVideoUrl}
                            poster={rotatingPreviewPosterUrl}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#EEF4FB]" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full min-h-0 overflow-y-auto px-2.5 py-2.5 md:px-3 md:py-3 lg:px-0 lg:py-2.5">
        <div className="rounded-[1.55rem] border border-[#E5E7EB] bg-[linear-gradient(180deg,#fffef8_0%,#fff8de_100%)] p-3.5 shadow-[0_18px_50px_rgba(35,40,47,0.1)] md:p-4">
          <div className="mb-3.5 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7a5600]">
                {t("workspaceLabel")}
              </p>
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[#23282F] md:text-[1.6rem]">
                {panelPageTitle}
              </h1>
            </div>
            <div className="hidden rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] text-[#666666] md:block">
              {inputBadgeText}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.15rem] border border-[#E5E7EB] bg-white">
            <div className="relative h-[180px] overflow-hidden md:h-[196px]">
              {displayEffectPreview.previewVideoUrl ? (
                <video
                  src={displayEffectPreview.previewVideoUrl}
                  poster={displayEffectPreview.previewPosterUrl}
                  className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={displayEffect?.title || effect.title}
                />
              ) : displayEffectPreview.previewImageUrl ? (
                <img
                  src={displayEffectPreview.previewImageUrl}
                  alt={displayEffect?.title || effect.title}
                  className="absolute inset-0 h-full w-full object-cover blur-[14px] brightness-[0.62] saturate-[0.9] scale-[1.12]"
                />
              ) : (
                <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.1)_100%)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,222,0.08)_0%,rgba(35,40,47,0.08)_46%,rgba(35,40,47,0.24)_100%)]" />

              {rotatingPreviewInputUrls.length > 1 ? (
                <>
                  <div className="absolute inset-y-0 left-[42%] z-10 w-[22%] min-w-[110px] max-w-[145px] -translate-x-1/2 rotate-[-8deg] overflow-hidden rounded-[1rem] border border-white/18 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
                    <img
                      src={rotatingPreviewInputUrls[0]}
                      alt={`${effect.title} input preview 1`}
                      className="h-full w-full bg-[#F2F4F8] object-contain"
                    />
                  </div>
                  <div className="absolute inset-y-0 left-[58%] z-20 w-[22%] min-w-[110px] max-w-[145px] -translate-x-1/2 rotate-[7deg] overflow-hidden rounded-[1rem] border border-white/18 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
                    <img
                      src={rotatingPreviewInputUrls[1]}
                      alt={`${effect.title} input preview 2`}
                      className="h-full w-full bg-[#F2F4F8] object-contain"
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-y-0 left-1/2 w-[30%] min-w-[128px] max-w-[170px] -translate-x-1/2 overflow-hidden rounded-[1rem] border border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
                  {displayEffectPreview.previewVideoUrl ? (
                    <video
                      src={displayEffectPreview.previewVideoUrl}
                      poster={displayEffectPreview.previewPosterUrl}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                    />
                  ) : displayEffectPreview.previewImageUrl ? (
                    <img
                      src={displayEffectPreview.previewImageUrl}
                      alt={displayEffect?.title || effect.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Skeleton className="h-full w-full rounded-none" />
                  )}
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12 text-center">
                <p className="text-[1.1rem] font-semibold leading-none tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)] md:text-[1.24rem]">
                  {displayEffect?.title || effect.title}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center px-4">
                <div className="rounded-full border border-white/45 bg-white/80 px-3 py-1.5 text-center text-[11px] font-medium text-[#23282F] backdrop-blur-md">
                  {tCreator("actions.switchInLibrary")}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {hasKissStyleSelector ? (
              <>
                <div className="mb-2.5 flex items-center gap-2 text-[0.9rem] font-medium text-[#23282F]">
                  <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                    1.
                  </span>
                  <span>{kissTypeSectionTitle}</span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  {kissStyleItems.map((styleItem) => {
                    const previewImageUrl =
                      getEffectStylePreviewImageUrl(styleItem);
                    const isActive = styleItem.slug === effect.slug;

                    return (
                      <button
                        key={styleItem.slug}
                        type="button"
                        onClick={() => handleKissStyleSelect(styleItem.slug)}
                        className={cn(
                          "overflow-hidden rounded-[16px] border text-left transition",
                          isActive
                            ? "border-[#2FB5FF] shadow-[0_0_0_2px_rgba(200,107,255,0.9)]"
                            : "border-[#D9E0EA] hover:border-[#3BA0FF]",
                        )}
                      >
                        <div className="relative">
                          {previewImageUrl ? (
                            <img
                              src={
                                withOssImageMaxSide(
                                  previewImageUrl,
                                  720,
                                ) || previewImageUrl
                              }
                              alt={styleItem.title}
	                              className="aspect-[1.45] w-full bg-[#F2F4F8] object-contain"
                            />
                          ) : (
                            <div className="aspect-[1.45] w-full bg-[#F2F4F8]" />
                          )}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.68)_100%)]" />
                          <p className="absolute inset-x-3 bottom-3 text-[15px] font-semibold text-white">
                            {styleItem.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="text-[1.05rem] font-semibold text-[#23282F]">
                {hasKissStyleSelector ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[1.22rem] font-semibold text-[#4C7DFF]">
                      2.
                    </span>
                    <span>{kissUploadSectionTitle}</span>
                  </span>
                ) : (
                  imageSectionTitle
                )}
              </h2>
              <p className="text-[11px] text-[#666666]">{imageHintText}</p>
            </div>
            <div className="rounded-[1rem] border border-[#E5E7EB] bg-[#F5F7F9] p-3">
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
                defaultPreviews={uploaderDefaultPreviews}
                onChange={handleUploadedItemsChange}
                uploadMetadata={{
                  sceneId: `video-effect-${effect.slug}`,
                  sceneLabel: effect.title,
                  modelUrl: pathname,
                  modelLabel: effect.title,
                }}
                resourceLibraryPlacement="studio-panel"
                className={undefined}
              />
            </div>

            {exampleOptions.length > 0 ? (
              <div className="mt-3.5 flex items-center gap-3 overflow-hidden">
                <p className="shrink-0 text-[13px] font-medium text-[#666666]">
                  {t("tryExamples")}
                </p>
                <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {exampleOptions.map((example, index) => {
                    const isActive =
                      selectedExample?.inputImageUrls.join("|") ===
                        example.inputImageUrls.join("|") &&
                      selectedExample?.outputVideoUrl ===
                        example.outputVideoUrl;

                    return (
                      <button
                        key={`${example.inputImageUrls.join("|")}-${example.outputVideoUrl}-${index}`}
                        type="button"
                        onClick={() => handleExampleSelect(example)}
                        className={cn(
                          "relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border transition-all",
                          isActive
                            ? "border-[#2FB5FF] shadow-[0_0_0_2px_rgba(200,107,255,0.9)]"
                            : "border-[#D9E0EA] hover:border-[#3BA0FF]",
                        )}
                        aria-label={t("exampleAria", { index: index + 1 })}
                      >
                        {example.inputImageUrls.length > 1 ? (
                          <div className="grid h-full w-full grid-cols-2 gap-px bg-[#D9E0EA]">
                            {example.inputImageUrls
                              .slice(0, 2)
                              .map((inputUrl, inputIndex) => (
                                <img
                                  key={`${inputUrl}-${inputIndex}`}
                                  src={
                                    withOssImageMaxSide(inputUrl, 80) ||
                                    inputUrl
                                  }
                                  alt={`${effect.title} example ${index + 1} input ${inputIndex + 1}`}
                                  className="h-full w-full bg-[#F2F4F8] object-contain"
                                />
                              ))}
                          </div>
                        ) : (
                          <img
                            src={
                              withOssImageMaxSide(
                                example.inputImageUrls[0],
                                80,
                              ) || example.inputImageUrls[0]
                            }
                            alt={`${effect.title} example ${index + 1}`}
                            className="h-full w-full bg-[#F2F4F8] object-contain"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isAiTwerk ? (
              <div className="mt-3 rounded-[1rem] border border-[#E5E7EB] bg-[#FFFDF6] p-3.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7A5600]">
                  {aiTwerkPhotoRequirementsTitle}
                </p>
                <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-[0.9rem] border border-[#D8E9D2] bg-[#F5FFF3] p-3 text-[13px] text-[#2F5130]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{aiTwerkRequirementGood}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-[0.9rem] border border-[#F3D2D2] bg-[#FFF6F6] p-3 text-[13px] text-[#8E4141]">
                    <X className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{aiTwerkRequirementBad}</span>
                  </div>
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
              "mt-4 h-[62px] w-full rounded-full text-[15px] font-semibold shadow-none",
              "bg-[#23282F] text-white hover:bg-[#333333] disabled:bg-[#EFE7C8] disabled:text-[#9A8F66]",
            )}
          >
            {isEstimating || isGenerating ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>{t("estimating")}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                <span>
                  {panelGenerateLabel}
                  {requiredCredits !== null && requiredCredits !== undefined ? (
                    <span className="ml-1.5 opacity-90">
                      ({requiredCredits} {t("creditsUnit")})
                    </span>
                  ) : null}
                </span>
              </>
            )}
          </Button>

          {estimateError || generationError ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[14px] text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                {estimateError
                  ? renderErrorMessage(`${t("estimateError")} ${estimateError}`)
                  : renderErrorMessage(generationError)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
