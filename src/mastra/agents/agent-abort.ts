const DEFAULT_AGENT_TIMEOUT_MS = 25000;

export function createCanvasAgentAbortSignal(timeoutMs = DEFAULT_AGENT_TIMEOUT_MS) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  return undefined;
}

