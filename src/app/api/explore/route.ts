import { parseExploreConfig } from '@/shared/models/explore-config';
import { getConfigs } from '@/shared/models/config';
import { respData, respErr } from '@/shared/lib/resp';
import { filterBorderlineExploreConfig } from '@/shared/lib/explore-content-filter';

export async function GET() {
  try {
    const configs = await getConfigs();
    const raw = configs['explore_page_config'];
    const data = filterBorderlineExploreConfig(parseExploreConfig(raw ?? null));

    return respData(data);
  } catch (e: any) {
    console.error('[API] Failed to load explore config:', e);
    return respErr(e?.message || 'Failed to load explore config');
  }
}
