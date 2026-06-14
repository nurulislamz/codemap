import "server-only";

import { UnauthorizedError, getRequestUserId } from "@/lib/auth/identity";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import {
  pomodoroSessionSchema,
  type PomodoroSession,
} from "@/lib/firebase/pomodoro";

export async function createPomodoroSession(
  input: PomodoroSession,
  userId: string,
): Promise<PomodoroSession> {
  const session = pomodoroSessionSchema.parse(input);

  await getPomodoroSessionsCollection(userId)
    .doc(session.sessionId)
    .set(session);

  return session;
}

export async function getRecentPomodoroSessions(
  userId: string,
  count = 20,
): Promise<PomodoroSession[]> {
  const snapshot = await getPomodoroSessionsCollection(userId)
    .orderBy("startedAt", "desc")
    .limit(count)
    .get();

  return snapshot.docs
    .map((doc) => pomodoroSessionSchema.safeParse(doc.data()))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);
}

export async function getRecentPomodoroSessionsForRequest(
  count = 200,
): Promise<PomodoroSession[]> {
  try {
    const userId = await getRequestUserId();
    return await getRecentPomodoroSessions(userId, count);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return [];
    }

    throw error;
  }
}

function getPomodoroSessionsCollection(userId: string) {
  return getFirestoreDb()
    .collection("users")
    .doc(userId)
    .collection("pomodoroSessions");
}
