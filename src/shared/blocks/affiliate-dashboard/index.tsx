"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

type MetricCard = {
  label: string;
  value: string;
};

type DashboardRow = {
  id: string;
  date: string;
  visitors: string;
  registers: string;
  payments: string;
  earnings: string;
};

type ListRow = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: string;
  statusTone: string;
};

type CommissionApiItem = {
  id: string;
  commissionType: string;
  status: string;
  commissionAmountCents: number;
  currency: string;
  occurredAt: string;
  createdAt: string;
};

type PayoutApiItem = {
  id: string;
  payoutNo: string;
  status: string;
  requestedAmountCents: number;
  currency: string;
  requestedAt: string;
  createdAt: string;
};

type AffiliateDashboardCopy = {
  heading: string;
  intro: string;
  linkTitle: string;
  linkDescription: string;
  copy: string;
  copied: string;
  discountCodeLabel: string;
  dashboard: string;
  commissions: string;
  payouts: string;
  date: string;
  visitors: string;
  registers: string;
  payments: string;
  earnings: string;
  empty: string;
  payoutTitle: string;
  payoutDescription: string;
  payoutMinimum: string;
  payoutInProgress: string;
  payoutPaypal: string;
  payoutNote: string;
  payoutPlaceholder: string;
  payoutSubmit: string;
  payoutError: string;
  firstOrder: string;
  renewal: string;
  statusLabels: Record<string, string>;
};

type AffiliateDashboardProps = {
  locale: string;
  copy: AffiliateDashboardCopy;
  referralLink: string;
  discountCode: string;
  metrics: MetricCard[];
  dashboardRows: DashboardRow[];
  canRequestPayout: boolean;
  payoutInProgress: boolean;
  minimumPayout: string;
  payoutDefaultEmail: string;
  affiliateProfileId: string;
};

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <Badge
      className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      {label}
    </Badge>
  );
}

