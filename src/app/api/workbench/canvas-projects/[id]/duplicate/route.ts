import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import { duplicateWorkbenchCanvasProjectById } from "@/shared/models/workbench-canvas-project";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { id } = await params;
    const duplicated = await duplicateWorkbenchCanvasProjectById(id, user.id);
    if (!duplicated) {
      return respErr("canvas project not found");
    }

    return respData({
      project: duplicated.project,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to duplicate canvas project");
  }
}
