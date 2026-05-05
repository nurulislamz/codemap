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

export enum LeetcodeProblemDifficultyLabel {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum LeetcodeProblemStatusLabel {
  Completed = "Completed",
  Attempted = "Attempted",
  Unattempted = "Unattempted",
}

export type LeetcodeAttemptRow = {
  attemptId: string;
  problemId: string;
  problemTitle: string;
  isSuccessful: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
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
  notes?: string | null;
  idToken?: string | null;
};

export type SaveLeetcodeAttemptAction = (
  input: SaveLeetcodeAttemptInput,
) => Promise<void>;

export type LeetcodePatternSummary = {
  name: string;
  count: number;
};

export type LeetcodePatternGroup = LeetcodePatternSummary & {
  subPatterns: LeetcodePatternSummary[];
};
