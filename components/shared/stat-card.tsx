import type { ReactNode } from "react";

import { AppPanel } from "./app-panel";
import type { Tone } from "./tone";

export function StatCard({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  note: string;
  tone: Tone;
  icon: ReactNode;
}) {
  const iconClass =
    tone === "success"
      ? "bg-[#153b33] text-[#31d17d]"
      : tone === "warning"
        ? "bg-[#352618] text-[#ff942f]"
        : tone === "info"
          ? "bg-[#1a2a58] text-[#5f7dff]"
          : "bg-[#241d55] text-[#8d72ff]";

  const valueClass =
    tone === "success"
      ? "text-[#31d17d]"
      : tone === "warning"
        ? "text-[#ff942f]"
        : tone === "info"
          ? "text-[#5f7dff]"
          : "text-[#8068ff]";

  return (
    <AppPanel className="flex min-h-32 items-center gap-5 p-4">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-base font-medium text-slate-200">{label}</div>
        <div
          className={`mt-2 whitespace-nowrap text-[2rem] font-extrabold leading-none ${valueClass}`}
        >
          {value}
        </div>
        <div className="mt-2 text-base text-slate-400">{note}</div>
      </div>
    </AppPanel>
  );
}
