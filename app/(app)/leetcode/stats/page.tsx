import {
  getSortedLeetcodeAttemptEventsForRequest,
  toLeetcodeAttemptRows,
} from "@/lib/leetcode/attempts";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";
import { LeetcodeStatsClient } from "./stats-client";

export const dynamic = "force-dynamic";

export default async function LeetcodeStatsPage() {
  const catalog = getLeetcodeCatalog();
  const attemptEvents = await getSortedLeetcodeAttemptEventsForRequest();
  const problems = Array.from(catalog.problems.values()).flat();
  const attempts = toLeetcodeAttemptRows(
    attemptEvents,
    new Map(problems.map((problem) => [problem.number, problem])),
  );

  return <LeetcodeStatsClient problems={problems} initialAttempts={attempts} />;
}
