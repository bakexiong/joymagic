export type CanvasAgentTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
};

export function normalizeCanvasAgentTokenUsage(
  usage:
    | Partial<{
        inputTokens: number;
        outputTokens: number;
        reasoningTokens: number;
        totalTokens: number;
      }>
    | null
    | undefined,
): CanvasAgentTokenUsage {
  const inputTokens = Math.max(0, Number(usage?.inputTokens || 0));
  const outputTokens = Math.max(0, Number(usage?.outputTokens || 0));
  const reasoningTokens = Math.max(0, Number(usage?.reasoningTokens || 0));
  const explicitTotal = Math.max(0, Number(usage?.totalTokens || 0));

  return {
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens:
      explicitTotal > 0
        ? explicitTotal
        : inputTokens + outputTokens + reasoningTokens,
  };
}

export function addCanvasAgentTokenUsage(
  ...items: Array<CanvasAgentTokenUsage | null | undefined>
): CanvasAgentTokenUsage {
  return items.reduce<CanvasAgentTokenUsage>(
    (acc, item) => ({
      inputTokens: acc.inputTokens + (item?.inputTokens || 0),
      outputTokens: acc.outputTokens + (item?.outputTokens || 0),
      reasoningTokens: acc.reasoningTokens + (item?.reasoningTokens || 0),
      totalTokens: acc.totalTokens + (item?.totalTokens || 0),
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    },
  );
}
