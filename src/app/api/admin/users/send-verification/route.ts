import { NextResponse } from 'next/server';

import { PERMISSIONS } from '@/core/rbac';
import { envConfigs } from '@/config';
import { respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

export async function POST(request: Request) {
    try {
        // Permission: only users with USERS_WRITE can trigger verification emails
        const currentUser = await getUserInfo();
        if (!currentUser) {
            return respErr('no auth, please sign in');
        }
        const canSend = await hasPermission(currentUser.id, PERMISSIONS.USERS_WRITE);
        if (!canSend) {
            return respErr('no permission');
        }

        const body = await request.json();
        const { email, callbackURL } = body || {};

        if (!email) {
            return NextResponse.json(
                { error: { message: 'Email is required' } },
                { status: 400 }
            );
        }

        // Resolve auth base URL; fallback to app_url + /api/auth when missing
        let authBase = envConfigs.auth_url || envConfigs.app_url;
        if (!authBase) {
            return NextResponse.json(
                { error: { message: 'Auth service unavailable' } },
                { status: 500 }
            );
        }
        if (!authBase.endsWith('/api/auth')) {
            authBase = `${authBase.replace(/\/+$/, '')}/api/auth`;
        }

        const res = await fetch(`${authBase}/send-verification-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, callbackURL }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.error) {
            return NextResponse.json(
                { error: data?.error || data || { message: 'Failed to send' } },
                { status: res.status || 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json(
            { error: { message: error?.message || 'Internal error' } },
            { status: 500 }
        );
    }
}

