import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodePracticeDashboard } from "@/components/leetcode/leetcode-practice-dashboard";
import { getLeetcodePageData } from "@/lib/leetcode/page-data";

export const dynamic = "force-dynamic";

type LeetCodePageProps = {
  searchParams?: Promise<{
    pattern?: string;
    subPattern?: string[];
    q?: string;
  }>;
};

export default async function LeetCodePage({ searchParams }: LeetCodePageProps) {
  const params = await searchParams;

  return (
    <LeetcodePracticeDashboard
      selectedPattern={(params?.pattern) ?? null}
      selectedSubPatterns={(params?.subPattern) ?? []}
      query={(params?.q) ?? null}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
