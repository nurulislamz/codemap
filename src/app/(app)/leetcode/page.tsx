import { saveLeetCodeAttempt } from "@/features/leetcode/actions/actions";
import { LeetcodePracticeDashboard } from "@/features/leetcode/components/leetcode-practice-dashboard";
import { getLeetcodePageData } from "@/features/leetcode/data/leetcode-page-data";

export const dynamic = "force-dynamic";

export default async function LeetCodePage() {
  const { problems, attempts } = await getLeetcodePageData();

  return (
    <LeetcodePracticeDashboard
      problems={problems}
      attempts={attempts}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
