import { isUserInNsfwWhitelist, parseNsfwWhitelistEmails } from "@/shared/lib/nsfw-policy";

const DEFAULT_CREEM_MODERATION_TIMEOUT = 10000;

export type CreemPromptModerationDecision = "allow" | "deny" | "flag" | string;

export type CreemPromptModerationResponse = {
  id?: string;
  object?: string;
  prompt?: string;
  decision?: CreemPromptModerationDecision;
  usage?: {
    units?: number;
  };
  external_id?: string;
};

export const parseEmailWhitelist = parseNsfwWhitelistEmails;
export { isUserInNsfwWhitelist };

export function extractPromptForModeration(
  body: Record<string, any> | null | undefined,
) {
  if (!body || typeof body !== "object") {
    return "";
  }

  const prompt =
    body.prompt ?? body.text ?? body.input ?? body.query ?? body.description;

  return typeof prompt === "string" ? prompt.trim() : "";
}

function getCreemModerationBaseUrl(environment?: string) {
  return environment === "production"
    ? "https://api.creem.io"
    : "https://test-api.creem.io";
}

export async function screenPromptWithCreem(options: {
  prompt: string;
  apiKey?: string;
  environment?: string;
  externalId?: string;
  timeoutMs?: number;
}) {
  const prompt = options.prompt.trim();
  if (!prompt) {
    return null;
  }

  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_CREEM_MODERATION_TIMEOUT,
  );

  try {
    const baseUrl = getCreemModerationBaseUrl(options.environment);
    const response = await fetch(`${baseUrl}/v1/moderation/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        external_id: options.externalId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "[prompt-moderation] creem request failed:",
        response.status,
        response.statusText,
        text,
      );
      return null;
    }

    return (await response.json()) as CreemPromptModerationResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}
