import { getTranslations } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { Badge } from '@/shared/components/ui/badge';
import {
    getIPBlacklists,
    getIPBlacklistsCount,
    IPBlacklist,
} from '@/shared/models/ip-blacklist';
import { Crumb, Search } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function AdminIPBlacklistPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        page?: number;
        pageSize?: number;
        ip?: string;
        status?: string;
    }>;
}) {
    const { locale } = await params;

    // Check if user has permission to read users
    await requirePermission({
        code: PERMISSIONS.USERS_READ,
        redirectUrl: '/admin/no-permission',
        locale,
    });

    const t = await getTranslations('admin.ipBlacklist');

    const { page: pageNum, pageSize, ip, status } = await searchParams;
    const page = pageNum || 1;
    const limit = pageSize || 30;

    const total = await getIPBlacklistsCount({
        ip,
        status,
    });
    const list = await getIPBlacklists({
        ip,
        status,
        page,
        limit,
    });

    const crumbs: Crumb[] = [
        { title: t('list.crumbs.admin'), url: '/admin' },
        { title: t('list.crumbs.ipBlacklist'), is_active: true },
    ];

    const search: Search = {
        name: 'ip',
        title: t('list.search.ip.title'),
        placeholder: t('list.search.ip.placeholder'),
        value: ip,
    };

    const table: Table = {
        columns: [
            { name: 'id', title: t('fields.id'), type: 'copy' },
            { name: 'ip', title: t('fields.ip'), type: 'copy' },
            {
                name: 'status',
                title: t('fields.status'),
                callback: (item: IPBlacklist) => {
                    return (
                        <Badge variant={item.status === 'active' ? 'destructive' : 'outline'}>
                            {item.status === 'active' ? t('status.active') : t('status.inactive')}
                        </Badge>
                    );
                },
            },
            { name: 'reason', title: t('fields.reason'), placeholder: '-' },
            { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
            {
                name: 'actions',
                title: t('fields.actions'),
                type: 'dropdown',
                callback: (item: IPBlacklist) => [
                    {
                        name: 'edit',
                        title: t('list.buttons.edit'),
                        icon: 'RiEditLine',
                        url: `/admin/ip-blacklist/${item.id}/edit`,
                    },
                    {
                        name: 'delete',
                        title: t('list.buttons.delete'),
                        icon: 'RiDeleteBinLine',
                        action: 'delete',
                        url: `/api/admin/ip-blacklist?id=${item.id}`,
                    },
                ],
            },
        ],
        data: list,
        pagination: {
            total,
            page,
            limit,
        },
    };

    return (
        <>
            <Header crumbs={crumbs} />
            <Main>
                <MainHeader
                    title={t('list.title')}
                    search={search}
                    actions={[
                        {
                            title: t('list.buttons.add'),
                            url: '/admin/ip-blacklist/add',
                            icon: 'RiAddLine',
                        },
                    ]}
                />
                <TableCard table={table} />
            </Main>
        </>
    );
}

