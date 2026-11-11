import {
  registerApiRoute,
  type ContextWithMastra,
} from "@mastra/core/server";
import { mastraLogger } from "@/mastra/logger";
import { handleCanvasAgentMessage } from "@/shared/services/canvas-agent/canvas-agent-message-handler";
import { getCanvasAgentInternalToken } from "@/shared/services/canvas-agent/canvas-agent-service";

function getCanvasAgentServicePort() {
  const raw = Number(process.env.CANVAS_AGENT_SERVICE_PORT || "4112");
  return Number.isFinite(raw) && raw > 0 ? raw : 4112;
}

function getCanvasAgentServiceHost() {
  return process.env.CANVAS_AGENT_SERVICE_HOST?.trim() || "127.0.0.1";
}

function getCanvasAgentServiceProtocol(): "http" | "https" {
  return process.env.CANVAS_AGENT_SERVICE_PROTOCOL === "https"
    ? "https"
    : "http";
}

function getCanvasAgentStudioOrigin() {
  const protocol = process.env.MASTRA_STUDIO_PROTOCOL?.trim() || "http";
  const host = process.env.MASTRA_STUDIO_HOST?.trim() || "127.0.0.1";
  const port = process.env.MASTRA_STUDIO_PORT?.trim() || "4111";

  return `${protocol}://${host}:${port}`;
}

function getCanvasAgentAllowedStudioOrigins() {
  const configuredOrigin = getCanvasAgentStudioOrigin();
  const url = new URL(configuredOrigin);
  const { protocol, port } = url;

  return new Set([
    configuredOrigin,
    `${protocol}//127.0.0.1:${port}`,
    `${protocol}//localhost:${port}`,
    `${protocol}//[::1]:${port}`,
  ]);
}

async function validateInternalToken(c: ContextWithMastra) {
  const expectedToken = getCanvasAgentInternalToken();
  const receivedToken = c.req.header("x-canvas-agent-internal-token");

  if (
    !expectedToken ||
    typeof receivedToken !== "string" ||
    receivedToken !== expectedToken
  ) {
    return c.json({ message: "unauthorized" }, 401);
  }

  return null;
}

export const canvasAgentServiceRoutes = [
  registerApiRoute("/internal/health", {
    method: "GET",
    requiresAuth: false,
    handler: async (c) =>
      c.json({
        ok: true,
        service: "canvas-agent-service",
        host: getCanvasAgentServiceHost(),
        port: getCanvasAgentServicePort(),
      }),
  }),
  registerApiRoute("/internal/canvas-agent/message", {
    method: "POST",
    requiresAuth: false,
    handler: async (c) => {
      const unauthorizedResponse = await validateInternalToken(c);
      if (unauthorizedResponse) {
        return unauthorizedResponse;
      }

      const payload = (await c.req.json().catch(() => null)) as
        | {
            userId?: string;
            userEmail?: string | null;
            acceptLanguage?: string;
            requestBaseUrl?: string;
            requestCookieHeader?: string;
            body?: unknown;
          }
        | null;

      if (!payload?.userId) {
        return c.json({ message: "userId is required" }, 400);
      }

      try {
        return await handleCanvasAgentMessage({
          request: c.req.raw,
          requester: {
            id: payload.userId,
            email: payload.userEmail,
          },
          body: payload.body,
          acceptLanguage: payload.acceptLanguage,
          requestBaseUrl:
            payload.requestBaseUrl ||
            `${getCanvasAgentServiceProtocol()}://${getCanvasAgentServiceHost()}:${getCanvasAgentServicePort()}`,
          requestCookieHeader: payload.requestCookieHeader,
        });
      } catch (error) {
        mastraLogger.error("[canvas-agent-service] request failed", {
          error,
        });
        return c.json({ message: "internal server error" }, 500);
      }
    },
  }),
];

export function getCanvasAgentMastraServerConfig() {
  const protocol = getCanvasAgentServiceProtocol();
  const allowedStudioOrigins = getCanvasAgentAllowedStudioOrigins();

  return {
    port: getCanvasAgentServicePort(),
    host: getCanvasAgentServiceHost(),
    studioHost: getCanvasAgentServiceHost(),
    studioPort: getCanvasAgentServicePort(),
    studioProtocol: protocol,
    apiPrefix: "/api",
    build: {
      swaggerUI: true,
      openAPIDocs: true,
      apiReqLogs: true,
    },
    cors: {
      origin: (origin: string) =>
        origin && allowedStudioOrigins.has(origin)
          ? origin
          : getCanvasAgentStudioOrigin(),
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "x-mastra-client-type",
        "x-mastra-dev-playground",
      ],
      exposeHeaders: ["Content-Length", "X-Requested-With"],
    },
    apiRoutes: canvasAgentServiceRoutes,
  };
}
