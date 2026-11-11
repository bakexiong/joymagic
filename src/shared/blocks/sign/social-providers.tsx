"use client";

import { useLocale, useTranslations } from "next-intl";
import { Github } from "lucide-react";
import { toast } from "sonner";

import { signIn } from "@/core/auth/client";
import { defaultLocale } from "@/config/locale";
import { Button } from "@/shared/components/ui/button";
import { useAppContext } from "@/shared/contexts/app";
import { rememberPendingLogin } from "@/shared/lib/google-tag";
import { cn } from "@/shared/lib/utils";
import { Button as ButtonType } from "@/shared/types/blocks/common";

export function SocialProviders({
  configs,
  callbackUrl,
  loading,
  setLoading,
  variant = "default",
}: {
  configs: Record<string, string>;
  callbackUrl: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  variant?: "default" | "auth-modal" | "mango-light";
}) {
  const t = useTranslations("common.sign");

  const { setIsShowSignModal } = useAppContext();

  if (callbackUrl) {
    const locale = useLocale();
    if (
      locale !== defaultLocale &&
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith(`/${locale}`)
    ) {
      callbackUrl = `/${locale}${callbackUrl}`;
    }
  }

  const handleSignIn = async ({ provider }: { provider: string }) => {
    rememberPendingLogin(provider);

    await signIn.social(
      {
        provider: provider,
        callbackURL: callbackUrl,
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          setLoading(false);
          setIsShowSignModal(false);
        },
        onSuccess: (ctx) => {},
        onError: (e: any) => {
          toast.error(e?.error?.message || "sign in failed");
          setLoading(false);
        },
      },
    );
  };

  const providers: ButtonType[] = [];

  if (configs.google_auth_enabled === "true") {
    providers.push({
      name: "google",
      title: t("google_sign_in_title"),
      icon: (
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      onClick: () => handleSignIn({ provider: "google" }),
    });
  }

  if (configs.github_auth_enabled === "true") {
    providers.push({
      name: "github",
      title: t("github_sign_in_title"),
      icon: <Github className="size-4" />,
      onClick: () => handleSignIn({ provider: "github" }),
    });
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3",
        "flex-col justify-between",
      )}
    >
      {providers.map((provider) => (
        <Button
          key={provider.name}
          variant="outline"
          className={cn(
            variant === "auth-modal"
              ? [
                  "h-12 w-full justify-center gap-3 rounded-[8px] px-4 text-[15px] font-semibold md:text-[15px]",
                  provider.name === "google"
                    ? "border-[#e5e7eb] bg-white text-[#23282f]"
                    : "border-[#e5e7eb] bg-white text-[#23282f]",
                  "shadow-[0_8px_24px_rgba(35,40,47,0.06)] transition-all duration-200",
                  provider.name === "google"
                    ? "hover:-translate-y-0.5 hover:border-[#d7dde7] hover:bg-[#f8fafc] hover:text-[#23282f]"
                    : "hover:-translate-y-0.5 hover:border-[#d7dde7] hover:bg-[#f8fafc] hover:text-[#23282f]",
                  "focus-visible:ring-[#23282f]/10 focus-visible:ring-offset-2",
                ]
              : variant === "mango-light"
                ? [
                    "h-12 w-full justify-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 text-[15px] font-semibold text-[#23282f]",
                    "shadow-[0_8px_24px_rgba(35,40,47,0.06)] transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-[#00b2ff]/35 hover:bg-[#f8fbff] hover:shadow-[0_14px_28px_rgba(35,40,47,0.1)]",
                    "active:translate-y-0 active:bg-white",
                    "focus-visible:ring-[#00b2ff]/20 focus-visible:ring-offset-2",
                  ]
                : [
                    "w-full gap-2 h-14 text-base font-medium rounded-xl md:h-10 md:text-sm md:rounded-md",
                    "border-white/35 bg-white/[0.06] text-white",
                    "ring-1 ring-inset ring-white/20",
                    "shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md",
                    "transition-all duration-200",
                    "hover:-translate-y-0.5 hover:bg-white/[0.12] hover:border-white/55 hover:ring-white/35 hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)]",
                    "active:translate-y-0 active:bg-white/[0.14] active:border-white/60 active:ring-white/40 active:shadow-[0_12px_32px_rgba(0,0,0,0.42)]",
                    "focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
                  ],
          )}
          style={
            variant === "mango-light"
              ? {
                  borderColor: "#e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#23282f",
                }
              : undefined
          }
          disabled={loading}
          onClick={provider.onClick}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center",
              variant === "auth-modal"
                ? "size-5 text-[#23282f]"
                : variant === "mango-light"
                  ? "size-5 text-[#23282f]"
                  : undefined,
            )}
          >
            {provider.icon}
          </span>
          <span
            className={cn(
              variant === "auth-modal" && "text-center",
              variant === "mango-light" && "text-center",
            )}
            style={variant === "mango-light" ? { color: "#23282f" } : undefined}
          >
            {provider.title}
          </span>
        </Button>
      ))}
    </div>
  );
}
