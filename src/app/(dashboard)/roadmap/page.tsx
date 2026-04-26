import { StatusSelect } from "@/components/status-select";

const starterTopics = [
  {
    title: "Internet",
    description: "Trace requests from browser to server and identify the network layers involved.",
  },
  {
    title: "HTTP",
    description: "Review methods, status codes, headers, caching semantics, and REST constraints.",
  },
  {
    title: "DNS",
    description: "Understand recursive resolution, authoritative nameservers, TTLs, and records.",
  },
  {
    title: "Databases",
    description: "Compare relational modeling, indexes, transactions, and common query patterns.",
  },
  {
    title: "Caching",
    description: "Practice cache-aside, invalidation, TTLs, and where caches fit in backend systems.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Backend roadmap
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Starter topics for backend fundamentals
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Static checklist rows for now. Persistence will attach these learning
          states to Supabase roadmap progress in a later task.
        </p>
      </section>
      <section aria-label="Backend roadmap starter topics" className="space-y-4">
        {starterTopics.map((topic) => (
          <article
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            key={topic.title}
          >
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {topic.title}
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                {topic.description}
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-700">
                Preview only: progress tracking is not connected yet.
              </p>
            </div>
            <StatusSelect
              ariaLabel={`${topic.title} status preview`}
              defaultValue="not_started"
              disabled
              name={`${topic.title.toLowerCase().replaceAll(" ", "-")}-status`}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
