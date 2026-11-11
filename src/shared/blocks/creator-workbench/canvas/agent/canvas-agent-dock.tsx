"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Crosshair,
  Film,
  ImageIcon,
  Loader2,
  Megaphone,
  MessageSquarePlus,
  Paperclip,
  Palette,
  Send,
  Shield,
  ShoppingBag,
  Sofa,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Tv,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  CanvasAgentJsonCard,
  renderCanvasAgentExecutionReviewCardSpec,
  renderCanvasAgentPromptGuideCardSpec,
  renderCanvasAgentSuggestionCardSpec,
  renderCanvasAgentSceneRouterCardSpec,
  type CanvasAgentSceneRouterPresentation,
} from "./canvas-agent-json-cards";
import type {
  CanvasAgentExecutionReviewCard,
  CanvasAgentMessagePart,
  CanvasAgentPromptGuideCard,
  CanvasAgentSceneRouterCard,
} from "@/shared/lib/canvas-agent-message-cards";
import { extractCanvasAgentMessageCards } from "@/shared/lib/canvas-agent-message-cards";
import { cn } from "@/shared/lib/utils";

const CANVAS_AGENT_AVATAR_URL =
  "https://ocdn.10b.ai/icon/spirit-redesign-transparent.png?x-oss-process=image/resize,m_fill,w_256,h_256";
const CANVAS_AGENT_DOCK_EDGE_INSET = 48;

export type CanvasAgentMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt?: string;
  parts?: CanvasAgentMessagePart[];
  generation?: {
    status: "idle" | "submitted" | "completed" | "failed" | "partial" | string;
    taskId?: string;
    scenario?: string;
    errorMessage?: string;
    tasks?: Array<{
      taskId: string;
      workflowNodeId?: string;
      scenario?: string;
      status: "submitted" | "completed" | "failed";
      outputs?: string[];
      creationRecordIds?: string[];
      errorMessage?: string;
      updatedAt: string;
    }>;
  } | null;
};

export type CanvasAgentAttachment = {
  assetId: string;
  name: string;
  url?: string;
};

export type CanvasAgentSuggestion = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  composerLabel?: string;
  composerPrompt?: string;
  quickOptions?: Array<{
    id: string;
    label: string;
    prompt: string;
  }>;
  mode?: "auto" | "ask";
  icon?:
    | "image"
    | "video"
    | "spark"
    | "commerce"
    | "poster"
    | "brand"
    | "interior"
    | "social"
    | "story"
    | "ad"
    | "comic";
};

export type CanvasAgentThreadSummary = {
  id: string;
  title?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string | null;
};

export type CanvasAgentSkillId =
  | "auto"
  | "commerce-set"
  | "poster-design"
  | "brand-design"
  | "interior-design"
  | "social-media"
  | "story-short"
  | "marketing-video"
  | "smart-comic";

const SUGGESTION_SKILL_MAP: Record<string, CanvasAgentSkillId> = {
  "agent-image-commerce": "commerce-set",
  "agent-poster-design": "poster-design",
  "agent-brand-design": "brand-design",
  "agent-interior-design": "interior-design",
  "agent-social-media": "social-media",
  "agent-story-short": "story-short",
  "agent-video-marketing": "marketing-video",
  "agent-smart-comic": "smart-comic",
};

const DEFAULT_SUGGESTION_BY_SKILL: Record<CanvasAgentSkillId, string> = {
  auto: "agent-image-commerce",
  "commerce-set": "agent-image-commerce",
  "poster-design": "agent-poster-design",
  "brand-design": "agent-brand-design",
  "interior-design": "agent-interior-design",
  "social-media": "agent-social-media",
  "story-short": "agent-story-short",
  "marketing-video": "agent-video-marketing",
  "smart-comic": "agent-smart-comic",
};

const FALLBACK_SUGGESTION_QUICK_OPTIONS: Record<
  string,
  Array<{ id: string; label: string; prompt: string }>
