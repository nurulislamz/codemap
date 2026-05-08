"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useOutsideClick } from "../ui/use-outside-click";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/leetcode", label: "LeetCode" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/system-design", label: "System Design" },
  { href: "/flashcards", label: "Flashcards" },
];

const leetcodeNavItems = [
  { href: "/leetcode/dashboard", label: "Dashboard" },
  { href: "/leetcode/allproblems", label: "All Problems" },
  { href: "/leetcode/stats", label: "Stats" },
  { href: "/leetcode/tracks", label: "Tracks" },
];

export function Menu() {
  const pathname = usePathname();
  const { status, user, signInWithGoogle, signOutUser } = useAuth();
  const leetcodeMenuRef = useRef<HTMLLIElement>(null);
  const [isLeetcodeMenuOpen, setIsLeetcodeMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useOutsideClick(leetcodeMenuRef, {
    active: isLeetcodeMenuOpen,
    onOutsideClick: () => setIsLeetcodeMenuOpen(false),
  });

  function closeMenus() {
    setIsLeetcodeMenuOpen(false);
    setIsMobileMenuOpen(false);
  }

  function renderAuthControls(className: string, closeOnAction = false) {
    if (status === "signed-in") {
      return (
        <div className={className}>
          <span className="max-w-52 truncate text-slate-400">
            {user?.email ?? "Signed in"}
          </span>
          <button
            type="button"
            className="rounded-md border border-white/15 px-3.5 py-1.5 text-sm text-slate-200 transition hover:border-[#7c68ff] hover:bg-white/5 hover:text-white"
            onClick={() => {
              if (closeOnAction) closeMenus();
              void signOutUser();
            }}
          >
            Sign out
          </button>
        </div>
      );
    }

    if (status === "signed-out") {
      return (
        <div className={className}>
          <button
            type="button"
            className="rounded-md bg-gradient-to-r from-[#7c68ff] to-[#5d47ff] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#6747ff]/20 transition hover:brightness-110"
            onClick={() => {
              if (closeOnAction) closeMenus();
              void signInWithGoogle();
            }}
          >
            Sign in
          </button>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-primary-navigation"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 transition hover:border-[#6747ff] hover:text-white md:hidden"
        onClick={() => setIsMobileMenuOpen((current) => !current)}
      >
        <span className="sr-only">Toggle navigation</span>
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
        </span>
      </button>

      <nav aria-label="Primary navigation" className="hidden md:block">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-200 sm:gap-x-6 sm:text-base lg:gap-x-10">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/leetcode" && pathname.startsWith("/leetcode"));

            if (item.href === "/leetcode") {
              return (
                <li
                  key={item.href}
                  ref={leetcodeMenuRef}
                  className="relative"
                  onMouseEnter={() => setIsLeetcodeMenuOpen(true)}
                  onMouseLeave={() => setIsLeetcodeMenuOpen(false)}
                >
                  <Link
                    href="/leetcode"
                    aria-expanded={isLeetcodeMenuOpen}
                    aria-controls="leetcode-nav-menu"
                    aria-haspopup="menu"
                    className={`relative block cursor-pointer py-1.5 transition after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-[#7c68ff] after:transition-all hover:text-white ${
                      isActive
                        ? "text-white after:w-full"
                        : "text-slate-300 after:w-0"
                    }`}
                    onFocus={() => setIsLeetcodeMenuOpen(true)}
                  >
                    {item.label}
                  </Link>

                  {isLeetcodeMenuOpen ? (
                    <ul
                      id="leetcode-nav-menu"
                      aria-label="LeetCode menu"
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#101a2a] p-2 text-sm text-slate-100 shadow-2xl shadow-black/40"
                      onMouseEnter={() => setIsLeetcodeMenuOpen(true)}
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
                  className={`relative block py-1.5 transition after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-[#7c68ff] after:transition-all hover:text-white ${
                    isActive
                      ? "text-white after:w-full"
                      : "text-slate-300 after:w-0"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {renderAuthControls("hidden shrink-0 items-center gap-3 text-sm font-semibold md:flex")}

      {isMobileMenuOpen ? (
        <div
          id="mobile-primary-navigation"
          className="basis-full rounded-xl border border-white/10 bg-[#101a2a] p-4 shadow-2xl shadow-black/30 md:hidden"
        >
          <nav aria-label="Mobile primary navigation">
            <ul className="flex flex-col gap-2 text-base font-bold text-slate-200">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/leetcode" && pathname.startsWith("/leetcode"));

                if (item.href === "/leetcode") {
                  return (
                    <li key={item.href} ref={leetcodeMenuRef}>
                      <button
                        type="button"
                        aria-expanded={isLeetcodeMenuOpen}
                        aria-controls="mobile-leetcode-nav-menu"
                        aria-haspopup="menu"
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white ${
                          isActive ? "text-white" : "text-slate-300"
                        }`}
                        onClick={() => setIsLeetcodeMenuOpen((current) => !current)}
                      >
                        {item.label}
                        <span aria-hidden="true">{isLeetcodeMenuOpen ? "-" : "+"}</span>
                      </button>

                      {isLeetcodeMenuOpen ? (
                        <ul
                          id="mobile-leetcode-nav-menu"
                          aria-label="LeetCode menu"
                          role="menu"
                          className="mt-1 rounded-lg bg-white/5 p-2 text-sm text-slate-100"
                        >
                          {leetcodeNavItems.map((leetcodeItem) => (
                            <li key={leetcodeItem.href}>
                              <Link
                                href={leetcodeItem.href}
                                role="menuitem"
                                className="block rounded-md px-3 py-2 transition hover:bg-white/5 hover:text-white"
                                onClick={closeMenus}
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
                      className={`block rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {renderAuthControls(
            "mt-4 flex items-center gap-3 border-t border-white/10 pt-4 text-sm font-semibold",
            true,
          )}
        </div>
      ) : null}
    </>
  );
}
