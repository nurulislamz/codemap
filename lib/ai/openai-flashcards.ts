import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { getEnv, requireEnv } from "@/lib/env";

const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      hint: z.string().min(1),
    }),
  ),
});

export type GeneratedFlashcards = z.infer<typeof flashcardSchema>;

export async function generateFlashcards(input: { topic: string; notes: string }): Promise<GeneratedFlashcards> {
  const env = getEnv();
  const client = new OpenAI({ apiKey: requireEnv(env, "OPENAI_API_KEY") });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input:
      "Return strict JSON only matching this schema: " +
      '{"cards":[{"question":"...","answer":"...","hint":"..."}]}.\n' +
      `Topic: ${input.topic}\n` +
      `Notes: ${input.notes}\n` +
      "Make cards concise and backend-interview focused.",
  });

  return flashcardSchema.parse(JSON.parse(response.output_text));
}
