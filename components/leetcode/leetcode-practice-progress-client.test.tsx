import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeetcodePracticeProgressClient } from "./leetcode-practice-progress-client";
import { LeetcodeProblemDifficultyLabel, type LeetcodeProblemRow } from "@/lib/leetcode/types";

const authState = vi.hoisted(() => ({
  status: "signed-out" as "loading" | "signed-in" | "signed-out" | "unavailable",
}));
const getIdToken = vi.hoisted(() => vi.fn(async () => null));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    status: authState.status,
    user: null,
    getIdToken,
    signInWithGoogle: vi.fn(),
    signOutUser: vi.fn(),
  }),
}));

const problems: LeetcodeProblemRow[] = [
  {
    number: "102",
    title: "Binary Tree Level Order Traversal",
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Trees",
    subPattern: "Breadth First Search",
    leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    estimatedMinutes: 25,
  },
];

describe("LeetcodePracticeProgressClient", () => {
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

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("hydrates signed-out progress from locally saved attempts", async () => {
    window.localStorage.setItem(
      "codemap.leetcodeAttempts.v1",
      JSON.stringify([
        {
          attemptId: "local-attempt-1",
          problemId: "102",
          problemTitle: "Binary Tree Level Order Traversal",
          problemUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
          status: "completed",
          startedAt: "2026-05-06T10:00:00.000Z",
          endedAt: "2026-05-06T10:10:00.000Z",
          notes: "Local note",
          isSuccessful: true,
          durationSeconds: 600,
          savedAt: "2026-05-06T10:10:00.000Z",
        },
      ]),
    );

    render(<LeetcodePracticeProgressClient problems={problems} query="" />);

    expect(
      await screen.findByRole("button", { name: /Completed · 1 attempts/ }),
    ).toBeInTheDocument();
  });

  it("displays locally saved timed-out attempts as time ran out", async () => {
    window.localStorage.setItem(
      "codemap.leetcodeAttempts.v1",
      JSON.stringify([
        {
          attemptId: "local-attempt-1",
          problemId: "102",
          problemTitle: "Binary Tree Level Order Traversal",
          problemUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
          status: "timed_out",
          startedAt: "2026-05-06T10:00:00.000Z",
          endedAt: "2026-05-06T10:30:00.000Z",
          notes: "Ran out of time",
          isSuccessful: false,
          durationSeconds: 1800,
          savedAt: "2026-05-06T10:30:00.000Z",
        },
      ]),
    );

    render(<LeetcodePracticeProgressClient problems={problems} query="" />);

    const progressButton = await screen.findByRole("button", {
      name: /In progress · 1 attempts/,
    });
    fireEvent.click(progressButton);

    expect(await screen.findByText("Time ran out")).toBeInTheDocument();
  });
});
