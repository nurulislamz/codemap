import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusSelect } from "./status-select";

describe("StatusSelect", () => {
  it("renders all learning states with an accessible name and selected default", () => {
    render(
      <StatusSelect
        ariaLabel="Internet status preview"
        defaultValue="learning"
        name="status"
      />,
    );

    expect(screen.getByRole("option", { name: "Not started" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Learning" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Reviewed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mastered" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Internet status preview" }),
    ).toHaveValue("learning");
  });

  it("can render as a disabled preview control before persistence is wired", () => {
    render(
      <StatusSelect
        ariaLabel="DNS status preview"
        defaultValue="not_started"
        disabled
        name="dns-status"
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "DNS status preview" }),
    ).toBeDisabled();
  });
});
