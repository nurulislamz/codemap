import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodePracticeDashboard } from "@/components/leetcode/leetcode-practice-dashboard";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";

type LeetCodePageProps = {
  searchParams?: Promise<{
    pattern?: string;
    subPattern?: string[];
    q?: string;
  }>;
};

export default async function LeetCodePage({ searchParams }: LeetCodePageProps) {
  const { problems, patternGroups } = getLeetcodeCatalog();
  const params = await searchParams;

  return (
    <LeetcodePracticeDashboard
      problems={problems}
      patterns={patternGroups}
      selectedPattern={(params?.pattern) ?? null}
      selectedSubPatterns={(params?.subPattern) ?? []}
      query={(params?.q) ?? null}
      saveAttemptAction={saveLeetCodeAttempt}
    />
  );
}
