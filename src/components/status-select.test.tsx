import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusSelect } from "./status-select";

describe("StatusSelect", () => {
  it("renders all learning states", () => {
    render(<StatusSelect name="status" defaultValue="not_started" />);

    expect(screen.getByRole("option", { name: "Not started" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Learning" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Reviewed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mastered" })).toBeInTheDocument();
  });
});
