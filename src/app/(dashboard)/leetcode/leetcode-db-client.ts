"use client";


import { LeetCodeAttemptEvent } from "@/backend/firebase/leetcode";
import { createLeetCodeAttempt } from "./leetcode-db-server";

type SubmitLeetCodeAttemptInput = Omit<LeetCodeAttemptEvent, "attemptId">;

export async function submitLeetCodeAttempt(input: SubmitLeetCodeAttemptInput) {
  return createLeetCodeAttempt({
    ...input,
    attemptId: crypto.randomUUID(),
  });
}
