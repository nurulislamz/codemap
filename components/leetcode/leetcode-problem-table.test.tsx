import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeetcodeProblemTable } from "./leetcode-problem-table";
import {
  LeetcodeProblemDifficultyLabel,
  type LeetcodeAttemptRow,
  type LeetcodeProblemProgressRow,
} from "@/lib/leetcode/types";

const authState = vi.hoisted(() => ({
  status: "signed-out" as "loading" | "signed-in" | "signed-out" | "unavailable",
}));
const getIdToken = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    status: authState.status,
    user: null,
    getIdToken: authState.status === "signed-in" ? getIdToken : vi.fn(async () => null),
    signInWithGoogle: vi.fn(),
    signOutUser: vi.fn(),
  }),
}));

const problems: LeetcodeProblemProgressRow[] = [
  {
    number: "1",
    title: "Two Sum",
    difficulty: LeetcodeProblemDifficultyLabel.Easy,
    pattern: "Arrays",
    subPattern: "Hash Map",
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    estimatedMinutes: 15,
    solutionUrl: "https://neetcode.io/solutions/two-sum",
    solutionVideoUrl: "https://www.youtube.com/watch?v=KLlXCFG5TnA",
    isCompleted: true,
    lastAttemptedAt: "2026-04-30T10:10:00.000Z",
    attemptCount: 1,
    bestDurationSeconds: 480,
  },
  {
    number: "102",
    title: "Binary Tree Level Order Traversal",
    difficulty: LeetcodeProblemDifficultyLabel.Medium,
    pattern: "Trees",
    subPattern: "Breadth First Search",
    leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    estimatedMinutes: 25,
    isCompleted: false,
    lastAttemptedAt: null,
    attemptCount: 0,
    bestDurationSeconds: null,
  },
  {
    number: "76",
    title: "Minimum Window Substring",
    difficulty: LeetcodeProblemDifficultyLabel.Hard,
    pattern: "Sliding Window",
    subPattern: "Variable Window",
    leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/",
    estimatedMinutes: 35,
    isCompleted: false,
    lastAttemptedAt: "2026-04-29T09:00:00.000Z",
    attemptCount: 1,
    bestDurationSeconds: null,
  },
];

const attempts: LeetcodeAttemptRow[] = [
  {
    attemptId: "attempt-1",
    problemId: "1",
    problemTitle: "Two Sum",
    isSuccessful: true,
    startedAt: "2026-04-30T10:00:00.000Z",
    endedAt: "2026-04-30T10:10:00.000Z",
    durationSeconds: 480,
    notes: "Used hash map",
  },
  {
    attemptId: "attempt-3",
    problemId: "102",
    problemTitle: "Binary Tree Level Order Traversal",
    isSuccessful: false,
    startedAt: "2026-04-28T08:30:00.000Z",
    endedAt: "2026-04-28T08:45:00.000Z",
    durationSeconds: 900,
    notes: "Review BFS queue boundaries",
  },
  {
    attemptId: "attempt-2",
    problemId: "76",
    problemTitle: "Minimum Window Substring",
    isSuccessful: false,
    startedAt: "2026-04-29T08:30:00.000Z",
    endedAt: "2026-04-29T09:00:00.000Z",
    durationSeconds: 1800,
    failureReason: "Time Limit Exceeded",
  },
];

