'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

export function EmailVerificationCell({
    email,
    verified,
    locale,
}: {
    email: string;
    verified?: any;
    locale: string;
}) {
    const tCommon = useTranslations('common');
    const tAdmin = useTranslations('admin.users');
    const [loading, setLoading] = useState(false);

    const isVerified = Boolean(verified);

    const handleSend = async () => {
        if (loading || !email) {
            if (!email) {
                toast.error(tCommon('sign.verify_email_resend_missing_email'));
            }
            return;
        }

        setLoading(true);
        try {
            const localePrefix =
                locale && locale !== defaultLocale ? `/${locale}` : '';
            const callbackURL = `${localePrefix || ''}/sign-in`;

            const res = await fetch('/api/admin/users/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, callbackURL }),
            });

            const result: any = await res.json().catch(() => ({}));
            if (!res.ok || result?.error) {
                const rawError = result?.error;
                const errMessage =
                    typeof rawError === 'string'
                        ? rawError
                        : rawError?.message ||
                        rawError?.body?.message ||
                        '';

                if (
                    typeof errMessage === 'string' &&
                    errMessage.toLowerCase().includes('verified')
                ) {
                    toast.error(tCommon('sign.verify_email_already_verified'));
                } else {
                    toast.error(
                        errMessage || tCommon('sign.verify_email_resend_failed')
                    );
                }
                return;
            }

            toast.success(tCommon('sign.verify_email_resend_sent'));
        } catch (error) {
            console.error('send verification email error', error);
            toast.error(tCommon('sign.verify_email_resend_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {isVerified ? (
                <Badge variant="default">{tAdmin('fields.email_verified')}</Badge>
            ) : (
                <Badge variant="outline">{tAdmin('fields.email_not_verified') ?? 'Not verified'}</Badge>
            )}
            {!isVerified && (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSend}
                    disabled={loading}
                >
                    {loading && <Loader2 className="animate-spin" size={14} />}
                    {tCommon('sign.verify_email_resend')}
                </Button>
            )}
        </div>
    );
}

