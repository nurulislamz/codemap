"use server";

import { revalidatePath } from "next/cache";
import {
  calculateAttemptResult,
  type AttemptResult,
} from "@/features/leetcode/timer";

type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

export type CompleteAttemptInput = {
  startedAt: string;
  timeLimitMinutes: number;
  status: AttemptStatus;
};

export async function completeAttempt(
  input: CompleteAttemptInput,
): Promise<AttemptResult> {
  const result = calculateAttemptResult({
    startedAt: input.startedAt,
    endedAt: new Date().toISOString(),
    timeLimitMinutes: input.timeLimitMinutes,
    requestedStatus: input.status,
  });

  revalidatePath("/leetcode");

  return result;
}

export async function completeAttemptFromForm(formData: FormData): Promise<void> {
  const status = String(formData.get("status") ?? "");

  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }

  await completeAttempt({
    startedAt: String(formData.get("startedAt") ?? ""),
    timeLimitMinutes: Number(formData.get("timeLimitMinutes")),
    status: status as AttemptStatus,
  });
}
