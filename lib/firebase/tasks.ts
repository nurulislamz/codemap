import { z } from "zod";

// A single pomodoro to-do item.
export const pomodoroTaskSchema = z.object({
  id: z.uuid(),
  text: z.string().trim().min(1).max(500),
  done: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type PomodoroTask = z.infer<typeof pomodoroTaskSchema>;

// A user's full task list is stored as one document; cap the size so a single
// write stays small and bounded.
export const pomodoroTaskListSchema = z.array(pomodoroTaskSchema).max(200);
