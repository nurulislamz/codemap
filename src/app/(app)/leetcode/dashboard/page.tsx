import { saveLeetCodeAttempt } from "@/features/leetcode/actions/actions";
import { LeetcodeDashboardClient } from "@/features/leetcode/components/leetcode-dashboard-client";
import { getLeetcodePageData } from "@/features/leetcode/data/leetcode-page-data";

export const dynamic = "force-dynamic";

export default async function LeetcodeDashboardPage() {
  const { problems, attempts } = await getLeetcodePageData();

  return (
    <LeetcodeDashboardClient
      problems={problems}
      attempts={attempts}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
