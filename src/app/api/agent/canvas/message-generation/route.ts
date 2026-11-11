import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import { updateCanvasChatMessageGeneration } from "@/shared/models/workbench-canvas-chat";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json().catch(() => ({}));
    const messageId =
      typeof body?.messageId === "string" ? body.messageId.trim() : "";
    const threadId =
      typeof body?.threadId === "string" ? body.threadId.trim() : undefined;
    const projectId =
      typeof body?.projectId === "string" ? body.projectId.trim() : undefined;
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
    const workflowNodeId =
      typeof body?.workflowNodeId === "string"
        ? body.workflowNodeId.trim()
        : undefined;
    const scenario =
      typeof body?.scenario === "string" ? body.scenario.trim() : undefined;
    const status =
      body?.status === "submitted" ||
      body?.status === "completed" ||
      body?.status === "failed"
        ? body.status
        : null;
    const errorMessage =
      typeof body?.errorMessage === "string"
        ? body.errorMessage.trim()
        : undefined;
    const outputs = normalizeStringArray(body?.outputs);
    const creationRecordIds = normalizeStringArray(body?.creationRecordIds);

    if (!messageId) {
      return respErr("messageId is required");
    }
    if (!taskId) {
      return respErr("taskId is required");
    }
    if (!status) {
      return respErr("status is required");
    }

    const updated = await updateCanvasChatMessageGeneration({
      userId: user.id,
      messageId,
      threadId,
      projectId,
      generation: {
        status,
        taskId,
        workflowNodeId,
        scenario,
        outputs,
        creationRecordIds,
        errorMessage,
      },
    });

    return respData({
      messageId: updated.id,
      generation: updated.generationJson
        ? JSON.parse(updated.generationJson)
        : null,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to update canvas chat generation");
  }
}
