import type { ReactNode } from "react";
import "@xyflow/react/dist/style.css";

import { CanvasFullscreenGuard } from "@/shared/blocks/creator-workbench/canvas/ui/canvas-fullscreen-guard";
import { PricingPrompt } from "@/shared/blocks/payment/pricing-prompt";

export default function CreateCanvasEditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] h-[100dvh] w-screen overflow-hidden bg-[#040404]">
      <CanvasFullscreenGuard />
      {children}
      <PricingPrompt signInCallbackUrl="/pricing" />
    </div>
  );
}