function getStatusTone(status?: string | null) {
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

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function AffiliateDashboard({
  locale,
  copy,
  referralLink,
  discountCode,
  metrics,
  dashboardRows,
  canRequestPayout,
  payoutInProgress,
  minimumPayout,
  payoutDefaultEmail,
  affiliateProfileId,
}: AffiliateDashboardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [commissionItems, setCommissionItems] = useState<CommissionApiItem[]>(
    [],
  );
  const [payoutItems, setPayoutItems] = useState<PayoutApiItem[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState(payoutDefaultEmail);
  const [payoutNote, setPayoutNote] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function handleCopyDiscountCode() {
    if (!discountCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "commissions" || commissionItems.length > 0) {
      return;
    }

    let cancelled = false;
    setCommissionLoading(true);

    fetch("/api/affiliate/commissions?limit=20", {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload?.code === 0) {
          setCommissionItems(payload.data?.items || []);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCommissionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, commissionItems.length]);

  useEffect(() => {
    if (activeTab !== "payouts" || payoutItems.length > 0) {
      return;
    }

    let cancelled = false;
    setPayoutLoading(true);

    fetch("/api/affiliate/payouts?limit=20", {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload?.code === 0) {
          setPayoutItems(payload.data?.items || []);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPayoutLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, payoutItems.length]);

  const commissionRows = useMemo<ListRow[]>(
    () =>
      commissionItems.map((item) => ({
        id: item.id,
        title:
          item.commissionType === "renewal" ? copy.renewal : copy.firstOrder,
        subtitle: new Date(item.occurredAt).toLocaleString(locale),
        amount: formatMoney(item.commissionAmountCents, item.currency),
        status: copy.statusLabels[item.status] || item.status,
        statusTone: getStatusTone(item.status),
      })),
    [commissionItems, copy.firstOrder, copy.renewal, copy.statusLabels, locale],
  );

  const payoutRows = useMemo<ListRow[]>(
    () =>
      payoutItems.map((item) => ({
        id: item.id,
        title: item.payoutNo,
        subtitle: new Date(item.requestedAt || item.createdAt).toLocaleString(
          locale,
        ),
        amount: formatMoney(item.requestedAmountCents, item.currency),
        status: copy.statusLabels[item.status] || item.status,
        statusTone: getStatusTone(item.status),
      })),
    [payoutItems, copy.statusLabels, locale],
  );

  async function handlePayoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (payoutSubmitting || !canRequestPayout) {
      return;
    }

    try {
      setPayoutSubmitting(true);
      const response = await fetch("/api/affiliate/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProfileId,
          paypalEmail,
          note: payoutNote,
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.code !== 0) {
        throw new Error(payload?.message || copy.payoutError);
      }

      toast.success(copy.payoutSubmit);
      setPayoutItems([]);
      setActiveTab("payouts");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || copy.payoutError);
    } finally {
      setPayoutSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 text-white [font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif]">
      <div className="space-y-3">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px] xl:text-[38px]">
          {copy.heading}
        </h1>
        <p className="max-w-[1000px] text-sm leading-6 text-[#d8a63a] sm:text-[15px]">
          {copy.intro}
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[24px]">
            {copy.linkTitle}
          </h2>
          <p className="max-w-[1000px] text-sm leading-6 text-stone-400 sm:text-[15px]">
            {copy.linkDescription}
          </p>
        </div>
        <div className="flex max-w-[720px] flex-col gap-3 md:flex-row">
          <Input
            value={referralLink}
            readOnly
            className="h-11 rounded-2xl border-white/20 bg-transparent px-4 text-sm text-stone-200"
          />
          <Button
            type="button"
            onClick={handleCopy}
            className="h-11 rounded-2xl border border-[#6571ff] bg-transparent px-5 text-sm font-semibold text-[#7d88ff] hover:bg-[#6571ff]/10 hover:text-[#96a0ff] md:min-w-[148px]"
          >
            {copied ? (
              <>
                <Check className="mr-2 size-4" />
                {copy.copied}
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                {copy.copy}
              </>
            )}
          </Button>
        </div>
        {discountCode ? (
          <div className="flex max-w-[520px] flex-col gap-3 md:flex-row">
            <Input
              value={discountCode}
              readOnly
              className="h-11 rounded-2xl border-white/20 bg-transparent px-4 text-sm uppercase tracking-[0.18em] text-stone-200"
            />
            <Button
              type="button"
              onClick={handleCopyDiscountCode}
              className="h-11 rounded-2xl border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-white hover:bg-white/[0.08] md:min-w-[168px]"
            >
              {copy.discountCodeLabel}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-x-6 gap-y-7 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item) => (
          <div key={item.label} className="space-y-2">
            <p className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[38px] xl:text-[44px]">
              {item.value}
            </p>
            <p className="max-w-[200px] text-sm leading-5 text-stone-400">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      <Tabs
        defaultValue="dashboard"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList className="h-auto gap-7 rounded-none border-0 border-b border-white/10 bg-transparent p-0 text-stone-500">
          <TabsTrigger
            value="dashboard"
            className="rounded-none border-0 border-b-2 border-transparent px-0 pb-3 pt-0 text-[15px] font-medium data-[state=active]:border-[#7d88ff] data-[state=active]:bg-transparent data-[state=active]:text-[#8c95ff] data-[state=active]:shadow-none"
          >
            {copy.dashboard}
          </TabsTrigger>
          <TabsTrigger
            value="commissions"
            className="rounded-none border-0 border-b-2 border-transparent px-0 pb-3 pt-0 text-[15px] font-medium data-[state=active]:border-[#7d88ff] data-[state=active]:bg-transparent data-[state=active]:text-[#8c95ff] data-[state=active]:shadow-none"
          >
            {copy.commissions}
          </TabsTrigger>
          <TabsTrigger
            value="payouts"
            className="rounded-none border-0 border-b-2 border-transparent px-0 pb-3 pt-0 text-[15px] font-medium data-[state=active]:border-[#7d88ff] data-[state=active]:bg-transparent data-[state=active]:text-[#8c95ff] data-[state=active]:shadow-none"
          >
            {copy.payouts}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 pb-4 text-sm text-stone-400">
                <span>{copy.date}</span>
                <span>{copy.visitors}</span>
                <span>{copy.registers}</span>
                <span>{copy.payments}</span>
                <span className="text-right">{copy.earnings}</span>
              </div>
              {dashboardRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  {copy.empty}
                </p>
              ) : (
                dashboardRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/5 py-3 text-sm text-stone-200"
                  >
                    <span>{row.date}</span>
                    <span>{row.visitors}</span>
                    <span>{row.registers}</span>
                    <span>{row.payments}</span>
                    <span className="text-right">{row.earnings}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="mt-0 space-y-3">
          {commissionLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 animate-pulse rounded-2xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : commissionRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">
              {copy.empty}
            </p>
          ) : (
            commissionRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-white/5 py-4"
              >
                <div className="space-y-1">
                  <p className="text-[15px] font-medium text-white">
                    {row.title}
                  </p>
                  <p className="text-sm text-stone-500">{row.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[15px] font-medium text-white">
                    {row.amount}
                  </span>
                  <StatusBadge label={row.status} tone={row.statusTone} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="payouts" className="mt-0 space-y-5">
          <form
            onSubmit={handlePayoutSubmit}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold text-white">
                  {copy.payoutTitle}
                </h3>
                <p className="text-sm text-stone-400">
                  {copy.payoutDescription}
                </p>
                <p className="text-sm text-stone-500">
                  {copy.payoutMinimum}: {minimumPayout}
                </p>
                {payoutInProgress ? (
                  <p className="text-sm text-amber-300">
                    {copy.payoutInProgress}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-paypal">{copy.payoutPaypal}</Label>
                  <Input
                    id="dashboard-paypal"
                    type="email"
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                    className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-sm text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-note">{copy.payoutNote}</Label>
                  <Input
                    id="dashboard-note"
                    value={payoutNote}
                    onChange={(event) => setPayoutNote(event.target.value)}
                    placeholder={copy.payoutPlaceholder}
                    className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-stone-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!canRequestPayout || payoutSubmitting}
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                {copy.payoutSubmit}
              </Button>
            </div>
          </form>

          {payoutLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 animate-pulse rounded-2xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : payoutRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">
              {copy.empty}
            </p>
          ) : (
            payoutRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-white/5 py-4"
              >
                <div className="space-y-1">
                  <p className="text-[15px] font-medium text-white">
                    {row.title}
                  </p>
                  <p className="text-sm text-stone-500">{row.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[15px] font-medium text-white">
                    {row.amount}
                  </span>
                  <StatusBadge label={row.status} tone={row.statusTone} />
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
