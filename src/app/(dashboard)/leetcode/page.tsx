import { LeetcodePracticeDashboard } from "./leetcode-practice-dashboard";
import { getLeetcodePageData } from "./leetcode-page-data";
import { saveLeetCodeAttempt } from "./actions";

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
