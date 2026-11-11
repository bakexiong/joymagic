import { respData, respErr } from "@/shared/lib/resp";
import { getSignUser } from "@/shared/models/user";
import {
  createWorkbenchCanvasProject,
  listWorkbenchCanvasProjects,
} from "@/shared/models/workbench-canvas-project";

export async function GET() {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const items = await listWorkbenchCanvasProjects(user.id);
    return respData({ items });
  } catch (error: any) {
    return respErr(error?.message || "failed to get canvas projects");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSignUser();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const body = await req.json().catch(() => ({}));
    const created = await createWorkbenchCanvasProject({
      userId: user.id,
      name: typeof body?.name === "string" ? body.name : undefined,
      entrySceneId:
        typeof body?.entrySceneId === "string" ? body.entrySceneId : undefined,
      entryModelUrl:
        typeof body?.entryModelUrl === "string" ? body.entryModelUrl : undefined,
      initialGraph:
        body?.initialGraph && typeof body.initialGraph === "object"
          ? body.initialGraph
          : undefined,
      meta: body?.meta && typeof body.meta === "object" ? body.meta : undefined,
    });

    return respData(created);
  } catch (error: any) {
    return respErr(error?.message || "failed to create canvas project");
  }
}
