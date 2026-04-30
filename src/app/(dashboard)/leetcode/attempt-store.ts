import { calculateAttemptResult } from "../../../domain/leetcode/timer";
import { findStarterLeetCodeAssignment } from "./assignments";

type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

type StoredStarterAttempt = {
  attemptId: string;
  assignmentId: string;
  startedAt: string;
  timeLimitMinutes: number;
};

type CompleteStarterAttemptInput = {
  attemptId: string;
  status: string;
  endedAt?: Date;
};

export type StarterAttemptDisplay = StoredStarterAttempt & {
  title: string;
  pattern: string;
  subpattern: string;
  sourceUrl: string;
};

const starterAttempts = new Map<string, StoredStarterAttempt>();

// Temporary static-shell store until Supabase attempt persistence owns this state.
export function createStarterAttempt(
  assignmentId: string,
  now = new Date(),
): StarterAttemptDisplay {
  const assignment = findStarterLeetCodeAssignment(assignmentId);

  if (!assignment) {
    throw new Error(`Unknown LeetCode assignment: ${assignmentId}`);
  }

  const attempt = {
    attemptId: crypto.randomUUID(),
    assignmentId: assignment.id,
    startedAt: now.toISOString(),
    timeLimitMinutes: assignment.timeLimitMinutes,
  };

  starterAttempts.set(attempt.attemptId, attempt);

  return {
    ...attempt,
    title: assignment.problemTitle,
    pattern: assignment.pattern,
    subpattern: assignment.subpattern,
    sourceUrl: assignment.sourceUrl,
  };
}

export function completeStarterAttempt({
  attemptId,
  status,
  endedAt = new Date(),
}: CompleteStarterAttemptInput) {
  const attempt = starterAttempts.get(attemptId);

  if (!attempt) {
    throw new Error(`Unknown LeetCode attempt: ${attemptId}`);
  }

  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }

  return calculateAttemptResult({
    startedAt: attempt.startedAt,
    endedAt: endedAt.toISOString(),
    timeLimitMinutes: attempt.timeLimitMinutes,
    requestedStatus: status as AttemptStatus,
  });
}