> = {
  "agent-image-commerce": [
    {
      id: "commerce-amazon-listing",
      label: "Amazon Listing",
      prompt:
        "Create an Amazon listing image set for this product, including the main image, key feature slides, and size/detail frames:",
    },
    {
      id: "commerce-shopify-hero",
      label: "Shopify Hero",
      prompt:
        "Create a Shopify storefront hero banner and above-the-fold product visual set for this product:",
    },
    {
      id: "commerce-meta-ads",
      label: "Meta Ads",
      prompt:
        "Create a set of Meta ad creatives for Facebook and Instagram focused on conversion and clear product benefits for this product:",
    },
    {
      id: "commerce-pdp-features",
      label: "PDP Features",
      prompt:
        "Create a PDP feature visual pack for this product with benefit callouts, comparison moments, and usage scenarios:",
    },
  ],
  "agent-poster-design": [
    {
      id: "poster-sale-campaign",
      label: "Sale Campaign",
      prompt:
        "Design a promotional poster for an overseas ecommerce sale campaign with strong discount messaging, urgency, and conversion-focused hierarchy for this theme:",
    },
    {
      id: "poster-seasonal-launch",
      label: "Seasonal Launch",
      prompt:
        "Design a seasonal product launch poster with a fresh campaign feel and a strong branded visual direction for this theme:",
    },
    {
      id: "poster-social-announcement",
      label: "Social Promo",
      prompt:
        "Design a poster for Instagram and Facebook promotion with bold visual impact and strong social-first composition for this theme:",
    },
    {
      id: "poster-event-key-visual",
      label: "Event KV",
      prompt:
        "Design an event key visual poster with clear hierarchy, campaign polish, and strong brand presence for this theme:",
    },
  ],
  "agent-brand-design": [
    {
      id: "brand-logo-design",
      label: "Logo Design",
      prompt: "Design a logo system for my company. The company name is:",
    },
    {
      id: "brand-vi-system",
      label: "VI System",
      prompt:
        "Create a full visual identity system for my brand, including color, typography, and core brand rules. The brand name is:",
    },
    {
      id: "brand-campaign",
      label: "Brand Campaign",
      prompt:
        "Create a brand campaign visual direction with a clear hero look, communication mood, and rollout style. The brand name is:",
    },
    {
      id: "brand-assets",
      label: "Brand Assets",
      prompt:
        "Create a set of branded merchandise and supporting visual assets for my brand. The brand name is:",
    },
    {
      id: "brand-ip-design",
      label: "IP Design",
      prompt:
        "Design a signature brand IP character and visual world for my brand. The brand name is:",
    },
  ],
  "agent-interior-design": [
    {
      id: "interior-3d-render",
      label: "3D Render",
      prompt:
        "Create a set of interior 3D renders with strong atmosphere, lighting, and a cohesive design direction for this space:",
    },
    {
      id: "interior-floor-plan",
      label: "Color Plan",
      prompt:
        "Create a colored floor plan that clearly shows zoning, circulation, and key furniture layout for this space:",
    },
    {
      id: "interior-material-board",
      label: "Material Board",
      prompt:
        "Create an interior material board with finishes, colors, and style references for this space:",
    },
    {
      id: "interior-furniture-plan",
      label: "Furniture Plan",
      prompt:
        "Create an interior furniture plan with coordinated furniture choices, layout logic, and style consistency for this space:",
    },
    {
      id: "interior-detail-closeup",
      label: "Detail Views",
      prompt:
        "Create a set of interior detail views that highlight joinery, material transitions, and local design moments for this space:",
    },
  ],
  "agent-social-media": [
    {
      id: "social-carousel",
      label: "Carousel",
      prompt:
        "Create a social carousel set for Instagram and LinkedIn with strong visual continuity and clear storytelling for this product or theme:",
    },
    {
      id: "social-cross-platform",
      label: "Cross-Platform",
      prompt:
        "Create a cross-platform social asset set adapted for Instagram, Facebook, X, and LinkedIn for this product or theme:",
    },
    {
      id: "social-paid-creative",
      label: "Paid Creative",
      prompt:
        "Create a set of paid social creatives for Meta Ads and TikTok Ads with conversion-focused messaging and clear product benefits for this product or theme:",
    },
    {
      id: "social-video-cover",
      label: "Video Cover",
      prompt:
        "Create a set of video cover visuals for YouTube Shorts, TikTok, and Reels for this product or theme:",
    },
    {
      id: "social-static-post",
      label: "Static Posts",
      prompt:
        "Create a set of branded static social posts for overseas platforms with strong engagement and brand consistency for this product or theme:",
    },
  ],
  "agent-story-short": [
    {
      id: "story-narrative-short",
      label: "Narrative Short",
      prompt:
        "Create a narrative short for overseas short-video platforms with a strong hook, emotional arc, and satisfying twist around this theme:",
    },
    {
      id: "story-micro-drama",
      label: "Micro Drama",
      prompt:
        "Create a fast-paced micro drama for TikTok and Reels with high conflict, cliffhanger energy, and bingeable structure around this theme:",
    },
    {
      id: "story-cinematic-short",
      label: "Cinematic Short",
      prompt:
        "Create a cinematic short with strong visual language, mood, and emotional tension around this theme:",
    },
    {
      id: "story-vlog-short",
      label: "Vlog Short",
      prompt:
        "Create a story-led vlog short for YouTube Shorts and TikTok with lifestyle energy and natural pacing around this theme:",
    },
    {
      id: "story-creative-ad",
      label: "Creative Ad",
      prompt:
        "Create a story-driven creative ad short for overseas social platforms with clear brand appeal and strong audience retention around this theme:",
    },
  ],
  "agent-video-marketing": [
    {
      id: "marketing-video-feed-15s",
      label: "15s Feed Ad",
      prompt:
        "Create a 15-second feed ad for TikTok, Reels, and Meta placements with a strong first-3-second hook and clear conversion messaging for this product or theme:",
    },
    {
      id: "marketing-video-tvc-30s",
      label: "30s TVC",
      prompt:
        "Create a 30-second TVC-style marketing video with strong brand polish, clear product benefits, and a complete narrative arc for this product or theme:",
    },
    {
      id: "marketing-video-brand-story-60s",
      label: "60s Brand Story",
      prompt:
        "Create a 60-second brand story marketing video with emotional pacing, brand values, and memorable storytelling for this product or theme:",
    },
    {
      id: "marketing-video-amazon",
      label: "Amazon Ready",
      prompt:
        "Create a marketplace-ready product marketing video for Amazon and similar listings with clear feature demos and decision-driving information for this product or theme:",
    },
  ],
  "agent-smart-comic": [
    {
      id: "comic-narrative-short",
      label: "Narrative Short",
      prompt:
        "Create a comic-style narrative short with clear scene progression, pacing, and consistent characters around this theme:",
    },
    {
      id: "comic-series",
      label: "Series Comic",
      prompt:
        "Create a serialized comic concept for overseas platforms with recurring characters, episode continuity, and bingeable appeal around this theme:",
    },
    {
      id: "comic-character-sheet",
      label: "Character Sheet",
      prompt:
        "Create a character sheet set for a smart comic project with stable appearance, outfit logic, and personality clarity around this theme:",
    },
    {
      id: "comic-storyboard",
      label: "Storyboard",
      prompt:
        "Create a comic storyboard board with strong framing, readable action beats, and clear visual transitions around this theme:",
    },
    {
      id: "comic-character-showcase",
      label: "Character Showcase",
      prompt:
        "Create a character showcase set for a smart comic project that highlights hero appeal, design details, and world-building around this theme:",
    },
  ],
};

function getSuggestionIcon(
  icon: CanvasAgentSuggestion["icon"],
  featured = false,
) {
  const Icon =
    icon === "poster"
      ? BookOpen
      : icon === "brand"
        ? Shield
        : icon === "interior"
          ? Sofa
          : icon === "social"
            ? Palette
            : icon === "story"
              ? Film
              : icon === "ad"
                ? Tv
                : icon === "comic"
                  ? Sparkles
                  : icon === "video"
                    ? Tv
                    : icon === "image"
                      ? ImageIcon
                      : Megaphone;

  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-[12px] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        featured
          ? "bg-[#c2ff1a] text-[#10130d] shadow-[0_0_28px_rgba(194,255,26,0.2)]"
          : "text-white/68 group-hover:bg-white/[0.04] group-hover:text-white/88",
      )}
    >
      <Icon
        className="size-[1.15rem]"
        strokeWidth={icon === "commerce" ? 2.2 : undefined}
      />
      {featured ? (
        <span className="absolute -left-3 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-full bg-[#b8ff1a] shadow-[0_0_10px_rgba(184,255,26,0.8)]" />
      ) : null}
    </span>
  );
}

type CanvasAgentDockProps = {
  locale: string;
  open: boolean;
  mode: "auto" | "ask";
  selectedSkillId: CanvasAgentSkillId;
  messages: CanvasAgentMessage[];
  attachments: CanvasAgentAttachment[];
  suggestions: CanvasAgentSuggestion[];
  isSubmitting: boolean;
  currentThinking?: string | null;
  greetingName?: string | null;
  currentThreadId?: string | null;
  currentThreadTitle?: string | null;
  latestThreadId?: string | null;
  threads: CanvasAgentThreadSummary[];
  threadsLoading?: boolean;
  onToggle: () => void;
  onModeChange: (mode: "auto" | "ask") => void;
  onSkillChange: (skillId: CanvasAgentSkillId) => void;
  onSubmit: (prompt: string) => Promise<void> | void;
  onUploadFiles: (files: FileList) => Promise<void> | void;
  onSuggestionSelect: (suggestion: CanvasAgentSuggestion) => void;
  onCreateThread: () => Promise<void> | void;
  onSelectThread: (threadId: string) => Promise<void> | void;
  resolveSceneRouterCard: (
    card: CanvasAgentSceneRouterCard,
  ) => CanvasAgentSceneRouterPresentation | null;
  onApplySceneRouterCard: (input: {
    card: CanvasAgentSceneRouterCard;
    workflowNodeId: string;
    modelUrl: string;
    values: Record<string, any>;
  }) => Promise<void> | void;
  onGenerateSceneRouterCard: (input: {
    card: CanvasAgentSceneRouterCard;
    workflowNodeId: string;
    modelUrl: string;
    values: Record<string, any>;
  }) => Promise<void> | void;
  onConfirmExecutionReviewCard: (input: {
    card: CanvasAgentExecutionReviewCard;
  }) => Promise<void> | void;
  onLocateMessageNode?: (nodeId: string) => void;
};

