import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import { createIPBlacklist, NewIPBlacklist } from '@/shared/models/ip-blacklist';
import { getUserInfo } from '@/shared/models/user';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

export default async function IPBlacklistAddPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Check if user has permission to add IP blacklist
    await requirePermission({
        code: PERMISSIONS.USERS_WRITE,
        redirectUrl: '/admin/no-permission',
        locale,
    });

    const t = await getTranslations('admin.ipBlacklist');

    const crumbs: Crumb[] = [
        { title: t('add.crumbs.admin'), url: '/admin' },
        { title: t('add.crumbs.ipBlacklist'), url: '/admin/ip-blacklist' },
        { title: t('add.crumbs.add'), is_active: true },
    ];

    const form: Form = {
        fields: [
            {
                name: 'ip',
                type: 'text',
                title: t('fields.ip'),
                tip: t('fields.ip_tip'),
                validation: { required: true },
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
        data: {
            status: 'active',
        },
        submit: {
            button: {
                title: t('add.buttons.submit'),
            },
            handler: async (data) => {
                'use server';

                const user = await getUserInfo();
                if (!user) {
                    throw new Error('no auth');
                }

                const ip = data.get('ip') as string;
                const reason = data.get('reason') as string;
                const status = data.get('status') as string;

                if (!ip?.trim()) {
                    throw new Error('IP address is required');
                }

                const newIPBlacklist: NewIPBlacklist = {
                    ip: ip.trim(),
                    reason: reason?.trim() || null,
                    status: (status as 'active' | 'inactive') || 'active',
                    createdBy: user.id,
                };

                const result = await createIPBlacklist(newIPBlacklist);

                if (!result) {
                    throw new Error('add IP blacklist failed');
                }

                return {
                    status: 'success',
                    message: 'IP blacklist added',
                    redirect_url: '/admin/ip-blacklist',
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

