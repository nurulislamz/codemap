"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "./auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { status, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isUnavailable = status === "unavailable";

  function handleGoogleSignIn() {
    setError(null);
    startTransition(async () => {
      try {
        await signInWithGoogle();
        router.push("/leetcode");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#08111d] px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/dashboard" className="mb-10 text-2xl font-extrabold text-[#7c68ff]">
          Backend Prep
        </Link>

        <section className="rounded-2xl border border-white/10 bg-[#0b1626] p-7 shadow-2xl shadow-black/30">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8f73ff]">
              Firebase Auth
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Continue with Google to save your attempts to Firebase instead of this browser only.
            </p>
          </div>

          {isUnavailable ? (
            <div className="mt-5 rounded-xl border border-[#ff8b3d]/30 bg-[#41271d] p-4 text-sm text-[#ffd6ba]">
              Firebase auth is not configured. Add the `NEXT_PUBLIC_FIREBASE_*`
              values before signing in.
            </div>
          ) : null}

          {error ? <p className="mt-6 text-sm font-semibold text-[#ff6f91]">{error}</p> : null}

          <button
            type="button"
            disabled={isPending || isUnavailable}
            className="mt-6 h-12 w-full rounded-xl bg-[#6747ff] text-sm font-bold text-white transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleGoogleSignIn}
          >
            {isPending ? "Opening Google..." : "Continue with Google"}
          </button>
        </section>
      </div>
    </main>
  );
}
