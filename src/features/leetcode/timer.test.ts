import { describe, expect, it } from "vitest";
import { calculateAttemptResult } from "./timer";

describe("calculateAttemptResult", () => {
  it("uses server timestamps to calculate elapsed seconds and overtime", () => {
    const result = calculateAttemptResult({
      startedAt: "2026-04-26T10:00:00.000Z",
      endedAt: "2026-04-26T10:31:30.000Z",
      timeLimitMinutes: 30,
      requestedStatus: "completed",
    });

    expect(result.elapsedSeconds).toBe(1890);
    expect(result.isOverTime).toBe(true);
    expect(result.status).toBe("completed");
  });

  it("guards against negative elapsed durations and preserves requested status", () => {
    const result = calculateAttemptResult({
      startedAt: "2026-04-26T10:10:00.000Z",
      endedAt: "2026-04-26T10:00:00.000Z",
      timeLimitMinutes: 30,
      requestedStatus: "failed",
    });

    expect(result).toEqual({
      elapsedSeconds: 0,
      isOverTime: false,
      status: "failed",
    });
  });
});
