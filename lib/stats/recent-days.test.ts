import { describe, expect, it } from "vitest";

import { fillRecentDays } from "./recent-days";

describe("fillRecentDays", () => {
  it("returns a fixed window ending at the end date with gaps zero-filled", () => {
    const days = fillRecentDays(
      [{ date: "2026-06-10", value: 5 }],
      3,
      (date) => ({ date, value: 0 }),
      new Date("2026-06-12T12:00:00.000Z"),
    );

    expect(days).toEqual([
      { date: "2026-06-10", value: 5 },
      { date: "2026-06-11", value: 0 },
      { date: "2026-06-12", value: 0 },
    ]);
  });

  it("drops entries older than the window", () => {
    const days = fillRecentDays(
      [{ date: "2026-06-01", value: 5 }],
      2,
      (date) => ({ date, value: 0 }),
      new Date("2026-06-12T12:00:00.000Z"),
    );

    expect(days).toEqual([
      { date: "2026-06-11", value: 0 },
      { date: "2026-06-12", value: 0 },
    ]);
  });
});
