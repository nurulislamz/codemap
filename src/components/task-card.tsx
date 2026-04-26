import Link from "next/link";

type TaskCardProps = {
  track: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  description?: string;
};

export function TaskCard({
  track,
  title,
  actionHref,
  actionLabel,
  description,
}: TaskCardProps) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
        {track}
      </p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 flex-1 text-base leading-7 text-slate-600">
          {description}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      <Link
        href={actionHref}
        className="mt-6 inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
