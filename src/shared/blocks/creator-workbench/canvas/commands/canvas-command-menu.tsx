"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { AudioLines, ImageIcon, List, Video } from "lucide-react";

import { getCanvasCopy } from "../canvas-copy";
import type { CanvasCommandType } from "../core/canvas-types";
import { getCanvasCommandDefinition } from "./canvas-command-registry";

export function CanvasCommandMenu({
  x,
  y,
  commands,
  title,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  commands: CanvasCommandType[];
  title?: string;
  onSelect: (command: CanvasCommandType) => void;
  onClose: () => void;
}) {
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

  const getCommandIcon = (command: CanvasCommandType) => {
    switch (command) {
      case "apply-template":
        return <List className="size-4" />;
      case "text-to-image":
      case "image-to-image":
        return <ImageIcon className="size-4" />;
      case "text-to-video":
      case "image-to-video":
        return <Video className="size-4" />;
      case "upload-reference":
        return <AudioLines className="size-4" />;
      default:
        return <List className="size-4" />;
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-30 w-[330px] rounded-[22px] border border-white/10 bg-[rgba(29,29,31,0.97)] p-3 shadow-[0_24px_72px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      style={{ left: x, top: y }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="px-2 pb-2 pt-0.5 text-[13px] font-semibold text-white/62">
        {title || copy.common.chooseReferenceFromCanvas}
      </div>
      <div className="space-y-1.5">
        {commands.map((command) => {
          const item = getCanvasCommandDefinition(command, copy);
          return (
            <button
              key={command}
              type="button"
              onClick={() => onSelect(command)}
              className="flex w-full items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-white/14 hover:bg-white/[0.08]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.05] text-white/82">
                {getCommandIcon(command)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold leading-tight text-white">
                  {item.label}
                </div>
                <div className="mt-1 text-[12px] leading-5 text-white/42">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2.5 w-full rounded-[15px] border border-white/8 bg-white/[0.03] px-3 py-2 text-[13px] text-white/58 transition hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
      >
        {copy.common.cancel}
      </button>
    </div>
  );
}
