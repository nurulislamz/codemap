"use server";

import { revalidatePath } from "next/cache";
import { createLeetCodeAttempt } from "../data/leetcode-db-server";
import type { SaveLeetcodeAttemptInput } from "../types";

export async function saveLeetCodeAttempt({
  problemId,
  status,
  startedAt,
  endedAt,
  notes,
}: SaveLeetcodeAttemptInput): Promise<void> {
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
    language: null,
    failureReason: formatFailureReason(status),
    notes: formatNotes(status, notes),
  });

  revalidatePath("/leetcode");
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
