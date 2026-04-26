export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
          Supabase Auth
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Sign in placeholder
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-200">
          Authentication will be wired to Supabase in a later task. This page
          marks the private entry point for the personal backend interview
          helper.
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
          Future flow: enter the owner email, receive a magic link, and land on
          the dashboard after Supabase verifies the session.
        </div>
      </section>
    </main>
  );
}
