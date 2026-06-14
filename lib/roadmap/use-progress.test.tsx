import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { writeLocalProgress } from "./progress-shared";
import { useRoadmapLearnedMap, useRoadmapTopicProgress } from "./use-progress";

const useAuth = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth,
}));

const fetchMock = vi.fn();

function signedIn() {
  useAuth.mockReturnValue({
    status: "signed-in",
    user: { uid: "firebase-user-123" },
    getIdToken: vi.fn().mockResolvedValue("id-token"),
  });
}

function signedOut() {
  useAuth.mockReturnValue({
    status: "signed-out",
    user: null,
    getIdToken: vi.fn().mockResolvedValue(null),
  });
}

function jsonResponse(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) };
}

describe("useRoadmapTopicProgress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("loads saved progress from the API when signed in", async () => {
    signedIn();
    const progress = {
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: true,
      notes: "HTTP notes",
      links: [],
    };
    fetchMock.mockResolvedValue(jsonResponse({ progress }));

    const { result } = renderHook(() =>
      useRoadmapTopicProgress("backend", "whatIsHttp"),
    );

    await waitFor(() => expect(result.current).toEqual(progress));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/roadmap/progress?roadmap=backend&topic=whatIsHttp",
      expect.objectContaining({
        headers: { authorization: "Bearer id-token" },
      }),
    );
  });

  it("loads saved progress from localStorage when signed out", async () => {
    signedOut();
    const progress = {
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: true,
      notes: "local notes",
      links: [],
    };
    writeLocalProgress(progress);

    const { result } = renderHook(() =>
      useRoadmapTopicProgress("backend", "whatIsHttp"),
    );

    await waitFor(() => expect(result.current).toEqual(progress));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the initial progress when the API request fails", async () => {
    signedIn();
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const initial = {
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: false,
      notes: "",
      links: [],
    };

    const { result } = renderHook(() =>
      useRoadmapTopicProgress("backend", "whatIsHttp", initial),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current).toEqual(initial);
  });
});

describe("useRoadmapLearnedMap", () => {
  const topics = [{ slug: "whatIsHttp" }, { slug: "restApis" }];

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("loads the learned map from the API when signed in", async () => {
    signedIn();
    fetchMock.mockResolvedValue(
      jsonResponse({ learned: { whatIsHttp: true } }),
    );

    const { result } = renderHook(() =>
      useRoadmapLearnedMap("backend", topics),
    );

    await waitFor(() =>
      expect(result.current.learnedByTopic).toEqual({ whatIsHttp: true }),
    );
  });

  it("builds the learned map from localStorage when signed out", async () => {
    signedOut();
    writeLocalProgress({
      roadmapSlug: "backend",
      topicSlug: "restApis",
      learned: true,
      notes: "",
      links: [],
    });

    const { result } = renderHook(() =>
      useRoadmapLearnedMap("backend", topics),
    );

    await waitFor(() =>
      expect(result.current.learnedByTopic).toEqual({ restApis: true }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("marks a topic learned after a save without refetching", async () => {
    signedOut();
    writeLocalProgress({
      roadmapSlug: "backend",
      topicSlug: "restApis",
      learned: true,
      notes: "",
      links: [],
    });

    const { result } = renderHook(() =>
      useRoadmapLearnedMap("backend", topics),
    );

    // Wait for the initial localStorage load before saving.
    await waitFor(() =>
      expect(result.current.learnedByTopic).toEqual({ restApis: true }),
    );

    act(() => {
      result.current.markSaved({
        roadmapSlug: "backend",
        topicSlug: "whatIsHttp",
        learned: true,
        notes: "",
        links: [],
      });
    });

    expect(result.current.learnedByTopic).toEqual({
      restApis: true,
      whatIsHttp: true,
    });
  });
});
