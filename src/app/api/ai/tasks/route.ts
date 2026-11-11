import { respData, respErr } from '@/shared/lib/resp';
import { getAITasks } from '@/shared/models/ai_task';
import { getUserInfo } from '@/shared/models/user';

export async function GET(req: Request) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const type = searchParams.get('type') || undefined;

    const aiTasks = await getAITasks({
      userId: user.id,
      mediaType: type,
      page,
      limit: pageSize,
    });

    return respData(aiTasks);
  } catch (e: any) {
    console.log('get ai tasks failed', e);
    return respErr(e.message);
  }
}

