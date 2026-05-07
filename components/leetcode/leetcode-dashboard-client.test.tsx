import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LeetcodeDashboardProblemTableClient, type LeetcodeDashboardProblemRow } from "./leetcode-dashboard-client";
import { LeetcodeProblemDifficultyLabel } from "@/lib/leetcode/types";

const problems: LeetcodeDashboardProblemRow[] = [
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
    actionLabel: "Start",
    difficultyClassName: "border-[#1d7452] bg-[#123a32] text-[#38e68a]",
    lastNotes: null,
    statusClassName: "border-[#334258] bg-[#172233] text-slate-300",
    statusLabel: "Not Started",
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
    actionLabel: "Start",
    difficultyClassName: "border-[#1d7452] bg-[#123a32] text-[#38e68a]",
    lastNotes: null,
    statusClassName: "border-[#334258] bg-[#172233] text-slate-300",
    statusLabel: "Not Started",
  },
];

describe("LeetcodeDashboardProblemTableClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders dashboard rows", () => {
    render(
      <AuthProvider>
        <LeetcodeDashboardProblemTableClient
          problems={problems}
          attempts={[]}
        />
      </AuthProvider>,
    );

    expect(screen.getByText("Today's Problems")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Binary Tree Level Order Traversal/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Longest Substring Without Repeating Characters/ })).toBeInTheDocument();
  });

  it("opens the attempt overlay before starting a dashboard attempt", () => {
    const openedTab = { location: { href: "" } } as unknown as Window;
    const windowOpen = vi.spyOn(window, "open").mockReturnValue(openedTab);

    render(
      <AuthProvider>
        <LeetcodeDashboardProblemTableClient
          problems={problems}
          attempts={[]}
        />
      </AuthProvider>,
    );

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });
    const startButton = within(binaryTreeRow).getByRole("button", { name: "Start" });

    expect(startButton).not.toHaveAttribute("href");
    expect(startButton).toHaveClass("cursor-pointer");

    fireEvent.click(startButton);

    expect(windowOpen).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /Binary Tree Level Order Traversal/ })).toBeInTheDocument();
    expect(screen.getByText("Ready to start")).toBeInTheDocument();
    expect(screen.queryByText("Failure notes")).not.toBeInTheDocument();
  });
});
