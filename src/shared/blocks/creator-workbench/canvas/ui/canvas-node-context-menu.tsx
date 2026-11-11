"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { Clipboard, Copy, Delete, Files, PackagePlus } from "lucide-react";

import { getCanvasCopy } from "@/shared/blocks/creator-workbench/canvas/canvas-copy";
import { cn } from "@/shared/lib/utils";

type CanvasNodeContextMenuProps = {
  x: number;
  y: number;
  canPaste: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyToClipboard: () => void;
  onClose: () => void;
};

function MenuItem({
  label,
  shortcut,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  const handleActivate = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleActivate();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          handleActivate();
        }
      }}
      className={cn(
        "flex h-11 w-full select-none items-center justify-between gap-6 rounded-[15px] px-4 text-left text-[15px] font-semibold transition",
        disabled
          ? "cursor-not-allowed text-white/28"
          : "text-white/88 hover:bg-white/[0.08]",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={cn("text-white/46", disabled && "text-white/22")}>
          {icon}
        </span>
        <span>{label}</span>
      </span>
      {shortcut ? (
        <span
          className={cn(
            "text-[13px] text-white/34",
            disabled && "text-white/20",
          )}
        >
          {shortcut}
        </span>
      ) : null}
    </button>
  );
}

export function CanvasNodeContextMenu({
  x,
  y,
  canPaste,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onCopyToClipboard,
  onClose,
}: CanvasNodeContextMenuProps) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !menuRef.current) return;
      if (!menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-40 w-[270px] select-none rounded-[22px] border border-white/10 bg-[rgba(27,27,28,0.97)] p-2.5 shadow-[0_24px_78px_rgba(0,0,0,0.46)] backdrop-blur-xl"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="px-3 pb-2 pt-1 text-[15px] font-semibold text-white/92">
        {copy.common.createAsset}
      </div>

      <div className="space-y-1">
        <MenuItem
          label={copy.common.copy}
          shortcut="⌘C"
          icon={<Copy className="size-4" />}
          onClick={onCopy}
        />
        <MenuItem
          label={copy.common.paste}
          shortcut="⌘V"
          icon={<Clipboard className="size-4" />}
          disabled={!canPaste}
          onClick={onPaste}
        />
        <MenuItem
          label={copy.common.duplicate}
          icon={<Files className="size-4" />}
          onClick={onDuplicate}
        />
      </div>

      <div className="my-2 h-px bg-white/8" />

      <MenuItem
        label={copy.common.delete}
        shortcut="⌫"
        icon={<Delete className="size-4" />}
        onClick={onDelete}
      />

      <div className="my-2 h-px bg-white/8" />

      <MenuItem
        label={copy.common.copyToClipboard}
        icon={<PackagePlus className="size-4" />}
        onClick={onCopyToClipboard}
      />
    </div>
  );
}
