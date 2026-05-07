import Link from "next/link";
import { RoadmapConceptsModal } from "@/components/roadmap/roadmap-concepts-modal";
import { saveRoadmapProgress } from "@/lib/roadmap/actions";
import {
  getRoadmapBySlug,
  getRoadmapCatalog,
} from "@/lib/roadmap/catalog";

export const dynamic = "force-dynamic";

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams?: Promise<{
    roadmap?: string;
    topic?: string;
  }>;
}) {
  const params = await searchParams;
  const roadmaps = getRoadmapCatalog();
  const requestedRoadmapSlug = params?.roadmap ?? roadmaps[0]?.slug;
  const roadmap =
    (requestedRoadmapSlug ? getRoadmapBySlug(requestedRoadmapSlug) : null) ??
    (roadmaps[0] ? getRoadmapBySlug(roadmaps[0].slug) : null);

  if (!roadmap || roadmap.topics.length === 0) {
    return (
      <section className="rounded-lg border border-[#26364d] bg-[#101a2a]/74 p-8">
        <h1 className="text-3xl font-extrabold text-white">Roadmap</h1>
        <p className="mt-3 text-slate-300">No roadmap data is available yet.</p>
      </section>
    );
  }

  const resourceCount = roadmap.topics.reduce(
    (total, topic) => total + topic.resourceCount,
    0,
  );

  return (
    <div className="mx-[calc(50%-50vw)] -mt-3 px-8 pb-4">
      <section className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border border-[#26364d] bg-[#101a2a]/74 p-5 shadow-2xl shadow-black/20">
          <h2 className="text-lg font-extrabold text-white">Roadmaps</h2>
          <div className="mt-4 space-y-2">
            {roadmaps.map((item) => {
              const isSelected = item.slug === roadmap.slug;

              return (
                <Link
                  key={item.slug}
                  href={`/roadmap?roadmap=${encodeURIComponent(item.slug)}`}
                  className={`block rounded-lg border px-4 py-3 transition ${
                    isSelected
                      ? "border-[#725dff] bg-[#1a2750] text-white"
                      : "border-[#22314a] bg-[#0b1626] text-slate-300 hover:border-[#516278] hover:text-white"
                  }`}
                >
                  <span className="block text-sm font-extrabold">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-400">
                    {item.topicCount} concepts
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-lg border border-[#26364d] bg-[#101a2a]/74 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-white">
                  {roadmap.title}
                </h1>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-300">
                  {roadmap.summary}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:w-72">
                <a
                  href={roadmap.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-3 rounded-lg bg-[#6747ff] px-5 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(103,71,255,0.25)] transition hover:bg-[#775bff]"
                >
                  Open on roadmap.sh
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </a>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[#22314a] bg-[#0b1626] p-3">
                    <span className="block text-2xl font-extrabold text-white">
                      {roadmap.topicCount}
                    </span>
                    <span className="mt-1 block font-semibold text-slate-400">
                      Concepts
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#22314a] bg-[#0b1626] p-3">
                    <span className="block text-2xl font-extrabold text-white">
                      {resourceCount}
                    </span>
                    <span className="mt-1 block font-semibold text-slate-400">
                      Resources
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <RoadmapConceptsModal
            roadmap={roadmap}
            initialSelectedTopicSlug={params?.topic ?? null}
            saveProgressAction={saveRoadmapProgress}
          />
        </main>
      </section>
    </div>
  );
}
