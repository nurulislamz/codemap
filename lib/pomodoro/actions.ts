"use server";

import { revalidatePath } from "next/cache";
import { getRequestUserId } from "@/lib/auth/identity";
import { createPomodoroSession } from "./db-server";

export type SavePomodoroSessionInput = {
  startedAt: string;
  endedAt: string;
  targetMinutes: number;
  completed: boolean;
  idToken?: string | null;
};

export async function savePomodoroSession(
  input: SavePomodoroSessionInput,
): Promise<void> {
  const userId = await getRequestUserId(input);
  const durationSeconds = Math.max(
    1,
    Math.floor(
      (new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime()) / 1000,
    ),
  );

  await createPomodoroSession(
    {
      sessionId: crypto.randomUUID(),
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationSeconds,
      targetMinutes: input.targetMinutes,
      completed: input.completed,
    },
    userId,
  );

  revalidatePath("/pomodoro");
}
