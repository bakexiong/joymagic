import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { parseExploreConfig } from '@/shared/models/explore-config';
import { getConfigs } from '@/shared/models/config';
import { Crumb } from '@/shared/types/blocks/common';
import type { Header as HeaderType } from '@/shared/types/blocks/landing';
import { ExploreManager } from './explore-manager';

export default async function ExploreManagerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission({
    code: PERMISSIONS.POSTS_WRITE,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.explore');
  const landingT = await getTranslations('landing');
  const header = landingT.raw('header') as HeaderType;
  const navItems = header.nav?.items || [];

  const configs = await getConfigs();
  const exploreConfig = parseExploreConfig(configs['explore_page_config']);

  // 确保有默认结构，即使数据库中没有配置
  const defaultConfig = {
    title: exploreConfig?.title || 'Explore',
    subtitle: exploreConfig?.subtitle || '',
    sections: exploreConfig?.sections || [],
  };

  const crumbs: Crumb[] = [
    { title: t('edit.crumbs.admin'), url: '/admin' },
    { title: 'Explore Manager', is_active: true },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title="Explore Content Manager" />
        <ExploreManager initialConfig={defaultConfig} navItems={navItems} />
      </Main>
    </>
  );
}
