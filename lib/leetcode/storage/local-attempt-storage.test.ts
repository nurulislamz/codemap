import { afterEach, describe, expect, it } from "vitest";

import {
  getLastUsedLeetcodeLanguage,
  saveLastUsedLeetcodeLanguage,
} from "./local-attempt-storage";

describe("last used leetcode language", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips the last used language", () => {
    saveLastUsedLeetcodeLanguage("TypeScript");

    expect(getLastUsedLeetcodeLanguage()).toBe("TypeScript");
  });

  it("returns null when nothing is saved", () => {
    expect(getLastUsedLeetcodeLanguage()).toBeNull();
  });

  it("ignores values that are not a known language", () => {
    window.localStorage.setItem("codemap.leetcodeLastLanguage.v1", "COBOL");

    expect(getLastUsedLeetcodeLanguage()).toBeNull();
  });
});
