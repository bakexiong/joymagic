import { getSignUser } from "@/shared/models/user";
import { listWorkbenchCreations } from "@/shared/models/workbench-creation";
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

export async function GET(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const { searchParams } = new URL(req.url);
    const startDate =
      parseDateParam(searchParams.get("startDate")) || getDefaultStartDate();

    const items = await listWorkbenchCreations({
      userId: user.id,
      mediaType: searchParams.get("mediaType") || undefined,
      assetCategory: searchParams.get("category") || undefined,
      sceneId: searchParams.get("sceneId") || undefined,
      modelUrl: searchParams.get("modelUrl") || undefined,
      keyword: searchParams.get("keyword") || undefined,
      startDate,
      endDate: parseDateParam(searchParams.get("endDate"), true),
      limit: Number(searchParams.get("limit") || 20),
      offset: Number(searchParams.get("offset") || 0),
    });

    const pageSize = Number(searchParams.get("limit") || 20);

    return respData({
      items,
      hasMore: items.length >= pageSize,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get workbench creations");
  }
}
