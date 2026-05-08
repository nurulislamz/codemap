import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getRoadmapCatalog,
} from "@/lib/roadmap/catalog";
import {
  Icon,
  StatCard,
  SectionHero,
  LeetcodePanel,
} from "@/components/leetcode/leetcode-ui";

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
  const totalConcepts = roadmaps.reduce((total, roadmap) => total + roadmap.topicCount, 0);

  if (params?.roadmap) {
    const suffix = params.topic ? `?topic=${encodeURIComponent(params.topic)}` : "";
    redirect(`/roadmap/${encodeURIComponent(params.roadmap)}${suffix}`);
  }

  if (roadmaps.length === 0) {
    return (
      <section className="rounded-lg border border-[#26364d] bg-[#101a2a]/74 p-8">
        <h1 className="text-3xl font-extrabold text-white">Roadmaps</h1>
        <p className="mt-3 text-slate-300">No roadmap data is available yet.</p>
      </section>
    );
  }

  return (
    <div className="mx-[calc(50%-50vw)] -mt-3 px-8 pb-4">
      <main className="min-w-0 space-y-5">
        <SectionHero
          icon={<Icon name="tree" className="h-9 w-9" />}
          title="Roadmaps"
          description="Pick a roadmap to explore concepts, resources, and track your progress."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Roadmaps"
            value={roadmaps.length}
            note="Available roadmaps"
            tone="primary"
            icon={<Icon name="calendar" className="h-7 w-7" />}
          />
          <StatCard
            label="Concepts"
            value={totalConcepts}
            note="Total topics"
            tone="success"
            icon={<Icon name="layers" className="h-7 w-7" />}
          />
          <StatCard
            label="Avg concepts"
            value={roadmaps.length === 0 ? 0 : Math.round(totalConcepts / roadmaps.length)}
            note="Per roadmap"
            tone="info"
            icon={<Icon name="check" className="h-7 w-7" />}
          />
          <StatCard
            label="Learning mode"
            value="Graph-driven"
            note="Path with dependencies"
            tone="warning"
            icon={<Icon name="tree" className="h-7 w-7" />}
          />
        </div>

        <LeetcodePanel className="p-5">
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roadmaps.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/roadmap/${encodeURIComponent(item.slug)}`}
                  className="block rounded-xl border border-[#22314a] bg-[#0b1626] px-4 py-4 transition hover:border-[#516278] hover:bg-[#111d30]"
                >
                  <div className="text-base font-extrabold text-white">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-400">
                    {item.topicCount} concepts
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </LeetcodePanel>
      </main>
    </div>
  );
}
