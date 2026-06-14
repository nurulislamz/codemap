import { z } from "zod";

export const projectStatuses = ["idea", "in_progress", "completed"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

// Projects the user wants to work on
export const projectSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(2000),
  status: z.enum(projectStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;
