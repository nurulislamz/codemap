import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LeetcodeDashboardClient } from "./leetcode-dashboard-client";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeAttemptRow,
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

const attempts: LeetcodeAttemptRow[] = [
  {
    attemptId: "attempt-1",
    problemId: "121",
    problemTitle: "Best Time to Buy and Sell Stock",
    isSuccessful: true,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 600,
  },
];

describe("LeetcodeDashboardClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a today-focused dashboard with stats, table rows, and suggestions", () => {
    render(
      <AuthProvider>
        <LeetcodeDashboardClient problems={problems} attempts={attempts} />
      </AuthProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Problems for Today" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Due Today")).toBeInTheDocument();
    expect(screen.getByText("Today's Problems")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /1\. Longest Substring/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suggested Problems" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today's Progress" })).toBeInTheDocument();

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
        <LeetcodeDashboardClient problems={problems} attempts={attempts} />
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
