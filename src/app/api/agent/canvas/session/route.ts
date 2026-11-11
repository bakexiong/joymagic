import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import {
  createCanvasChatThread,
  createOrReuseCanvasChatThread,
  getWorkbenchCanvasProjectForChat,
} from "@/shared/models/workbench-canvas-chat";

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json().catch(() => ({}));
    const projectId =
      typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const createNew = body?.createNew === true;

    if (!projectId) {
      return respErr("projectId is required");
    }

    const project = await getWorkbenchCanvasProjectForChat(projectId, user.id);
    if (!project) {
      return respErr("canvas project not found");
    }

    const thread = createNew
      ? await createCanvasChatThread({
          userId: user.id,
          projectId,
        })
      : await createOrReuseCanvasChatThread({
          userId: user.id,
          projectId,
          threadId: null,
        });

    return respData({
      threadId: thread.id,
      resourceId: thread.resourceId,
      sessionId: thread.sessionId,
      projectId: thread.projectId,
      status: thread.status,
      title: thread.title,
      lastMessageAt: thread.lastMessageAt,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to create canvas agent session");
  }
}
