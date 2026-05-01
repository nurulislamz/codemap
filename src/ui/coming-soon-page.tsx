type ComingSoonPageProps = {
  title: string;
};

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-[#101a2a]/78 p-10 text-center shadow-2xl shadow-black/20">
        <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#8a74ff]">
          Coming soon
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 text-lg font-medium text-slate-300">
          To be implemented soon.
        </p>
      </div>
    </section>
  );
}
