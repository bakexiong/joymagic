import { PERMISSIONS } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import {
    createIPBlacklist,
    deleteIPBlacklist,
    getIPBlacklists,
    getIPBlacklistsCount,
    updateIPBlacklist,
    NewIPBlacklist,
    UpdateIPBlacklist,
} from '@/shared/models/ip-blacklist';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

/**
 * 获取 IP 黑名单列表
 */
export async function GET(req: Request) {
    try {
        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        // 检查权限
        const hasAccess = await hasPermission(user.id, PERMISSIONS.USERS_READ);
        if (!hasAccess) {
            return respErr('no permission');
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '30');
        const ip = searchParams.get('ip') || undefined;
        const status = searchParams.get('status') || undefined;

        const [list, total] = await Promise.all([
            getIPBlacklists({ page, limit, ip, status }),
            getIPBlacklistsCount({ ip, status }),
        ]);

        return respData({
            list,
            total,
            page,
            limit,
        });
    } catch (e: any) {
        console.log('get IP blacklist failed:', e);
        return respErr(e.message || 'get IP blacklist failed');
    }
}

/**
 * 创建 IP 黑名单
 */
export async function POST(req: Request) {
    try {
        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        // 检查权限
        const hasAccess = await hasPermission(user.id, PERMISSIONS.USERS_WRITE);
        if (!hasAccess) {
            return respErr('no permission');
        }

        const body: NewIPBlacklist = await req.json();

        if (!body.ip) {
            return respErr('IP address is required');
        }

        // 检查 IP 是否已存在
        const existing = await getIPBlacklists({ ip: body.ip, limit: 1 });
        if (existing.length > 0) {
            return respErr('IP address already exists in blacklist');
        }

        const result = await createIPBlacklist({
            ...body,
            createdBy: user.id,
            status: body.status || 'active',
        });

        return respData(result);
    } catch (e: any) {
        console.log('create IP blacklist failed:', e);
        return respErr(e.message || 'create IP blacklist failed');
    }
}

/**
 * 更新 IP 黑名单
 */
export async function PUT(req: Request) {
    try {
        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        // 检查权限
        const hasAccess = await hasPermission(user.id, PERMISSIONS.USERS_WRITE);
        if (!hasAccess) {
            return respErr('no permission');
        }

        const body: { id: string } & UpdateIPBlacklist = await req.json();

        if (!body.id) {
            return respErr('ID is required');
        }

        const { id, ...updateData } = body;
        const result = await updateIPBlacklist(id, updateData);

        return respData(result);
    } catch (e: any) {
        console.log('update IP blacklist failed:', e);
        return respErr(e.message || 'update IP blacklist failed');
    }
}

/**
 * 删除 IP 黑名单
 */
export async function DELETE(req: Request) {
    try {
        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        // 检查权限
        const hasAccess = await hasPermission(user.id, PERMISSIONS.USERS_WRITE);
        if (!hasAccess) {
            return respErr('no permission');
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return respErr('ID is required');
        }

        await deleteIPBlacklist(id);

        return respData({ success: true });
    } catch (e: any) {
        console.log('delete IP blacklist failed:', e);
        return respErr(e.message || 'delete IP blacklist failed');
    }
}

