import { getSignUser } from "@/shared/models/user";
import {
  addCreationsToWorkbenchCollection,
  listWorkbenchCollectionCreations,
  removeCreationsFromWorkbenchCollection,
} from "@/shared/models/workbench-collection-creation";
import { respData, respErr } from "@/shared/lib/resp";

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function getDefaultStartDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6);
  return date;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 20);
    const startDate =
      parseDateParam(searchParams.get("startDate")) || getDefaultStartDate();
    const result = await listWorkbenchCollectionCreations({
      userId: user.id,
      collectionId: id,
      mediaType: searchParams.get("mediaType") || undefined,
      assetCategory: searchParams.get("category") || undefined,
      sceneId: searchParams.get("sceneId") || undefined,
      modelUrl: searchParams.get("modelUrl") || undefined,
      keyword: searchParams.get("keyword") || undefined,
      startDate,
      endDate: parseDateParam(searchParams.get("endDate"), true),
      limit,
      offset: Number(searchParams.get("offset") || 0),
    });

    return respData({
      ...result,
      hasMore: result.items.length >= limit,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get collection items");
  }
}

export async function POST(
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

    const result = await addCreationsToWorkbenchCollection({
      userId: user.id,
      collectionId: id,
      creationIds: Array.isArray(body?.creationIds) ? body.creationIds : [],
    });

    return respData(result);
  } catch (error: any) {
    return respErr(error?.message || "failed to add items to collection");
  }
}

export async function DELETE(
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

    const result = await removeCreationsFromWorkbenchCollection({
      userId: user.id,
      collectionId: id,
      creationIds: Array.isArray(body?.creationIds) ? body.creationIds : [],
    });

    return respData(result);
  } catch (error: any) {
    return respErr(error?.message || "failed to remove items from collection");
  }
}
