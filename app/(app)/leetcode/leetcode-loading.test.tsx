import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LeetcodeDashboardLoading from "./dashboard/loading";
import LeetcodeLoading from "./allproblems/loading";
import LeetcodeStatsLoading from "./stats/loading";

describe("LeetCode loading screens", () => {
  it.each([
    ["problem list", LeetcodeLoading, "Loading LeetCode problems"],
    ["dashboard", LeetcodeDashboardLoading, "Loading LeetCode dashboard"],
    ["stats", LeetcodeStatsLoading, "Loading LeetCode stats"],
  ])("renders the %s skeleton as an accessible busy region", (_, Loading, label) => {
    render(<Loading />);

    expect(screen.getByRole("status", { name: label })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getAllByTestId("leetcode-skeleton-stat")).toHaveLength(4);
  });
});
