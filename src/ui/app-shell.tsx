import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/system-design", label: "System Design" },
  { href: "/flashcards", label: "Flashcards" },
];

const leetcodeNavItems = [
  { href: "/leetcode/dashboard", label: "Dashboard" },
  { href: "/leetcode", label: "All Problems" },
  { href: "/leetcode/stats", label: "Stats" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
              Backend Prep
            </Link>
          </div>
          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap gap-2">
              <li>
                <details className="dropdown dropdown-end">
                  <summary className="btn btn-ghost btn-sm cursor-pointer rounded-full">
                    LeetCode
                  </summary>
                  <ul className="menu dropdown-content z-50 mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
                    {leetcodeNavItems.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="btn btn-ghost btn-sm rounded-full"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
