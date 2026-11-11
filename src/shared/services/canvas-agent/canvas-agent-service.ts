export type CanvasAgentInternalRequest = {
  userId: string;
  userEmail?: string | null;
  acceptLanguage?: string;
  requestBaseUrl?: string;
  requestCookieHeader?: string;
  body: unknown;
};

function trimEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

export function getCanvasAgentServiceUrl() {
  return trimEnv(process.env.CANVAS_AGENT_SERVICE_URL);
}

export function getCanvasAgentInternalToken() {
  return trimEnv(process.env.CANVAS_AGENT_INTERNAL_TOKEN);
}

export function shouldUseRemoteCanvasAgentService() {
  return Boolean(getCanvasAgentServiceUrl());
}

export async function forwardCanvasAgentMessageToService(
  input: CanvasAgentInternalRequest,
) {
  const serviceUrl = getCanvasAgentServiceUrl();
  if (!serviceUrl) {
    throw new Error("CANVAS_AGENT_SERVICE_URL is not set");
  }

  const internalToken = getCanvasAgentInternalToken();
  if (!internalToken) {
    throw new Error("CANVAS_AGENT_INTERNAL_TOKEN is not set");
  }

  const response = await fetch(
    `${serviceUrl.replace(/\/+$/, "")}/internal/canvas-agent/message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-canvas-agent-internal-token": internalToken,
      },
      body: JSON.stringify(input),
    },
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
