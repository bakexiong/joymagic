import { getSignUser } from "@/shared/models/user";
import { deleteWorkbenchUploadById } from "@/shared/models/workbench-upload";
import { respData, respErr } from "@/shared/lib/resp";

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
    const deleted = await deleteWorkbenchUploadById(id, user.id);
    if (!deleted) {
      return respErr("upload not found");
    }

    return respData({ deleted });
  } catch (error: any) {
    return respErr(error?.message || "failed to delete workbench upload");
  }
}
