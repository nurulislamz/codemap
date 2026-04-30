"use server";

import { revalidatePath } from "next/cache";
import { createLeetCodeAttempt } from "../../leetcode-db-server";

export async function saveLeetCodeAttemptFromForm(
  problemId: string,
  startedAt: string,
  formData: FormData,
): Promise<void> {
  const status = String(formData.get("status") ?? "");
  const endedAt = new Date().toISOString();
  const durationSeconds = Math.max(
    0,
    Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  );

  await createLeetCodeAttempt({
    attemptId: String(formData.get("attemptId") ?? ""),
    problemId,
    isSuccessful: status === "completed",
    startedAt,
    endedAt,
    durationSeconds,
    language: null,
    failureReason: status === "failed" ? "Attempt marked as failed" : null,
    notes: null,
  });

  revalidatePath("/leetcode");
}
