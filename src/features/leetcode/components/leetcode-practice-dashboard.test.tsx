import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeetcodePracticeDashboard } from "./leetcode-practice-dashboard";
import type { LeetcodeProblemRow } from "../types";

const problems: LeetcodeProblemRow[] = [
  {
    number: "11",
    title: "Container With Most Water",
    difficulty: "medium",
    pattern: "Two Pointer",
    subPattern: "Converging",
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    estimatedMinutes: 30,
    solutionUrl: "https://neetcode.io/solutions/container-with-most-water",
    solutionVideoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
    isCompleted: false,
    lastAttemptedAt: null,
    attemptCount: 0,
    bestDurationSeconds: null,
  },
  {
    number: "3",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    pattern: "Sliding Window",
    subPattern: "Variable Window",
    leetcodeUrl:
      "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    estimatedMinutes: 30,
    isCompleted: true,
    lastAttemptedAt: "2026-04-30T12:00:00.000Z",
    attemptCount: 2,
    bestDurationSeconds: 960,
  },
];

describe("LeetcodePracticeDashboard", () => {
  it("uses the top search and keeps pattern filters in the table toolbar", () => {
    render(<LeetcodePracticeDashboard problems={problems} attempts={[]} />);

    expect(
      screen.queryByRole("heading", { name: "Two Pointer Problems" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Filter patterns")).toBeInTheDocument();
    expect(screen.queryByText("Minor pattern")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /All Problems 2/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /11 Container With Most Water/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /All Problems 2/ }));

    fireEvent.change(screen.getByPlaceholderText("Search problems..."), {
      target: { value: "longest" },
    });

    expect(
      screen.getByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /11 Container With Most Water/ }),
    ).not.toBeInTheDocument();
  });
});
