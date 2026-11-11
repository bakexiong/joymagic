"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AffiliateDashboard } from "@/shared/blocks/affiliate-dashboard";
import { Empty } from "@/shared/blocks/common";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

type SettingsAffiliateCopy = {
  authEmpty: string;
  dashboard: {
    heading: string;
    intro: string;
    linkTitle: string;
    linkDescription: string;
    copy: string;
    copied: string;
    copyDiscountCode: string;
    metrics: {
      total: string;
      pending: string;
      available: string;
      paid: string;
      referrals: string;
    };
    tabs: {
      dashboard: string;
      commissions: string;
      payouts: string;
    };
    table: {
      date: string;
      visitors: string;
      registers: string;
      payments: string;
      earnings: string;
      empty: string;
    };
  };
  payout: {
    title: string;
    description: string;
    minimum: string;
    inProgress: string;
    paypalEmail: string;
    note: string;
    placeholder: string;
    submit: string;
  };
  application: {
    title: string;
    description: string;
    desiredTier: string;
    standard: string;
    kol: string;
    paypalEmail: string;
    socialPlatform: string;
    socialAccount: string;
    channelSummary: string;
    applicationNote: string;
    submit: string;
    pendingDescription: string;
    latestStatus: string;
    rejectReason: string;
  };
  agreement: {
    title: string;
    cookieTtl: string;
    confirmDays: string;
    rates: string;
    minimumPayout: string;
  };
  lists: {
    firstOrder: string;
    renewal: string;
  };
  status: Record<string, string>;
  units: {
    days: string;
  };
  errors: {
    loadDashboard: string;
    submitApplication: string;
    requestPayout: string;
  };
};

type DashboardResponse = {
  userEmail: string;
  referralLink: string;
  dashboard: {
    program: {
      defaultFirstOrderRateBps: number;
      defaultRenewalRateBps: number;
      minimumPayoutAmountCents: number;
      cookieTtlDays: number;
      commissionConfirmDays: number;
    };
    profile: {
      id: string;
      code: string;
      discountCode: string | null;
      paypalEmail: string | null;
      pendingCommissionCents: number;
      availableCommissionCents: number;
      paidCommissionCents: number;
      referredUsersCount: number;
    } | null;
    latestApplication: {
      status: string;
      rejectReason: string | null;
    } | null;
    pendingPayout: {
      id: string;
    } | null;
    dailyStats: Array<{
      date: string;
      visitors: number;
      registers: number;
      payments: number;
      earningsCents: number;
      currency: string;
    }>;
  };
};

function renderStatusTone(status?: string | null) {
  if (status === "active" || status === "approved" || status === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "pending" || status === "requested") {
    return "bg-amber-100 text-amber-700";
  }

  if (
    status === "suspended" ||
    status === "blacklisted" ||
    status === "rejected" ||
    status === "canceled" ||
    status === "closed"
  ) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-muted text-muted-foreground";
}

