"use client";

export function WorkbenchFormSkeleton() {
  return (
    <div className="flex min-h-[24rem] flex-col gap-4 rounded-[1.8rem] border border-[color:var(--color-frost-border)] bg-[color:var(--color-surface-1)] p-5 shadow-[var(--shadow-ring-frost)]">
      <div className="h-16 rounded-[1.25rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.03]" />
      <div className="space-y-3">
        <div className="h-4 w-28 rounded-full bg-white/[0.08]" />
        <div className="h-32 rounded-[1.25rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.02]" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-full bg-white/[0.08]" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-[1rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.02]" />
          <div className="h-16 rounded-[1rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.02]" />
          <div className="h-16 rounded-[1rem] border border-[color:var(--color-frost-border-alt)] bg-white/[0.02]" />
        </div>
      </div>
      <div className="mt-auto h-12 rounded-full border border-[color:var(--color-frost-border)] bg-white/[0.04]" />
    </div>
  );
}
