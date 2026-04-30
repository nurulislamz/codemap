"use server";

import { revalidatePath } from "next/cache";
import type { AttemptResult } from "@/domain/leetcode/timer";
import { completeStarterAttempt } from "../../attempt-store";

type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

export async function completeDbAttempt(
  attemptId: string,
  status: AttemptStatus,
): Promise<AttemptResult> {
  return completeAttempt(attemptId, status);
}

export async function completeAttempt(
  attemptId: string,
  status: AttemptStatus,
): Promise<AttemptResult> {
  const result = completeStarterAttempt({
    attemptId,
    status,
  });

  revalidatePath("/leetcode");

  return result;
}

export async function completeAttemptFromForm(
  attemptId: string,
  formData: FormData,
): Promise<void> {
  const status = String(formData.get("status") ?? "");

  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }

  await completeAttempt(attemptId, status as AttemptStatus);
}

export async function completeDbAttemptFromForm(
  attemptId: string,
  formData: FormData,
): Promise<void> {
  const status = String(formData.get("status") ?? "");

  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }

  await completeDbAttempt(attemptId, status as AttemptStatus);
}
