"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import {
  defineRegistry,
  JSONUIProvider,
  Renderer,
  schema,
} from "@json-render/react";
import {
  Check,
  ChevronDown,
  ImageIcon,
  Loader2,
  Pencil,
  Send,
  Sparkles,
  Wand2,
  Video,
} from "lucide-react";

import type { FieldType } from "@/shared/blocks/desktop-playground/types/playground-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import type {
  CanvasAgentExecutionReviewCard,
  CanvasAgentMessageCard,
  CanvasAgentPromptGuideCard,
  CanvasAgentSceneRouterCard,
} from "@/shared/lib/canvas-agent-message-cards";

type CanvasAgentSceneRouterField = {
  key: string;
  type: Exclude<FieldType, "upload">;
  label: string;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
};

type CanvasAgentSceneRouterPresentation = {
  workflowNodeId: string;
  title: string;
  subtitle: string;
  prompt: string;
  selectedModelUrl: string;
  modelOptions: Array<{
    sceneId: string;
    sceneLabel: string;
    modelUrl: string;
    modelLabel: string;
  }>;
  fields: CanvasAgentSceneRouterField[];
  values: Record<string, any>;
};

type CanvasAgentGenerationCard = {
  status: "idle" | "submitted" | "completed" | "failed" | "partial" | string;
  label: string;
  description?: string;
  tasks?: Array<{
    taskId: string;
    scenario?: string;
    status: string;
    errorMessage?: string;
  }>;
};

type CanvasAgentSuggestionCard = {
  id: string;
  title: string;
  description: string;
  icon?: "image" | "video" | "spark";
};

const CANVAS_AGENT_PARAM_LABEL_CLASS =
  "mb-1 flex items-center justify-between gap-2";
const CANVAS_AGENT_PARAM_LABEL_TEXT_CLASS =
  "text-[0.66rem] font-medium tracking-[-0.01em] text-[#a1a4a5]";
const CANVAS_AGENT_PARAM_TRIGGER_CLASS =
  "h-10 w-full cursor-pointer rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 text-left text-[0.74rem] font-medium text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:border-[rgba(214,235,253,0.24)] focus:border-[rgba(214,235,253,0.3)] data-[placeholder]:text-white/34";
const CANVAS_AGENT_PARAM_CONTENT_CLASS =
  "border-[rgba(214,235,253,0.18)] bg-[#0d1014] text-[#f0f0f0] shadow-[0_20px_48px_rgba(0,0,0,0.42)]";

type CanvasAgentExecutionReviewPresentation = {
  cardId: string;
  executionMode: "ask" | "auto";
  groupLabel?: string;
  workflowNodeIds: string[];
  nodeSummaries: CanvasAgentExecutionReviewCard["nodeSummaries"];
};

type CanvasAgentCardRuntime = {
  resolveSceneRouterCard: (
    card: CanvasAgentSceneRouterCard,
  ) => CanvasAgentSceneRouterPresentation | null;
  onApplySceneRouterCard: (input: {
    card: CanvasAgentSceneRouterCard;
    workflowNodeId: string;
    modelUrl: string;
    values: Record<string, any>;
  }) => void | Promise<void>;
  onGenerateSceneRouterCard: (input: {
    card: CanvasAgentSceneRouterCard;
    workflowNodeId: string;
    modelUrl: string;
    values: Record<string, any>;
  }) => void | Promise<void>;
  onConfirmExecutionReviewCard?: (input: {
    card: CanvasAgentExecutionReviewCard;
  }) => void | Promise<void>;
  onPromptGuideOptionSelect?: (input: {
    card: CanvasAgentPromptGuideCard;
    optionId: string;
    prompt: string;
  }) => void | Promise<void>;
  onPromptGuideCustomIdea?: (input: {
    card: CanvasAgentPromptGuideCard;
  }) => void | Promise<void>;
  onSuggestionSelect?: (suggestionId: string) => void;
};

const CanvasAgentCardRuntimeContext =
  createContext<CanvasAgentCardRuntime | null>(null);

function useCanvasAgentCardRuntime() {
  const context = useContext(CanvasAgentCardRuntimeContext);
  if (!context) {
    throw new Error("CanvasAgentCardRuntimeContext is missing");
  }
  return context;
}

