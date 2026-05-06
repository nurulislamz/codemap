import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodeDashboardClient } from "@/components/leetcode/leetcode-dashboard-client";
import {
  getSortedLeetcodeAttemptEventsForRequest,
  hydrateProblemsWithAttempts,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";

export const dynamic = "force-dynamic";

export default async function LeetcodeDashboardPage() {
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const catalogProblems = Array.from(catalog.problems.values()).flat();
  const problems = hydrateProblemsWithAttempts(catalogProblems, attemptEvents);
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(catalogProblems.map((problem) => [problem.number, problem])),
  );

  return (
    <LeetcodeDashboardClient
      problems={problems}
      attempts={attempts}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
