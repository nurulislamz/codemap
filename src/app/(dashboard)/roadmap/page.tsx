import { StatusSelect } from "@/components/status-select";
import { getSeedContent } from "@/server/data/seed-content";

export default async function RoadmapPage() {
  const seed = await getSeedContent();

  const topics = seed.roadmap.topics.map((topic) => {
    const resources = seed.roadmap.resources.filter(
      (resource) => resource.topicSlug === topic.slug,
    );
    return { ...topic, resources };
  });

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Backend roadmap
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Track fundamentals intentionally
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Seeded from versioned Markdown so you can curate the learning path before
          importing it to Supabase. Progress tracking is a UI preview for now.
        </p>
      </section>

      <section aria-label="Backend roadmap topics" className="space-y-4">
        {topics.map((topic) => {
          const primaryResource = topic.resources[0];

          return (
            <article
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between"
              key={topic.slug}
              id={topic.slug}
            >
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  {topic.title}
                </h2>
                <p className="mt-2 leading-7 text-slate-600">{topic.description}</p>

                {primaryResource ? (
                  <a
                    className="mt-3 inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
                    href={primaryResource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read: {primaryResource.title}
                  </a>
                ) : null}

                <p className="mt-3 text-sm font-semibold text-amber-700">
                  Preview only: status persistence is not connected yet.
                </p>
              </div>

              <StatusSelect
                ariaLabel={`${topic.title} status preview`}
                defaultValue="not_started"
                disabled
                name={`${topic.slug}-status`}
              />
            </article>
          );
        })}
      </section>
    </div>
  );
}

