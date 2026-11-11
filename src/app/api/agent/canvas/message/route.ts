import { getSignUser } from "@/shared/models/user";
import { respErr } from "@/shared/lib/resp";
import { handleCanvasAgentMessage } from "@/shared/services/canvas-agent/canvas-agent-message-handler";
import {
  forwardCanvasAgentMessageToService,
  shouldUseRemoteCanvasAgentService,
} from "@/shared/services/canvas-agent/canvas-agent-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }
    const body = await req.json().catch(() => ({}));
    if (shouldUseRemoteCanvasAgentService()) {
      return await forwardCanvasAgentMessageToService({
        userId: user.id,
        userEmail: user.email,
        acceptLanguage: req.headers.get("accept-language") || undefined,
        requestBaseUrl: new URL(req.url).origin,
        requestCookieHeader: req.headers.get("cookie") || undefined,
        body,
      });
    }

    return handleCanvasAgentMessage({
      request: req,
      requester: {
        id: user.id,
        email: user.email,
      },
      body,
    });
  } catch (error) {
    console.error("[canvas-agent] request route failed:", error);
    return respErr("failed to send canvas agent message");
  }
}
