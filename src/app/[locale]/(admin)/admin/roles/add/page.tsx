import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import { getUuid } from '@/shared/lib/hash';
import {
  createRole,
  getRoleByName,
  NewRole,
  RoleStatus,
} from '@/shared/services/rbac';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function RoleAddPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission({
    code: PERMISSIONS.ROLES_WRITE,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.roles');

  const crumbs: Crumb[] = [
    { title: t('add.crumbs.admin'), url: '/admin' },
    { title: t('add.crumbs.roles'), url: '/admin/roles' },
    { title: t('add.crumbs.add'), is_active: true },
  ];

  const form: Form = {
    fields: [
      {
        name: 'name',
        type: 'text',
        title: t('fields.name'),
        tip: 'unique role name, e.g. support_agent',
        validation: { required: true },
      },
      {
        name: 'title',
        type: 'text',
        title: t('fields.title'),
        validation: { required: true },
      },
      {
        name: 'description',
        type: 'textarea',
        title: t('fields.description'),
      },
    ],
    data: {},
    submit: {
      button: {
        title: t('add.buttons.submit'),
      },
      handler: async (data) => {
        'use server';

        const name = (data.get('name') as string)?.trim().toLowerCase();
        const title = (data.get('title') as string)?.trim();
        const description = ((data.get('description') as string) || '').trim();

        if (!name || !title) {
          throw new Error('name and title are required');
        }

        const existingRole = await getRoleByName(name);
        if (existingRole) {
          throw new Error('role name already exists');
        }

        const newRole: NewRole = {
          id: getUuid(),
          name,
          title,
          description,
          status: RoleStatus.ACTIVE,
          sort: 0,
        };

        const result = await createRole(newRole);

        if (!result) {
          throw new Error('create role failed');
        }

        return {
          status: 'success',
          message: 'role created',
          redirect_url: '/admin/roles',
        };
      },
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('add.title')} />
        <FormCard form={form} className="md:max-w-xl" />
      </Main>
    </>
  );
}
