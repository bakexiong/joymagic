type CanvasAgentDebugMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CanvasAgentDebugSummaryInput = {
  agentName: string;
  modelId: string;
  userPrompt: string;
  contextMessages?: CanvasAgentDebugMessage[];
  toolNames?: string[];
  structuredOutputKeys?: string[];
  extra?: Record<string, unknown>;
};

function truncateForLog(value: string, maxLength = 240) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

export function logCanvasAgentMessageSummary(
  input: CanvasAgentDebugSummaryInput,
) {
  const summary = {
    agentName: input.agentName,
    modelId: input.modelId,
    toolNames: input.toolNames || [],
    structuredOutputKeys: input.structuredOutputKeys || [],
    userPrompt: truncateForLog(input.userPrompt, 320),
    contextMessages: (input.contextMessages || []).map((message, index) => ({
      index,
      role: message.role,
      length: message.content.length,
      preview: truncateForLog(message.content),
    })),
    extra: input.extra || {},
  };

  console.info(
    `[canvas-agent][${input.agentName}] final messages summary`,
    JSON.stringify(summary, null, 2),
  );
}
