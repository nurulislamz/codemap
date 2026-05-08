import Link from "next/link";

import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import {
  getAllLeetcodeTrackProblemIds,
  getLeetcodeTracks,
} from "@/lib/leetcode/tracks";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
} from "@/lib/leetcode/attempts";
import {
  CodeIcon,
  Icon,
  AppPanel,
  SectionHero,
  StatCard,
} from "@/components/shared";

export const dynamic = "force-dynamic";

export default async function LeetcodeTracksPage() {
  const tracks = getLeetcodeTracks();
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const catalogProblems = Array.from(catalog.problems.values()).flat();
  const progressProblems = hydrateProblemsWithAttempts(catalogProblems, attemptEvents);
  const progressByProblemId = new Map(progressProblems.map((problem) => [problem.number, problem]));
  const trackProblemIds = getAllLeetcodeTrackProblemIds();
  const trackProblems = trackProblemIds
    .map((problemId) => progressByProblemId.get(problemId))
    .filter((problem) => problem !== undefined);
  const completedProblems = trackProblems.filter((problem) => problem.isCompleted).length;
  const attemptedProblems = trackProblems.filter((problem) => problem.attemptCount > 0).length;
  const completionRate = trackProblemIds.length === 0 ? 0 : Math.round((completedProblems / trackProblemIds.length) * 100);

  if (tracks.length === 0) {
    return (
      <section className="rounded-lg border border-[#26364d] bg-[#101a2a]/74 p-8">
        <h1 className="text-3xl font-extrabold text-white">Tracks</h1>
        <p className="mt-3 text-slate-300">No tracks are available yet.</p>
      </section>
    );
  }

  return (
    <div className="mx-[calc(50%-50vw)] -mt-3 px-8 pb-4">
      <main className="min-w-0 space-y-5">
        <SectionHero
          icon={<CodeIcon className="h-9 w-9" />}
          title="Tracks"
          description="Choose a track to inspect your planned problems."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tracks"
            value={tracks.length}
            note="Available tracks"
            tone="primary"
            icon={<Icon name="calendar" className="h-7 w-7" />}
          />
          <StatCard
            label="Problems"
            value={trackProblemIds.length}
            note="Across all tracks"
            tone="primary"
            icon={<Icon name="layers" className="h-7 w-7" />}
          />
          <StatCard
            label="Attempted"
            value={attemptedProblems}
            note="Touched in at least one track"
            tone="info"
            icon={<CodeIcon className="h-7 w-7" />}
          />
          <StatCard
            label="Completed"
            value={`${completedProblems}/${trackProblemIds.length}`}
            note={`${completionRate}% complete`}
            tone="success"
            icon={<Icon name="check" className="h-7 w-7" />}
          />
        </div>

        <AppPanel className="p-5">
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => (
              <li key={track.slug}>
                <Link
                  href={`/leetcode/tracks/${encodeURIComponent(track.slug)}`}
                  className="block rounded-xl border border-[#22314a] bg-[#0b1626] px-4 py-4 transition hover:border-[#516278] hover:bg-[#111d30]"
                >
                  <div className="text-base font-extrabold text-white">{track.title}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {track.summary}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </AppPanel>
      </main>
    </div>
  );
}
