import { saveLeetCodeAttempt } from "../actions";
import { getLeetcodePageData } from "../leetcode-page-data";
import { LeetcodeDashboardClient } from "./leetcode-dashboard-client";

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
