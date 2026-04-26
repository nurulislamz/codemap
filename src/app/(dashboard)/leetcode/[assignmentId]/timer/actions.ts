"use server";

import { revalidatePath } from "next/cache";
import type { AttemptResult } from "@/features/leetcode/timer";
import {
  completeAttemptFromAssignment,
  getLeetcodeAssignment,
  type LeetcodeAssignmentAttempt,
} from "../../assignment-lookup";

type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

export type CompleteAttemptInput = {
  assignmentId: string;
  status: AttemptStatus;
};

export async function completeAttempt(
  input: CompleteAttemptInput,
): Promise<AttemptResult> {
  const assignment = getLeetcodeAssignment(input.assignmentId);
  const result = completeAttemptFromAssignment({
    assignment,
    endedAt: new Date().toISOString(),
    status: input.status,
  });

  revalidatePath("/leetcode");

  return result;
}

export async function completeAttemptFromForm(
  assignment: LeetcodeAssignmentAttempt,
  formData: FormData,
): Promise<void> {
  const status = String(formData.get("status") ?? "");

  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }

  completeAttemptFromAssignment({
    assignment,
    endedAt: new Date().toISOString(),
    status: status as AttemptStatus,
  });

  revalidatePath("/leetcode");
}
