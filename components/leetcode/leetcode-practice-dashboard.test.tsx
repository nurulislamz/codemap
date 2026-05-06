import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LeetcodePracticeDashboard } from "./leetcode-practice-dashboard";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeProblemRow,
} from "@/lib/leetcode/types";

const problems: LeetcodeProblemRow[] = [
  {
    number: "11",
    title: "Container With Most Water",
    difficulty: LeetcodeProblemDifficultyLabel.Easy,
    pattern: "Two Pointer",
    subPattern: "Converging",
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    estimatedMinutes: 30,
    solutionUrl: "https://neetcode.io/solutions/container-with-most-water",
    solutionVideoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
  },
  {
    number: "3",
    title: "Longest Substring Without Repeating Characters",
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Sliding Window",
    subPattern: "Variable Window",
    leetcodeUrl:
      "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    estimatedMinutes: 30,
  },
];

const patterns = [
  {
    name: "Two Pointer",
    count: 1,
    subPatterns: [{ name: "Converging", count: 1 }],
  },
  {
    name: "Sliding Window",
    count: 1,
    subPatterns: [{ name: "Variable Window", count: 1 }],
  },
];

describe("LeetcodePracticeDashboard", () => {
  it("renders the selected pattern from server state and keeps pattern filters in the table toolbar", () => {
    render(
      <AuthProvider>
        <LeetcodePracticeDashboard
          problems={problems}
          patterns={patterns}
          selectedPattern="Two Pointer"
        />
      </AuthProvider>,
    );

    expect(
      screen.queryByRole("heading", { name: "Two Pointer Problems" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Filter patterns")).toBeInTheDocument();
    expect(screen.queryByText("Minor pattern")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /All Problems 2/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /11 Container With Most Water/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the search query from server state", () => {
    render(
      <AuthProvider>
        <LeetcodePracticeDashboard
          problems={problems}
          patterns={patterns}
          query="longest"
        />
      </AuthProvider>,
    );

    expect(
      screen.getByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /11 Container With Most Water/ }),
    ).not.toBeInTheDocument();
  });

  it("renders selected difficulty from server state and keeps difficulty in the URL when it changes", () => {
    window.history.pushState(null, "", "/leetcode/allproblems?difficulty=Easy");

    render(
      <AuthProvider>
        <LeetcodePracticeDashboard
          problems={problems}
          patterns={patterns}
          selectedDifficulty="Easy"
        />
      </AuthProvider>,
    );

    expect(screen.getByRole("row", { name: /11 Container With Most Water/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Easy/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Medium" }));

    expect(window.location.search).toBe("?difficulty=Medium");
    expect(
      screen.queryByRole("row", { name: /11 Container With Most Water/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("row", {
        name: /3 Longest Substring Without Repeating Characters/,
      }),
    ).toBeInTheDocument();
  });
});
