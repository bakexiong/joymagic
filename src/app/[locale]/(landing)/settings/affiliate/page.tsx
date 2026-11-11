import { getTranslations } from "next-intl/server";

import { AffiliateSettingsClient } from "@/shared/blocks/affiliate-settings-client";

export default async function AffiliateSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("settings.affiliate");

  return (
    <div className="space-y-8 px-0 pb-2 pt-0 text-[#23282f] sm:px-0 lg:px-0">
      <AffiliateSettingsClient
        locale={locale}
        copy={{
          authEmpty: t("auth.empty"),
          dashboard: {
            heading: t("dashboard.heading"),
            intro: t("dashboard.intro"),
            linkTitle: t("dashboard.link_title"),
            linkDescription: t("dashboard.link_description"),
            copy: t("dashboard.copy"),
            copied: t("dashboard.copied"),
            copyDiscountCode: t("dashboard.copy_discount_code"),
            metrics: {
              total: t("dashboard.metrics.total"),
              pending: t("dashboard.metrics.pending"),
              available: t("dashboard.metrics.available"),
              paid: t("dashboard.metrics.paid"),
              referrals: t("dashboard.metrics.referrals"),
            },
            tabs: {
              dashboard: t("dashboard.tabs.dashboard"),
              commissions: t("dashboard.tabs.commissions"),
              payouts: t("dashboard.tabs.payouts"),
            },
            table: {
              date: t("dashboard.table.date"),
              visitors: t("dashboard.table.visitors"),
              registers: t("dashboard.table.registers"),
              payments: t("dashboard.table.payments"),
              earnings: t("dashboard.table.earnings"),
              empty: t("dashboard.table.empty"),
            },
          },
          payout: {
            title: t("payout.title"),
            description: t("payout.description"),
            minimum: t("payout.minimum"),
            inProgress: t("payout.in_progress"),
            paypalEmail: t("payout.paypal_email"),
            note: t("payout.note"),
            placeholder: t("payout.placeholder"),
            submit: t("payout.submit"),
          },
          application: {
            title: t("application.title"),
            description: t("application.description"),
            desiredTier: t("application.desired_tier"),
            standard: t("application.standard"),
            kol: t("application.kol"),
            paypalEmail: t("application.paypal_email"),
            socialPlatform: t("application.social_platform"),
            socialAccount: t("application.social_account"),
            channelSummary: t("application.channel_summary"),
            applicationNote: t("application.application_note"),
            submit: t("application.submit"),
            pendingDescription: t("application.pending_description"),
            latestStatus: t("application.latest_status"),
            rejectReason: t("application.reject_reason"),
          },
          agreement: {
            title: t("agreement.title"),
            cookieTtl: t("agreement.cookie_ttl"),
            confirmDays: t("agreement.confirm_days"),
            rates: t("agreement.rates"),
            minimumPayout: t("agreement.minimum_payout"),
          },
          lists: {
            firstOrder: t("lists.first_order"),
            renewal: t("lists.renewal"),
          },
          status: {
            pending: t("status.pending"),
            approved: t("status.approved"),
            rejected: t("status.rejected"),
            canceled: t("status.canceled"),
            active: t("status.active"),
            suspended: t("status.suspended"),
            blacklisted: t("status.blacklisted"),
            closed: t("status.closed"),
            requested: t("status.requested"),
            paid: t("status.paid"),
          },
          units: {
            days: t("unit.days"),
          },
          errors: {
            loadDashboard: t("errors.load_dashboard"),
            submitApplication: t("errors.submit_application"),
            requestPayout: t("errors.request_payout"),
          },
        }}
      />
    </div>
  );
}
