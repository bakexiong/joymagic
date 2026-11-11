import { getSignUser } from "@/shared/models/user";
import {
  createWorkbenchCollection,
  listWorkbenchCollectionsBasic,
  listWorkbenchCollections,
} from "@/shared/models/workbench-collection";
import { respData, respErr } from "@/shared/lib/resp";

export async function GET(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { searchParams } = new URL(req.url);
    const basicOnly = searchParams.get("basic") === "1";
    if (basicOnly) {
      const items = await listWorkbenchCollectionsBasic(user.id);
      return respData({ items });
    }

    const items = await listWorkbenchCollections(user.id);
    return respData({
      items: items.map((item) => ({
        ...item,
        assetCount: Number(item.assetCount ?? 0),
      })),
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get workbench collections");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json().catch(() => ({}));
    const created = await createWorkbenchCollection({
      userId: user.id,
      name: String(body?.name || ""),
    });

    return respData({
      collection: {
        ...created,
        assetCount: 0,
      },
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to create workbench collection");
  }
}