describe("LeetcodeProblemTable", () => {
  beforeEach(() => {
    authState.status = "signed-out";
    getIdToken.mockReset();

    const storage = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses the controlled top search query to filter rows", () => {
    render(
      <LeetcodeProblemTable
        problems={problems}
        attempts={attempts}
        searchQuery="tree"
        onSearchQueryChange={() => undefined}
      />,
    );

    expect(screen.getByRole("row", { name: /Binary Tree Level Order Traversal/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Two Sum/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Minimum Window Substring/ })).not.toBeInTheDocument();
  });

  it("sorts problems by easy to hard by default", () => {
    render(
      <LeetcodeProblemTable
        problems={[problems[2], problems[1], problems[0]]}
        attempts={attempts}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);

    expect(rows[0]).toHaveTextContent("Two Sum");
    expect(rows[1]).toHaveTextContent("Binary Tree Level Order Traversal");
    expect(rows[2]).toHaveTextContent("Minimum Window Substring");
  });

  it("filters by difficulty and clears filters", () => {
    render(<LeetcodeProblemTable problems={problems} attempts={attempts} />);

    fireEvent.click(screen.getByRole("button", { name: /All difficulties/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Easy" }));

    expect(screen.getByRole("row", { name: /Two Sum/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Binary Tree Level Order Traversal/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByRole("row", { name: /Binary Tree Level Order Traversal/ })).toBeInTheDocument();
  });

  it("filters video resources and expands attempt history", () => {
    render(<LeetcodeProblemTable problems={problems} attempts={attempts} />);

    const hasVideo = screen.getByRole("button", { name: /Has video/ });

    expect(hasVideo).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(hasVideo);
    expect(hasVideo).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("row", { name: /Two Sum/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Binary Tree Level Order Traversal/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Completed · 1 attempts/ }));

    const history = screen.getByRole("heading", { name: "Attempt History" }).closest("td");

    expect(history).not.toBeNull();
    expect(within(history as HTMLElement).getByText("Accepted")).toBeInTheDocument();
    expect(within(history as HTMLElement).getByText("8:00")).toBeInTheDocument();
  });

  it("opens the attempt overlay first, then starts the timer from inside it", async () => {
    vi.useFakeTimers();
    const openedTab = { location: { href: "" } } as unknown as Window;
    const windowOpen = vi.spyOn(window, "open").mockReturnValue(openedTab);

    render(<LeetcodeProblemTable problems={problems} attempts={attempts} />);

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });
    const startButton = within(binaryTreeRow).getByRole("button", { name: "Start" });

    expect(startButton).not.toHaveAttribute("href");
    expect(startButton).toHaveClass("cursor-pointer");

    fireEvent.click(startButton);

    expect(windowOpen).not.toHaveBeenCalled();
    expect(screen.getByText("Ready to start")).toBeInTheDocument();
    expect(screen.queryByText("Failure notes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start timer" })).toHaveClass("cursor-pointer");
    expect(screen.getByRole("button", { name: "Show last notes" })).toHaveClass("cursor-pointer");

    fireEvent.click(screen.getByRole("button", { name: "Show last notes" }));
    expect(screen.getByText("Review BFS queue boundaries")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));

    expect(windowOpen).toHaveBeenCalledWith("about:blank", "_blank");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(openedTab.location.href).toBe(
      "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    );
    expect(
      screen.getByRole("dialog", {
        name: /Binary Tree Level Order Traversal/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Attempt running")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    const stoppedAt = screen.getByLabelText("Time remaining").textContent;

    fireEvent.click(screen.getByRole("button", { name: "Finish attempt" }));

    expect(screen.getByText("Record attempt")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
      "Review BFS queue boundaries",
    );

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByLabelText("Time remaining")).toHaveTextContent(stoppedAt ?? "");
  });

  it("closes the attempt overlay when clicking the backdrop", () => {
    render(<LeetcodeProblemTable problems={problems} attempts={attempts} />);

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });

    fireEvent.click(within(binaryTreeRow).getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("dialog", { name: /Binary Tree Level Order Traversal/ }));

    expect(
      screen.queryByRole("dialog", { name: /Binary Tree Level Order Traversal/ }),
    ).not.toBeInTheDocument();
  });

  it("saves attempts locally when the user is signed out", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "open").mockReturnValue({
      location: { href: "" },
    } as unknown as Window);
    const saveAttemptAction = vi.fn();
    const onAttemptSaved = vi.fn();

    render(
      <LeetcodeProblemTable
        problems={problems}
        attempts={attempts}
        saveAttemptAction={saveAttemptAction}
        onAttemptSaved={onAttemptSaved}
      />,
    );

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });

    fireEvent.click(within(binaryTreeRow).getByRole("button", { name: "Start" }));
    expect(screen.getByText(/Attempts will save to this browser only/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish attempt" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Notes" }), {
      target: { value: "Saved locally" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save attempt" }));

    const savedAttempts = JSON.parse(
      window.localStorage.getItem("codemap.leetcodeAttempts.v1") ?? "[]",
    );

    expect(saveAttemptAction).not.toHaveBeenCalled();
    expect(onAttemptSaved).toHaveBeenCalledOnce();
    expect(savedAttempts[0]).toMatchObject({
      problemId: "102",
      problemTitle: "Binary Tree Level Order Traversal",
      notes: "Saved locally",
      isSuccessful: true,
    });
  });

  it("defaults the saved result to time ran out when the timer expires", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "open").mockReturnValue({
      location: { href: "" },
    } as unknown as Window);

    render(<LeetcodeProblemTable problems={problems} attempts={attempts} />);

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });

    fireEvent.click(within(binaryTreeRow).getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(screen.getByRole("radio", { name: "Time ran out" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Save attempt" }));

    const savedAttempts = JSON.parse(
      window.localStorage.getItem("codemap.leetcodeAttempts.v1") ?? "[]",
    );

    expect(savedAttempts[0]).toMatchObject({
      problemId: "102",
      status: "timed_out",
      isSuccessful: false,
    });
  });

  it("sends the current Firebase ID token when the signed-in user saves an attempt", async () => {
    vi.useFakeTimers();
    authState.status = "signed-in";
    getIdToken.mockResolvedValueOnce("firebase-id-token");
    vi.spyOn(window, "open").mockReturnValue({
      location: { href: "" },
    } as unknown as Window);
    const saveAttemptAction = vi.fn().mockResolvedValue(undefined);

    render(
      <LeetcodeProblemTable
        problems={problems}
        attempts={attempts}
        saveAttemptAction={saveAttemptAction}
      />,
    );

    const binaryTreeRow = screen.getByRole("row", {
      name: /Binary Tree Level Order Traversal/,
    });

    fireEvent.click(within(binaryTreeRow).getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish attempt" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Notes" }), {
      target: { value: "Saved remotely" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save attempt" }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getIdToken).toHaveBeenCalled();
    expect(saveAttemptAction).toHaveBeenCalledWith(
      expect.objectContaining({
        problemId: "102",
        notes: "Saved remotely",
        idToken: "firebase-id-token",
      }),
    );
    expect(window.localStorage.getItem("codemap.leetcodeAttempts.v1")).toBeNull();
  });
});
