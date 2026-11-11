import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import {
  getWorkbenchCanvasProjectForChat,
  listCanvasChatThreadsByProject,
} from "@/shared/models/workbench-canvas-chat";

export async function GET(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId")?.trim() || "";

    if (!projectId) {
      return respErr("projectId is required");
    }

    const project = await getWorkbenchCanvasProjectForChat(projectId, user.id);
    if (!project) {
      return respErr("canvas project not found");
    }

    const threads = await listCanvasChatThreadsByProject(projectId, user.id);

    return respData({
      items: threads.map((thread) => ({
        id: thread.id,
        projectId: thread.projectId,
        sessionId: thread.sessionId,
        resourceId: thread.resourceId,
        status: thread.status,
        title: thread.title,
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      })),
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to list canvas chat threads");
  }
}
