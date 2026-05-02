import { NextResponse } from "next/server";

import { LOCAL_USER_ID } from "@/lib/db/local-user";
import { stableUuidFromString } from "@/lib/ids/stable-uuid";

export async function POST(request: Request) {
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

  void source_track;
  void source_table;
  void source_key;

  return NextResponse.json({
    ok: false,
    skipped: "AI job persistence is not connected after removing the local DB layer.",
    job: { id: jobId, status: "skipped", created_at: nowIso },
  });
}
