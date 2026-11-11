"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";

import {
  ToolEffectLayout,
  ToolGenericStudio,
  type ToolEffectCarouselItem,
} from "@/shared/blocks/create/tool-effect-layout";
import { MediaWorkbenchFormShell } from "@/shared/blocks/desktop-playground/components/media-workbench-form-shell";
import { PromptEnhanceButton } from "@/shared/components/prompt-enhance-button";
import { PaymentButton } from "@/shared/components/payment-button";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAppContext } from "@/shared/contexts/app";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import faceGeneratorLibrary from "@/shared/lib/face-generator-library.json";
import {
  AGE_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  BODY_TYPE_OPTIONS,
  buildFacePrompt,
  DEFAULT_FACE_GENERATOR_VALUES,
  EYE_COLOR_OPTIONS,
  ETHNOS_OPTIONS,
  type FaceGeneratorFormValues,
  type FaceGeneratorOption,
  type FaceLibraryItem,
  GENDER_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HAIR_TYPE_OPTIONS,
  MAKEUP_OPTIONS,
} from "@/shared/lib/face-generator";
import { withOssImageResize } from "@/shared/lib/cdn";
import { cn } from "@/shared/lib/utils";

const WORKBENCH_SELECT_TRIGGER_CLASS =
  "h-11 w-full rounded-xl border border-[#D9E0EA] bg-[#F8FAFC] text-left text-sm text-[#23282F] shadow-none transition-all duration-200 hover:border-[#BFD4F6] hover:bg-white focus-visible:ring-[#BFDBFE]";

const WORKBENCH_SELECT_CONTENT_CLASS =
  "z-[1400] rounded-2xl border border-[#D9E0EA] !bg-white p-2 text-[#23282F] shadow-[0_24px_60px_rgba(15,23,42,0.12)] [&>div]:!bg-white";

const MODEL_OPTIONS = [
  {
    label: "GPT Image 2",
    url: "/text-to-image/gpt-image-2",
    monogram: "G",
    badge: "New",
  },
];

function randomValue(options: FaceGeneratorOption[]) {
  return options[Math.floor(Math.random() * options.length)]?.value || "";
}

function buildSurpriseValues(): FaceGeneratorFormValues {
  const gender =
    randomValue(GENDER_OPTIONS) || DEFAULT_FACE_GENERATOR_VALUES.gender;

  return {
    gender,
    age: randomValue(AGE_OPTIONS) || DEFAULT_FACE_GENERATOR_VALUES.age,
    ethnos: randomValue(ETHNOS_OPTIONS) || DEFAULT_FACE_GENERATOR_VALUES.ethnos,
    bodyType: randomValue(BODY_TYPE_OPTIONS),
    eyeColor: randomValue(EYE_COLOR_OPTIONS),
    hairColor: randomValue(HAIR_COLOR_OPTIONS),
    hairType: randomValue(HAIR_TYPE_OPTIONS),
    hairStyle: randomValue(HAIR_STYLE_OPTIONS),
    makeup: gender === "Female" ? randomValue(MAKEUP_OPTIONS) : "",
    aspectRatio:
      randomValue(ASPECT_RATIO_OPTIONS) ||
      DEFAULT_FACE_GENERATOR_VALUES.aspectRatio,
    quality: "4K",
    imageCount: DEFAULT_FACE_GENERATOR_VALUES.imageCount,
  };
}

function AspectRatioIcon({
  ratio,
  isSelected,
}: {
  ratio: string;
  isSelected: boolean;
}) {
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
          ? "border-[#23282F]/30 bg-[#23282F]/15"
          : "border-[#9AA3AF]/35 bg-white",
      )}
      style={{
        width: `${iconWidth}px`,
        height: `${iconHeight}px`,
      }}
    />
  );
}

function FaceGeneratorHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1220px] px-4 pb-3 pt-4 text-center sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pb-5 lg:pt-6">
        <h1 className="text-balance text-[2rem] font-bold leading-[1.08] text-[#23282F] sm:text-[2.45rem] lg:text-[3rem]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-[1180px] text-balance text-[0.95rem] leading-[1.5] text-[#626B7A] sm:text-[1.08rem] lg:text-[1.18rem]">
          {description}
        </p>
      </div>
    </section>
  );
}

