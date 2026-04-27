import "server-only";

import { getDb } from "@/server/db/client";
import { leetcodeAttempts } from "@/server/db/schema";
import { LOCAL_USER_ID } from "@/server/db/local-user";
import { findStarterLeetCodeAssignment } from "../../assignments";
import { stableUuidFromString } from "@/server/ids/stable-uuid";
import { eq, and } from "drizzle-orm";

export type DbAttemptDisplay = {
  attemptId: string;
  assignmentId: string;
  startedAt: string;
  timeLimitMinutes: number;
  title: string;
  pattern: string;
  subpattern: string;
  sourceUrl: string;
  problemId: string;
};

export async function createDbAttemptOrNull(assignmentId: string): Promise<DbAttemptDisplay | null> {
  const assignment = findStarterLeetCodeAssignment(assignmentId);
  if (!assignment) return null;

  const db = await getDb();
  const nowIso = new Date().toISOString();
  const attemptId = stableUuidFromString(`${LOCAL_USER_ID}:${assignmentId}:${nowIso}`);

  await db.insert(leetcodeAttempts).values({
    id: attemptId,
    userId: LOCAL_USER_ID,
    assignmentId,
    problemTitle: assignment.problemTitle,
    sourceUrl: assignment.sourceUrl,
    startedAt: nowIso,
    timeLimitMinutes: assignment.timeLimitMinutes,
    result: "in_progress",
  });

  return {
    attemptId,
    assignmentId,
    startedAt: nowIso,
    timeLimitMinutes: assignment.timeLimitMinutes,
    title: assignment.problemTitle,
    pattern: assignment.pattern,
    subpattern: assignment.subpattern,
    sourceUrl: assignment.sourceUrl,
    problemId: assignmentId,
  };
}

export async function getDbAttemptOrNull(attemptId: string, assignmentId: string): Promise<DbAttemptDisplay | null> {
  const assignment = findStarterLeetCodeAssignment(assignmentId);
  if (!assignment) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(leetcodeAttempts)
    .where(and(eq(leetcodeAttempts.id, attemptId), eq(leetcodeAttempts.userId, LOCAL_USER_ID)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  return {
    attemptId: String(row.id),
    assignmentId,
    startedAt: String(row.startedAt),
    timeLimitMinutes: Number(row.timeLimitMinutes ?? assignment.timeLimitMinutes),
    title: assignment.problemTitle,
    pattern: assignment.pattern,
    subpattern: assignment.subpattern,
    sourceUrl: assignment.sourceUrl,
    problemId: assignmentId,
  };
}
