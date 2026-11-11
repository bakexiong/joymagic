"use client";

import { ReactNode, useState } from "react";

import { Link, usePathname } from "@/core/i18n/navigation";
import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { Nav } from "@/shared/types/blocks/common";

export function ConsoleLayout({
  title,
  description,
  nav,
  topNav,
  className,
  variant = "default",
  hidePageHeader = false,
  children,
}: {
  title?: string;
  description?: string;
  nav?: Nav;
  topNav?: Nav;
  className?: string;
  variant?: "default" | "mango";
  hidePageHeader?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAffiliateSettingsPage = pathname?.endsWith("/settings/affiliate");
  const [searchQuery, setSearchQuery] = useState("");
  const isMangoVariant = variant === "mango";
  const filteredItems = nav?.items.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderNavItems = () => (
    <nav className={cn("space-y-1", isMangoVariant && "space-y-2")}>
      {filteredItems?.map((item, idx) => (
        <Link
          key={idx}
          href={item.url || ""}
          className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-colors",
            isMangoVariant
              ? item.is_active ||
                pathname.endsWith(item.url as string) ||
                item.url?.endsWith(pathname)
                ? "bg-[#23282f] text-white shadow-[0_12px_24px_rgba(35,40,47,0.16)]"
                : "text-[#4a5464] hover:bg-[#fff8e1] hover:text-[#23282f]"
              : item.is_active ||
                  pathname.endsWith(item.url as string) ||
                  item.url?.endsWith(pathname)
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          <SmartIcon name={item.icon as string} size={16} />
          <span className={cn(isMangoVariant && "font-semibold")}>
            {item.title}
          </span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div
      className={cn(
        "min-h-screen",
        isMangoVariant
          ? [
              "bg-[#fff7df] text-[#23282f]",
              "bg-[radial-gradient(circle_at_top_left,rgba(255,193,0,0.2),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,178,255,0.07),transparent_18%),linear-gradient(180deg,#fff9e8_0%,#fff7df_18%,#f5f7f9_58%,#f5f7f9_100%)]",
              "[&_[data-slot=card]]:rounded-[28px] [&_[data-slot=card]]:border-[#e5e7eb] [&_[data-slot=card]]:bg-white [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]",
              "[&_[data-slot=card-header]]:gap-2 [&_[data-slot=card-header]]:px-7 [&_[data-slot=card-header]]:pt-7",
              "[&_[data-slot=card-title]]:text-[1.375rem] [&_[data-slot=card-title]]:font-semibold [&_[data-slot=card-title]]:text-[#23282f]",
              "[&_[data-slot=card-description]]:text-[0.95rem] [&_[data-slot=card-description]]:leading-7 [&_[data-slot=card-description]]:text-[#4a5464]",
              "[&_[data-slot=card-content]]:px-7 [&_[data-slot=card-content]]:pb-7",
              "[&_[data-slot=card-footer]]:rounded-b-[28px] [&_[data-slot=card-footer]]:border-t [&_[data-slot=card-footer]]:border-[#eef0f2] [&_[data-slot=card-footer]]:bg-[#f5f7f9] [&_[data-slot=card-footer]]:px-7 [&_[data-slot=card-footer]]:py-5",
              "[&_[data-slot=button]]:rounded-full [&_[data-slot=button]]:font-semibold [&_[data-slot=button]]:tracking-[0.01em] [&_[data-slot=button]]:transition-all",
              "[&_.bg-primary[data-slot=button]]:h-11 [&_.bg-primary[data-slot=button]]:bg-[#23282f] [&_.bg-primary[data-slot=button]]:px-5 [&_.bg-primary[data-slot=button]]:text-white [&_.bg-primary[data-slot=button]]:shadow-none hover:[&_.bg-primary[data-slot=button]]:bg-[#333333]",
              "[&_.border[data-slot=button]]:h-11 [&_.border[data-slot=button]]:border-2 [&_.border[data-slot=button]]:border-[#23282f] [&_.border[data-slot=button]]:bg-white [&_.border[data-slot=button]]:px-5 [&_.border[data-slot=button]]:text-[#23282f] [&_.border[data-slot=button]]:shadow-none hover:[&_.border[data-slot=button]]:bg-[#f5f7f9]",
              "[&_.bg-destructive[data-slot=button]]:h-11 [&_.bg-destructive[data-slot=button]]:bg-[#ff5735] hover:[&_.bg-destructive[data-slot=button]]:bg-[#ff4c2c]",
              "[&_[data-slot=badge]]:rounded-full [&_[data-slot=badge]]:border-[#e5e7eb] [&_[data-slot=badge]]:bg-[#f5f7f9] [&_[data-slot=badge]]:px-3 [&_[data-slot=badge]]:py-1 [&_[data-slot=badge]]:text-[#333333]",
              "[&_[data-slot=input]]:h-11 [&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:border-[#e5e7eb] [&_[data-slot=input]]:bg-white [&_[data-slot=input]]:px-4 [&_[data-slot=input]]:text-[15px] [&_[data-slot=input]]:text-[#333333] [&_[data-slot=input]]:shadow-none focus-visible:[&_[data-slot=input]]:border-[#00b2ff] focus-visible:[&_[data-slot=input]]:ring-[#00b2ff]/10",
              "[&_textarea]:min-h-[132px] [&_textarea]:rounded-[20px] [&_textarea]:border-[#e5e7eb] [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-[15px] [&_textarea]:text-[#333333] [&_textarea]:shadow-none focus-visible:[&_textarea]:ring-[#00b2ff]/10",
              "[&_[data-slot=table-container]]:overflow-hidden [&_[data-slot=table-container]]:rounded-[20px] [&_[data-slot=table-container]]:border [&_[data-slot=table-container]]:border-[#eef0f2]",
              "[&_[data-slot=table-head]]:h-12 [&_[data-slot=table-head]]:bg-[#f5f7f9] [&_[data-slot=table-head]]:px-4 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-semibold [&_[data-slot=table-head]]:uppercase [&_[data-slot=table-head]]:tracking-[0.08em] [&_[data-slot=table-head]]:text-[#4a5464]",
              "[&_[data-slot=table-cell]]:px-4 [&_[data-slot=table-cell]]:py-3 [&_[data-slot=table-cell]]:align-middle [&_[data-slot=table-cell]]:text-sm [&_[data-slot=table-cell]]:text-[#23282f]",
              "[&_[data-slot=table-row]]:border-[#eef0f2] hover:[&_[data-slot=table-row]]:bg-[#fff8e1]/60",
              "[&_[role=tablist]]:h-auto [&_[role=tablist]]:rounded-full [&_[role=tablist]]:border [&_[role=tablist]]:border-[#e5e7eb] [&_[role=tablist]]:bg-[#f5f7f9] [&_[role=tablist]]:p-1",
              "[&_[role=tab]]:rounded-full [&_[role=tab]]:px-4 [&_[role=tab]]:py-2 [&_[role=tab]]:text-sm [&_[role=tab]]:font-semibold [&_[role=tab]]:text-[#4a5464] [&_[role=tab][data-state=active]]:bg-[#23282f] [&_[role=tab][data-state=active]]:text-white [&_[role=tab][data-state=active]]:shadow-none",
            ].join(" ")
          : "bg-background",
        className,
      )}
    >
      {/* Top Navigation */}
      {topNav && (
        <div
          className={cn(
            isAffiliateSettingsPage ? "" : "border-border border-b",
            isMangoVariant && "border-transparent bg-transparent",
          )}
        >
          <div className={cn("container", isMangoVariant && "pt-6")}>
            <nav
              className={cn(
                "scrollbar-hide flex items-center gap-4 overflow-x-auto py-0 text-sm",
                isMangoVariant &&
                  "inline-flex w-auto rounded-full border border-[#f1df9c] bg-white/95 px-2 py-2 shadow-[0_18px_42px_rgba(255,193,0,0.12)] backdrop-blur-sm",
              )}
            >
              {topNav.items.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.url || ""}
                  className={cn(
                    "flex shrink-0 items-center gap-2 px-3 py-2 duration-200 ease-linear",
                    isMangoVariant
                      ? item.is_active ||
                        pathname?.startsWith(item.url as string)
                        ? "rounded-full bg-[#23282f] text-white shadow-[0_10px_24px_rgba(35,40,47,0.18)]"
                        : "rounded-full text-[#4a5464] hover:bg-[#fff4c6] hover:text-[#23282f]"
                      : `text-muted-foreground hover:bg-foreground/10 ${
                          item.is_active ||
                          pathname?.startsWith(item.url as string)
                            ? "border-primary text-muted-foreground border-b-2"
                            : ""
                        } hover:text-foreground`,
                  )}
                >
                  {item.icon && (
                    <SmartIcon name={item.icon as string} size={16} />
                  )}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Page Header */}
      {!hidePageHeader ? (
        <div
          className={cn(
            "border-border",
            isMangoVariant && "border-transparent",
          )}
        >
          <div className="container">
            <div
              className={cn(
                "flex items-center gap-4 py-6",
                isMangoVariant &&
                  "rounded-[30px] border border-[#f1df9c] bg-white px-6 py-6 shadow-[0_22px_52px_rgba(255,193,0,0.1)] md:px-8",
              )}
            >
              {/* Mobile Menu Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "md:hidden",
                      isMangoVariant &&
                        "border-2 border-[#23282f] bg-white text-[#23282f] hover:bg-[#fff8e1]",
                    )}
                  >
                    <SmartIcon name="Menu" size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 px-4">
                  <SheetHeader className="mb-4 px-0">
                    <SheetTitle>{title || "Menu"}</SheetTitle>
                  </SheetHeader>
                  {renderNavItems()}
                </SheetContent>
              </Sheet>

              <div className="space-y-2">
                <h1
                  className={cn(
                    "text-foreground text-2xl font-semibold md:text-3xl",
                    isMangoVariant &&
                      "text-[2rem] leading-[1.05] font-bold tracking-[-0.03em] text-[#23282f] md:text-[2.7rem]",
                  )}
                >
                  {title}
                </h1>
                {description ? (
                  <p
                    className={cn(
                      "text-muted-foreground text-sm",
                      isMangoVariant && "max-w-2xl text-base text-[#4a5464]",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container md:hidden">
          <div className="py-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    isMangoVariant &&
                      "border-2 border-[#23282f] bg-white text-[#23282f] hover:bg-[#fff8e1]",
                  )}
                >
                  <SmartIcon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 px-4">
                <SheetHeader className="mb-4 px-0">
                  <SheetTitle>{title || "Menu"}</SheetTitle>
                </SheetHeader>
                {renderNavItems()}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container">
        <div
          className={cn(
            "flex flex-wrap gap-8 py-8",
            isMangoVariant && "items-start gap-6 pb-12 pt-4 lg:flex-nowrap",
          )}
        >
          {/* Left Sidebar (Desktop) */}
          <div
            className={cn(
              "hidden w-64 flex-shrink-0 md:block",
              isMangoVariant && "lg:w-[280px]",
            )}
          >
            {/* Search Box */}
            {/* <div className="relative mb-6">
              <SmartIcon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div> */}

            {/* Navigation Menu */}
            <div
              className={cn(
                isMangoVariant &&
                  "rounded-[28px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]",
              )}
            >
              {renderNavItems()}
            </div>
          </div>

          {/* Right Content Area */}
          <div className={cn("min-w-0 flex-1", isMangoVariant && "space-y-8")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
