import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import { parseExploreConfig } from '@/shared/models/explore-config';
import { getConfigs, saveConfigs } from '@/shared/models/config';
import { getUserInfo } from '@/shared/models/user';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function ExploreAdminPage({
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
  const configs = await getConfigs();
  const exploreConfig = parseExploreConfig(configs['explore_page_config']);

  const crumbs: Crumb[] = [
    { title: t('edit.crumbs.admin'), url: '/admin' },
    { title: t('edit.crumbs.explore'), is_active: true },
  ];

  const form: Form = {
    fields: [
      {
        name: 'title',
        type: 'text',
        title: t('fields.title'),
        validation: { required: true },
      },
      {
        name: 'subtitle',
        type: 'text',
        title: t('fields.subtitle'),
      },
      {
        name: 'sections',
        type: 'textarea',
        title: t('fields.sections'),
        tip: t('fields.sections_tip'),
        attributes: {
          rows: 14,
        },
        validation: { required: true },
      },
    ],
    data: {
      title: exploreConfig.title,
      subtitle: exploreConfig.subtitle ?? '',
      sections: JSON.stringify(exploreConfig.sections, null, 2),
    },
    submit: {
      button: {
        title: t('edit.buttons.submit'),
      },
      handler: async (data) => {
        'use server';

        const user = await getUserInfo();
        if (!user) {
          throw new Error('no auth');
        }

        const title = (data.get('title') as string) || '';
        const subtitle = (data.get('subtitle') as string) || '';
        const sectionsRaw = (data.get('sections') as string) || '';

        if (!title.trim()) {
          throw new Error('title is required');
        }

        let sections: any;
        try {
          sections = JSON.parse(sectionsRaw);
          if (!Array.isArray(sections)) {
            throw new Error('sections must be an array');
          }
        } catch (e: any) {
          throw new Error(
            e?.message || 'sections must be valid JSON array of sections',
          );
        }

        const nextConfigs = {
          ...configs,
          explore_page_config: JSON.stringify(
            {
              title: title.trim(),
              subtitle: subtitle.trim(),
              sections,
            },
            null,
            2,
          ),
        };

        await saveConfigs(nextConfigs);

        return {
          status: 'success' as const,
          message: 'Explore config updated',
        };
      },
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('edit.title')} />
        <FormCard form={form} className="md:max-w-3xl" />
      </Main>
    </>
  );
}