function formatMoney(cents: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function formatMetricMoney(cents: number | null | undefined, currency = "USD") {
  const formatted = formatMoney(cents, currency);
  return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
}

function formatPercent(bps: number | null | undefined) {
  if (!bps) {
    return "0%";
  }
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

function formatDashboardDate(dateKey: string, locale: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1).toLocaleDateString(locale);
}

export function AffiliateSettingsClient({
  locale,
  copy,
}: {
  locale: string;
  copy: SettingsAffiliateCopy;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null,
  );
  const [authError, setAuthError] = useState(false);
  const [desiredTier, setDesiredTier] = useState("standard");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialAccount, setSocialAccount] = useState("");
  const [channelSummary, setChannelSummary] = useState("");
  const [applicationNote, setApplicationNote] = useState("");

  async function loadDashboard() {
    setLoading(true);
    try {
      const response = await fetch("/api/affiliate/dashboard", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 0) {
        if (payload?.message?.includes("no auth")) {
          setAuthError(true);
          setDashboardData(null);
          return;
        }
        throw new Error(payload?.message || copy.errors.loadDashboard);
      }

      const data = payload.data as DashboardResponse;
      setDashboardData(data);
      setAuthError(false);
      setPaypalEmail((current) => current || data.userEmail || "");
    } catch (error: any) {
      toast.error(error?.message || copy.errors.loadDashboard);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const dashboard = dashboardData?.dashboard;
  const canApply =
    !!dashboard &&
    !dashboard.profile &&
    dashboard.latestApplication?.status !== "pending";
  const canRequestPayout =
    !!dashboard?.profile &&
    !dashboard.pendingPayout &&
    dashboard.profile.availableCommissionCents >=
      dashboard.program.minimumPayoutAmountCents;

  const metrics = useMemo(() => {
    if (!dashboard?.profile) {
      return [];
    }

    return [
      {
        label: copy.dashboard.metrics.total,
        value: formatMetricMoney(
          dashboard.profile.pendingCommissionCents +
            dashboard.profile.availableCommissionCents +
            dashboard.profile.paidCommissionCents,
        ),
      },
      {
        label: copy.dashboard.metrics.pending,
        value: formatMetricMoney(dashboard.profile.pendingCommissionCents),
      },
      {
        label: copy.dashboard.metrics.available,
        value: formatMetricMoney(dashboard.profile.availableCommissionCents),
      },
      {
        label: copy.dashboard.metrics.paid,
        value: formatMetricMoney(dashboard.profile.paidCommissionCents),
      },
      {
        label: copy.dashboard.metrics.referrals,
        value: String(dashboard.profile.referredUsersCount || 0),
      },
    ];
  }, [dashboard, copy]);

  const dashboardRows = useMemo(
    () =>
      (dashboard?.dailyStats || []).map((item) => ({
        id: item.date,
        date: formatDashboardDate(item.date, locale),
        visitors: String(item.visitors),
        registers: String(item.registers),
        payments: String(item.payments),
        earnings: formatMoney(item.earningsCents, item.currency),
      })),
    [dashboard, locale],
  );

  async function handleSubmitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/affiliate/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          desiredTier,
          paypalEmail,
          socialPlatform,
          socialAccount,
          channelSummary,
          applicationNote,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 0) {
        throw new Error(payload?.message || copy.errors.submitApplication);
      }

      toast.success(copy.application.submit);
      await loadDashboard();
    } catch (error: any) {
      toast.error(error?.message || copy.errors.submitApplication);
    } finally {
      setSubmitting(false);
    }
  }

  if (authError) {
    return <Empty message={copy.authEmpty} />;
  }

  if (loading || !dashboard) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-6 w-[40rem] max-w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (dashboard.profile) {
    return (
      <AffiliateDashboard
        locale={locale}
        copy={{
          heading: copy.dashboard.heading,
          intro: copy.dashboard.intro,
          linkTitle: copy.dashboard.linkTitle,
          linkDescription: copy.dashboard.linkDescription,
          copy: copy.dashboard.copy,
          copied: copy.dashboard.copied,
          discountCodeLabel: copy.dashboard.copyDiscountCode,
          dashboard: copy.dashboard.tabs.dashboard,
          commissions: copy.dashboard.tabs.commissions,
          payouts: copy.dashboard.tabs.payouts,
          date: copy.dashboard.table.date,
          visitors: copy.dashboard.table.visitors,
          registers: copy.dashboard.table.registers,
          payments: copy.dashboard.table.payments,
          earnings: copy.dashboard.table.earnings,
          empty: copy.dashboard.table.empty,
          payoutTitle: copy.payout.title,
          payoutDescription: copy.payout.description,
          payoutMinimum: copy.payout.minimum,
          payoutInProgress: copy.payout.inProgress,
          payoutPaypal: copy.payout.paypalEmail,
          payoutNote: copy.payout.note,
          payoutPlaceholder: copy.payout.placeholder,
          payoutSubmit: copy.payout.submit,
          payoutError: copy.errors.requestPayout,
          firstOrder: copy.lists.firstOrder,
          renewal: copy.lists.renewal,
          statusLabels: copy.status,
        }}
        referralLink={dashboardData.referralLink}
        discountCode={dashboard.profile.discountCode || ""}
        metrics={metrics}
        dashboardRows={dashboardRows}
        canRequestPayout={canRequestPayout}
        payoutInProgress={!!dashboard.pendingPayout}
        minimumPayout={formatMoney(dashboard.program.minimumPayoutAmountCents)}
        payoutDefaultEmail={
          dashboard.profile.paypalEmail || dashboardData.userEmail || ""
        }
        affiliateProfileId={dashboard.profile.id}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle className="text-white">{copy.application.title}</CardTitle>
          <CardDescription className="text-stone-400">
            {copy.application.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.latestApplication ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-300">
                  {copy.application.latestStatus}
                </span>
                <Badge
                  className={renderStatusTone(
                    dashboard.latestApplication.status,
                  )}
                >
                  {copy.status[dashboard.latestApplication.status] ||
                    dashboard.latestApplication.status}
                </Badge>
              </div>
              {dashboard.latestApplication.status === "pending" ? (
                <p className="mt-3 text-stone-500">
                  {copy.application.pendingDescription}
                </p>
              ) : null}
              {dashboard.latestApplication.rejectReason ? (
                <p className="mt-3 text-rose-700">
                  {copy.application.rejectReason}:{" "}
                  {dashboard.latestApplication.rejectReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {canApply ? (
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desiredTier">
                  {copy.application.desiredTier}
                </Label>
                <select
                  id="desiredTier"
                  value={desiredTier}
                  onChange={(event) => setDesiredTier(event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                >
                  <option value="standard">{copy.application.standard}</option>
                  <option value="kol">{copy.application.kol}</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paypalEmail">
                    {copy.application.paypalEmail}
                  </Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                    className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialPlatform">
                    {copy.application.socialPlatform}
                  </Label>
                  <Input
                    id="socialPlatform"
                    value={socialPlatform}
                    onChange={(event) => setSocialPlatform(event.target.value)}
                    className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialAccount">
                  {copy.application.socialAccount}
                </Label>
                <Input
                  id="socialAccount"
                  value={socialAccount}
                  onChange={(event) => setSocialAccount(event.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channelSummary">
                  {copy.application.channelSummary}
                </Label>
                <Textarea
                  id="channelSummary"
                  value={channelSummary}
                  onChange={(event) => setChannelSummary(event.target.value)}
                  className="min-h-28 rounded-xl border-white/10 bg-white/[0.03] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationNote">
                  {copy.application.applicationNote}
                </Label>
                <Textarea
                  id="applicationNote"
                  value={applicationNote}
                  onChange={(event) => setApplicationNote(event.target.value)}
                  className="min-h-24 rounded-xl border-white/10 bg-white/[0.03] text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                {copy.application.submit}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle className="text-white">{copy.agreement.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-400">{copy.agreement.cookieTtl}</span>
            <span>
              {dashboard.program.cookieTtlDays} {copy.units.days}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-400">{copy.agreement.confirmDays}</span>
            <span>
              {dashboard.program.commissionConfirmDays} {copy.units.days}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-400">{copy.agreement.rates}</span>
            <span>
              {formatPercent(dashboard.program.defaultFirstOrderRateBps)} /{" "}
              {formatPercent(dashboard.program.defaultRenewalRateBps)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-400">
              {copy.agreement.minimumPayout}
            </span>
            <span>
              {formatMoney(dashboard.program.minimumPayoutAmountCents)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