const canvasAgentCardCatalog = schema.createCatalog({
  components: {
    SceneRouterCard: {
      props: z.object({
        card: z.object({
          kind: z.literal("scene-router"),
          cardId: z.string(),
          executionMode: z.enum(["ask", "auto"]),
          mediaIntent: z.enum(["image", "video"]),
          subtype: z.enum([
            "text-to-image",
            "image-to-image",
            "text-to-video",
            "image-to-video",
          ]),
          preferredModelUrl: z.string().optional(),
          prompt: z.string(),
          workflowNodeIds: z.array(z.string()),
        }),
      }),
      slots: [],
      description: "Canvas scene routing parameter card",
    },
    GenerationStatusCard: {
      props: z.object({
        status: z.string(),
        label: z.string(),
        description: z.string().optional(),
        tasks: z
          .array(
            z.object({
              taskId: z.string(),
              scenario: z.string().optional(),
              status: z.string(),
              errorMessage: z.string().optional(),
            }),
          )
          .optional(),
      }),
      slots: [],
      description: "Canvas generation status summary card",
    },
    SuggestionCard: {
      props: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        icon: z.enum(["image", "video", "spark"]).optional(),
      }),
      slots: [],
      description: "Canvas welcome suggestion card",
    },
    ExecutionReviewCard: {
      props: z.object({
        card: z.object({
          kind: z.literal("execution-review"),
          cardId: z.string(),
          executionMode: z.enum(["ask", "auto"]),
          groupLabel: z.string().optional(),
          workflowNodeIds: z.array(z.string()),
          nodeSummaries: z.array(
            z.object({
              nodeId: z.string(),
              label: z.string(),
              kind: z.enum(["text", "input", "workflow"]),
              badge: z.string().optional(),
            }),
          ),
        }),
      }),
      slots: [],
      description: "Canvas execution review card",
    },
    PromptGuideCard: {
      props: z.object({
        card: z.object({
          kind: z.literal("prompt-guide"),
          cardId: z.string(),
          title: z.string(),
          description: z.string().optional(),
          customPromptLabel: z.string().optional(),
          options: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              prompt: z.string(),
            }),
          ),
        }),
      }),
      slots: [],
      description: "Prompt guidance card for short canvas prompts",
    },
  },
  actions: {},
});

function getSuggestionTint(icon?: CanvasAgentSuggestionCard["icon"]) {
  if (icon === "video") {
    return "bg-[rgba(127,52,58,0.38)] text-[#ff625f]";
  }
  if (icon === "image") {
    return "bg-[rgba(19,90,108,0.36)] text-[#2fd1ff]";
  }
  return "bg-[rgba(106,92,35,0.36)] text-[#f5d56a]";
}

const { registry } = defineRegistry(canvasAgentCardCatalog, {
  components: {
    SceneRouterCard: ({ props }) => (
      <SceneRouterCardView card={props.card as CanvasAgentSceneRouterCard} />
    ),
    GenerationStatusCard: ({ props }) => (
      <GenerationStatusCardView card={props as CanvasAgentGenerationCard} />
    ),
    SuggestionCard: ({ props }) => (
      <SuggestionCardView card={props as CanvasAgentSuggestionCard} />
    ),
    ExecutionReviewCard: ({ props }) => (
      <ExecutionReviewCardView
        card={props.card as CanvasAgentExecutionReviewCard}
      />
    ),
    PromptGuideCard: ({ props }) => (
      <PromptGuideCardView card={props.card as CanvasAgentPromptGuideCard} />
    ),
  },
  actions: {},
});

