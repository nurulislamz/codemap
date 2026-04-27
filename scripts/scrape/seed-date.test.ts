import { describe, expect, it } from "vitest";

import { getSeedDate } from "./seed-date";

describe("getSeedDate", () => {
  it("uses the project seed date by default", () => {
    expect(getSeedDate({})).toBe("2026-04-26");
  });

  it("uses an explicit SEED_DATE when it is YYYY-MM-DD", () => {
    expect(getSeedDate({ SEED_DATE: "2026-05-12" })).toBe("2026-05-12");
  });

  it("rejects invalid explicit SEED_DATE values", () => {
    expect(() => getSeedDate({ SEED_DATE: "05/12/2026" })).toThrow(
      /SEED_DATE must use YYYY-MM-DD/,
    );
  });
});
