import type { PomodoroTask } from "@/lib/firebase/tasks";

export type { PomodoroTask } from "@/lib/firebase/tasks";

const localTaskStorageKey = "codemap.pomodoroTasks.v1";

export function saveLocalPomodoroTasks(tasks: PomodoroTask[]) {
  const storage = getLocalStorage();

  if (!storage) {
    throw new Error("Local pomodoro task storage is unavailable.");
  }

  storage.setItem(localTaskStorageKey, JSON.stringify(tasks));

  return tasks;
}

export function getLocalPomodoroTasks(): PomodoroTask[] {
  const storage = getLocalStorage();
  const rawValue = storage?.getItem(localTaskStorageKey);

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed) ? parsed.filter(isLocalTask) : [];
  } catch {
    return [];
  }
}

function getLocalStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage ||
    typeof window.localStorage.getItem !== "function" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    return null;
  }

  return window.localStorage;
}

function isLocalTask(value: unknown): value is PomodoroTask {
  if (!value || typeof value !== "object") return false;

  const task = value as Partial<PomodoroTask>;

  return (
    typeof task.id === "string" &&
    typeof task.text === "string" &&
    typeof task.done === "boolean" &&
    typeof task.createdAt === "string"
  );
}
