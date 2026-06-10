"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
      <p className="text-sm text-slate-400">
        An unexpected error occurred while loading this page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-gradient-to-r from-[#7c68ff] to-[#5d47ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6747ff]/20 transition hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}
