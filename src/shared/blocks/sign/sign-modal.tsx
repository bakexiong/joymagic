"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { useAppContext } from "@/shared/contexts/app";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { cn } from "@/shared/lib/utils";

import { SignInForm } from "./sign-in-form";

export function SignModal({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const t = useTranslations("common.sign");
  const { isShowSignModal, setIsShowSignModal } = useAppContext();
  const [effectiveCallbackUrl, setEffectiveCallbackUrl] = useState(callbackUrl);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Check localStorage for pending checkout callback URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCallbackUrl = window.localStorage.getItem(
        "signin_callback_url",
      );
      if (storedCallbackUrl) {
        setEffectiveCallbackUrl(storedCallbackUrl);
      } else {
        const currentCallbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        setEffectiveCallbackUrl(
          callbackUrl === "/" ? currentCallbackUrl : callbackUrl,
        );
      }
    }
  }, [callbackUrl, isShowSignModal]);

  if (isDesktop) {
    return (
      <Dialog open={isShowSignModal} onOpenChange={setIsShowSignModal}>
        <DialogContent className="overflow-hidden border-[#e5e7eb] bg-white p-0 text-[#23282f] shadow-[0_30px_90px_rgba(35,40,47,0.22)] sm:max-w-[420px]">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(35,40,47,0.18),transparent)]" />

            <div className="relative px-7 pb-7 pt-7">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-[28px] font-semibold leading-[1.05] tracking-normal text-[#23282f]">
                  {t("sign_in_title")}
                </DialogTitle>
                <DialogDescription className="max-w-[34ch] text-[14px] leading-6 text-[#6b7280]">
                  {t("sign_in_description")}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <SignInForm
                  callbackUrl={effectiveCallbackUrl}
                  variant="auth-modal"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isShowSignModal} onOpenChange={setIsShowSignModal}>
      <DrawerContent className="max-h-[92vh] overflow-hidden rounded-t-[28px] border-[#e5e7eb] bg-white px-5 pb-7 text-[#23282f]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(35,40,47,0.18),transparent)]" />

        <DrawerHeader className="relative px-0 pb-5 pt-7 text-left">
          <DrawerTitle className="text-[28px] font-semibold leading-[1.05] tracking-normal text-[#23282f]">
            {t("sign_in_title")}
          </DrawerTitle>
          <DrawerDescription className="mt-2 max-w-[32ch] text-[14px] leading-6 text-[#6b7280]">
            {t("sign_in_description")}
          </DrawerDescription>
        </DrawerHeader>
        <SignInForm
          callbackUrl={effectiveCallbackUrl}
          className="mobile-form"
          variant="auth-modal"
        />
        <DrawerFooter className="px-0 pt-4">
          <DrawerClose asChild>
            <Button
              variant="outline"
              className={cn(
                "h-12 rounded-[8px] border-[#e5e7eb] bg-white text-base text-[#23282f]",
                "hover:bg-[#f8fafc] hover:text-black",
              )}
            >
              {t("cancel_title")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
