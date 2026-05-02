import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PageSkeleton,
  SkeletonBlock,
  SkeletonPanel,
  SkeletonText,
} from "./skeleton";

describe("skeleton primitives", () => {
  it("renders an accessible page-level loading region with reusable blocks", () => {
    render(
      <PageSkeleton label="Loading stats">
        <SkeletonPanel>
          <SkeletonText lines={3} />
          <SkeletonBlock className="h-10 w-32" />
        </SkeletonPanel>
      </PageSkeleton>,
    );

    const status = screen.getByRole("status", { name: "Loading stats" });

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading stats")).toHaveClass("sr-only");
    expect(status.querySelectorAll("[data-slot='skeleton-line']")).toHaveLength(3);
    expect(status.querySelector("[data-slot='skeleton-panel']")).toBeInTheDocument();
    expect(status.querySelector("[data-slot='skeleton-block']")).toBeInTheDocument();
  });
});
