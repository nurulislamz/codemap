"use server";

import { revalidatePath } from "next/cache";
import type { AttemptResult } from "@/features/leetcode/timer";
import { calculateAttemptResult } from "@/features/leetcode/timer";
import { getDb } from "@/server/db/client";
import { leetcodeAttempts } from "@/server/db/schema";
import { LOCAL_USER_ID } from "@/server/db/local-user";
import { completeStarterAttempt } from "../../attempt-store";
import { eq, and } from "drizzle-orm";

type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

export async function completeDbAttempt(
  attemptId: string,
  status: AttemptStatus,
): Promise<AttemptResult> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(leetcodeAttempts)
    .where(and(eq(leetcodeAttempts.id, attemptId), eq(leetcodeAttempts.userId, LOCAL_USER_ID)))
    .limit(1);
  const attemptRow = rows[0];
  if (!attemptRow) throw new Error("Could not load attempt");

  const now = new Date();
  const result = calculateAttemptResult({
    startedAt: String(attemptRow.startedAt),
    endedAt: now.toISOString(),
    timeLimitMinutes: Number(attemptRow.timeLimitMinutes),
    requestedStatus: status,
  });

  await db
    .update(leetcodeAttempts)
    .set({
      endedAt: now.toISOString(),
      elapsedSeconds: result.elapsedSeconds,
      result: result.status,
    })
    .where(and(eq(leetcodeAttempts.id, attemptId), eq(leetcodeAttempts.userId, LOCAL_USER_ID)));

  revalidatePath("/leetcode");
  revalidatePath("/dashboard");

  return result;
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
