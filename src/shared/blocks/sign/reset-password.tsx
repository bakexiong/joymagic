'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { resetPassword as resetPasswordRequest } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
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
import { ForgotPassword } from './forgot-password';

export function ResetPassword({ token }: { token?: string }) {
    const t = useTranslations('common.sign');
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleSubmit = async () => {
        if (loading || completed) return;
        if (!token) {
            toast.error(t('reset_password_toast_invalid_token'));
            return;
        }
        if (!password || !confirmPassword) {
            toast.error(t('reset_password_toast_failed'));
            return;
        }
        if (password !== confirmPassword) {
            toast.error(t('reset_password_toast_failed'));
            return;
        }

        try {
            setLoading(true);
            const result: any = await resetPasswordRequest(token, password);

            if (result?.error) {
                // better-auth uses BASE_ERROR_CODES, map常见错误码为可读提示
                const code = result.error?.code || result.error?.body?.code;
                const message =
                    result.error?.body?.message ||
                    result.error?.message ||
                    result.error?.error?.message;

                if (code === 'PASSWORD_TOO_SHORT') {
                    toast.error(t('reset_password_toast_short'));
                } else if (code === 'PASSWORD_TOO_LONG') {
                    toast.error(t('reset_password_toast_long'));
                } else if (code === 'INVALID_TOKEN') {
                    toast.error(t('reset_password_toast_invalid_token'));
                } else {
                    toast.error(message || t('reset_password_toast_failed'));
                }
                return;
            }

            setCompleted(true);
            toast.success(t('reset_password_toast_success'));
            setTimeout(() => {
                router.push('/sign-in');
            }, 1200);
        } catch (error: any) {
            console.error('reset password failed', error);
            toast.error(
                error?.body?.message ||
                error?.error?.message ||
                error?.message ||
                t('reset_password_toast_failed')
            );
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        // When accessed directly without token, show the same content as /forgot-password
        return <ForgotPassword />;
    }

    return (
        <Card className="mx-auto w-full md:max-w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                    <h1>{t('reset_password_page_title')}</h1>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    <h2>{t('reset_password_page_description')}</h2>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('password_title')}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t('password_placeholder')}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || completed}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder={t('password_placeholder')}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || completed}
                        />
                    </div>

                    <Button
                        type="button"
                        className="w-full"
                        disabled={loading || completed}
                        onClick={handleSubmit}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <p>{completed ? t('reset_password_page_title') : t('reset_password_title')}</p>
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


