import type { CanvasWorkflowSubtype } from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";
import type { CanvasAgentExecutionMode } from "@/shared/services/canvas-agent/canvas-agent-plan";

export type CanvasAgentSceneRouterCard = {
  kind: "scene-router";
  cardId: string;
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  preferredModelUrl?: string;
  prompt: string;
  workflowNodeIds: string[];
};

export type CanvasAgentExecutionReviewCard = {
  kind: "execution-review";
  cardId: string;
  executionMode: CanvasAgentExecutionMode;
  groupLabel?: string;
  workflowNodeIds: string[];
  nodeSummaries: Array<{
    nodeId: string;
    label: string;
    kind: "text" | "input" | "workflow";
    badge?: string;
  }>;
};

export type CanvasAgentPromptGuideCard = {
  kind: "prompt-guide";
  cardId: string;
  title: string;
  description?: string;
  options: Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
  }>;
  customPromptLabel?: string;
};

export type CanvasAgentMessageCard =
  | CanvasAgentSceneRouterCard
  | CanvasAgentExecutionReviewCard
  | CanvasAgentPromptGuideCard;

export type CanvasAgentTextPart = {
  type: "text";
  text: string;
};

export type CanvasAgentSceneRouterCardPart = {
  type: "canvas-agent-scene-router-card";
  card: CanvasAgentSceneRouterCard;
};

export type CanvasAgentExecutionReviewCardPart = {
  type: "canvas-agent-execution-review-card";
  card: CanvasAgentExecutionReviewCard;
};

export type CanvasAgentPromptGuideCardPart = {
  type: "canvas-agent-prompt-guide-card";
  card: CanvasAgentPromptGuideCard;
};

export type CanvasAgentMessagePart =
  | CanvasAgentTextPart
  | CanvasAgentSceneRouterCardPart
  | CanvasAgentExecutionReviewCardPart
  | CanvasAgentPromptGuideCardPart;

export function buildCanvasAgentSceneRouterCardPart(input: {
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  preferredModelUrl?: string;
  prompt: string;
  workflowNodeIds: string[];
}): CanvasAgentSceneRouterCardPart | null {
  if (input.workflowNodeIds.length === 0) return null;

  return {
    type: "canvas-agent-scene-router-card",
    card: {
      kind: "scene-router",
      cardId: `scene-router:${input.workflowNodeIds.join(",")}`,
      executionMode: input.executionMode,
      mediaIntent: input.mediaIntent,
      subtype: input.subtype,
      preferredModelUrl: input.preferredModelUrl,
      prompt: input.prompt,
      workflowNodeIds: input.workflowNodeIds,
    },
  };
}

export function buildCanvasAgentAssistantParts(input: {
  content: string;
  executionMode: CanvasAgentExecutionMode;
  mediaIntent: "image" | "video";
  subtype: CanvasWorkflowSubtype;
  preferredModelUrl?: string;
  prompt: string;
  workflowNodeIds: string[];
  groupLabel?: string;
  nodeSummaries?: CanvasAgentExecutionReviewCard["nodeSummaries"];
  promptGuideCard?: CanvasAgentPromptGuideCard | null;
}): CanvasAgentMessagePart[] {
  const parts: CanvasAgentMessagePart[] = [
    {
      type: "text",
      text: input.content,
    },
  ];

  const sceneRouterCard = buildCanvasAgentSceneRouterCardPart({
    executionMode: input.executionMode,
    mediaIntent: input.mediaIntent,
    subtype: input.subtype,
    preferredModelUrl: input.preferredModelUrl,
    prompt: input.prompt,
    workflowNodeIds: input.workflowNodeIds,
  });

  if (sceneRouterCard) {
    parts.push(sceneRouterCard);
  }

  if (input.promptGuideCard) {
    parts.push({
      type: "canvas-agent-prompt-guide-card",
      card: input.promptGuideCard,
    });
  }

  return parts;
}

