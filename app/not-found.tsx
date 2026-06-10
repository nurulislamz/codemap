import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 text-center">
      <p className="text-5xl font-extrabold text-[#9b6cff]">404</p>
      <h1 className="text-2xl font-extrabold text-white">Page not found</h1>
      <p className="text-sm text-slate-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-gradient-to-r from-[#7c68ff] to-[#5d47ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6747ff]/20 transition hover:brightness-110"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
