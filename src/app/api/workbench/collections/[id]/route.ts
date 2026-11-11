import { getSignUser } from "@/shared/models/user";
import {
  deleteWorkbenchCollectionById,
  renameWorkbenchCollection,
} from "@/shared/models/workbench-collection";
import { respData, respErr } from "@/shared/lib/resp";

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
    const updated = await renameWorkbenchCollection({
      id,
      userId: user.id,
      name: String(body?.name || ""),
    });

    if (!updated) {
      return respErr("collection not found");
    }

    return respData({
      collection: {
        ...updated,
        assetCount: 0,
      },
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to rename workbench collection");
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
    const deleted = await deleteWorkbenchCollectionById(id, user.id);

    if (!deleted) {
      return respErr("collection not found");
    }

    return respData({ deleted });
  } catch (error: any) {
    return respErr(error?.message || "failed to delete workbench collection");
  }
}
