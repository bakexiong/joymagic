import {
  CreditStatus,
  CreditTransactionScene,
  CreditTransactionType,
  consumeCredits,
  createCredit,
  getRemainingCredits,
} from "@/shared/models/credit";
import { getSnowId, getUuid } from "@/shared/lib/hash";
import { getAllConfigs } from "@/shared/models/config";
import { getPricingConfigAsync } from "@/config/pricing-config";
import type { CanvasAgentTokenUsage } from "@/mastra/agents/agent-usage";

export const CANVAS_AGENT_CHAT_SCENE = "canvas-agent-chat";
export const DEFAULT_CANVAS_AGENT_CHAT_INPUT_PRICE_PER_MILLION = 0.4;
export const DEFAULT_CANVAS_AGENT_CHAT_OUTPUT_PRICE_PER_MILLION = 1.6;
export const DEFAULT_CANVAS_AGENT_CHAT_REASONING_PRICE_PER_MILLION = 0;
export const DEFAULT_CANVAS_AGENT_CHAT_MIN_CREDITS = 1;

export type CanvasAgentBillingRateCard = {
  inputPricePerMillionUsd: number;
  outputPricePerMillionUsd: number;
  reasoningPricePerMillionUsd: number;
  minCredits: number;
};

export type CanvasAgentChatBillingResult = {
  chatCredits: number;
  charged: boolean;
  refunded: boolean;
  remainingCredits: number;
  tokenUsage: CanvasAgentTokenUsage;
  estimatedCostUsd: number;
  creditUnitPriceUsd: number;
  appliedProfitMargin: number;
  minimumCredits: number;
  pricingStrategy: "token-usage" | "minimum-charge";
};

export type CanvasAgentChatPricingStrategy =
  CanvasAgentChatBillingResult["pricingStrategy"];

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getCanvasAgentBillingRateCard(): Promise<CanvasAgentBillingRateCard> {
  const configs = await getAllConfigs();

  return {
    inputPricePerMillionUsd: parsePositiveNumber(
      configs.canvas_agent_chat_input_price_per_million_usd,
      DEFAULT_CANVAS_AGENT_CHAT_INPUT_PRICE_PER_MILLION,
    ),
    outputPricePerMillionUsd: parsePositiveNumber(
      configs.canvas_agent_chat_output_price_per_million_usd,
      DEFAULT_CANVAS_AGENT_CHAT_OUTPUT_PRICE_PER_MILLION,
    ),
    reasoningPricePerMillionUsd: parsePositiveNumber(
      configs.canvas_agent_chat_reasoning_price_per_million_usd,
      DEFAULT_CANVAS_AGENT_CHAT_REASONING_PRICE_PER_MILLION,
    ),
    minCredits: parsePositiveInteger(
      configs.canvas_agent_chat_min_credits,
      DEFAULT_CANVAS_AGENT_CHAT_MIN_CREDITS,
    ),
  };
}

export async function estimateCanvasAgentChatBilling(input: {
  tokenUsage?: Partial<CanvasAgentTokenUsage> | null;
}): Promise<{
  chatCredits: number;
  tokenUsage: CanvasAgentTokenUsage;
  estimatedCostUsd: number;
  creditUnitPriceUsd: number;
  appliedProfitMargin: number;
  minimumCredits: number;
  pricingStrategy: CanvasAgentChatPricingStrategy;
  rateCard: CanvasAgentBillingRateCard;
}> {
  const pricingConfig = await getPricingConfigAsync();
  const rateCard = await getCanvasAgentBillingRateCard();

  const tokenUsage: CanvasAgentTokenUsage = {
    inputTokens: Math.max(0, Number(input.tokenUsage?.inputTokens || 0)),
    outputTokens: Math.max(0, Number(input.tokenUsage?.outputTokens || 0)),
    reasoningTokens: Math.max(
      0,
      Number(input.tokenUsage?.reasoningTokens || 0),
    ),
    totalTokens: Math.max(0, Number(input.tokenUsage?.totalTokens || 0)),
  };

  const estimatedCostUsd =
    (tokenUsage.inputTokens * rateCard.inputPricePerMillionUsd) / 1_000_000 +
    (tokenUsage.outputTokens * rateCard.outputPricePerMillionUsd) / 1_000_000 +
    (tokenUsage.reasoningTokens * rateCard.reasoningPricePerMillionUsd) /
      1_000_000;

  const creditUnitPriceUsd = pricingConfig.creditUnitPrice;
  const appliedProfitMargin = pricingConfig.defaultProfitMargin;
  const sellingPriceUsd =
    estimatedCostUsd > 0 ? estimatedCostUsd / (1 - appliedProfitMargin) : 0;

  const tokenBasedCredits =
    sellingPriceUsd > 0 ? Math.ceil(sellingPriceUsd / creditUnitPriceUsd) : 0;
  const minimumCredits = Math.max(1, rateCard.minCredits);
  const chatCredits = Math.max(tokenBasedCredits, minimumCredits);

  return {
    chatCredits,
    tokenUsage,
    estimatedCostUsd,
    creditUnitPriceUsd,
    appliedProfitMargin,
    minimumCredits,
    pricingStrategy:
      tokenBasedCredits > minimumCredits
        ? ("token-usage" as const)
        : ("minimum-charge" as const),
    rateCard,
  };
}

