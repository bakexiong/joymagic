import { envConfigs } from '@/config';
import { BrandLogo, LocaleSelector } from '@/shared/blocks/common';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      {/* Desktop: Show logo and locale selector */}
      <div className="hidden md:block absolute top-4 left-4">
        <BrandLogo
          brand={{
            title: envConfigs.app_name,
            logo: {
              src: '/logo.png',
              alt: envConfigs.app_name,
            },
            url: '/',
            target: '_self',
            className: '',
          }}
          showTitle={false}
        />
      </div>
      <div className="hidden md:flex absolute top-4 right-4 items-center gap-4">
        <LocaleSelector type="button" />
      </div>

      {/* Mobile: Full width without padding */}
      <div className="w-full md:px-4">{children}</div>
    </div>
  );
}
