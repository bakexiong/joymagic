"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/core/i18n/navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import type { AffiliateProfileAttributionDetails } from "@/shared/models/affiliate";

export type AffiliateSection =
  | "overview"
  | "affiliates"
  | "applications"
  | "commissions"
  | "payouts"
  | "settings";

type OverviewData = {
  totalAffiliates: number;
  pendingApplications: number;
  monthlyCommissionCents: number;
  pendingPayoutAmountCents: number;
  clicksThisMonth: number;
  signups: number;
  firstOrders: number;
  recentCommissions: Array<{
    id: string;
    commissionType: string;
    commissionAmountCents: number;
    currency: string;
    status: string;
    affiliateUser?: {
      name?: string | null;
      email?: string | null;
    };
  }>;
  latestActivities: Array<{
    type: "payout" | "application" | "commission";
    text: string;
    createdAt: string;
  }>;
};

type AffiliateItem = {
  id: string;
  code: string;
  discountCode?: string | null;
  discountExpiresAt?: string | null;
  discountEnabled?: boolean;
  customDiscountRateBps?: number | null;
  tier: string;
  status: string;
  customFirstOrderRateBps?: number | null;
  customRenewalRateBps?: number | null;
  referredUsersCount: number;
  pendingCommissionCents: number;
  availableCommissionCents: number;
  user?: {
    name?: string | null;
    email?: string | null;
  };
};

type ApplicationItem = {
  id: string;
  createdAt: string;
  status: string;
  socialAccount?: string | null;
  channelSummary?: string | null;
  paypalEmail?: string | null;
  applicationNote?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  };
};

type CommissionItem = {
  id: string;
  commissionType: string;
  baseAmountCents: number;
  commissionRateBps: number;
  commissionAmountCents: number;
  currency: string;
  status: string;
  occurredAt: string;
  affiliateUser?: {
    name?: string | null;
    email?: string | null;
  };
  referredUser?: {
    name?: string | null;
    email?: string | null;
  };
};

type PayoutItem = {
  id: string;
  status: string;
  paypalEmail?: string | null;
  requestedAmountCents: number;
  approvedAmountCents: number | null;
  currency: string;
  requestedAt: string;
  note?: string | null;
  affiliateUser?: {
    name?: string | null;
    email?: string | null;
  };
};

type SettingsData = {
  defaultFirstOrderRateBps: number;
  defaultRenewalRateBps: number;
  defaultDiscountRateBps: number;
  minimumPayoutAmountCents: number;
  cookieTtlDays: number;
  commissionConfirmDays: number;
  antiFraudWindowMinutes: number;
  maxClicksPerIp: number;
  agreementText?: string | null;
};

type ApiPayload<T> = {
  code: number;
  message: string;
  data: T;
};

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  action: (() => Promise<void>) | null;
};

type AffiliateActionDialogState = {
  open: boolean;
  profile: AffiliateItem | null;
};

const PROFILE_STATUS = {
  active: "active",
  suspended: "suspended",
  blacklisted: "blacklisted",
} as const;

const PAYOUT_STATUS = {
  requested: "requested",
  approved: "approved",
  paid: "paid",
  rejected: "rejected",
} as const;

function toneClass(tone?: string) {
  return cn(
    "text-3xl font-semibold tracking-tight text-foreground",
    tone === "success" && "text-emerald-700",
    tone === "warning" && "text-amber-700",
    tone === "danger" && "text-rose-600",
  );
}

function statusTone(status: string) {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
    (status === "normal" || status === "active" || status === "available") &&
      "bg-lime-100 text-lime-700",
    (status === "pending" ||
      status === "confirming" ||
      status === "requested") &&
      "bg-amber-100 text-amber-700",
    (status === "suspended" || status === "locked") &&
      "bg-stone-200 text-stone-700",
    (status === "blacklisted" ||
      status === "rejected" ||
      status === "reversed" ||
      status === "canceled") &&
      "bg-rose-100 text-rose-700",
    status === "paid" && "bg-sky-100 text-sky-700",
    status === "approved" && "bg-lime-100 text-lime-700",
    status === "payout_requested" && "bg-amber-100 text-amber-700",
  );
}

function applicationStatusLabel(
  status: string,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (status === "approved") {
    return t("status.approved");
  }
  if (status === "rejected") {
    return t("status.rejected");
  }
  if (status === "canceled") {
    return t("status.canceled");
  }
  return t("status.pending");
}

function createRandomDiscountCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);

  const suffix = Array.from(bytes, (value) => alphabet[value % alphabet.length])
    .join("")
    .slice(0, 8);

  return `ZX${suffix}`;
}

function initialsBadge(name?: string | null) {
  const initials =
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("") || "AF";

  const tone = [
    "bg-sky-100 text-sky-700",
    "bg-lime-100 text-lime-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
    "bg-stone-200 text-stone-700",
  ][initials.charCodeAt(0) % 5];

  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold",
        tone,
      )}
    >
      {initials}
    </span>
  );
}