type MessageFeedbackState = "up" | "down" | null;

function getGenerationStatusLabel(
  status: CanvasAgentMessage["generation"] extends infer T
    ? T extends { status: infer S }
      ? S
      : string
    : string,
  isZh: boolean,
) {
  switch (status) {
    case "submitted":
      return isZh ? "已提交生成" : "Generation submitted";
    case "completed":
      return isZh ? "任务已完成，请查收！" : "Task completed. Please check it.";
    case "failed":
      return isZh ? "生成失败" : "Generation failed";
    case "partial":
      return isZh ? "部分完成" : "Partially completed";
    default:
      return "";
  }
}

function formatCanvasAgentMessageTime(
  value: string | undefined,
  locale: string,
) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale || "zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCanvasAgentThreadTime(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale || "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function CanvasAgentDock({
  locale,
  open,
  mode,
  selectedSkillId,
  messages,
  attachments,
  suggestions,
  isSubmitting,
  currentThinking,
  greetingName,
  currentThreadId,
  currentThreadTitle,
  latestThreadId,
  threads,
  threadsLoading = false,
  onToggle,
  onModeChange,
  onSkillChange,
  onSubmit,
  onUploadFiles,
  onSuggestionSelect,
  onCreateThread,
  onSelectThread,
  resolveSceneRouterCard,
  onApplySceneRouterCard,
  onGenerateSceneRouterCard,
  onConfirmExecutionReviewCard,
  onLocateMessageNode,
}: CanvasAgentDockProps) {
  const isZh = locale.toLowerCase().startsWith("zh");
  const [draft, setDraft] = useState("");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);
  const [selectedQuickOptionId, setSelectedQuickOptionId] = useState<
    string | null
  >(null);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [displayedThinking, setDisplayedThinking] = useState("");
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [thinkingCanExpand, setThinkingCanExpand] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [emptyStateReady, setEmptyStateReady] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, MessageFeedbackState>
  >({});
  const [dockButtonPosition, setDockButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const thinkingPreviewRef = useRef<HTMLDivElement | null>(null);
  const thinkingAnimationTimerRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const dragMovedRef = useRef(false);
  const dockButtonSizeRef = useRef({ width: 88, height: 108 });
  const copy = useMemo(
    () => ({
      title: isZh ? "10b 智能体" : "10b Agent",
      greetingPrefix: isZh ? "Hi Creator!" : "Hi Creator!",
      greeting: isZh ? "今天一起创作点什么?" : "What are we creating today?",
      skillsLabel: isZh ? "选择技能" : "Choose a skill",
      placeholder: isZh
        ? "先上传参考图，再用 @ 引用，输入你的想法。"
        : "Upload a reference, mention it with @, and tell me what to create.",
      auto: "AUTO",
      ask: isZh ? "Ask" : "Ask",
      open: isZh ? "打开智能体" : "Open agent",
      collapse: isZh ? "收起智能体" : "Collapse agent",
      thinking: isZh
        ? "智能体正在整理场景与参数..."
        : "Agent is organizing the scene and parameters...",
      thinkingTitle: isZh ? "正在思考中..." : "Thinking...",
      returnToLatest: isZh ? "回到当前" : "Back to current",
      newSession: isZh ? "新建会话" : "New chat",
      historySessions: isZh ? "历史会话" : "History",
      emptyThreads: isZh ? "还没有历史会话" : "No history yet",
      loadingThreads: isZh ? "加载中..." : "Loading...",
      untitledThread: isZh ? "新会话" : "New chat",
    }),
    [isZh],
  );

  const handleSuggestionComposerSelect = useCallback(
    (suggestion: CanvasAgentSuggestion, quickOptionId?: string | null) => {
      const quickOptions = suggestion.quickOptions?.length
        ? suggestion.quickOptions
        : (FALLBACK_SUGGESTION_QUICK_OPTIONS[suggestion.id] ?? []);
      setSelectedSuggestionId(suggestion.id);
      const nextQuickOptionId = quickOptionId ?? quickOptions[0]?.id;
      setSelectedQuickOptionId(nextQuickOptionId ?? null);

      const quickOption = quickOptions.find(
        (item) => item.id === nextQuickOptionId,
      );
      const nextDraft =
        quickOption?.prompt ?? suggestion.composerPrompt ?? suggestion.prompt;

      setDraft(nextDraft);
      onSkillChange(SUGGESTION_SKILL_MAP[suggestion.id] ?? "auto");

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          nextDraft.length,
          nextDraft.length,
        );
      });
    },
    [onSkillChange],
  );

  const cardRuntime = useMemo(
    () => ({
      resolveSceneRouterCard,
      onApplySceneRouterCard,
      onGenerateSceneRouterCard,
      onConfirmExecutionReviewCard,
      onPromptGuideOptionSelect: ({ prompt }: { prompt: string }) => {
        setDraft(prompt);
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      },
      onPromptGuideCustomIdea: ({
        card,
      }: {
        card: CanvasAgentPromptGuideCard;
      }) => {
        setDraft(`${card.title}：`);
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      },
      onSuggestionSelect: (suggestionId: string) => {
        const suggestion = suggestions.find((item) => item.id === suggestionId);
        if (suggestion) {
          handleSuggestionComposerSelect(suggestion);
        }
      },
    }),
    [
      handleSuggestionComposerSelect,
      onApplySceneRouterCard,
      onGenerateSceneRouterCard,
      onConfirmExecutionReviewCard,
      resolveSceneRouterCard,
      suggestions,
    ],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (!isSubmitting) {
      setThinkingSeconds(0);
      setDisplayedThinking("");
      setThinkingExpanded(false);
      return;
    }

    setThinkingSeconds(1);
    const timer = window.setInterval(() => {
      setThinkingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (thinkingAnimationTimerRef.current !== null) {
      window.clearTimeout(thinkingAnimationTimerRef.current);
      thinkingAnimationTimerRef.current = null;
    }

    if (!isSubmitting) {
      setDisplayedThinking("");
      return;
    }

    const nextThinking = currentThinking?.trim() || "";
    if (!nextThinking) {
      setDisplayedThinking("");
      return;
    }

    setDisplayedThinking((prev) => {
      if (!prev) return "";
      return nextThinking.startsWith(prev) ? prev : "";
    });

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      setDisplayedThinking((prev) => {
        if (!nextThinking.startsWith(prev)) {
          return nextThinking.slice(0, 1);
        }

        if (prev.length >= nextThinking.length) {
          return prev;
        }

        const nextLength = Math.min(
          nextThinking.length,
          prev.length + (nextThinking.length - prev.length > 24 ? 3 : 1),
        );
        return nextThinking.slice(0, nextLength);
      });

      thinkingAnimationTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;

        if (displayedThinkingRef.current.length < nextThinking.length) {
          tick();
        }
      }, 22);
    };

    tick();

    return () => {
      cancelled = true;
      if (thinkingAnimationTimerRef.current !== null) {
        window.clearTimeout(thinkingAnimationTimerRef.current);
        thinkingAnimationTimerRef.current = null;
      }
    };
  }, [currentThinking, isSubmitting]);

  const displayedThinkingRef = useRef(displayedThinking);

  useEffect(() => {
    displayedThinkingRef.current = displayedThinking;
  }, [displayedThinking]);

  useEffect(() => {
    setModeMenuOpen(false);
  }, [mode]);

  useEffect(() => {
    setThreadMenuOpen(false);
  }, [currentThreadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clampPosition = (position: { x: number; y: number }) => {
      const maxX = Math.max(
        CANVAS_AGENT_DOCK_EDGE_INSET,
        window.innerWidth -
          dockButtonSizeRef.current.width -
          CANVAS_AGENT_DOCK_EDGE_INSET,
      );
      const maxY = Math.max(
        CANVAS_AGENT_DOCK_EDGE_INSET,
        window.innerHeight -
          dockButtonSizeRef.current.height -
          CANVAS_AGENT_DOCK_EDGE_INSET,
      );
      return {
        x: Math.min(Math.max(CANVAS_AGENT_DOCK_EDGE_INSET, position.x), maxX),
        y: Math.min(Math.max(CANVAS_AGENT_DOCK_EDGE_INSET, position.y), maxY),
      };
    };

    setDockButtonPosition((prev) =>
      prev
        ? clampPosition(prev)
        : clampPosition({
            x:
              window.innerWidth -
              dockButtonSizeRef.current.width -
              CANVAS_AGENT_DOCK_EDGE_INSET,
            y:
              window.innerHeight -
              dockButtonSizeRef.current.height -
              CANVAS_AGENT_DOCK_EDGE_INSET,
          }),
    );

    const handleResize = () => {
      setDockButtonPosition((prev) => (prev ? clampPosition(prev) : prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (dragPointerIdRef.current === null || typeof window === "undefined")
      return;

    const clampPosition = (position: { x: number; y: number }) => {
      const maxX = Math.max(
        CANVAS_AGENT_DOCK_EDGE_INSET,
        window.innerWidth -
          dockButtonSizeRef.current.width -
          CANVAS_AGENT_DOCK_EDGE_INSET,
      );
      const maxY = Math.max(
        CANVAS_AGENT_DOCK_EDGE_INSET,
        window.innerHeight -
          dockButtonSizeRef.current.height -
          CANVAS_AGENT_DOCK_EDGE_INSET,
      );
      return {
        x: Math.min(Math.max(CANVAS_AGENT_DOCK_EDGE_INSET, position.x), maxX),
        y: Math.min(Math.max(CANVAS_AGENT_DOCK_EDGE_INSET, position.y), maxY),
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        event.pointerId !== dragPointerIdRef.current ||
        !dragStartRef.current
      ) {
        return;
      }

      const deltaX = event.clientX - dragStartRef.current.pointerX;
      const deltaY = event.clientY - dragStartRef.current.pointerY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragMovedRef.current = true;
      }

      setDockButtonPosition(
        clampPosition({
          x: dragStartRef.current.startX + deltaX,
          y: dragStartRef.current.startY + deltaY,
        }),
      );
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== dragPointerIdRef.current) return;

      dragPointerIdRef.current = null;
      dragStartRef.current = null;

      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [dockButtonPosition]);

  const handleDockButtonPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!dockButtonPosition) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragPointerIdRef.current = event.pointerId;
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: dockButtonPosition.x,
      startY: dockButtonPosition.y,
    };
    dragMovedRef.current = false;
  };

  useEffect(() => {
    if (!isSubmitting) {
      setThinkingCanExpand(false);
      return;
    }

    if (thinkingExpanded) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const element = thinkingPreviewRef.current;
      if (!element) return;
      setThinkingCanExpand(element.scrollHeight - element.clientHeight > 2);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [currentThinking, displayedThinking, isSubmitting, thinkingExpanded]);

  useEffect(() => {
    if (!open || messages.length > 0) {
      setEmptyStateReady(false);
      return;
    }

    setEmptyStateReady(false);
    const timer = window.setTimeout(() => {
      setEmptyStateReady(true);
    }, 36);

    return () => {
      window.clearTimeout(timer);
    };
  }, [messages.length, open]);

  const handleSubmit = async () => {
    const value = draft.trim();
    if (!value || isSubmitting) return;
    setDraft("");
    setSelectedSuggestionId(null);
    setSelectedQuickOptionId(null);
    await onSubmit(value);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      return;
    }
  };

  const getMessagePrimaryNodeId = (message: CanvasAgentMessage) => {
    const cards = extractCanvasAgentMessageCards(message.parts);
    for (const card of cards) {
      if (card.kind === "execution-review" && card.nodeSummaries.length > 0) {
        return card.nodeSummaries[0]?.nodeId ?? null;
      }
      if (
        (card.kind === "scene-router" || card.kind === "execution-review") &&
        card.workflowNodeIds.length > 0
      ) {
        return card.workflowNodeIds[0] ?? null;
      }
    }

    const taskNodeId = message.generation?.tasks?.find(
      (task) =>
        typeof task.workflowNodeId === "string" &&
        task.workflowNodeId.trim().length > 0,
    )?.workflowNodeId;

    return taskNodeId ?? null;
  };

  const handleLocateMessageNode = (message: CanvasAgentMessage) => {
    const nodeId = getMessagePrimaryNodeId(message);
    if (!nodeId || !onLocateMessageNode) {
      toast.error(
        isZh ? "没有找到对应的画布节点" : "No related canvas node found",
      );
      return;
    }

    onLocateMessageNode(nodeId);
    toast.success(isZh ? "已定位到画布节点" : "Canvas node located");
  };

  const handleMessageFeedback = (
    messageId: string,
    nextValue: Exclude<MessageFeedbackState, null>,
  ) => {
    setMessageFeedback((prev) => {
      const currentValue = prev[messageId] ?? null;
      const resolvedValue = currentValue === nextValue ? null : nextValue;
      return {
        ...prev,
        [messageId]: resolvedValue,
      };
    });

    toast.success(
      nextValue === "up"
        ? isZh
          ? "感谢你的反馈"
          : "Thanks for the feedback"
        : isZh
          ? "已记录改进反馈"
          : "Improvement feedback noted",
    );
  };

  const currentThreadSessionLabel = currentThreadId
    ? `sess-${currentThreadId.slice(0, 6)}...${currentThreadId.slice(-6)}`
    : "";
  const displayThreadTitle = currentThreadTitle?.trim() || copy.untitledThread;
  const canReturnToLatest =
    Boolean(latestThreadId) &&
    Boolean(currentThreadId) &&
    latestThreadId !== currentThreadId;
  const trimmedCurrentThinking = currentThinking?.trim() || "";
  const thinkingPreview = displayedThinking || "";
  const thinkingFullText = trimmedCurrentThinking || thinkingPreview;
  const greetingLabel = greetingName?.trim()
    ? `Hi ${greetingName.trim()}!`
    : copy.greetingPrefix;
  const selectedSuggestion =
    suggestions.find((item) => item.id === selectedSuggestionId) ?? null;
  const featuredSuggestionId =
    selectedSuggestionId ?? DEFAULT_SUGGESTION_BY_SKILL[selectedSkillId];
  const selectedSuggestionQuickOptions = selectedSuggestion?.quickOptions
    ?.length
    ? selectedSuggestion.quickOptions
    : selectedSuggestion
      ? (FALLBACK_SUGGESTION_QUICK_OPTIONS[selectedSuggestion.id] ?? [])
      : [];
  const selectedQuickOption =
    selectedSuggestionQuickOptions.find(
      (item) => item.id === selectedQuickOptionId,
    ) ?? null;
  const isBrandSuggestionSelected =
    selectedSuggestion?.id === "agent-brand-design";
  const isInteriorSuggestionSelected =
    selectedSuggestion?.id === "agent-interior-design";
  const isSocialSuggestionSelected =
    selectedSuggestion?.id === "agent-social-media";
  const isStorySuggestionSelected =
    selectedSuggestion?.id === "agent-story-short";
  const isMarketingVideoSuggestionSelected =
    selectedSuggestion?.id === "agent-video-marketing";
  const isSmartComicSuggestionSelected =
    selectedSuggestion?.id === "agent-smart-comic";
  const isPanelSuggestionSelected =
    isBrandSuggestionSelected ||
    isInteriorSuggestionSelected ||
    isSocialSuggestionSelected ||
    isStorySuggestionSelected ||
    isMarketingVideoSuggestionSelected ||
    isSmartComicSuggestionSelected;

  if (!open) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40">
        <div className="pointer-events-auto">
          <style jsx>{`
            @keyframes canvas-agent-sprite-float {
              0%,
              100% {
                transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
              }
              50% {
                transform: translate3d(0, -5px, 0) rotate(-1.5deg) scale(1.012);
              }
            }

            @keyframes canvas-agent-sprite-core {
              0%,
              100% {
                transform: scale(1) rotate(-2deg);
                box-shadow:
                  0 0 0 0 rgba(17, 255, 153, 0.16),
                  0 0 24px rgba(17, 255, 153, 0.16);
              }
              50% {
                transform: scale(1.08) rotate(2deg);
                box-shadow:
                  0 0 0 11px rgba(17, 255, 153, 0),
                  0 0 40px rgba(17, 255, 153, 0.24);
              }
            }

            @keyframes canvas-agent-sprite-orbit {
              0% {
                transform: rotate(0deg) translateX(21px) rotate(0deg);
                opacity: 0.2;
              }
              30% {
                opacity: 0.8;
              }
              70% {
                opacity: 0.45;
              }
              100% {
                transform: rotate(360deg) translateX(21px) rotate(-360deg);
                opacity: 0.2;
              }
            }

            @keyframes canvas-agent-sprite-blink {
              0%,
              40%,
              76%,
              100% {
                transform: scaleY(1);
              }
              42%,
              44% {
                transform: scaleY(0.18);
              }
              78% {
                transform: scaleY(0.45);
              }
            }

            @keyframes canvas-agent-sprite-bobble {
              0%,
              100% {
                transform: translate3d(0, 0, 0) rotate(0deg);
              }
              25% {
                transform: translate3d(-1px, 0, 0) rotate(-3deg);
              }
              75% {
                transform: translate3d(1px, 0, 0) rotate(3deg);
              }
            }

            .canvas-agent-sprite-shell {
              animation: canvas-agent-sprite-float 4.6s
                cubic-bezier(0.22, 1, 0.36, 1) infinite;
            }

            .canvas-agent-sprite-core {
              animation: canvas-agent-sprite-core 3.2s
                cubic-bezier(0.22, 1, 0.36, 1) infinite;
            }

            .canvas-agent-sprite-orbit {
              animation: canvas-agent-sprite-orbit 5.8s linear infinite;
              transform-origin: center;
            }

            .canvas-agent-sprite-eye {
              animation: canvas-agent-sprite-blink 5.4s
                cubic-bezier(0.22, 1, 0.36, 1) infinite;
              transform-origin: center;
            }

            .canvas-agent-sprite-bobble {
              animation: canvas-agent-sprite-bobble 3.6s
                cubic-bezier(0.22, 1, 0.36, 1) infinite;
              transform-origin: center;
            }

            @media (prefers-reduced-motion: reduce) {
              .canvas-agent-sprite-shell,
              .canvas-agent-sprite-core,
              .canvas-agent-sprite-orbit,
              .canvas-agent-sprite-eye,
              .canvas-agent-sprite-bobble {
                animation: none !important;
              }
            }
          `}</style>
          <button
            type="button"
            aria-label={copy.open}
            className="canvas-agent-sprite-shell absolute flex h-[6.75rem] w-[5.5rem] touch-none flex-col items-center justify-start overflow-visible rounded-full border-0 bg-transparent px-0 pt-2 text-[#F0F0F0] shadow-none transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] active:cursor-grabbing"
            style={
              dockButtonPosition
                ? {
                    left: `${dockButtonPosition.x}px`,
                    top: `${dockButtonPosition.y}px`,
                  }
                : undefined
            }
            onPointerDown={handleDockButtonPointerDown}
            onClick={(event) => {
              if (dragMovedRef.current) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              onToggle();
            }}
          >
            <span className="pointer-events-none absolute left-1/2 top-[0.3rem] h-[5.35rem] w-[5.35rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,255,153,0.26),rgba(17,255,153,0.08)_58%,transparent_82%)] blur-md" />
            <span className="canvas-agent-sprite-bobble relative mt-0.5 flex size-[5.35rem] items-center justify-center">
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,255,153,0.2),rgba(17,255,153,0.06)_60%,transparent_78%)] blur-sm" />
              <img
                src={CANVAS_AGENT_AVATAR_URL}
                alt={copy.title}
                className="relative size-[4.95rem] object-contain drop-shadow-[0_10px_24px_rgba(17,255,153,0.24)] select-none"
                draggable={false}
              />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-40 flex justify-end pr-3 pt-3">
      <div className="pointer-events-auto relative flex h-[calc(100%-0.75rem)] w-[min(29rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[26px] border border-[rgba(214,235,253,0.19)] bg-[#07090c] text-white shadow-[-20px_0_78px_rgba(0,0,0,0.4)] [&_button:not(:disabled)]:cursor-pointer">
        <style jsx>{`
          @keyframes canvas-agent-avatar-drift {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale(1);
              box-shadow: 0 0 18px rgba(166, 255, 166, 0.2);
            }
            50% {
              transform: translate3d(0, -3px, 0) scale(1.018);
              box-shadow: 0 0 24px rgba(166, 255, 166, 0.3);
            }
          }

          @keyframes canvas-agent-chat-avatar-float {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale(1);
              filter: drop-shadow(0 6px 12px rgba(17, 255, 153, 0.12));
            }
            50% {
              transform: translate3d(0, -2px, 0) scale(1.035);
              filter: drop-shadow(0 10px 18px rgba(17, 255, 153, 0.2));
            }
          }

          @keyframes canvas-agent-empty-reveal {
            0% {
              opacity: 0;
              transform: translate3d(0, 10px, 0);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes canvas-agent-thinking-pulse {
            0%,
            100% {
              opacity: 0.72;
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(181, 236, 55, 0.18);
            }
            50% {
              opacity: 1;
              transform: scale(1.08);
              box-shadow: 0 0 0 6px rgba(181, 236, 55, 0);
            }
          }

          @keyframes canvas-agent-thinking-title {
            0%,
            100% {
              opacity: 0.82;
              text-shadow: 0 0 0 rgba(181, 236, 55, 0);
            }
            50% {
              opacity: 1;
              text-shadow: 0 0 12px rgba(181, 236, 55, 0.18);
            }
          }

          .canvas-agent-avatar-drift {
            animation: canvas-agent-avatar-drift 6.4s
              cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }

          .canvas-agent-chat-avatar {
            animation: canvas-agent-chat-avatar-float 4.8s
              cubic-bezier(0.22, 1, 0.36, 1) infinite;
            transform-origin: center;
          }

          .canvas-agent-empty-item-ready {
            animation: canvas-agent-empty-reveal 560ms
              cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .canvas-agent-thinking-dot {
            animation: canvas-agent-thinking-pulse 1.6s
              cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }

          .canvas-agent-thinking-title {
            animation: canvas-agent-thinking-title 1.8s
              cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .canvas-agent-avatar-drift {
              animation: none !important;
            }

            .canvas-agent-chat-avatar {
              animation: none !important;
            }

            .canvas-agent-empty-item-ready {
              animation: none !important;
            }

            .canvas-agent-thinking-dot,
            .canvas-agent-thinking-title {
              animation: none !important;
            }
          }
        `}</style>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(141,255,162,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(214,235,253,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />

        <div className="relative z-20 flex items-start gap-2.5 border-b border-[rgba(214,235,253,0.14)] px-4 py-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center">
            <img
              src={CANVAS_AGENT_AVATAR_URL}
              alt={copy.title}
              className="size-10 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[1.24rem] font-semibold tracking-[-0.05em] text-white">
              {copy.title}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.72rem] text-white/42">
              <span className="truncate">{displayThreadTitle}</span>
              {currentThreadSessionLabel ? (
                <span className="shrink-0 text-white/22">·</span>
              ) : null}
              <span className="truncate">{currentThreadSessionLabel}</span>
              <Copy className="size-3 shrink-0" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-0.5 text-white/58">
            {canReturnToLatest ? (
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#8bcf16]/60 bg-[#151d0d] px-3 text-[0.74rem] font-semibold text-[#b5ec37] transition hover:border-[#9be326] hover:text-[#d2fb76]"
                onClick={() => latestThreadId && onSelectThread(latestThreadId)}
              >
                <ChevronRight className="size-3.5 rotate-180" />
                <span>{copy.returnToLatest}</span>
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(214,235,253,0.12)] bg-white/[0.02] transition hover:border-[rgba(214,235,253,0.22)] hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  setThreadMenuOpen((prev) => !prev);
                }}
              >
                <Clock3 className="size-4" />
              </button>

              {threadMenuOpen ? (
                <div
                  className="pointer-events-auto absolute right-[-0.25rem] top-[calc(100%+0.55rem)] z-40 w-[14.75rem] rounded-[20px] border border-[rgba(214,235,253,0.16)] bg-[linear-gradient(180deg,#0e1217,#090c10)] p-2 shadow-[0_24px_72px_rgba(0,0,0,0.42)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[0.74rem] font-medium text-white/44">
                    {copy.historySessions}
                  </div>
                  <div className="mt-1 max-h-[18rem] space-y-1 overflow-y-auto pr-1">
                    {threadsLoading ? (
                      <div className="px-2 py-3 text-[0.76rem] text-white/40">
                        {copy.loadingThreads}
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="px-2 py-3 text-[0.76rem] text-white/40">
                        {copy.emptyThreads}
                      </div>
                    ) : (
                      threads.map((thread) => {
                        const isCurrent = thread.id === currentThreadId;
                        const threadTime = formatCanvasAgentThreadTime(
                          thread.lastMessageAt || thread.createdAt || undefined,
                          locale,
                        );
                        return (
                          <button
                            key={thread.id}
                            type="button"
                            className={cn(
                              "flex w-full items-start justify-between gap-3 rounded-[14px] px-3 py-2 text-left transition",
                              isCurrent
                                ? "bg-white/[0.07] text-white"
                                : "text-white/72 hover:bg-white/[0.04] hover:text-white",
                            )}
                            onClick={() => {
                              setThreadMenuOpen(false);
                              void onSelectThread(thread.id);
                            }}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-[0.78rem] font-medium">
                                {thread.title?.trim() || copy.untitledThread}
                              </div>
                              <div className="mt-0.5 truncate text-[0.68rem] text-white/34">
                                sess-{thread.id.slice(0, 4)}...
                                {thread.id.slice(-4)}
                              </div>
                            </div>
                            <div className="shrink-0 pt-0.5 text-[0.66rem] text-white/28">
                              {threadTime}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border border-[rgba(214,235,253,0.12)] bg-white/[0.02] transition hover:border-[rgba(214,235,253,0.22)] hover:text-white"
              onClick={() => {
                setThreadMenuOpen(false);
                void onCreateThread();
              }}
            >
              <MessageSquarePlus className="size-4" />
            </button>
            <button
              type="button"
              aria-label={copy.collapse}
              className="flex size-8 items-center justify-center rounded-full border border-[rgba(214,235,253,0.12)] bg-white/[0.02] text-white/64 transition hover:border-[rgba(214,235,253,0.22)] hover:text-white"
              onClick={onToggle}
            >
              <ChevronRight className="size-4.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto max-w-[24.75rem]">
            {messages.length === 0 ? (
              <div className="pt-0">
                <div
                  className={cn(
                    "flex items-start gap-3 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    emptyStateReady
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0",
                  )}
                >
                  <div className="canvas-agent-avatar-drift flex size-11 shrink-0 items-center justify-center">
                    <img
                      src={CANVAS_AGENT_AVATAR_URL}
                      alt={copy.title}
                      className="size-11 object-contain"
                    />
                  </div>
                  <div
                    className={cn(
                      "min-w-0 pt-0 transition-all duration-700 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      emptyStateReady
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0",
                    )}
                  >
                    <div className="text-[0.76rem] font-semibold tracking-[-0.03em] text-white/50">
                      {greetingLabel}
                    </div>
                    <div className="mt-0.5 text-[1.18rem] font-semibold leading-[1.04] tracking-[-0.055em] text-white">
                      {copy.greeting}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-5 transition-all duration-700 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    emptyStateReady
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0",
                  )}
                >
                  <div className="text-[0.72rem] font-semibold tracking-[-0.03em] text-white/34">
                    {copy.skillsLabel}
                  </div>
                  <div className="mt-2 space-y-0">
                    {suggestions.map((suggestion, index) => {
                      const isFeatured = featuredSuggestionId === suggestion.id;

                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          className={cn(
                            "group flex w-full items-center text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.995] motion-reduce:transform-none motion-reduce:transition-none",
                            isFeatured
                              ? "gap-3 rounded-[18px] border border-[#4e6b1f] bg-[linear-gradient(180deg,rgba(31,33,36,0.98),rgba(25,27,29,0.98))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(184,255,26,0.04)] hover:border-[#688d2a] hover:shadow-[0_0_0_1px_rgba(184,255,26,0.06),0_12px_24px_rgba(0,0,0,0.2)]"
                              : "gap-2.5 rounded-[14px] border border-transparent px-2 py-2 hover:border-[rgba(214,235,253,0.08)] hover:bg-white/[0.025]",
                            emptyStateReady && "canvas-agent-empty-item-ready",
                            emptyStateReady
                              ? "opacity-100"
                              : "translate-y-2 opacity-0",
                          )}
                          style={{
                            animationDelay: emptyStateReady
                              ? `${220 + index * 42}ms`
                              : undefined,
                          }}
                          onClick={() =>
                            handleSuggestionComposerSelect(suggestion)
                          }
                        >
                          {getSuggestionIcon(suggestion.icon, isFeatured)}
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block font-semibold tracking-[-0.045em] transition-colors duration-300",
                                isFeatured
                                  ? "text-[0.88rem] text-white"
                                  : "text-[0.8rem] text-white/92 group-hover:text-white",
                              )}
                            >
                              {suggestion.title}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 block transition-colors duration-300",
                                isFeatured
                                  ? "text-[0.64rem] text-white/56"
                                  : "truncate text-[0.64rem] text-white/34 group-hover:text-white/46",
                              )}
                            >
                              {suggestion.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {messages.map((message) => {
                  const sceneRouterCards =
                    message.role === "assistant"
                      ? extractCanvasAgentMessageCards(message.parts)
                      : [];
                  const messageTime = formatCanvasAgentMessageTime(
                    message.createdAt,
                    locale,
                  );

                  return (
                    <div key={message.id} className="space-y-2">
                      {message.role === "assistant" ? (
                        <div className="mr-auto flex max-w-[96%] items-start gap-3">
                          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center">
                            <img
                              src={CANVAS_AGENT_AVATAR_URL}
                              alt={copy.title}
                              className="canvas-agent-chat-avatar size-9 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <div className="text-[0.92rem] leading-8 tracking-[-0.025em] text-white/88">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-auto w-fit max-w-[min(24rem,72%)]">
                          <div className="inline-flex rounded-[18px] border border-white/[0.06] bg-[linear-gradient(180deg,#1d2025,#17191e)] px-4 py-3 text-[0.84rem] font-medium leading-6 text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]">
                            {message.content}
                          </div>
                          {messageTime ? (
                            <div className="mt-1.5 pr-1 text-right text-[0.72rem] text-white/24">
                              {messageTime}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {message.role === "assistant" &&
                      sceneRouterCards.length > 0 ? (
                        <div className="ml-12 space-y-2">
                          {sceneRouterCards.map((card) =>
                            card.kind === "scene-router" &&
                            card.executionMode === "ask" ? (
                              <CanvasAgentJsonCard
                                key={card.cardId}
                                runtime={cardRuntime}
                                spec={renderCanvasAgentSceneRouterCardSpec(
                                  card,
                                )}
                              />
                            ) : card.kind === "prompt-guide" ? (
                              <CanvasAgentJsonCard
                                key={card.cardId}
                                runtime={cardRuntime}
                                spec={renderCanvasAgentPromptGuideCardSpec(
                                  card,
                                )}
                              />
                            ) : null,
                          )}
                        </div>
                      ) : null}

                      {message.role === "assistant" &&
                      message.generation &&
                      (getGenerationStatusLabel(
                        message.generation.status,
                        isZh,
                      ) ||
                        (message.generation.status !== "completed" &&
                          message.generation.errorMessage)) ? (
                        <div className="ml-12 max-w-[92%]">
                          <div
                            className={cn(
                              "min-w-0 pt-1 text-[0.92rem] leading-8 tracking-[-0.025em]",
                              message.generation.status === "completed"
                                ? "text-emerald-200"
                                : message.generation.status === "failed"
                                  ? "text-rose-200"
                                  : "text-white/54",
                            )}
                          >
                            {getGenerationStatusLabel(
                              message.generation.status,
                              isZh,
                            )}
                            {message.generation.status !== "completed" &&
                            message.generation.errorMessage ? (
                              <span className="ml-1 text-white/40">
                                {message.generation.errorMessage}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {message.role === "assistant" ? (
                        <div className="ml-12 flex items-center gap-2 text-white/28">
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/52"
                            onClick={() =>
                              void handleCopyMessage(message.content)
                            }
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/52"
                            onClick={() => handleLocateMessageNode(message)}
                            aria-label={
                              isZh ? "定位到画布节点" : "Locate canvas node"
                            }
                          >
                            <Crosshair className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/52",
                              messageFeedback[message.id] === "up" &&
                                "bg-white/[0.06] text-white/70",
                            )}
                            onClick={() =>
                              handleMessageFeedback(message.id, "up")
                            }
                            aria-label={isZh ? "点赞" : "Thumbs up"}
                          >
                            <ThumbsUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/52",
                              messageFeedback[message.id] === "down" &&
                                "bg-white/[0.06] text-white/70",
                            )}
                            onClick={() =>
                              handleMessageFeedback(message.id, "down")
                            }
                            aria-label={isZh ? "点踩" : "Thumbs down"}
                          >
                            <ThumbsDown className="size-3.5" />
                          </button>
                          {messageTime ? (
                            <span className="ml-2 text-[0.72rem] text-white/24">
                              {messageTime}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {isSubmitting ? (
                  <div className="mr-auto flex max-w-[96%] items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center">
                      <img
                        src={CANVAS_AGENT_AVATAR_URL}
                        alt={copy.title}
                        className="canvas-agent-chat-avatar size-9 object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div
                        className={cn(
                          "flex w-full items-start gap-3 text-left",
                          thinkingCanExpand && "cursor-pointer",
                        )}
                        role={thinkingCanExpand ? "button" : undefined}
                        tabIndex={thinkingCanExpand ? 0 : undefined}
                        onClick={() => {
                          if (!thinkingCanExpand) return;
                          setThinkingExpanded((prev) => !prev);
                        }}
                        onKeyDown={(event) => {
                          if (!thinkingCanExpand) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setThinkingExpanded((prev) => !prev);
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="canvas-agent-thinking-dot mt-[0.08rem] size-2 shrink-0 rounded-full bg-[#b5ec37]" />
                            <span className="canvas-agent-thinking-title text-[1rem] font-semibold tracking-[-0.04em] text-[#b5ec37]">
                              {copy.thinkingTitle}
                            </span>
                            <span className="text-[0.82rem] font-medium text-white/36">
                              {thinkingSeconds}s
                            </span>
                          </div>
                          {thinkingFullText ? (
                            <div
                              ref={thinkingPreviewRef}
                              className={cn(
                                "mt-1.5 text-[0.76rem] leading-7 text-white/40 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                !thinkingExpanded && "line-clamp-2",
                              )}
                            >
                              {thinkingExpanded
                                ? thinkingFullText
                                : thinkingPreview}
                            </div>
                          ) : null}
                        </div>
                        {thinkingCanExpand ? (
                          <ChevronDown
                            className={cn(
                              "mt-1 size-4 shrink-0 text-white/34 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                              thinkingExpanded && "rotate-180",
                            )}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="relative px-4 pb-4 pt-3">
          <div className="rounded-[24px] border border-[rgba(214,235,253,0.14)] bg-[linear-gradient(180deg,#1d1d1f,#18181b)] p-2.5 shadow-[0_18px_38px_rgba(0,0,0,0.3)]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = event.target.files;
                if (files && files.length > 0) {
                  void onUploadFiles(files);
                }
                event.target.value = "";
              }}
            />

            {selectedSuggestion ? (
              <div
                className={cn(
                  "mb-2 border bg-white/[0.02]",
                  isPanelSuggestionSelected
                    ? "rounded-[16px] border-white/[0.08] px-2.5 py-2.5"
                    : "rounded-[12px] border-white/[0.06] px-2 py-1.25",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    isPanelSuggestionSelected
                      ? "items-start gap-2"
                      : "items-center gap-1.5",
                  )}
                >
                  {isPanelSuggestionSelected ? (
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            isBrandSuggestionSelected
                              ? "bg-[#ffab1f]"
                              : isInteriorSuggestionSelected
                                ? "bg-[#29d391]"
                                : isSocialSuggestionSelected
                                  ? "bg-[#ff4d73]"
                                  : isStorySuggestionSelected
                                    ? "bg-[#ffab1f]"
                                    : isMarketingVideoSuggestionSelected
                                      ? "bg-[#ff4d73]"
                                      : "bg-[#ff4d73]",
                          )}
                        />
                        <span className="text-[0.72rem] font-semibold tracking-[-0.03em] text-white/92">
                          {selectedSuggestion.title}
                        </span>
                        <span className="text-[0.72rem] text-white/34">
                          {selectedSuggestion.composerLabel ??
                            (isZh ? "选个方向" : "Pick a direction")}
                        </span>
                      </div>
                      {selectedSuggestionQuickOptions.length ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {selectedSuggestionQuickOptions.map((option) => {
                            const isActive =
                              option.id === selectedQuickOption?.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                className={cn(
                                  "shrink-0 rounded-[10px] px-2.5 py-1.5 text-[0.72rem] font-semibold leading-5 transition",
                                  isActive
                                    ? "border border-[#1fbfff] bg-[rgba(16,106,148,0.2)] text-white shadow-[inset_0_0_0_1px_rgba(90,214,255,0.14)]"
                                    : "border border-transparent bg-white/[0.04] text-white/62 hover:bg-white/[0.07] hover:text-white/86",
                                )}
                                onClick={() =>
                                  handleSuggestionComposerSelect(
                                    selectedSuggestion,
                                    option.id,
                                  )
                                }
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : selectedSuggestionQuickOptions.length ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                      {selectedSuggestionQuickOptions.map((option) => {
                        const isActive = option.id === selectedQuickOption?.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-medium leading-5 transition",
                              isActive
                                ? "border border-[#1fbfff] bg-[rgba(16,106,148,0.2)] text-white shadow-[inset_0_0_0_1px_rgba(90,214,255,0.14)]"
                                : "border border-transparent bg-white/[0.04] text-white/58 hover:bg-white/[0.07] hover:text-white/84",
                            )}
                            onClick={() =>
                              handleSuggestionComposerSelect(
                                selectedSuggestion,
                                option.id,
                              )
                            }
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <button
                    type="button"
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full text-white/34 transition hover:bg-white/[0.05] hover:text-white/62",
                      isPanelSuggestionSelected ? "mt-0.5 size-5.5" : "size-5",
                    )}
                    onClick={() => {
                      setSelectedSuggestionId(null);
                      setSelectedQuickOptionId(null);
                    }}
                    aria-label={isZh ? "清除技能选择" : "Clear skill selection"}
                  >
                    <X
                      className={
                        isPanelSuggestionSelected ? "size-3.25" : "size-3"
                      }
                    />
                  </button>
                </div>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              rows={2}
              className="min-h-[3rem] w-full resize-none bg-transparent text-[0.78rem] leading-6 text-white outline-none placeholder:text-white/28"
              placeholder={
                isZh ? "描述想法，或框选节点添加上下文…" : copy.placeholder
              }
            />

            {attachments.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.assetId}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[rgba(214,235,253,0.1)] bg-white/[0.05] px-2.5 py-1 text-[0.68rem] text-white/72"
                  >
                    <ImageIcon className="size-3 shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="relative mt-2.5 flex items-center gap-3 border-t border-white/[0.06] pt-2.5 text-white/54">
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.04] hover:text-white/74"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4.5" />
              </button>

              <div className="h-7 w-px bg-white/[0.1]" />

              <div className="relative">
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-2 rounded-full px-1 text-[0.76rem] font-medium text-white/82 transition hover:text-white"
                  onClick={() => setModeMenuOpen((prev) => !prev)}
                >
                  {mode === "ask" ? (
                    <MessageSquarePlus className="size-3.5" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span>{mode === "ask" ? copy.ask : copy.auto}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-white/42 transition",
                      modeMenuOpen ? "rotate-180" : "",
                    )}
                  />
                </button>

                {modeMenuOpen ? (
                  <div className="absolute bottom-[calc(100%+0.65rem)] left-0 z-20 min-w-[8.5rem] rounded-[18px] border border-[rgba(214,235,253,0.12)] bg-[#17191d] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-left text-[0.74rem] transition",
                        mode === "ask"
                          ? "bg-white/[0.08] text-white"
                          : "text-white/62 hover:bg-white/[0.04] hover:text-white",
                      )}
                      onClick={() => {
                        onModeChange("ask");
                        setModeMenuOpen(false);
                      }}
                    >
                      <MessageSquarePlus className="size-3.5" />
                      <span className="flex-1">{copy.ask}</span>
                      {mode === "ask" ? <Check className="size-3.5" /> : null}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "mt-1 flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-left text-[0.74rem] transition",
                        mode === "auto"
                          ? "bg-white/[0.08] text-white"
                          : "text-white/62 hover:bg-white/[0.04] hover:text-white",
                      )}
                      onClick={() => {
                        onModeChange("auto");
                        setModeMenuOpen(false);
                      }}
                    >
                      <Sparkles className="size-3.5" />
                      <span className="flex-1">{copy.auto}</span>
                      {mode === "auto" ? <Check className="size-3.5" /> : null}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="h-7 w-px bg-white/[0.1]" />
                <button
                  type="button"
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full transition",
                    isSubmitting
                      ? "bg-white/[0.16] text-white"
                      : draft.trim()
                        ? "bg-white/[0.14] text-white hover:bg-white/[0.18]"
                        : "bg-white/[0.08] text-white/24",
                  )}
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !draft.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
