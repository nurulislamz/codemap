import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountdownTimer, TimerPanel } from "./timer-panel";

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

  it("can render as a reusable countdown with a custom label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T10:00:00.000Z"));

    render(
      <CountdownTimer
        label="Warmup remaining"
        startedAt="2026-04-26T09:59:30.000Z"
        timeLimitMinutes={1}
      />,
    );

    // The first real reading is deferred off the synchronous effect body via
    // setTimeout(0); flush it before asserting.
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByLabelText("Warmup remaining")).toHaveTextContent("0:30");
  });

  it("calls onComplete once the countdown reaches zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-26T10:00:00.000Z"));
    const onComplete = vi.fn();

    render(
      <CountdownTimer
        startedAt="2026-04-26T09:59:59.000Z"
        timeLimitMinutes={1 / 30}
        onComplete={onComplete}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText("Time remaining")).toHaveTextContent("0:00");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
