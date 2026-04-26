import {
  calculateAttemptResult,
  type AttemptResult,
} from "../../../features/leetcode/timer";
import { findStarterLeetCodeAssignment } from "./assignments";

type AttemptStatus = "completed" | "failed" | "skipped";

export type LeetcodeAssignmentAttempt = {
  id: string;
  title: string;
  timeLimitMinutes: number;
  startedAt: string;
};

type CompleteAttemptFromAssignmentInput = {
  assignment: LeetcodeAssignmentAttempt;
  endedAt: string;
  status: AttemptStatus;
};

export function getLeetcodeAssignment(
  assignmentId: string,
  startedAt = new Date().toISOString(),
): LeetcodeAssignmentAttempt {
  const starterAssignment = findStarterLeetCodeAssignment(assignmentId);

  if (!starterAssignment) {
    throw new Error(`Unknown LeetCode assignment: ${assignmentId}`);
  }

  return {
    id: starterAssignment.id,
    title: starterAssignment.problemTitle,
    timeLimitMinutes: starterAssignment.timeLimitMinutes,
    startedAt,
  };
}

export function completeAttemptFromAssignment({
  assignment,
  endedAt,
  status,
}: CompleteAttemptFromAssignmentInput): AttemptResult {
  return calculateAttemptResult({
    startedAt: assignment.startedAt,
    endedAt,
    timeLimitMinutes: assignment.timeLimitMinutes,
    requestedStatus: status,
  });
}
