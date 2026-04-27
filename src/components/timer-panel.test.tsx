import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimerPanel } from "./timer-panel";

describe("TimerPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the problem title, time limit, and a client-side countdown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T10:00:00.000Z"));

    render(
      <TimerPanel
        problemTitle="Two Sum II - Input Array Is Sorted"
        startedAt="2026-04-26T10:00:00.000Z"
        timeLimitMinutes={30}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Two Sum II - Input Array Is Sorted",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("30 minute limit")).toBeInTheDocument();
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("30:00");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("29:59");
  });
});
