import { ReactNode } from "react";

export default function CreateRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative z-20 min-h-screen overflow-hidden bg-[#050505] pt-14 lg:pt-[4.5rem]">
      {children}
    </div>
  );
}
