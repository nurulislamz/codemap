import type {
  LeetcodeAttemptStatus,
  LeetcodeProblemRow,
  SaveLeetcodeAttemptInput,
} from "@/lib/leetcode/types";

const localAttemptStorageKey = "codemap.leetcodeAttempts.v1";

export type LocalLeetcodeAttempt = SaveLeetcodeAttemptInput & {
  attemptId: string;
  problemTitle: string;
  problemUrl: string;
  isSuccessful: boolean;
  durationSeconds: number;
  savedAt: string;
};

export function saveLocalLeetcodeAttempt(
  problem: LeetcodeProblemRow,
  input: SaveLeetcodeAttemptInput,
) {
  const storage = getLocalStorage();

  if (!storage) {
    throw new Error("Local attempt storage is unavailable.");
  }

  const attempts = getLocalLeetcodeAttempts();
  const attempt: LocalLeetcodeAttempt = {
    ...input,
    attemptId: crypto.randomUUID(),
    problemTitle: problem.title,
    problemUrl: problem.leetcodeUrl,
    isSuccessful: isSuccessfulStatus(input.status),
    durationSeconds: Math.max(
      1,
      Math.floor((new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime()) / 1000),
    ),
    savedAt: new Date().toISOString(),
  };

  storage.setItem(
    localAttemptStorageKey,
    JSON.stringify([attempt, ...attempts]),
  );

  return attempt;
}

export function getLocalLeetcodeAttempts(): LocalLeetcodeAttempt[] {
  const storage = getLocalStorage();
  const rawValue = storage?.getItem(localAttemptStorageKey);

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed) ? parsed.filter(isLocalAttempt) : [];
  } catch {
    return [];
  }
}

function getLocalStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage ||
    typeof window.localStorage.getItem !== "function" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    return null;
  }

  return window.localStorage;
}

export function getLatestLocalLeetcodeNotes(problemId: string) {
  return getLocalLeetcodeAttempts()
    .filter((attempt) => attempt.problemId === problemId && attempt.notes?.trim())
    .toSorted(
      (left, right) =>
        new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
    )[0]?.notes ?? null;
}

function isSuccessfulStatus(status: LeetcodeAttemptStatus) {
  return status === "completed" || status === "completed_overtime";
}

function isLocalAttempt(value: unknown): value is LocalLeetcodeAttempt {
  if (!value || typeof value !== "object") return false;

  const attempt = value as Partial<LocalLeetcodeAttempt>;

  return (
    typeof attempt.attemptId === "string" &&
    typeof attempt.problemId === "string" &&
    typeof attempt.problemTitle === "string" &&
    typeof attempt.startedAt === "string" &&
    typeof attempt.endedAt === "string"
  );
}
