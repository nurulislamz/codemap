import { TaskCard } from "@/ui/task-card";
import { getSeedContent } from "@/backend/data/seed-content";

export default async function SystemDesignPage() {
  const seed = await getSeedContent();

  const prompts = seed.systemDesign.prompts.map((prompt) => {
    const topic = seed.systemDesign.topics.find((t) => t.slug === prompt.topicSlug);
    return { ...prompt, topicTitle: topic?.title ?? prompt.topicSlug };
  });

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          System design practice
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Architecture reps with guidance
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Starter prompts give you an always-available practice set. Sessions and
          progress persistence will attach to Firestore in the next iteration.
        </p>
      </section>

      <section aria-label="System design prompts" className="grid gap-5 md:grid-cols-2">
        {prompts.map((prompt) => (
          <div key={prompt.slug} id={prompt.slug} className="space-y-4">
            <TaskCard
              track={`${prompt.topicTitle} • ${prompt.difficulty}`}
              title={prompt.title}
              description={prompt.promptText}
              actionHref={prompt.sourceUrl ?? `/system-design#${prompt.slug}`}
              actionLabel={prompt.sourceUrl ? "Open source" : "Jump to prompt"}
            />

            {prompt.expectedConcepts.length ? (
              <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  Expected concepts
                </summary>
                <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-slate-700">
                  {prompt.expectedConcepts.map((concept) => (
                    <li key={concept}>{concept}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
