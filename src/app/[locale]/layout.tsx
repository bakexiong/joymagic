import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { routing } from "@/core/i18n/config";
import { getAuth } from "@/core/auth";
import { ThemeProvider } from "@/core/theme/provider";
import { captureAffiliateVisitFromRequest } from "@/shared/models/affiliate";
import { Toaster } from "@/shared/components/ui/sonner";
import { UTMTracker } from "@/shared/components/utm-tracker";
import { ServiceWorkerRegistration } from "@/shared/components/service-worker-registration";
import { AppContextProvider } from "@/shared/contexts/app";
import { getMetadata } from "@/shared/lib/seo";
import { hasServerNsfwAccessGrant } from "@/shared/lib/nsfw-access";
import {
  grantUserNsfwWhitelist,
  isUserNsfwWhitelisted,
} from "@/shared/models/user";

export const generateMetadata = getMetadata();

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  await captureAffiliateVisitFromRequest().catch((error) => {
    console.error("Failed to capture affiliate visit:", error);
  });

  const headerStore = await headers();
  const initialSession = await (async () => {
    try {
      const auth = await getAuth();
      return await auth.api.getSession({
        headers: headerStore,
      });
    } catch (error) {
      console.error("Failed to preload auth session:", error);
      return null;
    }
  })();

  const userId = initialSession?.user?.id;
  if (userId) {
    const hasNsfwAccess =
      headerStore.get("x-nsfw-access-granted") === "1" ||
      (await hasServerNsfwAccessGrant());

    if (hasNsfwAccess && !(await isUserNsfwWhitelisted(userId))) {
      await grantUserNsfwWhitelist(userId).catch((error) => {
        console.error("Failed to grant NSFW whitelist:", error);
      });
    }
  }

  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <AppContextProvider initialSession={initialSession}>
          <UTMTracker />
          <ServiceWorkerRegistration />
          {children}
          <Toaster position="top-center" richColors />
        </AppContextProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