function SuggestionCardView({ card }: { card: CanvasAgentSuggestionCard }) {
  const runtime = useCanvasAgentCardRuntime();
  const Icon =
    card.icon === "video"
      ? Video
      : card.icon === "image"
        ? ImageIcon
        : Sparkles;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-[22px] border border-[rgba(214,235,253,0.12)] bg-[linear-gradient(180deg,#1d2025,#1a1d22)] px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-[rgba(214,235,253,0.22)] hover:bg-[linear-gradient(180deg,#21252b,#1d2026)]"
      onClick={() => runtime.onSuggestionSelect?.(card.id)}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/4",
          getSuggestionTint(card.icon),
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
          {card.title}
        </span>
        <span className="mt-1 block truncate text-[0.84rem] text-white/38">
          {card.description}
        </span>
      </span>
      <ChevronDown className="size-3.5 -rotate-90 text-white/26" />
    </button>
  );
}

function PromptGuideCardView({ card }: { card: CanvasAgentPromptGuideCard }) {
  const runtime = useCanvasAgentCardRuntime();

  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-[linear-gradient(180deg,#121416,#0d0f11)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
      <div className="px-1 pb-2">
        <div className="text-[0.78rem] font-semibold tracking-[-0.03em] text-white">
          {card.title}
        </div>
        {card.description ? (
          <div className="mt-1 text-[0.68rem] leading-5 text-white/42">
            {card.description}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {card.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="block w-full rounded-[18px] bg-white/[0.035] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            onClick={() =>
              runtime.onPromptGuideOptionSelect?.({
                card,
                optionId: option.id,
                prompt: option.prompt,
              })
            }
          >
            <div className="truncate text-[0.84rem] font-semibold tracking-[-0.03em] text-white">
              {option.title}
            </div>
            <div className="mt-0.5 truncate text-[0.74rem] text-white/42">
              {option.description}
            </div>
          </button>
        ))}

        {card.customPromptLabel ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-[18px] border border-dashed border-white/18 px-4 py-3 text-left text-[0.82rem] font-semibold text-white/82 transition hover:border-white/28 hover:bg-white/[0.03]"
            onClick={() => runtime.onPromptGuideCustomIdea?.({ card })}
          >
            <span className="truncate">{card.customPromptLabel}</span>
            <Pencil className="size-3.5 shrink-0 text-white/54" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function GenerationStatusCardView({
  card,
}: {
  card: CanvasAgentGenerationCard;
}) {
  const tone =
    card.status === "completed"
      ? "border-emerald-400/24 bg-emerald-400/10 text-emerald-100"
      : card.status === "failed"
        ? "border-rose-400/24 bg-rose-400/10 text-rose-100"
        : card.status === "partial"
          ? "border-amber-300/24 bg-amber-300/10 text-amber-100"
          : "border-[rgba(214,235,253,0.14)] bg-white/[0.04] text-white/72";

  return (
    <div className={cn("rounded-[18px] border px-3.5 py-3", tone)}>
      <div className="flex items-center gap-2 text-[0.76rem] font-medium">
        {card.status === "submitted" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : card.status === "completed" ? (
          <Check className="size-3.5" />
        ) : card.status === "failed" ? (
          <Sparkles className="size-3.5" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        <span>{card.label}</span>
      </div>
      {card.description ? (
        <div className="mt-1 text-[0.72rem] leading-5 text-white/58">
          {card.description}
        </div>
      ) : null}
      {Array.isArray(card.tasks) && card.tasks.length > 0 ? (
        <div className="mt-2.5 space-y-1.5">
          {card.tasks.map((task) => (
            <div
              key={task.taskId}
              className="rounded-[12px] border border-white/[0.06] bg-black/15 px-2.5 py-2 text-[0.7rem] text-white/58"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-white/74">
                  {task.scenario || task.taskId}
                </span>
                <span className="shrink-0 text-white/36">{task.status}</span>
              </div>
              {task.errorMessage ? (
                <div className="mt-1 line-clamp-2 text-rose-200/82">
                  {task.errorMessage}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SceneRouterCardView({ card }: { card: CanvasAgentSceneRouterCard }) {
  const runtime = useCanvasAgentCardRuntime();
  const basePresentation = runtime.resolveSceneRouterCard(card);
  const promptPreviewRef = useRef<HTMLDivElement | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptCanExpand, setPromptCanExpand] = useState(false);
  const [expandedMoreFields, setExpandedMoreFields] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [selectedModelUrl, setSelectedModelUrl] = useState(
    basePresentation?.selectedModelUrl || card.preferredModelUrl || "",
  );
  const [draftValues, setDraftValues] = useState<Record<string, any>>(
    basePresentation?.values || {},
  );
  const [submittingAction, setSubmittingAction] = useState<
    "apply" | "generate" | null
  >(null);
  const presentation = useMemo(() => {
    if (!selectedModelUrl) {
      return basePresentation;
    }

    return (
      runtime.resolveSceneRouterCard({
        ...card,
        preferredModelUrl: selectedModelUrl,
      }) || basePresentation
    );
  }, [basePresentation, card, runtime, selectedModelUrl]);
  const presentationSyncKey = basePresentation
    ? `${card.cardId}:${basePresentation.workflowNodeId}:${basePresentation.selectedModelUrl}`
    : card.cardId;

  useEffect(() => {
    if (!basePresentation) return;
    setSelectedModelUrl((prev) =>
      prev === basePresentation.selectedModelUrl
        ? prev
        : basePresentation.selectedModelUrl,
    );
    setDraftValues((prev) => {
      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(basePresentation.values || {});
      return prevSerialized === nextSerialized
        ? prev
        : basePresentation.values || {};
    });
  }, [presentationSyncKey]);

  useEffect(() => {
    setExpandedPrompt(false);
    setIsEditingPrompt(false);
    setPromptCanExpand(false);
    setExpandedMoreFields(false);
    setDismissed(false);
  }, [card.cardId, basePresentation?.workflowNodeId]);

  if (dismissed) {
    return null;
  }

  if (!presentation) {
    return (
      <div className="rounded-[22px] border border-[rgba(214,235,253,0.12)] bg-white/[0.03] px-4 py-3 text-[0.78rem] text-white/56">
        当前场景参数卡暂时无法解析，请先等待画布节点同步完成。
      </div>
    );
  }

  const handleModelChange = (nextModelUrl: string) => {
    setSelectedModelUrl(nextModelUrl);
    const nextPresentation = runtime.resolveSceneRouterCard({
      ...card,
      preferredModelUrl: nextModelUrl,
    });
    if (nextPresentation) {
      setDraftValues(nextPresentation.values);
    }
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setDraftValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const currentWorkflowNodeId = presentation.workflowNodeId;
  const currentPrompt = String(draftValues.prompt || presentation.prompt || "");
  const visibleFields = presentation.fields.filter(
    (field) => field.key !== "prompt",
  );
  const compactFieldPriority = (field: CanvasAgentSceneRouterField) => {
    switch (field.type) {
      case "select":
        return 0;
      case "number":
        return 1;
      case "toggle":
        return 2;
      case "slider":
        return 3;
      case "text":
        return 4;
      case "textarea":
        return 5;
      default:
        return 6;
    }
  };
  const preferredPrimaryFields = [...visibleFields]
    .sort((a, b) => compactFieldPriority(a) - compactFieldPriority(b))
    .filter((field) => field.type !== "slider" && field.type !== "textarea")
    .slice(0, 2);
  const primaryFieldKeys = new Set(
    (preferredPrimaryFields.length > 0
      ? preferredPrimaryFields
      : visibleFields.slice(0, 1)
    ).map((field) => field.key),
  );
  const primaryFields = visibleFields.filter((field) =>
    primaryFieldKeys.has(field.key),
  );
  const secondaryFields = visibleFields.filter(
    (field) => !primaryFieldKeys.has(field.key),
  );

  useEffect(() => {
    if (isEditingPrompt) {
      setPromptCanExpand(false);
      return;
    }

    const node = promptPreviewRef.current;
    if (!node) {
      setPromptCanExpand(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setPromptCanExpand(node.scrollHeight - node.clientHeight > 4);
    });

    return () => cancelAnimationFrame(frame);
  }, [currentPrompt, expandedPrompt, isEditingPrompt]);

  return (
    <div className="rounded-[22px] border border-[rgba(214,235,253,0.18)] bg-[linear-gradient(180deg,#101418,#0b0e12)] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.32)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.76rem] font-medium text-[#a1a4a5]">
            {card.mediaIntent === "video" ? "视频生成" : "图片生成"} · ~
            {presentation.workflowNodeId.slice(-6)}
          </div>
          <div className="mt-1 text-[0.94rem] font-semibold tracking-[-0.03em] text-[#f0f0f0]">
            {presentation.title}
          </div>
        </div>
        <ChevronDown className="mt-1 size-3.5 -rotate-90 text-white/24" />
      </div>

      <div className="mt-3 rounded-[20px] border border-[rgba(214,235,253,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.035))] px-4 py-3.5">
        {isEditingPrompt ? (
          <textarea
            value={currentPrompt}
            onChange={(event) =>
              handleFieldChange("prompt", event.target.value)
            }
            rows={4}
            className="min-h-[6.5rem] w-full resize-none rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 py-3 text-[0.8rem] font-medium leading-6 tracking-[-0.02em] text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[rgba(214,235,253,0.3)]"
            placeholder="输入提示词"
          />
        ) : (
          <div
            ref={promptPreviewRef}
            className={cn(
              "text-[0.82rem] font-semibold leading-7 tracking-[-0.025em] text-[#f0f0f0]",
              expandedPrompt ? "" : "line-clamp-3",
            )}
          >
            {currentPrompt}
          </div>
        )}
        <div className="mt-2.5 flex items-center justify-between gap-3 text-[0.7rem] text-[#a1a4a5]">
          <span className="truncate">{presentation.subtitle}</span>
          <div className="inline-flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-white/50 transition hover:text-white/78"
              onClick={() => {
                setIsEditingPrompt((prev) => !prev);
                if (isEditingPrompt) {
                  setExpandedPrompt(false);
                }
              }}
            >
              <Pencil className="size-3.5" />
              <span>{isEditingPrompt ? "完成" : "编辑"}</span>
            </button>
            {promptCanExpand && !isEditingPrompt ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-white/50 transition hover:text-white/78"
                onClick={() => setExpandedPrompt((prev) => !prev)}
              >
                <span>{expandedPrompt ? "收起" : "展开"}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition",
                    expandedPrompt ? "rotate-180" : "-rotate-90",
                  )}
                />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-[rgba(214,235,253,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.02))] px-3.5 py-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 block">
            <div className={CANVAS_AGENT_PARAM_LABEL_CLASS}>
              <span className={CANVAS_AGENT_PARAM_LABEL_TEXT_CLASS}>Model</span>
            </div>
            <Select value={selectedModelUrl} onValueChange={handleModelChange}>
              <SelectTrigger className={CANVAS_AGENT_PARAM_TRIGGER_CLASS}>
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent className={CANVAS_AGENT_PARAM_CONTENT_CLASS}>
                {presentation.modelOptions.map((model) => (
                  <SelectItem key={model.modelUrl} value={model.modelUrl}>
                    {model.modelLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {primaryFields.map((field) => (
            <div
              key={`${selectedModelUrl}:${field.key}`}
              className={cn(
                field.type === "text" || field.type === "textarea"
                  ? "col-span-2"
                  : "",
              )}
            >
              <SceneRouterFieldEditor
                field={field}
                value={draftValues[field.key]}
                onChange={(value) => handleFieldChange(field.key, value)}
              />
            </div>
          ))}

          {secondaryFields.length > 0 ? (
            <div className="col-span-2 pt-1">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[rgba(214,235,253,0.14)] bg-white/[0.03] px-3.5 text-[0.72rem] font-medium text-[#a1a4a5] transition hover:border-[rgba(214,235,253,0.24)] hover:bg-white/[0.05] hover:text-[#f0f0f0]"
                onClick={() => setExpandedMoreFields((prev) => !prev)}
              >
                <span>
                  {expandedMoreFields
                    ? "收起额外参数"
                    : `展开另外 ${secondaryFields.length} 项参数`}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition",
                    expandedMoreFields ? "rotate-180" : "",
                  )}
                />
              </button>
            </div>
          ) : null}
        </div>

        {expandedMoreFields && secondaryFields.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[rgba(214,235,253,0.08)] pt-3 sm:grid-cols-2">
            {secondaryFields.map((field) => (
              <div
                key={`${selectedModelUrl}:more:${field.key}`}
                className={cn(
                  field.type === "textarea" ||
                    field.type === "text" ||
                    field.type === "slider"
                    ? "sm:col-span-2"
                    : "",
                )}
              >
                <SceneRouterFieldEditor
                  field={field}
                  value={draftValues[field.key]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {card.executionMode === "ask" ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-[14px] border border-[rgba(214,235,253,0.14)] bg-[linear-gradient(180deg,#14191f,#0f1318)] px-4 text-[0.76rem] font-medium text-[#f0f0f0] transition hover:border-[rgba(214,235,253,0.24)] hover:bg-[linear-gradient(180deg,#171d23,#11161c)]"
            onClick={() => setDismissed(true)}
            disabled={submittingAction !== null}
          >
            取消
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[14px] bg-white px-4 text-[0.78rem] font-semibold text-black transition hover:bg-[#f2f4f6] disabled:opacity-70"
            onClick={async () => {
              setSubmittingAction("generate");
              try {
                await runtime.onGenerateSceneRouterCard({
                  card,
                  workflowNodeId: currentWorkflowNodeId,
                  modelUrl: selectedModelUrl,
                  values: draftValues,
                });
              } finally {
                setSubmittingAction(null);
              }
            }}
            disabled={submittingAction !== null}
          >
            {submittingAction ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Send className="size-3.5" />
                确认
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExecutionReviewCardView({
  card,
}: {
  card: CanvasAgentExecutionReviewCard;
}) {
  const runtime = useCanvasAgentCardRuntime();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tone =
    card.executionMode === "ask"
      ? "border-[#b5ec37]/20 bg-[linear-gradient(180deg,rgba(181,236,55,0.08),rgba(19,24,16,0.78))]"
      : "border-[rgba(214,235,253,0.14)] bg-[linear-gradient(180deg,#14181d,#0f1217)]";

  return (
    <div
      className={cn(
        "rounded-[22px] border p-4 shadow-[0_18px_42px_rgba(0,0,0,0.24)]",
        tone,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.92rem] font-semibold tracking-[-0.03em] text-white">
            {card.executionMode === "ask"
              ? "已在画布上创建待确认工作流"
              : "已在画布上创建并编组工作流"}
          </div>
          {card.groupLabel ? (
            <div className="mt-1 text-[0.74rem] leading-5 text-white/46">
              {card.groupLabel}
            </div>
          ) : null}
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-white/62">
          {card.executionMode === "ask" ? "ASK" : "AUTO"}
        </span>
      </div>

      <div className="mt-3 text-[0.72rem] font-medium text-white/40">
        画布节点 ({card.nodeSummaries.length})
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {card.nodeSummaries.map((node) => (
          <div
            key={node.nodeId}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[rgba(28,45,36,0.86)] px-2.5 py-1.5 text-[0.72rem] text-[#9df6b9]"
          >
            <span className="size-1.5 rounded-full bg-white/48" />
            <span className="max-w-[11rem] truncate font-medium text-inherit">
              {node.label}
            </span>
            <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[0.64rem] text-white/54">
              {node.badge ||
                (node.kind === "text"
                  ? "文生文"
                  : node.kind === "input"
                    ? "参考图"
                    : "工作流")}
            </span>
          </div>
        ))}
      </div>

      {card.executionMode === "ask" ? (
        <button
          type="button"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-[#b5ec37] px-5 text-[0.88rem] font-semibold text-[#182106] transition hover:bg-[#c2f14a] disabled:opacity-70"
          onClick={async () => {
            if (!runtime.onConfirmExecutionReviewCard) return;
            setIsSubmitting(true);
            try {
              await runtime.onConfirmExecutionReviewCard({ card });
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wand2 className="size-4" />
          )}
          确认执行
        </button>
      ) : null}
    </div>
  );
}

function SceneRouterFieldEditor(props: {
  field: CanvasAgentSceneRouterField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { field, value, onChange } = props;

  const label = (
    <div className={CANVAS_AGENT_PARAM_LABEL_CLASS}>
      <span className={CANVAS_AGENT_PARAM_LABEL_TEXT_CLASS}>{field.label}</span>
      {field.description ? (
        <span className="line-clamp-1 text-[0.6rem] text-white/22">
          {field.description}
        </span>
      ) : null}
    </div>
  );

  if (field.type === "textarea" || field.type === "text") {
    return (
      <label
        className={cn(
          "block",
          field.type === "textarea" || field.type === "text"
            ? "w-full"
            : "w-[8.75rem] shrink-0",
        )}
      >
        {label}
        {field.type === "textarea" ? (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            rows={2}
            className="min-h-[3.5rem] w-full resize-none rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 py-2.5 text-[0.74rem] leading-5 text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[rgba(214,235,253,0.3)]"
            placeholder={field.placeholder}
          />
        ) : (
          <input
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 text-[0.74rem] text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[rgba(214,235,253,0.3)]"
            placeholder={field.placeholder}
          />
        )}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block w-[8.75rem] shrink-0">
        {label}
        <Select
          value={
            typeof value === "string" || typeof value === "number"
              ? String(value)
              : ""
          }
          onValueChange={(nextValue) => onChange(nextValue)}
        >
          <SelectTrigger className={CANVAS_AGENT_PARAM_TRIGGER_CLASS}>
            <SelectValue placeholder={field.placeholder || field.label} />
          </SelectTrigger>
          <SelectContent className={CANVAS_AGENT_PARAM_CONTENT_CLASS}>
            {(field.options || []).map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }

  if (field.type === "toggle") {
    return (
      <label className="flex w-[8.75rem] shrink-0 items-center justify-between gap-3 rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="min-w-0">
          <div className="text-[0.7rem] font-medium text-[#f0f0f0]">
            {field.label}
          </div>
          {field.description ? (
            <div className="mt-0.5 text-[0.6rem] leading-4 text-[#a1a4a5]">
              {field.description}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={cn(
            "relative h-6 w-11 rounded-full transition",
            value ? "bg-emerald-400" : "bg-white/14",
          )}
          onClick={() => onChange(!value)}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition",
              value ? "left-[1.35rem]" : "left-0.5",
            )}
          />
        </button>
      </label>
    );
  }

  if (field.type === "slider") {
    const numericValue =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Number(field.min || 0);
    return (
      <label className="block w-full">
        {label}
        <div className="rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={numericValue}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-white"
          />
          <div className="mt-2 text-right text-[0.66rem] text-[#a1a4a5]">
            {numericValue}
          </div>
        </div>
      </label>
    );
  }

  return (
    <label className="block w-[8.75rem] shrink-0">
      {label}
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step || 1}
        value={
          typeof value === "number" || typeof value === "string" ? value : ""
        }
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#12161b,#0c0f13)] px-3.5 text-[0.74rem] text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[rgba(214,235,253,0.3)]"
      />
    </label>
  );
}

function buildSingleCardSpec(type: string, props: Record<string, unknown>) {
  return {
    root: "root",
    elements: {
      root: {
        type,
        props,
        children: [],
      },
    },
  };
}

export function renderCanvasAgentSceneRouterCardSpec(
  card: CanvasAgentSceneRouterCard,
) {
  return buildSingleCardSpec("SceneRouterCard", { card });
}

export function renderCanvasAgentGenerationCardSpec(
  card: CanvasAgentGenerationCard,
) {
  return buildSingleCardSpec("GenerationStatusCard", card);
}

export function renderCanvasAgentSuggestionCardSpec(
  card: CanvasAgentSuggestionCard,
) {
  return buildSingleCardSpec("SuggestionCard", card);
}

export function renderCanvasAgentPromptGuideCardSpec(
  card: CanvasAgentPromptGuideCard,
) {
  return buildSingleCardSpec("PromptGuideCard", { card });
}

export function renderCanvasAgentExecutionReviewCardSpec(
  card: CanvasAgentExecutionReviewCard,
) {
  return buildSingleCardSpec("ExecutionReviewCard", { card });
}

export function CanvasAgentJsonCard(props: {
  spec: ReturnType<typeof buildSingleCardSpec>;
  runtime: CanvasAgentCardRuntime;
}) {
  const { spec, runtime } = props;

  return (
    <CanvasAgentCardRuntimeContext.Provider value={runtime}>
      <JSONUIProvider registry={registry}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
    </CanvasAgentCardRuntimeContext.Provider>
  );
}

export type {
  CanvasAgentCardRuntime,
  CanvasAgentExecutionReviewPresentation,
  CanvasAgentGenerationCard,
  CanvasAgentSceneRouterField,
  CanvasAgentSceneRouterPresentation,
  CanvasAgentSuggestionCard,
};
