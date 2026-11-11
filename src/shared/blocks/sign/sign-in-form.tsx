"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { signIn } from "@/core/auth/client";
import { Link, useRouter } from "@/core/i18n/navigation";
import { defaultLocale } from "@/config/locale";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAppContext } from "@/shared/contexts/app";
import { rememberPendingLogin } from "@/shared/lib/google-tag";
import { cn } from "@/shared/lib/utils";

import { SocialProviders } from "./social-providers";

export function SignInForm({
  callbackUrl = "/",
  className,
  variant = "default",
}: {
  callbackUrl: string;
  className?: string;
  variant?: "default" | "auth-modal";
}) {
  const t = useTranslations("common.sign");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { configs, setIsShowSignModal } = useAppContext();

  const isGoogleAuthEnabled = configs.google_auth_enabled === "true";
  const isGithubAuthEnabled = configs.github_auth_enabled === "true";
  const isEmailAuthEnabled =
    configs.email_auth_enabled !== "false" ||
    (!isGoogleAuthEnabled && !isGithubAuthEnabled); // no social providers enabled, auto enable email auth

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

  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(
    callbackUrl || "/",
  )}`;

  const handleSignIn = async () => {
    if (loading) {
      return;
    }

    if (!email || !password) {
      toast.error("email and password are required");
      return;
    }

    try {
      setLoading(true);
      rememberPendingLogin("email");
      await signIn.email(
        {
          email,
          password,
          callbackURL: callbackUrl,
        },
        {
          onRequest: (ctx) => {
            setLoading(true);
          },
          onResponse: (ctx) => {
            setLoading(false);
          },
          onSuccess: (ctx) => {},
          onError: (e: any) => {
            toast.error(e?.error?.message || "sign in failed");
            setLoading(false);
          },
        },
      );
    } catch (e: any) {
      toast.error(e.message || "sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const isMobileForm = className?.includes("mobile-form");
  const isAuthModal = variant === "auth-modal";

  return (
    <div className={cn("w-full md:max-w-md", className)}>
      <div className={cn("grid", isAuthModal ? "gap-3.5" : "gap-4")}>
        <SocialProviders
          configs={configs}
          callbackUrl={callbackUrl || "/"}
          loading={loading}
          setLoading={setLoading}
          variant={isAuthModal ? "auth-modal" : "default"}
        />

        {isAuthModal &&
          isEmailAuthEnabled &&
          (isGoogleAuthEnabled || isGithubAuthEnabled) && (
            <div className="relative py-1.5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#e5e7eb]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-3 font-semibold tracking-[0.18em] text-[#8b95a7]">
                  {t("or")}
                </span>
              </div>
            </div>
          )}

        {isEmailAuthEnabled && (
          <>
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className={cn(
                  isMobileForm && "text-base",
                  isAuthModal && "text-[13px] font-semibold text-[#23282f]",
                )}
              >
                {t("email_title")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("email_placeholder")}
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
                className={cn(
                  isMobileForm &&
                    "h-14 rounded-xl border-0 bg-muted/50 text-base",
                  isAuthModal &&
                    "h-12 rounded-[8px] border-[#e5e7eb] bg-[#f9fafb] px-4 text-[15px] text-[#23282f] shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#cfd6e2] focus-visible:ring-[#23282f]/10 focus-visible:ring-offset-0",
                )}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center mb-1">
                <Label
                  htmlFor="password"
                  className={cn(
                    isMobileForm && "text-base",
                    isAuthModal && "text-[13px] font-semibold text-[#23282f]",
                  )}
                >
                  {t("password_title")}
                </Label>
                <Link
                  href="/forgot-password"
                  className={cn(
                    "ml-auto inline-block underline text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200",
                    isMobileForm ? "text-sm" : "text-xs",
                    isAuthModal &&
                      "font-semibold text-[#6b7280] decoration-[#c8ced8] underline-offset-4 hover:text-[#23282f]",
                  )}
                >
                  {t("forgot_password")}
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder={t("password_placeholder")}
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  isMobileForm &&
                    "h-14 rounded-xl border-0 bg-muted/50 text-base",
                  isAuthModal &&
                    "h-12 rounded-[8px] border-[#e5e7eb] bg-[#f9fafb] px-4 text-[15px] text-[#23282f] shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#cfd6e2] focus-visible:ring-[#23282f]/10 focus-visible:ring-offset-0",
                )}
              />
            </div>

            {/* <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              onClick={() => {
                setRememberMe(!rememberMe);
              }}
            />
            <Label htmlFor="remember">{t("remember_me_title")}</Label>
          </div> */}

            <Button
              type="submit"
              className={cn(
                "w-full",
                isMobileForm && "h-14 rounded-xl text-base font-medium",
                isAuthModal && [
                  "mt-1 h-12 rounded-[8px] bg-[#23282f] text-[15px] font-semibold text-white",
                  "shadow-[0_14px_30px_rgba(35,40,47,0.18)] transition-all duration-200",
                  "hover:-translate-y-0.5 hover:bg-[#111827] hover:text-white hover:shadow-[0_18px_36px_rgba(35,40,47,0.22)]",
                  "active:translate-y-0 active:bg-black",
                ],
              )}
              disabled={loading}
              onClick={handleSignIn}
            >
              {loading ? (
                <Loader2
                  size={isMobileForm ? 20 : 16}
                  className="animate-spin"
                />
              ) : (
                <p> {t("sign_in_title")} </p>
              )}
            </Button>
          </>
        )}
      </div>
      {isEmailAuthEnabled && (
        <div
          className={cn(
            "flex w-full justify-center border-t py-4",
            isMobileForm && "mt-2",
            isAuthModal && "mt-5 border-[#e5e7eb] pb-0 pt-4",
          )}
        >
          <p
            className={cn(
              "text-center text-neutral-500",
              isMobileForm ? "text-sm" : "text-xs",
              isAuthModal && "text-[13px] text-[#6b7280]",
            )}
          >
            {t("no_account")}
            <Link
              href={signUpHref}
              className={cn(
                "underline",
                isAuthModal &&
                  "font-semibold text-[#23282f] decoration-[#c8ced8] underline-offset-4 hover:text-black",
              )}
              onClick={() => setIsShowSignModal(false)}
            >
              <span className={cn(!isAuthModal && "dark:text-white/70")}>
                {t("sign_up_title")}
              </span>
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
