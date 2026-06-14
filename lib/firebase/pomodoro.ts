import { z } from "zod";

// Completed or stopped pomodoro work sessions
export const pomodoroSessionSchema = z.object({
  sessionId: z.uuid(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  durationSeconds: z.number().int().positive(),
  targetMinutes: z.number().int().positive(),
  completed: z.boolean(),
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;