export async function consumeCanvasAgentChatCredits(input: {
  userId: string;
  userEmail?: string | null;
  projectId: string;
  threadId: string;
  messageId?: string | null;
  skillId?: string | null;
  selectedNodeIds?: string[];
  tokenUsage?: Partial<CanvasAgentTokenUsage> | null;
}) {
  const estimated = await estimateCanvasAgentChatBilling({
    tokenUsage: input.tokenUsage,
  });
  const remainingCredits = await getRemainingCredits(input.userId);

  if (remainingCredits < estimated.chatCredits) {
    const error = new Error("积分不足，无法继续使用智能体聊天。");
    (error as Error & { code?: string }).code = "INSUFFICIENT_CREDITS";
    throw error;
  }

  await consumeCredits({
    userId: input.userId,
    credits: estimated.chatCredits,
    scene: CANVAS_AGENT_CHAT_SCENE,
    description: `Canvas Agent chat for project ${input.projectId}`,
    metadata: JSON.stringify({
      billingType: "agent-chat",
      projectId: input.projectId,
      threadId: input.threadId,
      messageId: input.messageId || null,
      skillId: input.skillId || null,
      selectedNodeIds: input.selectedNodeIds || [],
      tokenUsage: estimated.tokenUsage,
      estimatedCostUsd: estimated.estimatedCostUsd,
      creditUnitPriceUsd: estimated.creditUnitPriceUsd,
      appliedProfitMargin: estimated.appliedProfitMargin,
      inputPricePerMillionUsd: estimated.rateCard.inputPricePerMillionUsd,
      outputPricePerMillionUsd: estimated.rateCard.outputPricePerMillionUsd,
      reasoningPricePerMillionUsd:
        estimated.rateCard.reasoningPricePerMillionUsd,
      minimumCredits: estimated.minimumCredits,
      pricingStrategy: estimated.pricingStrategy,
    }),
  });

  return {
    chatCredits: estimated.chatCredits,
    charged: true,
    refunded: false,
    remainingCredits: await getRemainingCredits(input.userId),
    tokenUsage: estimated.tokenUsage,
    estimatedCostUsd: estimated.estimatedCostUsd,
    creditUnitPriceUsd: estimated.creditUnitPriceUsd,
    appliedProfitMargin: estimated.appliedProfitMargin,
    minimumCredits: estimated.minimumCredits,
    pricingStrategy: estimated.pricingStrategy,
  } satisfies CanvasAgentChatBillingResult;
}

export async function refundCanvasAgentChatCredits(input: {
  userId: string;
  userEmail?: string | null;
  projectId: string;
  threadId: string;
  messageId?: string | null;
  skillId?: string | null;
  chatCredits: number;
  tokenUsage?: Partial<CanvasAgentTokenUsage> | null;
  estimatedCostUsd?: number;
  creditUnitPriceUsd?: number;
  appliedProfitMargin?: number;
  minimumCredits?: number;
  pricingStrategy?: CanvasAgentChatPricingStrategy;
  reason?: string | null;
}) {
  if (input.chatCredits <= 0) {
    return {
      chatCredits: 0,
      charged: false,
      refunded: false,
      remainingCredits: await getRemainingCredits(input.userId),
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
      },
      estimatedCostUsd: 0,
      creditUnitPriceUsd: 0,
      appliedProfitMargin: 0,
      minimumCredits: 0,
      pricingStrategy: "minimum-charge" as const,
    } satisfies CanvasAgentChatBillingResult;
  }

  await createCredit({
    id: getUuid(),
    userId: input.userId,
    userEmail: input.userEmail || "",
    orderNo: "",
    subscriptionNo: "",
    transactionNo: getSnowId(),
    transactionType: CreditTransactionType.GRANT,
    transactionScene: CreditTransactionScene.REWARD,
    credits: input.chatCredits,
    remainingCredits: input.chatCredits,
    description:
      input.reason ||
      `Refund canvas agent chat credits for project ${input.projectId}`,
    expiresAt: null,
    status: CreditStatus.ACTIVE,
    metadata: JSON.stringify({
      billingType: "agent-chat-refund",
      projectId: input.projectId,
      threadId: input.threadId,
      messageId: input.messageId || null,
      skillId: input.skillId || null,
      tokenUsage: input.tokenUsage || null,
      estimatedCostUsd: input.estimatedCostUsd ?? null,
      creditUnitPriceUsd: input.creditUnitPriceUsd ?? null,
      appliedProfitMargin: input.appliedProfitMargin ?? null,
      minimumCredits: input.minimumCredits ?? null,
      pricingStrategy: input.pricingStrategy ?? null,
    }),
  });

  return {
    chatCredits: input.chatCredits,
    charged: true,
    refunded: true,
    remainingCredits: await getRemainingCredits(input.userId),
    tokenUsage: {
      inputTokens: Math.max(0, Number(input.tokenUsage?.inputTokens || 0)),
      outputTokens: Math.max(0, Number(input.tokenUsage?.outputTokens || 0)),
      reasoningTokens: Math.max(
        0,
        Number(input.tokenUsage?.reasoningTokens || 0),
      ),
      totalTokens: Math.max(0, Number(input.tokenUsage?.totalTokens || 0)),
    },
    estimatedCostUsd: input.estimatedCostUsd ?? 0,
    creditUnitPriceUsd: input.creditUnitPriceUsd ?? 0,
    appliedProfitMargin: input.appliedProfitMargin ?? 0,
    minimumCredits: input.minimumCredits ?? 0,
    pricingStrategy: (input.pricingStrategy ?? "minimum-charge") as
      | "token-usage"
      | "minimum-charge",
  } satisfies CanvasAgentChatBillingResult;
}
