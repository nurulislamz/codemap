import type { ReactNode } from "react";

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
