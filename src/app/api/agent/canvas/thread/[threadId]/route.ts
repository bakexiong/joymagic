import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import { getCanvasChatThreadMessages } from "@/shared/models/workbench-canvas-chat";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { threadId } = await params;
    if (!threadId) {
      return respErr("threadId is required");
    }

    const result = await getCanvasChatThreadMessages(threadId, user.id);
    if (!result) {
      return respErr("canvas chat thread not found");
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (projectId && result.thread.projectId !== projectId) {
      return respErr("thread does not belong to the specified project");
    }

    return respData({
      thread: {
        id: result.thread.id,
        projectId: result.thread.projectId,
        sessionId: result.thread.sessionId,
        resourceId: result.thread.resourceId,
        status: result.thread.status,
        title: result.thread.title,
        lastMessageAt: result.thread.lastMessageAt,
      },
      messages: result.messages,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get canvas chat thread");
  }
}
