import type { ReactNode } from "react";

const panelBaseClass =
  "rounded-xl border border-[#1b2a3e] bg-[#0b1626]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]";

export function AppPanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${panelBaseClass} ${className}`}>{children}</div>;
}
