"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const SelectPortalContainerContext = React.createContext<HTMLElement | null>(
  null,
);

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-[14px] border border-[rgba(214,235,253,0.19)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] px-3.5 py-2 text-sm text-[#F0F0F0] shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.24)] outline-none transition-[border-color,background-color,color,box-shadow] data-[size=default]:h-10 data-[size=sm]:h-8 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-[#A1A4A5] focus-visible:border-[rgba(214,235,253,0.28)] focus-visible:bg-white/[0.05] focus-visible:ring-[3px] focus-visible:ring-white/8 aria-invalid:border-[#FF2047]/45 aria-invalid:ring-[#FF2047]/18 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[#A1A4A5]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-90" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  portal = true,
  portalContainer,
  preventCloseAutoFocus = false,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  portal?: boolean;
  portalContainer?: HTMLElement | null;
  preventCloseAutoFocus?: boolean;
}) {
  const contextPortalContainer = React.useContext(SelectPortalContainerContext);
  const resolvedPortalContainer = portalContainer ?? contextPortalContainer;
  const backgroundColor =
    typeof props.style?.backgroundColor === "string"
      ? props.style.backgroundColor
      : "var(--select-content-bg, #050608)";
  const contentBackgroundStyle = {
    background: backgroundColor,
    backgroundColor,
    opacity: 1,
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
  } as const;
  const content = (
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "select-content-fixed data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-[9999] flex min-w-[10rem] flex-col origin-(--radix-select-content-transform-origin) overflow-hidden rounded-[18px] border border-[rgba(214,235,253,0.19)] bg-[var(--select-content-bg,#050608)] text-[var(--select-content-fg,#F0F0F0)] shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,inset_0_1px_0_rgba(255,255,255,0.04),0_26px_60px_rgba(0,0,0,0.42)]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        onCloseAutoFocus={(event) => {
          if (preventCloseAutoFocus) {
            event.preventDefault();
          }
          onCloseAutoFocus?.(event);
        }}
        {...props}
        style={{
          height: 280,
          maxHeight: 280,
          minHeight: 280,
          ...contentBackgroundStyle,
          ...props.style,
        }}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--select-content-bg,#050608)] p-1.5 scroll-my-1 [-webkit-overflow-scrolling:touch]",
            position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
          )}
          style={contentBackgroundStyle}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
  );

  if (!portal) {
    return content;
  }

  return (
    <SelectPrimitive.Portal container={resolvedPortalContainer ?? undefined}>
      {content}
    </SelectPrimitive.Portal>
  );
}

function SelectPortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <SelectPortalContainerContext.Provider value={container}>
      {children}
    </SelectPortalContainerContext.Provider>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#A1A4A5]",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full min-w-0 cursor-default items-center gap-2 overflow-hidden rounded-[12px] px-3 py-2.5 pr-8 text-[13px] font-medium text-[#F0F0F0]/88 outline-hidden select-none transition-[background-color,color,border-color] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-[#FFFFFF] data-[state=checked]:bg-white/[0.1] data-[state=checked]:text-[#FFFFFF] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:min-w-0 *:[span]:last:items-center *:[span]:last:gap-2 *:[span]:last:overflow-hidden *:[span]:last:truncate",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 shrink-0 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-[#11FF99]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText className="min-w-0 overflow-hidden truncate">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none mx-2 my-1 h-px bg-[rgba(214,235,253,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
        className={cn(
          "flex cursor-default items-center justify-center py-1.5 text-[#A1A4A5] [background-color:var(--select-content-bg,#050608)]",
          className,
        )}
        style={{
          background: "var(--select-content-bg, #050608)",
          backgroundColor: "var(--select-content-bg, #050608)",
          opacity: 1,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
        {...props}
      >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
        className={cn(
          "flex cursor-default items-center justify-center py-1.5 text-[#A1A4A5] [background-color:var(--select-content-bg,#050608)]",
          className,
        )}
        style={{
          background: "var(--select-content-bg, #050608)",
          backgroundColor: "var(--select-content-bg, #050608)",
          opacity: 1,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
        {...props}
      >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPortalContainerProvider,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
