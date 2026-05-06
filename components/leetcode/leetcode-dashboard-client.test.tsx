import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import {
  LeetcodeDashboardProblemTableClient,
  type LeetcodeDashboardDifficultyFilterOption,
  type LeetcodeDashboardProblemRow,
} from "./leetcode-dashboard-client";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeProblemProgressRow,
} from "@/lib/leetcode/types";

const problems: LeetcodeProblemProgressRow[] = [
  {
    number: "3",
    title: "Longest Substring Without Repeating Characters",
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Sliding Window",
    subPattern: "Variable Window",
    leetcodeUrl:
      "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    estimatedMinutes: 25,
    isCompleted: false,
    lastAttemptedAt: new Date().toISOString(),
    attemptCount: 1,
    bestDurationSeconds: null,
  },
  {
    number: "102",
    title: "Binary Tree Level Order Traversal",
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Trees",
    subPattern: "Breadth First Search",
    leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    estimatedMinutes: 20,
    isCompleted: false,
    lastAttemptedAt: null,
    attemptCount: 0,
    bestDurationSeconds: null,
  },
  {
    number: "121",
    title: "Best Time to Buy and Sell Stock",
    difficulty: LeetcodeProblemDifficultyLabel.Easy,
    pattern: "Arrays",
    subPattern: "Kadane",
    leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    estimatedMinutes: 15,
    isCompleted: true,
    lastAttemptedAt: new Date().toISOString(),
    attemptCount: 1,
    bestDurationSeconds: 600,
  },
];

const dashboardProblems: LeetcodeDashboardProblemRow[] = problems.map((problem) => ({
  ...problem,
  actionLabel: problem.attemptCount > 0 && !problem.isCompleted ? "Resume" : "Start",
  difficultyClassName: "border-test",
  lastNotes: null,
  statusClassName: "border-test",
  statusLabel: problem.isCompleted
    ? "Review"
    : problem.attemptCount > 0
      ? "In Progress"
      : "Not Started",
}));

const difficultyFilters: LeetcodeDashboardDifficultyFilterOption[] = [
  { label: "All", selectedClassName: "border-test", value: "all" },
  {
    label: "Easy",
    selectedClassName: "border-test",
    value: LeetcodeProblemDifficultyLabel.Easy,
  },
  {
    label: "Medium",
    selectedClassName: "border-test",
    value: LeetcodeProblemDifficultyLabel.Medium,
  },
  {
    label: "Hard",
    selectedClassName: "border-test",
    value: LeetcodeProblemDifficultyLabel.Hard,
  },
];

describe("LeetcodeDashboardProblemTableClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a today-focused dashboard with stats, table rows, and suggestions", () => {
    render(
      <AuthProvider>
        <LeetcodeDashboardProblemTableClient
          difficultyFilters={difficultyFilters}
          problems={dashboardProblems}
        />
      </AuthProvider>,
    );

    expect(screen.getByText("Today's Problems")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /1\. Longest Substring/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Easy" }));

    expect(screen.getByRole("row", { name: /Best Time to Buy and Sell Stock/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Binary Tree Level Order Traversal/ }),
    ).not.toBeInTheDocument();
  });

  it("opens the attempt overlay before starting a dashboard attempt", () => {
    const openedTab = { location: { href: "" } } as unknown as Window;
    const windowOpen = vi.spyOn(window, "open").mockReturnValue(openedTab);

    render(
      <AuthProvider>
        <LeetcodeDashboardProblemTableClient
          difficultyFilters={difficultyFilters}
          problems={dashboardProblems}
        />
      </AuthProvider>,
    );

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });
    const startButton = within(binaryTreeRow).getByRole("button", { name: "Start" });

    expect(startButton).not.toHaveAttribute("href");

    fireEvent.click(startButton);

    expect(windowOpen).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready to start")).toBeInTheDocument();
  });
});
