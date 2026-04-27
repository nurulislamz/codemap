import { NextResponse } from "next/server";

import { getDb } from "@/server/db/client";
import { aiGenerationJobs, profiles } from "@/server/db/schema";
import { LOCAL_USER_ID } from "@/server/db/local-user";
import { stableUuidFromString } from "@/server/ids/stable-uuid";

export async function POST(request: Request) {
  const db = await getDb();

  const body = (await request.json().catch(() => null)) as
    | { topic?: unknown; notes?: unknown; source_table?: unknown; source_key?: unknown; source_track?: unknown }
    | null;

  const topic = typeof body?.topic === "string" ? body.topic : "";
  const notes = typeof body?.notes === "string" ? body.notes : "";

  if (!topic || !notes) {
    return NextResponse.json({ error: "Missing topic/notes" }, { status: 400 });
  }

  const source_track =
    body?.source_track === "roadmap" ||
    body?.source_track === "system_design" ||
    body?.source_track === "leetcode" ||
    body?.source_track === "flashcards"
      ? body.source_track
      : "roadmap";
  const source_table = typeof body?.source_table === "string" ? body.source_table : "seed";
  const source_key = typeof body?.source_key === "string" ? body.source_key : topic;

  const nowIso = new Date().toISOString();
  const jobId = stableUuidFromString(`${LOCAL_USER_ID}:flashcards.generate:${nowIso}`);

  // Ensure profile exists for the local owner.
  await db
    .insert(profiles)
    .values({ id: LOCAL_USER_ID, email: "local@localhost", createdAt: nowIso })
    .onConflictDoNothing();

  await db.insert(aiGenerationJobs).values({
    id: jobId,
    userId: LOCAL_USER_ID,
    jobType: "flashcards.generate",
    inputPayload: JSON.stringify({
      topic,
      notes,
      source_track,
      source_table,
      source_key,
    }),
    status: "queued",
    attempts: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  return NextResponse.json({
    ok: true,
    job: { id: jobId, status: "queued", created_at: nowIso },
  });
}
