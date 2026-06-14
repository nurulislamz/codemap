import type { PomodoroSession } from "@/lib/firebase/pomodoro";

const localSessionStorageKey = "codemap.pomodoroSessions.v1";

export function saveLocalPomodoroSession(session: PomodoroSession) {
  const storage = getLocalStorage();

  if (!storage) {
    throw new Error("Local pomodoro storage is unavailable.");
  }

  storage.setItem(
    localSessionStorageKey,
    JSON.stringify([session, ...getLocalPomodoroSessions()]),
  );

  return session;
}

export function getLocalPomodoroSessions(): PomodoroSession[] {
  const storage = getLocalStorage();
  const rawValue = storage?.getItem(localSessionStorageKey);

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);

    return Array.isArray(parsed) ? parsed.filter(isLocalSession) : [];
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

function isLocalSession(value: unknown): value is PomodoroSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<PomodoroSession>;

  return (
    typeof session.sessionId === "string" &&
    typeof session.startedAt === "string" &&
    typeof session.endedAt === "string" &&
    typeof session.durationSeconds === "number"
  );
}
