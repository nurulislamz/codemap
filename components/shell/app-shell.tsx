import Link from "next/link";
import type { ReactNode } from "react";
import { Menu } from "@/components/menu/menu";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#08111d] text-slate-100">
      <header className="border-b border-white/10 bg-[#07101b]/82 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-5 px-8 py-5">
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-[#d36cff] via-[#9b6cff] to-[#6b5cff] bg-clip-text text-3xl font-extrabold leading-none tracking-tight text-transparent"
          >
            Backend Prep
          </Link>

          <Menu />
        </div>
      </header>
      <main className="w-full px-8 py-8">{children}</main>
    </div>
  );
}
