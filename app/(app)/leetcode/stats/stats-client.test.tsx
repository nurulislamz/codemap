import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeetcodeStatsClient } from "./stats-client";
import { LeetcodeProblemDifficultyLabel, type LeetcodeProblemRow } from "@/lib/leetcode/types";

const authState = vi.hoisted(() => ({
  status: "signed-out" as "loading" | "signed-in" | "signed-out" | "unavailable",
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    status: authState.status,
    user: null,
    getIdToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOutUser: vi.fn(),
  }),
}));

const problems: LeetcodeProblemRow[] = [
  {
    number: "1",
    title: "Two Sum",
    difficulty: LeetcodeProblemDifficultyLabel.Easy,
    pattern: "Hash Map",
    subPattern: "Lookup",
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    estimatedMinutes: 15,
  },
];

describe("LeetcodeStatsClient", () => {
  beforeEach(() => {
    authState.status = "signed-out";

    const storage = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
  });

  it("builds stats from local attempts for signed-out users", async () => {
    window.localStorage.setItem(
      "codemap.leetcodeAttempts.v1",
      JSON.stringify([
        {
          attemptId: "local-attempt-1",
          problemId: "1",
          problemTitle: "Two Sum",
          problemUrl: "https://leetcode.com/problems/two-sum/",
          status: "completed",
          startedAt: "2026-05-06T10:00:00.000Z",
          endedAt: "2026-05-06T10:10:00.000Z",
          notes: "Local solve",
          isSuccessful: true,
          durationSeconds: 600,
          savedAt: "2026-05-06T10:10:00.000Z",
        },
      ]),
    );

    render(<LeetcodeStatsClient problems={problems} initialAttempts={[]} />);

    expect(await screen.findByText("100% complete")).toBeInTheDocument();
    expect(screen.getByText("1/1 accepted")).toBeInTheDocument();
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
  });
});
