"use client";

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { submitAffiliateApplicationAction } from "@/shared/actions/affiliate";

type AffiliateApplyDialogProps = {
  locale: string;
  triggerLabel: string;
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  fullNamePlaceholder: string;
  payoutMethodLabel: string;
  paypalPlaceholder: string;
  channelPlaceholder: string;
  requiredHint: string;
  cancelLabel: string;
  submitLabel: string;
  email: string;
  fullName: string;
};

export function AffiliateApplyDialog({
  triggerLabel,
}: Pick<AffiliateApplyDialogProps, "triggerLabel">) {
  return (
    <DialogTrigger asChild>
      <Button
        size="lg"
        className="min-w-[220px] rounded-full bg-white px-10 py-7 text-lg font-semibold text-stone-950 shadow-[0_18px_45px_rgba(255,255,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-200 hover:shadow-[0_24px_55px_rgba(255,255,255,0.24)]"
      >
        {triggerLabel}
      </Button>
    </DialogTrigger>
  );
}

export function AffiliateApplyDialogContent({
  locale,
  title,
  subtitle,
  emailPlaceholder,
  fullNamePlaceholder,
  payoutMethodLabel,
  paypalPlaceholder,
  channelPlaceholder,
  requiredHint,
  cancelLabel,
  submitLabel,
  email,
  fullName,
}: Omit<AffiliateApplyDialogProps, "triggerLabel">) {
  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[74vh] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#111114] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.42)] sm:max-w-[560px]"
    >
      <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
        <DialogClose className="absolute right-3 top-3 inline-flex size-8 appearance-none items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 text-stone-400 shadow-none outline-none ring-0 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-white/5">
          <X className="size-4" />
          <span className="sr-only">{cancelLabel}</span>
        </DialogClose>

        <div className="px-3 pt-1 text-center sm:px-5">
          <DialogTitle className="text-[clamp(1.45rem,2.4vw,2rem)] font-semibold tracking-tight text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm font-normal text-stone-400 sm:text-base">
            {subtitle}
          </DialogDescription>
        </div>

        <form
          action={submitAffiliateApplicationAction}
          className="mt-5 flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="redirectTo" value="/affiliate" />
          <input type="hidden" name="desiredTier" value="standard" />

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
            <Label htmlFor="affiliate-display-email" className="sr-only">
              {emailPlaceholder}
            </Label>
            <Input
              id="affiliate-display-email"
              name="displayEmail"
              value={email}
              readOnly
              placeholder={emailPlaceholder}
              className="h-14 rounded-[16px] border-white/10 bg-white/5 px-4 text-sm text-stone-400 placeholder:text-stone-500"
            />

            <Label htmlFor="affiliate-full-name" className="sr-only">
              {fullNamePlaceholder}
            </Label>
            <Input
              id="affiliate-full-name"
              name="fullName"
              defaultValue={fullName}
              placeholder={fullNamePlaceholder}
              required
              className="h-14 rounded-[16px] border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-stone-500"
            />

            <Label htmlFor="affiliate-payout-method" className="sr-only">
              {payoutMethodLabel}
            </Label>
            <Input
              id="affiliate-payout-method"
              value={payoutMethodLabel}
              readOnly
              className="h-14 rounded-[16px] border-white/10 bg-white/5 px-4 text-sm text-stone-400"
            />

            <Label htmlFor="affiliate-paypal-email" className="sr-only">
              {paypalPlaceholder}
            </Label>
            <Input
              id="affiliate-paypal-email"
              name="paypalEmail"
              type="email"
              placeholder={paypalPlaceholder}
              required
              className="h-14 rounded-[16px] border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-stone-500"
            />

            <Label htmlFor="affiliate-channel-summary" className="sr-only">
              {channelPlaceholder}
            </Label>
            <Textarea
              id="affiliate-channel-summary"
              name="channelSummary"
              placeholder={channelPlaceholder}
              required
              className="min-h-[110px] rounded-[18px] border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white placeholder:text-stone-500"
            />

            <p className="px-1 text-xs text-stone-500">{requiredHint}</p>
          </div>

          <div className="border-t border-white/10 bg-[#111114] pt-2.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  className="h-12 rounded-[16px] bg-stone-600 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] hover:bg-stone-500"
                >
                  {cancelLabel}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-12 rounded-[16px] bg-white text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DialogContent>
  );
}
