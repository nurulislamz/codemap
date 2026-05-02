import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SkeletonBlock({
  className = "",
  slot = "skeleton-block",
  style,
}: {
  className?: string;
  slot?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      data-slot={slot}
      style={style}
      className={joinClasses(
        "animate-pulse rounded-lg bg-slate-700/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={joinClasses("space-y-3", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock
          key={index}
          slot="skeleton-line"
          className={joinClasses(
            "h-3.5",
            index === lines - 1 && lines > 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonPanel({
  className = "",
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton-panel"
      {...props}
      className={joinClasses(
        "rounded-xl border border-[#1b2a3e] bg-[#0b1626]/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageSkeleton({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-label={label}
      className={joinClasses("space-y-5", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </section>
  );
}
