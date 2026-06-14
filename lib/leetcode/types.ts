export type LeetcodeProblemRow = {
  number: string;
  title: string;
  difficulty: LeetcodeProblemDifficultyLabel;
  pattern: string;
  subPattern: string;
  leetcodeUrl: string;
  estimatedMinutes: number;
  solutionUrl?: string;
  solutionVideoUrl?: string;
};

export type LeetcodeProblemProgressRow = LeetcodeProblemRow & {
  isCompleted: boolean;
  lastAttemptedAt: string | null;
  attemptCount: number;
  bestDurationSeconds: number | null;
};

export enum LeetcodeProblemDifficultyLabel {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export const leetcodeProblemDifficultyLabels = [
  LeetcodeProblemDifficultyLabel.Easy,
  LeetcodeProblemDifficultyLabel.Medium,
  LeetcodeProblemDifficultyLabel.Hard,
] as const;

export function parseDifficulty(value: string | null) {
  if (
    value === LeetcodeProblemDifficultyLabel.Easy ||
    value === LeetcodeProblemDifficultyLabel.Medium ||
    value === LeetcodeProblemDifficultyLabel.Hard
  ) {
    return value;
  }

  return null;
}

export enum LeetcodeProblemStatusLabel {
  Completed = "Completed",
  Attempted = "Attempted",
  Unattempted = "Unattempted",
}

export const leetcodeLanguages = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Other",
] as const;

export type LeetcodeLanguage = (typeof leetcodeLanguages)[number];

export function parseLeetcodeLanguage(
  value: string | null | undefined,
): LeetcodeLanguage | null {
  return leetcodeLanguages.find((language) => language === value) ?? null;
}

export type LeetcodeAttemptRow = {
  attemptId: string;
  problemId: string;
  problemTitle: string;
  isSuccessful: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  language?: LeetcodeLanguage | null;
  notes?: string | null;
  failureReason?: string | null;
};

export type LeetcodeAttemptStatus =
  | "completed"
  | "completed_overtime"
  | "failed"
  | "skipped"
  | "timed_out";

export type SaveLeetcodeAttemptInput = {
  problemId: string;
  status: LeetcodeAttemptStatus;
  startedAt: string;
  endedAt: string;
  language?: LeetcodeLanguage | null;
  notes?: string | null;
  idToken?: string | null;
};

export type SaveLeetcodeAttemptAction = (
  input: SaveLeetcodeAttemptInput,
) => Promise<void>;

export type LeetcodePatternCounts = {
  count: number;
  children?: LeetcodePatternCounts[] | null;
};
