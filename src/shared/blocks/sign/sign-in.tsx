"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { signIn } from "@/core/auth/client";
import { Link } from "@/core/i18n/navigation";
import { defaultLocale } from "@/config/locale";
import { Button } from "@/shared/components/ui/button";
import { rememberPendingLogin } from "@/shared/lib/google-tag";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from "@/shared/components/ui/label";
import { LocaleSelector } from "@/shared/blocks/common";
import { BrandLogo } from "@/shared/blocks/common/brand-logo";
import { SocialProviders } from "./social-providers";

export function SignIn({
  configs,
  callbackUrl = "/",
  verifyEmailHint = false,
}: {
  configs: Record<string, string>;
  callbackUrl: string;
  verifyEmailHint?: boolean;
}) {
  const t = useTranslations("common.sign");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(verifyEmailHint);

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

    rememberPendingLogin("email");

    await signIn.email(
      {
        email,
        password,
        callbackURL: callbackUrl,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onResponse: () => {
          setLoading(false);
        },
        onSuccess: () => {},
        onError: (e: any) => {
          const code = e?.error?.code || e?.error?.body?.code;
          if (code === "EMAIL_NOT_VERIFIED") {
            setShowVerifyDialog(true);
            toast.error(t("email_not_verified"));
          } else {
            toast.error(e?.error?.message || "sign in failed");
          }
          setLoading(false);
        },
      },
    );
  };

  return (
    <>
      {/* Mobile: Brand-led stacked layout */}
      <div
        className="flex min-h-screen flex-col md:hidden"
        style={{
          background:
            "linear-gradient(180deg, #ffc100 0%, #ffd54f 38%, #fff7da 100%)",
          color: "#23282f",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <BrandLogo
            brand={{
              title: configs.app_name || "joymagic",
              logo: {
                src: "/logo.png",
                alt: configs.app_name || "joymagic",
              },
              url: "/",
              target: "_self",
              className: "",
            }}
            showTitle={false}
          />
          <LocaleSelector type="button" />
        </div>

        <div className="px-6 pb-4">
          <div className="mb-5 rounded-[28px] border border-black/10 bg-black/90 p-5 text-white shadow-[0_18px_50px_rgba(35,40,47,0.22)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffc100]">
              Creative AI Suite
            </p>
            <h1 className="max-w-[12ch] text-[2rem] font-bold leading-[1.05]">
              {configs.app_name || "joymagic"} makes visual creation feel fast.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Use one account to keep your projects, credits, and workflows in
              sync.
            </p>
          </div>
        </div>

        <div
          className="flex-1 rounded-t-[32px] px-6 pb-8 pt-7 shadow-[0_-12px_40px_rgba(35,40,47,0.12)]"
          style={{ backgroundColor: "#ffffff", color: "#23282f" }}
        >
          <div className="mb-7">
            <h2
              className="mb-2 text-[2rem] font-bold tracking-[-0.02em]"
              style={{ color: "#23282f" }}
            >
              {t("sign_in_title")}
            </h2>
            <p className="text-[15px] leading-6" style={{ color: "#4a5464" }}>
              {t("sign_in_description")}
            </p>
          </div>

          <div className="flex flex-1 flex-col">
            {isEmailAuthEnabled && (
              <>
                <div className="mb-6 space-y-4">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold"
                      style={{ color: "#23282f" }}
                    >
                      {t("email_title")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder={t("email_placeholder")}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      className="h-12 rounded-2xl border px-4 text-base shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#d9dee7] focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{
                        borderColor: "#e5e7eb",
                        backgroundColor: "#f9fafb",
                        color: "#23282f",
                      }}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold"
                      style={{ color: "#23282f" }}
                    >
                      {t("password_title")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("password_placeholder")}
                      autoComplete="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border px-4 text-base shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#d9dee7] focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{
                        borderColor: "#e5e7eb",
                        backgroundColor: "#f9fafb",
                        color: "#23282f",
                      }}
                    />
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium transition-colors hover:text-[#23282f]"
                        style={{ color: "#4a5464" }}
                      >
                        {t("forgot_password")}
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mb-6 h-[3.25rem] w-full rounded-full text-base font-semibold text-white shadow-[0_14px_28px_rgba(35,40,47,0.18)] transition-all duration-200 hover:scale-[1.01] hover:bg-black"
                  style={{ backgroundColor: "#23282f", color: "#ffffff" }}
                  disabled={loading}
                  onClick={handleSignIn}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <span>{t("sign_in_title")}</span>
                  )}
                </Button>
              </>
            )}

            {isEmailAuthEnabled &&
              (isGoogleAuthEnabled || isGithubAuthEnabled) && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#e5e7eb]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span
                      className="bg-white px-3 font-semibold tracking-[0.2em]"
                      style={{ color: "#8b95a7" }}
                    >
                      OR
                    </span>
                  </div>
                </div>
              )}

            <div className="mb-6">
              <SocialProviders
                configs={configs}
                callbackUrl={callbackUrl || "/"}
                loading={loading}
                setLoading={setLoading}
                variant="mango-light"
              />
            </div>

            <div className="mt-auto">
              {isEmailAuthEnabled && (
                <p
                  className="mb-4 text-center text-sm"
                  style={{ color: "#4a5464" }}
                >
                  {t("no_account")}{" "}
                  <Link
                    href={signUpHref}
                    className="font-semibold underline decoration-[#ffc100] underline-offset-4"
                    style={{ color: "#23282f" }}
                  >
                    {t("sign_up_title")}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: airy background + single auth card */}
      <div
        className="relative hidden min-h-screen overflow-hidden md:block"
        style={{ backgroundColor: "#fffdfa", color: "#23282f" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,193,0,0.18),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(255,193,0,0.12),transparent_24%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-8 pb-16 pt-24 lg:px-16">
          <Card
            className="w-full max-w-md rounded-[20px] border py-0 shadow-[0_18px_50px_rgba(35,40,47,0.1)]"
            style={{
              borderColor: "#e5e7eb",
              backgroundColor: "#ffffff",
              color: "#23282f",
            }}
          >
            <CardHeader className="space-y-2 px-6 pb-0 pt-6">
              <CardTitle
                className="text-xl font-semibold"
                style={{ color: "#23282f" }}
              >
                <h1>{t("sign_in_title")}</h1>
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: "#4a5464" }}>
                <h2>{t("sign_in_description")}</h2>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-6">
              <div className="grid gap-4">
                {isEmailAuthEnabled && (
                  <>
                    <div className="grid gap-2.5">
                      <Label
                        htmlFor="email-desktop"
                        className="text-sm font-semibold"
                        style={{ color: "#23282f" }}
                      >
                        {t("email_title")}
                      </Label>
                      <Input
                        id="email-desktop"
                        type="email"
                        inputMode="email"
                        placeholder={t("email_placeholder")}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className="h-10 rounded-md border bg-white px-3 text-sm shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#d9dee7] focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{
                          borderColor: "#e5e7eb",
                          backgroundColor: "#ffffff",
                          color: "#23282f",
                        }}
                      />
                    </div>

                    <div className="grid gap-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor="password-desktop"
                          className="text-sm font-semibold"
                          style={{ color: "#23282f" }}
                        >
                          {t("password_title")}
                        </Label>
                        <Link
                          href="/forgot-password"
                          className="text-sm font-medium transition-colors hover:text-[#23282f]"
                          style={{ color: "#4a5464" }}
                        >
                          {t("forgot_password")}
                        </Link>
                      </div>

                      <Input
                        id="password-desktop"
                        type="password"
                        placeholder={t("password_placeholder")}
                        autoComplete="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 rounded-md border bg-white px-3 text-sm shadow-none placeholder:text-[#8b95a7] focus-visible:border-[#d9dee7] focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{
                          borderColor: "#e5e7eb",
                          backgroundColor: "#ffffff",
                          color: "#23282f",
                        }}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="h-10 w-full rounded-md text-sm font-medium text-white shadow-none transition-colors hover:bg-black"
                      style={{ backgroundColor: "#23282f", color: "#ffffff" }}
                      disabled={loading}
                      onClick={handleSignIn}
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <span>{t("sign_in_title")}</span>
                      )}
                    </Button>
                  </>
                )}

                {isEmailAuthEnabled &&
                  (isGoogleAuthEnabled || isGithubAuthEnabled) && (
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#e5e7eb]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span
                          className="bg-white px-3 text-sm font-medium"
                          style={{ color: "#6b7280" }}
                        >
                          OR
                        </span>
                      </div>
                    </div>
                  )}

                <SocialProviders
                  configs={configs}
                  callbackUrl={callbackUrl || "/"}
                  loading={loading}
                  setLoading={setLoading}
                  variant="mango-light"
                />
              </div>
            </CardContent>
            {isEmailAuthEnabled && (
              <CardFooter className="px-6 pb-6">
                <div className="flex w-full justify-center border-t border-[#e5e7eb] pt-6">
                  <p
                    className="text-center text-sm"
                    style={{ color: "#4a5464" }}
                  >
                    {t("no_account")}{" "}
                    <Link
                      href={signUpHref}
                      className="font-semibold hover:underline"
                      style={{ color: "#23282f" }}
                    >
                      {t("sign_up_title")}
                    </Link>
                  </p>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Email verification hint dialog when coming from sign-up */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t("verify_email_title")}</DialogTitle>
            <DialogDescription>
              {t("verify_email_description", { email: "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button onClick={() => setShowVerifyDialog(false)}>
              {t("reset_password_dialog_cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
