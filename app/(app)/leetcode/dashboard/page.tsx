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
  const problems = hydrateProblemsWithAttempts(catalog.index.problems, attemptEvents);
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    catalog.index.problemsByNumber,
  );

  return (
    <LeetcodeDashboardClient
      problems={problems}
      attempts={attempts}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
