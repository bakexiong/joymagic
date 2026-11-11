"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import {
  Coins,
  LayoutDashboard,
  Loader2,
  LogOut,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { requestPasswordReset, signOut } from "@/core/auth/client";
import { Link, useRouter } from "@/core/i18n/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAppContext } from "@/shared/contexts/app";
import { cn } from "@/shared/lib/utils";
import { NavItem, UserNav } from "@/shared/types/blocks/common";
import { useMedia } from "@/shared/hooks/use-media";

import { SmartIcon } from "../common/smart-icon";
import { SignModal } from "./sign-modal";

export function SignUser({
  isScrolled,
  signButtonSize = "sm",
  userNav,
  buttonClassName,
  triggerClassName,
  containerClassName,
  menuVariant = "default",
}: {
  isScrolled?: boolean;
  signButtonSize?: "default" | "sm" | "lg" | "icon";
  userNav?: UserNav;
  buttonClassName?: string;
  triggerClassName?: string;
  containerClassName?: string;
  menuVariant?: "default" | "light";
}) {
  const t = useTranslations("common.sign");
  const locale = useLocale();
  const { isCheckSign, user, setIsShowSignModal } = useAppContext();
  const router = useRouter();
  const isLarge = useMedia("(min-width: 1024px)");

  const [mounted, setMounted] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLightMenu = menuVariant === "light";
  const dropdownContentClassName = isLightMenu
    ? "w-72 rounded-[1.25rem] border border-black/8 bg-white p-2 text-slate-950 shadow-[0_20px_48px_rgba(15,23,42,0.12)]"
    : "w-72 rounded-[1.15rem] border border-slate-200 bg-white p-1.5 text-slate-950 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-popover dark:text-popover-foreground dark:shadow-md";
  const dropdownItemClassName = isLightMenu
    ? "w-full cursor-pointer rounded-[1rem] px-4 py-3 text-[0.95rem] font-medium text-slate-950 hover:bg-[#f5f7f9] focus:bg-[#f5f7f9] dark:text-inherit"
    : "w-full cursor-pointer rounded-[0.9rem] px-3 py-3 text-[0.95rem] font-medium text-slate-950 hover:bg-slate-50 focus:bg-slate-50 dark:text-inherit dark:hover:bg-accent dark:focus:bg-accent";
  const dropdownSeparatorClassName = isLightMenu
    ? "my-1 bg-black/8"
    : "bg-slate-200 dark:bg-border";

  useEffect(() => {
    setMounted(true);
  }, []);

  // 防止滚动时菜单打开导致的问题
  useEffect(() => {
    if (isMenuOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      // 禁止背景滚动
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // 恢复滚动 - 使用 requestAnimationFrame 避免闪烁
        const restore = () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflow = '';
          window.scrollTo(0, scrollY);
        };
        requestAnimationFrame(restore);
      };
    }
  }, [isMenuOpen]);

  const handleResetPasswordForCurrentUser = async () => {
    if (!user?.email) {
      toast.error(t("reset_password_no_email"));
      return;
    }

    try {
      setResetLoading(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const localePrefix = locale ? `/${locale}` : "";
      const redirectTo = `${origin}${localePrefix}/reset-password`;

      await requestPasswordReset(user.email, redirectTo);
      toast.success(t("reset_password_email_sent"));
    } catch (error: any) {
      console.error("request password reset from dropdown failed", error);
      toast.error(
        error?.error?.message ||
          error?.message ||
          t("reset_password_email_failed"),
      );
    } finally {
      setResetLoading(false);
      setShowResetDialog(false);
    }
  };

  return (
    <>
      {isCheckSign || !mounted ? (
        <div>
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : user ? (
        <>
          {/* PC端使用下拉菜单 */}
          {isLarge ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-10 w-10 cursor-pointer rounded-full p-0",
                    triggerClassName,
                  )}
                >
                  <Avatar
                    className={cn(
                      isLightMenu &&
                        "border border-black/10 bg-[#fff4cf] shadow-[0_8px_20px_rgba(0,0,0,0.06)]",
                    )}
                  >
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback
                      className={cn(
                        isLightMenu ? "bg-[#fff4cf] text-black/35" : undefined,
                      )}
                    >
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={dropdownContentClassName}>
                {userNav?.show_name && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        className={dropdownItemClassName}
                        href="/settings/profile"
                      >
                        <User />
                        {user.name}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={dropdownSeparatorClassName} />
                  </>
                )}

                {userNav?.show_credits && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        className={dropdownItemClassName}
                        href="/settings/credits"
                      >
                        <Coins />
                        {t("credits_title", {
                          credits: user.credits?.remainingCredits || 0,
                        })}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={dropdownSeparatorClassName} />
                  </>
                )}

                {userNav?.items?.map((item: NavItem, idx: number) => (
                  <Fragment key={idx}>
                    <DropdownMenuItem asChild>
                      <Link
                        className={dropdownItemClassName}
                        href={item.url || ""}
                        target={item.target || "_self"}
                      >
                        {item.icon && (
                          <SmartIcon
                            name={item.icon as string}
                            className="h-4 w-4"
                          />
                        )}
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={dropdownSeparatorClassName} />
                  </Fragment>
                ))}

                <DropdownMenuItem
                  className={dropdownItemClassName}
                  onClick={() => setShowResetDialog(true)}
                >
                  <span>{t("reset_password_title")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={dropdownSeparatorClassName} />

                {user.isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        className={dropdownItemClassName}
                        href="/admin"
                      >
                        <LayoutDashboard />
                        {t("admin_title")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={dropdownSeparatorClassName} />
                  </>
                )}

                {userNav?.show_sign_out && (
                  <DropdownMenuItem
                    className={dropdownItemClassName}
                    onClick={async () => {
                      try {
                        await signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              window.location.href = "/";
                            },
                            onError: (error) => {
                              console.error("Sign out error:", error);
                              window.location.href = "/";
                            },
                          },
                        });
                      } catch (error) {
                        console.error("Sign out failed:", error);
                        window.location.href = "/";
                      }
                    }}
                  >
                    <LogOut />
                    <span>{t("sign_out_title")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* 移动端使用全屏菜单 */
            <>
              <Button
                variant="ghost"
                className={cn(
                  "relative z-50 h-10 w-10 cursor-pointer rounded-full p-0",
                  triggerClassName,
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(true);
                }}
              >
                <Avatar>
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>

              {isMenuOpen && (
                <div
                  className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto"
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}
                >
                  <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                  <div className="absolute top-6 right-6 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex h-full flex-col pt-20 px-6 max-w-md mx-auto">
                    <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                      {userNav?.show_name && (
                        <>
                          <Link
                            className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06]"
                            href="/settings/profile"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            <span>{user.name}</span>
                          </Link>
                          <div className="h-px bg-white/10 my-2" />
                        </>
                      )}

                      {userNav?.show_credits && (
                        <>
                          <Link
                            className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06]"
                            href="/settings/credits"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Coins className="h-5 w-5" />
                            <span>
                              {t("credits_title", {
                                credits: user.credits?.remainingCredits || 0,
                              })}
                            </span>
                          </Link>
                          <div className="h-px bg-white/10 my-2" />
                        </>
                      )}

                      {userNav?.items?.map((item: NavItem, idx: number) => (
                        <Fragment key={idx}>
                          <Link
                            className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06]"
                            href={item.url || ""}
                            target={item.target || "_self"}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon && (
                              <SmartIcon
                                name={item.icon as string}
                                className="h-5 w-5"
                              />
                            )}
                            <span>{item.title}</span>
                          </Link>
                          <div className="h-px bg-white/10 my-2" />
                        </Fragment>
                      ))}

                      <button
                        className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06] w-full text-left"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowResetDialog(true);
                        }}
                      >
                        <span>{t("reset_password_title")}</span>
                      </button>
                      <div className="h-px bg-white/10 my-2" />

                      {user.isAdmin && (
                        <>
                          <Link
                            className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06]"
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            <span>{t("admin_title")}</span>
                          </Link>
                          <div className="h-px bg-white/10 my-2" />
                        </>
                      )}

                      {userNav?.show_sign_out && (
                        <button
                          className="flex items-center gap-3 px-5 py-4 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-slate-200 hover:bg-white/[0.06] w-full text-left"
                          onClick={async () => {
                            setIsMenuOpen(false);
                            try {
                              await signOut({
                                fetchOptions: {
                                  onSuccess: () => {
                                    window.location.href = "/";
                                  },
                                  onError: (error) => {
                                    console.error("Sign out error:", error);
                                    window.location.href = "/";
                                  },
                                },
                              });
                            } catch (error) {
                              console.error("Sign out failed:", error);
                              window.location.href = "/";
                            }
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          <span>{t("sign_out_title")}</span>
                        </button>
                      )}
                    </div>

                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/98 to-transparent" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reset password dialog */}
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>{t("reset_password_title")}</DialogTitle>
                <DialogDescription>
                  {t("reset_password_dialog_description", {
                    email: user.email,
                  })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowResetDialog(false)}
                  disabled={resetLoading}
                >
                  {t("reset_password_dialog_cancel")}
                </Button>
                <Button
                  onClick={handleResetPasswordForCurrentUser}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("reset_password_dialog_confirm")}
                    </>
                  ) : (
                    t("reset_password_dialog_confirm")
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div
          className={cn(
            "flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit",
            containerClassName,
          )}
        >
          {/* 移动端：跳转到 /sign-in 页面 */}
          {!isLarge ? (
            <Button
              asChild
              size={signButtonSize}
              className={cn(
                "border-foreground/10 ml-4 cursor-pointer ring-0",
                isScrolled && "lg:hidden",
                buttonClassName,
              )}
            >
              <Link href="/sign-in">{t("sign_in_title")}</Link>
            </Button>
          ) : (
            /* 桌面端：打开模态框 */
            <>
              <Button
                asChild
                size={signButtonSize}
                className={cn(
                  "border-foreground/10 ml-4 cursor-pointer ring-0",
                  isScrolled && "lg:hidden",
                  buttonClassName,
                )}
                onClick={() => setIsShowSignModal(true)}
              >
                <span>{t("sign_in_title")}</span>
              </Button>
              <SignModal />
            </>
          )}
        </div>
      )}
    </>
  );
}
