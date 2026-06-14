"use server";

import { revalidatePath } from "next/cache";
import { getRequestUserId } from "@/lib/auth/identity";
import { createLeetCodeAttempt } from "./db-server";
import type { SaveLeetcodeAttemptInput } from "@/lib/leetcode/types";

export async function saveLeetCodeAttempt(input: SaveLeetcodeAttemptInput): Promise<void> {
  const userId = await getRequestUserId(input);
  const {
  problemId,
  status,
  startedAt,
  endedAt,
  language,
  notes,
  } = input;
  const durationSeconds = Math.max(
    1,
    Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  );

  await createLeetCodeAttempt({
    attemptId: crypto.randomUUID(),
    problemId,
    isSuccessful: status === "completed" || status === "completed_overtime",
    startedAt,
    endedAt,
    durationSeconds,
    language: language ?? null,
    failureReason: formatFailureReason(status),
    notes: formatNotes(status, notes),
  }, userId);

  revalidatePath("/leetcode/allproblems");
  revalidatePath("/leetcode/dashboard");
}

function formatFailureReason(
  status: SaveLeetcodeAttemptInput["status"],
) {
  if (status === "failed") return "Attempt marked as failed";
  if (status === "skipped") return "Attempt skipped";
  if (status === "timed_out") return "Time ran out";

  return null;
}

function formatNotes(
  status: SaveLeetcodeAttemptInput["status"],
  notes: string | null | undefined,
) {
  const normalizedNotes = notes?.trim() || null;

  if (status === "completed_overtime") {
    return normalizedNotes
      ? `[completed after time limit] ${normalizedNotes}`
      : "[completed after time limit]";
  }

  return normalizedNotes;
}