export function extractCanvasAgentMessageCards(
  parts: unknown,
): CanvasAgentMessageCard[] {
  if (!Array.isArray(parts)) return [];

  return parts.flatMap<CanvasAgentMessageCard>((part) => {
    if (!part || typeof part !== "object") return [];

    const candidate = part as Record<string, unknown>;
    if (
      candidate.type !== "canvas-agent-scene-router-card" &&
      candidate.type !== "canvas-agent-execution-review-card" &&
      candidate.type !== "canvas-agent-prompt-guide-card"
    ) {
      return [];
    }
    if (!candidate.card || typeof candidate.card !== "object") return [];

    const card = candidate.card as Record<string, unknown>;
    if (candidate.type === "canvas-agent-prompt-guide-card") {
      if (
        card.kind !== "prompt-guide" ||
        typeof card.cardId !== "string" ||
        typeof card.title !== "string"
      ) {
        return [];
      }

      const options = Array.isArray(card.options)
        ? card.options.flatMap<CanvasAgentPromptGuideCard["options"][number]>(
            (item) => {
              if (!item || typeof item !== "object") return [];
              const option = item as Record<string, unknown>;
              if (
                typeof option.id !== "string" ||
                typeof option.title !== "string" ||
                typeof option.description !== "string" ||
                typeof option.prompt !== "string"
              ) {
                return [];
              }

              return [
                {
                  id: option.id,
                  title: option.title,
                  description: option.description,
                  prompt: option.prompt,
                },
              ];
            },
          )
        : [];

      if (options.length === 0) return [];

      return [
        {
          kind: "prompt-guide",
          cardId: card.cardId,
          title: card.title,
          description:
            typeof card.description === "string" ? card.description : undefined,
          options,
          customPromptLabel:
            typeof card.customPromptLabel === "string"
              ? card.customPromptLabel
              : undefined,
        } satisfies CanvasAgentPromptGuideCard,
      ];
    }

    if (candidate.type === "canvas-agent-execution-review-card") {
      if (card.kind !== "execution-review") return [];
      if (
        typeof card.cardId !== "string" ||
        (card.executionMode !== "ask" && card.executionMode !== "auto")
      ) {
        return [];
      }

      const workflowNodeIds = Array.isArray(card.workflowNodeIds)
        ? card.workflowNodeIds.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : [];

      const nodeSummaries: CanvasAgentExecutionReviewCard["nodeSummaries"] =
        Array.isArray(card.nodeSummaries)
          ? card.nodeSummaries.flatMap<
              CanvasAgentExecutionReviewCard["nodeSummaries"][number]
            >((item) => {
              if (!item || typeof item !== "object") return [];
              const summary = item as Record<string, unknown>;
              if (
                typeof summary.nodeId !== "string" ||
                typeof summary.label !== "string" ||
                (summary.kind !== "text" &&
                  summary.kind !== "input" &&
                  summary.kind !== "workflow")
              ) {
                return [];
              }

              return [
                {
                  nodeId: summary.nodeId,
                  label: summary.label,
                  kind: summary.kind,
                  badge:
                    typeof summary.badge === "string"
                      ? summary.badge
                      : undefined,
                },
              ];
            })
          : [];

      return [
        {
          kind: "execution-review",
          cardId: card.cardId,
          executionMode: card.executionMode,
          groupLabel:
            typeof card.groupLabel === "string" ? card.groupLabel : undefined,
          workflowNodeIds,
          nodeSummaries,
        } satisfies CanvasAgentExecutionReviewCard,
      ];
    }

    if (card.kind !== "scene-router") return [];
    if (
      typeof card.cardId !== "string" ||
      typeof card.prompt !== "string" ||
      (card.executionMode !== "ask" && card.executionMode !== "auto")
    ) {
      return [];
    }
    if (card.mediaIntent !== "image" && card.mediaIntent !== "video") {
      return [];
    }
    if (
      card.subtype !== "text-to-image" &&
      card.subtype !== "image-to-image" &&
      card.subtype !== "text-to-video" &&
      card.subtype !== "image-to-video"
    ) {
      return [];
    }

    const workflowNodeIds = Array.isArray(card.workflowNodeIds)
      ? card.workflowNodeIds.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];

    if (workflowNodeIds.length === 0) return [];

    return [
      {
        kind: "scene-router",
        cardId: card.cardId,
        executionMode: card.executionMode,
        mediaIntent: card.mediaIntent,
        subtype: card.subtype,
        preferredModelUrl:
          typeof card.preferredModelUrl === "string"
            ? card.preferredModelUrl
            : undefined,
        prompt: card.prompt,
        workflowNodeIds,
      } satisfies CanvasAgentSceneRouterCard,
    ];
  });
}
