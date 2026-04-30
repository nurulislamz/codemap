import { NextResponse } from "next/server";

import { assertCronRequest } from "@/backend/cron/auth";
import { getEnv, requireEnv } from "@/backend/env";
import { processQueuedAiJobs } from "@/backend/ai/job-processor";

export async function GET(request: Request) {
  const env = getEnv();

  if (!assertCronRequest(request, requireEnv(env, "CRON_SECRET"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.AI_FLASHCARDS_ENABLED) {
    return NextResponse.json({ processed: 0, skipped: "AI flashcards disabled" });
  }

  const result = await processQueuedAiJobs({ limit: 5 });

  return NextResponse.json({ ok: true, ...result });
}
