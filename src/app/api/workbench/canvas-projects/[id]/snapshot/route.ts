import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import { saveWorkbenchCanvasSnapshot } from "@/shared/models/workbench-canvas-project";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (!body?.graph || typeof body.graph !== "object") {
      return respErr("graph is required");
    }

    const snapshot = await saveWorkbenchCanvasSnapshot({
      projectId: id,
      userId: user.id,
      graph: body.graph,
      expectedVersion:
        typeof body?.expectedVersion === "number" ? body.expectedVersion : undefined,
      meta: body?.meta && typeof body.meta === "object" ? body.meta : undefined,
    });

    return respData({ snapshot });
  } catch (error: any) {
    return respErr(error?.message || "failed to save canvas snapshot");
  }
}