function formatCents(cents: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function bpsToPercent(bps: number | null | undefined) {
  if (!bps) {
    return "0%";
  }
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

function getEffectiveRateBps(
  customRateBps: number | null | undefined,
  defaultRateBps: number | null | undefined,
) {
  return customRateBps && customRateBps > 0
    ? customRateBps
    : (defaultRateBps ?? 0);
}

function hasCustomRateBps(rateBps: number | null | undefined) {
  return !!rateBps && rateBps > 0;
}

function formatDateTime(value?: string | Date | null, locale = "zh-CN") {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString(locale);
}

function formatDateTimeLocalInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function FilterLinks({
  items,
  active,
  basePath,
}: {
  items: Array<{ key: string; label: string }>;
  active: string;
  basePath: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`${basePath}?status=${item.key}`}
          className="cursor-pointer"
        >
          <Badge
            variant={active === item.key ? "default" : "secondary"}
            className="cursor-pointer rounded-full px-3 py-1 text-sm transition-colors"
          >
            {item.label}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="py-12 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="py-12 text-center text-muted-foreground">
        Loading...
      </CardContent>
    </Card>
  );
}

export function AffiliateAttributionDetailsContent({
  details,
  detailsLoading,
  locale,
}: {
  details: AffiliateProfileAttributionDetails | null;
  detailsLoading: boolean;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">注册用户明细</div>
            <div className="text-xs text-muted-foreground">
              查看该推广码带来的注册用户与当前归因状态
            </div>
          </div>
          <Badge variant="secondary">
            {details?.registrations.length ?? 0} 人
          </Badge>
        </div>
        {detailsLoading ? (
          <div className="py-6 text-sm text-muted-foreground">加载中...</div>
        ) : !details?.registrations.length ? (
          <div className="py-6 text-sm text-muted-foreground">
            暂无注册归因记录
          </div>
        ) : (
          <div className="space-y-3">
            {details.registrations.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 bg-background/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {item.referredUser?.email ||
                        item.referredUser?.name ||
                        "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      注册时间：{formatDateTime(item.createdAt, locale)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={statusTone(item.status)}>
                      {item.status === "converted" ? "已转化" : item.status}
                    </span>
                    <Badge variant="outline">
                      {item.attributionModel || "first_touch"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    首次访问：{formatDateTime(item.firstVisitedAt, locale)}
                  </div>
                  <div>
                    最近访问：{formatDateTime(item.lastVisitedAt, locale)}
                  </div>
                  <div>
                    Cookie 到期：{formatDateTime(item.cookieExpiresAt, locale)}
                  </div>
                  <div>
                    转化时间：{formatDateTime(item.convertedAt, locale)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    首单：
                    {item.firstOrder?.orderNo
                      ? `${item.firstOrder.orderNo} / ${formatCents(
                          item.firstOrder.amount,
                          item.firstOrder.currency || "USD",
                        )}`
                      : "-"}
                  </div>
                  <div>
                    首订：
                    {item.firstSubscription?.subscriptionNo
                      ? `${item.firstSubscription.subscriptionNo} / ${formatCents(
                          item.firstSubscription.amount,
                          item.firstSubscription.currency || "USD",
                        )}`
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">订单转化明细</div>
            <div className="text-xs text-muted-foreground">
              查看已产生佣金的首单与续订转化用户
            </div>
          </div>
          <Badge variant="secondary">
            {details?.conversions.length ?? 0} 条
          </Badge>
        </div>
        {detailsLoading ? (
          <div className="py-6 text-sm text-muted-foreground">加载中...</div>
        ) : !details?.conversions.length ? (
          <div className="py-6 text-sm text-muted-foreground">
            暂无订单转化记录
          </div>
        ) : (
          <div className="space-y-3">
            {details.conversions.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 bg-background/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {item.referredUser?.email ||
                        item.referredUser?.name ||
                        "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      转化时间：{formatDateTime(item.occurredAt, locale)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {item.commissionType === "renewal" ? "续订" : "首单"}
                    </Badge>
                    <span className={statusTone(item.status)}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    来源订单：
                    {item.sourceOrder?.orderNo
                      ? `${item.sourceOrder.orderNo} / ${formatCents(
                          item.sourceOrder.amount,
                          item.sourceOrder.currency || item.currency,
                        )}`
                      : "-"}
                  </div>
                  <div>
                    来源订阅：
                    {item.sourceSubscription?.subscriptionNo
                      ? `${item.sourceSubscription.subscriptionNo} / ${formatCents(
                          item.sourceSubscription.amount,
                          item.sourceSubscription.currency || item.currency,
                        )}`
                      : "-"}
                  </div>
                  <div>佣金比例：{bpsToPercent(item.commissionRateBps)}</div>
                  <div>
                    佣金金额：
                    {formatCents(item.commissionAmountCents, item.currency)}
                  </div>
                  <div>
                    订单金额：{formatCents(item.baseAmountCents, item.currency)}
                  </div>
                  <div>
                    可结算时间：{formatDateTime(item.availableAt, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiPayload<T>;

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
}

export function AffiliateSectionContent({
  section,
  query,
  status,
}: {
  section: AffiliateSection;
  query?: string;
  status?: string;
}) {
  const t = useTranslations("admin.affiliate");
  const locale = useLocale();
  const activeStatus = status || "all";

  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [affiliates, setAffiliates] = useState<{
    items: AffiliateItem[];
    counts: Record<string, number>;
  } | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [payouts, setPayouts] = useState<{
    items: PayoutItem[];
    counts: Record<string, number>;
  } | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>(
    {},
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "",
    tone: "default",
    action: null,
  });
  const [affiliateActionDialog, setAffiliateActionDialog] =
    useState<AffiliateActionDialogState>({
      open: false,
      profile: null,
    });
  const confirmDialogNode = (
    <ConfirmActionDialog
      open={confirmDialog.open}
      title={confirmDialog.title}
      description={confirmDialog.description}
      confirmLabel={confirmDialog.confirmLabel}
      tone={confirmDialog.tone}
      onOpenChange={(open) =>
        setConfirmDialog((current) => ({
          ...current,
          open,
          action: open ? current.action : null,
        }))
      }
      onConfirm={() => void handleConfirmAction()}
    />
  );
  const activeAffiliateProfile = affiliateActionDialog.profile;

  async function loadSectionData() {
    setLoading(true);
    try {
      if (section === "overview") {
        const data = await requestJson<{ overview: OverviewData }>(
          "/api/admin/affiliate/overview",
        );
        setOverview(data.overview);
      } else if (section === "affiliates") {
        const search = new URLSearchParams();
        if (query) {
          search.set("q", query);
        }
        if (activeStatus) {
          search.set("status", activeStatus);
        }
        const [data, settingsData] = await Promise.all([
          requestJson<{
            items: AffiliateItem[];
            counts: Record<string, number>;
          }>(`/api/admin/affiliate/affiliates?${search.toString()}`),
          requestJson<{ program: SettingsData }>(
            "/api/admin/affiliate/settings",
          ),
        ]);
        setAffiliates(data);
        setSettings(settingsData.program);
        setDiscountDrafts(
          Object.fromEntries(
            data.items.map((item) => [item.id, item.discountCode || ""]),
          ),
        );
      } else if (section === "applications") {
        const search = new URLSearchParams();
        if (query) {
          search.set("q", query);
        }
        if (activeStatus) {
          search.set("status", activeStatus);
        }
        const data = await requestJson<{ items: ApplicationItem[] }>(
          `/api/admin/affiliate/applications?${search.toString()}`,
        );
        setApplications(data.items);
      } else if (section === "commissions") {
        const search = new URLSearchParams();
        if (query) {
          search.set("q", query);
        }
        if (activeStatus) {
          search.set("status", activeStatus);
        }
        const data = await requestJson<{ items: CommissionItem[] }>(
          `/api/admin/affiliate/commissions?${search.toString()}`,
        );
        setCommissions(data.items);
      } else if (section === "payouts") {
        const search = new URLSearchParams();
        if (query) {
          search.set("q", query);
        }
        if (activeStatus) {
          search.set("status", activeStatus);
        }
        const data = await requestJson<{
          items: PayoutItem[];
          counts: Record<string, number>;
        }>(`/api/admin/affiliate/payouts?${search.toString()}`);
        setPayouts(data);
      } else {
        const data = await requestJson<{ program: SettingsData }>(
          "/api/admin/affiliate/settings",
        );
        setSettings(data.program);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load affiliate admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSectionData();
  }, [section, query, activeStatus]);

  async function withMutation(key: string, action: () => Promise<void>) {
    setSubmittingKey(key);
    try {
      await action();
      toast.success("Saved");
      await loadSectionData();
    } catch (error: any) {
      toast.error(error?.message || "Operation failed");
    } finally {
      setSubmittingKey("");
    }
  }

  function openConfirmDialog(options: Omit<ConfirmDialogState, "open">) {
    setConfirmDialog({
      open: true,
      ...options,
    });
  }

  async function handleConfirmAction() {
    if (!confirmDialog.action) {
      return;
    }
    await confirmDialog.action();
    setConfirmDialog((current) => ({
      ...current,
      open: false,
      action: null,
    }));
  }

  async function handleCreateAffiliate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await withMutation("create-affiliate", async () => {
      await requestJson("/api/admin/affiliate/affiliates", {
        method: "POST",
        body: JSON.stringify({
          email: String(formData.get("email") || ""),
          name: String(formData.get("name") || ""),
          password: String(formData.get("password") || ""),
          paypalEmail: String(formData.get("paypalEmail") || ""),
          socialPlatform: String(formData.get("socialPlatform") || ""),
          socialAccount: String(formData.get("socialAccount") || ""),
          channelSummary: String(formData.get("channelSummary") || ""),
          tier: String(formData.get("tier") || "standard"),
          profileNote: String(formData.get("profileNote") || ""),
        }),
      });
      event.currentTarget.reset();
    });
  }

  async function handleUpdateRates(
    event: FormEvent<HTMLFormElement>,
    profileId: string,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await withMutation(`rates-${profileId}`, async () => {
      const firstOrderRate = String(
        formData.get("firstOrderRate") || "",
      ).trim();
      const renewalRate = String(formData.get("renewalRate") || "").trim();

      await requestJson(`/api/admin/affiliate/affiliates/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({
          mode: "rates",
          firstOrderRate: firstOrderRate || null,
          renewalRate: renewalRate || null,
        }),
      });
    });
  }

  async function handleUpdateDiscount(
    event: FormEvent<HTMLFormElement>,
    profileId: string,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await withMutation(`discount-${profileId}`, async () => {
      await requestJson(`/api/admin/affiliate/affiliates/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({
          mode: "discount",
          discountCode: String(formData.get("discountCode") || ""),
          discountExpiresAt: String(formData.get("discountExpiresAt") || ""),
          customDiscountRateBps:
            Number(formData.get("customDiscountRate") || 0) * 100,
          discountEnabled: true,
        }),
      });
    });
  }

  async function handleProfileAction(profileId: string, action: string) {
    await withMutation(`${action}-${profileId}`, async () => {
      await requestJson(`/api/admin/affiliate/affiliates/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({
          mode: "state",
          action,
        }),
      });
    });
  }

  function handleGenerateDiscount(profileId: string) {
    setDiscountDrafts((current) => ({
      ...current,
      [profileId]: createRandomDiscountCode(),
    }));
  }

  async function handleApplicationReview(
    applicationId: string,
    decision: string,
    rejectReason?: string,
  ) {
    await withMutation(`${decision}-${applicationId}`, async () => {
      await requestJson(
        `/api/admin/affiliate/applications/${applicationId}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            decision,
            rejectReason,
          }),
        },
      );
    });
  }

  async function handlePayoutReview(
    payoutId: string,
    decision: string,
    note?: string,
  ) {
    await withMutation(`${decision}-${payoutId}`, async () => {
      await requestJson(`/api/admin/affiliate/payouts/${payoutId}/review`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          note,
        }),
      });
    });
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await withMutation("settings", async () => {
      await requestJson("/api/admin/affiliate/settings", {
        method: "PUT",
        body: JSON.stringify({
          defaultFirstOrderRate: String(
            formData.get("defaultFirstOrderRate") || "0",
          ),
          defaultRenewalRate: String(formData.get("defaultRenewalRate") || "0"),
          defaultDiscountRate: String(
            formData.get("defaultDiscountRate") || "0",
          ),
          minimumPayoutAmount: String(
            formData.get("minimumPayoutAmount") || "0",
          ),
          cookieTtlDays: String(formData.get("cookieTtlDays") || "0"),
          commissionConfirmDays: String(
            formData.get("commissionConfirmDays") || "0",
          ),
          antiFraudWindowMinutes: String(
            formData.get("antiFraudWindowMinutes") || "0",
          ),
          maxClicksPerIp: String(formData.get("maxClicksPerIp") || "0"),
          agreementText: String(formData.get("agreementText") || ""),
        }),
      });
    });
  }

  if (loading) {
    return <LoadingState />;
  }

  if (section === "overview" && overview) {
    const stats = [
      {
        key: "total_affiliates",
        value: String(overview.totalAffiliates),
        hint: "",
        tone: "default",
      },
      {
        key: "pending_applications",
        value: String(overview.pendingApplications),
        hint: "需要处理",
        tone: "danger",
      },
      {
        key: "monthly_commission",
        value: formatCents(overview.monthlyCommissionCents),
        hint: "",
        tone: "success",
      },
      {
        key: "pending_payout_amount",
        value: formatCents(overview.pendingPayoutAmountCents),
        hint: "",
        tone: "warning",
      },
      {
        key: "clicks",
        value: String(overview.clicksThisMonth),
        hint: "",
        tone: "default",
      },
      {
        key: "signups",
        value: String(overview.signups),
        hint: "",
        tone: "default",
      },
      {
        key: "first_orders",
        value: String(overview.firstOrders),
        hint: "",
        tone: "default",
      },
    ];

    return (
      <>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.slice(0, 4).map((item) => (
              <Card key={item.key} className="border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>
                    {t(`overview.stats.${item.key}`)}
                  </CardDescription>
                  <CardTitle className={toneClass(item.tone)}>
                    {item.value}
                  </CardTitle>
                </CardHeader>
                {item.hint ? (
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {item.hint}
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {stats.slice(4).map((item) => (
              <Card key={item.key} className="border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>
                    {t(`overview.stats.${item.key}`)}
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight">
                    {item.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/60 shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{t("overview.stats.recent_commissions")}</CardTitle>
                <Button
                  asChild
                  variant="link"
                  className="px-0 text-sm text-primary"
                >
                  <Link href="/admin/affiliate/commissions">
                    {t("overview.stats.view_all")}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr] gap-4 text-sm font-medium text-muted-foreground">
                  <div>{t("overview.table.affiliate")}</div>
                  <div>{t("overview.table.type")}</div>
                  <div>{t("overview.table.amount")}</div>
                  <div>{t("overview.table.status")}</div>
                </div>
                {overview.recentCommissions.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">
                    暂无佣金记录
                  </p>
                ) : null}
                {overview.recentCommissions.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr] items-center gap-4 border-t border-border/50 pt-4"
                  >
                    <div className="flex items-center gap-3">
                      {initialsBadge(item.affiliateUser?.name)}
                      <span className="font-medium">
                        {item.affiliateUser?.name ||
                          item.affiliateUser?.email ||
                          "-"}
                      </span>
                    </div>
                    <div>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                        {item.commissionType === "renewal" ? "续订" : "首订"}
                      </span>
                    </div>
                    <div className="font-medium">
                      {formatCents(item.commissionAmountCents, item.currency)}
                    </div>
                    <div>
                      <span className={statusTone(item.status)}>
                        {item.status === "available"
                          ? "可提现"
                          : item.status === "pending"
                            ? "待确认"
                            : item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-none">
              <CardHeader>
                <CardTitle>{t("overview.stats.latest_activity")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {overview.latestActivities.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">暂无动态</p>
                ) : null}
                {overview.latestActivities.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-2 size-2.5 rounded-full",
                        item.type === "payout" && "bg-amber-500",
                        item.type === "application" && "bg-lime-600",
                        item.type === "commission" && "bg-blue-500",
                      )}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-6">
                        {item.text}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(item.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        {confirmDialogNode}
      </>
    );
  }

  if (section === "affiliates" && affiliates) {
    const defaultFirstOrderRateBps = settings?.defaultFirstOrderRateBps ?? 0;
    const defaultRenewalRateBps = settings?.defaultRenewalRateBps ?? 0;
    const filters = [
      {
        key: "all",
        label: `${t("affiliates.filters.all")} (${affiliates.counts.all || 0})`,
      },
      {
        key: "active",
        label: `${t("affiliates.filters.normal")} (${affiliates.counts.active || 0})`,
      },
      {
        key: "suspended",
        label: `${t("affiliates.filters.suspended")} (${affiliates.counts.suspended || 0})`,
      },
      {
        key: "blacklisted",
        label: `${t("affiliates.filters.blacklisted")} (${affiliates.counts.blacklisted || 0})`,
      },
    ];

    return (
      <>
        <div className="space-y-6">
          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{t("affiliates.create.title")}</CardTitle>
              <CardDescription>
                {t("affiliates.create.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAffiliate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    name="email"
                    placeholder={t("affiliates.create.email")}
                  />
                  <Input
                    name="name"
                    placeholder={t("affiliates.create.name")}
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder={t("affiliates.create.password")}
                  />
                  <Input
                    name="paypalEmail"
                    placeholder={t("affiliates.create.paypal")}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    name="socialPlatform"
                    placeholder={t("affiliates.create.platform")}
                  />
                  <Input
                    name="socialAccount"
                    placeholder={t("affiliates.create.account")}
                  />
                  <Input
                    name="channelSummary"
                    placeholder={t("affiliates.create.channel")}
                  />
                  <select
                    name="tier"
                    defaultValue="standard"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="standard">
                      {t("affiliates.create.standard")}
                    </option>
                    <option value="kol">{t("affiliates.create.kol")}</option>
                  </select>
                </div>
                <Textarea
                  name="profileNote"
                  className="min-h-24"
                  placeholder={t("affiliates.create.note")}
                />
                <Button
                  type="submit"
                  disabled={submittingKey === "create-affiliate"}
                >
                  {t("affiliates.create.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardContent className="pt-6">
              <FilterLinks
                items={filters}
                active={activeStatus}
                basePath="/admin/affiliate/affiliates"
              />
              <div className="overflow-x-auto">
                <div className="min-w-[1320px] space-y-4">
                  <div className="grid grid-cols-[1.3fr_1.15fr_0.58fr_0.52fr_0.7fr_0.7fr_0.72fr_1.55fr] gap-4 px-2 text-sm font-medium text-muted-foreground">
                    <div>{t("affiliates.table.affiliate")}</div>
                    <div>{t("affiliates.table.email")}</div>
                    <div>{t("affiliates.table.tier")}</div>
                    <div>{t("affiliates.table.referrals")}</div>
                    <div>{t("affiliates.table.confirming")}</div>
                    <div>{t("affiliates.table.withdrawable")}</div>
                    <div>{t("affiliates.table.status")}</div>
                    <div>{t("affiliates.table.actions")}</div>
                  </div>
                  {affiliates.items.length === 0 ? (
                    <div className="py-8 text-sm text-muted-foreground">
                      {t("affiliates.empty")}
                    </div>
                  ) : null}
                  {affiliates.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.3fr_1.15fr_0.58fr_0.52fr_0.7fr_0.7fr_0.72fr_1.55fr] items-start gap-4 rounded-2xl border border-border/40 bg-background/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        {initialsBadge(item.user?.name)}
                        <div>
                          <div className="text-base">
                            {item.user?.name || "-"}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            code: {item.code}
                          </div>
                        </div>
                      </div>
                      <div className="break-all text-sm">
                        {item.user?.email || "-"}
                      </div>
                      <div>
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                          {item.tier === "kol" ? "KOL" : "普通"}
                        </span>
                      </div>
                      <div className="pt-1 text-base font-semibold">
                        {item.referredUsersCount}
                      </div>
                      <div className="pt-1 text-sm font-medium">
                        {formatCents(item.pendingCommissionCents)}
                      </div>
                      <div className="pt-1 text-sm font-medium">
                        {formatCents(item.availableCommissionCents)}
                      </div>
                      <div>
                        <span className={statusTone(item.status)}>
                          {item.status === PROFILE_STATUS.active
                            ? t("status.normal")
                            : t(`status.${item.status}`)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                佣金：
                                {bpsToPercent(
                                  getEffectiveRateBps(
                                    item.customFirstOrderRateBps,
                                    defaultFirstOrderRateBps,
                                  ),
                                )}{" "}
                                /{" "}
                                {bpsToPercent(
                                  getEffectiveRateBps(
                                    item.customRenewalRateBps,
                                    defaultRenewalRateBps,
                                  ),
                                )}
                                {!hasCustomRateBps(
                                  item.customFirstOrderRateBps,
                                ) &&
                                !hasCustomRateBps(item.customRenewalRateBps)
                                  ? "（默认）"
                                  : "（自定义）"}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                折扣：{item.discountCode || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                有效期：
                                {item.discountExpiresAt
                                  ? formatDateTime(
                                      item.discountExpiresAt,
                                      locale,
                                    )
                                  : "-"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                asChild
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 min-w-[88px] cursor-pointer whitespace-nowrap px-2.5 text-xs"
                              >
                                <Link
                                  href={`/admin/affiliate/affiliates/${item.id}`}
                                >
                                  查看详情
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 min-w-[88px] cursor-pointer whitespace-nowrap px-2.5 text-xs"
                                onClick={() =>
                                  setAffiliateActionDialog({
                                    open: true,
                                    profile: item,
                                  })
                                }
                              >
                                管理操作
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {confirmDialogNode}
        <AffiliateActionDialog
          open={affiliateActionDialog.open}
          profile={activeAffiliateProfile}
          defaultFirstOrderRateBps={defaultFirstOrderRateBps}
          defaultRenewalRateBps={defaultRenewalRateBps}
          discountCode={
            activeAffiliateProfile
              ? (discountDrafts[activeAffiliateProfile.id] ??
                activeAffiliateProfile.discountCode ??
                "")
              : ""
          }
          submittingKey={submittingKey}
          onOpenChange={(open) =>
            setAffiliateActionDialog((current) => ({
              ...current,
              open,
              profile: open ? current.profile : null,
            }))
          }
          onDiscountCodeChange={(value) => {
            if (!activeAffiliateProfile) {
              return;
            }
            setDiscountDrafts((current) => ({
              ...current,
              [activeAffiliateProfile.id]: value.toUpperCase(),
            }));
          }}
          onGenerateDiscount={() => {
            if (!activeAffiliateProfile) {
              return;
            }
            handleGenerateDiscount(activeAffiliateProfile.id);
          }}
          onUpdateRates={handleUpdateRates}
          onUpdateDiscount={handleUpdateDiscount}
          onProfileAction={(profileId, action) => {
            if (action === "suspend") {
              openConfirmDialog({
                title: "确认停用该推广者？",
                description:
                  "停用后该推广者将无法继续正常参与推广结算，但历史数据仍会保留。",
                confirmLabel: "确认停用",
                tone: "danger",
                action: () => handleProfileAction(profileId, action),
              });
              return;
            }
            if (action === "blacklist") {
              openConfirmDialog({
                title: "确认拉黑该推广者？",
                description:
                  "拉黑后将阻断后续推广关系与部分运营操作，请确认这是最终决定。",
                confirmLabel: "确认拉黑",
                tone: "danger",
                action: () => handleProfileAction(profileId, action),
              });
              return;
            }
            void handleProfileAction(profileId, action);
          }}
        />
      </>
    );
  }

  if (section === "applications") {
    if (applications.length === 0) {
      return <EmptyState message="暂无申请记录" />;
    }

    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span>
              {t("applications.total", { count: applications.length })}
            </span>
          </div>

          {applications.map((item) => (
            <Card key={item.id} className="border-border/60 shadow-none">
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {item.user?.name || item.user?.email}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.user?.email} · 申请时间：
                      {formatDateTime(item.createdAt, locale)}
                    </p>
                  </div>
                  <span className={statusTone(item.status)}>
                    {applicationStatusLabel(item.status, t)}
                  </span>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("applications.social_account")}
                    </p>
                    <p className="text-base font-medium">
                      {item.socialAccount || (
                        <span className="text-destructive">
                          {t("applications.empty")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("applications.channels")}
                    </p>
                    <p className="text-base font-medium">
                      {item.channelSummary || (
                        <span className="text-destructive">
                          {t("applications.empty")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("applications.paypal")}
                    </p>
                    <p className="text-base font-medium">
                      {item.paypalEmail || (
                        <span className="text-destructive">
                          {t("applications.empty")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("applications.bio")}
                  </p>
                  <p className="max-w-4xl text-base leading-7">
                    {item.applicationNote || `（${t("applications.empty")}）`}
                  </p>
                </div>

                {item.status === "pending" ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer bg-lime-700 hover:bg-lime-800"
                      onClick={() =>
                        void handleApplicationReview(item.id, "approve")
                      }
                      disabled={!!submittingKey}
                    >
                      {t("applications.approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() =>
                        void handleApplicationReview(item.id, "approve_kol")
                      }
                      disabled={!!submittingKey}
                    >
                      {t("applications.approve_kol")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer text-destructive"
                      onClick={() =>
                        openConfirmDialog({
                          title: "确认拒绝该申请？",
                          description:
                            "拒绝后申请人会被标记为已拒绝，如需重新申请需要重新发起流程。",
                          confirmLabel: "确认拒绝",
                          tone: "danger",
                          action: () =>
                            handleApplicationReview(
                              item.id,
                              "reject",
                              "信息不完整或不符合推广规范",
                            ),
                        })
                      }
                      disabled={!!submittingKey}
                    >
                      {t("applications.reject")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("applications.reviewed_hint")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {confirmDialogNode}
      </>
    );
  }

  if (section === "commissions") {
    const filters = [
      { key: "all", label: t("commissions.filters.all") },
      { key: "pending", label: t("commissions.filters.confirming") },
      { key: "available", label: t("commissions.filters.withdrawable") },
      { key: "mixed", label: t("commissions.filters.first_order") },
      { key: "renewal", label: t("commissions.filters.renewal_only") },
    ];

    if (commissions.length === 0) {
      return <EmptyState message="暂无佣金数据" />;
    }

    return (
      <>
        <Card className="border-border/60 shadow-none">
          <CardContent className="pt-6">
            <FilterLinks
              items={filters}
              active={activeStatus}
              basePath="/admin/affiliate/commissions"
            />
            <div className="overflow-x-auto">
              <div className="min-w-[1080px] space-y-4">
                <div className="grid grid-cols-[1.1fr_1fr_0.7fr_0.8fr_0.6fr_0.7fr_0.7fr_1fr] gap-4 text-sm font-medium text-muted-foreground">
                  <div>{t("commissions.table.affiliate")}</div>
                  <div>{t("commissions.table.referred_user")}</div>
                  <div>{t("commissions.table.type")}</div>
                  <div>{t("commissions.table.order_amount")}</div>
                  <div>{t("commissions.table.ratio")}</div>
                  <div>{t("commissions.table.commission")}</div>
                  <div>{t("commissions.table.status")}</div>
                  <div>{t("commissions.table.time")}</div>
                </div>
                {commissions.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.1fr_1fr_0.7fr_0.8fr_0.6fr_0.7fr_0.7fr_1fr] items-center gap-4 border-t border-border/50 pt-4"
                  >
                    <div className="flex items-center gap-3 font-medium">
                      {initialsBadge(item.affiliateUser?.name)}
                      <span>
                        {item.affiliateUser?.name ||
                          item.affiliateUser?.email ||
                          "-"}
                      </span>
                    </div>
                    <div>
                      {item.referredUser?.email ||
                        item.referredUser?.name ||
                        "-"}
                    </div>
                    <div>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                        {item.commissionType === "renewal" ? "续订" : "首订"}
                      </span>
                    </div>
                    <div>
                      {formatCents(
                        item.baseAmountCents,
                        item.currency || "USD",
                      )}
                    </div>
                    <div>{bpsToPercent(item.commissionRateBps)}</div>
                    <div className="font-semibold">
                      {formatCents(item.commissionAmountCents, item.currency)}
                    </div>
                    <div>
                      <span className={statusTone(item.status)}>
                        {item.status === "available"
                          ? t("status.withdrawable")
                          : item.status === "pending"
                            ? t("status.confirming")
                            : item.status}
                      </span>
                    </div>
                    <div>{formatDateTime(item.occurredAt, locale)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {confirmDialogNode}
      </>
    );
  }

  if (section === "payouts" && payouts) {
    const filters = [
      { key: "all", label: t("payouts.filters.all") },
      {
        key: "requested",
        label: `${t("payouts.filters.requesting")} (${payouts.counts.requested || 0})`,
      },
      { key: "approved", label: t("payouts.filters.approved") },
      { key: "paid", label: t("payouts.filters.paid") },
      { key: "rejected", label: t("payouts.filters.rejected") },
    ];

    if (payouts.items.length === 0) {
      return <EmptyState message="暂无提现申请" />;
    }

    return (
      <>
        <Card className="border-border/60 shadow-none">
          <CardContent className="pt-6">
            <FilterLinks
              items={filters}
              active={activeStatus}
              basePath="/admin/affiliate/payouts"
            />
            <div className="overflow-x-auto">
              <div className="min-w-[1180px] space-y-4">
                <div className="grid grid-cols-[1fr_1.1fr_0.8fr_1fr_0.8fr_0.7fr_1.1fr] gap-4 px-2 text-sm font-medium text-muted-foreground">
                  <div>{t("payouts.table.affiliate")}</div>
                  <div>{t("payouts.table.paypal")}</div>
                  <div>{t("payouts.table.amount")}</div>
                  <div>{t("payouts.table.requested_at")}</div>
                  <div>{t("payouts.table.available")}</div>
                  <div>{t("payouts.table.status")}</div>
                  <div>{t("payouts.table.actions")}</div>
                </div>
                {payouts.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_1.1fr_0.8fr_1fr_0.8fr_0.7fr_1.1fr] items-start gap-4 rounded-2xl border border-border/40 bg-background/40 p-4"
                  >
                    <div className="flex items-center gap-3 font-medium">
                      {initialsBadge(item.affiliateUser?.name)}
                      <span>
                        {item.affiliateUser?.name ||
                          item.affiliateUser?.email ||
                          "-"}
                      </span>
                    </div>
                    <div>{item.paypalEmail || "-"}</div>
                    <div className="font-semibold">
                      {formatCents(item.requestedAmountCents, item.currency)}
                    </div>
                    <div>{formatDateTime(item.requestedAt, locale)}</div>
                    <div>
                      {formatCents(
                        item.approvedAmountCents || item.requestedAmountCents,
                        item.currency,
                      )}
                    </div>
                    <div>
                      <span className={statusTone(item.status)}>
                        {item.status === PAYOUT_STATUS.requested
                          ? t("status.requesting")
                          : t(`status.${item.status}`)}
                      </span>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
                      {item.status === PAYOUT_STATUS.requested ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer text-lime-700"
                            onClick={() =>
                              void handlePayoutReview(item.id, "approve")
                            }
                            disabled={!!submittingKey}
                          >
                            {t("payouts.table.approve")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer text-destructive"
                            onClick={() =>
                              openConfirmDialog({
                                title: "确认拒绝这笔提现申请？",
                                description:
                                  "拒绝后该提现申请会被标记为已拒绝，请确认备注与风控判断无误。",
                                confirmLabel: "确认拒绝",
                                tone: "danger",
                                action: () =>
                                  handlePayoutReview(
                                    item.id,
                                    "reject",
                                    "风控或资料异常，已驳回",
                                  ),
                              })
                            }
                            disabled={!!submittingKey}
                          >
                            {t("payouts.table.reject")}
                          </Button>
                        </div>
                      ) : null}
                      {item.status === PAYOUT_STATUS.approved ? (
                        <MarkPaidForm
                          loading={!!submittingKey}
                          label={t("payouts.table.mark_paid")}
                          onConfirm={(note) =>
                            openConfirmDialog({
                              title: "确认标记为已打款？",
                              description: note
                                ? `将以“${note}”作为打款备注并完成该提现。`
                                : "该操作会将提现状态更新为已打款，请确认已实际完成转账。",
                              confirmLabel: "确认已打款",
                              tone: "danger",
                              action: () =>
                                handlePayoutReview(item.id, "mark_paid", note),
                            })
                          }
                        />
                      ) : null}
                      {item.note ? (
                        <div className="text-muted-foreground">{item.note}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {confirmDialogNode}
      </>
    );
  }

  if (section === "settings" && settings) {
    return (
      <>
        <form
          onSubmit={handleSettingsSubmit}
          className="grid gap-6 xl:grid-cols-2"
        >
          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{t("settings.commission.title")}</CardTitle>
              <CardDescription>
                {t("settings.commission.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.commission.first_order")}
                  </p>
                  <Input
                    name="defaultFirstOrderRate"
                    defaultValue={String(
                      settings.defaultFirstOrderRateBps / 100,
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.commission.renewal")}
                  </p>
                  <Input
                    name="defaultRenewalRate"
                    defaultValue={String(settings.defaultRenewalRateBps / 100)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium">默认折扣比例</p>
                  <Input
                    name="defaultDiscountRate"
                    defaultValue={String(settings.defaultDiscountRateBps / 100)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submittingKey === "settings"}>
                {t("settings.commission.save")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{t("settings.withdrawal.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t("settings.withdrawal.minimum")}
                </p>
                <Input
                  name="minimumPayoutAmount"
                  defaultValue={String(settings.minimumPayoutAmountCents / 100)}
                />
              </div>
              <Button type="submit" disabled={submittingKey === "settings"}>
                {t("settings.withdrawal.save")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{t("settings.tracking.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.tracking.cookie_days")}
                  </p>
                  <Input
                    name="cookieTtlDays"
                    defaultValue={String(settings.cookieTtlDays)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.tracking.confirm_days")}
                  </p>
                  <Input
                    name="commissionConfirmDays"
                    defaultValue={String(settings.commissionConfirmDays)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submittingKey === "settings"}>
                {t("settings.tracking.save")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle>{t("settings.risk.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.risk.window_minutes")}
                  </p>
                  <Input
                    name="antiFraudWindowMinutes"
                    defaultValue={String(settings.antiFraudWindowMinutes)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("settings.risk.max_clicks")}
                  </p>
                  <Input
                    name="maxClicksPerIp"
                    defaultValue={String(settings.maxClicksPerIp)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submittingKey === "settings"}>
                {t("settings.risk.save")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none xl:col-span-2">
            <CardHeader>
              <CardTitle>{t("settings.agreement.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                name="agreementText"
                className="min-h-52"
                defaultValue={
                  settings.agreementText ||
                  `参与本推广计划即表示您同意以下条款：\n1. 佣金基于实际完成的订单或订阅计算。\n2. 禁止虚假流量、刷量等违规行为。\n3. 违规行为将导致账号封禁及佣金取消。\n4. 佣金结算通过 PayPal 进行，最低提现 $40。`
                }
              />
              <Button type="submit" disabled={submittingKey === "settings"}>
                {t("settings.agreement.save")}
              </Button>
            </CardContent>
          </Card>
        </form>
        {confirmDialogNode}
      </>
    );
  }

  return (
    <>
      <EmptyState message="暂无数据" />
      {confirmDialogNode}
    </>
  );
}

function MarkPaidForm({
  loading,
  label,
  onConfirm,
}: {
  loading: boolean;
  label: string;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(note);
      }}
    >
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="PayPal 参考号"
        className="h-8 w-36"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="cursor-pointer"
        disabled={loading}
      >
        {label}
      </Button>
    </form>
  );
}

function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full",
                tone === "danger"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-amber-100 text-amber-600",
              )}
            >
              <AlertTriangle className="size-5" />
            </span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "destructive" : "default"}
            className="cursor-pointer"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AffiliateActionDialog({
  open,
  profile,
  defaultFirstOrderRateBps,
  defaultRenewalRateBps,
  discountCode,
  submittingKey,
  onOpenChange,
  onDiscountCodeChange,
  onGenerateDiscount,
  onUpdateRates,
  onUpdateDiscount,
  onProfileAction,
}: {
  open: boolean;
  profile: AffiliateItem | null;
  defaultFirstOrderRateBps: number;
  defaultRenewalRateBps: number;
  discountCode: string;
  submittingKey: string;
  onOpenChange: (open: boolean) => void;
  onDiscountCodeChange: (value: string) => void;
  onGenerateDiscount: () => void;
  onUpdateRates: (
    event: FormEvent<HTMLFormElement>,
    profileId: string,
  ) => Promise<void>;
  onUpdateDiscount: (
    event: FormEvent<HTMLFormElement>,
    profileId: string,
  ) => Promise<void>;
  onProfileAction: (
    profileId: string,
    action: "upgrade_kol" | "resume" | "suspend" | "blacklist",
  ) => void;
}) {
  if (!profile) {
    return null;
  }

  const effectiveFirstOrderRateBps = getEffectiveRateBps(
    profile.customFirstOrderRateBps,
    defaultFirstOrderRateBps,
  );
  const effectiveRenewalRateBps = getEffectiveRateBps(
    profile.customRenewalRateBps,
    defaultRenewalRateBps,
  );
  const usesGlobalRates =
    !hasCustomRateBps(profile.customFirstOrderRateBps) &&
    !hasCustomRateBps(profile.customRenewalRateBps);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>管理推广者</DialogTitle>
          <DialogDescription>
            {profile.user?.name || profile.user?.email || "-"} ·{" "}
            {profile.user?.email || "无邮箱"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
            <div className="mb-3 text-sm font-semibold">佣金比例</div>
            <form
              onSubmit={(event) => void onUpdateRates(event, profile.id)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="firstOrderRate"
                  defaultValue={
                    !hasCustomRateBps(profile.customFirstOrderRateBps)
                      ? ""
                      : String(
                          Math.floor(
                            (profile.customFirstOrderRateBps ?? 0) / 100,
                          ),
                        )
                  }
                  placeholder={`首订%（默认 ${bpsToPercent(defaultFirstOrderRateBps)}）`}
                  className="h-9"
                />
                <Input
                  name="renewalRate"
                  defaultValue={
                    !hasCustomRateBps(profile.customRenewalRateBps)
                      ? ""
                      : String(
                          Math.floor((profile.customRenewalRateBps ?? 0) / 100),
                        )
                  }
                  placeholder={`续订%（默认 ${bpsToPercent(defaultRenewalRateBps)}）`}
                  className="h-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                当前：{bpsToPercent(effectiveFirstOrderRateBps)} /{" "}
                {bpsToPercent(effectiveRenewalRateBps)}
                {usesGlobalRates ? "（全局默认）" : "（自定义）"}
              </div>
              <div className="text-xs text-muted-foreground">
                留空则使用全局默认：{bpsToPercent(defaultFirstOrderRateBps)} /{" "}
                {bpsToPercent(defaultRenewalRateBps)}
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="cursor-pointer"
                disabled={submittingKey === `rates-${profile.id}`}
              >
                保存佣金比例
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
            <div className="mb-3 text-sm font-semibold">折扣设置</div>
            <form
              onSubmit={(event) => void onUpdateDiscount(event, profile.id)}
              className="space-y-3"
            >
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  name="discountCode"
                  value={discountCode}
                  onChange={(event) => onDiscountCodeChange(event.target.value)}
                  placeholder="折扣码"
                  className="h-9 font-mono uppercase"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={onGenerateDiscount}
                  disabled={submittingKey === `discount-${profile.id}`}
                >
                  随机生成
                </Button>
              </div>
              <Input
                name="customDiscountRate"
                defaultValue={String(
                  Math.floor((profile.customDiscountRateBps || 0) / 100),
                )}
                placeholder="折扣%"
                className="h-9"
              />
              <Input
                name="discountExpiresAt"
                type="datetime-local"
                defaultValue={formatDateTimeLocalInput(
                  profile.discountExpiresAt,
                )}
                className="h-9"
              />
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="font-mono">
                  当前折扣码：{profile.discountCode || "-"}
                </div>
                <div>
                  有效期：
                  {profile.discountExpiresAt
                    ? formatDateTime(profile.discountExpiresAt)
                    : "-"}
                </div>
                <div>
                  折扣比例：
                  {profile.customDiscountRateBps
                    ? bpsToPercent(profile.customDiscountRateBps)
                    : "跟随默认"}
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="cursor-pointer"
                disabled={submittingKey === `discount-${profile.id}`}
              >
                保存折扣码
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
          <div className="mb-3 text-sm font-semibold">状态操作</div>
          <div className="flex flex-wrap gap-2">
            {profile.tier !== "kol" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer text-primary"
                onClick={() => onProfileAction(profile.id, "upgrade_kol")}
                disabled={!!submittingKey}
              >
                升级 KOL
              </Button>
            ) : null}
            {profile.status === PROFILE_STATUS.suspended ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => onProfileAction(profile.id, "resume")}
                disabled={!!submittingKey}
              >
                恢复
              </Button>
            ) : profile.status !== PROFILE_STATUS.blacklisted ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => onProfileAction(profile.id, "suspend")}
                disabled={!!submittingKey}
              >
                停用
              </Button>
            ) : null}
            {profile.status !== PROFILE_STATUS.blacklisted ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer text-destructive"
                onClick={() => onProfileAction(profile.id, "blacklist")}
                disabled={!!submittingKey}
              >
                拉黑
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">已永久封禁</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">归因明细</div>
              <div className="text-xs text-muted-foreground">
                注册用户与订单转化详情已迁移到独立页面，便于筛选和查看长列表。
              </div>
            </div>
            <Button asChild size="sm" className="cursor-pointer">
              <Link href={`/admin/affiliate/affiliates/${profile.id}`}>
                查看详情页
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
