import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { i18n } from '@/core/docs/source';
import { envConfigs } from '@/config';
import { getSiteLogoUrl } from '@/shared/lib/site-logo';

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    links: [],
    nav: {
      title: (
        <>
          <Image
            src={getSiteLogoUrl(56, 56)}
            alt={envConfigs.app_name}
            width={28}
            height={28}
            className=""
          />
          <span className="text-primary text-lg font-bold">
            {envConfigs.app_name}
          </span>
        </>
      ),
      transparentMode: 'top',
    },
    i18n,
  };
}
