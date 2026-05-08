import { getRoadmapCatalog } from "@/lib/roadmap/catalog";
import { getRoadmapLearnedMap } from "@/lib/roadmap/progress";
import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import { LeetcodeStatsClient } from "./stats-client";
import { Icon, StatCard } from "@/components/leetcode/leetcode-ui";

export const dynamic = "force-dynamic";

export default async function LeetcodeStatsPage() {
  const roadmapCatalog = getRoadmapCatalog();
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const problems = Array.from(catalog.problems.values()).flat();
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(problems.map((problem) => [problem.number, problem])),
  );

  const totalRoadmapConcepts = roadmapCatalog.reduce(
    (total, roadmap) => total + roadmap.topicCount,
    0,
  );
  let learnedRoadmapConcepts = 0;
  let hasRoadmapAuth = false;

  try {
    const userId = await getRequestUserId();
    const learnedMaps = await Promise.all(
      roadmapCatalog.map((roadmap) => getRoadmapLearnedMap(userId, roadmap.slug)),
    );

    learnedRoadmapConcepts = learnedMaps.reduce(
      (total, learnedMap) =>
        total + Object.values(learnedMap).filter(Boolean).length,
      0,
    );
    hasRoadmapAuth = true;
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }
  }

  const roadmapCompletionRate = totalRoadmapConcepts === 0
    ? 0
    : Math.round((learnedRoadmapConcepts / totalRoadmapConcepts) * 100);

  return (
    <div className="space-y-5 pb-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <StatCard
          label="Roadmaps"
          value={roadmapCatalog.length}
          note="Available roadmaps"
          tone="info"
          icon={<Icon name="tree" className="h-7 w-7" />}
        />
        <StatCard
          label="Roadmap Concepts"
          value={`${learnedRoadmapConcepts}/${totalRoadmapConcepts}`}
          note={hasRoadmapAuth ? `${roadmapCompletionRate}% complete` : "Sign in to see concept progress"}
          tone="warning"
          icon={<Icon name="layers" className="h-7 w-7" />}
        />
      </section>

      <LeetcodeStatsClient problems={problems} initialAttempts={attempts} />
    </div>
  );
}
