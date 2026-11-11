'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { requestPasswordReset } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export function ForgotPassword() {
    const t = useTranslations('common.sign');
    const locale = useLocale();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (loading) return;
        if (!email) {
            toast.error(t('forgot_password_email_required'));
            return;
        }

        try {
            setLoading(true);

            const origin =
                typeof window !== 'undefined' ? window.location.origin : '';
            const localePrefix =
                locale && locale !== defaultLocale ? `/${locale}` : '';
            const redirectTo = `${origin}${localePrefix}/reset-password`;

            await requestPasswordReset(email, redirectTo);

            setSent(true);
            toast.success(t('reset_password_email_sent'));
        } catch (error: any) {
            console.error('request password reset failed', error);
            toast.error(
                error?.error?.message ||
                error?.message ||
                t('reset_password_email_failed')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mx-auto w-full md:max-w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                    <h1>{t('forgot_password')}</h1>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    <h2>
                        {t('forgot_password_description')}
                    </h2>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('email_title')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t('email_placeholder')}
                            required
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            value={email}
                            disabled={loading || sent}
                        />
                    </div>

                    <Button
                        type="button"
                        className="w-full"
                        disabled={loading || sent}
                        onClick={handleSubmit}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <p>{sent ? t('reset_password_email_sent') : t('forgot_password')}</p>
                        )}
                    </Button>
                </div>
            </CardContent>
            <CardFooter>
                <div className="flex w-full justify-center border-t py-4">
                    <p className="text-center text-xs text-neutral-500">
                        <Link href="/sign-in" className="underline">
                            <span className="cursor-pointer dark:text-white/70">
                                {t('sign_in_title')}
                            </span>
                        </Link>
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}


