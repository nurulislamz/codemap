import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodeDashboardClient } from "@/components/leetcode/leetcode-dashboard-client";
import { getLeetcodePageData } from "@/lib/leetcode/page-data";

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
