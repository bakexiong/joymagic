import { getTranslations } from 'next-intl/server';

import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { SignUp } from '@/shared/blocks/sign/sign-up';
import { getPublicConfigs } from '@/shared/models/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations('common');

  return {
    title: `${t('sign.sign_up_title')} - ${t('metadata.title')}`,
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/sign-up`
          : `${envConfigs.app_url}/sign-up`,
    },
  };
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const configs = await getPublicConfigs();

  // Turnstile site key needs to be available on client.
  // Do NOT rely on client-side process.env in Cloudflare/OpenNext; pass via props.
  const cfTurnstileSiteKey = configs.cf_turnstile_site_key;

  return (
    <SignUp
      configs={{
        ...configs,
        cf_turnstile_site_key: cfTurnstileSiteKey,
      }}
      callbackUrl={callbackUrl || '/'}
    />
  );
}
