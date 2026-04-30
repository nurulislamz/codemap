import { z } from "zod";

export const leetcodeDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const leetcodeLanguageSchema = z.enum([
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Other",
]);

// List of leetcode problems with ids, patterns, links etc
export const leetcodeProblemCatalogSchema = z.object({
  id: z.string().min(1),
  problemId: z.string().min(1),
  pattern: z.string().min(1),
  subPattern: z.string().min(1),
  leetcodeNumber: z.string().min(1),
  title: z.string().min(1),
  leetcodeUrl: z.url(),
  difficulty: leetcodeDifficultySchema,
  solution: z.url().nullable(),
  solutionVideo: z.url().nullable()
});

// Attempted events
export const leetcodeAttemptEventSchema = z.object({
  attemptId: z.uuid().min(1),
  problemId: z.string().min(1),
  isSuccessful: z.boolean(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  durationSeconds: z.number().int().nonnegative(),
  language: leetcodeLanguageSchema.nullable(),
  failureReason: z.string().max(200).nullable(),
  notes: z.string().max(200).nullable(),
});


// Write shape: problem progress
export type LeetCodeProblem = z.infer<typeof leetcodeProblemCatalogSchema>;
export type LeetCodeAttemptEvent = z.infer<typeof leetcodeAttemptEventSchema>;
