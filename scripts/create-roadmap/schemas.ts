import { z } from "zod";

export const questionTypeSchema = z.enum(["freeform", "multiple-choice"]);
export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const sourceCandidateSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  discoveredFromQuery: z.string(),
  rank: z.number().int().positive(),
  reason: z.string(),
  status: z.enum(["candidate", "approved", "rejected"]).default("candidate"),
});

export const sourceManifestSchema = z.object({
  roadmapSlug: z.string().min(1),
  roadmapTitle: z.string().min(1),
  topicSlug: z.string().min(1).nullable(),
  topicTitle: z.string().min(1).nullable(),
  queries: z.array(z.string().min(1)),
  sources: z.array(sourceCandidateSchema),
  generatedAt: z.string(),
  model: z.string(),
});

export const extractedQuestionSchema = z.object({
  id: z.string().min(1),
  roadmapSlug: z.string().min(1),
  topicSlug: z.string().min(1).nullable(),
  type: questionTypeSchema,
  difficulty: difficultySchema,
  question: z.string().min(1),
  expectedAnswer: z.string().optional(),
  acceptedPoints: z.array(z.string()).optional(),
  choices: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  correctChoiceIds: z.array(z.string()).optional(),
  explanation: z.string().min(1),
  sourceUrls: z.array(z.string().url()),
  reviewStatus: z.enum(["needs-review", "approved"]).default("needs-review"),
});

export const questionBankSchema = z.object({
  roadmapSlug: z.string().min(1),
  roadmapTitle: z.string().min(1),
  topicSlug: z.string().min(1).nullable(),
  topicTitle: z.string().min(1).nullable(),
  generatedAt: z.string(),
  model: z.string(),
  questions: z.array(extractedQuestionSchema),
  extractionRuns: z.array(
    z.object({
      sourceUrl: z.string().url(),
      extractedAt: z.string(),
      extractor: z.enum(["fetch", "playwright"]),
      model: z.string(),
      questionCount: z.number().int().nonnegative(),
      status: z.enum(["extracted", "failed"]),
      error: z.string().optional(),
    }),
  ),
});

export const queryResponseSchema = z.object({
  queries: z.array(z.string()),
});

export const rankResponseSchema = z.object({
  sources: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      reason: z.string(),
    }),
  ),
});

export const extractionResponseSchema = z.object({
  questions: z.array(
    z.object({
      type: questionTypeSchema,
      difficulty: difficultySchema,
      question: z.string(),
      expectedAnswer: z.string().optional(),
      acceptedPoints: z.array(z.string()).optional(),
      choices: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
      correctChoiceIds: z.array(z.string()).optional(),
      explanation: z.string(),
    }),
  ),
});

export type SourceManifest = z.infer<typeof sourceManifestSchema>;
export type SourceCandidate = z.infer<typeof sourceCandidateSchema>;
export type ExtractedQuestion = z.infer<typeof extractedQuestionSchema>;
export type QuestionBank = z.infer<typeof questionBankSchema>;
export type QueryResponse = z.infer<typeof queryResponseSchema>;
export type RankResponse = z.infer<typeof rankResponseSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