function FaceGeneratorMarketingSection({
  title,
  description,
  libraryItems,
  onCtaClick,
}: {
  title: string;
  description: string;
  libraryItems: FaceLibraryItem[];
  onCtaClick: () => void;
}) {
  const featureItems = [
    {
      title: "Start from portrait-ready templates",
      description:
        "Browse curated synthetic face presets, apply a look in one click, and keep the generator focused on realistic portrait attributes.",
      preview: libraryItems[0],
    },
    {
      title: "Tune identity details without rebuilding prompts",
      description:
        "Adjust gender, age range, heritage, hair, eyes, makeup, body type, and aspect ratio with compact controls designed for fast iteration.",
      preview: libraryItems[1],
    },
    {
      title: "Generate multiple distinct faces at once",
      description:
        "Create several polished AI portrait variations from the same direction while keeping each generated identity synthetic and distinct.",
      preview: libraryItems[2],
    },
  ];
  const stepItems = [
    {
      title: "1. Pick a template or randomize",
      description:
        "Choose a preset from the gallery or use Surprise Me to quickly explore a new portrait direction.",
      preview: libraryItems[3] || libraryItems[0],
    },
    {
      title: "2. Refine the face settings",
      description:
        "Use the form controls and optional prompt field to define the final look, lighting, styling, and crop.",
      preview: libraryItems[4] || libraryItems[1],
    },
    {
      title: "3. Generate and iterate",
      description:
        "Run the generator, review the portraits, then update the settings for a cleaner or more specific result.",
      preview: libraryItems[5] || libraryItems[2],
    },
  ];
  const faqs = [
    {
      question: "Can I use a template as a starting point?",
      answer:
        "Yes. Selecting a template fills the face attributes while leaving the prompt open for your own creative direction.",
    },
    {
      question: "How do I get more realistic portraits?",
      answer:
        "Keep the settings focused, add concrete lighting or styling notes, and avoid mixing too many conflicting identity details.",
    },
    {
      question: "Does the generator create real people?",
      answer:
        "No. The prompt is designed to create distinct synthetic identities rather than matching or copying a real person.",
    },
  ];

  return (
    <section className="space-y-8 pb-8 pt-4">
      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[62rem] text-center">
          <h2 className="text-balance text-[2rem] font-bold leading-[1.04] tracking-[-0.05em] text-[#23282F] sm:text-[2.5rem]">
            Create polished AI faces with {title}
          </h2>
          <p className="mx-auto mt-4 max-w-[52rem] text-sm leading-7 text-[#4A5464] sm:text-base">
            {description} Start with a preset, refine the attributes, and
            generate portrait variations in the same clean Mango-style workflow.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {featureItems.map((feature, index) => {
            const isReversed = index % 2 === 1;
            const previewUrl = feature.preview?.previewUrl;

            return (
              <article
                key={feature.title}
                className={cn(
                  "grid gap-5 rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-center",
                  isReversed &&
                    "lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]",
                )}
              >
                <div className={cn(isReversed && "lg:order-2")}>
                  <div className="overflow-hidden rounded-[24px] border border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)]">
                    {previewUrl ? (
                      <img
                        src={
                          withOssImageResize(previewUrl, 960, 1200) ||
                          previewUrl
                        }
                        alt={feature.preview?.title || feature.title}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                        <Sparkles className="size-8 text-[#9AA3AF]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn("px-1 sm:px-2", isReversed && "lg:order-1")}>
                  <h3 className="text-[1.45rem] font-semibold leading-[1.12] tracking-[-0.04em] text-[#23282F] sm:text-[1.8rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#4A5464] sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[44rem] text-center">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            How to use {title}
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {stepItems.map((step, index) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-[#FFFDF6]"
            >
              <div className="overflow-hidden border-b border-[#F3E9BE] bg-[linear-gradient(180deg,#FFF6CF_0%,#FFFDF4_100%)] p-4">
                <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_12px_30px_rgba(35,40,47,0.08)]">
                  {step.preview?.previewUrl ? (
                    <img
                      src={
                        withOssImageResize(
                          step.preview.previewUrl,
                          900,
                          1125,
                        ) || step.preview.previewUrl
                      }
                      alt={step.preview.title || step.title}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#F5F7F9]">
                      <Sparkles className="size-8 text-[#9AA3AF]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="text-sm font-semibold text-[#7A5600]">
                  {`0${index + 1}`}
                </div>
                <h3 className="mt-2 text-[1.2rem] font-semibold leading-6 text-[#23282F]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#4A5464]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[rgba(0,0,0,0.05)_0px_1px_3px_0px,rgba(0,0,0,0.1)_0px_1px_2px_-1px] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[42rem] text-center">
          <h2 className="text-balance text-[1.85rem] font-bold leading-[1.05] tracking-[-0.05em] text-[#23282F] sm:text-[2.3rem]">
            FAQs about {title}
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-[980px] space-y-4">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[#E5E7EB] bg-[#FFFDF8] p-5"
            >
              <h3 className="text-lg font-semibold text-[#23282F]">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4A5464]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] rounded-[32px] border border-[#f1df9c] bg-[linear-gradient(135deg,#ffc100_0%,#ffd966_62%,#fff0b5_100%)] p-6 text-center shadow-[0_18px_48px_rgba(255,193,0,0.18)] sm:p-8">
        <h2 className="mx-auto max-w-[24ch] text-balance text-[2rem] font-bold leading-[1.06] tracking-[-0.05em] text-[#23282F] sm:text-[2.4rem]">
          Start creating with {title}
        </h2>
        <p className="mx-auto mt-4 max-w-[40rem] text-sm leading-7 text-[#4A5464] sm:text-base">
          Pick a portrait direction, refine the details, and generate polished
          synthetic faces in one workspace.
        </p>
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-6 inline-flex h-[62px] items-center justify-center rounded-full bg-[#23282F] px-8 text-base font-semibold text-white transition hover:opacity-95"
        >
          Try Face Generator
        </button>
      </section>
    </section>
  );
}

function FormSelect({
  label,
  required,
  value,
  options,
  placeholder = "Select",
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: FaceGeneratorOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold text-[#23282F]">
        {label}
        {required ? <span className="ml-1 text-red-400">*</span> : null}
      </Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className={WORKBENCH_SELECT_TRIGGER_CLASS}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={WORKBENCH_SELECT_CONTENT_CLASS}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FaceGeneratorPage() {
  const t = useTranslations("landing.wavespeed.desktopPlayground");
  const tRoot = useTranslations("landing.wavespeed");
  const tFace = useTranslations("creator.faceGenerator");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const [currentModelUrl] = useState("/text-to-image/gpt-image-2");
  const [values, setValues] = useState<FaceGeneratorFormValues>(
    DEFAULT_FACE_GENERATOR_VALUES,
  );
  const [extraPrompt, setExtraPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState(tFace("status.ready"));
  const [error, setError] = useState<string | null>(null);
  const libraryItems = faceGeneratorLibrary as FaceLibraryItem[];

  const perImageCreditsParams = useMemo(
    () => ({
      aspect_ratio: values.aspectRatio,
    }),
    [values.aspectRatio],
  );

  const { credits: perImageCredits, isLoading: isEstimatingCredits } =
    useEstimateCredits("gpt-image-2-text-to-image", perImageCreditsParams, {
      requireAuth: false,
    });

  const totalCredits = useMemo(() => {
    if (typeof perImageCredits !== "number") {
      return null;
    }
    return perImageCredits * values.imageCount;
  }, [perImageCredits, values.imageCount]);

  const promptPreview = useMemo(() => {
    const base = buildFacePrompt(values);
    const suffix = extraPrompt.trim();
    return suffix ? `${base} ${suffix}` : base;
  }, [extraPrompt, values]);

  const updateValue = <K extends keyof FaceGeneratorFormValues>(
    key: K,
    nextValue: FaceGeneratorFormValues[K],
  ) => {
    setValues((prev) => ({
      ...prev,
      [key]: nextValue,
      ...(key === "gender" && nextValue === "Male" ? { makeup: "" } : {}),
    }));
  };

  const applyLibraryItem = (item: FaceLibraryItem) => {
    setValues((prev) => ({
      ...prev,
      gender: item.params.gender || prev.gender,
      age: item.params.age || prev.age,
      ethnos: item.params.ethnos || prev.ethnos,
      bodyType: item.params.bodyType || prev.bodyType,
      eyeColor: item.params.eyeColor || prev.eyeColor,
      hairColor: item.params.hairColor || prev.hairColor,
      hairType: item.params.hairType || prev.hairType,
      hairStyle: item.params.hairStyle || prev.hairStyle,
      makeup: item.params.makeup || prev.makeup,
      aspectRatio: item.params.aspectRatio || prev.aspectRatio,
      quality: item.params.quality || prev.quality,
    }));
    setError(null);
    setStatusText(tFace("status.templateApplied", { title: item.title }));
  };

  const handleSurprise = () => {
    setValues(buildSurpriseValues());
    setError(null);
    setStatusText(tFace("status.surpriseApplied"));
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedImages([]);
    setIsGenerating(true);

    try {
      const nextImages: string[] = [];

      for (let index = 0; index < values.imageCount; index += 1) {
        const basePrompt = buildFacePrompt(values, index);
        const prompt = extraPrompt.trim()
          ? `${basePrompt} ${extraPrompt.trim()}`
          : basePrompt;

        setStatusText(
          values.imageCount > 1
            ? `${tFace("status.generating")} ${index + 1}/${values.imageCount}`
            : tFace("status.generating"),
        );

        const result = await executeGeneration(
          {
            apiEndpoint: "/api/ai/gpt-image-2-text-to-image/generate",
            scenario: "gpt-image-2-text-to-image",
            requestBody: {
              mediaType: "image",
              prompt,
              enable_base64_output: false,
              enable_sync_mode: false,
              aspect_ratio: values.aspectRatio,
            },
            requiredCredits: totalCredits,
            remainingCredits: user?.credits?.remainingCredits ?? 0,
          },
          {
            checkAccess,
            modelUrl: "/text-to-image/gpt-image-2",
            modelLabel: "GPT-Image 2",
            showPricingModal: () => setIsShowPaymentModal(true),
            showSignModal: () => setIsShowSignModal(true),
            fetchUserInfo: async () => {
              await fetchUserInfo();
            },
            onStatusUpdate: (status) => setStatusText(status),
            onError: (nextError) => setError(nextError),
          },
          (_key, params) => String(params?.defaultValue || ""),
        );

        if (!result.success || !result.url) {
          throw new Error(result.error || tFace("errors.generateFailed"));
        }

        nextImages.push(result.url);
        setGeneratedImages([...nextImages]);
      }

      setStatusText(
        nextImages.length > 1
          ? `${nextImages.length} faces generated`
          : tFace("status.generated"),
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : tFace("errors.generateFailed"),
      );
      setStatusText(tFace("status.failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const carouselItems = useMemo<ToolEffectCarouselItem[]>(() => {
    const generatedItems = generatedImages.map((url, index) => ({
      id: `generated-${index}-${url}`,
      title:
        generatedImages.length > 1
          ? `${tFace("status.generated")} ${index + 1}`
          : tFace("status.generated"),
      description: promptPreview,
      mediaType: "image" as const,
      previewUrl: url,
      thumbnailUrl: url,
    }));

    const templateItems = libraryItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: buildFacePrompt({
        ...DEFAULT_FACE_GENERATOR_VALUES,
        ...item.params,
        imageCount: 1,
      }),
      mediaType: "image" as const,
      previewUrl: item.previewUrl,
      thumbnailUrl: item.thumbnailUrl || item.previewUrl,
      onSelect: () => applyLibraryItem(item),
    }));

    return [...generatedItems, ...templateItems];
  }, [generatedImages, libraryItems, promptPreview, tFace]);

  const standaloneForm = (
    <MediaWorkbenchFormShell
      t={t}
      sceneTitle={tFace("hero.title")}
      sceneIconUrl={(faceGeneratorLibrary as FaceLibraryItem[])[0]?.previewUrl}
      modelOptions={MODEL_OPTIONS}
      currentModelUrl={currentModelUrl}
      configModelName="GPT Image 2"
      footer={
        <>
          <button
            data-generate-btn
            onClick={handleGenerate}
            disabled={isGenerating || isEstimatingCredits}
            className={cn(
              "h-[62px] w-full cursor-pointer rounded-full border-0 bg-[linear-gradient(90deg,#22B8FF_0%,#B23BFF_100%)] px-6 text-base font-semibold text-white transition-all duration-300 hover:opacity-95",
              "disabled:cursor-not-allowed disabled:bg-[#E6EAF2] disabled:text-[#9AA3AF] disabled:opacity-100",
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
                {t("actions.generateImage")}
                {typeof totalCredits === "number" ? (
                  <span className="ml-1.5 opacity-90">
                    ({totalCredits} {t("credits")})
                  </span>
                ) : null}
              </>
            )}
          </button>

          <PaymentButton
            minCredits={totalCredits ?? 20}
            buttonText={tRoot("buttons.click_to_pay")}
          />

          {error ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          ) : null}
          {!error && statusText ? (
            <div className="mt-3 rounded-lg border border-[#D9E0EA] bg-white/70 p-3 text-sm text-[#4A5464]">
              {statusText}
            </div>
          ) : null}
        </>
      }
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#23282F]">
            {tFace("form.prompt")}
            <span className="ml-1 text-red-400">*</span>
          </label>
          <span className="text-xs text-[#6B7280]">
            {extraPrompt.length}/2000
          </span>
        </div>
        <textarea
          value={extraPrompt}
          onChange={(event) => setExtraPrompt(event.target.value)}
          placeholder={tFace("form.promptPlaceholder")}
          maxLength={2000}
          className="w-full min-h-[110px] resize-none rounded-lg border border-[#D9E0EA] bg-[#F8FAFC] px-3 py-3 text-sm text-[#23282F] placeholder:text-[#9AA3AF] shadow-none transition-all duration-300 focus:border-[#BFD4F6] focus:bg-white focus:outline-none"
          disabled={isGenerating}
        />
        <div className="flex justify-end">
          <PromptEnhanceButton
            prompt={extraPrompt}
            onEnhanced={setExtraPrompt}
            mode="image"
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#23282F]">
            {tFace("form.aspectRatio")}
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={handleSurprise}
            className="h-9 rounded-xl border-[#D9E0EA] bg-[#F8FAFC] text-[#23282F] hover:bg-white"
          >
            <Sparkles className="size-4" />
            {tFace("actions.surpriseMe")}
          </Button>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => {
            const isSelected = values.aspectRatio === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateValue("aspectRatio", option.value)}
                className={cn(
                  "flex w-[56px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 transition-all duration-300 sm:w-[60px]",
                  isSelected
                    ? "border-[#BFD4F6] bg-[#EEF6FF] shadow-none"
                    : "border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#D8E7FF] hover:bg-white",
                )}
              >
                <AspectRatioIcon ratio={option.value} isSelected={isSelected} />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isSelected ? "text-[#23282F]" : "text-[#6B7280]",
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-[#23282F]">
          {tFace("form.gender")}
          <span className="ml-1 text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateValue("gender", option.value)}
              className={cn(
                "h-11 rounded-xl border text-sm font-medium transition-colors",
                values.gender === option.value
                  ? "border-[#BFD4F6] bg-[#EEF6FF] text-[#23282F]"
                  : "border-[#E5E7EB] bg-[#F8FAFC] text-[#4A5464] hover:bg-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          label={tFace("form.age")}
          placeholder={tFace("form.selectPlaceholder")}
          required
          value={values.age}
          options={AGE_OPTIONS}
          onChange={(value) => updateValue("age", value)}
        />
        <FormSelect
          label={tFace("form.ethnos")}
          placeholder={tFace("form.selectPlaceholder")}
          required
          value={values.ethnos}
          options={ETHNOS_OPTIONS}
          onChange={(value) => updateValue("ethnos", value)}
        />
        <FormSelect
          label={tFace("form.bodyType")}
          placeholder={tFace("form.selectPlaceholder")}
          value={values.bodyType}
          options={BODY_TYPE_OPTIONS}
          onChange={(value) => updateValue("bodyType", value)}
        />
        <FormSelect
          label={tFace("form.eyeColor")}
          placeholder={tFace("form.selectPlaceholder")}
          value={values.eyeColor}
          options={EYE_COLOR_OPTIONS}
          onChange={(value) => updateValue("eyeColor", value)}
        />
        <FormSelect
          label={tFace("form.hairColor")}
          placeholder={tFace("form.selectPlaceholder")}
          value={values.hairColor}
          options={HAIR_COLOR_OPTIONS}
          onChange={(value) => updateValue("hairColor", value)}
        />
        <FormSelect
          label={tFace("form.hairType")}
          placeholder={tFace("form.selectPlaceholder")}
          value={values.hairType}
          options={HAIR_TYPE_OPTIONS}
          onChange={(value) => updateValue("hairType", value)}
        />
        <FormSelect
          label={tFace("form.hairStyle")}
          placeholder={tFace("form.selectPlaceholder")}
          value={values.hairStyle}
          options={HAIR_STYLE_OPTIONS}
          onChange={(value) => updateValue("hairStyle", value)}
        />
        {values.gender === "Female" ? (
          <FormSelect
            label={tFace("form.makeup")}
            placeholder={tFace("form.selectPlaceholder")}
            value={values.makeup}
            options={MAKEUP_OPTIONS}
            onChange={(value) => updateValue("makeup", value)}
          />
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-[#23282F]">
          {tFace("form.generatedPromptPreview")}
        </Label>
        <div className="rounded-2xl border border-[#D9E0EA] bg-[#F8FAFC] px-3 py-3 text-sm leading-6 text-[#4A5464]">
          {promptPreview}
        </div>
      </div>
    </MediaWorkbenchFormShell>
  );

  return (
    <ToolEffectLayout
      hero={
        <FaceGeneratorHero
          title={tFace("hero.title")}
          description={tFace("hero.description")}
        />
      }
      generator={
        <ToolGenericStudio
          form={standaloneForm}
          carouselItems={carouselItems}
          emptyTitle={tFace("tabs.library")}
          emptyDescription={tFace("empty.creations.description")}
        />
      }
      marketing={
        <FaceGeneratorMarketingSection
          title={tFace("hero.title")}
          description={tFace("hero.description")}
          libraryItems={libraryItems}
          onCtaClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      }
    />
  );
}
