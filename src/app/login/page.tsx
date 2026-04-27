import { sendMagicLink } from "./actions";
import { hasSupabasePublicEnv } from "@/server/env";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabaseConfigured = hasSupabasePublicEnv(process.env);
  const params = await searchParams;
  const sent = params.sent === "1";
  const error =
    typeof params.error === "string"
      ? params.error === "invalid_email"
        ? "Enter a valid email address."
        : params.error
      : null;

  return (
    <div className="min-h-screen bg-[#f4f0e8] px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
            Sign in
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Backend Prep
          </h1>
          <p className="text-lg leading-8 text-slate-700">
            Personal dashboard for LeetCode reps, roadmap learning, system
            design prompts, and flashcards.
          </p>
        </header>

        <form
          action={sendMagicLink}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {!supabaseConfigured ? (
            <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Offline mode: Supabase env vars are missing, so sign-in is disabled. You can still review the UI at{" "}
              <span className="font-mono">/dashboard</span>.
            </p>
          ) : null}
          {sent ? (
            <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              Magic link sent. Check your inbox.
            </p>
          ) : null}
          {error ? (
            <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
              {error}
            </p>
          ) : null}
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              name="email"
              type="email"
              required
              disabled={!supabaseConfigured}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none ring-emerald-700/30 focus:ring-4"
            />
          </label>
          <button
            type="submit"
            disabled={!supabaseConfigured}
            className="mt-6 inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Send magic link
          </button>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You&apos;ll receive an email with a sign-in link. Open it on the
            same device/browser to create your session.
          </p>
        </form>
      </div>
    </div>
  );
}
