"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/leetcode", label: "LeetCode" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/system-design", label: "System Design" },
];

const leetcodeNavItems = [
  { href: "/leetcode/dashboard", label: "Dashboard" },
  { href: "/leetcode/allproblems", label: "All Problems" },
  { href: "/leetcode/stats", label: "Stats" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { status, user, signInWithGoogle, signOutUser } = useAuth();
  const pathname = usePathname();
  const leetcodeMenuRef = useRef<HTMLLIElement>(null);
  const [isLeetcodeMenuOpen, setIsLeetcodeMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08111d] text-slate-100">
      <header className="border-b border-white/10 bg-[#07101b]/82 backdrop-blur">
        <div className="flex flex-col gap-5 px-8 py-5 md:flex-row md:items-center md:justify-between">
          <Link
            href="/dashboard"
            className="text-3xl font-extrabold leading-none tracking-tight text-[#7c68ff]"
          >
            Interview Prep
          </Link>

          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-10 text-base font-bold text-slate-200">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/leetcode" && pathname.startsWith("/leetcode"));

                if (item.href === "/leetcode") {
                  return (
                    <li key={item.href} ref={leetcodeMenuRef} className="relative">
                      <button
                        type="button"
                        aria-expanded={isLeetcodeMenuOpen}
                        aria-controls="leetcode-nav-menu"
                        aria-haspopup="menu"
                        className={`block cursor-pointer py-1.5 transition hover:text-white ${
                          isActive ? "text-white" : "text-slate-300"
                        }`}
                        onClick={() => setIsLeetcodeMenuOpen((current) => !current)}
                      >
                        {item.label}
                      </button>

                      {isLeetcodeMenuOpen ? (
                        <ul
                          id="leetcode-nav-menu"
                          aria-label="LeetCode menu"
                          role="menu"
                          className="absolute left-0 top-full z-50 mt-4 w-52 rounded-xl border border-white/10 bg-[#101a2a] p-2 text-sm text-slate-100 shadow-2xl shadow-black/40"
                        >
                          {leetcodeNavItems.map((leetcodeItem) => (
                            <li key={leetcodeItem.href}>
                              <Link
                                href={leetcodeItem.href}
                                role="menuitem"
                                className="block rounded-lg px-4 py-2.5 transition hover:bg-white/5 hover:text-white"
                                onClick={() => setIsLeetcodeMenuOpen(false)}
                              >
                                {leetcodeItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block py-1.5 transition hover:text-white ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3 text-sm font-semibold">
            {status === "signed-in" ? (
              <>
                <span className="max-w-52 truncate text-slate-400">
                  {user?.email ?? "Signed in"}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-4 py-2 text-slate-200 transition hover:border-[#6747ff] hover:text-white"
                  onClick={() => void signOutUser()}
                >
                  Sign out
                </button>
              </>
            ) : status === "signed-out" ? (
              <button
                type="button"
                className="rounded-lg bg-[#6747ff] px-4 py-2 font-bold text-white transition hover:bg-[#775bff]"
                onClick={() => void signInWithGoogle()}
              >
                Sign in
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="w-full px-8 py-8">{children}</main>
    </div>
  );
}
