type AttemptStatus = "completed" | "failed" | "skipped" | "abandoned";

export interface AttemptResultInput {
  startedAt: string;
  endedAt: string;
  timeLimitMinutes: number;
  requestedStatus: AttemptStatus;
}

export interface AttemptResult {
  elapsedSeconds: number;
  isOverTime: boolean;
  status: AttemptStatus;
}

export function calculateAttemptResult(input: AttemptResultInput): AttemptResult {
  const startedAt = new Date(input.startedAt).getTime();
  const endedAt = new Date(input.endedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));

  return {
    elapsedSeconds,
    isOverTime: elapsedSeconds > input.timeLimitMinutes * 60,
    status: input.requestedStatus,
  };
}
