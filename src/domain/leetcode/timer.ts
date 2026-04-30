type AttemptStatus = "completed" | "failed" | "skipped";

const validAttemptStatuses = new Set<string>(["completed", "failed", "skipped"]);

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
  assertAttemptStatus(input.requestedStatus);

  const startedAt = parseTimestamp(input.startedAt, "startedAt").getTime();
  const endedAt = parseTimestamp(input.endedAt, "endedAt").getTime();
  const elapsedSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));

  return {
    elapsedSeconds,
    isOverTime: elapsedSeconds > input.timeLimitMinutes * 60,
    status: input.requestedStatus,
  };
}

function assertAttemptStatus(status: string): asserts status is AttemptStatus {
  if (!validAttemptStatuses.has(status)) {
    throw new Error(`Invalid attempt status: ${status}`);
  }
}

function parseTimestamp(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }

  return date;
}
