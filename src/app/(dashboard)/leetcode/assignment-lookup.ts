import { findStarterLeetCodeAssignment } from "./assignments";

export type LeetcodeAssignment = {
  id: string;
  title: string;
  timeLimitMinutes: number;
};

export function getLeetcodeAssignment(assignmentId: string): LeetcodeAssignment {
  const starterAssignment = findStarterLeetCodeAssignment(assignmentId);

  if (!starterAssignment) {
    throw new Error(`Unknown LeetCode assignment: ${assignmentId}`);
  }

  return {
    id: starterAssignment.id,
    title: starterAssignment.problemTitle,
    timeLimitMinutes: starterAssignment.timeLimitMinutes,
  };
}
