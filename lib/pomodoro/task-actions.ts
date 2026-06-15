"use server";

import { revalidatePath } from "next/cache";

import { getRequestUserId } from "@/lib/auth/identity";
import type { PomodoroTask } from "@/lib/firebase/tasks";
import { replacePomodoroTasks } from "./task-db-server";

export type SavePomodoroTasksInput = {
  tasks: PomodoroTask[];
  idToken?: string | null;
};

export async function savePomodoroTasks(
  input: SavePomodoroTasksInput,
): Promise<void> {
  const userId = await getRequestUserId(input);

  await replacePomodoroTasks(input.tasks, userId);

  revalidatePath("/pomodoro");
}
