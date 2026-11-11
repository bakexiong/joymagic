"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Coins, Pencil } from "lucide-react";

import { Link } from "@/core/i18n/navigation";
import { getCanvasCopy } from "@/shared/blocks/creator-workbench/canvas/canvas-copy";
import { getSiteLogoUrl } from "@/shared/lib/site-logo";

export function CanvasTopBar({
  title,
  homeHref,
  remainingCredits,
  onOpenPricing,
  onRename,
}: {
  title: string;
  homeHref: string;
  remainingCredits?: number | null;
  onOpenPricing?: () => void;
  onRename?: (name: string) => Promise<void> | void;
}) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  const [draftTitle, setDraftTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  const commitRename = async () => {
    const nextName = draftTitle.trim();
    setIsEditing(false);

    if (!onRename || !nextName || nextName === title) {
      setDraftTitle(nextName || title);
      return;
    }

    try {
      setIsRenaming(true);
      await onRename(nextName);
    } finally {
      setIsRenaming(false);
    }
  };

  const creditsLabel =
    typeof remainingCredits === "number"
      ? new Intl.NumberFormat("zh-CN").format(remainingCredits)
      : "--";

  return (
    <div className="absolute inset-x-6 top-6 z-20 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href={homeHref}
          className="shrink-0 transition hover:opacity-90"
          aria-label={copy.common.homeAria}
        >
          <Image
            src={getSiteLogoUrl(216, 72)}
            alt="Barko Bear"
            width={108}
            height={36}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <div className="min-w-0 text-white">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                autoFocus
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={() => void commitRename()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commitRename();
                  }
                  if (event.key === "Escape") {
                    setDraftTitle(title);
                    setIsEditing(false);
                  }
                }}
                className="min-w-[14rem] rounded-md border border-white/14 bg-black/20 px-2 py-1 text-sm font-semibold text-white/92 outline-none focus:border-white/24"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex min-w-0 cursor-text items-center gap-2 text-left text-sm font-semibold text-white/92 transition hover:text-white"
              >
                <span className="truncate text-[1.2rem] font-semibold leading-none md:text-[1.35rem]">
                  {title}
                </span>
                <Pencil className="size-3.5 shrink-0 text-white/32" />
              </button>
            )}
          </div>
          {isRenaming ? (
            <div className="mt-1 text-xs text-white/45">{copy.common.renaming}</div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPricing}
          className="inline-flex cursor-pointer items-center rounded-[18px] border border-white/10 bg-[rgba(24,26,31,0.9)] px-4 py-3 text-sm font-medium text-white/78 shadow-[0_16px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl transition hover:border-white/18 hover:text-white"
        >
          {copy.common.pricing}
        </button>
        <div className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-[rgba(24,26,31,0.9)] px-4 py-3 text-sm text-white/78 shadow-[0_16px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <Coins className="size-4" />
          <span>{creditsLabel}</span>
        </div>
      </div>
    </div>
  );
}
