import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeetcodePracticeProgressClient } from "./leetcode-practice-progress-client";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";
import type { LeetcodeCatalog } from "@/lib/leetcode/catalog";

const authState = vi.hoisted(() => ({
  status: "signed-out" as "loading" | "signed-in" | "signed-out" | "unavailable",
  user: null as { uid: string } | null,
}));
const getIdToken = vi.hoisted(() => vi.fn(async () => null));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    status: authState.status,
    user: authState.user,
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

const patternProblems: LeetcodeProblemRow[] = [
  {
    number: "11",
    title: "Container With Most Water",
    difficulty: LeetcodeProblemDifficultyLabel.Easy,
    pattern: "Two Pointer",
    subPattern: "Converging",
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    estimatedMinutes: 30,
  },
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

const catalog = catalogFromProblems(problems);
const patternCatalog = catalogFromProblems(patternProblems);

describe("LeetcodePracticeProgressClient", () => {
  beforeEach(() => {
    authState.status = "signed-out";
    authState.user = null;

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

    render(<LeetcodePracticeProgressClient catalog={catalog} query="" />);

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

    render(<LeetcodePracticeProgressClient catalog={catalog} query="" />);

    const progressButton = await screen.findByRole("button", {
      name: /In progress · 1 attempts/,
    });
    fireEvent.click(progressButton);

    expect(await screen.findByText("Time ran out")).toBeInTheDocument();
  });

  it("fetches signed-in attempts by problem id", async () => {
    authState.status = "signed-in";
    authState.user = { uid: "firebase-user-123" };
    getIdToken.mockResolvedValue("id-token-123");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ attempts: [] }),
      })),
    );

    render(<LeetcodePracticeProgressClient catalog={catalog} query="" />);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/leetcode/attempts?problemId=102",
        expect.objectContaining({
          cache: "no-store",
          headers: { authorization: "Bearer id-token-123" },
        }),
      ),
    );
  });

  it("selects major patterns without navigating the document", async () => {
    window.history.pushState(null, "", "/leetcode/allproblems");
    const pushState = vi.spyOn(window.history, "pushState");

    render(<LeetcodePracticeProgressClient catalog={patternCatalog} query="" />);

    expect(screen.getByRole("row", { name: /Container With Most Water/ })).toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Converging 1/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Trees 1/ }));

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "/leetcode/allproblems?pattern=Trees",
    );
    expect(
      screen.queryByRole("row", { name: /Container With Most Water/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();
  });

  it("clears the server-provided search query from the table controls", () => {
    window.history.pushState(null, "", "/leetcode/allproblems?q=tree");

    render(<LeetcodePracticeProgressClient catalog={patternCatalog} query="tree" />);

    expect(
      screen.queryByRole("row", { name: /Container With Most Water/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(window.location.search).toBe("");
    expect(
      screen.getByRole("row", { name: /Container With Most Water/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();
  });
});

function catalogFromProblems(problems: LeetcodeProblemRow[]): LeetcodeCatalog {
  const catalogProblems = new Map<number, LeetcodeProblemRow[]>();
  const patternCounts = new Map<string, { count: number }>();
  const index = new Map<
    string,
    {
      subPatterns: Map<string, { name: string; problemIndexes: number[] }>;
      problemIndexes: number[];
    }
  >();

  problems.forEach((problem, problemIndex) => {
    catalogProblems.set(problemIndex, [problem]);
    patternCounts.set(problem.pattern, {
      count: (patternCounts.get(problem.pattern)?.count ?? 0) + 1,
    });
    patternCounts.set(problem.subPattern, {
      count: (patternCounts.get(problem.subPattern)?.count ?? 0) + 1,
    });

    const pattern = index.get(problem.pattern) ?? {
      subPatterns: new Map<string, { name: string; problemIndexes: number[] }>(),
      problemIndexes: [],
    };
    const subPattern = pattern.subPatterns.get(problem.subPattern) ?? {
      name: problem.subPattern,
      problemIndexes: [],
    };

    pattern.problemIndexes.push(problemIndex);
    subPattern.problemIndexes.push(problemIndex);
    pattern.subPatterns.set(problem.subPattern, subPattern);
    index.set(problem.pattern, pattern);
  });

  return {
    problems: catalogProblems,
    patternCounts,
    index,
  };
}
