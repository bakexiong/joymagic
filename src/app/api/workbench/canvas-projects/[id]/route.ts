import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import {
  deleteWorkbenchCanvasProjectById,
  getWorkbenchCanvasProjectById,
  touchWorkbenchCanvasProject,
  updateWorkbenchCanvasProject,
} from "@/shared/models/workbench-canvas-project";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { id } = await params;
    const result = await getWorkbenchCanvasProjectById(id, user.id);
    if (!result) {
      return respErr("canvas project not found");
    }

    await touchWorkbenchCanvasProject(id, user.id);
    return respData(result);
  } catch (error: any) {
    return respErr(error?.message || "failed to get canvas project");
  }
}

export async function PATCH(
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
    const updated = await updateWorkbenchCanvasProject({
      id,
      userId: user.id,
      name: typeof body?.name === "string" ? body.name : undefined,
      coverUrl: typeof body?.coverUrl === "string" ? body.coverUrl : undefined,
      status: typeof body?.status === "string" ? body.status : undefined,
    });

    if (!updated) {
      return respErr("canvas project not found");
    }

    return respData({ project: updated });
  } catch (error: any) {
    return respErr(error?.message || "failed to update canvas project");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { id } = await params;
    const deleted = await deleteWorkbenchCanvasProjectById(id, user.id);
    if (!deleted) {
      return respErr("canvas project not found");
    }

    return respData({ deleted });
  } catch (error: any) {
    return respErr(error?.message || "failed to delete canvas project");
  }
}
