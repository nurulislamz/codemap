import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "./dashboard/page";
import SystemDesignPage from "./system-design/page";

describe("coming soon placeholder pages", () => {
  it.each([
    ["Home", DashboardPage],
    ["System Design", SystemDesignPage],
  ])("renders the %s page as a coming soon placeholder", async (title, Page) => {
    render(await Page());

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText("To be implemented soon.")).toBeInTheDocument();
  });
});
