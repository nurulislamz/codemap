import { LeetcodePracticeProgressClient } from "./leetcode-practice-progress-client";
import {
  LeetcodePatternGroup,
  LeetcodeProblemRow,
  LeetcodeProblemStatusLabel,
  SaveLeetcodeAttemptAction,
} from "@/lib/leetcode/types";
import { LeetcodeProblemDifficultyLabel } from "@/lib/leetcode/types";
import { CodeIcon, LeetcodeHeroPanel } from "./leetcode-ui";
import { redirect } from "next/dist/server/api-utils";
import { zodDef } from "openai/_vendor/zod-to-json-schema/util.mjs";
import zod from "zod";

type LeetcodePracticeDashboardProps = {
  problems: LeetcodeProblemRow[];
  patterns: LeetcodePatternGroup[];
  selectedPattern?: string | null;
  selectedSubPatterns?: string[];
  selectedDifficulty?: string | null;
  status?: LeetcodeProblemStatusLabel | null;
  query?: string | null;
  saveAttemptAction?: SaveLeetcodeAttemptAction;
};

type InvalidLeetcodeFilter = {
  type: "pattern" | "subPattern" | "difficulty";
  value: string;
};

function validateFilters(
  patterns: LeetcodePatternGroup[],
  selectedPatternInput: string | null,
  selectedSubPatternInputs: string[],
  selectedDifficultyInput: string | null,
): InvalidLeetcodeFilter[] {
  const selectedPattern = selectedPatternInput
    ? patterns.find((pattern) => pattern.name === selectedPatternInput)
    : null;
  const validSubPatterns = new Set(
    selectedPattern
      ? selectedPattern.subPatterns.map((subPattern) => subPattern.name)
      : patterns.flatMap((pattern) =>
          pattern.subPatterns.map((subPattern) => subPattern.name),
        ),
  );
  const difficultySchema = zod
    .enum(LeetcodeProblemDifficultyLabel)
    .nullable();

  const filterSchema = zod
    .object({
      selectedPattern: zod
        .string()
        .nullable()
        .refine((pattern) => !pattern || Boolean(selectedPattern)),
      selectedSubPatterns: zod.array(
        zod.string().refine((subPattern) => validSubPatterns.has(subPattern)),
      ),
      selectedDifficulty: difficultySchema,
    })
    .strict();

  const filters = {
    selectedPattern: selectedPatternInput,
    selectedSubPatterns: selectedSubPatternInputs,
    selectedDifficulty: selectedDifficultyInput,
  };

  if (filterSchema.safeParse(filters).success) return [];

  const invalidFilters: InvalidLeetcodeFilter[] = [];

  if (selectedPatternInput && !selectedPattern) {
    invalidFilters.push({ type: "pattern", value: selectedPatternInput });
  }

  for (const subPattern of selectedSubPatternInputs) {
    if (!validSubPatterns.has(subPattern)) {
      invalidFilters.push({ type: "subPattern", value: subPattern });
    }
  }

  if (
    selectedDifficultyInput &&
    !difficultySchema.safeParse(selectedDifficultyInput).success
  ) {
    invalidFilters.push({ type: "difficulty", value: selectedDifficultyInput });
  }

  return invalidFilters;
}

function validateQuery(query: string | null) {
  if (query && query.length > 100) {
    console.warn(
      `LeetCode search query is too long (${query.length} characters). Ignoring search query.`,
    );
    return null;
  }
  return query;
}

export function LeetcodePracticeDashboard({
  problems,
  patterns,
  selectedPattern: selectedPattern = null,
  selectedSubPatterns: selectedSubPattern = [],
  selectedDifficulty: selectedDifficulty = null,
  query = "",
  saveAttemptAction,
}: LeetcodePracticeDashboardProps) {
  const invalidFilters = validateFilters(
    patterns,
    selectedPattern,
    selectedSubPattern,
    selectedDifficulty,
  );

  return (
    <div className="space-y-5">
      <LeetcodeHeroPanel
        icon={<CodeIcon className="h-9 w-9" />}
        title="Practice Problems"
        description="Sharpen your skills by solving hand-picked coding problems."
      >
        <form action="/leetcode/allproblems" className="w-full md:w-[25rem]">
          {selectedPattern ? (
            <input type="hidden" name="pattern" value={selectedPattern} />
          ) : null}
          {selectedSubPatterns.map((subPattern) => (
            <input
              key={subPattern}
              type="hidden"
              name="subPattern"
              value={subPattern}
            />
          ))}
          {selectedDifficulty ? (
            <input type="hidden" name="difficulty" value={selectedDifficulty} />
          ) : null}
          <label className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-full border border-[#26364d] bg-[#07111f]/70 px-6 shadow-inner shadow-black/10">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={queryValue}
              className="grow bg-transparent text-base text-slate-200 outline-none placeholder:text-slate-500"
              placeholder="Search problems..."
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </label>
        </form>
      </LeetcodeHeroPanel>

      {hasUnknownPattern ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown pattern selected. Showing all problems instead.
        </div>
      ) : null}

      {unknownSubPatterns.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown sub-pattern selected. Ignoring invalid sub-pattern filters.
        </div>
      ) : null}

      {hasUnknownDifficulty ? (
        <div
          role="alert"
          className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d]/60 px-5 py-4 text-sm font-semibold text-[#ffb06f]"
        >
          Unknown difficulty selected. Showing all difficulties instead.
        </div>
      ) : null}

      <LeetcodePracticeProgressClient
        problems={problems}
        patterns={patterns}
        initialSelectedPattern={selectedPattern}
        initialSelectedSubPatterns={selectedSubPatterns}
        initialSelectedDifficulty={selectedDifficulty}
        query={queryValue}
        saveAttemptAction={saveAttemptAction}
      />
    </div>
  );
}
