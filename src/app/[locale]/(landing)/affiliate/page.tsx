import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Link } from "@/core/i18n/navigation";
import {
  AffiliateApplyDialog,
  AffiliateApplyDialogContent,
} from "@/shared/blocks/affiliate-landing/apply-dialog";
import { Dialog } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import {
  AffiliateApplicationStatus,
  bpsToPercent,
  formatCents,
  getAffiliateDashboardForUser,
  getOrCreateAffiliateProgram,
} from "@/shared/models/affiliate";
import { getMetadata } from "@/shared/lib/seo";
import { getUserInfo } from "@/shared/models/user";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: "landing.affiliate.metadata",
  canonicalUrl: "/affiliate",
});

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
      <p className="text-sm font-medium text-stone-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
        {suffix ? (
          <span className="ml-1 text-lg font-medium text-stone-500">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export default async function AffiliateLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing.affiliate");
  const user = await getUserInfo();
  const program = await getOrCreateAffiliateProgram();
  const dashboard = user ? await getAffiliateDashboardForUser(user.id) : null;

  const canApply =
    !!user &&
    !dashboard?.profile &&
    dashboard?.latestApplication?.status !== AffiliateApplicationStatus.PENDING;
  const hasPending =
    dashboard?.latestApplication?.status === AffiliateApplicationStatus.PENDING;

  const stats = [
    {
      label: t("stats.first_order.label"),
      value: bpsToPercent(program.defaultFirstOrderRateBps),
      suffix: t("stats.first_order.suffix"),
    },
    {
      label: t("stats.renewal.label"),
      value: bpsToPercent(program.defaultRenewalRateBps),
      suffix: t("stats.renewal.suffix"),
    },
    {
      label: t("stats.cookie.label"),
      value: String(program.cookieTtlDays),
      suffix: t("stats.cookie.suffix"),
    },
    {
      label: t("stats.payout.label"),
      value: formatCents(program.minimumPayoutAmountCents),
      suffix: t("stats.payout.suffix"),
    },
  ];

  const trust = t.raw("hero.trust") as string[];
  const steps = t.raw("how.steps") as Array<{
    title: string;
    description: string;
  }>;
  const faqItems = t.raw("faq.items") as Array<{
    question: string;
    answer: string;
  }>;
  const audienceItems = t.raw("cards.audience.items") as string[];
  const benefitItems = t.raw("cards.benefits.items") as string[];
  const primaryButtonClass =
    "min-w-[220px] rounded-full bg-white px-10 py-7 text-lg font-semibold text-stone-950 shadow-[0_18px_45px_rgba(255,255,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-200 hover:shadow-[0_24px_55px_rgba(255,255,255,0.24)]";

  const primaryAction = !user ? (
    <Button asChild size="lg" className={primaryButtonClass}>
      <Link href={`/sign-in?callbackUrl=%2Faffiliate`}>
        {t("hero.primary")}
      </Link>
    </Button>
  ) : dashboard?.profile || hasPending ? (
    <Button asChild size="lg" className={primaryButtonClass}>
      <Link href="/settings/affiliate">{t("hero.primary")}</Link>
    </Button>
  ) : (
    <Dialog>
      <AffiliateApplyDialog triggerLabel={t("hero.primary")} />
      <AffiliateApplyDialogContent
        locale={locale}
        title={t("sections.apply.modal_title")}
        subtitle={t("sections.apply.modal_subtitle")}
        emailPlaceholder={t("sections.apply.email_placeholder")}
        fullNamePlaceholder={t("sections.apply.full_name_placeholder")}
        payoutMethodLabel={t("sections.apply.payout_method")}
        paypalPlaceholder={t("sections.apply.paypal_placeholder")}
        channelPlaceholder={t("sections.apply.channel_placeholder")}
        requiredHint={t("sections.apply.required_hint")}
        cancelLabel={t("sections.apply.cancel")}
        submitLabel={t("sections.apply.submit")}
        email={user?.email || ""}
        fullName={user?.name || ""}
      />
    </Dialog>
  );

  return (
    <div className="bg-[#09090b] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.32),transparent_32%),radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_20%),radial-gradient(circle_at_85%_22%,rgba(245,158,11,0.16),transparent_22%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.55),rgba(9,9,11,0.95))]" />
        <div className="container relative px-4 pb-10 pt-16 md:pb-14 md:pt-24">
          <div className="mx-auto max-w-5xl text-center">
            <Badge className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-stone-300 shadow-none">
              {t("hero.eyebrow")}
            </Badge>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-8 text-stone-300 md:text-[1.15rem]">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex justify-center">{primaryAction}</div>
            {dashboard?.profile ? (
              <p className="mt-4 text-sm text-emerald-300">
                {t("sections.apply.already_member")}
              </p>
            ) : hasPending ? (
              <p className="mt-4 text-sm text-amber-300">
                {t("sections.apply.pending")}
              </p>
            ) : !user ? (
              <p className="mt-4 text-sm text-stone-400">
                {t("sections.apply.signed_out")}
              </p>
            ) : (
              <p className="mt-4 text-sm text-stone-400">
                {t("sections.apply.signed_in")}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {trust.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-300 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md md:p-6">
              <div className="grid gap-4 md:grid-cols-4">
                {stats.map((item) => (
                  <MetricCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    suffix={item.suffix}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 md:py-12">
        <div className="mx-auto grid max-w-4xl gap-6">
          <Card className="rounded-[30px] border-white/10 bg-white/5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-white">
                {t("cards.audience.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {audienceItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-stone-300"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] text-white shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-white">
                {t("cards.benefits.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {benefitItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-stone-300"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="rules" className="container px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              {t("sections.how.title")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">
              {t("sections.why.title")}
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-300">
              {t("sections.why.description")}
            </p>
          </div>
          <div className="mt-10 grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={cn(
                  "rounded-[28px] border p-6 shadow-[0_12px_40px_rgba(0,0,0,0.24)]",
                  index % 2 === 0
                    ? "border-amber-400/20 bg-amber-400/8"
                    : "border-white/10 bg-white/5",
                )}
              >
                <p className="text-lg font-semibold text-white">{step.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-[32px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-center text-3xl text-white">
                {t("sections.faq.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={item.question} className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-stone-300">
                      {item.answer}
                    </p>
                  </div>
                  {index < faqItems.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
