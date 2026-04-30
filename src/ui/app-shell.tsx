import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leetcode", label: "LeetCode" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/system-design", label: "System Design" },
  { href: "/flashcards", label: "Flashcards" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f0e8] text-slate-950">
      <header className="border-b border-slate-900/10 bg-[#fffaf0]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Backend Prep
            </Link>
          </div>
          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
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
