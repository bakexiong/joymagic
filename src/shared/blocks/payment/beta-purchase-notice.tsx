"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { BETA_PURCHASE_EVENT, SUPPORT_EMAIL } from "@/config/site";

export function notifyBetaPurchase() {
  window.dispatchEvent(new Event(BETA_PURCHASE_EVENT));
}

export function BetaPurchaseNotice() {
  const [open, setOpen] = useState(false);
  const chinese = useLocale().startsWith("zh");
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(BETA_PURCHASE_EVENT, show);
    return () => window.removeEventListener(BETA_PURCHASE_EVENT, show);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200200] bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[200201] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-7 text-zinc-900 shadow-xl">
          <Dialog.Title className="text-xl font-semibold">
            {chinese
              ? "公开测试期间暂未开放购买"
              : "Purchases are not available yet"}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-zinc-600">
            {chinese
              ? "Barko Bear LLC 的产品目前处于公开测试阶段。页面价格为计划方案，支付服务尚未开放；本次点击不会扣款、创建订阅或支付订单。正式开放前，我们会公布最终价格、条款及付款方式。"
              : "Barko Bear LLC is currently running a public beta. Displayed prices are planned offerings; payments are not open. This click will not charge you, start a subscription, or create a payment order. Final prices, terms, and payment methods will be published before paid access launches."}
          </Dialog.Description>
          <a
            className="mt-4 block text-sm underline"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
          <Dialog.Close className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white">
            {chinese ? "知道了" : "Got it"}
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
