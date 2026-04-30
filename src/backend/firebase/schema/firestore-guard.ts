import {
  leetcodeAttemptEventWriteSchema,
  type LeetCodeAttemptEventWrite
} from "../leetcode";

export function validateLeetCodeAttemptEventWrite(input: unknown): LeetCodeAttemptEventWrite {
  return leetcodeAttemptEventWriteSchema.parse(input);
}