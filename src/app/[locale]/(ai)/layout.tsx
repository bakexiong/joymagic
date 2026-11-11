import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { getThemeLayout } from '@/core/theme';
import { getConfigs } from '@/shared/models/config';
import { localizeHomeSidebar } from '@/shared/lib/home-sidebar-i18n';
import {
  Footer as FooterType,
  Header as HeaderType,
} from '@/shared/types/blocks/landing';
import { PricingPrompt } from '@/shared/blocks/payment/pricing-prompt';
import { type HomeSidebarData } from '@/themes/default/blocks/home-sidebar';

export default async function AiGroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('landing');
  const Layout = await getThemeLayout('landing');
  const configs = await getConfigs();

  const header: HeaderType = t.raw('header');
  const footer: FooterType = t.raw('footer');
  const homeSidebar = localizeHomeSidebar(
    t.raw('homeSidebar') as HomeSidebarData,
    locale,
  );
  const mobileLegacyHref =
    configs.mobile_home_legacy_href?.trim() || '/?layout=legacy';

  return (
    <Layout
      header={header}
      footer={footer}
      mobileLegacyHref={mobileLegacyHref}
      homeSidebar={homeSidebar}
    >
      {children}
      <PricingPrompt signInCallbackUrl="/pricing" />
    </Layout>
  );
}
