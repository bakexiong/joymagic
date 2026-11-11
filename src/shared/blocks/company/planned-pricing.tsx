"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { notifyBetaPurchase } from "@/shared/blocks/payment/beta-purchase-notice";
import { type Pricing as PricingType } from "@/shared/types/blocks/pricing";

export function PlannedPricing({ pricing }: { pricing: PricingType }) {
  const locale = useLocale();
  const chinese = locale.startsWith("zh");
  const groups = [
    { id: "one-time", label: chinese ? "计划积分包" : "Planned credit packs" },
    {
      id: "monthly",
      label: chinese ? "计划月度方案" : "Planned monthly plans",
    },
    { id: "yearly", label: chinese ? "计划年度方案" : "Planned annual plans" },
  ];
  const [group, setGroup] = useState("one-time");
  const items = (pricing.items || []).filter(
    (item) => (item.group || "one-time") === group,
  );
  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-6 pb-20 pt-32 text-foreground"
    >
      <p className="text-sm text-muted-foreground">
        Barko Bear LLC · {chinese ? "公开测试" : "Public beta"}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">
        {chinese ? "计划定价" : "Planned pricing"}
      </h1>
      <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
        {chinese
          ? "以下为计划推出的方案，当前尚未正式收费，支付未开放。价格、额度、续订及退款条款将在正式收费前最终确认；点击购买不会产生订单或扣款。"
          : "These are planned offerings. Paid access and payments have not launched. Final prices, allowances, renewal details, and refund terms will be confirmed before paid access opens. Selecting a plan does not create an order or charge."}
      </p>
      <div
        className="mt-8 flex flex-wrap gap-3"
        role="group"
        aria-label={chinese ? "计划类型" : "Plan type"}
      >
        {groups.map((item) => (
          <button
            key={item.id}
            onClick={() => setGroup(item.id)}
            aria-pressed={group === item.id}
            className={`rounded-full border px-5 py-2 text-sm ${group === item.id ? "bg-foreground text-background" : "text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.product_id}
            className="flex flex-col rounded-2xl border border-border p-6"
          >
            <p className="text-xs text-muted-foreground">
              {chinese
                ? "计划方案 · 尚不可购买"
                : "Planned · Not yet available"}
            </p>
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <p className="mt-6 text-3xl font-semibold">
              {typeof item.amount === "number"
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: item.currency || "USD",
                  }).format(item.amount / 100)
                : item.price}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {group === "monthly"
                ? chinese
                  ? "计划每月收费"
                  : "Planned monthly billing"
                : group === "yearly"
                  ? chinese
                    ? "计划每年收费"
                    : "Planned annual billing"
                  : chinese
                    ? "计划一次性购买"
                    : "Planned one-time purchase"}
            </p>
            {item.credits ? (
              <p className="mt-5 text-sm">
                {item.credits.toLocaleString()}{" "}
                {chinese ? "计划使用积分" : "planned usage credits"}
              </p>
            ) : null}
            <button
              onClick={notifyBetaPurchase}
              className="mt-8 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background"
            >
              {chinese ? "选择此方案" : "Select this plan"}
            </button>
          </article>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        {chinese
          ? "积分仅用于衡量软件使用量。我们不提供资金账户、资金托管或汇款服务。"
          : "Credits are a software usage measure. Barko Bear does not provide money accounts, hold customer deposits, or transfer funds for customers."}
      </p>
      <div className="mt-6 flex flex-wrap gap-6 text-sm underline">
        <a href="/business-model">{chinese ? "业务模式" : "Business model"}</a>
        <a href="/refund-policy">
          {chinese ? "支付及退款状态" : "Payment & refund status"}
        </a>
        <a href="mailto:support@barkobear.com">support@barkobear.com</a>
      </div>
    </section>
  );
}
