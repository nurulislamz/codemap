import { saveLeetCodeAttempt } from "@/lib/leetcode/actions";
import { LeetcodePracticeDashboard } from "@/components/leetcode/leetcode-practice-dashboard";
import { getLeetcodeCatalog } from "@/lib/leetcode/catalog";

type LeetCodePageProps = {
  searchParams?: Promise<{
    pattern?: string;
    subPattern?: string[];
    difficulty?: string;
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
      selectedPattern={params?.pattern}
      selectedSubPatterns={params?.subPattern}
      selectedDifficulty={params?.difficulty}
      query={params?.q}
      saveAttemptAction={saveLeetCodeAttempt}/>
  )
}
