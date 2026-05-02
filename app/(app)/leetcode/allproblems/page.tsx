import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodePracticeDashboard } from "@/components/leetcode/leetcode-practice-dashboard";
import { getLeetcodePageData } from "@/lib/leetcode/page-data";

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
