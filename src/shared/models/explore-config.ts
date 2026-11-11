import { MediaItem } from '@/shared/blocks/explore/media-card';

export interface ExploreSection {
  id: string;
  sceneName: string;
  subtitle?: string;
  viewAllText?: string;
  generateUrl?: string;
  items: MediaItem[];
}

export interface ExploreConfig {
  title: string;
  subtitle?: string;
  generateUrl?: string;
  sections: ExploreSection[];
}

const EMPTY_CONFIG: ExploreConfig = {
  title: '',
  subtitle: '',
  generateUrl: '/creator',
  sections: [],
};

/**
 * 从字符串解析 Explore 配置，失败则回退到默认配置
 */
export function parseExploreConfig(raw?: string | null): ExploreConfig {
  if (!raw) {
    return EMPTY_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_CONFIG;
    }

    const sections = Array.isArray((parsed as any).sections)
      ? ((parsed as any).sections as any[]).map((section: any) => {
          if (typeof section.generateUrl === 'string') {
            return section;
          }

          return section;
        })
      : [];

    const result: ExploreConfig = {
      title: typeof (parsed as any).title === 'string' ? (parsed as any).title : '',
      subtitle:
        typeof (parsed as any).subtitle === 'string'
          ? (parsed as any).subtitle
          : undefined,
      generateUrl:
        typeof (parsed as any).generateUrl === 'string'
          ? (parsed as any).generateUrl
          : '/creator',
      sections: sections as ExploreSection[],
    };

    return result;
  } catch {
    return EMPTY_CONFIG;
  }
}
