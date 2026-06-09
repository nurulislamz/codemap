import type { ReactNode } from "react";

type IconName =
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

const paths: Record<IconName, ReactNode> = {
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

export function Icon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
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
