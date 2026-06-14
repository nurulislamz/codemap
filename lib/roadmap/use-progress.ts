"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  readLocalProgress,
  type RoadmapTopicProgress,
} from "@/lib/roadmap/progress-shared";

type ProgressResponse = {
  progress?: RoadmapTopicProgress | null;
};

type LearnedMapResponse = {
  learned?: Record<string, boolean>;
};

async function fetchJson<T>(
  url: string,
  idToken: string | null,
  signal: AbortSignal,
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
      signal,
    });

    if (!response.ok) {
      console.warn(`Roadmap progress request failed: ${response.status} ${url}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (!signal.aborted) {
      console.warn("Roadmap progress request failed", error);
    }
    return null;
  }
}

/**
 * Loads saved progress for one topic: Firestore (via API) when signed in,
 * localStorage when signed out. Returns null until something is loaded.
 */
export function useRoadmapTopicProgress(
  roadmapSlug: string,
  topicSlug: string,
  initialProgress: RoadmapTopicProgress | null = null,
): RoadmapTopicProgress | null {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    if (authStatus !== "signed-in" || !user) {
      // Defer off the synchronous effect body to avoid a cascading render.
      const timeoutId = window.setTimeout(
        () => setProgress(readLocalProgress(roadmapSlug, topicSlug)),
        0,
      );
      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();

    async function loadProgress() {
      const idToken = await getIdToken();
      const data = await fetchJson<ProgressResponse>(
        `/api/roadmap/progress?roadmap=${encodeURIComponent(roadmapSlug)}&topic=${encodeURIComponent(topicSlug)}`,
        idToken,
        controller.signal,
      );

      if (data?.progress && !controller.signal.aborted) {
        setProgress(data.progress);
      }
    }

    void loadProgress();
    return () => controller.abort();
  }, [authStatus, getIdToken, roadmapSlug, topicSlug, user]);

  return progress;
}

/**
 * Loads the learned map for a whole roadmap: Firestore (via API) when signed
 * in, localStorage when signed out. Seeds from the server-computed map so the
 * first paint matches server-rendered stats.
 */
export function useRoadmapLearnedMap(
  roadmapSlug: string,
  topics: ReadonlyArray<{ slug: string }>,
  initialLearned: Record<string, boolean> = {},
) {
  const { status: authStatus, user, getIdToken } = useAuth();
  const [learnedByTopic, setLearnedByTopic] =
    useState<Record<string, boolean>>(initialLearned);

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    if (authStatus !== "signed-in" || !user) {
      // Defer off the synchronous effect body to avoid a cascading render.
      const timeoutId = window.setTimeout(() => {
        const learned: Record<string, boolean> = {};

        topics.forEach((topic) => {
          const saved = readLocalProgress(roadmapSlug, topic.slug);
          if (saved) {
            learned[topic.slug] = Boolean(saved.learned);
          }
        });

        setLearnedByTopic(learned);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();

    async function loadLearned() {
      const idToken = await getIdToken();
      const data = await fetchJson<LearnedMapResponse>(
        `/api/roadmap/progress-map?roadmap=${encodeURIComponent(roadmapSlug)}`,
        idToken,
        controller.signal,
      );

      if (data && !controller.signal.aborted) {
        setLearnedByTopic(data.learned ?? {});
      }
    }

    void loadLearned();
    return () => controller.abort();
  }, [authStatus, getIdToken, roadmapSlug, topics, user]);

  const markSaved = useCallback((progress: RoadmapTopicProgress) => {
    setLearnedByTopic((current) => ({
      ...current,
      [progress.topicSlug]: progress.learned,
    }));
  }, []);

  return { learnedByTopic, markSaved };
}
