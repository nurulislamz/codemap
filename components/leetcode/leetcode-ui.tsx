import type { ReactNode } from "react";

export const leetcodePrimaryActionClass =
  "inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#6747ff] px-8 text-base font-extrabold text-white shadow-lg shadow-[#6747ff]/30 transition hover:bg-[#765cff]";

const panelBaseClass =
  "rounded-xl border border-[#1b2a3e] bg-[#0b1626]/95 shadow-[0_18px_45px_rgba(0,0,0,0.22)]";

type Tone = "primary" | "success" | "info" | "warning";

export function LeetcodePanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${panelBaseClass} ${className}`}>{children}</div>;
}

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

export function CodeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </svg>
  );
}

export function SectionHero({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#1c2a3d] bg-[#0b1423] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-5">
          <div className="grid h-[5.3rem] w-[5.3rem] shrink-0 place-items-center rounded-[1.35rem] border border-[#8d5cff]/45 bg-[#241746] text-[#c176ff] shadow-[inset_0_0_28px_rgba(141,92,255,0.22),0_16px_32px_rgba(95,76,255,0.12)]">
            {icon}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-400">{description}</p>
          </div>
        </div>

        {children ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">{children}</div>
        ) : null}
      </div>
    </section>
  );
}

export function LeetcodeStatCard({
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
  const valueClass = {
    primary: "text-white",
    success: "text-[#50d873]",
    info: "text-[#5f7dff]",
    warning: "text-[#ff8b3d]",
  }[tone];

  return (
    <LeetcodePanel className="flex min-h-[8.1rem] items-center gap-6 p-7">
      <IconFrame tone={tone}>{icon}</IconFrame>
      <div>
        <div className="text-base font-semibold text-white">{label}</div>
        <div className={`mt-1 text-4xl font-extrabold leading-none ${valueClass}`}>
          {value}
        </div>
        <div className="mt-2 text-base text-slate-400">{note}</div>
      </div>
    </LeetcodePanel>
  );
}
