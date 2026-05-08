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

export function Icon({
  name,
  className = "h-6 w-6",
}: {
  name:
    | "calendar"
    | "check"
    | "chevron"
    | "clock"
    | "code"
    | "flame"
    | "grid"
    | "layers"
    | "sparkle"
    | "tree";
  className?: string;
}) {
  const paths = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    code: (
      <>
        <path d="m9 8-4 4 4 4" />
        <path d="m15 8 4 4-4 4" />
        <path d="m13 5-2 14" />
      </>
    ),
    flame: (
      <>
        <path d="M12 22c4 0 7-2.6 7-6.8 0-3-1.8-5.1-4.1-7.6-.8 2.4-2 3.6-3.4 4.4.4-3.1-.8-5.6-3.3-8C7.6 7.7 5 10.4 5 15.2 5 19.4 8 22 12 22Z" />
        <path d="M12 18c1.5 0 2.7-1 2.7-2.6 0-1.1-.6-2-1.7-3.1-.3 1-.8 1.5-1.5 1.9.2-1.4-.3-2.4-1.3-3.5-.6 1.7-1.1 2.8-1.1 4.7 0 1.6 1.2 2.6 2.9 2.6Z" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3 10.5 8.5 5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" />
        <path d="M19 15 18.2 18.2 15 19l3.2.8L19 23l.8-3.2L23 19l-3.2-.8L19 15Z" />
      </>
    ),
    tree: (
      <>
        <path d="M12 3 5 15h14L12 3Z" />
        <path d="M12 12 7 21h10l-5-9Z" />
        <path d="M12 21v-3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
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
    <LeetcodePanel className="flex min-h-32 items-center gap-5 p-4">
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
    </LeetcodePanel>
  );
}
