import "server-only";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import {
  pomodoroTaskListSchema,
  pomodoroTaskSchema,
  type PomodoroTask,
} from "@/lib/firebase/tasks";

export async function replacePomodoroTasks(
  tasks: PomodoroTask[],
  userId: string,
): Promise<PomodoroTask[]> {
  const validated = pomodoroTaskListSchema.parse(tasks);

  await getPomodoroTasksDoc(userId).set({ tasks: validated });

  return validated;
}

export async function getPomodoroTasks(userId: string): Promise<PomodoroTask[]> {
  const snapshot = await getPomodoroTasksDoc(userId).get();
  const raw = snapshot.data()?.tasks;

  if (!Array.isArray(raw)) return [];

  return raw
    .map((task) => pomodoroTaskSchema.safeParse(task))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);
}

export async function getPomodoroTasksForRequest(): Promise<PomodoroTask[]> {
  try {
    const userId = await getRequestUserId();
    return await getPomodoroTasks(userId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return [];
    }

    throw error;
  }
}

function getPomodoroTasksDoc(userId: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(userId)
    .collection("pomodoro")
    .doc("tasks");
}
