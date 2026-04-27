import "server-only";

import { generateFlashcards } from "@/server/ai/openai-flashcards";
import { stableUuidFromString } from "@/server/ids/stable-uuid";
import { getDb } from "@/server/db/client";
import { aiGenerationJobs, flashcards } from "@/server/db/schema";
import { LOCAL_USER_ID } from "@/server/db/local-user";
import { eq, asc } from "drizzle-orm";

type QueuedJobRow = {
  id: string;
  user_id: string;
  job_type: string;
  input_payload: unknown;
};

type FlashcardJobInput = {
  topic: string;
  notes: string;
  source_track?: "roadmap" | "system_design" | "leetcode" | "flashcards";
  source_table?: string;
  source_key?: string;
};

function parseFlashcardJobInput(payload: unknown): FlashcardJobInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid input_payload");
  }
  const obj = payload as Record<string, unknown>;
  const topic = typeof obj.topic === "string" ? obj.topic : "";
  const notes = typeof obj.notes === "string" ? obj.notes : "";
  if (!topic || !notes) throw new Error("Missing topic/notes");
  return {
    topic,
    notes,
    source_track: typeof obj.source_track === "string" ? (obj.source_track as any) : undefined,
    source_table: typeof obj.source_table === "string" ? obj.source_table : undefined,
    source_key: typeof obj.source_key === "string" ? obj.source_key : undefined,
  };
}

export async function processQueuedAiJobs(
  input: { limit: number },
): Promise<{ processed: number; errors: Array<{ jobId: string; error: string }> }> {
  const db = await getDb();
  const jobs = await db
    .select()
    .from(aiGenerationJobs)
    .where(eq(aiGenerationJobs.status, "queued"))
    .orderBy(asc(aiGenerationJobs.createdAt))
    .limit(input.limit);
  const errors: Array<{ jobId: string; error: string }> = [];
  let processed = 0;

  for (const job of jobs as any[]) {
    try {
      // Claim job.
      const nowIso = new Date().toISOString();
      await db
        .update(aiGenerationJobs)
        .set({ status: "processing", attempts: 1, updatedAt: nowIso })
        .where(eq(aiGenerationJobs.id, job.id));

      if (job.jobType !== "flashcards.generate") {
        throw new Error(`Unsupported job_type: ${job.jobType}`);
      }

      const parsed = parseFlashcardJobInput(JSON.parse(String(job.inputPayload)));
      const generated = await generateFlashcards({ topic: parsed.topic, notes: parsed.notes });

      const sourceTrack = parsed.source_track ?? "roadmap";
      const sourceTable = parsed.source_table ?? "seed";
      const sourceKey = parsed.source_key ?? parsed.topic;
      const sourceId = stableUuidFromString(`${sourceTable}:${sourceKey}`);

      const nowCreatedIso = new Date().toISOString();
      const cardRows = generated.cards.map((card, idx) => ({
        id: stableUuidFromString(`${job.id}:card:${idx}`),
        userId: LOCAL_USER_ID,
        sourceTrack,
        sourceTable,
        sourceId,
        question: card.question,
        answer: card.answer,
        hint: card.hint,
        status: "draft",
        createdAt: nowCreatedIso,
      }));

      if (cardRows.length) {
        await db.insert(flashcards).values(cardRows);
      }

      await db
        .update(aiGenerationJobs)
        .set({
          status: "completed",
          outputPayload: JSON.stringify(generated),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(aiGenerationJobs.id, job.id));

      processed += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ jobId: String(job.id), error: message });
      await db
        .update(aiGenerationJobs)
        .set({
          status: "failed",
          errorMessage: message,
          updatedAt: new Date().toISOString(),
          attempts: 1,
        })
        .where(eq(aiGenerationJobs.id, job.id));
    }
  }

  return { processed, errors };
}
