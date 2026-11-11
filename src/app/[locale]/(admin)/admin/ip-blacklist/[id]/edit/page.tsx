import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Empty } from '@/shared/blocks/common';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import {
    findIPBlacklistById,
    updateIPBlacklist,
    UpdateIPBlacklist,
} from '@/shared/models/ip-blacklist';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function IPBlacklistEditPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    setRequestLocale(locale);

    // Check if user has permission to edit IP blacklist
    await requirePermission({
        code: PERMISSIONS.USERS_WRITE,
        redirectUrl: '/admin/no-permission',
        locale,
    });

    const ipBlacklist = await findIPBlacklistById(id);
    if (!ipBlacklist) {
        return <Empty message="IP blacklist not found" />;
    }

    const t = await getTranslations('admin.ipBlacklist');

    const crumbs: Crumb[] = [
        { title: t('edit.crumbs.admin'), url: '/admin' },
        { title: t('edit.crumbs.ipBlacklist'), url: '/admin/ip-blacklist' },
        { title: t('edit.crumbs.edit'), is_active: true },
    ];

    const form: Form = {
        fields: [
            {
                name: 'ip',
                type: 'text',
                title: t('fields.ip'),
                validation: { required: true },
                attributes: { disabled: true },
            },
            {
                name: 'reason',
                type: 'textarea',
                title: t('fields.reason'),
                tip: t('fields.reason_tip'),
            },
            {
                name: 'status',
                type: 'select',
                title: t('fields.status'),
                options: [
                    { value: 'active', title: t('status.active') },
                    { value: 'inactive', title: t('status.inactive') },
                ],
                validation: { required: true },
            },
        ],
        data: ipBlacklist,
        submit: {
            button: {
                title: t('edit.buttons.submit'),
            },
            handler: async (data) => {
                'use server';

                const reason = data.get('reason') as string;
                const status = data.get('status') as string;

                const updateData: UpdateIPBlacklist = {
                    reason: reason?.trim() || null,
                    status: (status as 'active' | 'inactive') || 'active',
                };

                const result = await updateIPBlacklist(id, updateData);

                if (!result) {
                    throw new Error('update IP blacklist failed');
                }

                return {
                    status: 'success',
                    message: 'IP blacklist updated',
                    redirect_url: '/admin/ip-blacklist',
                };
            },
        },
    };

    return (
        <>
            <Header crumbs={crumbs} />
            <Main>
                <MainHeader title={t('edit.title')} />
                <FormCard form={form} className="md:max-w-xl" />
            </Main>
        </>
    );
}

