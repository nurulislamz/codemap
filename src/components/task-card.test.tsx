import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCard } from "./task-card";

describe("TaskCard", () => {
  it("renders track, title, and linked action", () => {
    render(
      <TaskCard
        track="LeetCode"
        title="Two Sum pattern review"
        actionHref="/dashboard/leetcode"
        actionLabel="Start practice"
      />,
    );

    expect(screen.getByText("LeetCode")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two Sum pattern review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start practice" })).toHaveAttribute(
      "href",
      "/dashboard/leetcode",
    );
  });
});
