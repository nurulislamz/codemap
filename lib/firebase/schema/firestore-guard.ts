import {
  leetcodeAttemptEventSchema,
  type LeetCodeAttemptEvent
} from "../leetcode";

export function validateLeetCodeAttemptEventWrite(input: unknown): LeetCodeAttemptEvent {
  return leetcodeAttemptEventSchema.parse(input);
}