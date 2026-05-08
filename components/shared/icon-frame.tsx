import type { ReactNode } from "react";

import type { Tone } from "./tone";

export function IconFrame({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  const toneClass = {
    primary: "border-[#705cff]/35 bg-[#262055] text-[#866cff] shadow-[#705cff]/10",
    success: "border-[#48d66d]/25 bg-[#173f35] text-[#60f17c] shadow-[#48d66d]/10",
    info: "border-[#4e6fff]/35 bg-[#1a2a58] text-[#5f7dff] shadow-[#4e6fff]/10",
    warning: "border-[#ff8b3d]/30 bg-[#41271d] text-[#ff8b3d] shadow-[#ff8b3d]/10",
  }[tone];

  return (
    <div
      className={`grid h-[4.85rem] w-[4.85rem] shrink-0 place-items-center rounded-[1.25rem] border shadow-lg ${toneClass}`}
    >
      {children}
    </div>
  );
}
